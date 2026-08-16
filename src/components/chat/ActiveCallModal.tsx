import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Minimize2, Maximize2, ShieldCheck, RefreshCw, AlertCircle, ArrowLeftRight, Check } from 'lucide-react';
import { UserProfile } from '../../types';
import { triggerHaptic, showNativeToast } from '../../lib/capacitor';

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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [isSwappedView, setIsSwappedView] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const ringToneOscRef = useRef<any>(null);

  // Sound generator for call ringtone & audio feedback
  const playRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const playToneBeep = () => {
        if (ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.2);
      };

      playToneBeep();
      const ringInterval = setInterval(playToneBeep, 2400);
      ringToneOscRef.current = ringInterval;
    } catch {}
  };

  const stopRingtone = () => {
    if (ringToneOscRef.current) {
      clearInterval(ringToneOscRef.current);
      ringToneOscRef.current = null;
    }
  };

  // Play connection sound
  const playConnectedChime = () => {
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  };

  // Initialize camera and microphone
  useEffect(() => {
    let active = true;

    async function initMedia() {
      setCameraError(null);
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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

          if (localVideoRef.current && callType === 'video') {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }

          // Live audio meter analysis
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = audioContextRef.current || new AudioCtx();
              audioContextRef.current = ctx;
              const source = ctx.createMediaStreamSource(stream);
              const analyser = ctx.createAnalyser();
              analyser.fftSize = 32;
              analyser.smoothingTimeConstant = 0.5;
              source.connect(analyser);
              micAnalyserRef.current = analyser;

              const monitorAudioLevel = () => {
                if (micAnalyserRef.current && !isMuted) {
                  const data = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
                  micAnalyserRef.current.getByteFrequencyData(data);
                  let sum = 0;
                  for (let i = 0; i < data.length; i++) sum += data[i];
                  const avg = sum / data.length;
                  setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
                } else {
                  setMicLevel(0);
                }
                animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
              };
              monitorAudioLevel();
            }
          } catch {}
        }
      } catch (err: any) {
        console.warn('Camera/Mic permission warning:', err);
        setCameraError(err.message || 'Camera or microphone access denied');
      }
    }

    initMedia();

    // Ringing state simulation
    if (!isIncoming) {
      playRingtone();
      const ringTimer = setTimeout(() => {
        if (active) {
          stopRingtone();
          playConnectedChime();
          setCallState('connected');
          triggerHaptic('success');
        }
      }, 2500);

      return () => {
        active = false;
        clearTimeout(ringTimer);
        stopRingtone();
      };
    }

    return () => {
      active = false;
      stopRingtone();
    };
  }, [callType, cameraFacing]);

  // Duration timer when connected
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRingtone();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch {}
      }
    };
  }, []);

  const handleToggleMute = () => {
    triggerHaptic('light');
    const newMuteState = !isMuted;
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(t => {
        t.enabled = !newMuteState;
      });
    }
    setIsMuted(newMuteState);
  };

  const handleToggleVideo = () => {
    triggerHaptic('light');
    const nextVideoState = !isVideoEnabled;
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(t => {
        t.enabled = nextVideoState;
      });
    }
    setIsVideoEnabled(nextVideoState);
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
        audio: true,
        video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      localStreamRef.current = newStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
        localVideoRef.current.play().catch(() => {});
      }
    } catch (e) {
      console.warn('Cannot flip camera:', e);
    }
  };

  const handleToggleSpeaker = () => {
    triggerHaptic('light');
    setIsSpeakerOn(prev => !prev);
  };

  const handleAcceptCall = () => {
    stopRingtone();
    playConnectedChime();
    triggerHaptic('success');
    setCallState('connected');
  };

  const handleDeclineCall = () => {
    stopRingtone();
    triggerHaptic('heavy');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    onEndCall(0, 'declined');
  };

  const handleHangUp = () => {
    stopRingtone();
    triggerHaptic('heavy');
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
      <div className="fixed bottom-24 right-4 z-50 bg-[#141517] border border-rose-500/40 rounded-3xl p-3 shadow-2xl flex items-center gap-3 animate-in fade-in text-white backdrop-blur-lg">
        <div className="relative">
          <img src={user.photos[0]} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-rose-500 animate-pulse" />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-black" />
        </div>
        <div className="text-left">
          <p className="font-bold text-xs">{user.name}</p>
          <p className="text-[10px] text-emerald-400 font-mono font-medium">{formatTimer(duration)}</p>
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
    <div className="fixed inset-0 z-50 bg-[#0c0d0e] flex flex-col justify-between p-4 sm:p-6 text-white select-none animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-gray-200 shadow-md">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>HD Encrypted Call</span>
          {callState === 'connected' && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
              {formatTimer(duration)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Output Indicator */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-300">
            <Volume2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{isSpeakerOn ? 'Speakerphone' : 'Earpiece'}</span>
          </div>

          <button
            onClick={() => {
              setIsMinimized(true);
              onMinimize?.();
            }}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-200 transition-colors shadow-md"
            title="Minimize call"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 relative w-full">
        {callType === 'video' && isVideoEnabled ? (
          <div className="relative w-full max-w-md h-[460px] sm:h-[500px] rounded-[32px] overflow-hidden bg-gray-900 shadow-2xl border border-white/15">
            {/* Primary Display: Remote Video or Local Video if swapped */}
            {!isSwappedView ? (
              <>
                <img
                  src={user.photos[0]}
                  alt={user.name}
                  className="w-full h-full object-cover filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                
                {/* Remote Participant Banner */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold drop-shadow-md">{user.name}</h3>
                    <p className="text-xs text-emerald-400 font-medium">
                      {callState === 'connected' ? `Live • HD 1080p` : 'Connecting video...'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] text-gray-200 font-mono">Connected</span>
                  </div>
                </div>
              </>
            ) : (
              /* User Camera in Primary Feed */
              <div className="w-full h-full relative bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                <div className="absolute bottom-4 left-4 text-xs font-semibold bg-black/60 px-3 py-1 rounded-full border border-white/10">
                  You (Live Camera)
                </div>
              </div>
            )}

            {/* Picture-in-Picture Preview Window */}
            <div
              onClick={() => setIsSwappedView(!isSwappedView)}
              className="absolute top-4 right-4 w-28 h-36 sm:w-32 sm:h-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/40 bg-black cursor-pointer group hover:scale-105 transition-all"
              title="Click to swap main view"
            >
              {isSwappedView ? (
                <img src={user.photos[0]} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              )}

              {/* Pip overlay controls */}
              <div className="absolute bottom-1 right-1 flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFlipCamera();
                  }}
                  className="p-1.5 bg-black/70 hover:bg-black/90 rounded-lg text-white backdrop-blur-sm"
                  title="Flip camera"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {/* View swap indicator badge */}
              <div className="absolute top-1 left-1 p-1 bg-black/60 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowLeftRight className="w-3 h-3" />
              </div>
            </div>

            {/* Live Mic Activity Ring for User */}
            {!isMuted && micLevel > 15 && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/40 text-[11px] text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Speaking</span>
              </div>
            )}
          </div>
        ) : (
          /* Voice Call / Video Off Centerpiece */
          <div className="text-center space-y-6 max-w-sm w-full">
            <div className="relative inline-block">
              <img
                src={user.photos[0]}
                alt={user.name}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-rose-500 shadow-2xl mx-auto"
              />
              {callState === 'ringing' && (
                <div className="absolute -inset-4 rounded-full border-2 border-rose-500/40 animate-ping pointer-events-none" />
              )}
              {callState === 'connected' && (
                <div className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 rounded-full ring-4 ring-[#0c0d0e] flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white stroke-[3]" />
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

            {/* Live Audio Reactive Visualizer Bars */}
            {callState === 'connected' && (
              <div className="flex items-center justify-center gap-1.5 h-12 py-2">
                {[35, 65, 95, 45, 80, 55, 75, 100, 60, 50, 90, 40].map((lvl, i) => {
                  const dynamicHeight = isMuted ? 15 : Math.max(20, Math.min(100, (lvl * (0.6 + (micLevel / 150)))));
                  return (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-rose-500 to-pink-400 rounded-full transition-all duration-75"
                      style={{ height: `${dynamicHeight}%` }}
                    />
                  );
                })}
              </div>
            )}

            {isMuted && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30">
                <MicOff className="w-3.5 h-3.5" />
                <span>Your microphone is muted</span>
              </div>
            )}
          </div>
        )}

        {/* Camera or Mic warning banner if restricted */}
        {cameraError && (
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-md mx-auto z-20 pb-2">
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
          <div className="bg-[#181a1e]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 sm:p-4 flex items-center justify-around gap-2 shadow-2xl">
            {/* Mic Toggle with level indicator */}
            <button
              onClick={handleToggleMute}
              className={`p-3.5 rounded-2xl transition-all relative ${
                isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 hover:bg-white/20 text-white'
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
                className={`p-3.5 rounded-2xl transition-all ${
                  !isVideoEnabled ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
            )}

            {/* Flip Camera Toggle (if video active) */}
            {callType === 'video' && isVideoEnabled && (
              <button
                onClick={handleFlipCamera}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all active:rotate-180 duration-300"
                title="Flip Camera front/back"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            )}

            {/* Speaker Toggle */}
            <button
              onClick={handleToggleSpeaker}
              className={`p-3.5 rounded-2xl transition-all ${
                !isSpeakerOn ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isSpeakerOn ? 'Switch to Earpiece' : 'Switch to Speakerphone'}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleHangUp}
              className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-transform"
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

