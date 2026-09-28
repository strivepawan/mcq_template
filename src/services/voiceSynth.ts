// High-Fidelity Offline Formant Speech Synthesizer with Rosenberg Glottal Excitation

interface FormantFreqs {
  f1: number;
  f2: number;
  f3: number;
  bw1: number;
  bw2: number;
  bw3: number;
  noise?: boolean;
  gain: number;
}

// Natural English Phoneme Formant Frequency & Bandwidth Map (Hz)
const PHONEME_MAP: Record<string, FormantFreqs> = {
  // Front & Open Vowels
  'a': { f1: 750, f2: 1750, f3: 2600, bw1: 80, bw2: 100, bw3: 120, gain: 1.0 },  // 'cat'
  'aa': { f1: 730, f2: 1090, f3: 2440, bw1: 80, bw2: 90, bw3: 130, gain: 1.0 },  // 'father'
  'e': { f1: 530, f2: 1840, f3: 2480, bw1: 70, bw2: 100, bw3: 120, gain: 1.0 },  // 'bed'
  'ee': { f1: 280, f2: 2250, f3: 2900, bw1: 60, bw2: 90, bw3: 150, gain: 1.1 },  // 'see'
  'i': { f1: 400, f2: 1950, f3: 2550, bw1: 70, bw2: 100, bw3: 140, gain: 0.95 }, // 'sit'
  'o': { f1: 570, f2: 840, f3: 2410, bw1: 80, bw2: 90, bw3: 140, gain: 0.9 },   // 'hot'
  'oo': { f1: 300, f2: 870, f3: 2240, bw1: 70, bw2: 80, bw3: 130, gain: 1.0 },   // 'boot'
  'u': { f1: 640, f2: 1190, f3: 2390, bw1: 80, bw2: 90, bw3: 120, gain: 0.95 },  // 'cut'
  'ay': { f1: 600, f2: 1900, f3: 2500, bw1: 70, bw2: 100, bw3: 130, gain: 1.0 }, // 'say'
  'oh': { f1: 480, f2: 820, f3: 2350, bw1: 80, bw2: 90, bw3: 140, gain: 0.95 },  // 'go'

  // Consonants & Fricatives
  's': { f1: 300, f2: 2500, f3: 4800, bw1: 150, bw2: 250, bw3: 500, noise: true, gain: 0.7 },
  'sh': { f1: 300, f2: 2000, f3: 3200, bw1: 150, bw2: 200, bw3: 400, noise: true, gain: 0.75 },
  'f': { f1: 250, f2: 1200, f3: 2400, bw1: 150, bw2: 200, bw3: 300, noise: true, gain: 0.6 },
  'th': { f1: 250, f2: 1400, f3: 2600, bw1: 150, bw2: 200, bw3: 350, noise: true, gain: 0.6 },
  'm': { f1: 280, f2: 1100, f3: 2200, bw1: 100, bw2: 120, bw3: 200, gain: 0.8 },
  'n': { f1: 280, f2: 1450, f3: 2200, bw1: 100, bw2: 120, bw3: 200, gain: 0.8 },
  'r': { f1: 320, f2: 1100, f3: 1400, bw1: 80, bw2: 100, bw3: 150, gain: 0.9 },
  'l': { f1: 320, f2: 1050, f3: 2800, bw1: 80, bw2: 100, bw3: 150, gain: 0.9 },
  'w': { f1: 300, f2: 650, f3: 2200, bw1: 70, bw2: 80, bw3: 140, gain: 0.85 },
  'y': { f1: 280, f2: 2200, f3: 2950, bw1: 60, bw2: 90, bw3: 140, gain: 0.95 }
};

