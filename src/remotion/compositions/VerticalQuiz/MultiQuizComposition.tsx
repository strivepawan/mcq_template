import React from 'react';
import { Series } from 'remotion';
import { MCQItem, TemplateConfig } from '../../../types/mcq';
import { calculateTimeline } from './timing';
import { VerticalQuiz } from './VerticalQuiz';

export interface MultiQuizCompositionProps {
  mcqItems: MCQItem[];
  template: TemplateConfig;
  enableLiveAudio?: boolean;
}

export const MultiQuizComposition: React.FC<MultiQuizCompositionProps> = ({
  mcqItems,
  template,
  enableLiveAudio = true
}) => {
  const fps = template.fps || 30;

  return (
    <Series>
      {mcqItems.map((item, idx) => {
        const timeline = calculateTimeline(item, fps);
        return (
          <Series.Sequence
            key={item.id || `mcq-seq-${idx}`}
            durationInFrames={timeline.totalFrames}
          >
            <VerticalQuiz
              mcq={item}
              template={template}
              enableLiveAudio={enableLiveAudio}
              index={idx + 1}
              totalQuestions={mcqItems.length}
            />
          </Series.Sequence>
        );
      })}
    </Series>
  );
};
