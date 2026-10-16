import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import crypto from 'crypto';
import { VideoDownloader } from './lib/downloader';
import { FFmpegPipelineBuilder } from './lib/ffmpeg-builder';

const PORT = process.env.PORT || 3001;
const PUBLIC_OUTPUTS_DIR = path.join(process.cwd(), 'public', 'outputs');
const TMP_DIR = path.join(process.cwd(), 'tmp');

if (!fs.existsSync(PUBLIC_OUTPUTS_DIR)) fs.mkdirSync(PUBLIC_OUTPUTS_DIR, { recursive: true });
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '';

  // 1. Health check
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'ViralClipper FFmpeg Server', version: '2.0.0' }));
    return;
  }

  // 2. Process video request via FFmpeg & yt-dlp
  if (pathname === '/api/process' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', (chunk) => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyData || '{}');
        const videoUrl = body.url;
        const targetDuration = body.targetDuration || 60;
        const clipStart = body.clipStart || 0;
        const jobId = crypto.randomUUID().slice(0, 8);
        const jobTempDir = path.join(TMP_DIR, jobId);

        if (!fs.existsSync(jobTempDir)) fs.mkdirSync(jobTempDir, { recursive: true });

        // Download via yt-dlp
        const downloader = new VideoDownloader(jobTempDir);
        const { videoPath } = await downloader.download(videoUrl, jobId);
        const metadata = await downloader.getMetadata(videoPath);

        // Subtitle generation
        const assPath = path.join(jobTempDir, `${jobId}.ass`);
        FFmpegPipelineBuilder.generateASSFile(
          body.subtitles || [],
          assPath,
          body.preset || 'hormozi',
          path.join(process.cwd(), 'public', 'fonts')
        );

        // Render video via FFmpeg
        const outFileName = `viral_${jobId}.mp4`;
        const outputPath = path.join(PUBLIC_OUTPUTS_DIR, outFileName);

        await FFmpegPipelineBuilder.renderVideo({
          inputVideo: videoPath,
          clipStart,
          clipDuration: targetDuration,
          outputVideo: outputPath,
          assPath,
          isLandscape: metadata.isLandscape,
          hookTitle: body.hookTitle,
          watermarkText: body.watermarkText,
        });

        // Cleanup temp files
        fs.rmSync(jobTempDir, { recursive: true, force: true });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            jobId,
            videoUrl: `/outputs/${outFileName}`,
            duration: targetDuration,
          })
        );
      } catch (err: any) {
        console.error('Server Process Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err?.message || 'Server processing error' }));
      }
    });
    return;
  }

  // 3. Serve static generated files
  if (pathname.startsWith('/outputs/')) {
    const filePath = path.join(PUBLIC_OUTPUTS_DIR, pathname.replace('/outputs/', ''));
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'video/mp4' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint tidak ditemukan.' }));
});

server.listen(PORT, () => {
  console.log(`[ViralClipper Server] Berjalan di port ${PORT} (http://localhost:${PORT})`);
});
