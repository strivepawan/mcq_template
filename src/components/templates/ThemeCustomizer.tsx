import { Palette, Clock, Award, Music, Sparkles, Check, Smartphone, Tv, Square, Video, Zap } from 'lucide-react';
import { PRESET_THEMES } from '../../remotion/themes/presets';
import { ThemeId, CountdownStyle } from '../../types/mcq';
import { useProjectStore } from '../../store/useProjectStore';
import { useTemplateStore } from '../../store/useTemplateStore';
import { useRenderStore, getResolutionForQuality } from '../../store/useRenderStore';

export const ThemeCustomizer: React.FC = () => {
  const { currentProject } = useProjectStore();
  const {
    updateTheme,
    updateAspectRatio,
    updateCountdownStyle,
    updateBranding,
    updateAudioConfig
  } = useTemplateStore();
  const { exportQuality, setExportQuality } = useRenderStore();

  if (!currentProject) return null;
  const template = currentProject.templateConfig;
  const activeAspect = template.aspectRatio || '9:16';
  const activeQualitySpec = getResolutionForQuality(activeAspect, exportQuality);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto pb-24">
      {/* Video Aspect Ratio & Platform Format */}
      <div className="bg-[#111625] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Video Format & Platform Aspect Ratio
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-500/30">
            {template.width} × {template.height} px
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {/* 9:16 Vertical Shorts/Reels */}
          <button
            onClick={() => updateAspectRatio('9:16')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-32 transition ${
              template.aspectRatio === '9:16'
                ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-6 h-9 rounded-md border-2 border-indigo-400 bg-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-300">
                9:16
              </div>
              {template.aspectRatio === '9:16' && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-sm text-white">Vertical Shorts / Reels</div>
              <div className="text-[11px] text-slate-400">
                1080 × 1920 • YouTube Shorts, Reels, TikTok
              </div>
            </div>
          </button>

          {/* 16:9 Landscape YouTube Video */}
          <button
            onClick={() => updateAspectRatio('16:9')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-32 transition ${
              template.aspectRatio === '16:9'
                ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-6 rounded-md border-2 border-indigo-400 bg-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-300">
                16:9
              </div>
              {template.aspectRatio === '16:9' && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-sm text-white">Landscape Full Video</div>
              <div className="text-[11px] text-slate-400">
                1920 × 1080 • YouTube standard & Desktop
              </div>
            </div>
          </button>

          {/* 1:1 Square Post */}
          <button
            onClick={() => updateAspectRatio('1:1')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-32 transition ${
              template.aspectRatio === '1:1'
                ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-md border-2 border-indigo-400 bg-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-300">
                1:1
              </div>
              {template.aspectRatio === '1:1' && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-sm text-white">Square Feed Post</div>
              <div className="text-[11px] text-slate-400">
                1080 × 1080 • Instagram & Facebook feed
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Video Quality & High-Resolution Export Section */}
      <div className="bg-[#111625] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Export Quality & Video Resolution
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            {activeQualitySpec.label}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {/* 4K Ultra HD */}
          <button
            onClick={() => setExportQuality('4k')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-32 transition relative overflow-hidden ${
              exportQuality === '4k'
                ? 'border-amber-500 bg-gradient-to-b from-amber-950/40 to-slate-900 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs flex items-center gap-1">
                4K UHD <Sparkles className="w-3 h-3 text-amber-400" />
              </span>
              {exportQuality === '4k' && (
                <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>4K Ultra HD</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {activeAspect === '16:9' ? '3840 × 2160' : activeAspect === '1:1' ? '2160 × 2160' : '2160 × 3840'} • 32 Mbps
              </div>
            </div>
          </button>

          {/* 2K QHD */}
          <button
            onClick={() => setExportQuality('2k')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-32 transition ${
              exportQuality === '2k'
                ? 'border-cyan-500 bg-gradient-to-b from-cyan-950/40 to-slate-900 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs">
                2K QHD
              </span>
              {exportQuality === '2k' && (
                <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-sm text-white">2K Quad HD</div>
              <div className="text-[11px] text-slate-400">
                {activeAspect === '16:9' ? '2560 × 1440' : activeAspect === '1:1' ? '1440 × 1440' : '1440 × 2560'} • 16 Mbps
              </div>
            </div>
          </button>

          {/* 1080p FHD */}
          <button
            onClick={() => setExportQuality('1080p')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-32 transition ${
              exportQuality === '1080p'
                ? 'border-indigo-500 bg-gradient-to-b from-indigo-950/40 to-slate-900 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-extrabold text-xs">
                1080p FHD
              </span>
              {exportQuality === '1080p' && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-sm text-white">1080p Full HD</div>
              <div className="text-[11px] text-slate-400">
                {activeAspect === '16:9' ? '1920 × 1080' : activeAspect === '1:1' ? '1080 × 1080' : '1080 × 1920'} • 8 Mbps
              </div>
            </div>
          </button>

          {/* 720p HD */}
          <button
            onClick={() => setExportQuality('720p')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-32 transition ${
              exportQuality === '720p'
                ? 'border-emerald-500 bg-gradient-to-b from-emerald-950/40 to-slate-900 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs">
                720p HD
              </span>
              {exportQuality === '720p' && (
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-sm text-white">720p Standard HD</div>
              <div className="text-[11px] text-slate-400">
                {activeAspect === '16:9' ? '1280 × 720' : activeAspect === '1:1' ? '720 × 720' : '720 × 1280'} • 4 Mbps
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Themes Section */}
      <div className="bg-[#111625] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Visual Themes & Aesthetics
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
          {Object.values(PRESET_THEMES).map((theme) => {
            const isSelected = template.themeId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => updateTheme(theme.id as ThemeId)}
                className={`relative rounded-xl p-4 border text-left transition-all overflow-hidden flex flex-col justify-between h-32 ${
                  isSelected
                    ? 'border-indigo-500 bg-slate-800/90 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                {/* Background swatch preview */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background:
                      theme.background.type === 'solid'
                        ? theme.colors.primary
                        : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                  }}
                />

                <div className="relative z-10 flex items-start justify-between">
                  <span className="font-bold text-sm text-white">{theme.name}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="relative z-10">
                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-2.5">
                    {theme.description}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: '#10b981' }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Countdown Timer Style */}
      <div className="bg-[#111625] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Countdown Style & Animation
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <button
            onClick={() => updateCountdownStyle('radial_circle')}
            className={`p-4 rounded-xl border text-left flex items-center gap-4 transition ${
              template.countdownStyle === 'radial_circle'
                ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-indigo-400 flex items-center justify-center font-bold text-sm text-indigo-300">
              3s
            </div>
            <div>
              <div className="font-bold text-sm text-white">Radial Circular Ring</div>
              <div className="text-xs text-slate-400">
                Pulsing circular SVG progress with center countdown
              </div>
            </div>
          </button>

          <button
            onClick={() => updateCountdownStyle('linear_bar')}
            className={`p-4 rounded-xl border text-left flex items-center gap-4 transition ${
              template.countdownStyle === 'linear_bar'
                ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center p-2">
              <div className="w-full h-2 rounded bg-indigo-500" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Linear Progress Bar</div>
              <div className="text-xs text-slate-400">
                Full-width smooth gradient timer bar at top of options
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Channel Branding & Watermark */}
      <div className="bg-[#111625] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Channel Branding & Watermarks
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Channel Name
            </label>
            <input
              type="text"
              value={template.branding.channelName}
              onChange={(e) => updateBranding({ channelName: e.target.value })}
              placeholder="e.g. BrainByte Trivia"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Social Handle / Tagline
            </label>
            <input
              type="text"
              value={template.branding.handle}
              onChange={(e) => updateBranding({ handle: e.target.value })}
              placeholder="e.g. @dailyquiz"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-800">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={template.branding.showProgressBar}
              onChange={(e) => updateBranding({ showProgressBar: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
            />
            <span className="text-xs font-semibold text-slate-300">
              Show Video Duration Progress Bar at Top
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={template.branding.showWatermark}
              onChange={(e) => updateBranding({ showWatermark: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
            />
            <span className="text-xs font-semibold text-slate-300">
              Show HD Quiz Badge
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
