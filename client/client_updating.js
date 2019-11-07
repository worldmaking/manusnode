

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
let camera, scene, renderer, controls, user, L, R, LH, LR; 

let crosshair, 
    raycaster, 
    handRay, 
    intersected, 
    intersections = [];

let tempMatrix = new THREE.Matrix4();
let rotationMatrix = new THREE.Matrix4();
let leftWristQuat = new THREE.Quaternion();
let rightWristQuat = new THREE.Quaternion();

let rot90 = new THREE.Quaternion();

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
  new THREE.ConeGeometry( 0.01, 0.05, 32 ), // [0] boids //0.01 0.02
  new THREE.TorusGeometry( 0.03, 0.01, 16, 100 ), // [1] wrist
  new THREE.BoxGeometry( 0.06, 0.01, 0.07 ), // [2] palm
  new THREE.BoxGeometry( 0.01, 0.01, 0.01 ), // [3] joints
  new THREE.TorusGeometry( 0.01, 0.001, 16, 100 ), // [4] fingertips
  new THREE.RingBufferGeometry( 0.02, 0.04, 32 ), // [5] crosshair
  new THREE.BoxLineGeometry( 10, 10, 10, 10, 10, 10 ), // [6] room
  new THREE.PlaneBufferGeometry( 10, 10 ), // [7] floor
  new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] ) // [8] raycaster
];

let materials = [
  // [0] boids
  new THREE.MeshLambertMaterial( {
    color: 0x010101//0x191919 //0x9a799c
  } ),
  // [1] wrist, palm, joints
  new THREE.MeshStandardMaterial( {
    color: 0x883322 
  } ),
  // [2] fingertips 
  new THREE.MeshToonMaterial ( {
    color: 0x166d99
  } ),
  // [3] crosshair
  new THREE.MeshBasicMaterial( {
    color: 0xffffff,
    opacity: 1,
    transparent: true
  } ),
  // [4] room 
  new THREE.LineBasicMaterial( { 
    color: 0x808080
  } ),
  // [5] floor 
  new THREE.MeshStandardMaterial( {
    color: 0x202020,
    roughness: 1.0,
    metalness: 0.0
  } ) 
];

let state = null;

let sock;

//** 3D BOIDS */
let flock;
let radius = 0.2;
let clock = new THREE.Clock();
let boids = [];
let axis = new THREE.Vector3();
let radians;


// VR STUFF
let isInVR = false;
let vrDisplay, frameData;
let rightEye, leftEye;


let starTexture = new THREE.TextureLoader().load( "sparkle_cut.png" );
let stars = [];
let lightness = 0;
let rotSpeed = 0.01;


//  //************************************************************************************************// UPDATE WORLD FUNCTIONS //  //
//  //************************************************************************************************//
//  //************************************************************************************************//

