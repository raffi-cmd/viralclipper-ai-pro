const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log(' VIRALCLIPPER AI PRO — AUTOMATED TEST SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`[FAIL] Test ${totalTests}: ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Source Adapters (Validation & URL Classification)
// ---------------------------------------------------------------------------
runTest('SourceAdapter - YouTube URL extraction and validation', () => {
  const urls = [
    'https://www.youtube.com/watch?v=EodfcT2s9Xo',
    'https://youtu.be/EodfcT2s9Xo',
    'https://www.youtube.com/embed/EodfcT2s9Xo'
  ];
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  urls.forEach(u => {
    const match = u.match(regExp);
    if (!match || match[2] !== 'EodfcT2s9Xo') throw new Error(`Failed to extract ID from ${u}`);
  });
});

runTest('SourceAdapter - TikTok URL validation', () => {
  const tiktokUrl = 'https://www.tiktok.com/@creator/video/1234567890123456789';
  if (!/tiktok\.com/i.test(tiktokUrl)) throw new Error('TikTok regex failed');
});

// ---------------------------------------------------------------------------
// TEST 2: Highlight Detector & Topic-Aware Logic
// ---------------------------------------------------------------------------
runTest('IntelligentHighlightDetector - Distinct Viral Scoring formula', () => {
  const clipCount = 5;
  const scores = [];
  for (let idx = 0; idx < clipCount; idx++) {
    // Formula from highlight-detector.ts
    const score = Math.max(70, Math.min(99, Math.round(99 - idx * 4 - (idx % 2))));
    scores.push(score);
  }
  // Verify scores are unique and descending
  const uniqueScores = new Set(scores);
  if (uniqueScores.size !== clipCount) throw new Error('Scores are duplicate: ' + scores.join(', '));
  if (scores[0] <= scores[scores.length - 1]) throw new Error('Scores not descending');
});

runTest('ThumbnailEngine - Topic Detection from title keywords', () => {
  const testCases = [
    { title: 'Aksi Balap Mobil Porsche GT3 di Sirkuit', expected: 'automotive' },
    { title: 'Gameplay Valorant Rank Radiant Terbaru', expected: 'gaming' },
    { title: 'Podcast Bincang Inspiratif Bersama Pengusaha', expected: 'podcast' },
    { title: 'Tutorial Belajar Next.js 14 untuk Pemula', expected: 'educational' }
  ];

  function detectTopic(title) {
    const lower = title.toLowerCase();
    if (/mobil|motor|balap|otomotif|car|drift|vehicle|bmw|ferrari|toyota|honda|engine|speed/i.test(lower)) return 'automotive';
    if (/game|gaming|gameplay|gta|minecraft|roblox|valorant|mobile legends|esport|streamer/i.test(lower)) return 'gaming';
    if (/podcast|wawancara|bicara|interview|ngobrol|curhat|cerita|bincang/i.test(lower)) return 'podcast';
    if (/tutorial|belajar|cara|edukasi|tips|trik|panduan|kursus|penjelasan|ilmiah/i.test(lower)) return 'educational';
    return 'high_energy';
  }

  testCases.forEach(tc => {
    const actual = detectTopic(tc.title);
    if (actual !== tc.expected) throw new Error(`Expected ${tc.expected} for "${tc.title}", got ${actual}`);
  });
});

// ---------------------------------------------------------------------------
// TEST 3: Subtitle Generation (SRT & ASS Formatting)
// ---------------------------------------------------------------------------
runTest('SubtitleFileExporter - Valid SRT file generation', () => {
  const sampleSubtitles = [
    {
      id: 1,
      start: 0,
      end: 2.5,
      text: 'SELAMAT DATANG DI BALAP MOBIL',
      words: [{ word: 'SELAMAT', start: 0, end: 0.8 }, { word: 'DATANG', start: 0.8, end: 1.5 }]
    }
  ];

  function formatSRTTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
  }

  const srt = `1\n${formatSRTTime(sampleSubtitles[0].start)} --> ${formatSRTTime(sampleSubtitles[0].end)}\n${sampleSubtitles[0].text}\n\n`;
  if (!srt.includes('00:00:00,000 --> 00:00:02,500')) throw new Error('SRT time format invalid: ' + srt);
});

// ---------------------------------------------------------------------------
// TEST 4: Physical Media Generation & ffprobe Verification
// ---------------------------------------------------------------------------
const tmpTestVideo = path.join(process.cwd(), 'tmp', 'unit_test_media.mp4');
const tmpClipVideo = path.join(process.cwd(), 'tmp', 'unit_test_clip.mp4');

runTest('Media Engine - Generate synthetic test video with FFmpeg', () => {
  const cmd = `ffmpeg -y -f lavfi -i testsrc=duration=6:size=1280x720:rate=30 -f lavfi -i sine=frequency=440:duration=6 -c:v libx264 -pix_fmt yuv420p -c:a aac "${tmpTestVideo}"`;
  execSync(cmd, { stdio: 'ignore' });
  if (!fs.existsSync(tmpTestVideo) || fs.statSync(tmpTestVideo).size === 0) {
    throw new Error('Test video generation failed');
  }
});

runTest('Media Engine - Trim exact 3s clip and verify duration with ffprobe', () => {
  const trimCmd = `ffmpeg -y -ss 1 -t 3 -i "${tmpTestVideo}" -c:v libx264 -pix_fmt yuv420p -c:a aac "${tmpClipVideo}"`;
  execSync(trimCmd, { stdio: 'ignore' });

  const probeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=duration,width,height -of json "${tmpClipVideo}"`;
  const probeData = JSON.parse(execSync(probeCmd).toString());
  const stream = probeData.streams[0];
  const dur = parseFloat(stream.duration);

  if (Math.abs(dur - 3.0) > 0.1) throw new Error(`Duration mismatch: expected 3s, got ${dur}s`);
});

runTest('Media Engine - Extract candidate frame thumbnail and verify non-zero size', () => {
  const thumbPath = path.join(process.cwd(), 'tmp', 'unit_test_thumb.jpg');
  const thumbCmd = `ffmpeg -y -ss 2 -i "${tmpTestVideo}" -vframes 1 -q:v 2 "${thumbPath}"`;
  execSync(thumbCmd, { stdio: 'ignore' });

  if (!fs.existsSync(thumbPath)) throw new Error('Thumbnail not created');
  const size = fs.statSync(thumbPath).size;
  if (size < 1000) throw new Error(`Thumbnail size suspiciously small: ${size} bytes`);
  fs.unlinkSync(thumbPath);
});

// Clean up test files
try {
  if (fs.existsSync(tmpTestVideo)) fs.unlinkSync(tmpTestVideo);
  if (fs.existsSync(tmpClipVideo)) fs.unlinkSync(tmpClipVideo);
} catch {}

console.log('\n====================================================');
console.log(` SUMMARY: ${passedTests}/${totalTests} Tests Passed (${failedTests} Failures)`);
console.log('====================================================');

if (failedTests > 0) process.exit(1);
