import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { params } from './config.js';

export class CarPhysics {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.wheelForwardVelocity = 0;
        this.rightVelocity = 0;
        this.thrusting = false;
        this.turning = false;
        this.keyMap = {};

        this.carMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 2),
            new THREE.MeshPhongMaterial({ color: 0xff0000 })
        );
        scene.add(this.carMesh);
        

        this.setupPhysicsBodies();
        this.setupVisualHelpers();
        this.setupControls();
    }

    setupControls() {
        console.log('setupControls', this.keyMap);
        document.addEventListener('keydown', (e) => this.keyMap[e.code] = true);
        document.addEventListener('keyup', (e) => {
            this.keyMap[e.code] = false
        });
    }

    setupPhysicsBodies() {
        this.carBody = new CANNON.Body({ mass: params.carMass });
        this.carBody.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 1)));
        this.carBody.position.set(0, 8, 0);
        this.world.addBody(this.carBody);

        this.wheelMeshes = [];
        this.wheelBodies = [];
        this.springs = [];
        this.hingeConstraints = [];
        this.setupWheels();
    }

    setupWheels() {
        const wheelPositions = [
            { x: -1, y: 3, z: -1 }, { x: 1, y: 3, z: -1 },
            { x: -1, y: 3, z: 1 }, { x: 1, y: 3, z: 1 }
        ];
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3);
        wheelGeometry.rotateZ(Math.PI / 2);
        const wheelMaterial3js = new THREE.MeshPhongMaterial({ color: 0x333333 });
        wheelPositions.forEach(pos => {
            const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial3js);
            wheelMesh.position.copy(pos);
            this.scene.add(wheelMesh);
            this.wheelMeshes.push(wheelMesh);

            const wheelBody = new CANNON.Body({ mass: params.wheelMass, material: this.wheelMaterial });
            wheelBody.addShape(new CANNON.Sphere(0.4));
            wheelBody.position.copy(pos);
            this.world.addBody(wheelBody);
            this.wheelBodies.push(wheelBody);

            const spring = new CANNON.Spring(this.carBody, wheelBody, {
                localAnchorA: new CANNON.Vec3(pos.x, -params.springLength, pos.z),
                localAnchorB: new CANNON.Vec3(0, 0, 0),
                restLength: params.springLength,
                stiffness: params.suspensionStiffness,
                damping: params.suspensionDamping
            });

            this.world.addEventListener('preStep', () => spring.applyForce());
            this.springs.push(spring);

            const hinge = new CANNON.HingeConstraint(this.carBody, wheelBody, {
                pivotA: new CANNON.Vec3(pos.x, -0.5, pos.z),
                axisA: new CANNON.Vec3(1, 0, 0),
                maxForce: 0.99
            });

            this.world.addConstraint(hinge);
            if (pos.z === 1) hinge.enableMotor();
            this.hingeConstraints.push(hinge);
        });
    }

  setupVisualHelpers() {
    this.forwardHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 4), new THREE.Vector3(), 1, 0x00ffff);
    this.forwardVelocityHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 4), new THREE.Vector3(), 1, 0xff00ff);
    this.lateralVelocityHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 4), new THREE.Vector3(), 1, 0xffff00);
    this.stabilizationForceHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 4), new THREE.Vector3(), 1, 0x00ff00);
    
    this.scene.add(this.forwardHelper);
    this.scene.add(this.forwardVelocityHelper);
    this.scene.add(this.lateralVelocityHelper);
    this.scene.add(this.stabilizationForceHelper);
  }

  handleInput() {
    this.thrusting = false;
    this.turning = false;

    if (this.keyMap['KeyW'] || this.keyMap['ArrowUp']) {
        if (this.wheelForwardVelocity < params.maxSpeed) 
        this.wheelForwardVelocity += params.acceleration;
        this.thrusting = true;
    }
    if (this.keyMap['KeyS'] || this.keyMap['ArrowDown']) {
        if (this.wheelForwardVelocity > -params.maxSpeed) 
        this.wheelForwardVelocity -= params.acceleration;
        this.thrusting = true;
    }
    if (this.keyMap['KeyA'] || this.keyMap['ArrowLeft']) {
        if (this.rightVelocity > -params.maxSteeringAngle) 
        this.rightVelocity -= params.steeringSpeed;
        this.turning = true;
    }
    if (this.keyMap['KeyD'] || this.keyMap['ArrowRight']) {
        if (this.rightVelocity < params.maxSteeringAngle) 
        this.rightVelocity += params.steeringSpeed;
        this.turning = true;
    }
    if (this.keyMap['Space']) {
        if (this.wheelForwardVelocity > 0) this.wheelForwardVelocity -= params.brakeTorque;
        if (this.wheelForwardVelocity < 0) this.wheelForwardVelocity += params.brakeTorque;
    }
  }

  applyLateralStabilization() {
    const forward = new CANNON.Vec3(0, 0, -1);
    this.carBody.quaternion.vmult(forward, forward);
    forward.normalize();
    
    const velocity = this.carBody.velocity;
    const forwardSpeed = forward.dot(velocity);
    const forwardVelocity = forward.scale(forwardSpeed);
    const lateralVelocity = new CANNON.Vec3();
    velocity.vsub(forwardVelocity, lateralVelocity);
    lateralVelocity.y = 0;
    
    this.updateHelpers(forward, forwardVelocity, lateralVelocity);
    
    const stabilizationForce = lateralVelocity.scale(-params.lateralStability * this.carBody.mass);
    this.carBody.applyForce(stabilizationForce, this.carBody.position);
  }

  updatePhysics() {
    if (!this.thrusting) {
        if (this.wheelForwardVelocity > 0) this.wheelForwardVelocity -= params.rollingResistance;
        if (this.wheelForwardVelocity < 0) this.wheelForwardVelocity += params.rollingResistance;
    }
    if (!this.turning) {
        if (this.rightVelocity > 0) this.rightVelocity -= params.steeringReturn;
        if (this.rightVelocity < 0) this.rightVelocity += params.steeringReturn;
    }

    this.hingeConstraints[2].setMotorSpeed(this.wheelForwardVelocity);
    this.hingeConstraints[3].setMotorSpeed(this.wheelForwardVelocity);
    this.hingeConstraints[0].axisA.z = this.rightVelocity;
    this.hingeConstraints[1].axisA.z = this.rightVelocity;
  }

  updateVisuals() {
    this.carMesh.position.copy(this.carBody.position);
    this.carMesh.quaternion.copy(this.carBody.quaternion);
    
    this.wheelMeshes.forEach((wheel, i) => {
        wheel.position.copy(this.wheelBodies[i].position);
        wheel.quaternion.copy(this.wheelBodies[i].quaternion);
    });
  }

  updateHelpers(forward, forwardVelocity, lateralVelocity) {
    const helpers = [
        { helper: this.forwardHelper, vector: forward, scale: 1 },
        { helper: this.forwardVelocityHelper, vector: forwardVelocity, scale: forwardVelocity.length() },
        { helper: this.lateralVelocityHelper, vector: lateralVelocity, scale: lateralVelocity.length() }
    ];

    helpers.forEach(({ helper, vector, scale }) => {
        helper.position.copy(this.carBody.position);
        helper.position.y += 1;
        if (vector.length() > 0.001) {
        helper.setDirection(new THREE.Vector3(vector.x, vector.y, vector.z).normalize());
        }
        helper.scale.set(scale, scale, scale);
    });
  }

  updateSprings() {
    console.log('updateSprings', params.suspensionStiffness, params.suspensionDamping, params.springLength);
    this.springs.forEach(spring => {
        spring.stiffness = params.suspensionStiffness;
        spring.damping = params.suspensionDamping;
        spring.restLength = params.springLength;
    });
  }

  update(delta) {
        this.handleInput();
        this.applyLateralStabilization();
        this.updatePhysics();
        this.updateVisuals();
  }
}
