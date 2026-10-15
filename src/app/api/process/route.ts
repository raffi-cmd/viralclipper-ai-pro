import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { VideoDownloader } from '@/lib/downloader';
import { UnifiedAIClient } from '@/lib/ai-provider';
import { FFmpegPipelineBuilder } from '@/lib/ffmpeg-builder';
import { VideoProcessRequest, SSEMessage } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const body: VideoProcessRequest = await req.json();

  const customReadable = new ReadableStream({
    async start(controller) {
      const sendEvent = (msg: SSEMessage) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
      };

      const jobId = crypto.randomUUID().slice(0, 8);
      const tempDir = path.join(process.cwd(), 'tmp', jobId);
      const publicOutputDir = path.join(process.cwd(), 'public', 'outputs');

      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      if (!fs.existsSync(publicOutputDir)) fs.mkdirSync(publicOutputDir, { recursive: true });

      try {
        // --- STEP 1: DOWNLOAD VIDEO & EXTRACT AUDIO ---
        sendEvent({
          step: 'downloading',
          progress: 15,
          message: 'Mengunduh video dan mengekstrak audio via yt-dlp...',
        });

        const downloader = new VideoDownloader(tempDir);
        const { videoPath, audioPath } = await downloader.download(body.url, jobId);
        const metadata = await downloader.getMetadata(videoPath);

        // --- STEP 2: AI HOOK DETECTION & TRANSLATION ---
        sendEvent({
          step: 'analyzing',
          progress: 45,
          message: 'AI sedang mendeteksi viral hook dan menerjemahkan ke Bahasa Indonesia...',
        });

        const aiClient = new UnifiedAIClient(body.settings);
        const analysis = await aiClient.analyzeAndTranscribe(
          audioPath,
          body.targetDuration,
          metadata.duration
        );

        // --- STEP 3: GENERATE HIGH-RETENTION ASS SUBTITLE ---
        sendEvent({
          step: 'transcribing',
          progress: 70,
          message: 'Menyusun preset subtitle dinamis (word-by-word highlight & emoji)...',
        });

        const assFilePath = path.join(tempDir, `${jobId}_subtitles.ass`);
        FFmpegPipelineBuilder.generateASSFile(
          analysis.subtitles,
          assFilePath,
          body.preset,
          path.join(process.cwd(), 'public', 'fonts')
        );

        // --- STEP 4: FFMPEG DUAL-LAYER & RENDERING ---
        sendEvent({
          step: 'rendering',
          progress: 85,
          message: 'Rendering video: Canvas 9:16, Background Blur, Subtle Zoom, & Subtitle Burn-In...',
        });

        const outputFileName = `viral_${jobId}.mp4`;
        const finalOutputPath = path.join(publicOutputDir, outputFileName);

        const clipStart = analysis.hookStart || 0;
        const clipDuration = Math.min(
          body.targetDuration,
          (analysis.hookEnd || body.targetDuration) - clipStart
        );

        await FFmpegPipelineBuilder.renderVideo({
          inputVideo: videoPath,
          clipStart,
          clipDuration,
          outputVideo: finalOutputPath,
          assPath: assFilePath,
          isLandscape: metadata.isLandscape,
          hookTitle: body.hookTitle || analysis.copywriting.hookHeadline,
          watermarkText: body.watermarkText,
        });

        // --- STEP 5: COMPLETED ---
        sendEvent({
          step: 'completed',
          progress: 100,
          message: 'Proses selesai! Video siap dipratinjau & diunduh.',
          data: {
            videoUrl: `/outputs/${outputFileName}`,
            analysis,
            duration: clipDuration,
          },
        });

        // Cleanup temporary processing directory
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        controller.close();
      } catch (error: any) {
        console.error('Pipeline Error:', error);
        sendEvent({
          step: 'error',
          progress: 0,
          message: error.message || 'Terjadi kesalahan internal saat memproses video.',
        });
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        controller.close();
      }
    },
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
