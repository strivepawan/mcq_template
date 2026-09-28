import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { MCQItem, TemplateConfig } from '../types/mcq';
import { RenderProgress, RenderJobOptions, ProjectTimingTimeline, AudioTimingTimeline } from '../types/render';
import { PRESET_THEMES } from '../remotion/themes/presets';
import { calculateTimeline, calculateProjectTimeline } from '../remotion/compositions/VerticalQuiz/timing';
import { audioMixerService } from './audioMixerService';

// Unthrottled scheduler: MessageChannel tasks are exempt from Chromium background tab throttling (never paused at 1s intervals)
function unthrottledYield(): Promise<void> {
  if (typeof MessageChannel !== 'undefined') {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        channel.port2.close();
        resolve();
      };
      channel.port2.postMessage(null);
    });
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function unthrottledSleep(ms: number): Promise<void> {
  const start = performance.now();
  while (performance.now() - start < ms) {
    await unthrottledYield();
  }
}

function getH264Codec(width: number, height: number): string {
  const maxDim = Math.max(width, height);
  if (maxDim > 2560) {
    return 'avc1.640033'; // High Profile Level 5.1 (Supports 4K UHD 3840x2160)
  } else if (maxDim > 1920) {
    return 'avc1.640032'; // High Profile Level 5.0 (Supports 2K QHD 2560x1440)
  } else if (maxDim > 1280) {
    return 'avc1.640028'; // High Profile Level 4.0 (1080p Full HD)
  } else {
    return 'avc1.64001f'; // High Profile Level 3.1 (720p HD)
  }
}

export class VideoEncoderService {
  private isCancelled = false;

  public cancelRender(): void {
    this.isCancelled = true;
  }

  public async renderMCQToMP4(
    mcq: MCQItem,
    template: TemplateConfig,
    options: RenderJobOptions,
    onProgress: (progress: RenderProgress) => void
  ): Promise<Blob> {
    return this.renderProjectToMP4([mcq], template, options, onProgress);
  }

