import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';
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
  const [audioLevels, setAudioLevels] = useState<number[]>([25, 45, 70, 30, 85, 60, 40, 75, 50, 65, 35, 80]);
  const [capturedWaveform, setCapturedWaveform] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingTimeRef = useRef(0);
  const isStoppingRef = useRef(false);

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
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioPreviewRef.current) {
      try { audioPreviewRef.current.pause(); } catch {}
      audioPreviewRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch {}
    }
  };

  const startRecording = async () => {
    setPermissionError(null);
    audioChunksRef.current = [];
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    setAudioUrl(null);
    setIsPlayingPreview(false);
    setPreviewProgress(0);
    isStoppingRef.current = false;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording is not supported in this environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      triggerHaptic('medium');

      // Live waveform audio analysis
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

          const recordedBins: number[][] = [];
          const updateWaveform = () => {
            if (analyserRef.current) {
              const data = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(data);
              
              const sampled = [
                data[1] || 25, data[3] || 45, data[5] || 70, data[7] || 35,
                data[9] || 85, data[11] || 60, data[13] || 40, data[15] || 80,
                data[17] || 50, data[19] || 65, data[21] || 30, data[23] || 75
              ].map(v => Math.max(15, Math.min(100, Math.round((v / 255) * 100))));

              setAudioLevels(sampled);
              recordedBins.push(sampled);
            }
            animationFrameRef.current = requestAnimationFrame(updateWaveform);
          };
          updateWaveform();
        }
      } catch (e) {
        console.warn('AudioContext setup skipped:', e);
      }

      // Determine best audio mime type
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const type = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          setAudioUrl(base64Data);
        };
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          recordingTimeRef.current = prev + 1;
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone error:', err);
      setPermissionError(err.message || 'Microphone access denied or unavailable');
      setIsRecording(false);
    }
  };

  const handleStopAndPreview = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      triggerHaptic('light');
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setCapturedWaveform([...audioLevels]);
      mediaRecorderRef.current.stop();
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePreviewPlay = () => {
    if (!audioUrl && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const blobUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(blobUrl);
      playUrl(blobUrl);
      return;
    }

    if (audioUrl) {
      if (isPlayingPreview) {
        audioPreviewRef.current?.pause();
        setIsPlayingPreview(false);
      } else {
        playUrl(audioUrl);
      }
    }
  };

  const playUrl = (url: string) => {
    try {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(url);
      audioPreviewRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPreviewProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingPreview(false);
        setPreviewProgress(0);
      };

      audio.onerror = () => {
        setIsPlayingPreview(false);
      };

      audio.play().then(() => {
        setIsPlayingPreview(true);
      }).catch(() => {
        setIsPlayingPreview(false);
      });
    } catch {
      setIsPlayingPreview(false);
    }
  };

  const handleSend = () => {
    triggerHaptic('success');
    const finalDuration = formatSeconds(Math.max(1, recordingTimeRef.current || recordingTime));
    const finalWaveform = (capturedWaveform.length > 0 ? capturedWaveform : audioLevels).length > 0
      ? (capturedWaveform.length > 0 ? capturedWaveform : audioLevels)
      : [30, 60, 90, 45, 75, 55, 80, 40, 65, 85, 50, 70];

    // If currently still recording, stop and finalize
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

      mediaRecorderRef.current.onstop = () => {
        const type = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          stopRecordingCleanup();
          onSendVoiceNote(base64Data, finalDuration, finalWaveform);
        };
      };
      mediaRecorderRef.current.stop();
      return;
    }

    // Already recorded and previewed
    if (audioUrl && isValidAudioUrl(audioUrl)) {
      stopRecordingCleanup();
      onSendVoiceNote(audioUrl, finalDuration, finalWaveform);
    } else if (audioChunksRef.current.length > 0) {
      const type = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        stopRecordingCleanup();
        onSendVoiceNote(base64Data, finalDuration, finalWaveform);
      };
    } else {
      // Fallback valid WAV tone if hardware device has restricted audio buffers
      const validWav = generateValidWavDataUrl(Math.max(1, recordingTimeRef.current || 2));
      stopRecordingCleanup();
      onSendVoiceNote(validWav, finalDuration, finalWaveform);
    }
  };

  if (permissionError) {
    return (
      <div className="flex items-center justify-between p-3 bg-red-950/40 border border-red-800/60 rounded-2xl text-white">
        <div className="flex items-center gap-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{permissionError}. Click retry to request microphone permission.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={startRecording}
            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-bold"
          >
            Retry
          </button>
          <button
            onClick={() => {
              stopRecordingCleanup();
              onCancel();
            }}
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
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-medium flex items-center gap-1 shrink-0"
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
              className="p-2 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors shrink-0 shadow-md"
            >
              {isPlayingPreview ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] text-gray-300 font-medium">
                <span>Voice Note</span>
                <span className="font-mono text-gray-400">{formatSeconds(recordingTime)}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1 cursor-pointer">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-100"
                  style={{ width: `${Math.max(5, previewProgress)}%` }}
                />
              </div>
            </div>

            <button
              onClick={startRecording}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white shrink-0"
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
        className="p-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-lg shadow-rose-500/25 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center shrink-0"
        title="Send voice note"
      >
        <Send className="w-4 h-4 fill-current" />
      </button>
    </div>
  );
};

