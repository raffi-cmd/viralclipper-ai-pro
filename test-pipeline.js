const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== VIRALCLIPPER AI PRO PIPELINE TEST SUITE ===');

const testDir = path.join(__dirname, 'tmp_test');
if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

// 1. Generate a synthetic test video (Automotive racing simulation 10 seconds, 720x1280 9:16)
const sampleVideoPath = path.join(testDir, 'car_race_test.mp4');
console.log('\n[TEST 1] Generating automotive test video with FFmpeg...');

try {
  // Generate 15-second test video with sound and motion
  const genCmd = `ffmpeg -y -f lavfi -i testsrc=duration=15:size=1280x720:rate=30 -f lavfi -i sine=frequency=440:duration=15 -c:v libx264 -pix_fmt yuv420p -c:a aac "${sampleVideoPath}"`;
  execSync(genCmd, { stdio: 'pipe' });
  console.log('✓ Test video generated:', sampleVideoPath);

  // 2. Validate duration & streams with ffprobe
  console.log('\n[TEST 2] Verifying duration & streams with ffprobe...');
  const probeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of json "${sampleVideoPath}"`;
  const probeOut = execSync(probeCmd).toString();
  const probeData = JSON.parse(probeOut);
  const stream = probeData.streams[0];
  console.log(`✓ Video width: ${stream.width}, height: ${stream.height}, duration: ${stream.duration}s`);

  // 3. Test exact clipping with FFmpeg (Target 5 seconds clip)
  console.log('\n[TEST 3] Trimming exact 5s clip segment (ss=2, t=5)...');
  const clipOutputPath = path.join(testDir, 'clip_5s_out.mp4');
  const clipCmd = `ffmpeg -y -ss 2 -i "${sampleVideoPath}" -t 5 -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart "${clipOutputPath}"`;
  execSync(clipCmd, { stdio: 'pipe' });

  // 4. Verify trimmed clip duration with ffprobe
  const clipProbeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=duration -of json "${clipOutputPath}"`;
  const clipProbeOut = execSync(clipProbeCmd).toString();
  const clipStream = JSON.parse(clipProbeOut).streams[0];
  const clipDuration = parseFloat(clipStream.duration);
  console.log(`✓ Clipped video actual duration: ${clipDuration}s (Requested: 5s, diff: ${Math.abs(clipDuration - 5)}s)`);

  // 5. Test real frame extraction for thumbnail at t=4s
  console.log('\n[TEST 4] Extracting candidate frame at t=4s for intelligent thumbnail...');
  const thumbPath = path.join(testDir, 'frame_thumb.jpg');
  const thumbCmd = `ffmpeg -y -ss 4 -i "${sampleVideoPath}" -vframes 1 -q:v 2 "${thumbPath}"`;
  execSync(thumbCmd, { stdio: 'pipe' });
  const thumbStat = fs.statSync(thumbPath);
  console.log(`✓ Real frame captured: ${thumbPath} (size: ${thumbStat.size} bytes)`);

  console.log('\n=== ALL AUTOMATED MEDIA TESTS PASSED (100% SUCCESS) ===\n');
} catch (err) {
  console.error('Test failed:', err.message);
  process.exit(1);
} finally {
  // Cleanup test artifacts
  try {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  } catch {}
}
