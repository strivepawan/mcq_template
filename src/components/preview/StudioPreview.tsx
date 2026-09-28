import React, { useRef, useState, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Sparkles,
  Layers,
  Film
} from 'lucide-react';
import { VerticalQuiz } from '../../remotion/compositions/VerticalQuiz/VerticalQuiz';
import { MultiQuizComposition } from '../../remotion/compositions/VerticalQuiz/MultiQuizComposition';
import { calculateTimeline, calculateProjectTimeline } from '../../remotion/compositions/VerticalQuiz/timing';
import { useProjectStore } from '../../store/useProjectStore';
import { useTemplateStore } from '../../store/useTemplateStore';
import { useRenderStore, getResolutionForQuality } from '../../store/useRenderStore';
import { ttsService } from '../../services/ttsService';

export const StudioPreview: React.FC = () => {
  const { currentProject, activeMcqIndex } = useProjectStore();
  const { updateAspectRatio } = useTemplateStore();
  const { openExportModal, startExport, startProjectExport, exportQuality, setExportQuality } = useRenderStore();

  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [enableSound, setEnableSound] = useState(true);
  const [previewScope, setPreviewScope] = useState<'single' | 'multi'>('single');

  const mcq = currentProject?.mcqItems[activeMcqIndex];
  const template = currentProject?.templateConfig;
  const fps = template?.fps || 30;

  const aspectRatio = template?.aspectRatio || '9:16';
  const qualitySpec = getResolutionForQuality(aspectRatio, exportQuality);
  const compositionWidth = template?.width || (aspectRatio === '16:9' ? 1920 : 1080);
  const compositionHeight = template?.height || (aspectRatio === '16:9' ? 1080 : aspectRatio === '1:1' ? 1080 : 1920);

  const singleTimeline = mcq ? calculateTimeline(mcq, fps) : null;
  const projectTimeline = currentProject ? calculateProjectTimeline(currentProject.mcqItems, fps) : null;

  const totalFrames = previewScope === 'multi'
    ? projectTimeline?.totalFrames || 300
    : singleTimeline?.totalFrames || 300;

  // Stop voice when component unmounts, MCQ changes, or scope changes
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, [activeMcqIndex, previewScope]);

  if (!currentProject || !mcq || !template || !singleTimeline || !projectTimeline) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 font-medium">
        Select or add an MCQ to preview video.
      </div>
    );
  }

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (playerRef.current.isPlaying()) {
      playerRef.current.pause();
      setIsPlaying(false);
      ttsService.stop();
    } else {
      playerRef.current.play();
      setIsPlaying(true);

      // Play clean synchronized voiceover if at start in single question mode
      if (previewScope === 'single' && currentFrame < 15 && mcq.voiceoverEnabled && enableSound) {
        const isHindi = mcq.language === 'hi';
        const defaultVoice = isHindi ? 'hi-IN-SwaraNeural' : 'en-US-JennyNeural';
        const textToSpeak = isHindi
          ? `${mcq.question}। विकल्प ए: ${mcq.options[0].text}। विकल्प बी: ${mcq.options[1].text}। विकल्प सी: ${mcq.options[2].text}। विकल्प डी: ${mcq.options[3].text}।`
          : `${mcq.question}. Option A: ${mcq.options[0].text}. Option B: ${mcq.options[1].text}. Option C: ${mcq.options[2].text}. Option D: ${mcq.options[3].text}.`;
        ttsService.speak(textToSpeak, {
          voiceName: mcq.voiceName || defaultVoice,
          rate: mcq.voiceRate ?? 1.0,
          pitch: mcq.voicePitch ?? 1.0
        });
      }
    }
  };

  const handleRestart = () => {
    if (!playerRef.current) return;
    ttsService.stop();
    playerRef.current.seekTo(0);
    playerRef.current.play();
    setIsPlaying(true);

    if (previewScope === 'single' && mcq.voiceoverEnabled && enableSound) {
      const isHindi = mcq.language === 'hi';
      const defaultVoice = isHindi ? 'hi-IN-SwaraNeural' : 'en-US-JennyNeural';
      const textToSpeak = isHindi
        ? `${mcq.question}। विकल्प ए: ${mcq.options[0].text}। विकल्प बी: ${mcq.options[1].text}। विकल्प सी: ${mcq.options[2].text}। विकल्प डी: ${mcq.options[3].text}।`
        : `${mcq.question}. Option A: ${mcq.options[0].text}. Option B: ${mcq.options[1].text}. Option C: ${mcq.options[2].text}. Option D: ${mcq.options[3].text}.`;
      ttsService.speak(textToSpeak, {
        voiceName: mcq.voiceName || defaultVoice,
        rate: mcq.voiceRate ?? 1.0,
        pitch: mcq.voicePitch ?? 1.0
      });
    }
  };

  const stepFrame = (delta: number) => {
    if (!playerRef.current) return;
    ttsService.stop();
    const target = Math.max(0, Math.min(totalFrames - 1, currentFrame + delta));
    playerRef.current.seekTo(target);
    setCurrentFrame(target);
  };

  const formatTime = (frame: number) => {
    const totalSec = Math.floor(frame / fps);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col items-center justify-between p-4 bg-[#0a0e17] select-none">
      {/* Top Preview Bar */}
      <div className="w-full flex items-center justify-between px-2 pb-3 border-b border-slate-800/80 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope Selector: Single Question vs Full Video */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1">
            <button
              onClick={() => {
                ttsService.stop();
                setPreviewScope('single');
                setCurrentFrame(0);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                previewScope === 'single'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Shorts (Q{activeMcqIndex + 1})
            </button>
            <button
              onClick={() => {
                ttsService.stop();
                setPreviewScope('multi');
                setCurrentFrame(0);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                previewScope === 'multi'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Video ({currentProject.mcqItems.length} Qs)</span>
            </button>
          </div>

          {/* Ratio Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1">
            <button
              onClick={() => updateAspectRatio('9:16')}
              title="9:16 Vertical (Reels / Shorts / TikTok)"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                aspectRatio === '9:16'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              9:16 Reels
            </button>
            <button
              onClick={() => updateAspectRatio('16:9')}
              title="16:9 Landscape (YouTube Standard Video)"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                aspectRatio === '16:9'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              16:9 YouTube
            </button>
            <button
              onClick={() => updateAspectRatio('1:1')}
              title="1:1 Square (Instagram Feed / Post)"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                aspectRatio === '1:1'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1:1 Square
            </button>
          </div>

          {/* Export Quality Selector Pill */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1" title="Select Video Export Quality">
            {(['720p', '1080p', '2k', '4k'] as const).map((q) => {
              const spec = getResolutionForQuality(aspectRatio, q);
              const isActive = exportQuality === q;
              return (
                <button
                  key={q}
                  onClick={() => setExportQuality(q)}
                  title={`${spec.label} • ${spec.bitrate / 1_000_000} Mbps`}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    isActive
                      ? q === '4k'
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm ring-1 ring-amber-400/50'
                        : q === '2k'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                        : 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {q.toUpperCase()}
                  {q === '4k' && <Sparkles className="w-2.5 h-2.5" />}
                </button>
              );
            })}
          </div>

          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-slate-400">
            {formatTime(currentFrame)} / {formatTime(totalFrames)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEnableSound(!enableSound);
              if (enableSound) ttsService.stop();
            }}
            title={enableSound ? 'Mute SFX & Audio' : 'Enable SFX & Audio'}
            className={`p-1.5 rounded-lg border text-xs transition ${
              enableSound
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {enableSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {previewScope === 'single' ? (
            <button
              onClick={() => {
                ttsService.stop();
                openExportModal();
                startExport(mcq, template);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Q{activeMcqIndex + 1} ({qualitySpec.badge})</span>
            </button>
          ) : (
            <button
              onClick={() => {
                ttsService.stop();
                openExportModal();
                startProjectExport(
                  currentProject.mcqItems,
                  template,
                  {},
                  currentProject.name
                );
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Export Full Video ({qualitySpec.badge})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Video Player Container with Dynamic Aspect Ratio */}
      <div className="flex-1 flex items-center justify-center w-full py-2 overflow-hidden">
        <div
          className={`relative rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border-4 border-slate-800 bg-black transition-all duration-300 ${
            aspectRatio === '16:9'
              ? 'aspect-[16/9] w-full max-w-[700px] max-h-[440px]'
              : aspectRatio === '1:1'
              ? 'aspect-square h-full max-h-[500px]'
              : 'aspect-[9/16] h-full max-h-[580px]'
          }`}
        >
          {previewScope === 'single' ? (
            <Player
              ref={playerRef}
              component={VerticalQuiz}
              durationInFrames={totalFrames}
              compositionWidth={compositionWidth}
              compositionHeight={compositionHeight}
              fps={fps}
              style={{
                width: '100%',
                height: '100%'
              }}
              inputProps={{
                mcq,
                template,
                enableLiveAudio: enableSound,
                index: activeMcqIndex + 1,
                totalQuestions: currentProject.mcqItems.length
              }}
              acknowledgeRemotionLicense
              controls={false}
              loop={false}
              onFrameUpdate={(f: number) => {
                setCurrentFrame(f);
                if (playerRef.current) {
                  const playing = playerRef.current.isPlaying();
                  setIsPlaying(playing);
                  if (!playing && isPlaying) {
                    ttsService.stop();
                  }
                }
              }}
            />
          ) : (
            <Player
              ref={playerRef}
              component={MultiQuizComposition}
              durationInFrames={totalFrames}
              compositionWidth={compositionWidth}
              compositionHeight={compositionHeight}
              fps={fps}
              style={{
                width: '100%',
                height: '100%'
              }}
              inputProps={{
                mcqItems: currentProject.mcqItems,
                template,
                enableLiveAudio: enableSound
              }}
              acknowledgeRemotionLicense
              controls={false}
              loop={false}
              onFrameUpdate={(f: number) => {
                setCurrentFrame(f);
                if (playerRef.current) {
                  const playing = playerRef.current.isPlaying();
                  setIsPlaying(playing);
                  if (!playing && isPlaying) {
                    ttsService.stop();
                  }
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Bottom Timeline Controls */}
      <div className="w-full max-w-md bg-[#121827] border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-col gap-2.5">
        {/* Seek Track */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max={Math.max(1, totalFrames - 1)}
            value={currentFrame}
            onChange={(e) => {
              const frame = parseInt(e.target.value);
              setCurrentFrame(frame);
              ttsService.stop();
              if (playerRef.current) {
                playerRef.current.seekTo(frame);
              }
            }}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Buttons Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRestart}
              title="Restart from beginning"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => stepFrame(-1)}
              title="Step backward 1 frame"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => stepFrame(1)}
              title="Step forward 1 frame"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={togglePlay}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>

          <div className="text-right">
            <span className="font-mono text-xs font-bold text-indigo-400">
              {formatTime(currentFrame)}
            </span>
            <span className="font-mono text-xs text-slate-500"> / {formatTime(totalFrames)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
