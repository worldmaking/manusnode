
//  //************************************************************************************************// VARIABLES  //  //
//  //************************************************************************************************//
//  //************************************************************************************************//

const UNITVECTOR_X = new THREE.Vector3(1,0,0);
const UNITVECTOR_Y = new THREE.Vector3(0,1,0);
const UNITVECTOR_Z = new THREE.Vector3(0,0,1);

let log = document.getElementById( "log" );
let state_div = document.getElementById( "state" );
let msgs = [];

let container;
let camera, scene, renderer;
let controls, user, L, R, LH, LR; 

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
  new THREE.BoxGeometry( 0.01, 0.01, 0.01 ), // [3] joints, new THREE.BoxLineGeometry( 10, 10, 10, 10, 10, 10 ), // [6] room
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

// VR STUFF
let isInVR = false;
let vrDisplay, frameData;
let rightEye, leftEye;


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
 scene.background = new THREE.Color( 0x222222 );

 camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 50 );
 camera.position.set( 0, 1.6, 3 );

 // controls = new OrbitControls( camera, container );
 // controls.target.set( 0, 1.6, 0 );
 // controls.update();

 var geometry = new THREE.PlaneBufferGeometry( 4, 4 );
 var material = new THREE.MeshStandardMaterial( {
   color: 0x222222,
   roughness: 1.0,
   metalness: 0.0
 } );
 var floor = new THREE.Mesh( geometry, material );
 floor.rotation.x = - Math.PI / 2;
 scene.add( floor );

 var grid = new THREE.GridHelper( 10, 20, 0x111111, 0x111111 );
 // grid.material.depthTest = false; // avoid z-fighting
 scene.add( grid );

 scene.add( new THREE.HemisphereLight( 0x888877, 0x777788 ) );

 var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
 light.position.set( 0, 4, 0 );
 scene.add( light );

 user = new THREE.Group();
 user.name = "user"
 scene.add( user ); //room

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

  // //  ** add controllers | hands | trackers */
  // leftHandControl = renderer.vr.getController( 0 );
  // leftHandControl.addEventListener( 'selectstart', onSelectStart );
  // leftHandControl.addEventListener( 'selectend', onSelectEnd );
  // //scene.add( leftHandControl );

  // rightHandControl = renderer.vr.getController( 1 );
  // rightHandControl.addEventListener( 'selectstart', onSelectStart );
  // rightHandControl.addEventListener( 'selectend', onSelectEnd );
  // //scene.add( rightHandControl );

  // let lineRay = new THREE.Line( geometries[8]);//, materials[3] );
  // lineRay.name = 'handRay';
  // lineRay.scale.z = 1;

  // leftHandControl.add( lineRay.clone() ); // leftWrist
  // rightHandControl.add( lineRay.clone() ); // rightWrist


  // let lineL = new THREE.Line( geometries[8], materials[3] );
  // lineL.scale.z = -0.2;
  // lineL.name = 'leftRay';
  // leftWrist.add( lineL.clone() );

  // let lineR = new THREE.Line( geometries[8], materials[3] );
  // lineR.name = 'rightRay';
  // lineR.scale.z = -0.2;
  // rightWrist.add( lineR.clone() );

  // //scene.add( new THREE.AxesHelper( 1 ) );


  //** add event listeners  */
  window.addEventListener( 'resize', onWindowResize, false );
  // window.addEventListener('vrdisplayactivate', onVRRequestPresent, false);
	// window.addEventListener('vrdisplaydeactivate', onVRExitPresent, false);
  // window.addEventListener( 'vrdisplaypointerrestricted', onPointerRestricted, false );
  // window.addEventListener( 'vrdisplaypointerunrestricted', onPointerUnrestricted, false );

  try {
    sock = connect_to_server( {}, write );
  } catch ( e ) {
    console.error( e );
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

  try {
    sock.send( "getData" );
  } catch( e ) {
    write( e )
  }

  if ( !state ) return;

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

  renderer.render( scene, camera );

}