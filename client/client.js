let log = document.getElementById("log");
let state_div = document.getElementById("state")
let msgs = [];

// wrist
function threeQuatFromManusQuat(q, arr, offset=0) {
	//q.fromArray(hand.wristOrientation);
	//q.set(arr[1], arr[2], arr[3], arr[0]);
	//Manus: [w] 			[x]v 			[y] 			[z]<
	//Three: [x]> 			[y] 			[z]v 			[w]
	q.set(-arr[offset+3], -arr[offset+2], -arr[offset+1], arr[offset+0])
	//q.set(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset+0])
}

// joints
function threeQuatFromManusQuat2(q, arr, offset=0) {
	//q.fromArray(hand.wristOrientation);
	//q.set(arr[1], arr[2], arr[3], arr[0]);
	//Manus: [w] 			[x]v 			[y] 			[z]<
	//Three: [x]> 			[y] 			[z]v 			[w]
	q.set(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset+0])
	//q.set(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset+0])
}

let state = null

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


let handMaterial = new THREE.MeshStandardMaterial( { color: 0x883322 } );

var wrist = new THREE.Mesh( new THREE.TorusGeometry( 3, 1, 16, 100 ), handMaterial );
scene.add( wrist );
wrist.add(new THREE.AxesHelper( 5 ));

let palm = new THREE.Mesh( new THREE.BoxGeometry( 6, 1, 7 ), handMaterial );
palm.position.z = -3.5;
wrist.add(palm);

var cone = new THREE.Mesh( new THREE.ConeGeometry( 1, 2, 32 ), new THREE.MeshStandardMaterial( { color: 0x00ff00 } ) );
palm.add( cone );

palm.add(new THREE.AxesHelper( 5 ));

let joints = []

// fingers:
for (let i=0; i<5; i++) {
	// joints:
	let parent = wrist;
	joints[i] = []
	for (let j=0; j<3; j++) {

		let joint = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), handMaterial );
		if (i==0) {
			switch(j) {
				case 0: joint.position.z = -2; joint.position.x = 4; break;
				case 1: joint.position.z = -2.5; break;
				case 2: joint.position.z = -2; break;
			}
		} else {
			switch(j) {
				case 0: joint.position.z = -7; joint.position.x = (i-2.5)*-1.5; break;
				case 1: joint.position.z = -2.5; break;
				case 2: joint.position.z = -2; break;
			}
		}
		parent.add(joint);
		parent = joint;
		joints[i][j] = joint;
		
		joint.add(new THREE.AxesHelper( 2 ));
	}
}

// White directional light at half intensity shining from the top.
var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add( directionalLight );
var light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

wrist.position.x = -8;
wrist.position.y = -8;
wrist.position.z = -20;


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

function update() {

	requestAnimationFrame(update);
	try {
		sock.send("getData");
	} catch(e) {
		write(e)
	}



	renderer.render( scene, camera );

	if (!state) return;

	// [0] SOURCE_FILTERED_DEFAULT - LH
	// [1] SOURCE_DEVIDEDATA - LH
	// [2] SOURCE_FILTERED_DEFAULT - RH
	// [3] SOURCE_DEVICEDATA - RH
	let deviceID = Object.keys(state.devices).sort()[0]
	let hand = state.devices[deviceID];

	state_div.innerText = JSON.stringify(hand, null, "  ");

	///float jointOrientations[5][5][4]; 
	///orientation for thumb[0], index[1], middle[2], ring[3], pinky[4] finger skeletal joints:
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


}

update();