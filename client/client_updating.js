

//  // USEFUL QUATERNIONS //  // 
// [w, x, y, z] = [cos(a/2), sin(a/2) * nx, sin(a/2)* ny, sin(a/2) * nz]
// [x]       [y]       [z]       [w]      //** description */
// [0]       [0]       [0]       [1]      //** identity */
// [1]       [0]       [0]       [0]      //** 180 around X : pitch */
// [0]       [1]       [0]       [0]      //** 180 around Y : yaw   */
// [0]       [0]       [1]       [0]      //** 180 around Z : roll  */
// [sq(.5)]  [0]       [0]       [sq(.5)] //** +90 around X : CW    */
// [0]       [sq(.5)]  [0]       [sq(.5)] //** +90 around Y : CW    */
// [0]       [0]       [sq(.5)]  [sq(.5)] //** +90 around Z : CW    */
// [-sq(.5)] [0]       [0]       [sq(.5)] //** -90 around X : CCW   */
// [0]       [-sq(.5)] [0]       [sq(.5)] //** -90 around Y : CCW   */
// [0]       [0]       [-sq(.5)] [sq(.5)] //** -90 around Z : CCW   */

// position [ x, y, z ] -> p = 0 + ix + jy + kz
// orientation [ heading    q = cos(a/2) + ix sin(a/2)
//                attitude               + jy sin(a/2)
//                   bank ]              + kz sin(a/2)
// rotation [ heading     q = cos(a/2) + ix sin(a/2)
//             attitude                + jy sin(a/2)
//                bank ]               + kz sin(a/2)
// rotate point      4D ->  q * p * conj(q)
// combine rotations 4D -> q1 * q2 
//
//  Pi -> vector before transform | Po -> vector after transform | q -> quaternion rep trans | conj() -> conjugate
//
// rotation ( around origin )               Po = q * Pi * conj( q )
// reflection (in plane thorough origin )   Po = q * Pi * q
// para component of plane                  Po = 1/2 ( Pi + q * Pi * q )
// perp component of plane                  Po = 1/2 ( Pi -q * Pi * q )
// scaling                                  Po = scalar * Pi (or comb w/rot or ref)
// translation                              Po = q + Pi
//
//  local? !reverse -> q1 then q2 ? q1 * q2 -> global? reverse -> q2 * q1
//

//  //************************************************************************************************// VARIABLES  //  //
//  //************************************************************************************************//
//  //************************************************************************************************//

//let Creature = require('./js/Creature.js');


//group.visible = false;

let tmp, ret;
let dust;
let paint = false;


const UNITVECTOR_X = new THREE.Vector3(1,0,0);
const UNITVECTOR_Y = new THREE.Vector3(0,1,0);
const UNITVECTOR_Z = new THREE.Vector3(0,0,1);

let log = document.getElementById( "log" );
let state_div = document.getElementById( "state" );
let msgs = [];

let container;
let camera, scene, renderer, controls, user, L, R, LH, LR; 

let crosshair, 
    raycaster, 
    handRay, 
    paintRayL,
    paintRayR,
    intersected, 
    leftInter,
    rightInter,
    intersections = [],
    intersectionsLeft = [],
    intersectionsRight = [];

let tempMatrix = new THREE.Matrix4();
let rotationMatrix = new THREE.Matrix4();
let leftWristQuat = new THREE.Quaternion();
let rightWristQuat = new THREE.Quaternion();

let rot90 = new THREE.Quaternion();
let rot180 = new THREE.Quaternion();
let rotZ180 = new THREE.Quaternion();
let rotY90 = new THREE.Quaternion();

let tempQuaternion = new THREE.Quaternion();
let targetRotation = new THREE.Quaternion();
let fromHere = new THREE.Quaternion();
let toThere = new THREE.Quaternion();

let gloves, room, floor;
let planeX, planeY, planeZ;
let up, down, left, right;

let leftHand,
    leftHandControl, 
    rightHand,
    rightHandControl;

let leftWrist,
    leftJoints = [],
    rightWrist,
    rightJoints = [];

let geometries = [
  new THREE.ConeGeometry( 0.01, 0.05, 32 ), // [0] boids //0.01 0.02 // 0.01 0.05
  new THREE.TorusGeometry( 0.025, 0.005, 16, 100 ), // [1] wrist
  new THREE.BoxGeometry( 0.06, 0.01, 0.07 ), // [2] palm
  new THREE.BoxGeometry( 0.01, 0.01, 0.01 ), // [3] joints
  new THREE.TorusGeometry( 0.01, 0.001, 16, 100 ), // [4] fingertips
  new THREE.RingBufferGeometry( 0.02, 0.04, 32 ), // [5] crosshair
  new THREE.BoxLineGeometry( 10, 10, 10, 10, 10, 10 ), // [6] room
  new THREE.PlaneBufferGeometry( 10, 10 ), // [7] floor
  new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] ), // [8] raycaster
  new THREE.CylinderGeometry( 0.01, 0.005, 0.025, 0, true), //[9] fingertip
  new THREE.SphereGeometry( 0.01, 7, 2, 0, 6.3, 0, 3.1 ), //[10]
  new THREE.TetrahedronGeometry( 7, 2 ) //[11]
];

let materials = [
  // [0] boids
  new THREE.MeshLambertMaterial( {
    color: 0x9a799c//0x191919 //0x9a799c //0x101010
  } ),
  // [1] wrist, palm, joints
  new THREE.MeshStandardMaterial( {
    color: 0x883322 
  } ),
  // [2] fingertips 
  new THREE.MeshToonMaterial ( {
    color: 0x166d99,
    transparent: true,
    opacity: 0
  } ),
  // [3] crosshair
  new THREE.MeshBasicMaterial( {
    color: 0xffffff,
    opacity: 0, //1
    transparent: true
  } ),
  // [4] room 
  new THREE.LineBasicMaterial( { 
    color: 0x808080
  } ),
  // [5] floor 
  new THREE.MeshStandardMaterial( {
    color: 0xffc30a,
    roughness: 1.0,
    metalness: 0.5
  } ),
  // [6] new floor
  new THREE.MeshLambertMaterial( {
    color: 0x101010//0x191919 //0x9a799c //0x101010
  } ),
  // [7] fingertips 
  new THREE.MeshToonMaterial ( {
    color: 0x160099
  } ),
  // [8] fingertips 
  new THREE.MeshToonMaterial ( {
    color: 0x166d00
  } ),
  // [9] fingertips 
  new THREE.MeshToonMaterial ( {
    color: 0x006d99,
    transparent: true,
    opacity: 0
  } ),
];

