import { MCQItem, TemplateConfig } from '../types/mcq';
import { AudioTimingTimeline } from '../types/render';
import { ttsService } from './ttsService';

export class AudioMixerService {
  /**
   * Render complete multi-track synchronized audio (English or Hindi Natural AI Voice + SFX + BGM)
   */
  public async renderSoundtrack(
    mcq: MCQItem,
    template: TemplateConfig,
    timeline: AudioTimingTimeline,
    sampleRate = 48000
  ): Promise<AudioBuffer> {
    const totalDuration = timeline.totalDurationSec + 0.5;
    const totalSamples = Math.ceil(totalDuration * sampleRate);

    // Create OfflineAudioContext for frame-accurate multi-track mixing
    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

    // 1. Synthesize Natural AI Voice Audio Tracks (English or Hindi)
    if (mcq.voiceoverEnabled) {
      const isHindi = mcq.language === 'hi';
      const defaultVoice = isHindi ? 'hi-IN-SwaraNeural' : 'en-US-JennyNeural';
      const voiceName = mcq.voiceName || defaultVoice;
      const rate = mcq.voiceRate ?? 1.0;

      // (a) Question & 4 Options Voiceover
      const questionText = isHindi
        ? `${mcq.question}। विकल्प ए: ${mcq.options[0].text}। विकल्प बी: ${mcq.options[1].text}। विकल्प सी: ${mcq.options[2].text}। विकल्प डी: ${mcq.options[3].text}।`
        : `${mcq.question}. Option A: ${mcq.options[0].text}. Option B: ${mcq.options[1].text}. Option C: ${mcq.options[2].text}. Option D: ${mcq.options[3].text}.`;

      const qBuffer = await ttsService.synthesizeAudioBuffer(questionText, { voiceName, rate });
      if (qBuffer) {
        this.pasteBufferToTimeline(offlineCtx, qBuffer, timeline.questionStartSec);
      }

      // (b) Answer Reveal Voiceover
      const correctText = mcq.options.find((o) => o.id === mcq.correctAnswer)?.text || '';
      const answerSpeech = isHindi
        ? `सही उत्तर है विकल्प ${mcq.correctAnswer}: ${correctText}।`
        : `The correct answer is Option ${mcq.correctAnswer}: ${correctText}.`;

      const aBuffer = await ttsService.synthesizeAudioBuffer(answerSpeech, { voiceName, rate });
      if (aBuffer) {
        this.pasteBufferToTimeline(offlineCtx, aBuffer, timeline.answerRevealStartSec + 0.3);
      }

      // (c) Explanation Voiceover
      if (mcq.explanation && mcq.explanation.trim().length > 0) {
        const eBuffer = await ttsService.synthesizeAudioBuffer(mcq.explanation, { voiceName, rate });
        if (eBuffer) {
          this.pasteBufferToTimeline(offlineCtx, eBuffer, timeline.explanationStartSec + 0.2);
        }
      }
    }

    // 2. Synthesize Sound Effects (Countdown ticks, warning beep, winner fanfare)
    if (template.audio.sfxEnabled) {
      const sfxVol = template.audio.sfxVolume ?? 0.8;
      const countSec = timeline.countdownDurationSec;

      // Countdown ticks scheduled at 1s intervals
      for (let i = 0; i < countSec; i++) {
        const tickTime = timeline.countdownStartSec + i;
        if (i === countSec - 1) {
          this.scheduleBeep(offlineCtx, tickTime, sfxVol);
        } else {
          this.scheduleTick(offlineCtx, tickTime, sfxVol);
        }
      }

      // Celebratory Winner Fanfare at reveal
      this.scheduleFanfare(offlineCtx, timeline.answerRevealStartSec, sfxVol);
    }

    // 3. Synthesize Ambient Background Music track (with auto-ducking during speech)
    if (template.audio.bgmVolume > 0) {
      this.scheduleBgmPad(offlineCtx, totalDuration, template.audio.bgmVolume, timeline);
    }

    // Render the complete multi-track audio buffer
    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer;
  }

