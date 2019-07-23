const manus = require('bindings')('manusnode.node');

const net = require('net')

const HOST = '127.0.0.1'
const PORT = 49010

const client = new net.Socket();

client.connect(PORT, HOST, function() {
    console.log('NODE: CONNECTED TO: ' + HOST +':'+ PORT)
    let session = manus.open({
        onHandshake: function(packet) {
            console.log("NODE: got handshake with args", packet)

            // send the packet back to server to confirm:
            let buf = Buffer.from(packet)
            console.log(buf)
            client.write(buf);
            console.log("NODE: sent handshake back to server to confirm")
        },
        onSuccess: function(eventId, ...args) {
            console.log("NODE: got success with args", eventId, args.join(","));
            // eventID should be used to figure out which generateXX() the onSuccess relates to

            // we set event == 1 for the handshake in session.handshake(0):
            if (eventId == 1) {
                console.log('NODE: Success eventId = ', eventId)
                eventId++;
                client.write(Buffer.from(session.listSources( eventId )));
                console.log("NODE: listSources eventId = ", eventId);
                eventId++;
                client.write(Buffer.from(session.getSourceInfo( eventId )));  
                console.log("NODE: getSourcesInfo eventId = ", eventId);
                // then, 
                // generateListSources > sourceListHandler >
                // generateAddStreams (for each endpoint source) > successHandler > 
                // generateSetStreamData (for each stream) > successHandler(s) > 
                // generateStartStreams > successHandler, dataStreamHandlers
                //client.write(Buffer.from(session.start()))
            }
            // etc.
        },
        onFail: function(...args) {
            console.log("NODE: got fail with args", args.join(","));
            // generate-- any data we can get? 
            // access apollo error handler? > handleApolloErrors ?
            // generateStopStreams ?
            // generateRemoveStreams ?
            // reset any stored lists etc >?
        },
        onData: function(...args) {
            console.log("NODE: got data with args", args.join(","));
            // generateSetStreamData ?
        },
        onRaw: function(...args) {
            console.log("NODE: got raw data with args", args.join(","));
            // generateSetStreaRaw ?        
        },
        onDongleList: function(...args) {
            console.log("NODE: got dongle list with args", args.join(","));
            // generateListDongleIDs ?
        },
        onDeviceList: function(...args) {
            console.log("NODE: got device list with args", args.join(","));
            // generateListDeviceIDs ?
        },
        onDeviceInfo: function(...args) {
            console.log("NODE: got deviceinfo with args", args.join(","));
            // generateGetDeviceInfo ?            
        },
        onSourceList: function(...args) {
            console.log("NODE: got sourcelist with args", args.join(","));
            // generateListSources ?
        },
        onSourceInfo: function(...args) {
            console.log("NODE: got source info with args", args.join(","));
            // gnereateGetSourceInfo ?
        },
        onQuery: function(...args) {
            console.log("NODE: got query with args", args.join(","));
            // generateQueryEvent ? 
        },
    });

    client.on('data', function(data) {
        console.log('NODE: new packet DATA: ' + data);
        // invoke the session's handlers for this packet:
        session.process(data.buffer);
        console.log("NODE: data processed")
    })
    
    client.on('close', function() {
        console.log('NODE: Connection closed')
        session.close();
    })
    
    client.on('error', function(err) {
        console.log("NODE: socket error", err) 
        // disconnect client & session.close() ?
    })
    
    // try to handshake with Apollo:
    // set eventId == 1 for the handshake success:
    eventId = 1
    console.log('NODE: eventID = ' + eventId)
    client.write(Buffer.from(session.handshake( eventId )));
})

