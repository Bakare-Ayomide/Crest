import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Minimize2, Maximize2, ShieldCheck, RefreshCw } from 'lucide-react';
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

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  // Initialize camera/mic MediaStream
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const constraints = {
            audio: true,
            video: callType === 'video' ? { facingMode: cameraFacing } : false
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (active) {
            localStreamRef.current = stream;
            if (localVideoRef.current && callType === 'video') {
              localVideoRef.current.srcObject = stream;
            }
          }
        }
      } catch (err) {
        console.warn('Could not access camera/mic stream:', err);
      }
    }

    initMedia();

    // If outgoing call, simulate match picking up after 2.5 seconds
    if (!isIncoming) {
      const ringTimer = setTimeout(() => {
        if (active) {
          setCallState('connected');
          triggerHaptic('success');
          showNativeToast(`Connected with ${user.name}`);
        }
      }, 2500);

      return () => {
        active = false;
        clearTimeout(ringTimer);
      };
    }

    return () => {
      active = false;
    };
  }, [callType, isIncoming, cameraFacing]);

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

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleToggleMute = () => {
    triggerHaptic('light');
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(t => {
        t.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    triggerHaptic('light');
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(t => {
        t.enabled = !isVideoEnabled;
      });
    }
    setIsVideoEnabled(!isVideoEnabled);
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
        video: { facingMode: newFacing }
      });
      localStreamRef.current = newStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }
    } catch (e) {
      console.warn('Cannot flip camera:', e);
    }
  };

  const handleAcceptCall = () => {
    triggerHaptic('success');
    setCallState('connected');
  };

  const handleDeclineCall = () => {
    triggerHaptic('heavy');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    onEndCall(0, 'declined');
  };

  const handleHangUp = () => {
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
      <div className="fixed bottom-24 right-4 z-50 bg-[#141517] border border-rose-500/40 rounded-3xl p-3 shadow-2xl flex items-center gap-3 animate-in fade-in text-white">
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
    <div className="fixed inset-0 z-50 bg-[#0d0e10] flex flex-col justify-between p-6 text-white select-none animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-gray-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>CREST HD End-to-End Encrypted</span>
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
        {callType === 'video' && isVideoEnabled ? (
          <div className="relative w-full max-w-sm h-96 rounded-3xl overflow-hidden bg-gray-900 shadow-2xl border border-white/10">
            {/* Simulated Remote Video Feed (Photo with cinematic ambient lighting) */}
            <img
              src={user.photos[0]}
              alt={user.name}
              className="w-full h-full object-cover filter brightness-95"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

            {/* Remote Caller Name Banner */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{user.name}</h3>
                <p className="text-xs text-emerald-400 font-medium">
                  {callState === 'connected' ? `Live • ${formatTimer(duration)}` : 'Connecting video...'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] text-gray-300 font-mono">1080p</span>
              </div>
            </div>

            {/* Local Video Picture-in-Picture Preview */}
            <div className="absolute top-4 right-4 w-28 h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 bg-black">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              <button
                onClick={handleFlipCamera}
                className="absolute bottom-1 right-1 p-1 bg-black/60 rounded-lg text-white hover:bg-black/80"
                title="Flip Camera"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          /* Voice Call Centerpiece */
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <img
                src={user.photos[0]}
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover ring-4 ring-rose-500 shadow-2xl mx-auto"
              />
              {callState === 'ringing' && (
                <div className="absolute -inset-3 rounded-full border-2 border-rose-500/50 animate-ping" />
              )}
              {callState === 'connected' && (
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full ring-4 ring-[#0d0e10] flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full" />
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

            {/* Ambient Waveform visualizer when connected */}
            {callState === 'connected' && (
              <div className="flex items-center justify-center gap-1.5 h-10">
                {[30, 65, 95, 40, 80, 50, 75, 100, 60, 45, 90, 35].map((lvl, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-rose-500 to-pink-400 rounded-full animate-pulse"
                    style={{
                      height: `${lvl}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
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
            {/* Mic Toggle */}
            <button
              onClick={handleToggleMute}
              className={`p-3.5 rounded-2xl transition-colors ${
                isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Video Toggle */}
            {callType === 'video' && (
              <button
                onClick={handleToggleVideo}
                className={`p-3.5 rounded-2xl transition-colors ${
                  !isVideoEnabled ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
            )}

            {/* Speaker Toggle */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-2xl transition-colors ${
                !isSpeakerOn ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isSpeakerOn ? 'Speaker On' : 'Earpiece'}
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