  public async renderProjectToMP4(
    mcqs: MCQItem[],
    template: TemplateConfig,
    options: RenderJobOptions,
    onProgress: (progress: RenderProgress) => void
  ): Promise<Blob> {
    this.isCancelled = false;
    const startTime = Date.now();

    const fps = options.fps || template.fps || 30;
    const width = options.width || 1080;
    const height = options.height || 1920;
    const projectTimeline = calculateProjectTimeline(mcqs, fps);
    const totalFrames = projectTimeline.totalFrames;

    const theme = PRESET_THEMES[template.themeId] || PRESET_THEMES['cyberpunk-neon'];

    onProgress({
      status: 'preparing',
      progress: 0,
      currentFrame: 0,
      totalFrames,
      fps,
      timeElapsedSeconds: 0,
      estimatedRemainingSeconds: Math.ceil(totalFrames / fps)
    });

    // 1. Synthesize multi-track natural audio (Voice + SFX + BGM) across all questions
    const audioBuffer = await audioMixerService.renderProjectSoundtrack(mcqs, template, projectTimeline, 48000);

    // 2. Create rendering Canvas at target export resolution (4K / 2K / 1080p / 720p)
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })!;

    // Check WebCodecs VideoEncoder & AudioEncoder support
    const hasWebCodecs =
      typeof window !== 'undefined' &&
      'VideoEncoder' in window &&
      'AudioEncoder' in window &&
      'VideoFrame' in window &&
      'AudioData' in window;

    if (hasWebCodecs) {
      try {
        return await this.renderWithWebCodecs(
          ctx,
          canvas,
          mcqs,
          template,
          theme,
          projectTimeline,
          audioBuffer,
          width,
          height,
          fps,
          totalFrames,
          startTime,
          onProgress,
          options
        );
      } catch (err) {
        console.warn('WebCodecs render error, using MediaRecorder fallback:', err);
        return await this.renderWithMediaRecorder(
          ctx,
          canvas,
          mcqs,
          template,
          theme,
          projectTimeline,
          audioBuffer,
          width,
          height,
          fps,
          totalFrames,
          startTime,
          onProgress,
          options
        );
      }
    } else {
      return await this.renderWithMediaRecorder(
        ctx,
        canvas,
        mcqs,
        template,
        theme,
        projectTimeline,
        audioBuffer,
        width,
        height,
        fps,
        totalFrames,
        startTime,
        onProgress,
        options
      );
    }
  }

  private async renderWithWebCodecs(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    mcqs: MCQItem[],
    template: TemplateConfig,
    theme: typeof PRESET_THEMES[keyof typeof PRESET_THEMES],
    projectTimeline: ProjectTimingTimeline,
    audioBuffer: AudioBuffer,
    width: number,
    height: number,
    fps: number,
    totalFrames: number,
    startTime: number,
    onProgress: (progress: RenderProgress) => void,
    options?: RenderJobOptions
  ): Promise<Blob> {
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width,
        height
      },
      audio: {
        codec: 'aac',
        numberOfChannels: 2,
        sampleRate: 48000
      },
      fastStart: 'in-memory'
    });

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('VideoEncoder error:', e)
    });

    const maxDim = Math.max(width, height);
    const defaultBitrate = maxDim >= 3840 ? 32_000_000 : maxDim >= 2560 ? 16_000_000 : maxDim >= 1920 ? 8_000_000 : 4_000_000;
    const videoBitrate = options?.bitrate || defaultBitrate;
    const codec = getH264Codec(width, height);

    try {
      await videoEncoder.configure({
        codec,
        width,
        height,
        bitrate: videoBitrate,
        framerate: fps
      });
    } catch {
      await videoEncoder.configure({
        codec: 'avc1.640033',
        width,
        height,
        bitrate: videoBitrate,
        framerate: fps
      });
    }

    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => console.error('AudioEncoder error:', e)
    });

    await audioEncoder.configure({
      codec: 'mp4a.40.2', // Standard AAC-LC
      numberOfChannels: 2,
      sampleRate: 48000,
      bitrate: 192_000
    });

    // 1. Encode Audio using strict 1024-sample AAC-LC frame boundaries
    const AAC_FRAME_SIZE = 1024;
    const totalAudioSamples = audioBuffer.length;
    const leftChan = audioBuffer.getChannelData(0);
    const rightChan = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChan;

    for (let offset = 0; offset < totalAudioSamples; offset += AAC_FRAME_SIZE) {
      if (this.isCancelled) {
        videoEncoder.close();
        audioEncoder.close();
        throw new Error('Video rendering was cancelled by user');
      }

      // Backpressure management for AudioEncoder with unthrottled scheduler
      while (audioEncoder.encodeQueueSize > 16) {
        await unthrottledYield();
      }

      const currentChunkSize = Math.min(AAC_FRAME_SIZE, totalAudioSamples - offset);
      const audioDataBuffer = new Float32Array(AAC_FRAME_SIZE * 2);
      audioDataBuffer.set(leftChan.subarray(offset, offset + currentChunkSize), 0);
      audioDataBuffer.set(rightChan.subarray(offset, offset + currentChunkSize), AAC_FRAME_SIZE);

      const timestampMicros = Math.round((offset / 48000) * 1_000_000);
      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate: 48000,
        numberOfFrames: AAC_FRAME_SIZE,
        numberOfChannels: 2,
        timestamp: timestampMicros,
        data: audioDataBuffer
      });

      audioEncoder.encode(audioData);
      audioData.close();
    }

    await Promise.race([
      audioEncoder.flush(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Audio encoder flush timed out')), 6000))
    ]);

    // 2. Encode Video Frames
    const frameDurationMicros = Math.round(1_000_000 / fps);

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        videoEncoder.close();
        audioEncoder.close();
        throw new Error('Video rendering was cancelled by user');
      }

      // Prevent GPU hardware encoder queue from overflowing (unthrottled in background tabs)
      while (videoEncoder.encodeQueueSize > 6) {
        await unthrottledYield();
      }

      const segment =
        projectTimeline.segments.find(
          (s) => frameIndex >= s.startFrame && frameIndex < s.startFrame + s.durationFrames
        ) || projectTimeline.segments[projectTimeline.segments.length - 1];

      const subFrame = frameIndex - segment.startFrame;
      const activeMcq = mcqs[segment.mcqIndex];
      const questionIndex = segment.mcqIndex + 1;
      const totalQuestions = mcqs.length;
      const globalProgress = (frameIndex + 1) / totalFrames;

      this.drawQuizFrame(
        ctx,
        subFrame,
        segment.durationFrames,
        fps,
        width,
        height,
        activeMcq,
        template,
        theme,
        segment.timeline,
        questionIndex,
        totalQuestions,
        globalProgress
      );

      const videoFrame = new VideoFrame(canvas, {
        timestamp: frameIndex * frameDurationMicros,
        duration: frameDurationMicros
      });

      const keyFrame = frameIndex % (fps * 2) === 0;
      videoEncoder.encode(videoFrame, { keyFrame });
      videoFrame.close();

      if (frameIndex % 3 === 0 || frameIndex === totalFrames - 1) {
        const elapsed = (Date.now() - startTime) / 1000;
        const progressPct = Math.min(98, 5 + Math.round(((frameIndex + 1) / totalFrames) * 93));
        const framesPerSec = (frameIndex + 1) / (elapsed || 0.001);
        const remainingFrames = totalFrames - (frameIndex + 1);
        const eta = Math.ceil(remainingFrames / (framesPerSec || 1));

        onProgress({
          status: 'rendering',
          progress: progressPct,
          currentFrame: frameIndex + 1,
          totalFrames,
          fps,
          timeElapsedSeconds: Math.round(elapsed),
          estimatedRemainingSeconds: eta
        });

        await unthrottledYield();
      }
    }

    onProgress({
      status: 'encoding',
      progress: 99,
      currentFrame: totalFrames,
      totalFrames,
      fps,
      timeElapsedSeconds: Math.round((Date.now() - startTime) / 1000),
      estimatedRemainingSeconds: 1
    });

    // Drain remaining encoder queue before flushing
    while (videoEncoder.encodeQueueSize > 0) {
      await unthrottledYield();
    }

    await Promise.race([
      videoEncoder.flush(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Video encoder flush timed out')), 10000))
    ]);

    muxer.finalize();

    const buffer = muxer.target.buffer;
    const blob = new Blob([buffer], { type: 'video/mp4' });
    return blob;
  }

  private async renderWithMediaRecorder(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    mcqs: MCQItem[],
    template: TemplateConfig,
    theme: typeof PRESET_THEMES[keyof typeof PRESET_THEMES],
    projectTimeline: ProjectTimingTimeline,
    audioBuffer: AudioBuffer,
    width: number,
    height: number,
    fps: number,
    totalFrames: number,
    startTime: number,
    onProgress: (progress: RenderProgress) => void,
    options?: RenderJobOptions
  ): Promise<Blob> {
    const audioCtx = new AudioContext();
    const audioDest = audioCtx.createMediaStreamDestination();
    const audioSource = audioCtx.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(audioDest);

    const videoStream = canvas.captureStream(fps);
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioDest.stream.getAudioTracks()
    ]);

    const chunks: Blob[] = [];
    const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')
      ? 'video/mp4;codecs=avc1,mp4a.40.2'
      : MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : 'video/webm;codecs=vp9,opus';

    const maxDim = Math.max(width, height);
    const defaultBitrate = maxDim >= 3840 ? 32_000_000 : maxDim >= 2560 ? 16_000_000 : maxDim >= 1920 ? 8_000_000 : 4_000_000;
    const videoBitrate = options?.bitrate || defaultBitrate;

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: videoBitrate,
      audioBitsPerSecond: 192_000
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.start(100);
    audioSource.start(0);

    const frameIntervalMs = 1000 / fps;

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        recorder.stop();
        audioSource.stop();
        audioCtx.close();
        throw new Error('Video rendering was cancelled by user');
      }

      const segment =
        projectTimeline.segments.find(
          (s) => frameIndex >= s.startFrame && frameIndex < s.startFrame + s.durationFrames
        ) || projectTimeline.segments[projectTimeline.segments.length - 1];

      const subFrame = frameIndex - segment.startFrame;
      const activeMcq = mcqs[segment.mcqIndex];
      const questionIndex = segment.mcqIndex + 1;
      const totalQuestions = mcqs.length;
      const globalProgress = (frameIndex + 1) / totalFrames;

      this.drawQuizFrame(
        ctx,
        subFrame,
        segment.durationFrames,
        fps,
        width,
        height,
        activeMcq,
        template,
        theme,
        segment.timeline,
        questionIndex,
        totalQuestions,
        globalProgress
      );

      if (frameIndex % 5 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const progressPct = Math.round(((frameIndex + 1) / totalFrames) * 100);
        onProgress({
          status: 'rendering',
          progress: progressPct,
          currentFrame: frameIndex + 1,
          totalFrames,
          fps,
          timeElapsedSeconds: Math.round(elapsed),
          estimatedRemainingSeconds: Math.max(0, Math.ceil((totalFrames - frameIndex) / (fps * 1.5)))
        });
      }

      await unthrottledSleep(frameIntervalMs);
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        audioCtx.close();
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };
      recorder.stop();
      audioSource.stop();
    });
  }

  private drawQuizFrame(
    ctx: CanvasRenderingContext2D,
    frame: number,
    totalFrames: number,
    fps: number,
    width: number,
    height: number,
    mcq: MCQItem,
    template: TemplateConfig,
    theme: typeof PRESET_THEMES[keyof typeof PRESET_THEMES],
    timeline: AudioTimingTimeline,
    questionIndex = 1,
    totalQuestions = 1,
    globalProgress?: number
  ): void {
    const isLandscape = width > height;
    const isSquare = Math.abs(width - height) < 100;
    const baseWidth = isLandscape ? 1920 : 1080;
    const baseHeight = isLandscape ? 1080 : isSquare ? 1080 : 1920;
    const scale = width / baseWidth;

    ctx.save();
    ctx.scale(scale, scale);

    const w = baseWidth;
    const h = baseHeight;
    const currentTimeSec = frame / fps;
    const isLight = theme.background.type === 'solid' || theme.background.type === 'light';

    // 1. Background
    if (theme.background.type === 'solid') {
      ctx.fillStyle = theme.background.from;
      ctx.fillRect(0, 0, w, h);
    } else {
      const bgGrad = ctx.createRadialGradient(
        w / 2,
        h * 0.25,
        100,
        w / 2,
        h / 2,
        h * 0.8
      );
      bgGrad.addColorStop(0, theme.background.via || theme.background.from);
      bgGrad.addColorStop(1, theme.background.to);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Animated Glowing Orbs (only for dark/gradient themes)
    if (!isLight) {
      const orbOffset = Math.sin(frame * 0.05) * 40;
      ctx.save();
      ctx.filter = 'blur(90px)';
      ctx.fillStyle = theme.colors.primary;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(w * 0.3, h * 0.2 + orbOffset, 240, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = theme.colors.secondary;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(w * 0.75, h * 0.7 - orbOffset, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Grid Pattern
    if (theme.background.pattern === 'grid') {
      ctx.save();
      ctx.strokeStyle = theme.colors.primary;
      ctx.globalAlpha = isLight ? 0.05 : 0.08;
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Progress Bar
    if (template.branding.showProgressBar) {
      const overallProgress =
        globalProgress !== undefined
          ? globalProgress
          : Math.min(1, Math.max(0, currentTimeSec / timeline.totalDurationSec));
      ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, 0, w, 12);

      const progGrad = ctx.createLinearGradient(0, 0, w * overallProgress, 0);
      progGrad.addColorStop(0, theme.colors.primary);
      progGrad.addColorStop(1, theme.colors.secondary);
      ctx.fillStyle = progGrad;
      ctx.fillRect(0, 0, w * overallProgress, 12);
    }

    // 5. Header Branding
    ctx.save();
    ctx.fillStyle = theme.colors.textPrimary;
    ctx.font = isLandscape ? 'bold 30px Outfit, Inter, sans-serif' : 'bold 36px Outfit, Inter, sans-serif';
    ctx.fillText(template.branding.channelName || 'QUIZ MASTER', isLandscape ? 80 : 60, isLandscape ? 65 : 100);

    ctx.fillStyle = theme.colors.textSecondary;
    ctx.font = isLandscape ? '500 20px Outfit, Inter, sans-serif' : '500 24px Outfit, Inter, sans-serif';
    ctx.fillText(template.branding.handle || '@dailyquiz', isLandscape ? 80 : 60, isLandscape ? 95 : 136);

    if (template.branding.showWatermark) {
      ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.15)';
      const wmW = isLandscape ? 140 : 160;
      const wmH = isLandscape ? 44 : 52;
      const wmX = w - (isLandscape ? 200 : 240);
      const wmY = isLandscape ? 45 : 72;
      this.roundRect(ctx, wmX, wmY, wmW, wmH, wmH / 2);
      ctx.fill();
      ctx.fillStyle = theme.colors.textSecondary;
      ctx.font = isLandscape ? 'bold 16px Outfit, Inter, sans-serif' : 'bold 20px Outfit, Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HD QUIZ', wmX + wmW / 2, wmY + wmH / 2 + 6);
      ctx.textAlign = 'left';
    }
    ctx.restore();

    // 6. Question Card & Options Placement (Dynamic Layout)
    const isCountdown =
      currentTimeSec >= timeline.countdownStartSec &&
      currentTimeSec < timeline.countdownStartSec + timeline.countdownDurationSec;
    const isRevealed = currentTimeSec >= timeline.answerRevealStartSec;

    // Badges inside Question Card
    const badgeText =
      totalQuestions > 1
        ? mcq.language === 'hi'
          ? `प्रश्न ${questionIndex} / ${totalQuestions}`
          : `QUESTION ${questionIndex} OF ${totalQuestions}`
        : mcq.language === 'hi'
        ? `प्रश्न ${questionIndex}`
        : `QUESTION ${questionIndex}`;

    if (isLandscape) {
      // ===== 16:9 LANDSCAPE LAYOUT (Side-by-side) =====
      const cardX = 80;
      const cardY = 120;
      const cardW = 840;
      const cardH = 780;

      // Question Card (Left)
      ctx.save();
      ctx.fillStyle = theme.colors.questionCardBg;
      ctx.strokeStyle = theme.colors.questionBorder;
      ctx.lineWidth = 3;
      ctx.shadowColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = isLight ? 20 : 40;
      this.roundRect(ctx, cardX, cardY, cardW, cardH, 32);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Badges
      ctx.save();
      ctx.font = 'bold 20px Outfit, Inter, sans-serif';
      const badgeMetrics = ctx.measureText(badgeText);
      const badgeWidth = Math.max(160, badgeMetrics.width + 36);

      ctx.fillStyle = theme.colors.badgeBg;
      ctx.strokeStyle = theme.colors.questionBorder;
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, cardX + 36, cardY + 36, badgeWidth, 44, 22);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme.colors.primary;
      ctx.fillText(badgeText, cardX + 54, cardY + 65);

      if (mcq.category) {
        ctx.fillStyle = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.12)';
        this.roundRect(ctx, cardX + badgeWidth + 50, cardY + 36, 160, 44, 22);
        ctx.fill();
        ctx.fillStyle = theme.colors.textSecondary;
        ctx.font = '600 18px Outfit, Inter, sans-serif';
        ctx.fillText(mcq.category, cardX + badgeWidth + 66, cardY + 65);
      }

      ctx.fillStyle = theme.colors.textPrimary;
      ctx.font = '800 42px Outfit, Inter, sans-serif';
      this.wrapText(ctx, mcq.question, cardX + 36, cardY + 140, cardW - 72, 54);
      ctx.restore();

      // Countdown Timer on Left Card (Bottom)
      if (isCountdown && !isRevealed) {
        const remainingSec = Math.max(0, timeline.countdownStartSec + timeline.countdownDurationSec - currentTimeSec);
        const displaySec = Math.ceil(remainingSec);
        const progress = remainingSec / timeline.countdownDurationSec;
        const timerCenterX = cardX + cardW / 2;
        const timerCenterY = cardY + cardH - 120;
        const radius = 54;

        ctx.save();
        ctx.lineWidth = 10;
        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(timerCenterX, timerCenterY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = displaySec <= 1 ? '#f43f5e' : theme.colors.primary;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(timerCenterX, timerCenterY, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
        ctx.stroke();

        ctx.fillStyle = displaySec <= 1 ? '#f43f5e' : theme.colors.textPrimary;
        ctx.font = '900 46px Outfit, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(displaySec), timerCenterX, timerCenterY - 4);
        ctx.font = 'bold 14px Outfit, Inter, sans-serif';
        ctx.fillStyle = theme.colors.textSecondary;
        ctx.fillText('SEC', timerCenterX, timerCenterY + 28);
        ctx.restore();
      }

      // Options Grid (Right Column)
      const optX = 960;
      const optW = 880;
      const optH = 100;
      const optGap = 20;
      const optStartY = 120;

      mcq.options.forEach((opt, idx) => {
        const optY = optStartY + idx * (optH + optGap);
        const isCorrect = opt.id === mcq.correctAnswer;

        ctx.save();
        if (isRevealed) {
          if (isCorrect) {
            ctx.fillStyle = '#10b981';
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 4;
          } else {
            ctx.fillStyle = isLight ? 'rgba(241, 245, 249, 0.6)' : 'rgba(15, 23, 42, 0.4)';
            ctx.strokeStyle = isLight ? 'rgba(203, 213, 225, 0.5)' : 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.35;
          }
        } else {
          ctx.fillStyle = theme.colors.optionCardBg;
          ctx.strokeStyle = theme.colors.optionCardBorder;
          ctx.lineWidth = 2;
        }

        this.roundRect(ctx, optX, optY, optW, optH, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isRevealed && isCorrect ? '#ffffff' : isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.12)';
        this.roundRect(ctx, optX + 18, optY + 16, 68, 68, 16);
        ctx.fill();

        ctx.fillStyle = isRevealed && isCorrect ? '#065f46' : isLight ? theme.colors.primary : '#ffffff';
        ctx.font = '900 30px Outfit, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(opt.id, optX + 52, optY + 50);

        ctx.fillStyle = isRevealed && isCorrect ? '#ffffff' : theme.colors.textPrimary;
        ctx.font = 'bold 30px Outfit, Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(opt.text, optX + 105, optY + 50);

        if (isRevealed && isCorrect) {
          ctx.fillStyle = '#ffffff';
          this.roundRect(ctx, optX + optW - 75, optY + 20, 56, 56, 28);
          ctx.fill();
          ctx.fillStyle = '#059669';
          ctx.font = '900 30px Outfit, Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✓', optX + optW - 47, optY + 49);
        }
        ctx.restore();
      });

      // Answer Banner (Right column bottom)
      if (isRevealed) {
        const bannerY = optStartY + 4 * (optH + optGap) + 10;
        ctx.save();
        const bannerGrad = ctx.createLinearGradient(optX, 0, optX + optW, 0);
        bannerGrad.addColorStop(0, '#10b981');
        bannerGrad.addColorStop(1, '#059669');
        ctx.fillStyle = bannerGrad;
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 3;
        this.roundRect(ctx, optX, bannerY, optW, 75, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 26px Outfit, Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🎉 CORRECT ANSWER: OPTION ${mcq.correctAnswer}`, optX + 28, bannerY + 38);
        ctx.restore();

        if (mcq.explanation && currentTimeSec >= timeline.explanationStartSec) {
          const explY = cardY + 440;
          ctx.save();
          ctx.fillStyle = theme.colors.questionCardBg;
          ctx.strokeStyle = theme.colors.questionBorder;
          ctx.lineWidth = 2;
          this.roundRect(ctx, cardX + 20, explY, cardW - 40, 280, 20);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = theme.colors.primary;
          ctx.font = 'bold 20px Outfit, Inter, sans-serif';
          ctx.fillText('💡 EXPLANATION:', cardX + 40, explY + 40);

          ctx.fillStyle = theme.colors.textPrimary;
          ctx.font = '500 24px Outfit, Inter, sans-serif';
          this.wrapText(ctx, mcq.explanation, cardX + 40, explY + 80, cardW - 80, 32);
          ctx.restore();
        }
      }
    } else {
      // ===== 9:16 VERTICAL OR 1:1 SQUARE LAYOUT =====
      const scaleFactor = isSquare ? 0.65 : 1.0;
      const cardX = isSquare ? 50 : 60;
      const cardY = isSquare ? 120 : 220;
      const cardW = w - cardX * 2;
      const cardH = isSquare ? 230 : 340;

      ctx.save();
      ctx.fillStyle = theme.colors.questionCardBg;
      ctx.strokeStyle = theme.colors.questionBorder;
      ctx.lineWidth = 3;
      ctx.shadowColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = isLight ? 20 : 40;
      ctx.shadowOffsetY = isLight ? 8 : 20;
      this.roundRect(ctx, cardX, cardY, cardW, cardH, isSquare ? 24 : 32);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.font = isSquare ? 'bold 16px Outfit, Inter, sans-serif' : 'bold 20px Outfit, Inter, sans-serif';
      const badgeMetrics = ctx.measureText(badgeText);
      const badgeWidth = Math.max(isSquare ? 130 : 170, badgeMetrics.width + 30);

      ctx.fillStyle = theme.colors.badgeBg;
      ctx.strokeStyle = theme.colors.questionBorder;
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, cardX + (isSquare ? 20 : 36), cardY + (isSquare ? 18 : 36), badgeWidth, isSquare ? 36 : 44, isSquare ? 18 : 22);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme.colors.primary;
      ctx.fillText(badgeText, cardX + (isSquare ? 32 : 54), cardY + (isSquare ? 42 : 65));

      if (mcq.category) {
        ctx.fillStyle = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.12)';
        this.roundRect(ctx, cardX + badgeWidth + (isSquare ? 30 : 50), cardY + (isSquare ? 18 : 36), isSquare ? 130 : 160, isSquare ? 36 : 44, isSquare ? 18 : 22);
        ctx.fill();
        ctx.fillStyle = theme.colors.textSecondary;
        ctx.font = isSquare ? '600 15px Outfit, Inter, sans-serif' : '600 18px Outfit, Inter, sans-serif';
        ctx.fillText(mcq.category, cardX + badgeWidth + (isSquare ? 42 : 66), cardY + (isSquare ? 42 : 65));
      }

      ctx.fillStyle = theme.colors.textPrimary;
      ctx.font = isSquare ? '800 32px Outfit, Inter, sans-serif' : '800 44px Outfit, Inter, sans-serif';
      this.wrapText(ctx, mcq.question, cardX + (isSquare ? 24 : 36), cardY + (isSquare ? 90 : 140), cardW - (isSquare ? 48 : 72), isSquare ? 40 : 54);
      ctx.restore();

      // Countdown Timer
      if (isCountdown && !isRevealed) {
        const remainingSec = Math.max(0, timeline.countdownStartSec + timeline.countdownDurationSec - currentTimeSec);
        const displaySec = Math.ceil(remainingSec);
        const progress = remainingSec / timeline.countdownDurationSec;

        const timerCenterX = w / 2;
        const timerCenterY = isSquare ? 385 : 640;
        const radius = isSquare ? 40 : 64;

        ctx.save();
        ctx.lineWidth = isSquare ? 8 : 12;
        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(timerCenterX, timerCenterY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = displaySec <= 1 ? '#f43f5e' : theme.colors.primary;
        ctx.lineCap = 'round';
        if (!isLight) {
          ctx.shadowColor = displaySec <= 1 ? '#f43f5e' : theme.colors.primary;
          ctx.shadowBlur = 20;
        }
        ctx.beginPath();
        ctx.arc(
          timerCenterX,
          timerCenterY,
          radius,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * progress,
          false
        );
        ctx.stroke();

        ctx.fillStyle = displaySec <= 1 ? '#f43f5e' : theme.colors.textPrimary;
        ctx.font = isSquare ? '900 36px Outfit, Inter, sans-serif' : '900 56px Outfit, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(displaySec), timerCenterX, timerCenterY - (isSquare ? 2 : 4));
        ctx.font = isSquare ? 'bold 12px Outfit, Inter, sans-serif' : 'bold 16px Outfit, Inter, sans-serif';
        ctx.fillStyle = theme.colors.textSecondary;
        ctx.fillText('SEC', timerCenterX, timerCenterY + (isSquare ? 22 : 34));
        ctx.restore();
      }

      // Options Grid (A, B, C, D)
      const optionStartY = isSquare ? 445 : 760;
      const optionH = isSquare ? 74 : 110;
      const optionGap = isSquare ? 14 : 26;

      mcq.options.forEach((opt, idx) => {
        const optY = optionStartY + idx * (optionH + optionGap);
        const isCorrect = opt.id === mcq.correctAnswer;

        ctx.save();
        if (isRevealed) {
          if (isCorrect) {
            ctx.fillStyle = '#10b981';
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 4;
            ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
            ctx.shadowBlur = 30;
          } else {
            ctx.fillStyle = isLight ? 'rgba(241, 245, 249, 0.6)' : 'rgba(15, 23, 42, 0.4)';
            ctx.strokeStyle = isLight ? 'rgba(203, 213, 225, 0.5)' : 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.35;
          }
        } else {
          ctx.fillStyle = theme.colors.optionCardBg;
          ctx.strokeStyle = theme.colors.optionCardBorder;
          ctx.lineWidth = 2;
          ctx.shadowColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 15;
        }

        this.roundRect(ctx, cardX, optY, cardW, optionH, isSquare ? 16 : 24);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Option Letter Badge
        ctx.save();
        if (isRevealed && isCorrect) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.12)';
        }
        const badgeBox = isSquare ? 50 : 70;
        this.roundRect(ctx, cardX + (isSquare ? 14 : 24), optY + (isSquare ? 12 : 20), badgeBox, badgeBox, isSquare ? 12 : 18);
        ctx.fill();

        ctx.fillStyle = isRevealed && isCorrect ? '#065f46' : isLight ? theme.colors.primary : '#ffffff';
        ctx.font = isSquare ? '900 24px Outfit, Inter, sans-serif' : '900 32px Outfit, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(opt.id, cardX + (isSquare ? 39 : 59), optY + (isSquare ? 37 : 55));

        ctx.fillStyle = isRevealed && isCorrect ? '#ffffff' : theme.colors.textPrimary;
        ctx.font = isSquare ? 'bold 24px Outfit, Inter, sans-serif' : 'bold 34px Outfit, Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(opt.text, cardX + (isSquare ? 78 : 116), optY + (isSquare ? 37 : 55));

        if (isRevealed && isCorrect) {
          ctx.fillStyle = '#ffffff';
          this.roundRect(ctx, cardX + cardW - (isSquare ? 56 : 80), optY + (isSquare ? 15 : 25), isSquare ? 44 : 60, isSquare ? 44 : 60, isSquare ? 22 : 30);
          ctx.fill();
          ctx.fillStyle = '#059669';
          ctx.font = isSquare ? '900 24px Outfit, Inter, sans-serif' : '900 32px Outfit, Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✓', cardX + cardW - (isSquare ? 34 : 50), optY + (isSquare ? 37 : 57));
        }
        ctx.restore();
      });

      // Answer Reveal Banner & Explanation
      if (isRevealed) {
        const bannerY = isSquare ? 810 : 1360;
        ctx.save();
        const bannerGrad = ctx.createLinearGradient(cardX, 0, cardX + cardW, 0);
        bannerGrad.addColorStop(0, '#10b981');
        bannerGrad.addColorStop(1, '#059669');
        ctx.fillStyle = bannerGrad;
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 3;
        this.roundRect(ctx, cardX, bannerY, cardW, isSquare ? 60 : 80, isSquare ? 16 : 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = isSquare ? '900 22px Outfit, Inter, sans-serif' : '900 28px Outfit, Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🎉 CORRECT ANSWER: OPTION ${mcq.correctAnswer}`, cardX + (isSquare ? 20 : 30), bannerY + (isSquare ? 30 : 40));
        ctx.restore();

        if (mcq.explanation && currentTimeSec >= timeline.explanationStartSec && !isSquare) {
          const explY = 1470;
          ctx.save();
          ctx.fillStyle = theme.colors.questionCardBg;
          ctx.strokeStyle = theme.colors.questionBorder;
          ctx.lineWidth = 2;
          this.roundRect(ctx, cardX, explY, cardW, 240, 24);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = theme.colors.primary;
          ctx.font = 'bold 22px Outfit, Inter, sans-serif';
          ctx.fillText('💡 EXPLANATION:', cardX + 30, explY + 45);

          ctx.fillStyle = theme.colors.textPrimary;
          ctx.font = '500 28px Outfit, Inter, sans-serif';
          this.wrapText(ctx, mcq.explanation, cardX + 30, explY + 95, cardW - 60, 38);
          ctx.restore();
        }
      }
    }

    // 10. Footer CTA
    ctx.save();
    ctx.fillStyle = theme.colors.textSecondary;
    ctx.font = isLandscape ? 'bold 18px Outfit, Inter, sans-serif' : 'bold 22px Outfit, Inter, sans-serif';
    ctx.fillText('PAUSE TO SOLVE • COMMENT YOUR SCORE', isLandscape ? 80 : 60, h - (isLandscape ? 35 : 70));

    ctx.fillStyle = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.15)';
    ctx.strokeStyle = isLight ? '#e2e8f0' : 'transparent';
    ctx.lineWidth = 1;
    const btnW = isLandscape ? 160 : 200;
    const btnH = isLandscape ? 40 : 52;
    this.roundRect(ctx, w - (isLandscape ? 240 : 280), h - (isLandscape ? 58 : 100), btnW, btnH, btnH / 2);
    ctx.fill();
    if (isLight) ctx.stroke();
    ctx.fillStyle = theme.colors.textPrimary;
    ctx.font = isLandscape ? 'bold 16px Outfit, Inter, sans-serif' : 'bold 20px Outfit, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔔 FOLLOW', w - (isLandscape ? 160 : 180), h - (isLandscape ? 34 : 67));
    ctx.restore();

    ctx.restore(); // Restore root scale
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }
}

export const videoEncoderService = new VideoEncoderService();
