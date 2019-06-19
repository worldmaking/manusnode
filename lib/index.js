// hello.js
const manus = require('../build/Release/manusnode');

const net = require('net')

const HOST = '127.0.0.1'
const PORT = 49010

const client = new net.Socket();

client.connect(PORT, HOST, function() {
    console.log('CONNECTED TO: ' + HOST +':'+ PORT)
    let session = manus.open({
        onHandshake: function(arraybuf) {
            console.log("got handshake with buffer", arraybuf)
        }
    });

    client.on('data', function(data) {
        console.log('DATA: ' + data);
        let result = session.process(data.buffer);
        console.log(result);
    })
    
    client.on('close', function() {
        console.log('Connection closed')
    })
    
    client.on('error', function(err) {
        console.log("socket error", err) 
    })
    
    // try to handshake with Apollo:
    client.write(Buffer.from(session.handshake()));
})

