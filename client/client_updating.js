

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
  new THREE.ConeGeometry( 0.1, 0.2, 32 ), // [0] boids //0.01 0.02
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
    color: 0x9a799c
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
let radius = 0.2;
let clock = new THREE.Clock();
let boids = [];
let axis = new THREE.Vector3();
let radians;

//  // UPDATE WORLD FUNCTIONS //  //

function quatFromNormal( n, q ) {
  q = q || new THREE.Quaternion();
  if ( n.y > 0.99999 ) {
    q.set( 0, 0, 0, 1);
  } else if ( n.y < -0.99999 ) {
    q.set( 1, 0, 0, 0 );
  } else {
    axis.set( n.z, 0, -n.x ).normalize();
    radians = Math.acos( n.y );
    q.setFromAxisAngle( axis, radians );
  }
}

function threeQuatFromManusQuat( q, arr, offset=0 ) {
  //** swap quaternion differences */
	//** Manus: [w] 			[x]v 			[y] 			[z]< */
	//** Three: [x]> 			[y] 			[z]v 			[w] */
  q.set( -arr[ offset + 3 ], -arr[ offset + 2 ], -arr[ offset + 1 ], arr[ offset + 0 ] );
}

function threeQuatFromManusQuat2(q, arr, offset=0) {
	q.set( arr[ offset + 3 ], arr[ offset + 2 ], arr[ offset + 1 ], arr[ offset + 0 ] );
}

function threeQuatFromManusQuat3(q, arr, offset=0) {
	q.set( -arr[ offset + 3 ], -arr[ offset + 2 ], arr[ offset + 1 ], -arr[ offset + 0 ] );
}

function threeQuatFromManusQuat4(q, arr, offset=0) {
	q.set( -arr[ offset + 3 ], arr[ offset + 2 ], arr[ offset + 1 ], arr[ offset + 0 ] );
}

