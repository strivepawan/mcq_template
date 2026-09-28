import React, { useEffect } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  Film,
  Sparkles,
  RefreshCw,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRenderStore, getResolutionForQuality } from '../../store/useRenderStore';
import { useProjectStore } from '../../store/useProjectStore';

export const ExportModal: React.FC = () => {
  const { currentProject } = useProjectStore();
  const template = currentProject?.templateConfig;
  const aspectRatio = template?.aspectRatio || '9:16';

  const {
    isModalOpen,
    closeExportModal,
    progress,
    exportedBlobUrl,
    downloadFileName,
    cancelExport,
    exportQuality
  } = useRenderStore();

  const qualitySpec = getResolutionForQuality(aspectRatio, exportQuality);
  const width = qualitySpec.width;
  const height = qualitySpec.height;

  useEffect(() => {
    if (progress.status === 'completed' && exportedBlobUrl) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [progress.status, exportedBlobUrl]);

  if (!isModalOpen) return null;

  const handleDownload = () => {
    if (!exportedBlobUrl) return;
    const a = document.createElement('a');
    a.href = exportedBlobUrl;
    a.download = downloadFileName || 'mcq-quiz-video.mp4';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-[#0f1422] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                {progress.status === 'completed' ? 'Video Ready to Download!' : 'Rendering MP4 Video'}
              </h2>
              <p className="text-xs text-slate-400">
                100% Offline client-side hardware-accelerated video rendering
              </p>
            </div>
          </div>

          <button
            onClick={closeExportModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Content */}
        {progress.status === 'rendering' || progress.status === 'preparing' || progress.status === 'encoding' ? (
          <div className="flex flex-col gap-5 py-4">
            {/* Animated Progress Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  {progress.status === 'preparing'
                    ? 'Preparing Video Pipeline...'
                    : progress.status === 'encoding'
                    ? 'Finalizing MP4 Video...'
                    : `Rendering Frame ${progress.currentFrame} / ${progress.totalFrames}`}
                </span>
                <span className="font-mono text-indigo-400 text-sm font-black">
                  {progress.progress}%
                </span>
              </div>

              <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-150 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/50"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>

            {/* Metrics stats */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Resolution
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {width} × {height} ({qualitySpec.badge})
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Elapsed Time
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {progress.timeElapsedSeconds}s
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Est. Remaining
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ~{progress.estimatedRemainingSeconds}s
                </span>
              </div>
            </div>

            <button
              onClick={cancelExport}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Cancel Render
            </button>
          </div>
        ) : progress.status === 'completed' && exportedBlobUrl ? (
          <div className="flex flex-col gap-5 py-2">
            {/* Video Preview */}
            <div
              className={`relative mx-auto rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-xl bg-black ${
                aspectRatio === '16:9'
                  ? 'aspect-[16/9] w-full max-h-56'
                  : aspectRatio === '1:1'
                  ? 'aspect-square max-h-56'
                  : 'aspect-[9/16] max-h-64'
              }`}
            >
              <video
                src={exportedBlobUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 px-2">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                H.264 MP4 Export Successful!
              </span>
              <span className="font-mono text-slate-400 font-semibold">
                {formatFileSize(progress.fileSizeBytes)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 border border-emerald-300/40 transition transform active:scale-95"
              >
                <Download className="w-5 h-5" />
                <span>Download MP4 File</span>
              </button>
            </div>
          </div>
        ) : progress.status === 'error' ? (
          <div className="flex flex-col gap-4 py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Export Error</h3>
              <p className="text-xs text-rose-300">{progress.errorMessage || 'An error occurred during video rendering.'}</p>
            </div>
            <button
              onClick={closeExportModal}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
