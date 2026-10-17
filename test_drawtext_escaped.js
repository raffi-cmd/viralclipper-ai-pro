const { exec } = require('child_process');
const fs = require('fs');

// Notice escaped colon: C\\:/Windows/Fonts/arial.ttf
const cmd = 'ffmpeg -y -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 -filter_complex "[0:v]drawtext=fontfile=\'C\\:/Windows/Fonts/arial.ttf\':text=\'HELLO\':fontsize=30:fontcolor=white[v]" -map "[v]" -c:v libx264 test_dt.mp4';

exec(cmd, (err, stdout, stderr) => {
  console.log('ERR:', err ? err.message : 'NONE');
  if (fs.existsSync('test_dt.mp4')) {
    console.log('SIZE:', fs.statSync('test_dt.mp4').size);
    fs.unlinkSync('test_dt.mp4');
  }
});
