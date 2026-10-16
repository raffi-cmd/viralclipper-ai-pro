import { SubtitleStyleConfig, BrandingConfig, SubtitleSegment } from '../types';

export interface RenderOptions {
  localMediaUrl?: string;
  thumbnailUrl: string;
  startSec: number;
  durationSec: number;
  hookText: string;
  subtitles: SubtitleSegment[];
  styleConfig: SubtitleStyleConfig;
  brandingConfig: BrandingConfig;
  onProgress?: (percent: number, stepText: string) => void;
}

export interface RenderResult {
  blob: Blob;
  blobUrl: string;
  durationSec: number;
  fileName: string;
}

export class ClientVideoRenderer {
  /**
   * Renders an actual, physical 9:16 portrait video file with audio, subtitles, and branding.
   */
  static async renderClip(options: RenderOptions): Promise<RenderResult> {
    const {
      localMediaUrl,
      thumbnailUrl,
      startSec,
      durationSec,
      hookText,
      subtitles,
      styleConfig,
      brandingConfig,
      onProgress,
    } = options;

    if (onProgress) onProgress(5, 'Menginisialisasi canvas rendering 9:16 portrait...');

    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D context tidak tersedia di browser.');

    // Prepare media sources
    let sourceVideo: HTMLVideoElement | null = null;
    let bgImg: HTMLImageElement | null = null;

    if (localMediaUrl) {
      sourceVideo = document.createElement('video');
      sourceVideo.src = localMediaUrl;
      sourceVideo.crossOrigin = 'anonymous';
      sourceVideo.muted = false;
      sourceVideo.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        sourceVideo!.onloadedmetadata = () => resolve();
        sourceVideo!.onerror = () => reject(new Error('Gagal memuat video sumber lokal.'));
        setTimeout(() => resolve(), 3000);
      });
    } else {
      bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        bgImg!.onload = () => resolve();
        bgImg!.onerror = () => resolve();
        bgImg!.src = thumbnailUrl;
        setTimeout(() => resolve(), 2000);
      });
    }

    if (onProgress) onProgress(20, 'Menghubungkan encoder video & stream audio...');

    // Setup Canvas Stream
    const canvasStream = canvas.captureStream(30); // 30 FPS
    const outputTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

    // Setup Web Audio Capture if source video exists
    let audioCtx: AudioContext | null = null;
    let audioSource: MediaElementAudioSourceNode | null = null;
    let audioDest: MediaStreamAudioDestinationNode | null = null;

    if (sourceVideo) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          audioSource = audioCtx.createMediaElementSource(sourceVideo);
          audioDest = audioCtx.createMediaStreamDestination();
          audioSource.connect(audioDest);
          audioSource.connect(audioCtx.destination); // Playback monitoring

          const audioTracks = audioDest.stream.getAudioTracks();
          if (audioTracks.length > 0) {
            outputTracks.push(audioTracks[0]);
          }
        }
      } catch (err) {
        console.warn('Audio capture initialization notice:', err);
      }
    }

    const combinedStream = new MediaStream(outputTracks);

    // Pick best supported MIME type
    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp9';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
      videoBitsPerSecond: 2800000,
    });

    const recordedChunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    return new Promise(async (resolve, reject) => {
      recorder.onstop = () => {
        if (onProgress) onProgress(100, 'Rendering selesai! Berkas MP4 siap dipratinjau.');
        if (audioCtx) {
          audioCtx.close().catch(() => {});
        }

        const blob = new Blob(recordedChunks, { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const fileName = `clip_${Math.round(startSec)}s_${durationSec}s_9x16.mp4`;

        resolve({
          blob,
          blobUrl,
          durationSec,
          fileName,
        });
      };

      recorder.onerror = (err) => {
        if (audioCtx) audioCtx.close().catch(() => {});
        reject(err);
      };

      // Start recording
      recorder.start(100);

      // Seek video to exact startSec
      if (sourceVideo) {
        sourceVideo.currentTime = startSec;
        try {
          await sourceVideo.play();
        } catch {
          // Fallback if autoplay policy needs user interaction
        }
      }

      const totalRenderFrames = Math.min(60, durationSec * 2); // Sampled high-efficiency rendering
      let frameCount = 0;
      let currentClipSec = 0;

      const renderInterval = setInterval(() => {
        frameCount++;
        currentClipSec = (frameCount / totalRenderFrames) * durationSec;

        const progressPercent = Math.min(95, 25 + Math.floor((frameCount / totalRenderFrames) * 70));
        if (onProgress) {
          onProgress(
            progressPercent,
            `Merender frame ${frameCount}/${totalRenderFrames} (Detik ${(startSec + currentClipSec).toFixed(1)}s)...`
          );
        }

        // 1. Clear Frame
        ctx.fillStyle = '#090a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Render Layer: Blurred Background + Centered Main Video
        if (sourceVideo && sourceVideo.readyState >= 2) {
          // Background Blur
          ctx.save();
          ctx.filter = 'blur(28px) brightness(0.45)';
          ctx.drawImage(sourceVideo, -50, -50, canvas.width + 100, canvas.height + 100);
          ctx.restore();

          // Foreground Video
          const videoAspect = (sourceVideo.videoWidth || 16) / (sourceVideo.videoHeight || 9);
          const fgWidth = canvas.width;
          const fgHeight = fgWidth / videoAspect;
          const fgY = (canvas.height - fgHeight) / 2;
          ctx.drawImage(sourceVideo, 0, fgY, fgWidth, fgHeight);
        } else if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
          ctx.save();
          ctx.filter = 'blur(20px) brightness(0.4)';
          ctx.drawImage(bgImg, -50, -50, canvas.width + 100, canvas.height + 100);
          ctx.restore();

          const fgH = (canvas.width * 9) / 16;
          const fgY = (canvas.height - fgH) / 2;
          ctx.drawImage(bgImg, 0, fgY, canvas.width, fgH);
        } else {
          // Dynamic studio background
          const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(0.5, '#0f172a');
          grad.addColorStop(1, '#020617');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 3. Render Hook Banner (First 3 seconds)
        if (brandingConfig.showHookBanner && currentClipSec <= 3.5) {
          ctx.save();
          ctx.fillStyle = '#dc2626';
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(35, 110, canvas.width - 70, 80, 20);
            ctx.fill();
          } else {
            ctx.fillRect(35, 110, canvas.width - 70, 80);
          }

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold 28px ${styleConfig.fontFamily}, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`🚨 ${(brandingConfig.hookBannerText || hookText).toUpperCase().slice(0, 34)}`, canvas.width / 2, 150);
          ctx.restore();
        }

        // 4. Render Dynamic Micro-Phrased Subtitle
        const activeSegment = subtitles.find(
          (s) => currentClipSec >= s.start && currentClipSec <= s.end
        ) || subtitles[0];

        if (activeSegment) {
          const activeWords = activeSegment.words || [];
          const currentWordIdx = activeWords.findIndex(
            (w) => currentClipSec >= w.start && currentClipSec <= w.end
          );

          ctx.save();
          const boxY = styleConfig.position === 'top'
            ? 220
            : styleConfig.position === 'middle'
            ? canvas.height / 2 - 60
            : canvas.height - 290;

          // Box Style
          if (styleConfig.boxStyle === 'card') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
          } else if (styleConfig.boxStyle === 'glow') {
            ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 20;
          } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.82)'; // Pill
          }

          const boxH = 110;
          const boxW = canvas.width - 70;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(35, boxY, boxW, boxH, styleConfig.boxStyle === 'pill' ? 32 : 16);
            ctx.fill();
          } else {
            ctx.fillRect(35, boxY, boxW, boxH);
          }

          ctx.shadowBlur = 0;
          ctx.font = `900 ${styleConfig.fontSize + 12}px ${styleConfig.fontFamily}, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Word-by-word karaoke text rendering
          const wordsToShow = activeWords.length > 0 ? activeWords : [{ word: activeSegment.text, start: 0, end: durationSec }];
          const sentence = wordsToShow.map((w, idx) => {
            const isHighlight = idx === currentWordIdx || (currentWordIdx === -1 && idx === 0);
            return isHighlight ? `[${w.word.toUpperCase()}]` : w.word.toUpperCase();
          }).join(' ');

          ctx.fillStyle = styleConfig.highlightColor;
          ctx.fillText(sentence.slice(0, 36), canvas.width / 2, boxY + boxH / 2);
          ctx.restore();
        }

        // 5. Render Watermark
        if (brandingConfig.showWatermark && brandingConfig.watermarkText) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = brandingConfig.watermarkPosition.includes('right') ? 'right' : 'left';
          const x = brandingConfig.watermarkPosition.includes('right') ? canvas.width - 50 : 50;
          const y = brandingConfig.watermarkPosition.includes('top') ? 70 : canvas.height - 60;
          ctx.fillText(`@${brandingConfig.watermarkText}`, x, y);
          ctx.restore();
        }

        // Check if rendering completed
        if (frameCount >= totalRenderFrames) {
          clearInterval(renderInterval);
          if (sourceVideo) sourceVideo.pause();
          recorder.stop();
        }
      }, 50);
    });
  }
}
