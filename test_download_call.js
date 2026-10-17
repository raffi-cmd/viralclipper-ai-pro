const http = require('http');

const url = 'http://127.0.0.1:3001/outputs/viral_clip_1_job_1792156991821.mp4';

http.get(url, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('CONTENT_TYPE:', res.headers['content-type']);
  console.log('CONTENT_LENGTH:', res.headers['content-length']);
  console.log('CONTENT_DISPOSITION:', res.headers['content-disposition']);
  console.log('ACCEPT_RANGES:', res.headers['accept-ranges']);

  let bytesReceived = 0;
  res.on('data', (chunk) => {
    bytesReceived += chunk.length;
  });
  res.on('end', () => {
    console.log('TOTAL_BYTES_DOWNLOADED:', bytesReceived);
  });
}).on('error', (err) => {
  console.error('ERROR:', err.message);
});
