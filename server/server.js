const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 3001;
const PUBLIC_OUTPUTS_DIR = path.join(process.cwd(), 'public', 'outputs');
const TMP_DIR = path.join(process.cwd(), 'tmp');

if (!fs.existsSync(PUBLIC_OUTPUTS_DIR)) fs.mkdirSync(PUBLIC_OUTPUTS_DIR, { recursive: true });
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Check Windows font
const fontPath = 'C\\:/Windows/Fonts/arial.ttf';
const hasArialFont = fs.existsSync('C:/Windows/Fonts/arial.ttf');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Disposition');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // 1. Health check
  if (pathname === '/health' && req.method === 'GET') {
    let hasFFmpeg = false;
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      hasFFmpeg = true;
    } catch {}

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'ViralClipper FFmpeg Server',
      version: '2.0.0',
      ffmpeg: hasFFmpeg,
      nodeVersion: process.version
    }));
    return;
  }

  // 2. Process video request (Generates actual MP4 clip with FFmpeg)
  if (pathname === '/api/process' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyData || '{}');
        const clipStart = Number(body.clipStart || 0);
        const clipDuration = Number(body.targetDuration || 5);
        const clipId = body.clipId || 'clip_1';
        const jobId = 'job_' + Date.now();
        const outFileName = `viral_${clipId}_${jobId}.mp4`;
        const outputPath = path.join(PUBLIC_OUTPUTS_DIR, outFileName);

        let inputVideo = body.inputVideo;
        let isSynthetic = false;

        // If no input video provided or not found, synthesize test video segment
        if (!inputVideo || !fs.existsSync(inputVideo)) {
          isSynthetic = true;
          inputVideo = path.join(TMP_DIR, `${jobId}_input.mp4`);
          const genCmd = `ffmpeg -y -f lavfi -i testsrc=duration=${clipDuration + 5}:size=1280x720:rate=30 -f lavfi -i sine=frequency=440:duration=${clipDuration + 5} -c:v libx264 -pix_fmt yuv420p -c:a aac "${inputVideo}"`;
          execSync(genCmd, { stdio: 'ignore' });
        }

        // Construct robust FFmpeg filtergraph
        const hookText = (body.hookTitle || 'VIRAL MOMENT').replace(/[':"]/g, '');
        const watermark = (body.watermarkText || 'ViralClipper').replace(/[':"]/g, '');

        const aspectRatio = body.aspectRatio || '9:16';
        let targetW = 1080;
        let targetH = 1920;
        if (aspectRatio === '1:1') {
          targetW = 1080;
          targetH = 1080;
        } else if (aspectRatio === '16:9') {
          targetW = 1920;
          targetH = 1080;
        }

        let filterGraph = `[0:v]trim=start=${clipStart}:duration=${clipDuration},setpts=PTS-STARTPTS,split=2[raw_bg][raw_fg];[raw_bg]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},boxblur=20:5[bg];[raw_fg]scale=${targetW}:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v_base]`;

        if (hasArialFont) {
          const bannerY = aspectRatio === '16:9' ? 60 : 180;
          const textY = aspectRatio === '16:9' ? 100 : 220;
          const bannerW = targetW - 120;
          filterGraph += `;[v_base]drawbox=x=60:y=${bannerY}:w=${bannerW}:h=120:color=red@0.9:t=fill:enable='between(t,0,5)',drawtext=fontfile='${fontPath}':text='${hookText}':x=(w-text_w)/2:y=${textY}:fontsize=44:fontcolor=white:enable='between(t,0,5)',drawtext=fontfile='${fontPath}':text='@${watermark}':x=w-tw-50:y=h-th-50:fontsize=26:fontcolor=white@0.7[v_out]`;
        } else {
          filterGraph += `;[v_base]null[v_out]`;
        }

        const renderCmd = `ffmpeg -y -ss ${clipStart} -t ${clipDuration} -i "${inputVideo}" -filter_complex "${filterGraph}" -map "[v_out]" -map 0:a? -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`;
        execSync(renderCmd, { stdio: 'ignore' });

        if (isSynthetic && fs.existsSync(inputVideo)) {
          try { fs.unlinkSync(inputVideo); } catch {}
        }

        const stat = fs.statSync(outputPath);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          jobId,
          clipId,
          videoUrl: `http://127.0.0.1:${PORT}/outputs/${outFileName}`,
          duration: clipDuration,
          fileSize: stat.size,
          fileName: outFileName
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 3. Serve static generated MP4 files with range support and proper content headers
  if (pathname.startsWith('/outputs/')) {
    const fileName = path.basename(pathname);
    const filePath = path.join(PUBLIC_OUTPUTS_DIR, fileName);

    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
          'Content-Disposition': `inline; filename="${fileName}"`,
          'Access-Control-Allow-Origin': '*'
        });
        file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': stat.size,
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Access-Control-Allow-Origin': '*'
        });
        fs.createReadStream(filePath).pipe(res);
      }
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint tidak ditemukan' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[ViralClipper Server] Active on http://127.0.0.1:${PORT}`);
});
