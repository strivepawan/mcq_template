import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { MCQItem, TemplateConfig } from '../../../../types/mcq';
import { AudioTimingTimeline } from '../../../../types/render';
import { audioService } from '../../../../services/audioService';

interface AudioSequencerProps {
  mcq: MCQItem;
  template: TemplateConfig;
  timeline: AudioTimingTimeline;
  enableLiveAudio?: boolean;
}

export const AudioSequencer: React.FC<AudioSequencerProps> = ({
  template,
  timeline,
  enableLiveAudio = true
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lastTriggeredSecRef = useRef<number>(-1);

  useEffect(() => {
    if (!enableLiveAudio || !template.audio.sfxEnabled) return;

    const currentTimeSec = frame / fps;
    const currentSecInt = Math.floor(currentTimeSec);

    // Only fire once per whole second to ensure zero thread blocking and silky 60fps animation
    if (currentSecInt !== lastTriggeredSecRef.current) {
      lastTriggeredSecRef.current = currentSecInt;

      // Countdown tick sounds (3... 2... 1...)
      if (
        currentTimeSec >= timeline.countdownStartSec &&
        currentTimeSec < timeline.countdownStartSec + timeline.countdownDurationSec
      ) {
        const remainingSec = timeline.countdownStartSec + timeline.countdownDurationSec - currentTimeSec;
        if (remainingSec <= 1.1) {
          audioService.playBeep(template.audio.sfxVolume);
        } else {
          audioService.playTick(template.audio.sfxVolume);
        }
      }

      // Answer Reveal Fanfare at exact reveal second
      if (currentSecInt === Math.floor(timeline.answerRevealStartSec)) {
        audioService.playCorrect(template.audio.sfxVolume);
      }
    }
  }, [frame, fps, enableLiveAudio, template, timeline]);

  return null;
};
