import * as THREE from 'three';

export class OtherPlayer {
  constructor(scene, playerData) {
    this.scene = scene;
    this.playerId = playerData.id;
    this.playerName = playerData.name;
    
    // Create visual representation
    this.mesh = this.createCarpetMesh(playerData.carpetColor);
    this.mesh.scale.set(10, 10, 10); // Scale to match local player carpet size
    
    this.position = new THREE.Vector3().copy(playerData.position);
    this.orientation = { ...playerData.orientation };
    
    // Interpolation for smooth movement
    this.targetPosition = new THREE.Vector3().copy(this.position);
    this.targetOrientation = { ...this.orientation };
    
    // Set initial transform
    this.updateMeshTransform();
    this.scene.add(this.mesh);
    
    // Debug - AFTER this.mesh is created
    console.log('Added mesh to scene:', this.mesh.position, 'Color:', this.mesh.material.color.getHex());
    console.log(`Added other player: ${this.playerName}`);
}
  
  createCarpetMesh(color) {
    const geometry = new THREE.BoxGeometry(2, 0.1, 4);
    const material = new THREE.MeshBasicMaterial({ 
      color: color,
      transparent: true,
      opacity: 0.8 // Slightly transparent to distinguish from local player
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add a simple name label above the carpet
    this.createNameLabel(mesh);
    
    return mesh;
  }
  
  createNameLabel(carpetMesh) {
    // Create a simple text sprite for the player name
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = '24px monospace';
    context.textAlign = 'center';
    context.fillText(this.playerName, canvas.width / 2, canvas.height / 2 + 8);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.scale.set(8, 2, 1);
    sprite.position.set(0, 0, -3); // Above the carpet
    
    carpetMesh.add(sprite);
    this.nameSprite = sprite;
  }
  
  updateTransform(newPosition, newOrientation) {
    // Set targets for smooth interpolation
    this.targetPosition.copy(newPosition);
    this.targetOrientation = { ...newOrientation };
  }
  
  updateColor(newColor) {
    this.mesh.material.color.setHex(newColor);
  }
  
  // Call this in the animation loop for smooth interpolation
  update(deltaTime) {
    // Smooth interpolation to target position/orientation
    const lerpFactor = Math.min(1, deltaTime * 10); // Adjust speed as needed
    
    this.position.lerp(this.targetPosition, lerpFactor);
    
    // Interpolate orientation (simplified)
    if (this.targetOrientation.pitch !== undefined) {
      this.orientation.pitch = THREE.MathUtils.lerp(
        this.orientation.pitch, 
        this.targetOrientation.pitch, 
        lerpFactor
      );
    }
    
    if (this.targetOrientation.roll !== undefined) {
      this.orientation.roll = THREE.MathUtils.lerp(
        this.orientation.roll, 
        this.targetOrientation.roll, 
        lerpFactor
      );
    }
    
    // Update forward and right vectors
    if (this.targetOrientation.forward) {
      this.orientation.forward = {
        x: THREE.MathUtils.lerp(this.orientation.forward.x, this.targetOrientation.forward.x, lerpFactor),
        y: THREE.MathUtils.lerp(this.orientation.forward.y, this.targetOrientation.forward.y, lerpFactor),
        z: THREE.MathUtils.lerp(this.orientation.forward.z, this.targetOrientation.forward.z, lerpFactor)
      };
    }
    
    if (this.targetOrientation.right) {
      this.orientation.right = {
        x: THREE.MathUtils.lerp(this.orientation.right.x, this.targetOrientation.right.x, lerpFactor),
        y: THREE.MathUtils.lerp(this.orientation.right.y, this.targetOrientation.right.y, lerpFactor),
        z: THREE.MathUtils.lerp(this.orientation.right.z, this.targetOrientation.right.z, lerpFactor)
      };
    }
    
    this.updateMeshTransform();
  }
  
  updateMeshTransform() {
    this.mesh.position.copy(this.position);
    
    if (this.orientation.forward && this.orientation.right) {
      // Reconstruct orientation matrix from synced vectors
      const forward = new THREE.Vector3(
        this.orientation.forward.x,
        this.orientation.forward.y,
        this.orientation.forward.z
      );
      const right = new THREE.Vector3(
        this.orientation.right.x,
        this.orientation.right.y,
        this.orientation.right.z
      );
      const normal = new THREE.Vector3().crossVectors(right, forward);
      
      const matrix = new THREE.Matrix4().makeBasis(right, normal, forward.clone().negate());
      
      // Apply pitch and roll rotations
      const pitchQ = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0), 
        this.orientation.pitch || 0
      );
      const rollQ = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1), 
        this.orientation.roll || 0
      );
      
      const baseQ = new THREE.Quaternion().setFromRotationMatrix(matrix);
      const combinedQ = new THREE.Quaternion()
        .multiplyQuaternions(baseQ, rollQ)
        .multiply(pitchQ);
      
      this.mesh.quaternion.copy(combinedQ);
    }
    
    // Update matrix for emission point calculation
    this.mesh.updateMatrix();
    this.mesh.updateMatrixWorld(true);
  }
  
  getEmissionPoint() {
    // Calculate emission point for this other player's carpet (same as local carpet)
    const tailOffset = new THREE.Vector3(0, 0, 2); // Center of tail
    return tailOffset.clone().applyMatrix4(this.mesh.matrixWorld);
  }
  
  getEmissionVelocities() {
    // Calculate emission velocities based on this carpet's orientation
    const forward = new THREE.Vector3(
      this.orientation.forward.x,
      this.orientation.forward.y,
      this.orientation.forward.z
    );
    const backwardDir = forward.clone().negate();
    const speedFactor = 1000; // Assume similar speed for trail effects
    
    const rightVel = backwardDir.clone().multiplyScalar(speedFactor * 2.0)
      .add(new THREE.Vector3(0.1, 0, 0).multiplyScalar(speedFactor * 0.4));
      
    const leftVel = backwardDir.clone().multiplyScalar(speedFactor * 2.0)
      .add(new THREE.Vector3(-0.1, 0, 0).multiplyScalar(speedFactor * 0.4));
    
    return [rightVel, leftVel];
  }
  
  remove() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      
      if (this.nameSprite) {
        this.nameSprite.material.map.dispose();
        this.nameSprite.material.dispose();
      }
    }
  }
}