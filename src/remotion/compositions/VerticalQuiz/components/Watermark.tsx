import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { TemplateConfig, ThemeConfig, LanguageCode } from '../../../../types/mcq';
import { AudioTimingTimeline } from '../../../../types/render';

interface WatermarkProps {
  template: TemplateConfig;
  theme: ThemeConfig;
  timeline: AudioTimingTimeline;
  language?: LanguageCode;
}

export const Watermark: React.FC<WatermarkProps> = ({ template, theme, timeline, language = 'en' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeSec = frame / fps;
  const overallProgress = Math.min(1, Math.max(0, currentTimeSec / timeline.totalDurationSec));

  const isLight = theme.background.type === 'solid' || theme.background.type === 'light';

  return (
    <>
      {/* Top Thin Progress Bar */}
      {template.branding.showProgressBar && (
        <div
          className="absolute top-0 left-0 right-0 h-2 z-50 overflow-hidden"
          style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)' }}
        >
          <div
            className="h-full transition-all"
            style={{
              width: `${overallProgress * 100}%`,
              background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              boxShadow: isLight ? 'none' : `0 0 10px ${theme.colors.primary}`
            }}
          />
        </div>
      )}

      {/* Top Header Branding */}
      <div className="w-full max-w-[940px] mx-auto px-8 pt-10 pb-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-md border"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#ffffff'
            }}
          >
            ⚡
          </div>
          <div className="flex flex-col text-left">
            <span
              className="font-extrabold text-2xl tracking-tight"
              style={{ color: theme.colors.textPrimary }}
            >
              {template.branding.channelName || (language === 'hi' ? 'क्विज़ मास्टर' : 'QUIZ MASTER')}
            </span>
            <span
              className="text-xs font-bold tracking-wider"
              style={{ color: theme.colors.textSecondary }}
            >
              {template.branding.handle || '@dailyquiz'}
            </span>
          </div>
        </div>

        {template.branding.showWatermark && (
          <div
            className="px-3 py-1 rounded-full border backdrop-blur-md text-[11px] font-bold tracking-widest uppercase"
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.4)',
              borderColor: theme.colors.questionBorder,
              color: theme.colors.textSecondary
            }}
          >
            HD Quiz
          </div>
        )}
      </div>

      {/* Bottom Subscribe / Follow Badge */}
      <div className="w-full max-w-[940px] mx-auto px-8 pb-10 pt-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: theme.colors.textSecondary }}
          >
            {language === 'hi'
              ? 'रोककर उत्तर दें • अपना स्कोर कमेंट करें'
              : 'Pause to solve • Comment your score'}
          </span>
        </div>

        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl backdrop-blur-md border text-xs font-black tracking-wider transition-all"
          style={{
            backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.1)',
            borderColor: theme.colors.optionCardBorder,
            color: theme.colors.textPrimary,
            boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          <span>{language === 'hi' ? '🔔 फॉलो करें' : '🔔 FOLLOW'}</span>
        </div>
      </div>
    </>
  );
};