let state = null;

let sock;

//** 3D BOIDS */
let boids = new THREE.Group();
//let Creature;
let boundary = 7;
let clock = new THREE.Clock();
let flocks;
let axis = new THREE.Vector3();
let radians;
let Creatures = [];
let wind = new THREE.Vector3(0.05,0.0,0.0);
let gravity = new THREE.Vector3(0.0,0.1,0);

// VR STUFF
let isInVR = false;
let vrDisplay, frameData;
let rightEye, leftEye;

// STAR STUFF
let starTexture = new THREE.TextureLoader().load( "sparkle_cut.png" );
let stars = [];
let starGroup = new THREE.Group();
let lightness = 0;
let rotSpeed = 0.01;


//  //************************************************************************************************// UPDATE WORLD FUNCTIONS //  //
//  //************************************************************************************************//
//  //************************************************************************************************//

function getRandom(Min, Max) {
  let min = Min;
  let max = Max;
  let num = Math.floor(Math.random()*max) + min; // this will get a number between min and max;
  num *= Math.floor(Math.random()*2) == 1 ? 1 : -1; // this will add minus sign in 50% of cases
  return num;
}

function threeQuatFromManusQuat( q, arr, offset=0 ) {
  //** swap quaternion differences */
  //** Manus: [w] 	 		  [x]v   		[y]^ 			  [z]<    */
  //** Manus: [x]v 			  [y]^      [z]< 		  	[w=>0]  */
  //** Manus: [z->x]<		  [y]^      [x->z]v	  	[w=>0]  */
  //** Manus: [-z]->>     [y] 	    [x]v      	[w=>0]  */
	//** Three: [x]> 			  [y]^ 	  	[z]v   			[w]     */
  q.set( -arr[ offset + 3 ], arr[ offset + 2 ], arr[ offset + 1 ], arr[ offset + 0 ] );
}

function threeQuatFromManusQuatTHUMB( q, arr, offset=0 ) {
  //** swap quaternion differences */
  //** Manus: [w] 	 		  [x]v   		[y]^ 			  [z]<    */
  //** Manus: [x]v 			  [y]^      [z]< 		  	[w=>0]  */
  //** Manus: [z->x]<		  [y]^      [x->z]v	  	[w=>0]  */
  //** Manus: [-z]->>     [y] 	    [x]v      	[w=>0]  */
	//** Three: [x]> 			  [y]^ 	  	[z]v   			[w]     */
  q.set( -arr[ offset + 3 ], arr[ offset + 2 ], arr[ offset + 1 ], arr[ offset + 0 ] );
}


function getHandsL( hands ) {
  h = state.devices[hands];
  //threeQuatFromManusQuat( leftWrist.quaternion, h.wristOrientation );
  for ( let i=0; i<5; i++ ) {
    for ( let j=0; j<3; j++ ) {
      //if ( i == 0 ) {
        threeQuatFromManusQuat( leftJoints[i][j].quaternion, h.jointOrientations, 20 * i + 4 *( j + 1 ) );
        //leftJoints[i][j].quaternion.multiplyQuaternions( leftJoints[i][j].quaternion, rot90 );   
      //} else {
        //threeQuatFromManusQuat( leftJoints[i][j].quaternion, h.jointOrientations, 20 * i + 4 *( j + 1 ) );
      //   let rot = new THREE.Quaternion();
      //   rot.set( -Math.sqrt(0.5), 0, 0, Math.sqrt(0.5) );
      //   //rot.set( 0, 0, 1, 0 );
      //   rot.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), Math.PI / 2 );
      //   // if ( j == 2 ) {
      //   //   //leftJoints[i][j].quaternion.multiplyQuaternions( leftJoints[i][j].quaternion, rot );   
      //   // }
      //   //leftJoints[i][j].quaternion.multiplyQuaternions( leftJoints[i][j].quaternion, rot180 );
      //   //leftJoints[0][0].quaternion.multiplyQuaternions( leftJoints[0][0].quaternion, rot90 );
      // }   
    }
  }
}

function getHandsR( hands ) {
  h = state.devices[hands];
  //threeQuatFromManusQuat( rightWrist.quaternion, h.wristOrientation );
  // let rot = new THREE.Quaternion();
  // rot.set( 0, 0, -Math.sqrt(0.5), Math.sqrt(0.5) );
  // //rot.set( 0, 0, 1, 0 );
  // rot.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), Math.PI / 2 );
  for ( let i=0; i<5; i++ ) {
    for ( let j=0; j<3; j++ ) {
      // if ( i == 0 ) {
      //   //rightJoints[i][j].quaternion.multiplyQuaternions( rightJoints[i][j].quaternion, rot );
      //   threeQuatFromManusQuat( rightJoints[i][j].quaternion, h.jointOrientations, 20 * i + 4 *( j + 1 ) );
      //   //rightJoints[i][j].quaternion.multiplyQuaternions( rightJoints[i][j].quaternion, rot );   
      // } else {
        threeQuatFromManusQuat( rightJoints[i][j].quaternion, h.jointOrientations, 20 * i + 4 *( j + 1 ) );
        // let rot = new THREE.Quaternion();
        // rot.set( 0, 0, Math.sqrt(0.5), Math.sqrt(0.5) );
        // //rot.set( 0, 0, 1, 0 );
        // rot.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), Math.PI / 2 );
       //rightJoints[i][j].quaternion.multiplyQuaternions( rightJoints[i][j].quaternion, rot90 );
    }
  }
}


//  //************************************************************************************************// FUNCTION CALLS  //  //
//  //************************************************************************************************//
//  //************************************************************************************************//

initialize();
animate();


//  //************************************************************************************************// SERVER CONNECT  //  //
//  //************************************************************************************************//
//  //************************************************************************************************//

