const { exec } = require('child_process');
const fs = require('fs');

const cmd = 'ffmpeg -y -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 -filter_complex "[0:v]drawtext=text=\'HELLO\':fontsize=30:fontcolor=white[v]" -map "[v]" -c:v libx264 test_dt.mp4';

exec(cmd, (err, stdout, stderr) => {
  console.log('ERR:', err ? err.message : 'NONE');
  console.log('STDERR:', stderr.slice(-400));
  if (fs.existsSync('test_dt.mp4')) {
    fs.unlinkSync('test_dt.mp4');
  }
});
