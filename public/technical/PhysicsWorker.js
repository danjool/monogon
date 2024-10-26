// PhysicsWorker.js
export class PhysicsWorker {
    constructor() {
      this.worker = this.createWorker();
      this.isAttracted = false;
    }
  
    createWorker() {
      const workerBlob = new Blob([`
        import * as CANNON from 'https://cdn.skypack.dev/cannon-es';
  
        const boxSize = 0.5;
        const N = 20;
        const bodies = [];
        const arbitraryFactor = 10.0;
        let originalPositions = [];
        let originalOrientations = [];
        let isAttracted = false;
        let t = 0.0;

        let targetPositions = [];
        const sidelinePosition = { x: -110, y: 1, z: 0 }; // Initial position off to the side
        const assemblyZonePosition = { x: 0, y: 1, z: 0 }; // Center of assembly zone
  
        const world = new CANNON.World();
        world.gravity.set(0, -9.82, 0);
        world.solver.iterations = 10;
        world.solver.tolerance = 0.001;
        
        const zones = [
          { size: 2 * arbitraryFactor, emojiCount: 0 },
          { size: 5 * arbitraryFactor, emojiCount: 1 },
          { size: 7 * arbitraryFactor, emojiCount: 2 },
          { size: 8 * arbitraryFactor, emojiCount: 4 },
        ];
        
        const zoneBodies = zones.map((zone, index) => {
          const zoneShape = new CANNON.Box(new CANNON.Vec3(zone.size/2, 0.1, zone.size/2));
          const zoneBody = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC });
          zoneBody.addShape(zoneShape);
          zoneBody.position.set(0, 0, 0);
          zoneBody.collisionResponse = false;
          world.addBody(zoneBody);
          return zoneBody;
        });
  
        function getEmojiCountForBody(body) {
          for (let i = 0; i < zoneBodies.length; i++) {
            if (checkBodyInZone(body, zoneBodies[i])) {
              return zones[i].emojiCount;
            }
          }
          return 0;
        }
  
        function checkBodyInZone(body, zoneBody) {
          const x = body.position.x;
          const z = body.position.z;
          if (x < zoneBody.shapes[0].halfExtents.x && x > -zoneBody.shapes[0].halfExtents.x &&
              z < zoneBody.shapes[0].halfExtents.z && z > -zoneBody.shapes[0].halfExtents.z) {
            return true;
          }
        }
  
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        world.addBody(groundBody);
  
        const boxShape = new CANNON.Box(new CANNON.Vec3(boxSize, boxSize, boxSize));
        for (let i = 0; i < N; i++) {
          const body = new CANNON.Body({ 
            mass: 1,
            linearDamping: 0.4,
            angularDamping: 0.4
          });
          body.addShape(boxShape);
          const position = new CANNON.Vec3(
            sidelinePosition.x,
            sidelinePosition.y,
            sidelinePosition.z + i * boxSize * 2,
          );
          body.position.copy(position);
          body.fixedRotation = true;
          
          // Initialize target positions at the same sideline location
          targetPositions[i] = position.clone();
          originalPositions[i] = position.clone();
          originalOrientations[i] = body.quaternion.clone();
          
          bodies.push(body);
          world.addBody(body);
        }
  
        function toggleAttraction() {
          isAttracted = !isAttracted;
          t = 0.0;
          for (let i = 0; i < bodies.length; i++) {
            const body = bodies[i];
            if (isAttracted) {
              body.mass = 0.1;
              body.fixedRotation = true;            
            } else {
              body.mass = 1;
              body.fixedRotation = false;
              body.applyForce(new CANNON.Vec3( // add some random force to make it more interesting, destruction, explosion, etc.
                (Math.random() - 0.5) * 1,
                Math.random() * 2.0,
                (Math.random() - 0.5) * 1
              ).scale(body.mass * 9.82 * .1 * (80. * boxSize - body.position.y)), body.position);
            }
          }
        }
  
        self.addEventListener('message', (event) => {
          if (event.data.action === 'updateTargetPositions') {
            const { newPositions } = event.data;
            targetPositions = newPositions.map(pos => new CANNON.Vec3(pos.x, pos.y, pos.z));
            // Update original positions for attraction physics
            originalPositions = targetPositions.map(pos => pos.clone());
          } 
          if (event.data.action === 'toggleAttraction') {
            toggleAttraction();
          } else if (event.data.action === 'teleportTo') {
            const { position } = event.data;
            for (let i = 0; i < bodies.length; i++) {
              const body = bodies[i];
              body.position.set(
                position[0], 
                position[1] + i * boxSize * 2. + boxSize, 
                position[2]
                );
              body.velocity.set(0, 0, 0);
              body.angularVelocity.set(0, 0, 0);
            }
          } else {
            t += 0.01;
            const { positions, quaternions, timeStep } = event.data;
  
            world.fixedStep(timeStep);
  
            if (isAttracted) {
              for (let i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                const targetPos = targetPositions[i];
                const positionDiff = targetPos.vsub(body.position);
                const positionStep = positionDiff.scale(0.05 * t);
                body.position.vadd(positionStep, body.position);
                
                const currentQuat = body.quaternion;
                currentQuat.slerp(originalOrientations[i], 0.1 * t, currentQuat);
                
                body.applyForce(
                  new CANNON.Vec3(0, 1, 0).scale(body.mass * 9.82 * 1.1),
                  body.position
                );
              }
            }
  
            for (let i = 0; i < bodies.length; i++) {
              const body = bodies[i];
              positions[i * 3 + 0] = body.position.x;
              positions[i * 3 + 1] = body.position.y;
              positions[i * 3 + 2] = body.position.z;
              quaternions[i * 4 + 0] = body.quaternion.x;
              quaternions[i * 4 + 1] = body.quaternion.y;
              quaternions[i * 4 + 2] = body.quaternion.z;
              quaternions[i * 4 + 3] = body.quaternion.w;
            }
  
            const emojiCounts = bodies.map(getEmojiCountForBody);
  
            self.postMessage(
              {
                positions,
                quaternions,
                isAttracted,
                emojiCounts
              },
              [positions.buffer, quaternions.buffer]
            );
          }
        });
      `], { type: 'text/javascript' });
  
      return new Worker(URL.createObjectURL(workerBlob), { type: 'module' });
    }
  
