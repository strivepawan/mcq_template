import React, { useState } from 'react';
import { Play, Sparkles, Download, FolderOpen, Save, CheckCircle2, RefreshCw } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useRenderStore } from '../../store/useRenderStore';

interface NavbarProps {
  onOpenProjects: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenProjects }) => {
  const { currentProject, isSaving, saveProjectToDb } = useProjectStore();
  const { openExportModal, startExport } = useRenderStore();

  const handleQuickExport = () => {
    if (!currentProject) return;
    const activeMcq = currentProject.mcqItems[useProjectStore.getState().activeMcqIndex];
    if (!activeMcq) return;

    openExportModal();
    startExport(activeMcq, currentProject.templateConfig);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0d121f]/90 backdrop-blur-xl px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Left Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                MCQ STUDIO
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO • OFFLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Shorts & Reels Video Generator
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 mx-2 hidden sm:block" />

        {/* Project Name & Saved Status */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={onOpenProjects}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-sm font-semibold text-slate-200 transition"
          >
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            <span className="max-w-[160px] truncate">{currentProject?.name || 'My Quiz Project'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 px-2 py-1">
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={saveProjectToDb}
          className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium transition"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>

        <button
          onClick={handleQuickExport}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 border border-white/20 transition-all transform active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Render MP4</span>
        </button>
      </div>
    </header>
  );
};