function threeQuatFromManusQuat5(q, arr, offset=0) {
	q.set( -arr[ offset + 3 ], arr[ offset + 2 ], -arr[ offset + 1 ], arr[ offset + 0 ] );
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

{
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
  
  //** wrist */
  leftWrist = new THREE.Mesh( geometries[1], materials[2] );
  rightWrist = new THREE.Mesh( geometries[1], materials[2] );
  
  leftWrist.add( new THREE.AxesHelper( 0.05 ) );
  rightWrist.add( new THREE.AxesHelper( 0.05 ) );

  leftWrist.position.set( 0, 1.5, 0 );
  rightWrist.position.set( 0.5, 1.5, -1 );
  
  leftWrist.MatrixAutoUpdate = true;
  rightWrist.MatrixAutoUpdate = true;

  group.add( leftWrist );
  group.add( rightWrist );
  // scene.add( wrist );

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
}
  //** 3D BOIDS */
  flock = new THREE.Group();
  room.add(flock);

  for ( let i = 0; i < 100; i ++ ) {
    //let parent = leftWrist;
    boids[i] = [];

    let h = Math.random()*360 / 360;
    let s = Math.random();
    let l = Math.random();

    let mat = new THREE.MeshLambertMaterial( { color: 0xffffff } );
		mat.color.setHSL( h, s, l );

    let boid = new THREE.Mesh( geometries[0], mat );

    boid.position.x = 6 * Math.random() - 3;
    boid.position.y = 3 * Math.random() - 1.5;
    boid.position.z = 6 * Math.random() - 3;

    boid.userData.velocity = new THREE.Vector3();
    boid.userData.velocity.x = Math.random() - 0.5;
    boid.userData.velocity.y = Math.random() - 0.5;
    boid.userData.velocity.z = Math.random() - 0.5;

    boid.userData.acceleration = new THREE.Vector3();
    boid.userData.acceleration.x = 0;
    boid.userData.acceleration.y = 0;
    boid.userData.acceleration.z = 0;

    boid.userData.force = new THREE.Vector3();
    boid.userData.force.x = 0;
    boid.userData.force.y = 0;
    boid.userData.force.z = 0;
   
    boid.userData.size = 2 + Math.random() * 6;
    boid.userData.mass = Math.pow( boid.userData.size / 5 , 1.5 );
    
    //** orientation */
    // let A = new THREE.Vector3( 1, 1, 1, );
    // let B = boid.userData.velocity;
    // let normal = B.clone().sub(A).normalize();
    // let quaternion = quatFromNormal( normal );
    // boid.quaternion.copy( quaternion );
    
    boid.userData.state = 0;

    flock.add( boid );
    boids[i] = boid;

}

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

//  // 3D BOIDS //  //

function checkBoids( range ) {
  
  for ( let i = 0; i < flock.children.length; i ++ ) {

    let object = flock.children[ i ];

    if ( object.position.x < - range  || object.position.x > range  ) {

      object.position.x = THREE.Math.clamp( object.position.x, - range, range );
      object.userData.velocity.x = - object.userData.velocity.x;

    }

    if ( object.position.y < 0 || object.position.y > range ) {

      object.position.y = THREE.Math.clamp( object.position.y, 0, range );
      object.userData.velocity.y = - object.userData.velocity.y;

    }

    if ( object.position.z < - range || object.position.z > range ) {

      object.position.z =  THREE.Math.clamp( object.position.z, - range, range );
      object.userData.velocity.z = - object.userData.velocity.z;

    }

  }
  
}

// function applyForces( object ){

//   let forces = object;

//   // sense the enviornment
//   // decide what to do
//   // compute forces
  
//   // wander
//   let deviation_factor = 0.1;
//   let wander_factor = 0.8;
//   let separation_factor = 3;
//   let cohesion_factor = 0.03;
//   let alignment_factor = 0.1;
  
//   let separation_distance = 25;
//   let cohesion_distance = 50;
//   let alignment_distance = 40;

//   //let forward_unit_vector = forces.quaternion();

//   // compute a point that is in front of the agent
//   // but deviated from that by a small amount
//   // this point *is* the desired velocity
//   let deviation_angle = Math.PI * 2 * Math.random();
//   let desired_vel = new THREE.Vector3( forces.userData.position.x + deviation_factor * Math.sin( 0.5 * deviation_angle ), forces.userData.position.y + deviation_factor * Math.sin( 0.5 * deviation_angle ), forces.userData.position.z + deviation_factor * Math.sin( 0.5 * deviation_angle ) );

//   // turn that into force
//   desired_vel.sub( forces.userData.velocity );
//   // scale it down according to how influential it is:
//   desired_vel.multiplyScalar( wander_factor );
//   // include in our forces:
//   forces.userData.velocity.add( desired_vel );
  
//   // separation
//   let cohesion_count = 0;
//   let cohesion_subtotal = new THREE.Vector3();
//   let alignment_count = 0;
//   let alignment_subtotal = new THREE.Vector3();
  
//   // first a search is made to find other characters within the specified neighborhood. 
//   for (let b of boids) {
//     // skip self:
//     if ( forces == b ) continue;
   
//     // For each nearby character, 
//     // subtracting the positions of our character and the nearby character
//     let relative = new THREE.Vector3();
//     relative.subVectors( b.position, forces.position );
        
//     // get distance:
//     let distance = relative.length();
//     if ( distance < separation_distance ) {
//       // applying a 1/(r*r) weighting.
//       // also scale force:
//       relative.multiplyScalar( separation_factor / ( distance * distance ) );
//       // repulsive force therefore subtract rather than add:
//       forces.userData.force.sub( relative );
//     }
        
//     // // get relative angle between
//     // // forward_unit_vector, rel
//     // let relative = new THREE.Vector3();
//     // vec2.normalize(vec2.create(), rel);
//     // let dot = vec2.dot(reln, forward_unit_vector);
//     // // eyes on the back too:
//     // dot = Math.abs(dot);
    
//     // let rel_angle = Math.acos(dot);
//     // //let rel_angle = vec2.angle(rel, forward_unit_vector);
//     // if (rel_angle > Math.PI * 0.4) {
//     //   continue;
//     // }
    
//     // cohesion:
//     if ( distance < cohesion_distance ) {
//       // computing the “average position” (or “center of gravity”) of the nearby characters. 
//       // cohesion_subtotal = cohesion_subtotal + b.pos
//       cohesion_subtotal.add( b.position );
//       cohesion_count++;
//     }
//     // alignment
//     if ( distance < alignment_distance ) {
//       // averaging together the velocity of neighbours:
//       alignment_subtotal.add( b.userData.velocity );
//       alignment_count++;
//     }
    
//   } // end of all-nearby-agents loop
  
//   // cohesion
//   if ( cohesion_count > 0 ) {
//     forces.userData.state = 0;
//     // average_point = cohesion_subtotal / cohesion_count
//     //let average_colour = 0;
//     let average_point = new THREE.Vector3();
//     average_point.multiplyScalar( cohesion_subtotal / cohesion_count );
    
//     // this.colour = colour_subtotal / cohesion_count;
//     // if (cohesion_count > 5) {
//     //   this.state = 1; //change boid type
//     //   this.size = 3;
//     //   this.colour = 200;
//     // }
        
//     let desired_vel = new THREE.Vector3();
//     desired_vel.subVectors( average_point, forces.position );

//     // if (cohesion_count > 2) {
//     //   vec2.scale(desired_vel, desired_vel, -1);
//     // }
    
//     // turn that into force
//     let desired_acceleration = new THREE.Vector3();
//     desired_acceleration.subVectors( desired_vel, forces.userData.velocity );
//     // scale it down according to how influential it is:
//     desired_acceleration.multiplyScalar( cohesion_factor );
//     // include in our forces:
//     forces.userData.force.add( desired_acceleration );
//   } 
//   // alignment
//   if ( alignment_count > 0 ) {
//     // average_point = cohesion_subtotal / cohesion_count
//     let average_vel = new THREE.Vector3();
//     average_vel = alignment_subtotal.multiplyScalar( 1 / alignment_count );
        
//     let desired_vel = average_vel;
    
//     // turn that into force
//     let desired_acceleration = new THREE.Vector3();
//     desired_acceleration.subVectors( desired_vel, force.userData.velocity );
//     // scale it down according to how influential it is:
//     desired_acceleration.multiplyScalar( alignment_factor );
//     // include in our forces:
//     forces.userData.force.add( desired_acceleration );
//   }
// }


//  UPDATE VR WORLD  //  //

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
  //intersectObjects( leftHandControl );
  //intersectObjects( rightHandControl );
  intersectHead();
  //checkRoom();
  
  //** 3D BOIDS */
  let delta = clock.getDelta();
  let range = 5 - radius;

  checkBoids( range );

  for ( let i = 0; i < flock.children.length; i ++ ) {

    let object = flock.children[ i ];

    object.position.x += object.userData.velocity.x * delta + ( object.userData.acceleration.x * Math.pow(delta, 2) ) / 2;
    object.position.y += object.userData.velocity.y * delta + ( object.userData.acceleration.y * Math.pow(delta, 2) ) / 2;
    object.position.z += object.userData.velocity.z * delta + ( object.userData.acceleration.z * Math.pow(delta, 2) ) / 2;

    object.userData.velocity.x += object.userData.acceleration.x * delta / 2; 
    object.userData.velocity.y += object.userData.acceleration.y * delta / 2; 
    object.userData.velocity.z += object.userData.acceleration.z * delta / 2;

    // object.userData.force.x += 0.5 * 0.1 * ( object.userData.velocity.x * Math.abs(object.userData.velocity.x) )
    // object.userData.force.y += 0.5 * 0.1 * ( object.userData.velocity.y * Math.abs(object.userData.velocity.y) )
    // object.userData.force.z += 0.5 * 0.1 * ( object.userData.velocity.z * Math.abs(object.userData.velocity.z) )

    //applyForces( object );

    // let deviation_factor = 0.2;
    // let wander_factor = 1;
    // let separation_factor = 3;
    // let cohesion_factor = 0.03;
    // let alignment_factor = 0.01;
    
    // let separation_distance = 2;
    // let cohesion_distance = 5;
    // let alignment_distance = 4;

    // let deviation_angle = Math.PI * 2 * Math.random();
    // let desired_vel = new THREE.Vector3( object.position.x + deviation_factor * Math.sin( 0.5 * deviation_angle ), object.position.y + deviation_factor * Math.sin( 0.5 * deviation_angle ), object.position.z + deviation_factor * Math.sin( 0.5 * deviation_angle ) );

    // desired_vel.sub( object.userData.velocity );
    // desired_vel.multiplyScalar( wander_factor );
    // object.userData.velocity.add( desired_vel );
    
    // // separation
    // let cohesion_count = 0;
    // let cohesion_subtotal = new THREE.Vector3();
    // let alignment_count = 0;
    // let alignment_subtotal = new THREE.Vector3();

    // for (let b of boids) {
    //   // skip self:
    //   if ( object == b ) continue;

    //   let relative = new THREE.Vector3();
    //   relative.subVectors( b.position, object.position );
          
    //   // get distance:
    //   let distance = relative.length();
    //   if ( distance < separation_distance ) {
    //     relative.multiplyScalar( separation_factor / ( distance * distance ) );
    //     object.userData.force.sub( relative );
    //   }
      
    //   // cohesion:
    //   if ( distance < cohesion_distance ) {
    //     cohesion_subtotal.add( b.position );
    //     cohesion_count++;
    //   }
    //   // alignment
    //   if ( distance < alignment_distance ) {
    //     alignment_subtotal.add( b.userData.velocity );
    //     alignment_count++;
    //   }
      
    // } // end of all-nearby-agents loop
    
    // // cohesion
    // if ( cohesion_count > 0 ) {
    //   let average_point = new THREE.Vector3();
    //   average_point.multiplyScalar( cohesion_subtotal / cohesion_count );

    //   let desired_vel = new THREE.Vector3();
    //   desired_vel.subVectors( average_point, object.position );

    //   let desired_acceleration = new THREE.Vector3();
    //   desired_acceleration.subVectors( desired_vel, object.userData.velocity );
    //   desired_acceleration.multiplyScalar( cohesion_factor );
    //   object.userData.force.add( desired_acceleration );
    // } 
    // // alignment
    // if ( alignment_count > 0 ) {
    //   let average_vel = new THREE.Vector3();
    //   average_vel = alignment_subtotal.multiplyScalar( 1 / alignment_count );
          
    //   let desired_vel = average_vel;

    //   let desired_acceleration = new THREE.Vector3();
    //   desired_acceleration.subVectors( desired_vel, object.userData.velocity );
    //   desired_acceleration.multiplyScalar( alignment_factor );
    //   object.userData.force.add( desired_acceleration );
    // }

    object.userData.acceleration.x += object.userData.force.x / object.userData.mass;
    object.userData.acceleration.y += object.userData.force.y / object.userData.mass;
    object.userData.acceleration.z += object.userData.force.z / object.userData.mass;

    object.userData.force.x = 0;
    object.userData.force.y = 0;
    object.userData.force.z = 0;
    
    // object.userData.velocity.multiplyScalar( 0.05 );

    // object.position.x += object.userData.velocity.x; 
    // object.position.y += object.userData.velocity.y;
    // object.position.z += object.userData.velocity.z;

    // object.userData.velocity.multiplyScalar( 0.05 );

  

  }

  renderer.render( scene, camera );

}