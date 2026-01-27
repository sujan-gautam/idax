const net = require('net');
const client = new net.Socket();

client.setTimeout(2000);

client.connect(27017, '127.0.0.1', function() {
	console.log('MongoDB is reachable on 127.0.0.1:27017');
	client.destroy();
});

client.on('error', function(e) {
	console.log('MongoDB NOT reachable: ' + e.message);
	client.destroy();
});

client.on('timeout', function() {
	console.log('Connection timed out');
	client.destroy();
});
