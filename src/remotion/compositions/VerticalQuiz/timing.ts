import { MCQItem } from '../../../types/mcq';
import { AudioTimingTimeline } from '../../../types/render';
import { ttsService } from '../../../services/ttsService';

export function calculateTimeline(mcq: MCQItem, fps = 30): AudioTimingTimeline {
  // 1. Full Question + Options Speech Duration
  const fullQuestionText = `${mcq.question}. Option A: ${mcq.options[0].text}. Option B: ${mcq.options[1].text}. Option C: ${mcq.options[2].text}. Option D: ${mcq.options[3].text}.`;
  
  const questionSpeechSec = mcq.voiceoverEnabled
    ? Math.max(3.5, ttsService.estimateSpeechDuration(fullQuestionText, mcq.voiceRate ?? 1.0))
    : 3.5;

  // Stagger time for options entrance during the question phase
  const optionsRevealStartSec = Math.max(1.0, questionSpeechSec * 0.35);
  const optionsRevealDurationSec = questionSpeechSec - optionsRevealStartSec;

  // 2. Countdown duration (starts strictly AFTER question + options voiceover finishes)
  const countdownSec = Math.max(1, mcq.waitTimeSeconds || 3);
  const countdownStartSec = questionSpeechSec + 0.4;
  const countdownDurationSec = countdownSec;

  // 3. Answer reveal & audio
  const answerLetter = mcq.correctAnswer;
  const correctOptionText = mcq.options.find(o => o.id === answerLetter)?.text || '';
  const answerSpeechText = `The correct answer is Option ${answerLetter}: ${correctOptionText}.`;
  const answerRevealSpeechSec = mcq.voiceoverEnabled
    ? Math.max(2.0, ttsService.estimateSpeechDuration(answerSpeechText, mcq.voiceRate ?? 1.0))
    : 2.2;

  const answerRevealStartSec = countdownStartSec + countdownDurationSec + 0.2;
  const answerRevealDurationSec = answerRevealSpeechSec;

  // 4. Explanation duration
  let explanationSec = 0;
  if (mcq.explanation && mcq.explanation.trim().length > 0) {
    explanationSec = mcq.voiceoverEnabled
      ? Math.max(2.5, ttsService.estimateSpeechDuration(mcq.explanation, mcq.voiceRate ?? 1.0))
      : 3.0;
  }

  const explanationStartSec = answerRevealStartSec + answerRevealDurationSec + 0.2;
  const explanationDurationSec = explanationSec;

  // 5. Outro
  const outroStartSec = explanationStartSec + explanationDurationSec;
  const outroDurationSec = 1.0;

  const totalDurationSec = outroStartSec + outroDurationSec;
  const totalFrames = Math.ceil(totalDurationSec * fps);

  return {
    questionStartSec: 0,
    questionDurationSec: questionSpeechSec,
    optionsRevealStartSec,
    optionsRevealDurationSec,
    countdownStartSec,
    countdownDurationSec,
    answerRevealStartSec,
    answerRevealDurationSec,
    explanationStartSec,
    explanationDurationSec,
    outroStartSec,
    outroDurationSec,
    totalDurationSec,
    totalFrames
  };
}

export function calculateProjectTimeline(
  mcqItems: MCQItem[],
  fps = 30
): import('../../../types/render').ProjectTimingTimeline {
  let accumulatedSec = 0;
  let accumulatedFrames = 0;

  const segments = mcqItems.map((mcq, idx) => {
    const timeline = calculateTimeline(mcq, fps);
    const startSec = accumulatedSec;
    const startFrame = accumulatedFrames;

    accumulatedSec += timeline.totalDurationSec;
    accumulatedFrames += timeline.totalFrames;

    return {
      mcqIndex: idx,
      startSec,
      durationSec: timeline.totalDurationSec,
      startFrame,
      durationFrames: timeline.totalFrames,
      timeline
    };
  });

  return {
    segments,
    totalDurationSec: accumulatedSec,
    totalFrames: accumulatedFrames,
    fps
  };
}