//  //*************************************** // WRITE // ********************************************//
function write( ...args ) {

	if( msgs.length > 15 ) {

		msgs.shift();
  
  }

	let msg = args.join( ", " );
	msgs.push( msg );
  let fMsg = msgs.join( "\n" );

	log.innerText = "";
  log.innerText +=  "Log: \n " + fMsg;
  
  console.log( msg );
  
}
//  //*********************************** // CONNECT_TO_SERVER // *************************************//
function connect_to_server( opt, log ) {

	let self = {
    transport: opt.transport || "ws",
		hostname: opt.hostname || window.location.hostname,
		port: opt.port || window.location.port,
		protocols: opt.protocols || [],
		reconnect_period: 1000,
		reload_on_disconnect: true,
		socket: null,
  };
  
  self.addr = self.transport + '://' + self.hostname + ':' + self.port;
	
	let connect = function() {
  
    self.socket = new WebSocket( self.addr, self.protocols );
		self.socket.binaryType = 'arraybuffer';
    //self.socket.onerror = self.onerror;
    
		self.socket.onopen = function() {

			log( "websocket connected to " + self.addr );
			// ...
  
    }
  
    self.socket.onmessage = function( e ) { 
  
      if ( e.data instanceof ArrayBuffer ) {
  
        // if (onbuffer) {
				// 	//onbuffer(e.data, e.data.byteLength);
				// } else {

        log( "ws received arraybuffer of " + e.data.byteLength + " bytes" )

        //}

      } else {
  
        let msg = e.data;
				let obj;
  
        try {
  
          obj = JSON.parse( msg );
  
        } catch( e ) {}
  
        if ( obj.cmd == "newData" ) {
  
          state = obj.state;
  
       } else if (obj.cmd == "trackingData") {

      /*
        ws received, {
          "cmd":"trackingData","state":
          {
            "hmd":
            {
              "pos":{"0":-0.31410789489746094,"1":1.6376476287841797,"2":0.4556894302368164},
              "quat":{"0":0.13929444551467896,"1":0.2569557726383209,"2":0.034140702337026596,"3":0.9557223320007324}
            },
            "trackers":
            [{
              "pos":{"0":0.9590294361114502,"1":1.911466121673584,"2":0.5492393970489502},
              "quat":{"0":-0.1990630030632019,"1":0.6774951219558716,"2":0.6710811257362366,"3":0.22588586807250977}
            },
            {
              "pos":{"0":1.086222529411316,"1":1.8866705894470215,"2":0.4619896411895752},
              "quat":{"0":-0.6431819200515747,"1":-0.2571682035923004,"2":-0.28171005845069885,"3":0.6639434695243835}
            }]
          }
         }
      */
          let lh = obj.state.trackers[0];
          let rh = obj.state.trackers[1];

         // log(lh.pos[1])

          leftWrist.position.fromArray(lh.pos);
          rightWrist.position.fromArray(rh.pos);

          // apply 90 rot 
          // [-/+sq(.5)]  [0]       [0]       [sq(.5)] //** -/+90 around X : CW    */
         
          //rot90.set(Math.sqrt(0.5), 0, 0, Math.sqrt(0.5) );
          rot90.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), -Math.PI / 2 );

          rotZ180.set( 0, 0, 1, 0 );
          //rotZ180.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), Math.PI );

          rot180.set( 1, 0, 0, 0 );
          //rot180.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), Math.PI );
          
          leftWrist.quaternion.fromArray(lh.quat);
          rightWrist.quaternion.fromArray(rh.quat);
          
          //leftWrist.quaternion.multiplyQuaternions(leftWrist.quaternion, rotZ180);
          leftWrist.quaternion.multiplyQuaternions(leftWrist.quaternion, rot90);

          rot180.set( 0, 1, 0, 0 );
          //rot90.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), -Math.PI/2 );

          //rightWrist.quaternion.multiplyQuaternions(rightWrist.quaternion, rot180);
          rightWrist.quaternion.multiplyQuaternions(rightWrist.quaternion, rot90);

          // // check interactions
          // leftHandControl = lh;
          // rightHandControl = rh;

                  
          // //  ** add controllers | hands | trackers */
          // leftHandControl = renderer.vr.getController( 0 );
          // leftHandControl.addEventListener( 'selectstart', onSelectStart );
          // leftHandControl.addEventListener( 'selectend', onSelectEnd );
          // //scene.add( leftHandControl );

          // rightHandControl = renderer.vr.getController( 1 );
          // rightHandControl.addEventListener( 'selectstart', onSelectStart );
          // rightHandControl.addEventListener( 'selectend', onSelectEnd );
          // //scene.add( rightHandControl );

          // let line = new THREE.Line( geometries[8], materials[3] );
          // //line.name = 'handRay';
          // line.scale.z = 1;

          // leftHandControl.add( line.clone() ); // leftWrist
          // leftHandControl.name = 'leftHandRay';
          // rightHandControl.add( line.clone() ); // rightWrist
          // rightHandControl.name = 'rightHandRay';

          //leftWrist.quaternion.multiplyQuaternions(leftWrist.quaternion, rot180);
          //rightWrist.quaternion.multiplyQuaternions(rightWrist.quaternion, rot180);

          // [0]       [0]      [1]       [0]      //** 180 around Z : roll  */
          // rot180.set( 1, 0, 0, 0 );
          // rot180.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), Math.PI );



          // rotY90.set( 0, Math.sqrt(0.5), 0, Math.sqrt(0.5) );
          // rotY90.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI / 2 );
          
				} else {
          
          log( "ws received", msg );
  
        }
			} 
		}
  
    self.socket.onclose = function( e ) {
  
      self.socket = null;

			setTimeout( function() {
  
        if ( self.reload_on_disconnect ) {
  
          window.location.reload( true );
  
        } else {
  
          log( "websocket reconnecting" );

					connect();
  
        }
			}, self.reconnect_period );		
  
      //if (onclose) onclose(e);
			log( "websocket disconnected from " + self.addr );
  
    }

		self.send = function( msg ) {
  
      if ( !self.socket ) { console.warn( "socket not yet connected" ); return; }
			if ( self.socket.readyState != 1 ) { console.warn( "socket not yet ready" ); return; }
			if ( typeof msg !== "string" ) msg = JSON.stringify( msg );
  
      self.socket.send( msg );
  
    }
	}

	connect();

	return self;
}
//  //*********************************** // CONNECT_TO_HAPTICS // *************************************//


//  //************************************************************************************************// INITIALIZATION  //  //  
//  //************************************************************************************************//
//  //************************************************************************************************//