export class VoiceSynthesizer {
  /**
   * Synthesizes text to a high-volume, crystal-clear 48kHz Stereo AudioBuffer
   */
  public synthesize(
    text: string,
    sampleRate = 48000,
    pitchMultiplier = 1.0,
    speedMultiplier = 1.0
  ): AudioBuffer {
    const cleaned = text
      .toLowerCase()
      .replace(/[^\w\s.,?!'-]/g, '')
      .replace(/\b([a-d])\)/g, 'option $1.')
      .replace(/\boption ([a-d])\b/g, 'option $1.')
      .trim();

    const words = cleaned.split(/\s+/).filter(Boolean);
    const baseWpm = 145 * speedMultiplier;
    const secPerWord = 60 / baseWpm;
    const totalDuration = Math.max(1.5, words.length * secPerWord + 0.4);
    const totalSamples = Math.ceil(totalDuration * sampleRate);

    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const buffer = audioContext.createBuffer(2, totalSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const basePitch = 140 * pitchMultiplier;
    let currentSample = 0;

    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      const isEnd = w === words.length - 1;
      const isQuestion = text.trim().endsWith('?');

      const phonemes = this.wordToPhonemes(word);
      const wordSamples = Math.floor((secPerWord * 0.88) * sampleRate);
      const phonemeSamples = Math.floor(wordSamples / Math.max(1, phonemes.length));

      for (let p = 0; p < phonemes.length; p++) {
        const ph = phonemes[p];
        const profile = PHONEME_MAP[ph] || PHONEME_MAP['e'];

        // Pitch inflection with natural prosody
        const progressInWord = p / phonemes.length;
        const sentenceProgress = w / Math.max(1, words.length);
        let pitch = basePitch * (1 - sentenceProgress * 0.08);
        if (isEnd && isQuestion) {
          pitch *= 1.0 + progressInWord * 0.4; // Rising intonation on questions
        } else if (isEnd) {
          pitch *= 1.0 - progressInWord * 0.25; // Falling intonation on statements
        }

        // Glottal cycle period
        const periodSamples = Math.round(sampleRate / pitch);

        for (let i = 0; i < phonemeSamples; i++) {
          const idx = currentSample + i;
          if (idx >= totalSamples) break;

          const t = i / sampleRate;

          // Attack/Decay envelope for natural syllable onset
          const attack = Math.min(1.0, i / (0.015 * sampleRate));
          const decay = Math.min(1.0, (phonemeSamples - i) / (0.02 * sampleRate));
          const env = attack * decay;

          let sampleVal = 0;

          if (profile.noise) {
            // High-frequency fricative noise
            const noise = (Math.random() * 2 - 1);
            const freq = profile.f3;
            sampleVal = noise * Math.sin(2 * Math.PI * freq * t) * profile.gain * env;
          } else {
            // Rosenberg Glottal Excitation Pulse
            const phase = (i % periodSamples) / periodSamples;
            let glottal = 0;
            if (phase < 0.4) {
              glottal = 0.5 * (1 - Math.cos(Math.PI * (phase / 0.4)));
            } else if (phase < 0.6) {
              glottal = Math.cos(Math.PI * 0.5 * ((phase - 0.4) / 0.2));
            }

            // Triple Formant Resonators (F1, F2, F3)
            const r1 = Math.sin(2 * Math.PI * profile.f1 * t) * Math.exp(-Math.PI * profile.bw1 * (phase * periodSamples / sampleRate));
            const r2 = Math.sin(2 * Math.PI * profile.f2 * t) * 0.7 * Math.exp(-Math.PI * profile.bw2 * (phase * periodSamples / sampleRate));
            const r3 = Math.sin(2 * Math.PI * profile.f3 * t) * 0.4 * Math.exp(-Math.PI * profile.bw3 * (phase * periodSamples / sampleRate));

            sampleVal = glottal * (r1 + r2 + r3) * profile.gain * 1.6 * env;
          }

          // Soft limiting / saturation to avoid harsh clipping and maximize vocal punch
          const saturated = Math.tanh(sampleVal * 1.2);

          left[idx] = saturated * 0.98;
          right[idx] = saturated * 0.98;
        }

        currentSample += phonemeSamples;
      }

      // Syllable/Word pause
      currentSample += Math.floor(0.04 * sampleRate);
    }

    return buffer;
  }

  private wordToPhonemes(word: string): string[] {
    const list: string[] = [];
    let i = 0;
    while (i < word.length) {
      const two = word.substring(i, i + 2);
      if (PHONEME_MAP[two]) {
        list.push(two);
        i += 2;
        continue;
      }
      const one = word.substring(i, i + 1);
      if (PHONEME_MAP[one]) {
        list.push(one);
      } else {
        list.push('e');
      }
      i++;
    }
    return list.length > 0 ? list : ['aa'];
  }
}

export const voiceSynthesizer = new VoiceSynthesizer();
