const manus = require('bindings')('manusnode.node')

/*

seuqence of events

client connect to apollo network server
on connection:
open manus session in module
    set up manus handlers
    set up netork handlers
send manus handshake id=1

receive packet -> process.buffer -> onHandshake()
    -> send packet back to server to confirm (id still 1)


receive packet -> process.buffer -> onSuccess, id = 1
    (handshake confirmed)
    send listSources packet id=2

receive packet -> process.buffer -> onSourcesList, id = 2
    (handshake confirmed)
    for each source: send getSourceInfo packet id=3-6

receive packet -> process.buffer -> onSourceInfo, id = 3-6
    (handshake confirmed)
    send listSources packet id=2

*/

const net = require('net')
// const { PromiseSocket } = require('promise-socket')
// const { PromiseWritable } = require('promise-writable')
// const { spawnSync } = require('child_process')

const HOST = '127.0.0.1'
const PORT = 49010

const client = new net.Socket()
// const promiseClient = new PromiseSocket(client)
// const promiseWritable = new PromiseWritable(stream)

let nextEventID = 2

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

            client.write(Buffer.from(session.listSources(nextEventID++)))
            client.write(Buffer.from(session.listDongleIDs(nextEventID++)))

        },
        onSuccess: function(eventID, ...args) {
            console.log("NODE: got onSuccess with args", eventID, args.join(","))
           

            // } else if (eventID == 2) { //} && tick == 1) {
            //     eventID = 3
            //     client.write(Buffer.from(session.listDongleID( eventID = 3 )))
            // } else if (eventID == 3) {
            //     eventID = 4
            //     
            // } else if (eventID == 4) {
            //     eventID = 6
            //     client.write(Buffer.from(session.setStreamRaw( source = 26953288, rawEnabled = true, eventID = 6 )))    
            //     //     eventID = 5
            // //     client.write(Buffer.from(session.queryEvent( eventID = 5)))
            // // } else if (eventID == 5) {
            //     // if (rawEnabled == 1 && dataEnabled == 0) {
            //     //     eventID = 6
            //     //     client.write(Buffer.from(session.setStreamRaw( source = 26953288, rawEnabled = 1, eventID = 6 )))
            //     // } else if (rawEnabled == 0 && dataEnabled == 1){
            //     //     eventID = 7
            //     //     client.write(Buffer.from(session.setStreamData( source = 26953288, dataEnabled = 1, eventID = 7 )))
            //     // }
        },
        
        onSourcesList: function(eventID, sourceList) {
            //console.log("NODE: got onSourcesList with args", args.join(","))
            console.log("NODE: onSourcesList with args", eventID, typeof sourceList, sourceList)

            console.log(`NODE: onSourcesList: id=${eventID} arr=${sourceList}, len=${sourceList.length}`)

            // generateListSources ?
            //TODO: need to store the source list to pass into other functions that expect it

            for (let i=0; i<sourceList.length; i++) {
            
                console.log(`NODE: generate get source info for source ${sourceList[i]}`)
                let s = sourceList[i];
                console.log(typeof s)
                client.write(Buffer.from(session.getSourceInfo(sourceList, i, nextEventID++)))
            }
        },
        onSourceInfo: function(eventID, buf) {

            console.log("NODE: onSourceInfo")
            /*
            struct ApolloSourceInfo
            {
            0    uint64_t endpoint;                  /// this source's endpoint ID
            8    apollo_source_t sourceType;         /// type of source
            12    ApolloFilterChainInfo filterInfo;   /// filter chain information. IMPORTANT: only valid if sourceType == SOURCE_FILTERED
            30    uint64_t deviceID;                  /// device ID of source. IMPORTANT: only valid if sourceType == SOURCE_DEVICEDATA
            38    apollo_laterality_t side;           /// info on whether source device is a left or a right glove. IMPORTANT: only valid if sourceType == SOURCE_DEVICEDATA
            }; 42
            */
           
            let endpoint = new DataView(buf, 0).getBigUint64(0, true)
            let sourceType = new DataView(buf, 8).getUint32(0, true)
            let deviceID = new DataView(buf, 30).getBigUint64(0, true)
            let side = new DataView(buf, 38).getInt32(0, true)
            console.log(`NODE: onSourceInfo event=${eventID}, sourcetype=${sourceType} endpoint=${endpoint}, deviceID=${deviceID}, side=${side}`)

            // gnereateGetSourceInfo ?
        },
        
        onDongleList: function(eventID, arr) {
            console.log("NODE: got onDongleList with args", eventID, typeof arr, arr, arr[0])
            // generateListDongleIDs ?
            //TODO: need to store the dongle list to pass into other functions that expect it

            // for (let i=0; i<dongleList.length; i++) {
            
            //     console.log(`NODE: generate get source info for source ${dongleList[i]}`)
            //     let s = sourceList[i];
            //     console.log(typeof s)
            //     client.write(Buffer.from(session.listDeviceIDs(dongleList, i, nextEventID++)))
            // }
        },
        onDeviceList: function(eventID, arr) {
            console.log("NODE: got onDeviceList with args", eventID, typeof arr, arr, arr[0])
            // generateListDeviceIDs ?
            //TODO: need to store the device list to pass into other functions that expect it

            //client.write(Buffer.from(session.listDeviceID( dongleID = 1451297653, eventID = 4 )))
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
        onDeviceInfo: function(eventID, arr) {
            //console.log("NODE: got onDeviceInfo with args", args.join(","))
            console.log("NODE: got onDeviceInfo with args", eventID, typeof arr, arr, arr[0])
            // generateGetDeviceInfo ?            
        },
        onQuery: function(eventID, arr) {
            //console.log("NODE: got onQuery with args", args.join(","))
            console.log("NODE: got onQuery with args", eventID, typeof arr, arr, arr[0])
            // generateQueryEvent ? 
        },
    })

    client.on('data', function(data) {
        console.log('NODE: on "DATA":', typeof data, data.byteLength, data.byteOffset, data)
        // invoke the session's handlers for this packet:
        // packetneeded = session.process(data.buffer)
        // process a duplicate packet:
        let pkt = data.buffer.slice(0)


        session.process(pkt)
        console.log('NODE: after process data.buffer')
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
    
    // // try to handshake with Apollo:
    // // set eventId == 1 for the handshake success:
    // tick = 0
    // eventID = 0
    // dongleID = 0 // dongleID = 1451297653
    // deviceID = 0 // deviceID = 26953288 left? 506804634 right?
    // rawEnabled = false
    // dataEnabled = false
    // sourceList = 0
    console.log('NODE: session.handshake sending eventID = 1')
    // promiseClient.write
    client.write(Buffer.from(session.handshake(1)))
})