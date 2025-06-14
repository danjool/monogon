export class CarpetCamera {
    constructor(THREE, carpet, carpetConfig, cameraConfig) {
        this.THREE = THREE;
        this.carpet = carpet;
        this.carpetConfig = carpetConfig;
        this.cameraConfig = cameraConfig;
        
        this.cameraYawOffset = 0; //Math.PI;
        this.cameraPitchOffset = .3;
        
        // For smooth following
        this.targetPosition = new THREE.Vector3();
        this.currentPosition = new THREE.Vector3();

        this.carpetCamera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            1.0, 
            carpetConfig.worldRadius.value * 2
        );
    }
    
    update(input) {
        const cameraDistance = this.cameraConfig.cameraDistance.value;
        const screenOffset = this.cameraConfig.screenOffset.value;
        
        // Update offsets with sensitivity scaling
        this.cameraYawOffset += input.cameraYaw * this.cameraConfig.gamepadCameraYawScale.value * this.cameraConfig.cameraYawSensitivity.value;
        this.cameraPitchOffset += input.cameraPitch * this.cameraConfig.gamepadCameraPitchScale.value * this.cameraConfig.cameraPitchSensitivity.value;
        
        // Get carpet's world matrix for transformations
        this.carpet.mesh.updateMatrixWorld(true);
        
        // Create camera offset in carpet's local space
        let localOffset = new this.THREE.Vector3(
            Math.sin(this.cameraYawOffset) * Math.cos(this.cameraPitchOffset) * cameraDistance,
            Math.sin(this.cameraPitchOffset) * cameraDistance,
            Math.cos(this.cameraYawOffset) * Math.cos(this.cameraPitchOffset) * cameraDistance
        );

        const carpetWorldPos = new this.THREE.Vector3();
        this.carpet.mesh.getWorldPosition(carpetWorldPos);

        // Add look ahead based on carpet's forward movement
        const lookAheadOffset = this.carpet.forward.clone().multiplyScalar(this.cameraConfig.lookAheadDistance.value);
        const lookAheadPos = carpetWorldPos.clone().add(lookAheadOffset);

        // Look at carpet + the screen offset as UP offset, UP as in towards the origin of the 3d scene
        const upScreenOffset = lookAheadPos.clone().negate().normalize().multiplyScalar(screenOffset);
        localOffset.add(upScreenOffset);
        
        // Transform offset from carpet's local space to world space
        localOffset.applyMatrix4(this.carpet.mesh.matrixWorld);
        
        // Apply follow smoothing
        this.targetPosition.copy(localOffset);
        if (this.currentPosition.length() === 0) {
            this.currentPosition.copy(this.targetPosition);
        } else {
            this.currentPosition.lerp(this.targetPosition, this.cameraConfig.followSmoothing.value);
        }
        this.carpetCamera.position.copy(this.currentPosition);
        
        const upVector = lookAheadPos.clone().normalize().negate();
        this.carpetCamera.up.copy(upVector);
        
        const lookat = lookAheadPos.clone().add(upScreenOffset);
        this.carpetCamera.lookAt(lookat);
        this.carpetCamera.updateProjectionMatrix();
    }
    
    reset() {
        this.cameraYawOffset = 0;
        this.cameraPitchOffset = 0;
    }
}