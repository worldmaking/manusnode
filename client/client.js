let log = document.getElementById("log");
let state_div = document.getElementById("state")
let msgs = [];

// wrist
function threeQuatFromManusQuat(q, arr, offset=0) {
	//q.fromArray(hand.wristOrientation);
	//q.set(arr[1], arr[2], arr[3], arr[0]);
	//Manus: [w] 			[x]v 			[y] 			[z]<
	//Three: [x]> 			[y] 			[z]v 			[w]
	q.set(-arr[offset+3], arr[offset+2], -arr[offset+1], arr[offset+0])//.normalize();
	//q.set(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset+0])
}

// joints
function threeQuatFromManusQuat2(q, arr, offset=0) {
	q.set(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset+0])
}

let state = null

var scene = new THREE.Scene();
let qscene = scene.add(new THREE.AxesHelper( 0.2 ));

var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.04, 10 );
camera.position.set(0, 1.6, 2);

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( WEBVR.createButton( renderer ) );
renderer.vr.enabled = true;

let handMaterial = new THREE.MeshStandardMaterial( { color: 0x883322 } );

let wrist = new THREE.Mesh( new THREE.TorusGeometry( 0.03, 0.01, 16, 100 ), handMaterial );
scene.add( wrist );
wrist.add(new THREE.AxesHelper( 0.05 ));

wrist.position.x = -0.25;//-8;
wrist.position.y = 0.75;// -8
wrist.position.z = -0.1;//-20;

let palm = new THREE.Mesh( new THREE.BoxGeometry( 0.06, 0.01, 0.07 ), handMaterial );
palm.position.z = -.035;
wrist.add(palm);

var cone = new THREE.Mesh( new THREE.ConeGeometry( 0.01, 0.02, 32 ), new THREE.MeshStandardMaterial( { color: 0x00ff00 } ) );
palm.add( cone );

palm.add(new THREE.AxesHelper( 0.05 ));

let joints = [];

// fingers:
for (let i=0; i<5; i++) {
	// joints:
	let parent = wrist;
	joints[i] = []
	for (let j=0; j<3; j++) {

		let joint = new THREE.Mesh( new THREE.BoxGeometry( 0.01, 0.01, 0.01 ), handMaterial );
		if (i==0) {
			// thumb
			switch(j) {
				case 0: joint.position.z = -0.02; joint.position.x = 0.04; break;
				case 1: joint.position.z = -0.025; break;
				case 2: joint.position.z = -0.02; break;
			}
		} else {
			// fingers
			switch(j) {
				case 0: joint.position.z = -0.07; joint.position.x = (i-2.5)*-0.015; break;
				case 1: joint.position.z = -0.025; break;
				case 2: joint.position.z = -0.02; break;
			}
		}
		parent.add(joint);
		parent = joint;
		joints[i][j] = joint;
		
		joint.add(new THREE.AxesHelper( 0.02 ));
	}
}


// White directional light at half intensity shining from the top.
var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add( directionalLight );
var light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

function write(...args) {
	if(msgs.length > 15){
		msgs.shift();
	}

	let msg = args.join(", ");

	msgs.push(msg);
	let fMsg = msgs.join("\n");

	log.innerText = "";
	log.innerText +=  "Log: \n " + fMsg;
	console.log(msg);
}

function connect_to_server(opt, log) {
	let self = {
		transport: opt.transport || "ws",
		hostname: opt.hostname || window.location.hostname,
		port: opt.port || window.location.port,
		protocols: opt.protocols || [],
		reconnect_period: 1000,
		reload_on_disconnect: true,
		socket: null,
	};
	self.addr = self.transport+'://'+self.hostname+':'+self.port;

	
	let connect = function() {
		self.socket = new WebSocket(self.addr, self.protocols);
		self.socket.binaryType = 'arraybuffer';
		//self.socket.onerror = self.onerror;
		self.socket.onopen = function() {
			log("websocket connected to "+self.addr);
			// ...
		}
		self.socket.onmessage = function(e) { 
			if (e.data instanceof ArrayBuffer) {
				// if (onbuffer) {
				// 	//onbuffer(e.data, e.data.byteLength);
				// } else {
					log("ws received arraybuffer of " + e.data.byteLength + " bytes")
				//}
			} else {
				let msg = e.data;
				let obj
				try {
					obj = JSON.parse(msg);
				} catch(e) {}
				if (obj.cmd == "newData") {
					state = obj.state
				} else {
					//if (onmessage) onmessage(msg);
					//else 
					log("ws received", msg);
				}
			} 
		}
		self.socket.onclose = function(e) {
			self.socket = null;
			setTimeout(function(){
				if (self.reload_on_disconnect) {
					window.location.reload(true);
				} else {
					log("websocket reconnecting");
					connect();
				}
			}, self.reconnect_period);		
			//if (onclose) onclose(e);
			log("websocket disconnected from "+addr);
		}

		self.send = function(msg) {
			if (!self.socket) { console.warn("socket not yet connected"); return;}
			if (self.socket.readyState != 1) { console.warn("socket not yet ready"); return;}
			if (typeof msg !== "string") msg = JSON.stringify(msg);
			self.socket.send(msg);
		}
	}

	connect();

	return self;
}

let sock
try {
	sock = connect_to_server({}, write);
} catch (e) {
	console.error(e);
}

let line = new THREE.Line( new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1) ]) );
line.name = "line";
line.scale.z = 3;
palm.add(line.clone());

animate();

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
  
	renderer.setSize( window.innerWidth, window.innerHeight );
  
}

function animate() {
  
	renderer.setAnimationLoop( render );
  
}

function render() {

	try {
		sock.send("getData");
	} catch(e) {
		write(e)
	}

		if (!state) return;

	// endpointID
	// [0] SOURCE_FILTERED_DEFAULT - LH
	// [1] SOURCE_DEVICEDATA - LH
	// [2] SOURCE_FILTERED_DEFAULT - RH
	// [3] SOURCE_DEVICEDATA - RH
	let deviceID = Object.keys(state.devices).sort()[3]
	let hand = state.devices[deviceID];

	state_div.innerText = JSON.stringify(hand, null, "  ");
	
	/// wristOrientation[4];
	/// quaternion representation of the wrist orientation (w[0], x[1], y[2], z[3])

	/// float jointOrientations[5][5][4]; 
	/// orientation for thumb[0], index[1], middle[2], ring[3], pinky[4] finger skeletal joints:
	/// base[0], CMC/MCP[1], MCP/PIP[2], IP/DIP[3], tip[4] (named for thumb/other fingers)
	/// as quaternions in the form of w[0], x[1], y[2], z[3]

	// i.e., every 20 numbers represents one finger
	// within that there are 5 quaternions for the various joints from base to tip
	
	threeQuatFromManusQuat(wrist.quaternion, hand.wristOrientation);

	for (let i=0; i<5; i++) {
		for (let j=0; j<3; j++) {
			threeQuatFromManusQuat2(joints[i][j].quaternion, hand.jointOrientations, 20*i + 4*(j+1));
		}
	}

	renderer.render( scene, camera );
}