// Utility to generate valid WAV audio data and synthesize soft audio tones safely

/**
 * Generates a valid Base64 Data URL for a rich PCM WAV audio buffer with voice formant harmonics.
 * Ensures the HTML5 Audio element and Web Audio API never encounter decoding errors.
 */
export function generateValidWavDataUrl(durationSeconds = 3, baseFreq = 260): string {
  const sampleRate = 16000;
  const numSamples = Math.floor(sampleRate * Math.max(1, durationSeconds));
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
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Write subtle harmonic tone samples with warm voice formant frequencies
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Gentle speech-like cadence envelope
    const sentenceEnvelope = Math.sin((Math.PI * i) / numSamples);
    const wordPacing = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2.5 * t);
    const pitchVibrato = baseFreq + Math.sin(2 * Math.PI * 4 * t) * 15;
    
    // Fundamental + 2nd + 3rd harmonics for warm voice presence
    const f1 = Math.sin(2 * Math.PI * pitchVibrato * t);
    const f2 = Math.sin(2 * Math.PI * (pitchVibrato * 2.02) * t) * 0.35;
    const f3 = Math.sin(2 * Math.PI * (pitchVibrato * 3.01) * t) * 0.15;
    
    const sample = (f1 + f2 + f3) * 0.28 * sentenceEnvelope * (0.4 + 0.6 * wordPacing);
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
 * Synthesizes a natural voice note playback using Web Audio API if no audio file is available.
 */
export class VoiceNoteSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: any = null;
  private startTime = 0;
  private duration = 3;
  private onProgress?: (percent: number) => void;
  private onEnded?: () => void;

  play(durationSeconds = 3, onProgress?: (percent: number) => void, onEnded?: () => void, startOffsetSeconds = 0) {
    this.stop();
    this.duration = Math.max(1, durationSeconds);
    this.onProgress = onProgress;
    this.onEnded = onEnded;
    this.isPlaying = true;
    this.startTime = Date.now() - startOffsetSeconds * 1000;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const remaining = Math.max(0.1, this.duration - startOffsetSeconds);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(340, this.ctx.currentTime + remaining * 0.4);
        osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + remaining);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(520, this.ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + remaining * 0.4);
        osc2.frequency.exponentialRampToValueAtTime(560, this.ctx.currentTime + remaining);

        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + remaining);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc2.start();
        osc.stop(this.ctx.currentTime + remaining);
        osc2.stop(this.ctx.currentTime + remaining);
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
