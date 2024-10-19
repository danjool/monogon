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
          const position = new CANNON.Vec3(0, i * boxSize * 2. + boxSize, 0);
          body.position.copy(position);
          body.fixedRotation = true;
          originalPositions.push(position.clone());
          originalOrientations.push(body.quaternion.clone());
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
              body.applyForce(new CANNON.Vec3(
                (Math.random() - 0.5) * 1,
                Math.random() * 2.0,
                (Math.random() - 0.5) * 1
              ).scale(body.mass * 9.82 * 1. * (80. * boxSize - body.position.y)), body.position);
            }
          }
        }
  
        self.addEventListener('message', (event) => {
          if (event.data.action === 'toggleAttraction') {
            toggleAttraction();
          } else {
            t += 0.01;
            const { positions, quaternions, timeStep } = event.data;
  
            world.fixedStep(timeStep);
  
            if (isAttracted) {
              for (let i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                const targetPos = originalPositions[i];
                const targetQuat = originalOrientations[i];
                
                const positionDiff = targetPos.vsub(body.position);
                const positionStep = positionDiff.scale(0.05 * t);
                body.position.vadd(positionStep, body.position);
  
                const currentQuat = body.quaternion;
                currentQuat.slerp(targetQuat, 0.1 * t, currentQuat);
  
                body.applyForce(new CANNON.Vec3(0, 1, 0).scale(body.mass * 9.82 * 1.1), body.position);
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
    }
  }