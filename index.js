const manus = require('bindings')('manusnode');

const net = require('net')

const HOST = '127.0.0.1'
const PORT = 49010

const client = new net.Socket();

client.connect(PORT, HOST, function() {
    console.log('CONNECTED TO: ' + HOST +':'+ PORT)
    let session = manus.open({
        onHandshake: function(packet) {
            console.log("got handshake with args", packet)

            // send the packet back to server to confirm:
            client.write(Buffer.from(packet));

            
        },
        onSuccess: function(eventId, ...args) {
            console.log("got success with args", eventId, args.join(","));
            // eventID should be used to figure out which generateXX() the onSuccess relates to

            // we set event == 1 for the handshake in session.handshake(0):
            if (eventId == 1) {
            // then, generateListSources > sourceListHandler > generateAddStreams (for each endpoint source) > successHandler > generateSetStreamData (for each stream) > sucessHandler(s) > generateStartStreams > successHandler, dataStreamHandlers

                //client.write(Buffer.from(session.start()))
            }
            // etc.
        },
        onFail: function(...args) {
            console.log("got fail with args", args.join(","));
        },
        onData: function(...args) {
            console.log("got data with args", args.join(","));
        },
        onRaw: function(...args) {
            console.log("got raw data with args", args.join(","));
        },
        onDongleList: function(...args) {
            console.log("got dongle list with args", args.join(","));
        },
        onDeviceList: function(...args) {
            console.log("got device list with args", args.join(","));
        },
        onDeviceInfo: function(...args) {
            console.log("got deviceinfo with args", args.join(","));
        },
        onSourceList: function(...args) {
            console.log("got sourcelist with args", args.join(","));
        },
        onSourceInfo: function(...args) {
            console.log("got source info with args", args.join(","));
        },
        onQuery: function(...args) {
            console.log("got query with args", args.join(","));
        },
    });

    client.on('data', function(data) {
        console.log('DATA: ' + data);
        let result = session.process(data.buffer);
        console.log(result);
    })
    
    client.on('close', function() {
        console.log('Connection closed')
        session.close();
    })
    
    client.on('error', function(err) {
        console.log("socket error", err) 
        // disconnect client & session.close() ?
    })
    
    // try to handshake with Apollo:
    // set eventId == 1 for the handshake success:
    client.write(Buffer.from(session.handshake( 1 )));
})

