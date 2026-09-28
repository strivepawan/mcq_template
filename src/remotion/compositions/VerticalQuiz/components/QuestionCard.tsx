import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MCQItem, ThemeConfig } from '../../../../types/mcq';

interface QuestionCardProps {
  mcq: MCQItem;
  theme: ThemeConfig;
  index?: number;
  totalQuestions?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ mcq, theme, index = 1, totalQuestions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth bouncy spring entrance
  const scale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 }
  });

  const opacity = spring({
    frame,
    fps,
    config: { damping: 20 }
  });

  // Calculate dynamic font size based on question length
  const questionLength = mcq.question.length;
  let fontSizeClass = 'text-5xl leading-tight';
  if (questionLength > 120) {
    fontSizeClass = 'text-4xl leading-snug';
  } else if (questionLength > 80) {
    fontSizeClass = 'text-[44px] leading-tight';
  }

  const isLight = theme.background.type === 'solid' || theme.background.type === 'light';

  const badgeText = totalQuestions && totalQuestions > 1
    ? mcq.language === 'hi'
      ? `प्रश्न ${index} / ${totalQuestions}`
      : `Question ${index} of ${totalQuestions}`
    : mcq.language === 'hi'
      ? `प्रश्न ${index}`
      : `Question ${index}`;

  return (
    <div
      className="w-full max-w-[940px] mx-auto px-8"
      style={{
        transform: `scale(${scale})`,
        opacity
      }}
    >
      <div
        className="relative rounded-3xl p-8 backdrop-blur-xl border overflow-hidden transition-all duration-300"
        style={{
          backgroundColor: theme.colors.questionCardBg,
          borderColor: theme.colors.questionBorder,
          boxShadow: isLight
            ? '0 10px 30px -5px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)'
            : `0 20px 50px -10px rgba(0,0,0,0.5), 0 0 25px ${theme.colors.questionBorder}`
        }}
      >
        {/* Top Badges Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span
              className="px-4 py-1.5 rounded-full text-sm font-black tracking-widest uppercase border"
              style={{
                backgroundColor: theme.colors.badgeBg,
                color: theme.colors.primary,
                borderColor: theme.colors.questionBorder
              }}
            >
              {badgeText}
            </span>
            {mcq.category && (
              <span
                className="px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide border"
                style={{
                  backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)',
                  color: theme.colors.textSecondary,
                  borderColor: theme.colors.questionBorder
                }}
              >
                {mcq.category}
              </span>
            )}
          </div>

          {mcq.difficulty && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                mcq.difficulty === 'Hard'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : mcq.difficulty === 'Medium'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {mcq.language === 'hi'
                ? mcq.difficulty === 'Hard'
                  ? 'कठिन'
                  : mcq.difficulty === 'Medium'
                  ? 'मध्यम'
                  : 'सरल'
                : mcq.difficulty}
            </span>
          )}
        </div>

        {/* Question Text */}
        <h1
          className={`font-extrabold tracking-tight mb-2 text-left ${fontSizeClass}`}
          style={{
            fontFamily: theme.typography.fontFamily,
            color: theme.colors.textPrimary
          }}
        >
          {mcq.question}
        </h1>

        {/* Bottom subtle glow line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5 opacity-80"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.colors.primary}, ${theme.colors.secondary}, transparent)`
          }}
        />
      </div>
    </div>
  );
};
