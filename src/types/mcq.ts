export type OptionId = 'A' | 'B' | 'C' | 'D';
export type LanguageCode = 'en' | 'hi';

export interface MCQOption {
  id: OptionId;
  text: string;
}

export interface MCQItem {
  id: string;
  projectId: string;
  question: string;
  options: [MCQOption, MCQOption, MCQOption, MCQOption];
  correctAnswer: OptionId;
  waitTimeSeconds: number; // default: 3
  explanation?: string;
  category?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  language?: LanguageCode; // 'en' or 'hi'
  voiceoverEnabled: boolean;
  voiceName?: string;
  voiceRate?: number; // 0.8 - 1.4
  voicePitch?: number; // 0.8 - 1.2
  createdAt: number;
  updatedAt: number;
}

export type ThemeId = 
  | 'simple-white'
  | 'clean-light'
  | 'modern-dark'
  | 'cyberpunk-neon'
  | 'emerald-quiz'
  | 'sunset-vibrant'
  | 'academic-royal'
  | 'midnight-minimal';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  background: {
    type: 'solid' | 'gradient' | 'mesh' | 'dark' | 'radial' | 'light';
    from: string;
    via?: string;
    to: string;
    pattern?: 'dots' | 'grid' | 'waves' | 'none';
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    questionCardBg: string;
    questionBorder: string;
    optionCardBg: string;
    optionCardBorder: string;
    optionCardHover: string;
    correctBg: string;
    correctBorder: string;
    correctGlow: string;
    wrongDimOpacity: number;
    textPrimary: string;
    textSecondary: string;
    badgeBg: string;
  };
  typography: {
    fontFamily: string;
    questionWeight: string;
  };
}

export type CountdownStyle = 'radial_circle' | 'linear_bar' | 'digital_box' | 'floating_bubble';

export interface TemplateConfig {
  themeId: ThemeId;
  countdownStyle: CountdownStyle;
  aspectRatio: '9:16' | '1:1' | '16:9';
  width: number;
  height: number;
  fps: number;
  branding: {
    channelName: string;
    handle: string;
    showWatermark: boolean;
    showProgressBar: boolean;
    customLogoUrl?: string;
  };
  audio: {
    bgmTrack: string;
    bgmVolume: number; // 0 - 1
    sfxVolume: number; // 0 - 1
    sfxEnabled: boolean;
    voiceoverVolume: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  mcqItems: MCQItem[];
  templateConfig: TemplateConfig;
  createdAt: number;
  updatedAt: number;
}

export type ExportScope = 'single' | 'multi';

export interface ParsedMCQRow {
  index: number;
  question: string;
  options: [string, string, string, string];
  correctAnswer: OptionId;
  explanation: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: LanguageCode;
  waitTimeSeconds: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CSVImportResult {
  fileName: string;
  rows: ParsedMCQRow[];
  totalParsed: number;
  validCount: number;
  invalidCount: number;
}