  /**
   * Render complete multi-track synchronized audio for an entire multi-question project (Long Video / Continuous Reels)
   */
  public async renderProjectSoundtrack(
    mcqs: MCQItem[],
    template: TemplateConfig,
    projectTimeline: import('../types/render').ProjectTimingTimeline,
    sampleRate = 48000
  ): Promise<AudioBuffer> {
    const totalDuration = projectTimeline.totalDurationSec + 0.5;
    const totalSamples = Math.ceil(totalDuration * sampleRate);

    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

    // 1. Synthesize audio for all question segments in parallel for maximum speed
    await Promise.all(
      projectTimeline.segments.map(async (segment, idx) => {
        const mcq = mcqs[idx];
        if (!mcq) return;

        if (mcq.voiceoverEnabled) {
          const isHindi = mcq.language === 'hi';
          const defaultVoice = isHindi ? 'hi-IN-SwaraNeural' : 'en-US-JennyNeural';
          const voiceName = mcq.voiceName || defaultVoice;
          const rate = mcq.voiceRate ?? 1.0;

          // (a) Question & 4 Options Voiceover
          const questionText = isHindi
            ? `${mcq.question}। विकल्प ए: ${mcq.options[0].text}। विकल्प बी: ${mcq.options[1].text}। विकल्प सी: ${mcq.options[2].text}। विकल्प डी: ${mcq.options[3].text}।`
            : `${mcq.question}. Option A: ${mcq.options[0].text}. Option B: ${mcq.options[1].text}. Option C: ${mcq.options[2].text}. Option D: ${mcq.options[3].text}.`;

          const qBufferPromise = ttsService.synthesizeAudioBuffer(questionText, { voiceName, rate });

          // (b) Answer Reveal Voiceover
          const correctText = mcq.options.find((o) => o.id === mcq.correctAnswer)?.text || '';
          const answerSpeech = isHindi
            ? `सही उत्तर है विकल्प ${mcq.correctAnswer}: ${correctText}।`
            : `The correct answer is Option ${mcq.correctAnswer}: ${correctText}.`;

          const aBufferPromise = ttsService.synthesizeAudioBuffer(answerSpeech, { voiceName, rate });

          // (c) Explanation Voiceover
          const eBufferPromise =
            mcq.explanation && mcq.explanation.trim().length > 0
              ? ttsService.synthesizeAudioBuffer(mcq.explanation, { voiceName, rate })
              : Promise.resolve(null);

          const [qBuffer, aBuffer, eBuffer] = await Promise.all([
            qBufferPromise,
            aBufferPromise,
            eBufferPromise
          ]);

          if (qBuffer) {
            this.pasteBufferToTimeline(offlineCtx, qBuffer, segment.startSec + segment.timeline.questionStartSec);
          }
          if (aBuffer) {
            this.pasteBufferToTimeline(offlineCtx, aBuffer, segment.startSec + segment.timeline.answerRevealStartSec + 0.3);
          }
          if (eBuffer) {
            this.pasteBufferToTimeline(offlineCtx, eBuffer, segment.startSec + segment.timeline.explanationStartSec + 0.2);
          }
        }

        // Sound effects for this question segment
        if (template.audio.sfxEnabled) {
          const sfxVol = template.audio.sfxVolume ?? 0.8;
          const countSec = segment.timeline.countdownDurationSec;

          for (let i = 0; i < countSec; i++) {
            const tickTime = segment.startSec + segment.timeline.countdownStartSec + i;
            if (i === countSec - 1) {
              this.scheduleBeep(offlineCtx, tickTime, sfxVol);
            } else {
              this.scheduleTick(offlineCtx, tickTime, sfxVol);
            }
          }

          this.scheduleFanfare(offlineCtx, segment.startSec + segment.timeline.answerRevealStartSec, sfxVol);
        }
      })
    );

    // 2. Synthesize ambient background music across the entire long video duration
    if (template.audio.bgmVolume > 0) {
      this.scheduleBgmPad(offlineCtx, totalDuration, template.audio.bgmVolume, projectTimeline.segments[0]?.timeline || {
        questionStartSec: 0,
        questionDurationSec: 3.5,
        optionsRevealStartSec: 1,
        optionsRevealDurationSec: 2.5,
        countdownStartSec: 4,
        countdownDurationSec: 3,
        answerRevealStartSec: 7.2,
        answerRevealDurationSec: 2,
        explanationStartSec: 9.4,
        explanationDurationSec: 0,
        outroStartSec: 9.4,
        outroDurationSec: 1,
        totalDurationSec: 10.4,
        totalFrames: 312
      });
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer;
  }

  /**
   * Pastes an AudioBuffer at a specific timestamp in the OfflineAudioContext
   */
  private pasteBufferToTimeline(
    ctx: OfflineAudioContext,
    sourceBuffer: AudioBuffer,
    startTimeSec: number
  ): void {
    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = sourceBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(1.0, startTimeSec);

    sourceNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    sourceNode.start(startTimeSec);
  }

  /**
   * Schedule countdown click tick
   */
  private scheduleTick(ctx: OfflineAudioContext, time: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, time);
    osc.frequency.exponentialRampToValueAtTime(300, time + 0.04);

    gain.gain.setValueAtTime(volume * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  /**
   * Schedule countdown final beep
   */
  private scheduleBeep(ctx: OfflineAudioContext, time: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(920, time);

    gain.gain.setValueAtTime(volume * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  /**
   * Schedule Winner celebratory fanfare
   */
  private scheduleFanfare(ctx: OfflineAudioContext, time: number, volume: number): void {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const noteTime = time + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(volume * 0.35, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.6);
    });
  }

  /**
   * Schedule ambient background synth chords with auto-ducking during speech
   */
  private scheduleBgmPad(
    ctx: OfflineAudioContext,
    totalDuration: number,
    volume: number,
    timeline: AudioTimingTimeline
  ): void {
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [220.00, 261.63, 329.63], // A minor
      [174.61, 220.00, 261.63], // F major
      [196.00, 246.94, 293.66]  // G major
    ];

    const chordDuration = 3.0;
    const numChords = Math.ceil(totalDuration / chordDuration);

    for (let i = 0; i < numChords; i++) {
      const chord = chords[i % chords.length];
      const chordStart = i * chordDuration;

      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * 0.5, chordStart);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, chordStart);

        const isSpeechTime =
          (chordStart >= timeline.questionStartSec && chordStart < timeline.questionDurationSec) ||
          (chordStart >= timeline.answerRevealStartSec && chordStart < timeline.answerRevealStartSec + timeline.answerRevealDurationSec);

        const currentVol = isSpeechTime ? volume * 0.08 : volume * 0.2;

        gain.gain.setValueAtTime(0, chordStart);
        gain.gain.linearRampToValueAtTime(currentVol, chordStart + 0.3);
        gain.gain.setValueAtTime(currentVol, chordStart + chordDuration - 0.3);
        gain.gain.linearRampToValueAtTime(0, chordStart + chordDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(chordStart);
        osc.stop(chordStart + chordDuration);
      });
    }
  }
}

export const audioMixerService = new AudioMixerService();
