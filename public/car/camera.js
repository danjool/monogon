import * as THREE from 'three';

export class CameraController {
  constructor(camera, target) {
    this.camera = camera;
    this.target = target;
    this.lookAtOffset = new THREE.Vector3(0, 1, -8);
    console.log('CameraController created', target);
    this.setupChaseCam();
  }

  setupChaseCam() {
    this.chaseCam = new THREE.Object3D();
    this.chaseCamPivot = new THREE.Object3D();
    this.chaseCamPivot.position.set(0, 2, 8);
    this.chaseCam.add(this.chaseCamPivot);
    this.target.add(this.chaseCam);
  }

  update(wheelForwardVelocity, rightVelocity) {
    const forwardSpeed = Math.abs(wheelForwardVelocity);
    const dynamicOffset = this.lookAtOffset.clone();
    dynamicOffset.x += rightVelocity * 0.04 * forwardSpeed; 
    dynamicOffset.applyQuaternion(this.target.quaternion);
    
    // Update look-at target position
    const lookAtTarget = new THREE.Vector3();
    lookAtTarget.copy(this.target.position).add(dynamicOffset);
    
    // Update camera position
    const camPos = new THREE.Vector3();
    this.chaseCamPivot.getWorldPosition(camPos);
    if (camPos.y < 1) camPos.y = 1;
    this.camera.position.lerp(camPos, 0.05);
    this.camera.lookAt(lookAtTarget);
  }
}