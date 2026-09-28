import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { MCQEditor } from './components/editor/MCQEditor';
import { StudioPreview } from './components/preview/StudioPreview';
import { ThemeCustomizer } from './components/templates/ThemeCustomizer';
import { ProjectDrawer } from './components/projects/ProjectDrawer';
import { ExportModal } from './components/export/ExportModal';
import { useProjectStore } from './store/useProjectStore';
import { Edit3, Palette, PlayCircle, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const { loadInitialProject, isLoading } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'editor' | 'themes'>('editor');
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  useEffect(() => {
    loadInitialProject();
  }, [loadInitialProject]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-spin">
          <Layers className="w-6 h-6 text-white" />
        </div>
        <span className="font-extrabold text-sm tracking-wider uppercase text-slate-300">
          Loading Offline MCQ Studio...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar onOpenProjects={() => setIsProjectsOpen(true)} />

      {/* Main Studio Workspace: 2-Column Responsive Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-64px)]">
        {/* Left Column: Editor & Theme Customizer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full border-r border-slate-800/80 bg-[#0d121f]/50 overflow-hidden">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-slate-800/60 bg-[#0d121f]/80">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'editor'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>MCQ & Audio Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('themes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'themes'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
            >
              <Palette className="w-4 h-4" />
              <span>Themes & Branding</span>
            </button>
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'editor' && <MCQEditor />}
            {activeTab === 'themes' && <ThemeCustomizer />}
          </div>
        </div>

        {/* Right Column: Live Remotion Player & Studio Preview (5 cols) */}
        <div className="lg:col-span-5 h-full overflow-hidden flex flex-col">
          <StudioPreview />
        </div>
      </div>

      {/* Modals */}
      <ProjectDrawer
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
      />
      <ExportModal />
    </div>
  );
};
export default App;
