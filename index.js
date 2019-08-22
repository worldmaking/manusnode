const manus = require('bindings')('manusnode.node')

const net = require('net')
// const { PromiseSocket } = require('promise-socket')
// const { PromiseWritable } = require('promise-writable')
// const { spawnSync } = require('child_process')

const HOST = '127.0.0.1'
const PORT = 49010

const client = new net.Socket()
// const promiseClient = new PromiseSocket(client)
// const promiseWritable = new PromiseWritable(stream)

// TODO: clean up once working for full handling
client.connect(PORT, HOST, function() {
    console.log('NODE: CONNECTED TO: ' + HOST +':'+ PORT)
    let session = manus.open({
        onHandshake: function(packet) {
            console.log("NODE: got onHandshake with args", packet)
            // send the packet back to server to confirm:
            let buf = Buffer.from(packet)
            console.log(buf)
            // promiseClient.write(buf)
            client.write(buf)
            console.log("NODE: sent onHandshake back to server to confirm")
            //eventID = 1
        },
        onSuccess: function(eventID, ...args) {
            console.log("NODE: got onSuccess with args", eventID, args.join(","))
            console.log("NODE: onSuccess complete for event", eventID)
            //eventID = 1
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
            //TODO: need to store the source list to pass into other functions that expect it
        },
        onDongleList: function(eventID, arr) {
            console.log("NODE: got onDongleList with args", eventID, typeof arr, arr, arr[0])
            // generateListDongleIDs ?
            //TODO: need to store the dongle list to pass into other functions that expect it
        },
        onDeviceList: function(eventID, arr) {
            console.log("NODE: got onDeviceList with args", eventID, typeof arr, arr, arr[0])
            // generateListDeviceIDs ?
            //TODO: need to store the device list to pass into other functions that expect it
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
        console.log('NODE: before process data.buffer eventID =', eventID)
        console.log('NODE: new packet DATA: ', typeof data, data.length, data.byteLength, data.byteOffset, data)
        // invoke the session's handlers for this packet:
        // packetneeded = session.process(data.buffer)
        session.process(data.buffer)
        console.log('NODE: after process data.buffer eventID =', eventID)
        console.log("NODE: session.process | data processed")
        if (eventID == 1) {// && tick == 0) {
            eventID = 2
            client.write(Buffer.from(session.listSources( eventID = 2 )))
        } else if (eventID == 2) { //} && tick == 1) {
            eventID = 3
            client.write(Buffer.from(session.listDongleID( eventID = 3 )))
        } else if (eventID == 3) {
            eventID = 4
            client.write(Buffer.from(session.listDeviceID( dongleID = 1451297653, eventID = 4 )))
        } else if (eventID == 4) {
            eventID = 6
            client.write(Buffer.from(session.setStreamRaw( source = 26953288, rawEnabled = true, eventID = 6 )))    
            //     eventID = 5
        //     client.write(Buffer.from(session.queryEvent( eventID = 5)))
        // } else if (eventID == 5) {
            // if (rawEnabled == 1 && dataEnabled == 0) {
            //     eventID = 6
            //     client.write(Buffer.from(session.setStreamRaw( source = 26953288, rawEnabled = 1, eventID = 6 )))
            // } else if (rawEnabled == 0 && dataEnabled == 1){
            //     eventID = 7
            //     client.write(Buffer.from(session.setStreamData( source = 26953288, dataEnabled = 1, eventID = 7 )))
            // }
        }
        //tick++ 
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
    tick = 0
    eventID = 0
    dongleID = 0 // dongleID = 1451297653
    deviceID = 0 // deviceID = 26953288 left? 506804634 right?
    rawEnabled = false
    dataEnabled = false
    sourceList = 0
    console.log('NODE: session.handshake sending eventID = ' + eventID)
    // promiseClient.write
    client.write(Buffer.from(session.handshake( eventID = 1 )))
})