#!/usr/bin/env node

const http = require('http');
const url = require('url');
const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");

const express = require('express');
const WebSocket = require('ws');
const { vec2, vec3, vec4, quat, mat3, mat4 } = require("gl-matrix");

const manus = require("./index.js")
const osc = require("osc");
const openvr = require("./../node_vr/index.js")

let trackingstate = {
  hmd: { pos: vec3.create(), quat: quat.create() },
  trackers: [
    { pos: vec3.create(), quat: quat.create() },
    { pos: vec3.create(), quat: quat.create() },
  ]
}

const tmpmat = mat4.create();

try {
  openvr.init(0);
} catch(e) {
  throw openvr.EVRInitError[e];
}
function getTrackingData() {
  //openvr.update();

 // let res = openvr.waitGetPoses();
  // if (res) {
  //   console.log(res)
  // }
  let trackerCount = 0;
  for (let i=0; i<8; i++) {
    let devclass = openvr.getTrackedDeviceClass(i)

    if (openvr.ETrackedDeviceClass[devclass] == "TrackedDeviceClass_GenericTracker") {
      let out = trackingstate.trackers[trackerCount]

      openvr.getLastPoseForTrackedDeviceIndex(i, tmpmat)
      mat4.getTranslation(out.pos, tmpmat)
      mat4.getRotation(out.quat, tmpmat);

      trackerCount++;
    } else if (openvr.ETrackedDeviceClass[devclass] == "TrackedDeviceClass_HMD") {
      let out = trackingstate.hmd
      openvr.getLastPoseForTrackedDeviceIndex(i, tmpmat)
      mat4.getTranslation(out.pos, tmpmat)
      mat4.getRotation(out.quat, tmpmat)
    }

	}
	
// trackingstate console info
	//console.log(trackingstate.trackers[0].pos[1], trackingstate.hmd.pos[1])

  //console.log(state)
  return trackingstate;
}

const project_path = process.cwd();
const server_path = __dirname;
const client_path = path.join(server_path, "client");

const app = express();
app.use(express.static(client_path))
app.get('/', function(req, res) {
	res.sendFile(path.join(client_path, 'index.html'));
});
//app.get('*', function(req, res) { console.log(req); });
const server = http.createServer(app);
// add a websocket service to the http server:
const wss = new WebSocket.Server({ 
	server: server,
	maxPayload: 1024 * 1024, 
});

function send_all_clients(msg, ignore) {
	wss.clients.forEach(function each(client) {
		if (client == ignore) return;
		try {
			client.send(msg);
		} catch (e) {
			console.error(e);
		};
	});
}

// Haptics
let bodyHaptics;
let udpPort = new osc.UDPPort({
		// This is where Clyde is listening on
		localAddress: "192.168.137.70",//"192.168.137.210",//"192.168.0.10",//"192.168.1.146",//
		localPort: 8080, //9999

		// This is where pi is listening for OSC messages.
		remoteAddress: "192.168.137.125",//"192.168.137.108",//"192.168.0.14", //"192.168.1.117",//
		remotePort: 3030,
		metadata: true
});


// whenever a client connects to this websocket:
let sessionId = 0;
wss.on('connection', function(ws, req) {

	// do any
	console.log("server received a connection");

	console.log("server has "+wss.clients.size+" connected clients");
	//	ws.id = uuid.v4();
	const id = ++sessionId;
	const location = url.parse(req.url, true);
	// You might use location.query.access_token to authenticate or share sessions
	// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
	
	ws.on('error', function (e) {
		if (e.message === "read ECONNRESET") {
			// ignore this, client will still emit close event
		} else {
			console.error("websocket error: ", e.message);
		}
	});

	// what to do if client disconnects?
	ws.on('close', function(connection) {
		console.log("connection closed");
        console.log("server has "+wss.clients.size+" connected clients");
	});
	
	// respond to any messages from the client:
	ws.on('message', function(msg) {
		if (msg instanceof Buffer) {
			// get an arraybuffer from the message:
			const ab = msg.buffer.slice(msg.byteOffset,msg.byteOffset+msg.byteLength);
			console.log("received arraybuffer", ab);
			// as float32s:
			//console.log(new Float32Array(ab));

		} else {
			if (msg == "getData") {
				// reply:
				ws.send(JSON.stringify({ cmd:"newData", state: manus.state }))

				ws.send(JSON.stringify({ cmd: "trackingData", state:getTrackingData() }))

			} else if (msg == "sendHaptics") {
				//var regEx = /(\/belt_(?<beltb>[1-6]){1}\/buzzer_(?<buzzer>[1-5]){1}\/((repititions)|(frequency)))|(\/belt_(?<beltp>[1-6]){1}\/pattern_(?<pattern>[1-4]){1}\/((repititions)|(frequency)))/
				// Open the socket.
				udpPort.open();
	
				function send(b,z,p,d) {
	
					bodyHaptics = {
								address: `/belt_${b}/buzz_${z}/`,
								args: [
										{
												type: "i",
												value: p
										},
										{
												type: "i",
												value: d
										}
								]
						};
	
						console.log("Sending message", bodyHaptics.address, bodyHaptics.args, "to", udpPort.options.remoteAddress + ":" + udpPort.options.remotePort);
						udpPort.send(bodyHaptics);
	
				};
	
				for ( let i = 0; i < 8; i++ ){
					let b = 1; //belt
					let z = i; //buzzer
					let p = 52; //pattern
					let d = 0.5; //duration
					
					send(b,z,p,d);
				};

			} else if (msg == "sendHaptics_back") {

					// Open the socket.
					udpPort.open();
					let loop = 0;	

					do {
						bodyHaptics = {
									address: `/belt_1/buzz_3/`,
									args: [
											{
													type: "i",
													value: 44
											},
											{
													type: "i",
													value: 1
											}
									]
							};
		
							console.log("Sending message", bodyHaptics.address, bodyHaptics.args, "to", udpPort.options.remoteAddress + ":" + udpPort.options.remotePort);
							udpPort.send(bodyHaptics);
					
							bodyHaptics = {
								address: `/belt_1/buzz_4/`,
								args: [
										{
												type: "i",
												value: 95
										},
										{
												type: "i",
												value: 1
										}
								]
						};
	
						  console.log("Sending message", bodyHaptics.address, bodyHaptics.args, "to", udpPort.options.remoteAddress + ":" + udpPort.options.remotePort);
						  udpPort.send(bodyHaptics);

							loop++
						} while (loop<1);
			} else {
				console.log("received message from client:", id, msg);
			}
		}
	});
	
	// // Example sending binary:
	// const array = new Float32Array(5);
	// for (var i = 0; i < array.length; ++i) {
	// 	array[i] = i / 2;
	// }
    // ws.send(array);
    
    //send_all_clients("hi")
});

server.listen(8080, function() {
	console.log(`\n\n\n****************`);
	console.log(`****************`);
	console.log(`server listening`);
	console.log(`client view on http://localhost:${server.address().port}/index.html\n\n`);
});