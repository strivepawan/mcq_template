import { ThemeConfig, ThemeId } from '../../types/mcq';

export const PRESET_THEMES: Record<ThemeId, ThemeConfig> = {
  'simple-white': {
    id: 'simple-white',
    name: 'Simple Clean White',
    description: 'Pure minimalist white aesthetic with crisp typography & elegant slate borders',
    background: {
      type: 'solid',
      from: '#ffffff',
      via: '#ffffff',
      to: '#ffffff',
      pattern: 'none'
    },
    colors: {
      primary: '#2563eb', // Royal Blue
      secondary: '#475569', // Slate
      accent: '#0284c7', // Sky
      questionCardBg: '#ffffff',
      questionBorder: '#e2e8f0',
      optionCardBg: '#ffffff',
      optionCardBorder: '#cbd5e1',
      optionCardHover: '#f8fafc',
      correctBg: 'linear-gradient(135deg, #10b981, #059669)',
      correctBorder: '#059669',
      correctGlow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
      wrongDimOpacity: 0.35,
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      badgeBg: 'rgba(37, 99, 235, 0.08)'
    },
    typography: {
      fontFamily: 'Inter, "Noto Sans Devanagari", Mukta, sans-serif',
      questionWeight: '700'
    }
  },
  'clean-light': {
    id: 'clean-light',
    name: 'Minimalist Studio Light',
    description: 'Soft porcelain gray with subtle micro-dots and indigo accents',
    background: {
      type: 'light',
      from: '#f8fafc',
      via: '#f1f5f9',
      to: '#e2e8f0',
      pattern: 'dots'
    },
    colors: {
      primary: '#4f46e5', // Indigo
      secondary: '#0ea5e9', // Sky
      accent: '#6366f1',
      questionCardBg: '#ffffff',
      questionBorder: '#e2e8f0',
      optionCardBg: '#ffffff',
      optionCardBorder: '#e2e8f0',
      optionCardHover: '#f8fafc',
      correctBg: 'linear-gradient(135deg, #10b981, #059669)',
      correctBorder: '#10b981',
      correctGlow: '0 10px 25px -5px rgba(16, 185, 129, 0.35)',
      wrongDimOpacity: 0.35,
      textPrimary: '#1e293b',
      textSecondary: '#64748b',
      badgeBg: 'rgba(79, 70, 229, 0.08)'
    },
    typography: {
      fontFamily: 'Outfit, "Noto Sans Devanagari", Mukta, sans-serif',
      questionWeight: '800'
    }
  },
  'cyberpunk-neon': {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    description: 'Electric cyan & neon magenta on deep space obsidian',
    background: {
      type: 'mesh',
      from: '#070512',
      via: '#120b29',
      to: '#05030a',
      pattern: 'grid'
    },
    colors: {
      primary: '#06b6d4', // Cyan
      secondary: '#ec4899', // Magenta
      accent: '#a855f7', // Purple
      questionCardBg: 'rgba(19, 14, 38, 0.75)',
      questionBorder: 'rgba(6, 182, 212, 0.4)',
      optionCardBg: 'rgba(15, 11, 30, 0.85)',
      optionCardBorder: 'rgba(168, 85, 247, 0.25)',
      optionCardHover: 'rgba(6, 182, 212, 0.2)',
      correctBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
      correctBorder: '#34d399',
      correctGlow: '0 0 35px rgba(52, 211, 153, 0.8)',
      wrongDimOpacity: 0.35,
      textPrimary: '#ffffff',
      textSecondary: '#cbd5e1',
      badgeBg: 'rgba(6, 182, 212, 0.2)'
    },
    typography: {
      fontFamily: 'Outfit, "Noto Sans Devanagari", Mukta, sans-serif',
      questionWeight: '800'
    }
  },
  'modern-dark': {
    id: 'modern-dark',
    name: 'Modern Studio Dark',
    description: 'Minimalist slate & vibrant indigo for professional creators',
    background: {
      type: 'gradient',
      from: '#090d16',
      via: '#0f172a',
      to: '#070a12',
      pattern: 'dots'
    },
    colors: {
      primary: '#6366f1', // Indigo
      secondary: '#38bdf8', // Sky
      accent: '#818cf8',
      questionCardBg: 'rgba(30, 41, 59, 0.7)',
      questionBorder: 'rgba(99, 102, 241, 0.35)',
      optionCardBg: 'rgba(15, 23, 42, 0.8)',
      optionCardBorder: 'rgba(51, 65, 85, 0.6)',
      optionCardHover: 'rgba(99, 102, 241, 0.2)',
      correctBg: 'linear-gradient(135deg, #10b981, #059669)',
      correctBorder: '#6ee7b7',
      correctGlow: '0 0 30px rgba(16, 185, 129, 0.7)',
      wrongDimOpacity: 0.3,
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      badgeBg: 'rgba(99, 102, 241, 0.2)'
    },
    typography: {
      fontFamily: 'Inter, "Noto Sans Devanagari", Mukta, sans-serif',
      questionWeight: '700'
    }
  },
  'emerald-quiz': {
    id: 'emerald-quiz',
    name: 'Emerald Quizmaster',
    description: 'Lush forest greens and gold accents for trivia masters',
    background: {
      type: 'radial',
      from: '#022c22',
      via: '#064e3b',
      to: '#021a14',
      pattern: 'none'
    },
    colors: {
      primary: '#10b981',
      secondary: '#fbbf24',
      accent: '#34d399',
      questionCardBg: 'rgba(6, 78, 59, 0.65)',
      questionBorder: 'rgba(52, 211, 153, 0.35)',
      optionCardBg: 'rgba(4, 47, 46, 0.85)',
      optionCardBorder: 'rgba(20, 184, 166, 0.3)',
      optionCardHover: 'rgba(16, 185, 129, 0.2)',
      correctBg: 'linear-gradient(135deg, #059669, #047857)',
      correctBorder: '#a7f3d0',
      correctGlow: '0 0 35px rgba(16, 185, 129, 0.85)',
      wrongDimOpacity: 0.3,
      textPrimary: '#ffffff',
      textSecondary: '#a7f3d0',
      badgeBg: 'rgba(251, 191, 36, 0.2)'
    },
    typography: {
      fontFamily: 'Outfit, "Noto Sans Devanagari", Mukta, sans-serif',
      questionWeight: '800'
    }
  },
  'sunset-vibrant': {
    id: 'sunset-vibrant',
    name: 'Sunset Horizon',
    description: 'Warm coral, amber, and deep dusk violet gradients',
    background: {
      type: 'gradient',
      from: '#2e1065',
      via: '#4c0519',
      to: '#18042b',
      pattern: 'waves'
    },
    colors: {
      primary: '#f97316', // Orange
      secondary: '#f43f5e', // Rose
      accent: '#fbbf24',
      questionCardBg: 'rgba(88, 28, 135, 0.6)',
      questionBorder: 'rgba(249, 115, 22, 0.4)',
      optionCardBg: 'rgba(46, 16, 101, 0.8)',
      optionCardBorder: 'rgba(244, 63, 94, 0.3)',
      optionCardHover: 'rgba(249, 115, 22, 0.2)',
      correctBg: 'linear-gradient(135deg, #10b981, #0d9488)',
      correctBorder: '#6ee7b7',
      correctGlow: '0 0 30px rgba(16, 185, 129, 0.75)',
      wrongDimOpacity: 0.35,
      textPrimary: '#ffffff',
      textSecondary: '#fed7aa',
      badgeBg: 'rgba(249, 115, 22, 0.2)'
    },
    typography: {
      fontFamily: 'Outfit, "Noto Sans Devanagari", Mukta, sans-serif',
      questionWeight: '800'
    }
  },
  'academic-royal': {
    id: 'academic-royal',
    name: 'Academic Royal Blue',
    description: 'Deep royal navy blue with gold crest highlights',
    background: {
      type: 'gradient',
      from: '#0f172a',
      via: '#1e1b4b',
      to: '#090d16',
      pattern: 'grid'
    },
    colors: {
      primary: '#3b82f6',
      secondary: '#eab308',
      accent: '#60a5fa',
      questionCardBg: 'rgba(30, 27, 75, 0.75)',
      questionBorder: 'rgba(234, 179, 8, 0.4)',
      optionCardBg: 'rgba(15, 23, 42, 0.85)',
      optionCardBorder: 'rgba(59, 130, 246, 0.3)',
      optionCardHover: 'rgba(59, 130, 246, 0.2)',
      correctBg: 'linear-gradient(135deg, #10b981, #059669)',
      correctBorder: '#fde047',
      correctGlow: '0 0 35px rgba(253, 224, 71, 0.6)',
      wrongDimOpacity: 0.3,
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      badgeBg: 'rgba(234, 179, 8, 0.2)'
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      questionWeight: '700'
    }
  },
  'midnight-minimal': {
    id: 'midnight-minimal',
    name: 'Midnight Monochrome',
    description: 'Pitch dark OLED with razor-sharp ice blue borders',
    background: {
      type: 'dark',
      from: '#000000',
      via: '#050508',
      to: '#000000',
      pattern: 'none'
    },
    colors: {
      primary: '#38bdf8',
      secondary: '#a855f7',
      accent: '#e2e8f0',
      questionCardBg: 'rgba(10, 10, 15, 0.9)',
      questionBorder: 'rgba(56, 189, 248, 0.3)',
      optionCardBg: 'rgba(15, 15, 20, 0.9)',
      optionCardBorder: 'rgba(255, 255, 255, 0.1)',
      optionCardHover: 'rgba(56, 189, 248, 0.2)',
      correctBg: 'linear-gradient(135deg, #22c55e, #16a34a)',
      correctBorder: '#86efac',
      correctGlow: '0 0 30px rgba(34, 197, 94, 0.7)',
      wrongDimOpacity: 0.2,
      textPrimary: '#ffffff',
      textSecondary: '#94a3b8',
      badgeBg: 'rgba(56, 189, 248, 0.15)'
    },
    typography: {
      fontFamily: 'JetBrains Mono, monospace',
      questionWeight: '700'
    }
  }
};
