// Utility to generate valid WAV audio data and synthesize soft audio tones safely

/**
 * Generates a valid Base64 Data URL for a short PCM WAV audio buffer.
 * Ensures the HTML5 Audio element never encounters 'no supported source found'.
 */
export function generateValidWavDataUrl(durationSeconds = 2, freq = 440): string {
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const headerByteLength = 44;
  const totalByteLength = headerByteLength + numSamples * 2; // 16-bit mono

  const buffer = new ArrayBuffer(totalByteLength);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Write subtle harmonic tone samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Gentle envelope fade-in and fade-out
    const env = Math.sin((Math.PI * i) / numSamples);
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.3 * env;
    const int16 = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  // Convert buffer to base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:audio/wav;base64,${base64}`;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Checks if a given string is a plausible, well-formed audio URL or Data URI.
 */
export function isValidAudioUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url === 'mock_audio' || url.startsWith('mock')) return false;
  if (url.startsWith('data:audio/') && url.length > 50) return true;
  if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return true;
  }
  return false;
}

/**
 * Synthesizes a soft voice note playback using Web Audio API if no audio file is available.
 */
export class VoiceNoteSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: any = null;
  private startTime = 0;
  private duration = 3;
  private onProgress?: (percent: number) => void;
  private onEnded?: () => void;

  play(durationSeconds = 3, onProgress?: (percent: number) => void, onEnded?: () => void) {
    this.stop();
    this.duration = Math.max(1, durationSeconds);
    this.onProgress = onProgress;
    this.onEnded = onEnded;
    this.isPlaying = true;
    this.startTime = Date.now();

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + this.duration * 0.5);
        osc.frequency.exponentialRampToValueAtTime(360, this.ctx.currentTime + this.duration);

        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + this.duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + this.duration);
      }
    } catch {
      // AudioContext unavailable, fall back to pure timer
    }

    this.timer = setInterval(() => {
      if (!this.isPlaying) return;
      const elapsed = (Date.now() - this.startTime) / 1000;
      const progress = Math.min(100, (elapsed / this.duration) * 100);
      if (this.onProgress) this.onProgress(progress);

      if (elapsed >= this.duration) {
        this.stop();
        if (this.onEnded) this.onEnded();
      }
    }, 50);
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}
