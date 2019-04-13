const net = require('net');

let socket = new net.Socket();
socket.connect(1337, '127.0.0.1', function() {
	console.log('Connected');
	socket.write('Hello, server! Love, Client.');
});

socket.on('data', function(data) {
	let arraybuffer = data.buffer;
	console.log('Received: ' + data);
	

	// TODO: send this arraybuffer into the C++ module

		
	if (Math.random() < 0.5) {
		// convert an array buffer back into a message to send:
		socket.write(new Buffer(arraybuffer))
	} else {
		// tell server we're done.
		//socket.end();
	}
});

socket.on('close', function() {
	console.log('Connection closed');
});

socket.on('error', function(err) {
	console.log(err) 
});