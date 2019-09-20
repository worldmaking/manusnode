const manus = require('bindings')('manusnode.node')

/*

sequence of events

client connect to apollo network server
on connection:
open manus session in module
    set up manus handlers
    set up netork handlers
send manus handshake id = 1

receive packet -> process.buffer -> onHandshake()
    -> send packet back to server to confirm (id still 1)

receive packet -> process.buffer -> onSuccess, id = 1
    (handshake confirmed)
    send listSources packet id = 2
    send listDongles packet id = 3

receive packet -> process.buffer -> onSourcesList, id = 2
    (handshake confirmed)
    for all desired sources: send one addStreams, id = 4
    for each source: send getSourceInfo packet id = 5-8
    for each source: send setStream[Data|Raw] packet id = 9-12  
        5,6 & 9,10 - device | 7,8 & 11,12 - default filter

receive packet -> process.buffer -> onDongleList, id = 3
    (handshake confirmed)
    send listdevices packet id = 14

receive packet -> process.buffer -> onSuccess, id = 4
    (handshake confirmed for addStreams - multiple successes)

receive packet -> process.buffer -> onSourceInfo, id = 5-8
    (handshake confirmed - success for each source)

receive packet -> process.buffer -> setStream, id = 9-12
    (handshake confirmed - success for each source stream set)

receive packet -> process.buffer -> startStreams, id = 13
    (handshake confirmed - success)
    
receive packet -> process.buffer -> onDeviceList, id = 14
    (handshake confirmed)
    for each device: send getDeviceInfo packet id = 14,15

receive packet -> process.buffer -> onDeviceInfo, id = 14,15
    (handshake confirmed)
    -> send startStreams packet id = 16

receive packet -> process.buffer -> startStreams, id = 16
    (handshake confirmed)
    -> continuous streaming

*/

const net = require('net')

const HOST = '127.0.0.1'
const PORT = 49010

const client = new net.Socket()

const apollo_source_t = [
    "SOURCE_INVALID",
    "SOURCE_DEVICEDATA",
    "SOURCE_FILTERED",
    "SOURCE_FILTERED_DEFAULT"
]

const apollo_filter_t =[
    "FILTER_NONE",
    "FILTER_COORDINATESYSTEMCONVERSION",
    "FILTER_MESHMAPPING",
    "FILTER_GESTURE"
]

const apollo_gesture_t = [
    "GESTURE_NONE",
    "GESTURE_OPEN_HAND",
    "GESTURE_FIST",
    "GESTURE_INDEX_PINCH"
]

const apollo_laterality_t = {
    [-1]: "SIDE_LEFT",
    [1]: "SIDE_RIGHT"
}
let nextEventID = 2

let state = {
    devices: {},
}