function getRandom() {
  // source: https://stackoverflow.com/questions/13455042/random-number-between-negative-and-positive-value
  let num = Math.floor(Math.random()*10) + 1; // this will get a number between 1 and x;
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

function getHandsL( hands ) {
  h = state.devices[hands];
  //threeQuatFromManusQuat( leftWrist.quaternion, h.wristOrientation );
  for ( let i=0; i<5; i++ ) {
    for ( let j=0; j<3; j++ ) {
       threeQuatFromManusQuat( leftJoints[i][j].quaternion, h.jointOrientations, 20 * i + 4 *( j + 1 ) );
     }
   }
}

function getHandsR( hands ) {
  h = state.devices[hands];
  //threeQuatFromManusQuat( rightWrist.quaternion, h.wristOrientation );
  for ( let i=0; i<5; i++ ) {
    for ( let j=0; j<3; j++ ) {
        threeQuatFromManusQuat( rightJoints[i][j].quaternion, h.jointOrientations, 20 * i + 4 *( j + 1 ) );
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
            "trackers":[
            {
              "pos":{"0":0.9590294361114502,"1":1.911466121673584,"2":0.5492393970489502},
              "quat":{"0":-0.1990630030632019,"1":0.6774951219558716,"2":0.6710811257362366,"3":0.22588586807250977}
            },
            {
              "pos":{"0":1.086222529411316,"1":1.8866705894470215,"2":0.4619896411895752},
              "quat":{"0":-0.6431819200515747,"1":-0.2571682035923004,"2":-0.28171005845069885,"3":0.6639434695243835}
            }
            ]
          }
         }
        */
          let lh = obj.state.trackers[0];
          let rh = obj.state.trackers[1];

         // log(lh.pos[1])

          leftWrist.position.fromArray(lh.pos);
          rightWrist.position.fromArray(rh.pos);

          // apply 90 rot 
          // [sq(.5)]  [0]       [0]       [sq(.5)] //** +90 around X : CW    */
         

          rot90.set( Math.sqrt(0.5), 0, 0, Math.sqrt(0.5) );

          rot90.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), Math.PI / 2 );

          //leftWristQuat.fromArray(lh.quat);
         //rightWristQuat.fromArray(rh.quat);
          
          // L = leftWristQuat.angleTo(rot90)
          // R = leftWristQuat.angleTo(rot90)

          //  leftWristQuat.slerp(rot90, 1)
          // //rightWristQuat.slerp(rot90, 1)

          // leftWrist.quaternion.copy(leftWristQuat);
          // rightWrist.quaternion.copy(rightWristQuat);
          //leftWrist.quaternion.slerp( rot90, 1 );
          //rightWrist.quaternion.slerp( rot90, 1 );

          leftWrist.quaternion.fromArray(lh.quat);
          rightWrist.quaternion.fromArray(rh.quat);
          leftWrist.quaternion.multiplyQuaternions(leftWrist.quaternion, rot90);
          rightWrist.quaternion.multiplyQuaternions(rightWrist.quaternion, rot90);
          
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
    star.position.set( getRandom(), getRandom(), getRandom() );
    star.material.side = THREE.DoubleSide;
    stars.push( star );
  }
  
  for (let j = 0; j < stars.length; j++) {
    scene.add( stars[j] );
  }


  //gloves = new THREE.Group();
  //scene.add( gloves );

  
  user = new THREE.Group();
  user.name = "user"
  scene.add( user ); //room
  

  //** add camera */
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.04, 10 );

  //** camera crosshairs | for intersections and to orientate sightline */
  crosshair = new THREE.Mesh( geometries[5], materials[3] );
  //camera.add( crosshair );
  //crosshair.position.z = - 1; //** keep crosshair slightly infront of you at all times */
  //user.add( camera );
  scene.add( camera );
  //user.add( camera );

  // controls = new THREE.OrbitControls(camera);
  // camera.lookAt(0,  - .5, 0);

  let vec = new THREE.Vector3( 0, 0, -1 );
  vec.applyQuaternion( camera.quaternion );
  crosshair.position.copy( vec );

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
  room = new THREE.LineSegments( geometries[6], materials[4] );
  room.name = "room"
  room.position.set( 0, 0, 0 );
  //scene.add( room );
  
  //** add floor */
  //floor = new THREE.Mesh( geometries[7], materials[5] );
  floor = new THREE.Mesh( geometries[7],  materials[0] )
  floor.rotation.x = - Math.PI / 2;
  floor.name = "floor"
  floor.receiveShadow = true;
  floor.add( new THREE.PointLight( 0xff0040, 2, 50 ) );
  scene.add(floor)
  

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

  leftWrist.add( new THREE.AxesHelper( 0.05 ) );
  rightWrist.add( new THREE.AxesHelper( 0.05 ) );

  //************************************//
  //        LHS  Forward  RHS           //
  //         -     [-X]    -            //
  //       -| |-         -| |-          //
  //     -| | | |       | | | |-        //
  //    | |     | -   - |     | | Right //
  // +Z |  [+Y]   /   \         |  [-Z] //
  //     \       /     \       /        //
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

  // scene.add( leftWrist );
  // scene.add( rightWrist );
  // scene.add( wrist );

  let palm_length = -0.05;


  //** left fingertips */
  for ( let i=0; i<5; i++ ) {

    // joints
    let parent = leftWrist;
    leftJoints[i] = [];

    for ( let j=0; j<3; j++ ) {

      let joint = new THREE.Mesh( geometries[4], materials[2] );

      if ( i==0 ) {

        // thumb
        switch( j ) {

          case 0: joint.position.z = palm_length-0.02; joint.position.x = -0.04; break;
          case 1: joint.position.z = -0.025; break;
          case 2: joint.position.z = -0.02; break;
        
        } // 0.06

      } else {

        // fingers
        switch( j ) {

          case 0: joint.position.z = palm_length-0.05; joint.position.x = ( - 2.5 + i ) * 0.015; break;
          case 1: joint.position.z = -0.03; break;
          case 2: joint.position.z = -0.02; break;

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

      let joint = new THREE.Mesh( geometries[4], materials[2] );

      if ( i==0 ) {

        // thumb
        switch( j ) {

          case 0: joint.position.z = palm_length-0.02; joint.position.x = +0.04; break;
          case 1: joint.position.z = -0.025; break;
          case 2: joint.position.z = -0.02; break;
        
        } // 0.06

      } else {

        // fingers
        switch( j ) {

          case 0: joint.position.z = palm_length-0.05; joint.position.x = ( 2.5 - i ) *-0.015; break;
          case 1: joint.position.z = -0.03; break;
          case 2: joint.position.z = -0.02; break;

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

  let line = new THREE.Line( geometries[8] );
  line.name = 'handRay';
  line.scale.z = 1;

  leftHandControl.add( line.clone() );
  rightHandControl.add( line.clone() );

  //scene.add( new THREE.AxesHelper( 1 ) );


  //** add event listeners  */
  window.addEventListener( 'resize', onWindowResize, false );
  //window.addEventListener('vrdisplayactivate', onVRRequestPresent, false);
	//window.addEventListener('vrdisplaydeactivate', onVRExitPresent, false);
  // window.addEventListener( 'vrdisplaypointerrestricted', onPointerRestricted, false );
  // window.addEventListener( 'vrdisplaypointerunrestricted', onPointerUnrestricted, false );


  // //** 3D BOIDS */
  // flock = new THREE.Group();
  // room.add(flock);

  try {
    sock = connect_to_server( {}, write );
  } catch ( e ) {
    console.error( e );
  }

}


//  //************************************************************************************************// INTERSECTIONS  //  // 
//  //************************************************************************************************//
//  //************************************************************************************************//

//  //*************************************** // CLEAN // ********************************************//
function cleanIntersected() {

  while ( intersections.length ) {

    let object = intersections.pop();
    object.material.emissive.r = 0;

  }

}

//  //********************************** // SELECT START // ******************************************//
function onSelectStart( event ) {

  let handAction = event.target;
  let intersections = getIntersections( handAction );

  if ( intersections.length > 0 ) {

    let intersection = intersections[ 0 ];

    tempMatrix.getInverse( handAction.matrixWorld );

    let object = intersection.object;
    object.matrix.premultiply( tempMatrix );
    object.matrix.decompose( object.position, object.quaternion, object.scale );
    object.material.emissive.b = 1;
    handAction.add( object );

    handAction.userData.selected = object;

  }

}

//  //************************************ // SELECT END // ******************************************//
function onSelectEnd( event ) {

  let handAction = event.target;

  if ( handAction.userData.selected !== undefined ) {

    let object = handAction.userData.selected;
    object.matrix.premultiply( handAction.matrixWorld );
    object.matrix.decompose( object.position, object.quaternion, object.scale );
    object.material.emissive.b = 0;
    gloves.add( object );

    handAction.userData.selected = undefined;

  }


}

//  //******************************** // GET INTERSECTIONS // ***************************************//
function getIntersections( handAction ) {

  tempMatrix.identity().extractRotation( handAction.matrixWorld );

  raycaster.ray.origin.setFromMatrixPosition( handAction.matrixWorld );
  raycaster.ray.direction.set( 0, 0, -1 ).applyMatrix4( tempMatrix );

  return raycaster.intersectObjects( room.children );

}

//  //********************************* // INTERSECT OBJECT // ***************************************//
function intersectObjects( handAction ) {

  //* Do not highlight when already selected */

  if ( handAction.userData.selected !== undefined ) return;

  let handRay = handAction.getObjectByName( 'handRay' );
  let intersections = getIntersections( handAction );

  if ( intersections.length > 0 ) {

    let intersection = intersections[ 0 ];

    let object = intersection.object;
    object.material.emissive.r = 1;
    // object.rotation.y += 0.1;
    intersections.push( object );

    handRay.scale.z = intersection.distance;

  } else {

    handRay.scale.z = 5;

  }

}

//  //********************************** // INTERSECT HEAD // ****************************************//
function intersectHead() {
  
  raycaster.setFromCamera( { x: 0, y: 0 }, camera );
  let intersects = raycaster.intersectObjects( user.children );
  
  if ( intersects.length > 0 ) {
    
    if ( intersected != intersects[ 0 ].object ) {
      
      if ( intersected ) intersected.material.emissive.setHex( intersected.currentHex );
      
      intersected = intersects[ 0 ].object;
      intersected.currentHex = intersected.material.emissive.getHex();
      intersected.material.emissive.setHex( 0xff0000 );
      // intersected.rotation.y += 0.5;
      // intersected.position.z -= 0.1;

    }
    
  } else {
    
    if ( intersected ) intersected.material.emissive.setHex( intersected.currentHex );

    intersected = undefined;
    
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


//  //************************************************************************************************// 3D BOIDS //  //
//  //************************************************************************************************// 
//  //************************************************************************************************// 

// function checkBoids( range ) {
  
//   for ( let i = 0; i < flock.children.length; i ++ ) {

//     let object = flock.children[ i ];

//     if ( object.position.x < - range  || object.position.x > range  ) {

//       object.position.x = THREE.Math.clamp( object.position.x, - range, range );
//       object.userData.velocity.x = - object.userData.velocity.x;

//     }

//     if ( object.position.y < 0 || object.position.y > range ) {

//       object.position.y = THREE.Math.clamp( object.position.y, 0, range );
//       object.userData.velocity.y = - object.userData.velocity.y;

//     }

//     if ( object.position.z < - range || object.position.z > range ) {

//       object.position.z =  THREE.Math.clamp( object.position.z, - range, range );
//       object.userData.velocity.z = - object.userData.velocity.z;

//     }

//   }
  
// }


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
  //intersectObjects( leftHandControl );
  //intersectObjects( rightHandControl );
  intersectHead();
  //checkRoom();
  
  //** 3D BOIDS */
  //checkBoids( range );

  //let delta = clock.getDelta();
  
  //let range = 3 - radius;
  //let range = 5 - radius;

  //scene.updateMatrixWorld();
  
  for (let k = 0; k < stars.length; k++) {
    let star = stars[k];
    star.rotation.x += 0.01*k/100;
    star.rotation.y += 0.01*k/100;
    //star.rotation.z += 0.001*k;
    lightness > 100 ? lightness = 0 : lightness+=1; //++
    star.material.color = new THREE.Color("hsl(255, 100%, " + lightness + "%)");
  } 

  let invertStage = new THREE.Matrix4()
  let temp = new THREE.Matrix4();
  let vrDisplay = renderer.vr.getDevice()
  if (vrDisplay) {
    temp.fromArray( vrDisplay.stageParameters.sittingToStandingTransform )
   // invertStage.getInverse( temp, true );
    //temp.getInverse( temp )
    //console.log(temp)
    //user.position.set(invertStage[12])
    user.position.fromArray(temp.elements, 12)
   // scene.position.fromArray(temp.elements, 12);
  
  } 
  renderer.render( scene, camera );

}