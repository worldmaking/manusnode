
// make a TCP server
const net = require("net");

let server = net.createServer(function(socket) {
	socket.write('Echo server\r\n');
	//socket.pipe(socket);
	socket.on('data', function(data){
		let arraybuffer = data.buffer;

		// TODO: send this arraybuffer into the C++ module

		// demo as raw text:
		textChunk = data.toString('utf8');
		console.log(textChunk);
		//socket.write(textChunk);

		// convert an array buffer back into a message to send:
		socket.write(new Buffer(arraybuffer))

		// request the client to close the socket now
		//socket.end()
	});


	socket.on('error', function(err) {
		if (err.errno == "ECONNRESET") {
			// client hung up
			console.log("bye");
		} else {
			console.log("error", err) 
		}
	});

	socket.on('close', function() {
		console.info('Socket close');
	});
});

server.listen(1337, '127.0.0.1');