function initialize() {
  
  //** setup */
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  let info = document.createElement( 'div' );
  info.style.position = 'absolute';
  info.style.top = '10px';
  info.style.width = '100%';
  info.style.textAlign = 'center';
  info.innerHTML = 'HAND TRACKING';
  container.appendChild( info );

  //** add scene */
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x000000  ); //0x808080
  //scene.fog = new THREE.Fog( 0x000000, 0.5, 6 ); //0xefd1b5
  //scene.fog	= new THREE.FogExp2( 0x000000, 0.25 );

  for (let i = 0; i < 300; i++) {
    let geometry = new THREE.SphereGeometry( 0.05, 8, 6 );
    let material = new THREE.MeshBasicMaterial( { map: starTexture } );
    let star = new THREE.Mesh( geometry, material );
    // let y = getRandom();
    // y *= y;
    // y = Math.sqrt( y );
    star.position.set( getRandom(0.1,10), getRandom(0.1,10), getRandom(0.1,10) );

    star.material.side = THREE.DoubleSide;
    stars.push( star );
  }

  for (let i = 0; i < 100; i++) { //100
    let geometry = new THREE.SphereGeometry( 0.2, 8, 6 );
    let material = new THREE.MeshBasicMaterial( { map: starTexture } );
    let star = new THREE.Mesh( geometry, material );
    // let y = getRandom();
    // y *= y;
    // y = Math.sqrt( y );
    star.position.set( getRandom(0.1,13), getRandom(0.1,13), getRandom(0.1,13) );

    star.material.side = THREE.DoubleSide;
    stars.push( star );
  }
  
  for (let i = 0; i < 25; i++) { //25
    let geometry = new THREE.SphereGeometry( 0.7, 8, 6 );
    let material = new THREE.MeshBasicMaterial( { map: starTexture } );
    let star = new THREE.Mesh( geometry, material );
    // let y = getRandom();
    // y *= y;
    // y = Math.sqrt( y );
    star.position.set( getRandom(0.1,15), getRandom(0.1,15), getRandom(0.1,15) );
    
    star.material.side = THREE.DoubleSide;
    stars.push( star );
  }

  for (let i = 0; i < 5; i++) { //5
    let geometry = new THREE.SphereGeometry( 1, 8, 6 );
    let material = new THREE.MeshBasicMaterial( { map: starTexture } );
    let star = new THREE.Mesh( geometry, material );
    // let y = getRandom();
    // y *= y;
    // y = Math.sqrt( y );
    star.position.set( getRandom(0.1,15), getRandom(0.1,15), getRandom(0.1,15) );
    
    star.material.side = THREE.DoubleSide;
    stars.push( star );
  }
  
  
  // flocks = new THREE.Group();
  // scene.add(flocks);
  room = new THREE.Group();
  scene.add( room );
  for (let i = 0; i < 500; i++) { //500
    let geometry = new THREE.SphereGeometry( 0.01, 8, 6 );
    //let material = new THREE.MeshBasicMaterial( { map: starTexture } );
    dust = new THREE.Mesh( geometry, materials[5] );
    // let y = getRandom();
    // y *= y;
    // y = Math.sqrt( y );
    dust.position.set( getRandom(3,12), getRandom(3,12), getRandom(3,12) ); //25
    // let light = new THREE.PointLight( 0xFFA824, 1, 100 );
    // light.position.set( 50, 50, 50 );
    // //dust.add( light );
    dust.name = "d" + i;
    room.add(dust);
    //star.material.side = THREE.DoubleSide;
    //stars.push( star );
  }



  tmp = stars.slice(stars);
  ret = [];
  for (let j = 0; j < stars.length; j++) {
    let index = Math.floor(Math.random() * tmp.length);
    let removed = tmp.splice(index, 1);
    // Since we are only removing one element
    ret.push(removed[0]);
    ret[j].name = "s" + j;
    starGroup.add( ret[j] );
  }

  scene.add(starGroup);
  starGroup.name = "starGroup";

  //gloves = new THREE.Group();
  //scene.add( gloves );

  
  user = new THREE.Group();
  user.name = "user"
  scene.add( user ); //room
  

  //** add camera */
  const fov = 75;
  const aspect = window.innerWidth / window.innerHeight; // 2;  // the canvas default
  const near = 0.04; //0.1;
  const far = 20; //10 //50;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  //** camera crosshairs | for intersections and to orientate sightline */
  crosshair = new THREE.Mesh( geometries[5], materials[3] );
  //camera.add( crosshair );
  crosshair.position.z = - 1; //** keep crosshair slightly infront of you at all times */
  //user.add( camera );
  scene.add( camera );
  //user.add( camera );


  
  // controls = new THREE.OrbitControls(camera);
  // camera.lookAt(0,  - .5, 0);

  // let vec = new THREE.Vector3( 0, 0, -1 );
  // vec.applyQuaternion( camera.quaternion );
  // crosshair.position.copy( vec );

  //** add lighting */
  scene.add( new THREE.HemisphereLight( 0x808080, 0x606060 ) );
  scene.add( new THREE.AmbientLight( 0x404040 ) ); //** soft white light */
  let light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( 1, 1, 1 ).normalize();
  light.castShadow = true;
  // light.shadow.camera.top = 6
  // light.shadow.camera.bottom = -6;
  // light.shadow.camera.right = 6;
  // light.shadow.camera.left = -6;
  // light.shadow.mapSize.set( 4096, 4096 );
  scene.add( light );

  //** add room */
  //room = new THREE.LineSegments( geometries[6], materials[4] );
  room.name = "room"
  
  
  room.position.set( 0, 0, 0 );
  
  
  //scene.add( room );
  
  //** add floor */
  //floor = new THREE.Mesh( geometries[7], materials[5] );
  floor = new THREE.Mesh( geometries[7],  materials[6] )
  floor.rotation.x = - Math.PI / 2;
  floor.name = "floor"
  floor.receiveShadow = true;
  scene.add( new THREE.PointLight( 0xff0040, 2, 50 ) );
  //scene.add(floor)
  

  //** add ray | used for casting lines from head + controllers to objects | used for intersecting */
  raycaster = new THREE.Raycaster();
  
  //** add rendered requirements */
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;

  //** include VR content */
  renderer.vr.enabled = true;
  
  container.appendChild( renderer.domElement );
  document.body.appendChild( WEBVR.createButton( renderer ) );
  
  //** wrist */
  leftWrist = new THREE.Mesh( geometries[1], materials[2] );
  rightWrist = new THREE.Mesh( geometries[1], materials[2] );
  
  //leftWrist.position.set( 0, 1.3, + 0.1 ); // 0, 1.5, 0
  //rightWrist.position.set( 0, 1.3, - 0.1 ); // 0.5, 1.5, -1

  //leftWrist.add( new THREE.AxesHelper( 0.05 ) );
  //rightWrist.add( new THREE.AxesHelper( 0.05 ) );

  //************************************//
  //        LHS  Forward  RHS           //
  //         -    [-X]    -             //
  //       -| |-         -| |-          //
  //     -| | | |       | | | |-        //
  //    | |     | -   - |     | | Right //
  // +Z |  [+Y]   /   \         |  [-Z] //
  //     \       /     \       /   [+X] //
  //      \_____/       \_____/         //
  //        +X            +X            //
  //                                    //
  //************************************//          
    
  // leftWrist.MatrixAutoUpdate = true;
  // rightWrist.MatrixAutoUpdate = true;

  // gloves.add();
  // room.add( leftWrist );
  // room.add( rightWrist );

  leftWrist.name = "leftWrist"
  rightWrist.name = "rightWrist"

  //leftWrist.standingMatrix = renderer.vr.getStandingMatrix();
  //rightWrist.standingMatrix = renderer.vr.getStandingMatrix();

  user.add( leftWrist );
  user.add( rightWrist );

  //room.add( leftWrist );
  //room.add( rightWrist );

  // scene.add( leftWrist );
  // scene.add( rightWrist );
  // scene.add( wrist );

  let palm_length = 0.1;
  // let zQuat = new THREE.Quaternion();
  // zQuat.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ) )

  //** left fingertips */
  for ( let i=0; i<5; i++ ) {

    // joints
    let parent = leftWrist;
    leftJoints[i] = [];

    for ( let j=0; j < 3; j++ ) {

      let joint = new THREE.Mesh( geometries[4], materials[9] );

      if ( i==0 ) {

        // thumb
        switch( j ) {

          case 0: break; // joint = new THREE.Mesh( geometries[10], materials[7] ); joint.position.z = +0.04; joint.position.y = 0.0; joint.position.x = -0.04; break;
          case 1: break; // joint = new THREE.Mesh( geometries[10], materials[7] ); joint.position.z = 0; joint.position.y = -0.01; joint.position.x = -0.0; break;
          case 2: break; // joint = new THREE.Mesh( geometries[10], materials[7] ); joint.position.z = 0; break;
        
        } // 0.06

      } else {

        // fingers
        switch( j ) {

          case 0: joint = new THREE.Mesh( geometries[10], materials[8] ); joint.position.z = +0.06; joint.position.y = 0.0; joint.position.x = ( -1 * ( 2.5 - i) ) *0.015; break;
          case 1: joint = new THREE.Mesh( geometries[10], materials[8] ); joint.position.z = +0.04; joint.position.y = 0.0; joint.position.x = ( -1 * ( 2.5 - i) ) *0.005; break;
          case 2: joint = new THREE.Mesh( geometries[10], materials[8] ); joint.position.z = +0.04; joint.position.y = 0.0; joint.position.x = ( -1 * ( 2.5 - i) ) *0.001; break;
        } // 0.115
      }

      parent.add( joint );
      parent = joint;
      leftJoints[i][j] = joint;
      
     //joint.add( new THREE.AxesHelper( 0.02 ) );
    
    }
  }

  //** right fingertips */
  for ( let i=0; i<5; i++ ) {

    // joints
    let parent = rightWrist;
    rightJoints[i] = [] 

    for ( let j = 0; j < 3; j++ ) {

      let joint = new THREE.Mesh( geometries[4], materials[9] );

      if ( i==0 ) {

        // thumb
        switch( j ) {

          case 0: break;// joint = new THREE.Mesh( geometries[10], materials[7] ); joint.position.z = palm_length-0.07; joint.position.y = -0.03; joint.position.x = 0.04; break;
          case 1: break;//joint = new THREE.Mesh( geometries[10], materials[7] ); joint.position.z = -0.025; break;
          case 2: break;//joint = new THREE.Mesh( geometries[10], materials[7] ); joint.position.z = -0.04; break;
        
        } // 0.06

      } else {

        // fingers
        switch( j ) {

          case 0: joint = new THREE.Mesh( geometries[10], materials[8] ); joint.position.z = +0.06; joint.position.y = 0.0; joint.position.x = ( 2.5-i) *0.015; break;
          case 1: joint = new THREE.Mesh( geometries[10], materials[8] ); joint.position.z = +0.04; joint.position.y = 0.0; joint.position.x = ( 2.5-i) *0.015; break;
          case 2: joint = new THREE.Mesh( geometries[10], materials[8] ); joint.position.z = +0.04; joint.position.y = 0.0; joint.position.x = ( 2.5-i) *0.015; break;

        } // 0.115
      }

      parent.add( joint );
      parent = joint;
      rightJoints[i][j] = joint;
      
      //joint.add( new THREE.AxesHelper( 0.02 ) );
    
    }
  }

  //  ** add controllers | hands | trackers */
  leftHandControl = renderer.vr.getController( 0 );
  leftHandControl.addEventListener( 'selectstart', onSelectStart );
  leftHandControl.addEventListener( 'selectend', onSelectEnd );
  scene.add( leftHandControl );

  rightHandControl = renderer.vr.getController( 1 );
  rightHandControl.addEventListener( 'selectstart', onSelectStart );
  rightHandControl.addEventListener( 'selectend', onSelectEnd );
  scene.add( rightHandControl );

  let lineRay = new THREE.Line( geometries[8]);//, materials[3] );
  lineRay.name = 'handRay';
  lineRay.scale.z = 1;

  leftHandControl.add( lineRay.clone() ); // leftWrist
  rightHandControl.add( lineRay.clone() ); // rightWrist


  let lineL = new THREE.Line( geometries[8], materials[3] );
  lineL.scale.z = -0.2;
  lineL.name = 'leftRay';
  leftWrist.add( lineL.clone() );

  let lineR = new THREE.Line( geometries[8], materials[3] );
  lineR.name = 'rightRay';
  lineR.scale.z = -0.2;
  rightWrist.add( lineR.clone() );

  //scene.add( new THREE.AxesHelper( 1 ) );


  //** add event listeners  */
  window.addEventListener( 'resize', onWindowResize, false );
  // window.addEventListener('vrdisplayactivate', onVRRequestPresent, false);
	// window.addEventListener('vrdisplaydeactivate', onVRExitPresent, false);
  // window.addEventListener( 'vrdisplaypointerrestricted', onPointerRestricted, false );
  // window.addEventListener( 'vrdisplaypointerunrestricted', onPointerUnrestricted, false );


  // //** 3D BOIDS */
  //let Creature;
  for ( let i = 0; i < 200; i++ ) {
    Creatures[i] = new buildCreature(); //Creature
    Creatures[i].initialize();
    Creatures[i].display();
    //Creatures.push(Creature);
  }
  // for ( let i = 0; i < Creatures.length; i++ ) {
  //   scene.add( Creatures[i] );
  // }
  //boids.add( Creatures );
  //let prevFog = true;
  
  scene.add( boids );  
  //boids.position.y += 1;
  //boids.position.z += 2;


  try {
    sock = connect_to_server( {}, write );
  } catch ( e ) {
    console.error( e );
  }

}

