import { predict, TtsSession, VoiceId } from '@mintplex-labs/piper-tts-web';

export interface NeuralVoiceInfo {
  id: string;
  name: string;
  lang: string;
  gender: 'female' | 'male';
}

export const POPULAR_NEURAL_VOICES: NeuralVoiceInfo[] = [
  {
    id: 'en_US-amy-medium',
    name: 'Amy (US Natural Neural Female)',
    lang: 'en-US',
    gender: 'female'
  },
  {
    id: 'en_US-lessac-medium',
    name: 'Lessac (US Studio Neural)',
    lang: 'en-US',
    gender: 'female'
  },
  {
    id: 'en_US-ryan-medium',
    name: 'Ryan (US Natural Neural Male)',
    lang: 'en-US',
    gender: 'male'
  },
  {
    id: 'en_GB-alba-medium',
    name: 'Alba (UK Natural Neural Female)',
    lang: 'en-GB',
    gender: 'female'
  },
  {
    id: 'en_GB-alan-medium',
    name: 'Alan (UK Natural Neural Male)',
    lang: 'en-GB',
    gender: 'male'
  }
];

class NeuralTTSService {
  private audioContext: AudioContext | null = null;
  private audioCache = new Map<string, AudioBuffer>();
  private activeSession: TtsSession | null = null;
  private currentVoiceId: string = 'en_US-amy-medium';

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Synthesize text to a natural neural speech AudioBuffer
   */
  public async synthesizeSpeech(
    text: string,
    voiceId: string = 'en_US-amy-medium',
    onProgress?: (pct: number) => void
  ): Promise<AudioBuffer | null> {
    if (!text || text.trim().length === 0) return null;

    const cacheKey = `${voiceId}:::${text.trim()}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    try {
      // Clean and pronounce abbreviations nicely
      const normalized = text
        .replace(/\b([A-D])\)/g, 'Option $1.')
        .replace(/\b([A-D]):/g, 'Option $1:')
        .trim();

      const blob = await predict(
        {
          text: normalized,
          voiceId: (voiceId || 'en_US-amy-medium') as VoiceId
        },
        (progress) => {
          if (progress && onProgress) {
            const pct = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;
            onProgress(pct);
          }
        }
      );

      const arrayBuffer = await blob.arrayBuffer();
      const ctx = this.getAudioContext();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

      this.audioCache.set(cacheKey, decodedBuffer);
      return decodedBuffer;
    } catch (err) {
      console.warn('Piper neural TTS generation failed or offline, falling back to Web Speech / Formant synth:', err);
      return null;
    }
  }

  /**
   * Play speech directly through the browser speakers
   */
  public async speak(
    text: string,
    voiceId: string = 'en_US-amy-medium',
    onEnd?: () => void
  ): Promise<void> {
    const buffer = await this.synthesizeSpeech(text, voiceId);
    if (!buffer) {
      onEnd?.();
      return;
    }

    const ctx = this.getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      onEnd?.();
    };
    source.start(0);
  }
}

export const neuralTtsService = new NeuralTTSService();
