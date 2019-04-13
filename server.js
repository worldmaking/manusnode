// server.js

const net = require('net')

var HOST = '127.0.0.1'
var PORT = 49010

net.createServer(function(socket) {
    
    console.log('CONNECTED: ' + socket.remoteAddress +':'+ socket.remotePort)

    socket.on('data', function(data) {
        console.log('DATA ' + socket.remoteAddress + ': ' + data)
        socket.write('Thanks for this: "' + data + '"')
    })

    socket.on('close', function(data) {
        console.log('CLOSED: ' + socket.remoteAddress +':'+ socket.remotePort)
    })

}).listen(PORT, HOST)