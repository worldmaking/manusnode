// hello.js
const manus = require('../build/Release/manusnode');

const net = require('net')

var HOST = '127.0.0.1'
var PORT = 49010

var client = new net.Socket();

client.connect(PORT, HOST, function() {
    console.log('CONNECTED TO: ' + HOST +':'+ PORT)
    console.log(manus.openSession());
    let sesh = manus.openSession();
    sesh.handshake = function() {
        console.log("booo")
    }

    //manus.on("handshake", function() { console.log("got handshake yeah!") });

    console.log("onned")
    
    // // outgoing packet to Apollo:
    // let apb = manus.handshake();
    // console.log("apb", apb);
    // let ints = new Uint32Array(apb);
    // console.log(ints[0])

    client.write(Buffer.from(manus.handshake()));
})

client.on('data', function(data) {
    // incoming packet from Apollo:
    // you need to consider that a 32-bit integer holding the incoming byte stream length has been prepended by Apollo
    console.log('DATA: ' + data)
    
    let result = manus.processPacket(data.buffer);
    console.log(result);
    //client.destroy()
})

client.on('close', function() {
    console.log('Connection closed')
})

client.on('error', function(err) {
	console.log("socket error", err) 
});