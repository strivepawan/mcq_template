import React from 'react';
import { Composition } from 'remotion';
import { VerticalQuiz } from './compositions/VerticalQuiz/VerticalQuiz';
import { MultiQuizComposition } from './compositions/VerticalQuiz/MultiQuizComposition';
import { MCQItem, TemplateConfig } from '../types/mcq';
import { calculateTimeline, calculateProjectTimeline } from './compositions/VerticalQuiz/timing';

const sampleMcq: MCQItem = {
  id: 'preview-mcq',
  projectId: 'sample-project',
  question: 'Which planet in our solar system is known as the "Red Planet"?',
  options: [
    { id: 'A', text: 'Venus' },
    { id: 'B', text: 'Mars' },
    { id: 'C', text: 'Jupiter' },
    { id: 'D', text: 'Mercury' }
  ],
  correctAnswer: 'B',
  waitTimeSeconds: 3,
  explanation: 'Mars appears red because iron minerals in its soil oxidize, just like rust on Earth.',
  category: 'Astronomy',
  difficulty: 'Easy',
  voiceoverEnabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const sampleTemplate: TemplateConfig = {
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
    bgmVolume: 0.2,
    sfxVolume: 0.8,
    sfxEnabled: true,
    voiceoverVolume: 1.0
  }
};

export const RemotionRoot: React.FC = () => {
  const singleTimeline = calculateTimeline(sampleMcq, 30);
  const projectTimeline = calculateProjectTimeline([sampleMcq], 30);

  return (
    <>
      <Composition
        id="VerticalQuiz"
        component={VerticalQuiz}
        durationInFrames={singleTimeline.totalFrames}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          mcq: sampleMcq,
          template: sampleTemplate,
          enableLiveAudio: false
        }}
      />
      <Composition
        id="MultiQuizComposition"
        component={MultiQuizComposition}
        durationInFrames={projectTimeline.totalFrames}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          mcqItems: [sampleMcq],
          template: sampleTemplate,
          enableLiveAudio: false
        }}
      />
    </>
  );
};
