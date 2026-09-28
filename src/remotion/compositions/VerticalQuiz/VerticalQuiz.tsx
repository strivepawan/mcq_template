import React from 'react';
import { MCQItem, TemplateConfig } from '../../../types/mcq';
import { PRESET_THEMES } from '../../themes/presets';
import { calculateTimeline } from './timing';
import { BackgroundLayer } from './components/BackgroundLayer';
import { QuestionCard } from './components/QuestionCard';
import { OptionGrid } from './components/OptionGrid';
import { CountdownTimer } from './components/CountdownTimer';
import { AnswerReveal } from './components/AnswerReveal';
import { Watermark } from './components/Watermark';
import { AudioSequencer } from './components/AudioSequencer';

export interface VerticalQuizProps {
  mcq: MCQItem;
  template: TemplateConfig;
  enableLiveAudio?: boolean;
  index?: number;
  totalQuestions?: number;
}

export const VerticalQuiz: React.FC<VerticalQuizProps> = ({
  mcq,
  template,
  enableLiveAudio = true,
  index = 1,
  totalQuestions
}) => {
  const theme = PRESET_THEMES[template.themeId] || PRESET_THEMES['cyberpunk-neon'];
  const timeline = calculateTimeline(mcq, template.fps || 30);

  return (
    <div
      className="relative w-full h-full flex flex-col justify-between select-none overflow-hidden"
      style={{
        fontFamily: theme.typography.fontFamily,
        color: theme.colors.textPrimary
      }}
    >
      {/* Background with glowing light orbs and grid patterns */}
      <BackgroundLayer theme={theme} />

      {/* Audio FX Synchronization */}
      <AudioSequencer
        mcq={mcq}
        template={template}
        timeline={timeline}
        enableLiveAudio={enableLiveAudio}
      />

      {/* Header & Watermark */}
      <Watermark
        template={template}
        theme={theme}
        timeline={timeline}
        language={mcq.language}
      />

      {/* Main Quiz Content Area */}
      <div className="relative z-30 flex-1 flex flex-col justify-center items-center gap-6 my-auto">
        {/* Question Card */}
        <QuestionCard
          mcq={mcq}
          theme={theme}
          index={index}
          totalQuestions={totalQuestions}
        />

        {/* Countdown Timer or Linear Progress */}
        <CountdownTimer
          theme={theme}
          timeline={timeline}
          style={template.countdownStyle}
          language={mcq.language}
        />

        {/* 4 Options Grid (A, B, C, D) */}
        <OptionGrid mcq={mcq} theme={theme} timeline={timeline} />

        {/* Answer Reveal & Explanation */}
        <AnswerReveal mcq={mcq} theme={theme} timeline={timeline} />
      </div>

      {/* Footer is rendered inside Watermark */}
    </div>
  );
};