exports.state = state;

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
            client.write(Buffer.from(session.listSources(nextEventID++)))
            client.write(Buffer.from(session.listDongleIDs(nextEventID++)))
        },
        onSuccess: function(eventID, ...args) {
            console.log("NODE: got onSuccess with args", eventID, args.join(","))
        },
        onFail: function(eventID, ...args) {
            console.log(`NODE: got onFail with args ${eventID} ${args.join(",")} \n`)//, eventID, args.join(","))
        }, 
        onSourcesList: function(eventID, sourceList) {
            console.log("NODE: onSourcesList with args", eventID, typeof sourceList, sourceList)
            console.log(`NODE: onSourcesList: id=${eventID} arr=${sourceList}, len=${sourceList.length}`)

            // generateListSources ?
            //TODO: need to store the source list to pass into other functions that expect it

            let sourceList_ = sourceList //.slice(0,2)
            console.log(`\nNODE: generate add streams for source ${sourceList_}`)
            client.write(Buffer.from(session.addStreams(sourceList_, nextEventID++)))
            console.log("\n")

            for (let i=0; i<sourceList_.length; i++) {
                console.log(`NODE: generate get source info for source ${sourceList_[i]}`)
                let s = sourceList_[i]
                //console.log(typeof s)
                client.write(Buffer.from(session.getSourceInfo(sourceList_, i, nextEventID++)))
            }
            for (let i=0; i<sourceList_.length; i++) {
                console.log(`NODE: generate set stream type info for source ${sourceList_[i]}`)
                let s = sourceList_[i]
                //console.log(typeof s)
                //client.write(Buffer.from(session.setStreamRaw(sourceList_, i, true, nextEventID++)))
                client.write(Buffer.from(session.setStreamData(sourceList_, i, true, nextEventID++)))
            }

            //client.write(Buffer.from(session.startStreams(nextEventID++)))
        },
        onSourceInfo: function(eventID, buf) {
            console.log("NODE: onSourceInfo")
            /*
            struct ApolloSourceInfo
            {
            0     uint64_t endpoint;                  /// this source's endpoint ID
            8     apollo_source_t sourceType;         /// type of source
            12    ApolloFilterChainInfo filterInfo;   /// filter chain information. IMPORTANT: only valid if sourceType == SOURCE_FILTERED
            30    uint64_t deviceID;                  /// device ID of source. IMPORTANT: only valid if sourceType == SOURCE_DEVICEDATA
            38    apollo_laterality_t side;           /// info on whether source device is a left or a right glove. IMPORTANT: only valid if sourceType == SOURCE_DEVICEDATA
            }; 42
            */
           
            /*
            struct ApolloFilterChainInfo
            {
            0     uint8_t numFilters;         /// number of filters in this chain
            1     apollo_filter_t* filters;   /// filter types as present in the chain, with index [0] the filter that directly follows the sources
            5     uint8_t numSources;         /// number of inputs to this filter chain
            6     uint64_t* sources;          /// source endpoint IDs of inputs to this filter chain
            }; 14
            */
            let endpointID = new DataView(buf, 0).getBigUint64(0, true).toString()
            let hand = state.devices[endpointID];
            if (!hand) {
                hand = {}
                state.devices[endpointID] = hand
            }

            hand.sourceType = new DataView(buf, 8).getUint32(0, true)
            hand.sourceTypeName = apollo_source_t[hand.sourceType] || "unknown"
            //let filterInfo = new DataView(buf, 12).get
            hand.deviceID = new DataView(buf, 30).getBigUint64(0, true).toString()
            hand.side = new DataView(buf, 38).getInt32(0, true)
            hand.sideName = apollo_laterality_t[hand.side] || "N/A"
           // console.log(`NODE: onSourceInfo event=${eventID}, sourcetype=${sourceType}=${sourceTypeName} endpoint=${endpoint}, deviceID=${deviceID}, side=${side}=${sideName}`)

        },
        onDongleList: function(eventID, dongleList) {
            console.log("NODE: onDongleList with args", eventID, typeof dongleList, dongleList)
            console.log(`NODE: onDongleList: id=${eventID} arr=${dongleList}, len=${dongleList.length}`)
            // generateListDongleIDs ?
            //TODO: need to store the dongle list to pass into other functions that expect it

            for (let i=0; i<dongleList.length; i++) {
                console.log(`NODE: generate get dongle info/list device IDs for dongle ${dongleList[i]}`)
                let d = dongleList[i];
                console.log(typeof d)
                client.write(Buffer.from(session.listDeviceIDs(dongleList, i, nextEventID++)))
            }
        },
        onDeviceList: function(eventID, deviceList) {
            console.log("NODE: onDeviceList with args", eventID, typeof deviceList, deviceList)
            console.log(`NODE: onDeviceList: id=${eventID} arr=${deviceList}, len=${deviceList.length}`)
            // generateListDeviceIDs ?
            //TODO: need to store the device list to pass into other functions that expect it

            for (let i=0; i<deviceList.length; i++) {
                console.log(`NODE: generate get device info for device ${deviceList[i]}`)
                let d = deviceList[i];
                console.log(typeof d)
                client.write(Buffer.from(session.getDeviceInfo(deviceList, i, nextEventID++)))
            }
            client.write(Buffer.from(session.startStreams(nextEventID++)))
        },
        onDeviceInfo: function(eventID, buf) {
            console.log("NODE: onDeviceInfo")
            /*
            struct ApolloDeviceInfo
            {
            0     uint64_t deviceID;              /// this device's hardware identifier
            8     uint64_t pairedDongleID;        /// hardware identifier of the dongle that this device is paired to
            16    apollo_laterality_t hand;       /// info on whether this device is a left or a right glove
            20    apollo_dev_t devType;           /// the device's fabrication type
            24    uint8_t batteryPercent;         /// battery charge in percent
            25    int16_t signalAttenuationDb;    /// signal attenuation in dB
            }; 27
           */

            let deviceID = new DataView(buf, 0).getBigUint64(0, true)
            let pairedDongleID = new DataView(buf, 8).getBigUint64(0, true)
            let hand = new DataView(buf, 16).getInt32(0, true)
            let devType = new DataView(buf, 20).getInt32(0, true)
            let batteryPercent = new DataView(buf, 24).getUint8(0, true)
            let signalAttenuationDb = new DataView(buf, 25).getInt16(0, true)
            console.log(`NODE: onDeviceInfo event=${eventID}, deviceID=${deviceID} dongleID=${pairedDongleID}, hand=${hand}, deviceType=${devType}, bat%=${batteryPercent}, signal=${signalAttenuationDb}`)        
        },
        onData: function(buf) {
            //console.log("NODE: onData")
            /*
            struct ApolloJointData
            {
            0     uint64_t endpointID;                /// source endpoint identifier
            8     uint64_t deviceID;                  /// device from which original data has been sent
            16    float wristOrientation[4];          /// quaternion representation of the wrist orientation (w[0], x[1], y[2]. z[3])
            32    float jointOrientations[5][5][4];   /// orientation for thumb[0], index[1], middle[2], ring[3], pinky[4] finger skeletal joints:
                                                      /// base[0], CMC/MCP[1], MCP/PIP[2], IP/DIP[3], tip[4] (named for thumb/other fingers)
                                                      /// as quaternions in the form of w[0], x[1], y[2], z[3]
            }; 120
            */

            // generateSetStreamData ?
            
            let endpointID = new DataView(buf, 0).getBigUint64(0, true).toString()

            let hand = state.devices[endpointID];
            if (!hand) {
                hand = {}
                state.devices[endpointID] = hand
            }
            hand.deviceID = new DataView(buf, 8).getBigUint64(0, true).toString()
            hand.wristOrientation = new Float32Array(buf, 16, 4)//new DataView(buf, 16).getFloat32(0, true)
            hand.jointOrientations = new Float32Array(buf, 32, 5*5*4) //new DataView(buf, 20).getFloat32(0, true)
            //console.log(`NODE: onData, endpoint=${endpointID}, device=${deviceID}, wrist=${wristOrientation}, joint=${jointOrientations[0]}`)
            
            
        },
        onRaw: function(buf) {
            //console.log("NODE: onRaw")
            /*
            struct ApolloRawData
            {
            0     uint64_t endpointID;        /// source endpoint identifier
            8     uint64_t deviceID;          /// device from which original data has been sent
            16    float imus[2][4];           /// wrist[0] and thumb[1] IMU data quaternions in the form of w[0], x[1], y[2], z[3]
            48    double flex[5][2];          /// thumb[0], index[1], middle[2], ring[3], pinky[4] finger normalised flex sensor values for MCP[0] and (P)IP[1] joints
            128    float pinchProbability = 0; /// probability of a thumb-index pinch. Will only be non-zero if a pinch filter is active
            }; 132
            */

            // generateSetStreaRaw ?
            let endpointID = new DataView(buf, 0).getBigUint64(0, true)
            let deviceID = new DataView(buf, 8).getBigUint64(0, true)
            let imus = new Float32Array(buf, 16, 2*4) //new DataView(buf, 16).getFloat32(0, true)
            let flex = new Float64Array(buf, 48, 5*2) //new DataView(buf, 20).getfloat64(0, true)
            let pinchProbability = new Float32Array(buf, 128, 1)[0] //new DataView(buf, 128).getfloat64(0, true)
            //console.log(`NODE: onData, endpoint=${endpointID}, device=${deviceID}, imus=${imus[0]}, flex=${flex[0]} pinchProb=${pinchProbability}`)
        },
        onQuery: function(eventID, arr) {
            //console.log("NODE: got onQuery with args", args.join(","))
            console.log("NODE: got onQuery with args", eventID, typeof arr, arr, arr[0])
            // generateQueryEvent ? 
        },
    })

    client.on('data', function(data) {
        //console.log('NODE: on "DATA":', typeof data, data.byteLength, data.byteOffset, data)
        // invoke the session's handlers for this packet:
        // packetneeded = session.process(data.buffer)
        // process a duplicate packet:
        // let pkt = data.buffer.slice(0)

        let pkt = data.buffer
        session.process(pkt)
       // console.log('NODE: after process data.buffer')
    })
    
    client.on('close', function() {
        session.stopStreams(nextEventID++)
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
    // dongleID = 0 // dongleID = 1451297653
    // deviceID = 0 // deviceID = 26953288 left || 506804634 right
    // rawEnabled = true
    // dataEnabled = false
    // sourceList = 0
    console.log('NODE: session.handshake sending eventID = 1')
    client.write(Buffer.from(session.handshake(1)))
})
