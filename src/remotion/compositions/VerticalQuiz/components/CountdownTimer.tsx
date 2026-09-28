import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThemeConfig, CountdownStyle, LanguageCode } from '../../../../types/mcq';
import { AudioTimingTimeline } from '../../../../types/render';

interface CountdownTimerProps {
  theme: ThemeConfig;
  timeline: AudioTimingTimeline;
  style?: CountdownStyle;
  language?: LanguageCode;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  theme,
  timeline,
  style = 'radial_circle',
  language = 'en'
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeSec = frame / fps;
  const isCountdownActive =
    currentTimeSec >= timeline.countdownStartSec &&
    currentTimeSec < timeline.countdownStartSec + timeline.countdownDurationSec;

  const isAnswerRevealed = currentTimeSec >= timeline.answerRevealStartSec;

  if (currentTimeSec < timeline.countdownStartSec || isAnswerRevealed) {
    return null;
  }

  // Elapsed time in countdown
  const elapsedCountdownSec = Math.max(0, currentTimeSec - timeline.countdownStartSec);
  const remainingSec = Math.max(0, timeline.countdownDurationSec - elapsedCountdownSec);
  const displaySeconds = Math.ceil(remainingSec);

  // Normalized progress (1 -> 0)
  const progress = Math.max(0, Math.min(1, remainingSec / timeline.countdownDurationSec));

  // Radial circle params
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Pulse animation on every second tick
  const tickSubFrame = (frame - Math.round(timeline.countdownStartSec * fps)) % fps;
  const pulseScale = interpolate(tickSubFrame, [0, 5, 20], [1.15, 1.05, 1], {
    extrapolateRight: 'clamp'
  });

  const isLight = theme.background.type === 'solid' || theme.background.type === 'light';

  return (
    <div className="w-full flex justify-center items-center my-4">
      {style === 'radial_circle' && (
        <div
          className="relative flex items-center justify-center"
          style={{ transform: `scale(${pulseScale})` }}
        >
          <svg className="w-36 h-36 -rotate-90">
            {/* Background ring */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke={isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)'}
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated progress ring */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke={displaySeconds <= 1 ? '#f43f5e' : theme.colors.primary}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                filter: isLight
                  ? 'none'
                  : `drop-shadow(0 0 10px ${
                      displaySeconds <= 1 ? '#f43f5e' : theme.colors.primary
                    })`,
                transition: 'stroke-dashoffset 0.1s linear'
              }}
            />
          </svg>

          {/* Center number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-5xl font-black tracking-tighter"
              style={{
                color: displaySeconds <= 1 ? '#f43f5e' : theme.colors.textPrimary,
                textShadow: isLight ? 'none' : `0 0 20px ${theme.colors.primary}`
              }}
            >
              {displaySeconds}
            </span>
            <span
              className="text-[11px] font-bold tracking-widest uppercase"
              style={{ color: theme.colors.textSecondary }}
            >
              {language === 'hi' ? 'सेकंड' : 'Sec'}
            </span>
          </div>
        </div>
      )}

      {style === 'linear_bar' && (
        <div className="w-full max-w-[880px] px-8 flex flex-col items-center gap-2">
          <div
            className="flex justify-between w-full text-sm font-bold"
            style={{ color: theme.colors.textSecondary }}
          >
            <span>{language === 'hi' ? 'समय शेष' : 'Time Remaining'}</span>
            <span className="text-xl font-black" style={{ color: theme.colors.textPrimary }}>
              {displaySeconds}s
            </span>
          </div>
          <div
            className="w-full h-4 rounded-full overflow-hidden p-0.5 border"
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
              borderColor: theme.colors.optionCardBorder
            }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${theme.colors.secondary}, ${theme.colors.primary})`,
                boxShadow: isLight ? 'none' : `0 0 15px ${theme.colors.primary}`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
