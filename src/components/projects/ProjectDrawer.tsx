import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  FolderOpen,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { Project } from '../../types/mcq';
import { db } from '../../db/database';

interface ProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectDrawer: React.FC<ProjectDrawerProps> = ({ isOpen, onClose }) => {
  const {
    projectsList,
    currentProject,
    selectProject,
    createProject,
    deleteProject,
    loadAllProjects
  } = useProjectStore();

  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await createProject(newProjectName.trim());
    setNewProjectName('');
    setIsCreating(false);
    onClose();
  };

  const handleExportJSON = (project: Project) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.name.toLowerCase().replace(/\s+/g, '-')}-mcq.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as Project;
        imported.id = `project-${Date.now()}`;
        imported.createdAt = Date.now();
        imported.updatedAt = Date.now();

        await db.projects.add(imported);
        await loadAllProjects();
        await selectProject(imported.id);
        onClose();
      } catch (err) {
        alert('Invalid JSON project file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0f1422] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Project Library</h2>
              <p className="text-xs text-slate-400">
                All quiz video projects stored locally in your browser
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create New Project Banner */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col gap-3">
            <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Project Title
            </label>
            <input
              type="text"
              required
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. World Geography Trivia Vol 1"
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/50 text-white text-sm focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                Create Project
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>

            <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 cursor-pointer transition">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {projectsList.map((project) => {
            const isCurrent = currentProject?.id === project.id;
            const dateStr = new Date(project.updatedAt).toLocaleDateString();

            return (
              <div
                key={project.id}
                className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                  isCurrent
                    ? 'bg-indigo-950/30 border-indigo-500/50 shadow-lg shadow-indigo-900/10'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    selectProject(project.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="font-bold text-sm text-white">{project.name}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      {project.mcqItems.length} {project.mcqItems.length === 1 ? 'MCQ' : 'MCQs'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {dateStr}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportJSON(project)}
                    title="Export as JSON backup"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {projectsList.length > 1 && (
                    <button
                      onClick={() => deleteProject(project.id)}
                      title="Delete Project"
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
