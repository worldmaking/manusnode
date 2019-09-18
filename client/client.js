

let log = document.getElementById("log");
let msgs = [];

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
					//...
				}
				//if (onmessage) onmessage(msg);
				//else 
				log("ws received", msg);
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
}

update();