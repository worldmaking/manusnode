

//  //  VARIABLES  //  //

let log = document.getElementById( "log" );
let state_div = document.getElementById( "state" );
let msgs = [];

let container;
let camera, scene, renderer;

let crosshair, 
    raycaster, 
    handRay, 
    intersected, 
    intersections = [];

let tempMatrix = new THREE.Matrix4();
let rotationMatrix = new THREE.Matrix4();
let leftWristMatrix = new THREE.Matrix4();
let rightWristMatrix = new THREE.Matrix4();

let tempQuaternion = new THREE.Quaternion();
let targetRotation = new THREE.Quaternion();

let group, room, floor;

let leftHand,
    leftHandControl, 
    rightHand,
    rightHandControl;

let leftWrist,
    leftJoints = [],
    rightWrist,
    rightJoints = [];

let geometries = [
  new THREE.ConeGeometry( 0.01, 0.02, 32 ), // [0] cone
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
  // [0] cone
  new THREE.MeshStandardMaterial( { 
    color: 0x00ff00 
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

//  // UPDATE WORLD FUNCTIONS //  //

function threeQuatFromManusQuat( q, arr, offset=0 ) {
  //** swap quaternion differences */
	//** Manus: [w] 			[x]v 			[y] 			[z]< */
	//** Three: [x]> 			[y] 			[z]v 			[w] */
  q.set( -arr[ offset + 3 ], -arr[ offset + 2 ], -arr[ offset + 1 ], arr[ offset + 0 ] )
}

function threeQuatFromManusQuat2(q, arr, offset=0) {
	q.set( arr[ offset + 3 ], arr[ offset + 2 ], arr[ offset + 1 ], arr[ offset + 0 ] )
}

function threeQuatFromManusQuat3(q, arr, offset=0) {
	q.set( -arr[ offset + 3 ], -arr[ offset + 2 ], arr[ offset + 1 ], -arr[ offset + 0 ] )
}

function threeQuatFromManusQuat4(q, arr, offset=0) {
	q.set( -arr[ offset + 3 ], arr[ offset + 2 ], arr[ offset + 1 ], arr[ offset + 0 ] )
}

function threeQuatFromManusQuat5(q, arr, offset=0) {
	q.set( -arr[ offset + 3 ], arr[ offset + 2 ], -arr[ offset + 1 ], arr[ offset + 0 ] )
}


function getHandsL( hand ) {
  
  h = state.devices[hand];
  threeQuatFromManusQuat( leftWrist.quaternion, h.wristOrientation );
  for ( let i=0; i<5; i++ ) {
    for ( let j=0; j<3; j++ ) {
      threeQuatFromManusQuat2( leftJoints[i][j].quaternion, h.jointOrientations, 20 * i + 4 *( j + 1 ) );
    }
  }

}

function getHandsR( hand ) {
  
  h = state.devices[hand];
  threeQuatFromManusQuat3( rightWrist.quaternion, h.wristOrientation );
  for ( let i=0; i<5; i++ ) {
    for ( let j=0; j<3; j++ ) {
      if ( i==0 ) {
        threeQuatFromManusQuat5( rightJoints[i][j].quaternion, h.jointOrientations, 20 * i + 4 *( j + 1 ) );
      } else {
        threeQuatFromManusQuat4( rightJoints[i][j].quaternion, h.jointOrientations, 20 * i + 4 *( j + 1 ) );
      }
    }
  }

}

//  //  FUNCTION CALLS  //  //

initialize();
animate();


//  //  SERVER CONNECT  //  //

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
				let obj
  
        try {
  
          obj = JSON.parse( msg );
  
        } catch( e ) {}
  
        if ( obj.cmd == "newData" ) {
  
          state = obj.state
  
        } else {
  
          //if (onmessage) onmessage(msg);
					//else 
  
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
			log( "websocket disconnected from " + addr );
  
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


//  //  INITIALIZATION  //  //  

function initialize() {
  
  //** setup */
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  let info = document.createElement( 'div' );
  info.style.position = 'absolute';
  info.style.top = '10px';
  info.style.width = '100%';
  info.style.textAlign = 'center';
  info.innerHTML = 'testing stuff';
  container.appendChild( info );

  //** add scene */
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x808080 );
  
  group = new THREE.Group();
  scene.add( group );
  
  //** add camera */
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.04, 10 );
  camera.position.set( 0, 1.6, 2 );
  //** camera crosshairs | for intersections and to orientate sightline */
  crosshair = new THREE.Mesh( geometries[5], materials[3]  );
  camera.add( crosshair );
  crosshair.position.z = - 1; //** keep crosshair slightly infront of you at all times */
  scene.add( camera );

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
  room.position.set( 0, 0, 0 );
  scene.add( room );
  
  //** add floor */
  
  floor = new THREE.Mesh( geometries[7], materials[5] );
  floor.rotation.x = - Math.PI / 2;
  floor.receiveShadow = true;
  scene.add( floor );
  
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
  
  //** geometry components for building VR hand models */

  let X = new THREE.Mesh( geometries[0],   new THREE.MeshStandardMaterial( { 
    color: 0xff0000 
  } ) );
  X.position.set( 1, 0, 0 );
  scene.add( X );
  let Y = new THREE.Mesh( geometries[0],   new THREE.MeshStandardMaterial( { 
    color: 0x00ff00 
  } ) );
  Y.position.set( 0, 1, 0 );
  scene.add( Y );
  let Z = new THREE.Mesh( geometries[0],   new THREE.MeshStandardMaterial( { 
    color: 0x0000ff 
  } ) );
  Z.position.set( 0, 0, 1 );
  scene.add( Z );


  //** wrist */
  leftWrist = new THREE.Mesh( geometries[1], materials[2] );
  rightWrist = new THREE.Mesh( geometries[1], materials[2] );
  
  leftWrist.add( new THREE.AxesHelper( 0.05 ) );
  rightWrist.add( new THREE.AxesHelper( 0.05 ) );

  leftWrist.position.set( 2, 1.5, -1.5 );
  rightWrist.position.set( 0.5, 1.5, -1 );
  
  leftWrist.MatrixAutoUpdate = true;
  rightWrist.MatrixAutoUpdate = true;

  group.add( leftWrist );
  group.add( rightWrist );
  // scene.add( wrist );

  // //** palm */
  // let palm = new THREE.Mesh( geometries[2], materials[1] );
  // palm.position.z = wrist.position.z + 0.035;
  // // wrist.add( palm );
  // let cone = new THREE.Mesh( geometries[0], materials[0] );
  // palm.add( cone );

  //** left fingertips */
  for ( let i=0; i<5; i++ ) {

    // joints
    let parent = leftWrist;
    leftJoints[i] = []

    for ( let j=0; j<3; j++ ) {

      let joint = new THREE.Mesh( geometries[4], materials[2] );

      if ( i==0 ) {

        // thumb
        switch( j ) {

          case 0: joint.position.z = -0.02; joint.position.x = +0.04; break;
          case 1: joint.position.z = -0.025; break;
          case 2: joint.position.z = -0.02; break;
        
        } // 0.06

      } else {

        // fingers
        switch( j ) {

          case 0: joint.position.z = -0.05; joint.position.x = ( 2.5 - i ) *+ 0.015; break;
          case 1: joint.position.z = -0.03; break;
          case 2: joint.position.z = -0.02; break;

        } // 0.115
      }

      parent.add( joint );
      parent = joint;
      leftJoints[i][j] = joint;
      
      joint.add( new THREE.AxesHelper( 0.02 ) );
    
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

          case 0: joint.position.z = -0.02; joint.position.x = 0.04; break;
          case 1: joint.position.z = -0.025; break;
          case 2: joint.position.z = -0.02; break;
        
        } // 0.06

      } else {

        // fingers
        switch( j ) {

          case 0: joint.position.z = -0.05; joint.position.x = ( 2.5 - i ) *+ 0.015; break;
          case 1: joint.position.z = -0.03; break;
          case 2: joint.position.z = -0.02; break;

        } // 0.115
      }

      parent.add( joint );
      parent = joint;
      rightJoints[i][j] = joint;
      
      joint.add( new THREE.AxesHelper( 0.02 ) );
    
    }
  }

  //** add controllers | hands | trackers */
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

  // leftHand.add( new THREE.AxesHelper( 0.05 ) );  
  // palm.add( new THREE.AxesHelper( 0.05 ) );
  scene.add( new THREE.AxesHelper( 1 ) );

  //** add event listeners  */
  // window.addEventListener( 'vrdisplaypointerrestricted', onPointerRestricted, false );
  // window.addEventListener( 'vrdisplaypointerunrestricted', onPointerUnrestricted, false );
  window.addEventListener( 'resize', onWindowResize, false );

  try {
    sock = connect_to_server( {}, write );
  } catch ( e ) {
    console.error( e );
  }

}


