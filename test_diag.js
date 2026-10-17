const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const cmd = 'ffmpeg -y -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 -filter_complex "[0:v]split=2[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[v_bg];[fg]scale=1080:-2[v_fg];[v_bg][v_fg]overlay=(W-w)/2:(H-h)/2" -c:v libx264 -pix_fmt yuv420p test_diag.mp4';

exec(cmd, (err, stdout, stderr) => {
  console.log('ERR:', err ? err.message : 'NONE');
  console.log('STDERR:', stderr.slice(-400));
  if (fs.existsSync('test_diag.mp4')) {
    console.log('SIZE:', fs.statSync('test_diag.mp4').size);
    fs.unlinkSync('test_diag.mp4');
  }
});
