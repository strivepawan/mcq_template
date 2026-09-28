import { LanguageCode } from '../types/mcq';

export interface VoiceOption {
  id: string;
  name: string;
  lang: LanguageCode;
  gender: string;
  isDefault: boolean;
}

const DEFAULT_ENGLISH_VOICES: VoiceOption[] = [
  { id: 'en-US-JennyNeural', name: '✨ Jenny (US English Female)', lang: 'en', gender: 'Female', isDefault: true },
  { id: 'en-US-GuyNeural', name: '✨ Guy (US English Male)', lang: 'en', gender: 'Male', isDefault: false },
  { id: 'en-IN-NeerjaNeural', name: '✨ Neerja (Indian English Female)', lang: 'en', gender: 'Female', isDefault: false },
  { id: 'en-IN-PrabhatNeural', name: '✨ Prabhat (Indian English Male)', lang: 'en', gender: 'Male', isDefault: false },
  { id: 'en-GB-SoniaNeural', name: '✨ Sonia (UK English Female)', lang: 'en', gender: 'Female', isDefault: false },
];

const DEFAULT_HINDI_VOICES: VoiceOption[] = [
  { id: 'hi-IN-SwaraNeural', name: '✨ Swara (हिंदी - महिला आवाज़)', lang: 'hi', gender: 'Female', isDefault: true },
  { id: 'hi-IN-MadhurNeural', name: '✨ Madhur (हिंदी - पुरुष आवाज़)', lang: 'hi', gender: 'Male', isDefault: false },
];

class TTSService {
  private audioContext: AudioContext | null = null;
  private audioCache = new Map<string, AudioBuffer>();
  private activeSource: AudioBufferSourceNode | null = null;
  private voices: VoiceOption[] = [...DEFAULT_ENGLISH_VOICES, ...DEFAULT_HINDI_VOICES];
  private isServerHealthy: boolean | null = null;
  private lastHealthCheckTime = 0;

  constructor() {
    this.checkServerHealth().then((healthy) => {
      if (healthy) this.fetchVoices();
    });
  }

  public async checkServerHealth(): Promise<boolean> {
    const now = Date.now();
    if (this.isServerHealthy !== null && now - this.lastHealthCheckTime < 10000) {
      return this.isServerHealthy;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('http://127.0.0.1:5001/api/health', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this.isServerHealthy = res.ok;
    } catch {
      this.isServerHealthy = false;
    }

    this.lastHealthCheckTime = now;
    return this.isServerHealthy;
  }

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

  private async fetchVoices() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('http://127.0.0.1:5001/api/voices', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        this.voices = data.map((v: { id: string; name: string; lang: string; gender: string }, i: number) => ({
          id: v.id,
          name: v.name,
          lang: v.lang === 'hi' ? 'hi' : 'en',
          gender: v.gender,
          isDefault: i === 0
        }));
      }
    } catch {
      // Fallback to built-in list
    }
  }

  public getVoicesForLanguage(lang: LanguageCode = 'en'): VoiceOption[] {
    return this.voices.filter((v) => v.lang === lang);
  }

  public getAvailableVoices(): VoiceOption[] {
    return this.voices;
  }

  public estimateSpeechDuration(text: string, rate: number = 1.0): number {
    if (!text || text.trim().length === 0) return 0;
    const words = text.trim().split(/\s+/).length;
    const commas = (text.match(/[,।]/g) || []).length * 0.3;
    const periods = (text.match(/[.?!:;।]/g) || []).length * 0.45;
    const baseDuration = (words / (2.2 * rate)) + commas + periods;
    return Math.max(1.5, Number(baseDuration.toFixed(2)));
  }

  public async synthesizeAudioBuffer(
    text: string,
    options?: { voiceName?: string; rate?: number }
  ): Promise<AudioBuffer | null> {
    if (!text || text.trim().length === 0) return null;

    const isHealthy = await this.checkServerHealth();
    if (!isHealthy) {
      return null;
    }

    const voice = options?.voiceName || 'en-US-JennyNeural';
    const rate = options?.rate ?? 1.0;
    const cacheKey = `${voice}:::${rate}:::${text.trim()}`;

    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch('http://127.0.0.1:5001/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice,
          rate
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`TTS service error: ${res.statusText}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const ctx = this.getAudioContext();
      const decoded = await ctx.decodeAudioData(arrayBuffer);

      this.audioCache.set(cacheKey, decoded);
      return decoded;
    } catch (err) {
      console.warn('Local TTS service unavailable or timed out:', err);
      return null;
    }
  }

  public async speak(
    text: string,
    options?: { voiceName?: string; rate?: number; pitch?: number; onEnd?: () => void }
  ): Promise<void> {
    if (!text) {
      options?.onEnd?.();
      return;
    }

    this.stop();

    const buffer = await this.synthesizeAudioBuffer(text, {
      voiceName: options?.voiceName,
      rate: options?.rate
    });

    if (buffer) {
      const ctx = this.getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        this.activeSource = null;
        options?.onEnd?.();
      };
      this.activeSource = source;
      source.start(0);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.0;
      if (options?.onEnd) {
        utterance.onend = options.onEnd;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      options?.onEnd?.();
    }
  }

  public stop(): void {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch {}
      this.activeSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const ttsService = new TTSService();
