import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { ThemeConfig } from '../../../../types/mcq';

interface BackgroundLayerProps {
  theme: ThemeConfig;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ theme }) => {
  const frame = useCurrentFrame();

  const isLight = theme.background.type === 'solid' || theme.background.type === 'light';

  // Subtle floating background orbs animation (for gradient/mesh/radial themes)
  const orb1Y = interpolate(frame, [0, 150, 300], [0, 30, 0], { extrapolateRight: 'clamp' });
  const orb2X = interpolate(frame, [0, 150, 300], [0, -25, 0], { extrapolateRight: 'clamp' });

  const backgroundStyle =
    theme.background.type === 'solid'
      ? theme.background.from
      : `radial-gradient(circle at 50% 20%, ${theme.background.via || theme.background.from} 0%, ${theme.background.to} 100%)`;

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{
        background: backgroundStyle
      }}
    >
      {/* Background Animated Gradient Blobs - only for rich dark / gradient themes */}
      {!isLight && (
        <>
          <div 
            className="absolute w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-40"
            style={{
              backgroundColor: theme.colors.primary,
              top: '-10%',
              left: '20%',
              transform: `translateY(${orb1Y}px)`
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-30"
            style={{
              backgroundColor: theme.colors.secondary,
              bottom: '10%',
              right: '-10%',
              transform: `translateX(${orb2X}px)`
            }}
          />
        </>
      )}

      {/* Pattern Overlay */}
      {theme.background.pattern === 'grid' && (
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, ${theme.colors.primary} 1px, transparent 1px), linear-gradient(to bottom, ${theme.colors.primary} 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      )}

      {theme.background.pattern === 'dots' && (
        <div 
          className={`absolute inset-0 ${isLight ? 'opacity-25' : 'opacity-20'} pointer-events-none`}
          style={{
            backgroundImage: `radial-gradient(${theme.colors.accent} 1.5px, transparent 1.5px)`,
            backgroundSize: '32px 32px'
          }}
        />
      )}
    </div>
  );
};
