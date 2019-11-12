function Creature() {
  this.position = new THREE.Vector3();
  this.velocity = new THREE.Vector3();
  this.acceleration = new THREE.Vector3();

  this.r = 12;
  this.maxspeed = 1;
  this.maxforce = 0.2;

  var geometry = new THREE.SphereGeometry(1,10,10);
  var material = new THREE.MeshToonMaterial({ color: 0xffffff, opacity:0.5, transparent:true, wireframe:true, emissive: 0xffffff,emissiveIntensity:0.1} );
  var sphere = new THREE.Mesh(geometry, material);
  boid.add(sphere);

  this.initialise = function() {
      
      this.position.x = Math.random()*25;
      this.position.y = Math.random()*10;
      this.position.z = Math.random()*10;
      this.velocity.x = 0.1;
      this.velocity.y = 0.1;
      this.velocity.z = 0.1;
      this.acceleration.x = 0.0;
      this.acceleration.y = 0.0;
      this.acceleration.z = 0.0;
      this.mass = 1000;
      // console.log('Initialise', this.position);                    
  }

  this.flock = function(Creatures) {
      var sep = this.separate(Creatures);   // Separation
      var ali = this.align(Creatures);      // Alignment
      var coh = this.cohesion(Creatures);   // Cohesion
      // Arbitrarily weight these forces
      sep.multiplyScalar(1.5);
      ali.multiplyScalar(1.0);
      coh.multiplyScalar(1.0);
      // Add the force vectors to acceleration
      this.applyForce(sep);
      this.applyForce(ali);
      this.applyForce(coh);
  };


  this.applyForce = function(force){
      var f = force.divideScalar(this.mass);
      this.acceleration.add(f);
  }

  this.separate = function(Creatures) {
      var desiredseparation = 20;
      var steer = new THREE.Vector3();
      var count = 0;
      // For every boid in the system, check if it's too close
      for (var i = 0; i < Creatures.length; i++) {
          var d = this.position.distanceTo(Creatures[i].position);
          // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
          if ((d > 0) && (d < desiredseparation)) {
              // Calculate vector pointing away from neighbor
              var pos = this.position.clone();
              var diff = pos.sub(Creatures[i].position);
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
          // sum.limit(this.maxforce);
      }
      return steer;
  };

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  this.align = function(Creatures) {
      var neighbordist = 8;
      var alignsteer = new THREE.Vector3();
      var count = 0;
      for (var i = 0; i < Creatures.length; i++) {
          var d = this.position.distanceTo(Creatures[i].position);
          if ((d > 0) && (d < neighbordist)) {
          alignsteer.add(Creatures[i].velocity);
          count++;
          }
      }
      if (count > 0) {
          alignsteer.divideScalar(count);
          alignsteer.normalize();
          alignsteer.multiplyScalar(this.maxspeed);
          var steer = alignsteer.sub(this.velocity);
          // steer.limit(this.maxforce);
          return steer;
      } else {
          return new THREE.Vector3();   
      }
  };

  // Cohesion
  // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
  this.cohesion = function(Creatures) {
      var neighbordist = 3;
      var cohesionsteer = new THREE.Vector3();   
      var count = 0;
      for (var i = 0; i < Creatures.length; i++) {
          var d = this.position.distanceTo(Creatures[i].position);
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
      var tgt = target.clone();
      var desired = tgt.sub(this.position);  // A vector pointing from the location to the target

      // Normalize desired and scale to maximum speed
      desired.normalize();
      desired.multiplyScalar(this.maxspeed);
      des = desired.clone();
      // Steering = Desired minus velocity
      var steer = des.sub(this.velocity);
      // steer.limit(this.maxforce);  // Limit to maximum steering force
      return steer;
  };


  this.update = function() {
      
      this.velocity.add(this.acceleration);
      // this.velocity.clamp(this.min, this.max);
      this.position.add(this.velocity);
      this.acceleration.multiplyScalar(0);
      // console.log('Position', this.position);

  }

  this.display = function(){
      sphere.position.x = this.position.x;
      sphere.position.y = this.position.y;
      // console.log(sphere.position);

  }

  this.checkEdges = function() {
      if (this.position.x > 50){
          this.position.x = 50;
          this.velocity.x *= -1;
          // console.log(this.velocity);

      }
      else if (this.position.x < 0){
          this.position.x = 0;
          this.velocity.x *= -1;
          // console.log('HIT');

      }

      if (this.position.y > 50){
          this.position.y = 50;
          this.velocity.y *= -1;
      }
      else if (this.position.y < 0){
          this.position.y = 0;
          this.velocity.y *= -1;
      }     

      if (this.position.z > 50){
          this.position.z = 50;
          this.velocity.z *= -1;
      }
      else if (this.position.z < 0){
          this.position.z = 0;
          this.velocity.z *= -1;
      }                   

  }
}