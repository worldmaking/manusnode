// server.js

const net = require('net')

var HOST = '127.0.0.1'
var PORT = 49010

net.createServer(function(socket) {
    
    console.log('CONNECTED: ' + socket.remoteAddress +':'+ socket.remotePort)

    socket.on('data', function(data) {
        // Apollo expects you to prepend the incoming data with a 32-bit integer holding the incoming byte stream length
        console.log('DATA ' + socket.remoteAddress + ': ' + data)
        // Apollo prepends its own a 32-bit integer holding the incoming byte stream length to outgoing data
        socket.write('Thanks for this: "' + data + '"')
    })

    socket.on('close', function(data) {
        console.log('CLOSED: ' + socket.remoteAddress +':'+ socket.remotePort)
    })

}).listen(PORT, HOST)