
export default class Creature extends THREE.Group {

  static MAX_SPEED = 5/1.2;
  static MAX_FORCE = .1;
  static separationDistance = 5;
  static cohesionDistance = 10;
  static alignmentDistance = 7;

  constructor( geometry = new THREE.ConeGeometry( 0.01, 0.02, 3 ) ) {

    super();

    this.for = new THREE.Vector3();
    this.acc = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    // this.pos = new THREE.Vector3();

    this.rot = new THREE.Euler();
    this.dir = new THREE.Vector3();
    
    this.col = new THREE.Vector3();
        
    this.agent = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
      color: new THREE.Color().setHSL( Math.random() * 0.7, 0.75, 0.75 )
    } ) );
    this.add( this.agent )

    this.sharkFlag = false;
    
  }

  update( boids ){

    //** separation */
    {

      for ( let i = 0; i < boids.length; i++ ) {

        let dist = this.position.distanceTo( boids[ i ].position )
        // debugger
        if ( dist > .0001 && dist < Creature.separationDistance * .5 && boids[i] != this ) {
  
          this.acc.sub(
            boids[i].position.clone().sub( this.position ).normalize()
            .multiplyScalar( Creature.MAX_SPEED )
            .sub( this.vel ).multiplyScalar( 1 )
          );

        }

      }

    }

    //** alignment */
    {

      let count = 0;
      let sum = new THREE.Vector3();
      
      for ( let i = 0; i < boids.length; i++ ) {

        let dist = this.position.distanceTo(  boids[i].position );
        if( dist > .0001 && dist < Creature.alignmentDistance && boids[i] != this ) {
          sum.add( boids[i].vel );
          ++count;
        }
      
      }

      if ( count > 0 ) {

        sum.divideScalar( count ).normalize();
        sum.multiplyScalar( Creature.MAX_SPEED );
        this.acc.add( sum.sub( this.vel ) );
      
      } 

    }

    //** cohesion */
    {

      let count = 0;
      let sum = new THREE.Vector3();
      
      for ( let i = 0; i < boids.length; i++ ) {
        
        let dist = this.position.distanceTo( boids[i].position );
        // this.mesh.position.angleTo(search[i].position) > Math.PI
        let d = this.sharkFlag ? Creature.cohesionDistance * 1 : Creature.cohesionDistance * 2;
        
        if ( dist > .0001 && dist < d && boids[i] != this ) {
        
          sum.add( boids[i].position );
          ++count;
        
        }
          
      }
     
      if ( count > 0 ) {
        
        sum.divideScalar( count );

        this.acc.add(
          sum.clone().sub( this.position ).normalize()
          .multiplyScalar( Creature.MAX_SPEED )
          .sub( this.vel ).multiplyScalar( 1 )
        )
      }
      
    }

    this.acc.clampLength( .01, Creature.MAX_FORCE )
    this.vel.clampLength( .01, Creature.MAX_SPEED )
   
    this.vel.add( this.acc );
    this.position.add( this.vel );
    this.acc.add(
      this.target.clone().sub( this.position ).normalize()
      .multiplyScalar( Creature.MAX_SPEED )
      .sub( this.vel ).multiplyScalar( 1 )
    );

    this.rot.setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3( 0, 1, 0 ), new THREE.Vector3( this.vel.x, this.vel.y, this.vel.z ).normalize() )
    );
    
    this.rotation.copy( new THREE.Euler( this.rot.x, this.rot.y, this.rot.z ) );
  
  };

};