//  //  INTERSECTIONS  //  //

function cleanIntersected() {

  while ( intersections.length ) {

    let object = intersections.pop();
    object.material.emissive.r = 0;

  }

}

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

function onSelectEnd( event ) {

  let handAction = event.target;

  if ( handAction.userData.selected !== undefined ) {

    let object = handAction.userData.selected;
    object.matrix.premultiply( handAction.matrixWorld );
    object.matrix.decompose( object.position, object.quaternion, object.scale );
    object.material.emissive.b = 0;
    group.add( object );

    handAction.userData.selected = undefined;

  }


}

function getIntersections( handAction ) {

  tempMatrix.identity().extractRotation( handAction.matrixWorld );

  raycaster.ray.origin.setFromMatrixPosition( handAction.matrixWorld );
  raycaster.ray.direction.set( 0, 0, -1 ).applyMatrix4( tempMatrix );

  return raycaster.intersectObjects( group.children );

}

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

function intersectHead() {
  
  raycaster.setFromCamera( { x: 0, y: 0 }, camera );
  let intersects = raycaster.intersectObjects( group.children );
  
  if ( intersects.length > 0 ) {
    
    if ( intersected != intersects[ 0 ].object ) {
      
      if ( intersected ) intersected.material.emissive.setHex( intersected.currentHex );
      
      intersected = intersects[ 0 ].object;
      intersected.currentHex = intersected.material.emissive.getHex();
      intersected.material.emissive.setHex( 0xff0000 );
      intersected.rotation.y += 0.5;
      // intersected.position.z -= 0.1;

    }
    
  } else {
    
    if ( intersected ) intersected.material.emissive.setHex( intersected.currentHex );

    intersected = undefined;
    
  }
  
}

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


//  //  UPDATE VR WORLD  //  //

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
  let deviceID = Object.keys(state.devices).sort()[2];
  let hand = state.devices[deviceID];
  state_div.innerText = JSON.stringify(hand, null, "  ");
  
  //** coordinate flip due to differences in definitions of wxyz order */ 
  getHandsL( Object.keys(state.devices).sort()[2] );
  getHandsR( Object.keys(state.devices).sort()[3] );

  //** manage intersections */
  cleanIntersected();
  intersectObjects( leftHandControl );
  intersectObjects( rightHandControl );
  intersectHead();
  checkRoom();
  
  renderer.render( scene, camera );

}

