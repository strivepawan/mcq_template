import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MCQItem, ThemeConfig } from '../../../../types/mcq';
import { AudioTimingTimeline } from '../../../../types/render';

interface AnswerRevealProps {
  mcq: MCQItem;
  theme: ThemeConfig;
  timeline: AudioTimingTimeline;
}

export const AnswerReveal: React.FC<AnswerRevealProps> = ({ mcq, theme, timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeSec = frame / fps;
  if (currentTimeSec < timeline.answerRevealStartSec) {
    return null;
  }

  const revealFrame = frame - Math.round(timeline.answerRevealStartSec * fps);
  const bannerScale = spring({
    frame: revealFrame,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 160 }
  });

  const isExplanationActive =
    mcq.explanation &&
    mcq.explanation.trim().length > 0 &&
    currentTimeSec >= timeline.explanationStartSec;

  const explFrame = isExplanationActive
    ? frame - Math.round(timeline.explanationStartSec * fps)
    : 0;

  const explSlide = isExplanationActive
    ? spring({
        frame: explFrame,
        fps,
        config: { damping: 14, mass: 0.7, stiffness: 130 }
      })
    : 0;

  return (
    <div className="w-full max-w-[940px] mx-auto px-8 my-2 flex flex-col gap-4">
      {/* Celebratory Banner */}
      <div
        className="w-full rounded-2xl py-3.5 px-6 border backdrop-blur-xl flex items-center justify-between shadow-2xl"
        style={{
          transform: `scale(${bannerScale})`,
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.95))',
          borderColor: '#6ee7b7',
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.6)'
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <span className="text-xl font-black tracking-wider uppercase text-white">
            {mcq.language === 'hi'
              ? `सही उत्तर: विकल्प ${mcq.correctAnswer}`
              : `Correct: Option ${mcq.correctAnswer}`}
          </span>
        </div>
        <span className="text-sm font-extrabold uppercase tracking-widest text-emerald-100 bg-emerald-800/40 px-3 py-1 rounded-full border border-emerald-400/40">
          {mcq.language === 'hi' ? 'उत्तर' : 'Answer Revealed'}
        </span>
      </div>

      {/* Optional Explanation Card */}
      {isExplanationActive && (
        <div
          className="rounded-2xl p-6 border backdrop-blur-xl transition-all"
          style={{
            transform: `translateY(${(1 - explSlide) * 40}px)`,
            opacity: explSlide,
            backgroundColor: theme.colors.questionCardBg,
            borderColor: theme.colors.questionBorder,
            boxShadow:
              theme.background.type === 'solid' || theme.background.type === 'light'
                ? '0 10px 25px -5px rgba(0,0,0,0.06)'
                : '0 15px 35px -5px rgba(0,0,0,0.5)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💡</span>
            <span
              className="text-xs font-black tracking-widest uppercase"
              style={{ color: theme.colors.primary }}
            >
              {mcq.language === 'hi' ? 'स्पष्टीकरण:' : 'Why this is correct:'}
            </span>
          </div>
          <p
            className="text-2xl font-semibold leading-relaxed text-left"
            style={{ color: theme.colors.textPrimary }}
          >
            {mcq.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
