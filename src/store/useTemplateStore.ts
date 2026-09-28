import { create } from 'zustand';
import { TemplateConfig, ThemeId, CountdownStyle } from '../types/mcq';
import { useProjectStore } from './useProjectStore';

interface TemplateState {
  updateTheme: (themeId: ThemeId) => void;
  updateAspectRatio: (aspectRatio: '9:16' | '16:9' | '1:1') => void;
  updateCountdownStyle: (style: CountdownStyle) => void;
  updateBranding: (branding: Partial<TemplateConfig['branding']>) => void;
  updateAudioConfig: (audio: Partial<TemplateConfig['audio']>) => void;
}

export const useTemplateStore = create<TemplateState>(() => ({
  updateTheme: (themeId: ThemeId) => {
    const { currentProject, saveProjectToDb } = useProjectStore.getState();
    if (!currentProject) return;

    const updatedTemplate: TemplateConfig = {
      ...currentProject.templateConfig,
      themeId
    };

    useProjectStore.setState({
      currentProject: {
        ...currentProject,
        templateConfig: updatedTemplate,
        updatedAt: Date.now()
      }
    });
    saveProjectToDb();
  },

  updateAspectRatio: (aspectRatio: '9:16' | '16:9' | '1:1') => {
    const { currentProject, saveProjectToDb } = useProjectStore.getState();
    if (!currentProject) return;

    let width = 1080;
    let height = 1920;

    if (aspectRatio === '16:9') {
      width = 1920;
      height = 1080;
    } else if (aspectRatio === '1:1') {
      width = 1080;
      height = 1080;
    }

    const updatedTemplate: TemplateConfig = {
      ...currentProject.templateConfig,
      aspectRatio,
      width,
      height
    };

    useProjectStore.setState({
      currentProject: {
        ...currentProject,
        templateConfig: updatedTemplate,
        updatedAt: Date.now()
      }
    });
    saveProjectToDb();
  },

  updateCountdownStyle: (countdownStyle: CountdownStyle) => {
    const { currentProject, saveProjectToDb } = useProjectStore.getState();
    if (!currentProject) return;

    const updatedTemplate: TemplateConfig = {
      ...currentProject.templateConfig,
      countdownStyle
    };

    useProjectStore.setState({
      currentProject: {
        ...currentProject,
        templateConfig: updatedTemplate,
        updatedAt: Date.now()
      }
    });
    saveProjectToDb();
  },

  updateBranding: (brandingUpdates) => {
    const { currentProject, saveProjectToDb } = useProjectStore.getState();
    if (!currentProject) return;

    const updatedTemplate: TemplateConfig = {
      ...currentProject.templateConfig,
      branding: {
        ...currentProject.templateConfig.branding,
        ...brandingUpdates
      }
    };

    useProjectStore.setState({
      currentProject: {
        ...currentProject,
        templateConfig: updatedTemplate,
        updatedAt: Date.now()
      }
    });
    saveProjectToDb();
  },

  updateAudioConfig: (audioUpdates) => {
    const { currentProject, saveProjectToDb } = useProjectStore.getState();
    if (!currentProject) return;

    const updatedTemplate: TemplateConfig = {
      ...currentProject.templateConfig,
      audio: {
        ...currentProject.templateConfig.audio,
        ...audioUpdates
      }
    };

    useProjectStore.setState({
      currentProject: {
        ...currentProject,
        templateConfig: updatedTemplate,
        updatedAt: Date.now()
      }
    });
    saveProjectToDb();
  }
}));
