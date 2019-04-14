// client.js

const net = require('net')

var HOST = '127.0.0.1'
var PORT = 49010

var client = new net.Socket();

client.connect(PORT, HOST, function() {
    console.log('CONNECTED TO: ' + HOST +':'+ PORT)
    
    // outgoing packet to Apollo:
    // you need to make sure to prepend a 32-bit integer holding the outgoing byte stream length to the byte stream before committing it to Apollo through the TCP socket
    client.write('Hello..')
})

client.on('data', function(data) {
    // incoming packet from Apollo:
    // you need to consider that a 32-bit integer holding the incoming byte stream length has been prepended by Apollo
    console.log('DATA: ' + data)

    client.destroy()
})

client.on('close', function() {
    console.log('Connection closed')
})