const http = require('http');

const postData = JSON.stringify({
  clipId: 'clip_1',
  targetDuration: 5,
  clipStart: 1,
  hookTitle: 'AKSI PERFORMA MESIN',
  watermarkText: 'ViralClipper'
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/process',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e.message);
});

req.write(postData);
req.end();
