import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MCQItem, ThemeConfig } from '../../../../types/mcq';
import { AudioTimingTimeline } from '../../../../types/render';

interface OptionGridProps {
  mcq: MCQItem;
  theme: ThemeConfig;
  timeline: AudioTimingTimeline;
}

export const OptionGrid: React.FC<OptionGridProps> = ({ mcq, theme, timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeSec = frame / fps;
  const isAnswerRevealed = currentTimeSec >= timeline.answerRevealStartSec;

  return (
    <div className="w-full max-w-[940px] mx-auto px-8 flex flex-col gap-4">
      {mcq.options.map((option, idx) => {
        // Stagger entrance: each option enters 6 frames apart
        const delayFrame = Math.round(timeline.optionsRevealStartSec * fps) + idx * 6;
        const entryProgress = spring({
          frame: Math.max(0, frame - delayFrame),
          fps,
          config: { damping: 15, mass: 0.7, stiffness: 140 }
        });

        const isCorrect = option.id === mcq.correctAnswer;

        // Visual states during Answer Reveal
        let cardBg = theme.colors.optionCardBg;
        let cardBorder = theme.colors.optionCardBorder;
        let cardGlow = 'none';
        let cardScale = 1;
        let cardOpacity = entryProgress;

        if (isAnswerRevealed) {
          if (isCorrect) {
            // Correct answer celebration pulse
            const revealFrames = frame - Math.round(timeline.answerRevealStartSec * fps);
            const bounce = spring({
              frame: revealFrames,
              fps,
              config: { damping: 12, mass: 0.6, stiffness: 180 }
            });
            cardBg = theme.colors.correctBg;
            cardBorder = theme.colors.correctBorder;
            cardGlow = theme.colors.correctGlow;
            cardScale = 1 + bounce * 0.05;
            cardOpacity = 1;
          } else {
            // Wrong answers dim down
            cardOpacity = theme.colors.wrongDimOpacity;
            cardScale = 0.98;
          }
        }

        const isLight = theme.background.type === 'solid' || theme.background.type === 'light';
        const translateY = (1 - entryProgress) * 40;

        return (
          <div
            key={option.id}
            className="relative rounded-2xl p-5 border backdrop-blur-md transition-all duration-300 flex items-center justify-between overflow-hidden"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              boxShadow: isAnswerRevealed && isCorrect
                ? cardGlow
                : isLight
                ? '0 4px 20px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)'
                : '0 10px 30px -5px rgba(0,0,0,0.4)',
              transform: `translateY(${translateY}px) scale(${cardScale})`,
              opacity: cardOpacity
            }}
          >
            {/* Left Option Content */}
            <div className="flex items-center gap-5">
              {/* Option Letter Badge (A, B, C, D) */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl border shadow-sm transition-colors"
                style={{
                  backgroundColor: isAnswerRevealed && isCorrect
                    ? '#ffffff'
                    : isLight
                    ? '#f1f5f9'
                    : 'rgba(255,255,255,0.1)',
                  color: isAnswerRevealed && isCorrect
                    ? '#047857'
                    : isLight
                    ? theme.colors.primary
                    : '#ffffff',
                  borderColor: isAnswerRevealed && isCorrect
                    ? '#ffffff'
                    : theme.colors.optionCardBorder
                }}
              >
                {option.id}
              </div>

              {/* Option Text */}
              <span
                className="font-bold text-3xl tracking-tight text-left"
                style={{
                  color: isAnswerRevealed && isCorrect ? '#ffffff' : theme.colors.textPrimary
                }}
              >
                {option.text}
              </span>
            </div>

            {/* Right Status Indicator on Reveal */}
            {isAnswerRevealed && isCorrect && (
              <div className="w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg animate-bounce">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
