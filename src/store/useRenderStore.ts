import { create } from 'zustand';
import { RenderProgress, RenderJobOptions, ExportQuality } from '../types/render';
import { MCQItem, TemplateConfig, ExportScope } from '../types/mcq';
import { videoEncoderService } from '../services/videoEncoderService';

export function getResolutionForQuality(
  aspectRatio: '9:16' | '16:9' | '1:1',
  quality: ExportQuality
): { width: number; height: number; bitrate: number; label: string; badge: string } {
  if (aspectRatio === '16:9') {
    switch (quality) {
      case '4k':
        return { width: 3840, height: 2160, bitrate: 32_000_000, label: '4K Ultra HD (3840×2160)', badge: '4K UHD' };
      case '2k':
        return { width: 2560, height: 1440, bitrate: 16_000_000, label: '2K QHD (2560×1440)', badge: '2K QHD' };
      case '720p':
        return { width: 1280, height: 720, bitrate: 4_000_000, label: '720p HD (1280×720)', badge: '720p' };
      case '1080p':
      default:
        return { width: 1920, height: 1080, bitrate: 8_000_000, label: '1080p Full HD (1920×1080)', badge: '1080p FHD' };
    }
  } else if (aspectRatio === '1:1') {
    switch (quality) {
      case '4k':
        return { width: 2160, height: 2160, bitrate: 24_000_000, label: '4K Square (2160×2160)', badge: '4K UHD' };
      case '2k':
        return { width: 1440, height: 1440, bitrate: 12_000_000, label: '2K Square (1440×1440)', badge: '2K QHD' };
      case '720p':
        return { width: 720, height: 720, bitrate: 3_000_000, label: '720p Square (720×720)', badge: '720p' };
      case '1080p':
      default:
        return { width: 1080, height: 1080, bitrate: 6_000_000, label: '1080p Square (1080×1080)', badge: '1080p FHD' };
    }
  } else {
    // 9:16 Vertical
    switch (quality) {
      case '4k':
        return { width: 2160, height: 3840, bitrate: 32_000_000, label: '4K Ultra HD (2160×3840)', badge: '4K UHD' };
      case '2k':
        return { width: 1440, height: 2560, bitrate: 16_000_000, label: '2K QHD (1440×2560)', badge: '2K QHD' };
      case '720p':
        return { width: 720, height: 1280, bitrate: 4_000_000, label: '720p HD (720×1280)', badge: '720p' };
      case '1080p':
      default:
        return { width: 1080, height: 1920, bitrate: 8_000_000, label: '1080p Full HD (1080×1920)', badge: '1080p FHD' };
    }
  }
}

interface RenderState {
  isModalOpen: boolean;
  exportScope: ExportScope;
  exportQuality: ExportQuality;
  progress: RenderProgress;
  exportedBlobUrl: string | null;
  downloadFileName: string;

  // Actions
  openExportModal: () => void;
  closeExportModal: () => void;
  setExportScope: (scope: ExportScope) => void;
  setExportQuality: (quality: ExportQuality) => void;
  startExport: (mcq: MCQItem, template: TemplateConfig, options?: Partial<RenderJobOptions>) => Promise<void>;
  startProjectExport: (
    mcqs: MCQItem[],
    template: TemplateConfig,
    options?: Partial<RenderJobOptions>,
    projectName?: string
  ) => Promise<void>;
  cancelExport: () => void;
  resetProgress: () => void;
}

const initialProgress: RenderProgress = {
  status: 'idle',
  progress: 0,
  currentFrame: 0,
  totalFrames: 0,
  fps: 30,
  timeElapsedSeconds: 0,
  estimatedRemainingSeconds: 0
};

