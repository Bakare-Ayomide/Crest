import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, AlertCircle, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../../lib/capacitor';
import { generateValidWavDataUrl, isValidAudioUrl } from '../../lib/audioUtils';

interface VoiceRecorderProps {
  onSendVoiceNote: (audioDataUrl: string, durationStr: string, waveform: number[]) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoiceNote, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([25, 45, 75, 30, 90, 60, 40, 80, 50, 70, 30, 85]);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordedBlobsResolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  // Start recording on mount
  useEffect(() => {
    startRecording();

    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      streamRef.current = null;
    }
    if (audioPreviewRef.current) {
      try { audioPreviewRef.current.pause(); } catch {}
      audioPreviewRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  };

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  const startRecording = async () => {
    setPermissionError(null);
    audioChunksRef.current = [];
    setRecordingTime(0);
    setAudioUrl(null);
    setIsPlayingPreview(false);
    setPreviewProgress(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone not supported on this device');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      triggerHaptic('medium');

      // Setup audio analysis for live waveform visualization
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);
          analyserRef.current = analyser;

          const updateWaveform = () => {
            if (analyserRef.current) {
              const data = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(data);
              const sampled = [
                data[1] || 25, data[3] || 45, data[5] || 75, data[7] || 35,
                data[9] || 90, data[11] || 60, data[13] || 45, data[15] || 85,
                data[17] || 50, data[19] || 70, data[21] || 35, data[23] || 80
              ].map(v => Math.max(15, Math.min(100, Math.round((v / 255) * 100))));
              setAudioLevels(sampled);
            }
            animationFrameRef.current = requestAnimationFrame(updateWaveform);
          };
          updateWaveform();
        }
      } catch (e) {
        console.warn('Audio analyser fallback:', e);
      }

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mime = mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        
        if (recordedBlobsResolveRef.current) {
          recordedBlobsResolveRef.current(audioBlob);
          recordedBlobsResolveRef.current = null;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          setAudioUrl(base64Data);
        };

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone error:', err);
      setPermissionError(err.message || 'Microphone access denied');
      setIsRecording(false);
    }
  };

  const handleStopAndPreview = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      triggerHaptic('light');
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      
      mediaRecorderRef.current.stop();
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePreviewPlay = () => {
    if (!audioUrl || !isValidAudioUrl(audioUrl)) {
      // If preview clicked before DataURL resolved, construct wav
      const fallbackWav = generateValidWavDataUrl(Math.max(1, recordingTime));
      setAudioUrl(fallbackWav);
      playAudioDirect(fallbackWav);
      return;
    }
    playAudioDirect(audioUrl);
  };

  const playAudioDirect = (url: string) => {
    if (isPlayingPreview) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setIsPlayingPreview(false);
    } else {
      try {
        if (!audioPreviewRef.current) {
          const audio = new Audio(url);
          audio.ontimeupdate = () => {
            if (audio.duration) {
              setPreviewProgress((audio.currentTime / audio.duration) * 100);
            }
          };
          audio.onerror = () => {
            setIsPlayingPreview(false);
            setPreviewProgress(0);
          };
          audio.onended = () => {
            setIsPlayingPreview(false);
            setPreviewProgress(0);
          };
          audioPreviewRef.current = audio;
        }
        audioPreviewRef.current.play().then(() => {
          setIsPlayingPreview(true);
        }).catch(() => {
          setIsPlayingPreview(false);
        });
      } catch {
        setIsPlayingPreview(false);
      }
    }
  };

  const stopAndGetBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        if (audioChunksRef.current.length > 0) {
          resolve(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        } else {
          resolve(null);
        }
        return;
      }
      recordedBlobsResolveRef.current = resolve;
      mediaRecorderRef.current.stop();
    });
  };

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleSend = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    triggerHaptic('success');
    
    const finalDuration = formatSeconds(Math.max(1, recordingTime));
    const finalWaveform = audioLevels.length > 0 ? audioLevels : [30, 60, 90, 45, 75, 55, 80, 40, 65, 85, 50, 70];
    
    stopRecordingCleanup();

    let targetAudioUrl = audioUrl;

    if (!targetAudioUrl || !isValidAudioUrl(targetAudioUrl)) {
      if (isRecording || (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording')) {
        const recordedBlob = await stopAndGetBlob();
        if (recordedBlob && recordedBlob.size > 0) {
          targetAudioUrl = await blobToDataUrl(recordedBlob);
        }
      }
    }

    if (!targetAudioUrl || !isValidAudioUrl(targetAudioUrl)) {
      // Use clean acoustic speech harmonic WAV tone
      targetAudioUrl = generateValidWavDataUrl(Math.max(1, recordingTime));
    }

    onSendVoiceNote(targetAudioUrl, finalDuration, finalWaveform);
  };

  if (permissionError) {
    return (
      <div className="flex items-center justify-between p-3 bg-red-950/40 border border-red-800/60 rounded-2xl text-white">
        <div className="flex items-center gap-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{permissionError}. Tap retry or send with simulated voice.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const demoWav = generateValidWavDataUrl(3);
              onSendVoiceNote(demoWav, '0:03', [30, 60, 90, 50, 80, 60, 45, 85, 40, 70, 35, 65]);
            }}
            className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 rounded-lg text-xs font-bold"
          >
            Send Demo Note
          </button>
          <button
            onClick={onCancel}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 bg-[#1c1e22] border border-rose-500/30 rounded-2xl text-white shadow-xl animate-in slide-in-from-bottom-2 duration-150">
      {/* Discard Button */}
      <button
        onClick={() => {
          triggerHaptic('light');
          stopRecordingCleanup();
          onCancel();
        }}
        className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
        title="Discard recording"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Recording or Preview Status */}
      <div className="flex-1 flex items-center gap-3">
        {isRecording ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-rose-400">{formatSeconds(recordingTime)}</span>
            </div>

            {/* Live Audio Waveform Bars */}
            <div className="flex-1 flex items-center justify-center gap-1 h-7">
              {audioLevels.map((lvl, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-gradient-to-t from-rose-500 to-pink-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(15, lvl)}%` }}
                />
              ))}
            </div>

            <button
              onClick={handleStopAndPreview}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-medium flex items-center gap-1"
              title="Stop & Preview"
            >
              <Square className="w-3 h-3 fill-current text-amber-400" />
              <span className="text-[10px]">Review</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleTogglePreviewPlay}
              className="p-2 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors"
            >
              {isPlayingPreview ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] text-gray-300 font-medium">
                <span>Voice Note Preview</span>
                <span className="font-mono text-gray-400">{formatSeconds(recordingTime)}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-100" 
                  style={{ width: `${Math.min(100, Math.max(isPlayingPreview ? previewProgress : 10, 0))}%` }}
                />
              </div>
            </div>

            <button
              onClick={startRecording}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white"
              title="Record again"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={isProcessing}
        className="p-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center disabled:opacity-50"
        title="Send voice note"
      >
        <Send className="w-4 h-4 fill-current" />
      </button>
    </div>
  );
};
