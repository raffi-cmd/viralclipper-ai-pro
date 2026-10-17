const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/outputs/viral_clip_1_job_1792156991821.mp4',
  method: 'GET',
  headers: {
    'Range': 'bytes=0-1023'
  }
};

http.get(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('CONTENT_TYPE:', res.headers['content-type']);
  console.log('CONTENT_RANGE:', res.headers['content-range']);
  console.log('CONTENT_LENGTH:', res.headers['content-length']);
  console.log('CONTENT_DISPOSITION:', res.headers['content-disposition']);
}).on('error', (err) => {
  console.error('ERROR:', err.message);
});
