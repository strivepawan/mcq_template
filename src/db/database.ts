import Dexie, { Table } from 'dexie';
import { Project, MCQItem } from '../types/mcq';

export class MCQDatabase extends Dexie {
  projects!: Table<Project, string>;
  mcqItems!: Table<MCQItem, string>;

  constructor() {
    super('MCQStudioDatabase');
    this.version(1).stores({
      projects: 'id, name, createdAt, updatedAt',
      mcqItems: 'id, projectId, question, correctAnswer, createdAt'
    });
  }
}

export const db = new MCQDatabase();

// Seed initial default project if empty
export async function initializeDatabase(): Promise<Project> {
  const count = await db.projects.count();
  if (count === 0) {
    const defaultMcq: MCQItem = {
      id: 'mcq-sample-1',
      projectId: 'project-default',
      question: 'Which planet in our solar system is known as the "Red Planet"?',
      options: [
        { id: 'A', text: 'Venus' },
        { id: 'B', text: 'Mars' },
        { id: 'C', text: 'Jupiter' },
        { id: 'D', text: 'Mercury' }
      ],
      correctAnswer: 'B',
      waitTimeSeconds: 3,
      explanation: 'Mars is known as the Red Planet because iron minerals in the Martian soil oxidize (rust), causing the soil and atmosphere to look red.',
      category: 'Astronomy',
      difficulty: 'Easy',
      voiceoverEnabled: true,
      voiceRate: 1.0,
      voicePitch: 1.0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const defaultProject: Project = {
      id: 'project-default',
      name: 'Cosmic Wonders Quiz',
      description: 'Science & Astronomy trivia series for Shorts & Reels',
      mcqItems: [defaultMcq],
      templateConfig: {
        themeId: 'cyberpunk-neon',
        countdownStyle: 'radial_circle',
        aspectRatio: '9:16',
        width: 1080,
        height: 1920,
        fps: 30,
        branding: {
          channelName: 'BrainByte Quiz',
          handle: '@brainbyte',
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

    await db.projects.put(defaultProject);
    await db.mcqItems.put(defaultMcq);
    return defaultProject;
  }

  const firstProject = await db.projects.orderBy('updatedAt').reverse().first();
  return firstProject!;
}