// let stop = true;
// // PAINT 
// function paint() {
//   do {
 
//   } while (stop == true); {
//   };
// };




//  //************************************************************************************************// INTERSECTIONS  //  // 
//  //************************************************************************************************//
//  //************************************************************************************************//

//  //*************************************** // CLEAN // ********************************************//
function cleanIntersected() {

  while ( intersections.length ) {

    let object = intersections.pop();
    object.material.emissive.r = 0;

  }

  while ( intersectionsRight.length ) {

    let object = intersectionsRight.pop();
    object.material.emissive.r = 0;

  }

  while ( intersectionsLeft.length ) {

    let object = intersectionsLeft.pop();
    object.material.emissive.r = 0;

  }

}

//  //********************************** // SELECT START // ******************************************//
function onSelectStart( event ) {

  let selectStart = event.target;
  let intersections = getIntersections( selectStart );

  if ( intersections.length > 0 ) {

    let intersection = intersections[ 0 ];

    tempMatrix.getInverse( selectStart.matrixWorld );

    let object = intersection.object;
    object.matrix.premultiply( tempMatrix );
    object.matrix.decompose( object.position, object.quaternion, object.scale );
    //object.material.emissive.b = 1;
    selectStart.add( object );

    selectStart.userData.selected = object;

  }

}

