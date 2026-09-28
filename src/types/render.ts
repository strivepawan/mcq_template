export type RenderStatus = 'idle' | 'preparing' | 'rendering' | 'encoding' | 'completed' | 'error';

export interface RenderProgress {
  status: RenderStatus;
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  fps: number;
  timeElapsedSeconds: number;
  estimatedRemainingSeconds: number;
  errorMessage?: string;
  videoBlobUrl?: string;
  videoFileName?: string;
  fileSizeBytes?: number;
}

export type ExportQuality = '720p' | '1080p' | '2k' | '4k';

export interface RenderJobOptions {
  width: number;
  height: number;
  fps: number;
  quality: ExportQuality | 'high' | 'ultra' | 'medium';
  bitrate?: number;
}

export interface AudioTimingTimeline {
  questionStartSec: number;
  questionDurationSec: number;
  optionsRevealStartSec: number;
  optionsRevealDurationSec: number;
  countdownStartSec: number;
  countdownDurationSec: number;
  answerRevealStartSec: number;
  answerRevealDurationSec: number;
  explanationStartSec: number;
  explanationDurationSec: number;
  outroStartSec: number;
  outroDurationSec: number;
  totalDurationSec: number;
  totalFrames: number;
}

export interface ProjectQuestionSegment {
  mcqIndex: number;
  startSec: number;
  durationSec: number;
  startFrame: number;
  durationFrames: number;
  timeline: AudioTimingTimeline;
}

export interface ProjectTimingTimeline {
  segments: ProjectQuestionSegment[];
  totalDurationSec: number;
  totalFrames: number;
  fps: number;
}
