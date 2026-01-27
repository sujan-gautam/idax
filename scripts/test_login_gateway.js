const http = require('http');

const data = JSON.stringify({
  email: 'test@example.com',
  password: 'password123'
});

const options = {
  hostname: '127.0.0.1',
  port: 8000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Sending login request to Gateway 127.0.0.1:8000...');
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (d) => {
    body += d;
  });
  res.on('end', () => {
    console.log('BODY:', body);
  });
});

req.on('error', (error) => {
  console.error('ERROR:', error);
});

req.write(data);
req.end();
