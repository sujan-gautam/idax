const http = require('http');

function postRequest(port, path, data) {
    const options = {
        hostname: '127.0.0.1',
        port: port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            console.log('BODY: ' + body);
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.write(data);
    req.end();
}

const data = JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    tenantName: 'Test Corp'
});

console.log('Registering User via Gateway (8000)...');
postRequest(8000, '/api/v1/auth/register', data);
