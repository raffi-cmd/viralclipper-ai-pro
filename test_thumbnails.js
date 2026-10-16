const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== MULTI-CLIP THUMBNAIL & RELEVANCE EXTRACTION TEST ===');

const thumbsDir = path.join(process.cwd(), 'public', 'thumbnails');
if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });

// Synthetic automotive video source with timestamp countdown & changing visual scene
const testVideoPath = path.join(process.cwd(), 'tmp', 'source_racing_video.mp4');
const genCmd = `ffmpeg -y -f lavfi -i testsrc=duration=25:size=1280x720:rate=30 -f lavfi -i sine=frequency=440:duration=25 -c:v libx264 -pix_fmt yuv420p -c:a aac "${testVideoPath}"`;
execSync(genCmd, { stdio: 'ignore' });

// Clips configuration with distinct timestamps
const clips = [
  { id: 'clip_1', rank: 1, title: 'Aksi Drifting Tikungan Pertama', timestampSec: 3 },
  { id: 'clip_2', rank: 2, title: 'Akselerasi Gigi Maksimal', timestampSec: 11 },
  { id: 'clip_3', rank: 3, title: 'Finish Garis Akhir Kemenangan', timestampSec: 20 },
];

const results = [];

clips.forEach((clip) => {
  const thumbFileName = `thumb_${clip.id}_t${clip.timestampSec}s.jpg`;
  const thumbFilePath = path.join(thumbsDir, thumbFileName);

  // Extract real frame at exact timestamp using FFmpeg
  const extCmd = `ffmpeg -y -ss ${clip.timestampSec} -i "${testVideoPath}" -vframes 1 -q:v 2 "${thumbFilePath}"`;
  execSync(extCmd, { stdio: 'ignore' });

  const stat = fs.statSync(thumbFilePath);

  // Inspect frame with ffprobe
  const probeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json "${thumbFilePath}"`;
  const probeData = JSON.parse(execSync(probeCmd).toString());
  const stream = probeData.streams[0];

  results.push({
    clipId: clip.id,
    rank: clip.rank,
    title: clip.title,
    timestampSec: clip.timestampSec,
    width: stream.width,
    height: stream.height,
    fileSize: stat.size,
    fileName: thumbFileName,
    filePath: thumbFilePath,
    url: `/thumbnails/${thumbFileName}`
  });
});

console.log('RESULTS:', JSON.stringify(results, null, 2));
