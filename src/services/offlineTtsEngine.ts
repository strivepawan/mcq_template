import { voiceSynthesizer } from './voiceSynth';

class OfflineTTSEngine {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Synthesize text into an AudioBuffer that can be placed on an audio timeline
   */
  public async synthesizeToAudioBuffer(
    text: string,
    options?: { speed?: number; pitch?: number; voice?: string }
  ): Promise<AudioBuffer | null> {
    if (!text || text.trim().length === 0) return null;

    try {
      const buffer = voiceSynthesizer.synthesize(
        text,
        48000,
        options?.pitch ?? 1.0,
        options?.speed ?? 1.0
      );
      return buffer;
    } catch (err) {
      console.error('Offline TTS synthesis error:', err);
      return null;
    }
  }

  /**
   * Preview speech immediately through browser speakers
   */
  public async speakPreview(
    text: string,
    options?: { speed?: number; pitch?: number; voice?: string; onEnd?: () => void }
  ): Promise<void> {
    const audioBuffer = await this.synthesizeToAudioBuffer(text, options);
    if (!audioBuffer) {
      options?.onEnd?.();
      return;
    }

    const ctx = this.getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => {
      options?.onEnd?.();
    };
    source.start(0);
  }
}

export const offlineTtsEngine = new OfflineTTSEngine();
