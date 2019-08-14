const manus = require('bindings')('manusnode.node')

const net = require('net')

const HOST = '127.0.0.1'
const PORT = 49010

const client = new net.Socket()

client.connect(PORT, HOST, function() {
    console.log('NODE: CONNECTED TO: ' + HOST +':'+ PORT)
    let session = manus.open({
        onHandshake: function(packet) {
            console.log("NODE: got onHandshake with args", packet)

            // send the packet back to server to confirm:
            let buf = Buffer.from(packet)
            console.log(buf)
            client.write(buf)
            console.log("NODE: sent onHandshake back to server to confirm")
            //eventId++;
        },
        onSuccess: function(eventId, ...args) {
            console.log("NODE: got onSuccess with args", eventId, args.join(","))
            // eventID should be used to figure out which generateXX() the onSuccess relates to

            // we set event == 1 for the handshake in session.handshake(0):
            if (eventId == 1) { console.log('NODE: handshake onSuccess eventId =', eventId) 
            //     eventId = 2 
            //     //source = 
            client.write(Buffer.from(session.listSources( eventId = 2 )))
            //client.write(Buffer.from(session.listDongleID( eventId = 3 )))
            //     eventId = 3
            //     source2 = client.write(Buffer.from(session.getSourceInfo( source, eventId = 3 )))
            //     eventId = 4
            //     client.write(Buffer.from(session.setStreamData( source2, dataEnabled = true, eventId = 4 )))
            //     //console.log(source)
            }
            if (eventId == 2) { 
                console.log('NODE: listsources onSuccess eventId =', eventId) 
                client.write(Buffer.from(session.listDongleID( eventId = 3 )))
                //client.write(Buffer.from(session.getSourceInfo( source, eventId = 3 )))
            }
            if (eventId == 3) { console.log('NODE: listDongleID onSuccess eventId =', eventId) 
                client.write(Buffer.from(session.listDeviceID( eventId = 4 )))
            }
            if (eventId == 4) { console.log('NODE: listDeviceID onSuccess eventId =', eventId) }
            //if (eventId == 5) { console.log('NODE: addStreams onSuccess eventId =', eventId) }

            console.log("NODE: onSuccess complete")
            // etc.
        },
        onFail: function(...args) {
            console.log("NODE: got onFail with args", args.join(","))
            // generate-- any data we can get? 
            // access apollo error handler? > handleApolloErrors ?
            // generateStopStreams ?
            // generateRemoveStreams ?
            // reset any stored lists etc >?
        },
        onData: function(...args) {
            // eventId = 4
            console.log("NODE: got onData with args", args.join(","))
            // client.write(Buffer.from(session.setStreamData( dataEnabled = true, eventId = 4 )))
            // generateSetStreamData ?
        },
        onRaw: function(...args) {
            console.log("NODE: got onRaw with args", args.join(","))
            // generateSetStreaRaw ?        
        },
        onDongleList: function(eventID, arr) {
            console.log("NODE: got onDongleList with args", eventID, typeof arr, arr, arr[0])
            // generateListDongleIDs ?
        },
        onDeviceList: function(...args) {
            console.log("NODE: got onDeviceList with args", eventID, typeof arr, arr, arr[0])
            // generateListDeviceIDs ?
        },
        onDeviceInfo: function(...args) {
            console.log("NODE: got onDeviceInfo with args", args.join(","))
            // generateGetDeviceInfo ?            
        },
        onSourcesList: function(...args) {
            // eventId = 2
            //console.log("NODE: got onSourcesList with args", args.join(","))
            console.log("NODE: got onSourcesList with args", eventID, typeof arr, arr, arr[0])
            // generateListSources ?
        },
        onSourceInfo: function(...args) {
            // eventId = 3
            console.log("NODE: got onSourceInfo with args", args.join(","))
            // client.write(Buffer.from(session.getSourceInfo( source, eventId = 3)))
            // gnereateGetSourceInfo ?
        },
        onQuery: function(...args) {
            console.log("NODE: got onQuery with args", args.join(","))
            // generateQueryEvent ? 
        },
    });

    client.on('data', function(data) {
        console.log('NODE: new packet DATA: ', typeof data, data.length, data.byteLength, data.byteOffset, data)
        // invoke the session's handlers for this packet:
        session.process(data.buffer)
        console.log("NODE: session.process | data processed")
    })
    
    client.on('close', function() {
        session.close()
        console.log('NODE: session.close | Connection closed')
    })
    
    client.on('error', function(err) {
        console.log("NODE: socket error", err) 
        session.close()
        client.disconnect()
        socket.close()
        // disconnect client & session.close() ?
    })
    
    // try to handshake with Apollo:
    // set eventId == 1 for the handshake success:
    eventId = 1
    console.log('NODE: session.handshake sending eventID = ' + eventId)
    client.write(Buffer.from(session.handshake( eventId = 1 )));
    //client.write(Buffer.from(session.listSources( eventId = 2 )));
    //client.write(Buffer.from(session.handshake( eventId = 3 )));
    //client.write(Buffer.from(session.handshake( eventId = 4 )));
    //console.log('NODE: session.handshake sending eventID = ' + eventId)
})