//  //************************************ // SELECT END // ******************************************//
function onSelectEnd( event ) {

  let selectEnd = event.target;

  if ( selectEnd.userData.selected !== undefined ) {

    let object = selectEnd.userData.selected;
    object.matrix.premultiply( selectEnd.matrixWorld );
    object.matrix.decompose( object.position, object.quaternion, object.scale );
    //object.material.emissive.b = 0;
    scene.add( object );

    selectEnd.userData.selected = undefined;

  }


}

//  //******************************** // GET INTERSECTIONS // ***************************************//
function getIntersections( event ) {

  tempMatrix.identity().extractRotation( event.matrixWorld );

  raycaster.ray.origin.setFromMatrixPosition( event.matrixWorld );
  raycaster.ray.direction.set( 0, 0, -1 ).applyMatrix4( tempMatrix );

  return raycaster.intersectObjects( room.children );

}


//  //********************************* // INTERSECT OBJECT // ***************************************//
function intersectObjects( leftEvent, rightEvent ) {
  console.log('paint the sky')
  //* Do not highlight when already selected */

  //if ( leftEvent.userData.selected !== undefined ) return;
  //if ( rightEvent.userData.selected !== undefined ) return;

  let paintRayL = leftEvent.getObjectByName( 'leftRay' );
  let paintRayR = rightEvent.getObjectByName( 'rightRay' );
  let intersectionsLeft = getIntersections( leftEvent );
  let intersectionsRight = getIntersections( rightEvent );

  if ( intersectionsLeft.length > 0 || intersectionsRight.length > 0 ) {
    console.log('paint the sky')
    let leftInter = intersectionsLeft[ 0 ];
    let rightInter = intersectionsRight[ 0 ];

    let objectR = rightInter.object;
    let objectL = leftInter.object;

    if ( objectR.position == objectL.position ) {
      
      let object = objectR;
    
      paint = true;
      //if ( count <= 10 ){
        let dir = new THREE.Vector3(object.position.x,object.position.y,object.position.z);
        let centroid = new THREE.Vector3(object.position.x,object.position.y,object.position.z);
        let plane = new THREE.Plane();
        plane.setFromNormalAndCoplanarPoint(dir, centroid).normalize();
    
        // Create a basic rectangle geometry
        let planeGeometry = new THREE.PlaneGeometry(0.01, 0.01);
    
        // Align the geometry to the plane
        let coplanarPoint = plane.coplanarPoint();
        let focalPoint = new THREE.Vector3().copy(coplanarPoint).add(plane.normal);
        planeGeometry.lookAt(focalPoint);
        planeGeometry.translate(coplanarPoint.x, coplanarPoint.y, coplanarPoint.z);
    
        // Create mesh with the geometry
        let planeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide});
        let H = Math.random()*360;
        planeMaterial.color.setHSL(H,100,60);
        let dispPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        scene.add(dispPlane);
        //paint();
     // }
   }
    
    paint = false;

    objectR.material.emissive.r = 1;
    objectL.material.emissive.r = 1;
    //object.rotation.y += 0.1;
    //object.position.set(0,0,0);
    intersectionsLeft.push( object );
    intersectionsRight.push( object );

    paintRayL.scale.z = leftInter.distance;
    paintRayR.scale.z = rightInter.distance;


  } else {

    paint = false;

    paintRayL.scale.z = 6;
    paintRayR.scale.z = 6;

  }

}


//  //********************************** // INTERSECT HEAD // ****************************************//
function intersectHead() {
  
  raycaster.setFromCamera( { x: 0, y: 0 }, camera );
  let intersects = raycaster.intersectObjects( user.children );
  
  if ( intersects.length > 0 ) {
    console.log('head action');
    if ( intersected != intersects[ 0 ].object ) {
      
      if ( intersected ) intersected.material.emissive.setHex( intersected.currentHex );
      
      intersected = intersects[ 0 ].object;
      intersected.currentHex = intersected.material.emissive.getHex();
      intersected.material.emissive.setHex( 0xff0000 );
      // intersected.rotation.y += 0.5;
      // intersected.position.z -= 0.1;
      // let handRay = event.getObjectByName( 'handRay' );
      if (intersected) {
        try {
          sock.send( "sendHaptics" );
        } catch( e ) {
          write( e );
        }
      }
    
    } else {
    
      if ( intersected ) intersected.material.emissive.setHex( intersected.currentHex );

        intersected = undefined;
    
    }
  
  }
}

