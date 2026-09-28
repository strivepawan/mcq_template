import { create } from 'zustand';
import { Project, MCQItem, OptionId } from '../types/mcq';
import { db, initializeDatabase } from '../db/database';

interface ProjectState {
  currentProject: Project | null;
  activeMcqIndex: number;
  isLoading: boolean;
  isSaving: boolean;
  projectsList: Project[];

  // Actions
  loadInitialProject: () => Promise<void>;
  loadAllProjects: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  setActiveMcqIndex: (index: number) => void;
  updateActiveMcq: (updates: Partial<MCQItem>) => void;
  addMcq: () => void;
  deleteMcq: (mcqId: string) => void;
  duplicateMcq: (mcqId: string) => void;
  bulkAddMcqs: (items: MCQItem[], mode: 'append' | 'replace') => Promise<void>;
  saveProjectToDb: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  activeMcqIndex: 0,
  isLoading: true,
  isSaving: false,
  projectsList: [],

  loadInitialProject: async () => {
    set({ isLoading: true });
    try {
      const initialProject = await initializeDatabase();
      const allProjects = await db.projects.toArray();
      set({
        currentProject: initialProject,
        projectsList: allProjects,
        activeMcqIndex: 0,
        isLoading: false
      });
    } catch (err) {
      console.error('Failed to load initial project:', err);
      set({ isLoading: false });
    }
  },

  loadAllProjects: async () => {
    const list = await db.projects.orderBy('updatedAt').reverse().toArray();
    set({ projectsList: list });
  },

  selectProject: async (projectId: string) => {
    set({ isLoading: true });
    const project = await db.projects.get(projectId);
    if (project) {
      set({
        currentProject: project,
        activeMcqIndex: 0,
        isLoading: false
      });
    } else {
      set({ isLoading: false });
    }
  },

  createProject: async (name: string, description?: string) => {
    const newMcq: MCQItem = {
      id: `mcq-${Date.now()}`,
      projectId: `proj-${Date.now()}`,
      question: 'What is the fastest land animal on Earth?',
      options: [
        { id: 'A', text: 'Lion' },
        { id: 'B', text: 'Cheetah' },
        { id: 'C', text: 'Gazelle' },
        { id: 'D', text: 'Falcon' }
      ],
      correctAnswer: 'B',
      waitTimeSeconds: 3,
      explanation: 'Cheetahs can accelerate from 0 to 60 mph in just 3 seconds, reaching top speeds of 70 mph.',
      category: 'Wildlife',
      difficulty: 'Easy',
      voiceoverEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      description,
      mcqItems: [newMcq],
      templateConfig: {
        themeId: 'cyberpunk-neon',
        countdownStyle: 'radial_circle',
        aspectRatio: '9:16',
        width: 1080,
        height: 1920,
        fps: 30,
        branding: {
          channelName: name,
          handle: '@quizmaster',
          showWatermark: true,
          showProgressBar: true
        },
        audio: {
          bgmTrack: 'upbeat-synth',
          bgmVolume: 0.25,
          sfxVolume: 0.8,
          sfxEnabled: true,
          voiceoverVolume: 1.0
        }
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.projects.add(newProject);
    const list = await db.projects.orderBy('updatedAt').reverse().toArray();
    set({
      currentProject: newProject,
      projectsList: list,
      activeMcqIndex: 0
    });
    return newProject;
  },

  deleteProject: async (projectId: string) => {
    await db.projects.delete(projectId);
    const list = await db.projects.orderBy('updatedAt').reverse().toArray();
    if (list.length > 0) {
      set({
        projectsList: list,
        currentProject: list[0],
        activeMcqIndex: 0
      });
    } else {
      const defaultProj = await initializeDatabase();
      set({
        projectsList: [defaultProj],
        currentProject: defaultProj,
        activeMcqIndex: 0
      });
    }
  },

  setActiveMcqIndex: (index: number) => {
    set({ activeMcqIndex: index });
  },

  updateActiveMcq: (updates: Partial<MCQItem>) => {
    const { currentProject, activeMcqIndex } = get();
    if (!currentProject) return;

    const updatedItems = [...currentProject.mcqItems];
    if (updatedItems[activeMcqIndex]) {
      updatedItems[activeMcqIndex] = {
        ...updatedItems[activeMcqIndex],
        ...updates,
        updatedAt: Date.now()
      };

      const updatedProject = {
        ...currentProject,
        mcqItems: updatedItems,
        updatedAt: Date.now()
      };

      set({ currentProject: updatedProject });
      // Auto-save debounced
      get().saveProjectToDb();
    }
  },

  addMcq: () => {
    const { currentProject } = get();
    if (!currentProject) return;

    const newItem: MCQItem = {
      id: `mcq-${Date.now()}`,
      projectId: currentProject.id,
      question: 'New Trivia Question Here?',
      options: [
        { id: 'A', text: 'Option Alpha' },
        { id: 'B', text: 'Option Beta' },
        { id: 'C', text: 'Option Gamma' },
        { id: 'D', text: 'Option Delta' }
      ],
      correctAnswer: 'A',
      waitTimeSeconds: 3,
      explanation: 'Add your explanation for why this answer is correct.',
      category: 'General',
      difficulty: 'Medium',
      voiceoverEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedProject = {
      ...currentProject,
      mcqItems: [...currentProject.mcqItems, newItem],
      updatedAt: Date.now()
    };

    set({
      currentProject: updatedProject,
      activeMcqIndex: currentProject.mcqItems.length
    });
    get().saveProjectToDb();
  },

  deleteMcq: (mcqId: string) => {
    const { currentProject, activeMcqIndex } = get();
    if (!currentProject || currentProject.mcqItems.length <= 1) return;

    const filtered = currentProject.mcqItems.filter(m => m.id !== mcqId);
    const newIndex = Math.min(activeMcqIndex, filtered.length - 1);

    const updatedProject = {
      ...currentProject,
      mcqItems: filtered,
      updatedAt: Date.now()
    };

    set({
      currentProject: updatedProject,
      activeMcqIndex: Math.max(0, newIndex)
    });
    get().saveProjectToDb();
  },

  duplicateMcq: (mcqId: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const item = currentProject.mcqItems.find(m => m.id === mcqId);
    if (!item) return;

    const clone: MCQItem = {
      ...item,
      id: `mcq-${Date.now()}`,
      question: `${item.question} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedProject = {
      ...currentProject,
      mcqItems: [...currentProject.mcqItems, clone],
      updatedAt: Date.now()
    };

    set({
      currentProject: updatedProject,
      activeMcqIndex: currentProject.mcqItems.length
    });
    get().saveProjectToDb();
  },

  bulkAddMcqs: async (items: MCQItem[], mode: 'append' | 'replace') => {
    const { currentProject } = get();
    if (!currentProject || items.length === 0) return;

    const updatedItems = mode === 'replace'
      ? items
      : [...currentProject.mcqItems, ...items];

    const updatedProject: Project = {
      ...currentProject,
      mcqItems: updatedItems,
      updatedAt: Date.now()
    };

    set({
      currentProject: updatedProject,
      activeMcqIndex: mode === 'replace' ? 0 : currentProject.mcqItems.length
    });

    await get().saveProjectToDb();
  },

  saveProjectToDb: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    set({ isSaving: true });
    try {
      await db.projects.put(currentProject);
      const list = await db.projects.orderBy('updatedAt').reverse().toArray();
      set({ projectsList: list, isSaving: false });
    } catch (err) {
      console.error('Failed to save project:', err);
      set({ isSaving: false });
    }
  }
}));
