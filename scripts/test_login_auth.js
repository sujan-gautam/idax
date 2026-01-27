const http = require('http');

const data = JSON.stringify({
  email: 'test@example.com',
  password: 'password123'
});

const options = {
  hostname: '127.0.0.1',
  port: 8006,
  path: '/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Sending login request to 127.0.0.1:8006...');
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error('ERROR:', error);
});

req.write(data);
req.end();