//  //************************************ // CHECK ROOM // ******************************************//
function checkRoom() {
  
  for ( let i = 0; i < room.children.length; i ++ ) {
    
    let canTouch = room.children[ i ];

    if ( canTouch.position.x < - 2.5 || canTouch.position.x > 2.5 ) {
      
      canTouch.position.x = THREE.Math.clamp( canTouch.position.x, - 2.5, 2.5 );
      
    }  //** canTouch position x */
    
    if ( canTouch.position.y < - 2.5 || canTouch.position.y > 3 ) {
      
      canTouch.position.y = THREE.Math.clamp( canTouch.position.y, - 3, 3 );
      
    }  //** canTouch position y */
    
    if ( canTouch.position.z < - 2.5 || canTouch.position.z > 2.5 ) {
      
      canTouch.position.z = THREE.Math.clamp( canTouch.position.z, - 2.5, 2.5 );
      
    } //** canTouch position z */
    
  } 
}

function buildCreature() {
  this.position = new THREE.Vector3();
  this.velocity = new THREE.Vector3();
  this.acceleration = new THREE.Vector3();

  this.r = 1.2;
  this.maxspeed = 0.5;
  this.maxforce = 0.2;
  // this.max = 5;
  // this.min = -5
  this.max = new THREE.Vector3(0.01,0.01,0.01);
  this.min = new THREE.Vector3(-0.01,-0.01,-0.01); //-0.5,-0.5,-0.5

  // let geometry = new THREE.SphereGeometry(1,10,10);
  // let material = new THREE.MeshToonMaterial({ color: 0xffffff, opacity:0.5, transparent:true, wireframe:true, emissive: 0xffffff,emissiveIntensity:0.1} );
  let geometry = new THREE.SphereGeometry( 0.01, 0.02, 3 )
  let H = Math.random()*360;
  let material = new THREE.MeshLambertMaterial( { color: new THREE.Color("hsl(" + H + ", 100%, 80%)" ), transparent: true, opacity: 0.4 } );
  //    star.material.color = new THREE.Color("hsl(255, 100%, " + lightness + "%)");
  let boid = new THREE.Mesh( geometry , material );
  boids.add(boid);
  //flocks.add(boid);

  this.initialize = function() {
      this.position.x = getRandom(0.1,4); //5 - Math.random() * 5;
      this.position.y = getRandom(0.1,4); //5 - Math.random() * 5;
      this.position.z = getRandom(0.1,4); //5 - Math.random() * 5;
      this.velocity.x = 0.01;//getRandom(0.1,0.05);
      this.velocity.y = 0.01;//getRandom(0.1,0.05);
      this.velocity.z = 0.01;//getRandom(0.1,0.05);
      this.acceleration.x = 0.0;
      this.acceleration.y = 0.0;
      this.acceleration.z = 0.0;
      this.mass = 0.015;
      //console.log('Initialize', this.position);                    
  }

  this.flock = function(Creatures) {
      let sep = this.separate(Creatures);   // Separation
      let ali = this.align(Creatures);      // Alignment
      let coh = this.cohesion(Creatures);   // Cohesion

      //this.quaternion.multiplyQuaternions(coh);

      // Arbitrarily weight these forces
      sep.multiplyScalar(1.5); //1.5
      ali.multiplyScalar(1.3);
      coh.multiplyScalar(1);

      //let temp

      // Add the force vectors to acceleration
      this.applyForce(sep);
      this.applyForce(ali);
      this.applyForce(coh);
  };

  this.applyForce = function(force){
      //let tempForce = force.clone();
      let f = force.divideScalar(this.mass);
      this.acceleration.add(f);
  }

  this.separate = function(Creatures) {
      let desiredseparation = 3;
      let steer = new THREE.Vector3();
      let count = 0;
      // For every boid in the system, check if it's too close
      for (let i = 0; i < Creatures.length; i++) {
          let d = this.position.distanceTo(Creatures[i].position);
          // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
          if ((d > 0) && (d < desiredseparation)) {
              // Calculate vector pointing away from neighbor
              let pos = this.position.clone();
              let diff = pos.sub(Creatures[i].position);
              diff.normalize();
              diff.divideScalar(d);        // Weight by distance
              steer.add(diff);
              count++;            // Keep track of how many
          }
      }
      // Average -- divide by how many
      if (count > 0) {
          steer.divideScalar(count);
      }

      if (steer.length > 0){
          // Our desired vector is the average scaled to maximum speed
          steer.normalize();
          steer.multiplyScalar(this.maxspeed);
          // Implement Reynolds: Steering = Desired - Velocity
          steer.sub(this.velocity);
          //sum.limit(this.maxforce);
      }
      return steer;
  };

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  this.align = function(Creatures) {
      let neighbordist = 1;
      let alignsteer = new THREE.Vector3();
      let count = 0;
      for (let i = 0; i < Creatures.length; i++) {
          let d = this.position.distanceTo(Creatures[i].position);
          if ((d > 0) && (d < neighbordist)) {
          alignsteer.add(Creatures[i].velocity);
          count++;
          }
      }
      if (count > 0) {
          alignsteer.divideScalar(count);
          alignsteer.normalize();
          alignsteer.multiplyScalar(this.maxspeed);
          let steer = alignsteer.sub(this.velocity);
          //steer.limit(this.maxforce);
          return steer;
      } else {
          return new THREE.Vector3();   
      }
  };

  // Cohesion
  // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
  this.cohesion = function(Creatures) {
      let neighbordist = 2;
      let cohesionsteer = new THREE.Vector3();   
      let count = 0;
      for (let i = 0; i < Creatures.length; i++) {
          let d = this.position.distanceTo(Creatures[i].position);
          if ((d > 0) && (d < neighbordist)) {
              cohesionsteer.add(Creatures[i].position); // Add location
              count++;
          }
      }
      if (count > 0) {
          cohesionsteer.divideScalar(count);
          return this.seek(cohesionsteer);  // Steer towards the location
      } else {
          return new THREE.Vector3();
      }
  };

  this.seek = function(target) {
      let tgt = target.clone();
      let d = 0.2;    // deviation
      let wan = 1.2;
      let devAngle = Math.PI * 2 * Math.random();
      let dev = d * Math.sin( 0.5 * devAngle) 
      //this.position.multiplyScalar(dev);
      let desired = tgt.sub( this.position );  // A vector pointing from the location to the target

      // Normalize desired and scale to maximum speed
      desired.normalize();
      desired.multiplyScalar(this.maxspeed);
      des = desired.clone();
      // Steering = Desired minus velocity
      let steer = des.sub(this.velocity);
      //steer.multiplyScalar(wan);
      // steer.limit(this.maxforce);  // Limit to maximum steering force
      return steer;
  };

  this.update = function() {
      this.velocity.add(this.acceleration);
      this.velocity.clamp(this.min, this.max);
      this.position.add(this.velocity);
      this.acceleration.multiplyScalar(0);
      //console.log(`NEW Position: ${this.position}`);
  }

  this.display = function(){
      boid.position.x = this.position.x;
      boid.position.y = this.position.y;
      boid.position.z = this.position.z;
      //console.log(`BOID Position: ${boid.position}`);
  }

  this.checkEdges = function() {

    if (this.position.x > boundary){
        this.position.x = -boundary;
        //this.velocity.x *= -1;
        // console.log(this.velocity);
    }
    else if (this.position.x < -boundary){
        this.position.x = boundary;
        //this.velocity.x *= -1;
        // console.log('HIT');
    }

    if (this.position.y > boundary){
        this.position.y = -boundary;
        //this.velocity.y *= -1;
    }
    else if (this.position.y < -boundary){
        this.position.y = boundary;
        //this.velocity.y *= -1;
    }

    if (this.position.z > boundary){
        this.position.z = -boundary;
        //this.velocity.z *= -1;
    }
    else if (this.position.z < -boundary){
        this.position.z = boundary;
        //this.velocity.z *= -1;
    }                      
  }

  this.findUser = function(bump) {
    let d = this.position.distanceTo(bump.position);
    if ((d > 0) && (d < 1)) {
        try {
          sock.send( "sendHaptics_back" );
        } catch( e ) {
          write( e )
        }
     }

  }
}


