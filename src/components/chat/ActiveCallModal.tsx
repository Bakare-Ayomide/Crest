import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Minimize2, Maximize2, ShieldCheck, RefreshCw, Sparkles, User } from 'lucide-react';
import { UserProfile } from '../../types';
import { triggerHaptic } from '../../lib/capacitor';

interface ActiveCallModalProps {
  callType: 'voice' | 'video';
  user: UserProfile;
  isIncoming?: boolean;
  onEndCall: (durationSeconds: number, status: 'completed' | 'missed' | 'declined') => void;
  onMinimize?: () => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  callType,
  user,
  isIncoming = false,
  onEndCall,
  onMinimize
}) => {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>(isIncoming ? 'ringing' : 'ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [hasCameraError, setHasCameraError] = useState(false);
  const [hasMicError, setHasMicError] = useState(false);
  
  // Real-time Mic Voice Activity Level (0-100)
  const [micLevel, setMicLevel] = useState(0);
  const [remoteSpeechLevel, setRemoteSpeechLevel] = useState(25);

  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const remoteSpeechTimerRef = useRef<any>(null);
  const ringAudioCtxRef = useRef<AudioContext | null>(null);

  // Bind video element safely whenever ref changes or stream updates
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    localVideoElementRef.current = node;
    if (node && localStreamRef.current) {
      node.srcObject = localStreamRef.current;
      node.play().catch(() => {});
    }
  }, []);

  // Play subtle ringing and connected sound effects via Web Audio API
  const playCallChime = (type: 'ring' | 'connected' | 'end') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'ring') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      } else if (type === 'connected') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === 'end') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, ctx.currentTime);
        osc.frequency.setValueAtTime(260, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Audio playback fallback
    }
  };

  // Initialize camera/mic MediaStream & Mic Volume Analyser
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Media devices not available');
        }

        const constraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: callType === 'video' ? {
            facingMode: cameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } : false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;

        if (localVideoElementRef.current && callType === 'video') {
          localVideoElementRef.current.srcObject = stream;
          localVideoElementRef.current.play().catch(() => {});
        }

        // Connect real-time Microphone Visualizer via Web Audio API Analyser
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.6;
            source.connect(analyser);
            analyserRef.current = analyser;

            const monitorMicVolume = () => {
              if (analyserRef.current && !isMuted) {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / dataArray.length;
                const normalized = Math.min(100, Math.round((avg / 128) * 100));
                setMicLevel(normalized);
              } else {
                setMicLevel(0);
              }
              animFrameRef.current = requestAnimationFrame(monitorMicVolume);
            };
            monitorMicVolume();
          }
        } catch (e) {
          console.warn('Microphone analyzer setup failed:', e);
        }

      } catch (err: any) {
        console.warn('Could not access live camera/mic:', err);
        if (callType === 'video') {
          setHasCameraError(true);
        }
        setHasMicError(true);
      }
    }

    initMedia();

    // Play ringing tone
    if (callState === 'ringing') {
      playCallChime('ring');
    }

    // If outgoing call, simulate match picking up after 2.5 seconds
    if (!isIncoming) {
      const ringTimer = setTimeout(() => {
        if (active) {
          setCallState('connected');
          playCallChime('connected');
          triggerHaptic('success');
        }
      }, 2400);

      return () => {
        active = false;
        clearTimeout(ringTimer);
      };
    }

    return () => {
      active = false;
    };
  }, [callType, cameraFacing]);

  // Duration timer & simulated remote speech cadence when connected
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Simulate remote voice cadence
      remoteSpeechTimerRef.current = setInterval(() => {
        const randLevel = isSpeakerOn ? Math.floor(Math.random() * 60) + 20 : 0;
        setRemoteSpeechLevel(randLevel);
      }, 300);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (remoteSpeechTimerRef.current) clearInterval(remoteSpeechTimerRef.current);
    };
  }, [callState, isSpeakerOn]);

  // Cleanup stream, audio context, animation frame on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (ringAudioCtxRef.current && ringAudioCtxRef.current.state !== 'closed') {
        ringAudioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleToggleMute = () => {
    triggerHaptic('light');
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !newMutedState;
      });
    }

    if (newMutedState) {
      setMicLevel(0);
    }
  };

  const handleToggleVideo = () => {
    triggerHaptic('light');
    const newVideoState = !isVideoEnabled;
    setIsVideoEnabled(newVideoState);

    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = newVideoState;
      });
    }
  };

  const handleToggleSpeaker = () => {
    triggerHaptic('light');
    setIsSpeakerOn(!isSpeakerOn);
  };

  const handleFlipCamera = async () => {
    triggerHaptic('light');
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(newFacing);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => t.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      localStreamRef.current = newStream;
      if (localVideoElementRef.current) {
        localVideoElementRef.current.srcObject = newStream;
        localVideoElementRef.current.play().catch(() => {});
      }
    } catch (e) {
      console.warn('Cannot flip camera:', e);
    }
  };

  const handleAcceptCall = () => {
    triggerHaptic('success');
    setCallState('connected');
    playCallChime('connected');
  };

  const handleDeclineCall = () => {
    triggerHaptic('heavy');
    playCallChime('end');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    onEndCall(0, 'declined');
  };

  const handleHangUp = () => {
    triggerHaptic('heavy');
    playCallChime('end');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    onEndCall(duration, duration > 0 ? 'completed' : 'missed');
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // FLOATING MINIMIZED WIDGET (Picture-in-picture)
  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-4 z-50 bg-[#141517] border border-rose-500/40 rounded-3xl p-3 shadow-2xl flex items-center gap-3 animate-in fade-in text-white select-none">
        <div className="relative">
          <img src={user.photos[0]} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-rose-500 animate-pulse" />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-black" />
        </div>
        <div className="text-left">
          <p className="font-bold text-xs">{user.name}</p>
          <p className="text-[10px] text-emerald-400 font-mono font-medium">
            {callState === 'connected' ? formatTimer(duration) : 'Connecting...'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300"
            title="Expand call"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleHangUp}
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            title="End call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // FULLSCREEN CALL INTERFACE
  return (
    <div className="fixed inset-0 z-50 bg-[#0d0e10] flex flex-col justify-between p-6 text-white select-none animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-gray-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>CREST HD • End-to-End Encrypted</span>
        </div>

        <button
          onClick={() => {
            setIsMinimized(true);
            onMinimize?.();
          }}
          className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-200 transition-colors"
          title="Minimize call"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Center Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 relative">
        {callType === 'video' ? (
          <div className="relative w-full max-w-sm h-96 rounded-3xl overflow-hidden bg-gray-950 shadow-2xl border border-white/10">
            {/* Remote Video Feed (Cinematic photo background with live speech reactivity) */}
            <img
              src={user.photos[0]}
              alt={user.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                remoteSpeechLevel > 30 ? 'brightness-105 scale-101' : 'brightness-95'
              }`}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />

            {/* Remote Caller Name Banner & Live Audio Waves */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>{user.name}</span>
                  {callState === 'connected' && remoteSpeechLevel > 20 && (
                    <span className="flex items-center gap-0.5">
                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    </span>
                  )}
                </h3>
                <p className="text-xs text-emerald-400 font-medium">
                  {callState === 'connected' ? `Live HD • ${formatTimer(duration)}` : 'Connecting video...'}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] text-gray-200 font-mono font-bold">1080p</span>
              </div>
            </div>

            {/* Local Video Picture-in-Picture Preview */}
            <div className="absolute top-4 right-4 w-28 h-38 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/40 bg-zinc-900 group">
              {isVideoEnabled && !hasCameraError ? (
                <video
                  ref={setVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-gray-400 gap-1">
                  <User className="w-8 h-8 text-gray-500" />
                  <span className="text-[9px] font-bold text-gray-400">Camera Off</span>
                </div>
              )}

              {/* Local Mic Voice Indicator on PiP */}
              {micLevel > 15 && !isMuted && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 rounded-full">
                  <Mic className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" />
                </div>
              )}

              {/* Flip camera button */}
              {isVideoEnabled && (
                <button
                  onClick={handleFlipCamera}
                  className="absolute bottom-1.5 right-1.5 p-1.5 bg-black/70 hover:bg-black/90 rounded-xl text-white transition-colors"
                  title="Flip camera"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Voice Call Centerpiece */
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <img
                src={user.photos[0]}
                alt={user.name}
                className={`w-32 h-32 rounded-full object-cover ring-4 ring-rose-500 shadow-2xl mx-auto transition-transform duration-200 ${
                  callState === 'connected' && remoteSpeechLevel > 30 ? 'scale-105' : ''
                }`}
              />
              {callState === 'ringing' && (
                <div className="absolute -inset-3 rounded-full border-2 border-rose-500/50 animate-ping" />
              )}
              {callState === 'connected' && (
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full ring-4 ring-[#0d0e10] flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-black">{user.name}</h2>
              <p className="text-sm text-gray-400 mt-1">
                {callState === 'ringing'
                  ? isIncoming ? 'Incoming Voice Call...' : 'Calling...'
                  : `Voice Call • ${formatTimer(duration)}`}
              </p>
            </div>

            {/* Live Audio Waveform & Voice Meter */}
            {callState === 'connected' && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-1.5 h-10">
                  {[35, 65, 95, 45, 80, 55, 75, 100, 60, 45, 90, 35].map((lvl, i) => {
                    const activeHeight = isMuted 
                      ? 15 
                      : Math.max(15, Math.min(100, Math.round((lvl * (Math.max(micLevel, 20) / 70)))));
                    return (
                      <div
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-75 ${
                          isMuted 
                            ? 'bg-white/20' 
                            : micLevel > 20 
                              ? 'bg-gradient-to-t from-emerald-500 to-teal-400' 
                              : 'bg-gradient-to-t from-rose-500 to-pink-400'
                        }`}
                        style={{ height: `${activeHeight}%` }}
                      />
                    );
                  })}
                </div>

                <span className="text-[11px] font-mono text-gray-400">
                  {isMuted ? 'Microphone Muted' : micLevel > 15 ? 'Speaking...' : 'Listening...'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-sm mx-auto z-20">
        {callState === 'ringing' && isIncoming ? (
          <div className="flex items-center justify-around gap-6 py-4">
            <button
              onClick={handleDeclineCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
              title="Decline"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <button
              onClick={handleAcceptCall}
              className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform animate-bounce"
              title="Accept"
            >
              <Phone className="w-7 h-7" />
            </button>
          </div>
        ) : (
          <div className="bg-[#181a1d]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex items-center justify-around gap-2 shadow-2xl">
            {/* Mic Toggle with Live Indicator */}
            <button
              onClick={handleToggleMute}
              className={`p-3.5 rounded-2xl transition-all relative ${
                isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              {!isMuted && micLevel > 20 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            {/* Video Toggle */}
            {callType === 'video' && (
              <button
                onClick={handleToggleVideo}
                className={`p-3.5 rounded-2xl transition-colors ${
                  !isVideoEnabled ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
            )}

            {/* Speaker Toggle */}
            <button
              onClick={handleToggleSpeaker}
              className={`p-3.5 rounded-2xl transition-colors ${
                !isSpeakerOn ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isSpeakerOn ? 'Loudspeaker On' : 'Earpiece / Muted'}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleHangUp}
              className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-transform"
              title="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