export const useRenderStore = create<RenderState>((set, get) => ({
  isModalOpen: false,
  exportScope: 'single',
  exportQuality: '1080p',
  progress: initialProgress,
  exportedBlobUrl: null,
  downloadFileName: 'quiz-video.mp4',

  openExportModal: () => {
    set({ isModalOpen: true });
  },

  setExportQuality: (quality: ExportQuality) => {
    set({ exportQuality: quality });
  },

  closeExportModal: () => {
    const { progress } = get();
    if (progress.status === 'rendering') {
      videoEncoderService.cancelRender();
    }
    set({ isModalOpen: false });
  },

  setExportScope: (scope: ExportScope) => {
    set({ exportScope: scope });
  },

  resetProgress: () => {
    set({ progress: initialProgress, exportedBlobUrl: null });
  },

  cancelExport: () => {
    videoEncoderService.cancelRender();
    set({
      progress: {
        ...get().progress,
        status: 'idle',
        errorMessage: 'Render cancelled'
      }
    });
  },

  startExport: async (mcq: MCQItem, template: TemplateConfig, options?: Partial<RenderJobOptions>) => {
    const quality = options?.quality && typeof options.quality === 'string' && ['720p', '1080p', '2k', '4k'].includes(options.quality)
      ? (options.quality as ExportQuality)
      : get().exportQuality;

    const spec = getResolutionForQuality(template.aspectRatio || '9:16', quality);
    const fileName = `mcq-${mcq.category || 'quiz'}-${quality}-${Date.now()}.mp4`.toLowerCase().replace(/\s+/g, '-');

    set({
      exportScope: 'single',
      exportedBlobUrl: null,
      downloadFileName: fileName,
      progress: {
        status: 'preparing',
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
        fps: options?.fps || template.fps || 30,
        timeElapsedSeconds: 0,
        estimatedRemainingSeconds: 0
      }
    });

    try {
      const renderOptions: RenderJobOptions = {
        width: options?.width || spec.width,
        height: options?.height || spec.height,
        fps: options?.fps || template.fps || 30,
        quality,
        bitrate: options?.bitrate || spec.bitrate
      };

      const blob = await videoEncoderService.renderMCQToMP4(
        mcq,
        template,
        renderOptions,
        (p) => set({ progress: p })
      );

      const url = URL.createObjectURL(blob);
      set({
        exportedBlobUrl: url,
        progress: {
          ...get().progress,
          status: 'completed',
          progress: 100,
          fileSizeBytes: blob.size,
          videoBlobUrl: url
        }
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown render error';
      console.error('Render failed:', err);
      set({
        progress: {
          ...get().progress,
          status: 'error',
          errorMessage: errorMsg
        }
      });
    }
  },

  startProjectExport: async (
    mcqs: MCQItem[],
    template: TemplateConfig,
    options?: Partial<RenderJobOptions>,
    projectName?: string
  ) => {
    const quality = options?.quality && typeof options.quality === 'string' && ['720p', '1080p', '2k', '4k'].includes(options.quality)
      ? (options.quality as ExportQuality)
      : get().exportQuality;

    const spec = getResolutionForQuality(template.aspectRatio || '9:16', quality);
    const cleanName = (projectName || 'full-quiz-video').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `${cleanName}-${mcqs.length}q-${quality}-${Date.now()}.mp4`;

    set({
      exportScope: 'multi',
      exportedBlobUrl: null,
      downloadFileName: fileName,
      progress: {
        status: 'preparing',
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
        fps: options?.fps || template.fps || 30,
        timeElapsedSeconds: 0,
        estimatedRemainingSeconds: 0
      }
    });

    try {
      const renderOptions: RenderJobOptions = {
        width: options?.width || spec.width,
        height: options?.height || spec.height,
        fps: options?.fps || template.fps || 30,
        quality,
        bitrate: options?.bitrate || spec.bitrate
      };

      const blob = await videoEncoderService.renderProjectToMP4(
        mcqs,
        template,
        renderOptions,
        (p) => set({ progress: p })
      );

      const url = URL.createObjectURL(blob);
      set({
        exportedBlobUrl: url,
        progress: {
          ...get().progress,
          status: 'completed',
          progress: 100,
          fileSizeBytes: blob.size,
          videoBlobUrl: url
        }
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown render error';
      console.error('Multi-question render failed:', err);
      set({
        progress: {
          ...get().progress,
          status: 'error',
          errorMessage: errorMsg
        }
      });
    }
  }
}));