//  //************************************************************************************************/ 
//  //************************************************************************************************/  UPDATE VR WORLD  //  //
//  //************************************************************************************************/ 

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

  renderer.setAnimationLoop( render );

}

function render() {
  
  //controls.update();

  try {
    sock.send( "getData" );
  } catch( e ) {
    write( e )
  }

  if ( !state ) return;

  // function resizeRendererToDisplaySize(renderer) {
  //   const canvas = renderer.domElement;
  //   const width = canvas.clientWidth;
  //   const height = canvas.clientHeight;
  //   const needResize = canvas.width !== width || canvas.height !== height;
  //   if (needResize) {
  //     renderer.setSize(width, height, false);
  //   }
  //   return needResize;
  // }

  // if (!renderer.vr.isPresenting() && resizeRendererToDisplaySize(renderer)) {
  //   const canvas = renderer.domElement;
  //   camera.aspect = canvas.clientWidth / canvas.clientHeight;
  //   camera.updateProjectionMatrix();
  // }


  //** grab glove info from endpointIDs */
	//** [0] SOURCE_FILTERED_DEFAULT - LH */
	//** [1] SOURCE_FILTERED_DEFAULT - RH */
	//** [2] SOURCE_DEVICEDATA - LH */
  //** [3] SOURCE_DEVICEDATA - RH */
  let deviceID = Object.keys( state.devices ).sort()[2]; // just to indicate we are streaming something
  let hand = state.devices[ deviceID ];
  state_div.innerText = JSON.stringify( hand, null, "  " );
  
  //** coordinate flip due to differences in definitions of wxyz order */ 
  getHandsL( Object.keys( state.devices ).sort()[2]); // left
  getHandsR( Object.keys( state.devices ).sort()[3]); // right

  //** manage intersections */
  cleanIntersected();
  
  getIntersections( leftWrist, rightWrist );
  //intersectObjectsL( leftWrist );


  //getIntersectionsR( rightWrist );
  //intersectObjectsR( rightWrist );

  //selectStart(handRay);
  //selectEnd(handRay);

  intersectHead();
  //checkRoom();
  
  //** 3D BOIDS */
  //checkBoids( boundary );

  //let delta = clock.getDelta();
  
  //let range = 3 - radius;
  //let range = 5 - radius;

  //scene.updateMatrixWorld();

  
  

  for (let k = 0; k < ret.length; k++) {
    let star = ret[k];
    star.rotation.x += 0.01*k/100;
    //star.rotation.y += 0.01/k;
    star.rotation.z += 0.01*k/100;
    lightness > 100 ? lightness = 0 : lightness+=0.4; //++
    //let material = new THREE.MeshLambertMaterial( { color: new THREE.Color("hsl(" + H + ", 100%, 80%)" ), transparency: true, opacity: 0.4 } );
    //   planeMaterial.color.setHSL(object.userData.H,object.userData.S,object.userData.L);
    //star.material.color = new THREE.Color("hsl( 255, 100%, " + lightness + "%)");
    star.material.color.setHSL(255, 100, lightness);
  } 
  


  let invertStage = new THREE.Matrix4()
  let temp = new THREE.Matrix4();
  let vrDisplay = renderer.vr.getDevice()
  if (vrDisplay) {
    temp.fromArray( vrDisplay.stageParameters.sittingToStandingTransform )
    //invertStage.getInverse( temp, true );
    //temp.getInverse( temp )
    //console.log(temp)
    //user.position.set(invertStage[12])
    user.position.fromArray(temp.elements, 12)
   // scene.position.fromArray(temp.elements, 12);
  } 

  for ( let k = 0; k < Creatures.length; k++ ) {
    // for ( let j = 0; j < Creatures.length; j++ ) {
    //   if ( k !== j ) {
    //     let force = Creatures[j].calculateAttraction(Creatures[k]);
    //     // console.log(force);
    //     Creatures[k].applyForce(force);
    //   }
    // }
    // let c = Creatures[k];
    // c.applyForce(gravity);
    // c.applyForce(wind);
    // c.update();
    // c.display();
    // c.checkEdges();
    // c.checkEdges();
    // c.flock(Creatures);
    // c.update();
    // c.display();
    Creatures[k].checkEdges();
    Creatures[k].flock(Creatures);
    Creatures[k].update();
    Creatures[k].display();        
    Creatures[k].findUser(user);    

  }

    boids.rotation.y += 0.002;
    boids.rotation.z += 0.001;
    boids.rotation.x += 0.002;

  renderer.render( scene, camera );

}