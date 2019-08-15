const manus = require('bindings')('manusnode.node')

const net = require('net')

const HOST = '127.0.0.1'
const PORT = 49010

const client = new net.Socket()

// TODO: clean up once working for full handling
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
        },
        onSuccess: function(eventId, ...args) {
            console.log("NODE: got onSuccess with args", eventId, args.join(","))
            // eventID should be used to figure out which generateXX() the onSuccess relates to
            // TODO: chain the eventId triggers
            // we set event == 1 for the handshake in session.handshake(-):
            if (eventId == 1) { 
                console.log('NODE: handshake onSuccess eventId =', eventId) 
                client.write(Buffer.from(session.listSources( eventId = 2 )), null, function() {
                    client.write(Buffer.from(session.listDongleID( eventId = 3 )), null, function() {
                        console.log("NODE: We are inside the chain")
                        client.write(Buffer.from(session.listDeviceID( eventId = 4 )))
                        // client.write(Buffer.from(session.getSourceInfo( eventId =  )))
                        // client.write(Buffer.from(session.setStreamData( dataEnabled = true, eventId =  )))
                    })
                })
            }
            console.log("NODE: onSuccess complete for event", eventId)
        },
        onFail: function(eventID, arr) {
            //console.log("NODE: got onFail with args", args.join(","))
            console.log("NODE: got onFail with args", eventID, typeof arr, arr, arr[0])
            // generate-- any data we can get? 
            // access apollo error handler? > handleApolloErrors ?
            // generateStopStreams ?
            // generateRemoveStreams ?
            // reset any stored lists etc >?
        },
        onData: function(eventID, arr) {
            // eventId = 4
            //console.log("NODE: got onData with args", args.join(","))
            console.log("NODE: got onData with args", eventID, typeof arr, arr, arr[0])
            // generateSetStreamData ?
        },
        onRaw: function(eventID, arr) {
            //console.log("NODE: got onRaw with args", args.join(","))
            console.log("NODE: got onRaw with args", eventID, typeof arr, arr, arr[0])
            // generateSetStreaRaw ?        
        },
        onSourcesList: function(eventID, arr) {
            //console.log("NODE: got onSourcesList with args", args.join(","))
            console.log("NODE: got onSourcesList with args", eventID, typeof arr, arr, arr[0])
            // generateListSources ?
        },
        onDongleList: function(eventID, arr) {
            console.log("NODE: got onDongleList with args", eventID, typeof arr, arr, arr[0])
            // generateListDongleIDs ?
        },
        onDeviceList: function(eventID, arr) {
            console.log("NODE: got onDeviceList with args", eventID, typeof arr, arr, arr[0])
            // generateListDeviceIDs ?
        },
        onDeviceInfo: function(eventID, arr) {
            //console.log("NODE: got onDeviceInfo with args", args.join(","))
            console.log("NODE: got onDeviceInfo with args", eventID, typeof arr, arr, arr[0])
            // generateGetDeviceInfo ?            
        },
        onSourceInfo: function(eventID, arr) {
            //console.log("NODE: got onSourceInfo with args", args.join(","))
            console.log("NODE: got onSourceInfo with args", eventID, typeof arr, arr, arr[0])
            // gnereateGetSourceInfo ?
        },
        onQuery: function(eventID, arr) {
            //console.log("NODE: got onQuery with args", args.join(","))
            console.log("NODE: got onQuery with args", eventID, typeof arr, arr, arr[0])
            // generateQueryEvent ? 
        },
    })

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
    console.log('NODE: session.handshake sending eventID = ' + eventId)
    client.write(Buffer.from(session.handshake( eventId = 1 )))
})