    update() {
      return new Promise((resolve) => {
        const positions = new Float32Array(20 * 3);
        const quaternions = new Float32Array(20 * 4);
  
        this.worker.postMessage(
          {
            timeStep: 1 / 60,
            positions,
            quaternions,
            isAttracted: this.isAttracted
          },
          [positions.buffer, quaternions.buffer]
        );
  
        this.worker.onmessage = (event) => {
          resolve(event.data);
        };
      });
    }
  
    toggleAttraction() {
      this.isAttracted = !this.isAttracted;
      this.worker.postMessage({ action: 'toggleAttraction' });
      this.worker.postMessage({ action: 'teleportTo', position: [0, 0, 0] });
    }

    updateTargetPositions(newPositions) {
      this.worker.postMessage({
        action: 'updateTargetPositions',
        newPositions: newPositions
      });
    }

    setToSideline() {
      const positions = [];
      for (let i = 0; i < 20; i++) {
        positions.push({
          x: -20,
          y: 1 + i * 1.2, // Stacked vertically with some spacing
          z: 0
        });
      }
      this.updateTargetPositions(positions);
    }
  
    setToAssemblyZoneRandom() {
      const positions = [];
      const spread = 1.8; // How far blocks can spread in assembly zone
      for (let i = 0; i < 20; i++) {
        positions.push({
          x: (Math.random() - 0.5) * spread,
          y: 1 + Math.random() * 2,
          z: (Math.random() - 0.5) * spread
        });
      }
      this.updateTargetPositions(positions);
    }
  
    setToStackedPosition() {
      const positions = [];
      for (let i = 0; i < 20; i++) {
        positions.push({
          x: 0,
          y: 1 + i * 1.1, // Stacked vertically with slight spacing
          z: 0
        });
      }
      this.updateTargetPositions(positions);
    }
  }