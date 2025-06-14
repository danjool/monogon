class Carpet {
    constructor(threeInstance, config) {
        this.THREE = threeInstance;
        this.config = config;

        const { worldRadius, equilibriumAltitude, equilibriumSpeed } = this.config;

        this.position = new this.THREE.Vector3(0, 0, worldRadius.value - equilibriumAltitude.value);
        this.forward = new this.THREE.Vector3(0, -1, 0);
        this.right = new this.THREE.Vector3(1, 0, 0);
        this.normal = new this.THREE.Vector3(0, 0, -1);

        this.pitch = 0;
        this.pitchMomentum = 0;
        this.roll = 0;
        this.turnMomentum = 0;

        this.speed = equilibriumSpeed.value;
        this.currentAltitude = equilibriumAltitude.value;
        this.verticalSpeed = 0;
        this.lastVerticalSpeed = 0;
        this.verticalAcceleration = 0;
        this.horizontalSpeed = 0;

        this.surferParams = {
            footWidth: 0.9,
            kneeBend: 0.6,
            bendRange: 0.4,
            leftLegOffset: 0.0,
            rightLegOffset: 0.1,
            bendLag: 0.05,
            balanceX: 0.15,
            balanceZ: 0.1,
            leftLegAngle: -0.15,
            rightLegAngle: 0.15,
            hipTiltAmount: 0.8,
            spineCounter: 0.6,
            spineX1: 0.15,
            spineX2: 0.12,
            spineX3: 0.08,
            spineTwist: 0.1,
            armSpread: 0.8,
            armForward: 0.3,
            elbowBend: 0.4,
            handLevel: 0.7,
            headGaze: -1.22,
            headScan: 0.15,
            neckTilt: 0.2,
            neckBend: 0.15
        };

        // Skeleton parameters - realistic human proportions (using head as unit)
        this.skeletonParams = {
            legLength: 1.05,       // Total leg length (3.5 head lengths)
            torsoLength: 0.75,     // Torso (2.5 head lengths) 
            armLength: 0.825,      // Total arm length (2.75 head lengths)
            headSize: 0.3          // Head radius (1 head length diameter)
        };

        // Dynamic knee bend state with lag for each leg independently
        this.kneeBendState = {
            leftCurrent: 0.6,
            leftTarget: 0.6,
            rightCurrent: 0.6,
            rightTarget: 0.6,
            lagFactor: 0.05
        };

        this.mesh = this._createMesh();
        this.skeleton = {};
        this._createSkeleton();
        this.updateOrientation(); // Initial orientation
    }

    _createMesh(size = 1) {
        const carpetMesh = new this.THREE.Mesh(
            new this.THREE.BoxGeometry(2 * size, 0.1 * size, 4 * size),
            new this.THREE.MeshBasicMaterial({ color: 0xcc3366 })
        );
        carpetMesh.position.copy(this.position);
        return carpetMesh;
    }

    _createSkeleton() {
        // Create bone material
        const boneMaterial = new this.THREE.MeshLambertMaterial({ color: 0x22EEEE });
        const jointMaterial = new this.THREE.MeshLambertMaterial({ color: 0xFFAA00 });
        
        // ROOT: Positioned at center of carpet, rotated 90° to face forward (Z-axis)
        this.skeleton.root = new this.THREE.Group();
        this.skeleton.root.position.set(0, 0.05, 0); // Just above carpet surface
        this.skeleton.root.rotation.y = -Math.PI / 2; // 90° rotation so surfer faces carpet's Z-axis
        this.mesh.add(this.skeleton.root); // Attach to carpet so feet stay planted!
        
        // FEET: Planted wide on the carpet - realistic foot proportions
        const footGeometry = new this.THREE.BoxGeometry(0.3, 0.08, 0.1);
        
        // Left foot (planted on carpet)
        this.skeleton.leftFoot = new this.THREE.Mesh(footGeometry, boneMaterial);
        this.skeleton.leftFoot.position.set(-this.surferParams.footWidth/2, 0, 0);
        this.skeleton.leftFoot.castShadow = true;
        this.skeleton.root.add(this.skeleton.leftFoot);
        
        // Right foot (planted on carpet)
        this.skeleton.rightFoot = new this.THREE.Mesh(footGeometry, boneMaterial);
        this.skeleton.rightFoot.position.set(this.surferParams.footWidth/2, 0, 0);
        this.skeleton.rightFoot.castShadow = true;
        this.skeleton.root.add(this.skeleton.rightFoot);
        
        // LEFT LEG CHAIN (Forward Kinematics from planted foot)
        // Starts from wide foot position, angles inward toward narrow hips
        this.skeleton.leftLowerLeg = new this.THREE.Group();
        this.skeleton.leftLowerLeg.position.set(-this.surferParams.footWidth/2, 0.1, 0);
        this.skeleton.leftLowerLeg.rotation.z = this.surferParams.leftLegAngle;
        this.skeleton.root.add(this.skeleton.leftLowerLeg);
        
        const lowerLegGeometry = new this.THREE.CylinderGeometry(0.06, 0.06, this.skeletonParams.legLength * 0.5);
        const leftLowerLegMesh = new this.THREE.Mesh(lowerLegGeometry, boneMaterial);
        leftLowerLegMesh.position.y = this.skeletonParams.legLength * 0.25;
        leftLowerLegMesh.castShadow = true;
        this.skeleton.leftLowerLeg.add(leftLowerLegMesh);
        
        // Left knee joint
        this.skeleton.leftKnee = new this.THREE.Group();
        this.skeleton.leftKnee.position.y = this.skeletonParams.legLength * 0.5;
        this.skeleton.leftLowerLeg.add(this.skeleton.leftKnee);
        
        const kneeJoint = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.08), jointMaterial);
        kneeJoint.castShadow = true;
        this.skeleton.leftKnee.add(kneeJoint);
        
        // Left upper leg - continues angling inward
        const leftUpperLegMesh = new this.THREE.Mesh(lowerLegGeometry, boneMaterial);
        leftUpperLegMesh.position.y = this.skeletonParams.legLength * 0.25;
        leftUpperLegMesh.castShadow = true;
        this.skeleton.leftKnee.add(leftUpperLegMesh);
        
        // RIGHT LEG CHAIN (Forward Kinematics from planted foot)
        // Starts from wide foot position, angles inward toward narrow hips
        this.skeleton.rightLowerLeg = new this.THREE.Group();
        this.skeleton.rightLowerLeg.position.set(this.surferParams.footWidth/2, 0.1, 0);
        this.skeleton.rightLowerLeg.rotation.z = this.surferParams.rightLegAngle;
        this.skeleton.root.add(this.skeleton.rightLowerLeg);
        
        const rightLowerLegMesh = new this.THREE.Mesh(lowerLegGeometry, boneMaterial);
        rightLowerLegMesh.position.y = this.skeletonParams.legLength * 0.25;
        rightLowerLegMesh.castShadow = true;
        this.skeleton.rightLowerLeg.add(rightLowerLegMesh);
        
        // Right knee joint
        this.skeleton.rightKnee = new this.THREE.Group();
        this.skeleton.rightKnee.position.y = this.skeletonParams.legLength * 0.5;
        this.skeleton.rightLowerLeg.add(this.skeleton.rightKnee);
        
        const rightKneeJoint = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.08), jointMaterial);
        rightKneeJoint.castShadow = true;
        this.skeleton.rightKnee.add(rightKneeJoint);
        
        // Right upper leg - continues angling inward
        const rightUpperLegMesh = new this.THREE.Mesh(lowerLegGeometry, boneMaterial);
        rightUpperLegMesh.position.y = this.skeletonParams.legLength * 0.25;
        rightUpperLegMesh.castShadow = true;
        this.skeleton.rightKnee.add(rightUpperLegMesh);
        
        // DEBUG SPHERES - show actual thigh endpoints
        const debugMaterial = new this.THREE.MeshLambertMaterial({ color: 0x0066FF });
        
        // Left thigh endpoint debug sphere
        this.skeleton.leftThighEnd = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.05), debugMaterial);
        this.skeleton.leftThighEnd.position.y = this.skeletonParams.legLength * 0.5; // Top of thigh cylinder
        this.skeleton.leftKnee.add(this.skeleton.leftThighEnd);
        
        // Right thigh endpoint debug sphere  
        this.skeleton.rightThighEnd = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.05), debugMaterial);
        this.skeleton.rightThighEnd.position.y = this.skeletonParams.legLength * 0.5; // Top of thigh cylinder
        this.skeleton.rightKnee.add(this.skeleton.rightThighEnd);
        
        // HIP/PELVIS (positioned dynamically based on thigh endpoints)
        this.skeleton.hip = new this.THREE.Group();
        this.skeleton.hip.position.set(0, this.skeletonParams.legLength, 0); // Initial position, will be updated dynamically
        this.skeleton.root.add(this.skeleton.hip);
        
        const hipGeometry = new this.THREE.BoxGeometry(0.5, 0.2, 0.3); // More realistic hip width
        const hipMesh = new this.THREE.Mesh(hipGeometry, boneMaterial);
        hipMesh.castShadow = true;
        this.skeleton.hip.add(hipMesh);
        
        // THREE-SEGMENT SPINE (built up from hip)
        const spineSegmentLength = this.skeletonParams.torsoLength / 3;
        
        // Lower spine segment
        this.skeleton.lowerSpine = new this.THREE.Group();
        this.skeleton.lowerSpine.position.y = 0.15;
        this.skeleton.hip.add(this.skeleton.lowerSpine);
        
        const lowerSpineGeometry = new this.THREE.CylinderGeometry(0.10, 0.11, spineSegmentLength);
        const lowerSpineMesh = new this.THREE.Mesh(lowerSpineGeometry, boneMaterial);
        lowerSpineMesh.position.y = spineSegmentLength / 2;
        lowerSpineMesh.castShadow = true;
        this.skeleton.lowerSpine.add(lowerSpineMesh);
        
        // Middle spine segment
        this.skeleton.middleSpine = new this.THREE.Group();
        this.skeleton.middleSpine.position.y = spineSegmentLength;
        this.skeleton.lowerSpine.add(this.skeleton.middleSpine);
        
        const middleSpineGeometry = new this.THREE.CylinderGeometry(0.09, 0.10, spineSegmentLength);
        const middleSpineMesh = new this.THREE.Mesh(middleSpineGeometry, boneMaterial);
        middleSpineMesh.position.y = spineSegmentLength / 2;
        middleSpineMesh.castShadow = true;
        this.skeleton.middleSpine.add(middleSpineMesh);
        
        // Upper spine segment
        this.skeleton.upperSpine = new this.THREE.Group();
        this.skeleton.upperSpine.position.y = spineSegmentLength;
        this.skeleton.middleSpine.add(this.skeleton.upperSpine);
        
        const upperSpineGeometry = new this.THREE.CylinderGeometry(0.08, 0.09, spineSegmentLength);
        const upperSpineMesh = new this.THREE.Mesh(upperSpineGeometry, boneMaterial);
        upperSpineMesh.position.y = spineSegmentLength / 2;
        upperSpineMesh.castShadow = true;
        this.skeleton.upperSpine.add(upperSpineMesh);
        
        // SHOULDERS
        this.skeleton.shoulders = new this.THREE.Group();
        this.skeleton.shoulders.position.y = spineSegmentLength;
        this.skeleton.upperSpine.add(this.skeleton.shoulders);
        
        const shoulderGeometry = new this.THREE.BoxGeometry(0.7, 0.15, 0.25); // More realistic shoulder width
        const shoulderMesh = new this.THREE.Mesh(shoulderGeometry, boneMaterial);
        shoulderMesh.castShadow = true;
        this.skeleton.shoulders.add(shoulderMesh);
        
        // LEFT ARM CHAIN
        this.skeleton.leftShoulder = new this.THREE.Group();
        this.skeleton.leftShoulder.position.set(-0.35, 0, 0); // Adjusted for realistic shoulder width
        this.skeleton.shoulders.add(this.skeleton.leftShoulder);
        
        const upperArmGeometry = new this.THREE.CylinderGeometry(0.05, 0.05, 0.45); // Realistic upper arm
        const leftUpperArmMesh = new this.THREE.Mesh(upperArmGeometry, boneMaterial);
        leftUpperArmMesh.position.y = -0.225; // Half of upper arm length
        leftUpperArmMesh.castShadow = true;
        this.skeleton.leftShoulder.add(leftUpperArmMesh);
        
        this.skeleton.leftElbow = new this.THREE.Group();
        this.skeleton.leftElbow.position.y = -0.45;
        this.skeleton.leftShoulder.add(this.skeleton.leftElbow);
        
        const elbowJoint = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.06), jointMaterial);
        elbowJoint.castShadow = true;
        this.skeleton.leftElbow.add(elbowJoint);
        
        const forearmGeometry = new this.THREE.CylinderGeometry(0.04, 0.04, 0.375); // Realistic forearm
        const leftForearmMesh = new this.THREE.Mesh(forearmGeometry, boneMaterial);
        leftForearmMesh.position.y = -0.1875; // Half of forearm length
        leftForearmMesh.castShadow = true;
        this.skeleton.leftElbow.add(leftForearmMesh);
        
        // RIGHT ARM CHAIN
        this.skeleton.rightShoulder = new this.THREE.Group();
        this.skeleton.rightShoulder.position.set(0.35, 0, 0); // Adjusted for realistic shoulder width
        this.skeleton.shoulders.add(this.skeleton.rightShoulder);
        
        const rightUpperArmMesh = new this.THREE.Mesh(upperArmGeometry, boneMaterial);
        rightUpperArmMesh.position.y = -0.225;
        rightUpperArmMesh.castShadow = true;
        this.skeleton.rightShoulder.add(rightUpperArmMesh);
        
        this.skeleton.rightElbow = new this.THREE.Group();
        this.skeleton.rightElbow.position.y = -0.45;
        this.skeleton.rightShoulder.add(this.skeleton.rightElbow);
        
        const rightElbowJoint = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.06), jointMaterial);
        rightElbowJoint.castShadow = true;
        this.skeleton.rightElbow.add(rightElbowJoint);
        
        const rightForearmMesh = new this.THREE.Mesh(forearmGeometry, boneMaterial);
        rightForearmMesh.position.y = -0.1875;
        rightForearmMesh.castShadow = true;
        this.skeleton.rightElbow.add(rightForearmMesh);
        
        // LEFT WRIST AND HAND
        this.skeleton.leftWrist = new this.THREE.Group();
        this.skeleton.leftWrist.position.y = -0.375; // End of forearm
        this.skeleton.leftElbow.add(this.skeleton.leftWrist);
        
        // Left wrist joint
        const leftWristJoint = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.04), jointMaterial);
        leftWristJoint.castShadow = true;
        this.skeleton.leftWrist.add(leftWristJoint);
        
        // Left hand - offset from wrist, not glued to forearm end
        const handGeometry = new this.THREE.BoxGeometry(0.08, 0.25, 0.12);
        this.skeleton.leftHand = new this.THREE.Mesh(handGeometry, boneMaterial);
        this.skeleton.leftHand.position.set(0, -0.15, 0); // Offset down from wrist joint
        this.skeleton.leftHand.castShadow = true;
        this.skeleton.leftWrist.add(this.skeleton.leftHand);
        
        // RIGHT WRIST AND HAND
        this.skeleton.rightWrist = new this.THREE.Group();
        this.skeleton.rightWrist.position.y = -0.375; // End of forearm
        this.skeleton.rightElbow.add(this.skeleton.rightWrist);
        
        // Right wrist joint
        const rightWristJoint = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.04), jointMaterial);
        rightWristJoint.castShadow = true;
        this.skeleton.rightWrist.add(rightWristJoint);
        
        // Right hand - offset from wrist, not glued to forearm end
        this.skeleton.rightHand = new this.THREE.Mesh(handGeometry, boneMaterial);
        this.skeleton.rightHand.position.set(0, -0.15, 0); // Offset down from wrist joint
        this.skeleton.rightHand.castShadow = true;
        this.skeleton.rightWrist.add(this.skeleton.rightHand);
        
        // NECK
        this.skeleton.neck = new this.THREE.Group();
        this.skeleton.neck.position.y = 0.15;
        this.skeleton.shoulders.add(this.skeleton.neck);
        
        const neckGeometry = new this.THREE.CylinderGeometry(0.06, 0.06, 0.15);
        const neckMesh = new this.THREE.Mesh(neckGeometry, boneMaterial);
        neckMesh.position.y = 0.075;
        neckMesh.castShadow = true;
        this.skeleton.neck.add(neckMesh);
        
        // HEAD COMPOUND
        this.skeleton.head = new this.THREE.Group();
        this.skeleton.head.position.y = 0.15;
        this.skeleton.head.rotation.y = 0.3; // Default looking right (direction of travel)
        this.skeleton.neck.add(this.skeleton.head);
        
        // Main skull (sphere)
        const skullGeometry = new this.THREE.SphereGeometry(0.25); // Slightly smaller for realism
        const skullMesh = new this.THREE.Mesh(skullGeometry, boneMaterial);
        skullMesh.position.y = 0.05; // Raised slightly for jaw space
        skullMesh.castShadow = true;
        this.skeleton.head.add(skullMesh);
        
        // Jaw (box)
        const jawGeometry = new this.THREE.BoxGeometry(0.22, 0.15, 0.18);
        const jawMesh = new this.THREE.Mesh(jawGeometry, boneMaterial);
        jawMesh.position.y = -0.12; // Below skull
        jawMesh.castShadow = true;
        this.skeleton.head.add(jawMesh);
        
        // Small nose
        const noseGeometry = new this.THREE.BoxGeometry(0.04, 0.06, 0.08);
        const noseMesh = new this.THREE.Mesh(noseGeometry, boneMaterial);
        noseMesh.position.set(0, 0.02, 0.24); // Front of face
        noseMesh.castShadow = true;
        this.skeleton.head.add(noseMesh);
    }

    // ---- PHYSICS UPDATES ----

    updatePhysics(deltaTime, input) {
        // input: { pitch: number, turn: number }
        this._updatePitchPhysics(deltaTime, input);
        this._updateTurnPhysics(deltaTime, input);
        // Boost effects are handled by the simulator, as they modify config.equilibriumAltitude
        this._updatePosition(deltaTime);
        this._updateSpeedFromAltitude();
        this.updateOrientation(); // Update mesh orientation after physics
        this._animateSurfer(); // Animate surfer based on current carpet physics state
    }

    _updatePitchPhysics(deltaTime, input) {
        const dt = Math.max(0.001, Math.min(0.1, deltaTime));
        let pitchForce = 0;

        // Apply direct pitch input
        if (input.pitch !== 0) {
            this._pitchCarpet(input.pitch);
        } else {
            // counter vertical speed
            const verticalSpeedInfluence = this.verticalSpeed * this.config.verticalSpeedInfluence.value;
            pitchForce -= Math.sqrt(Math.abs(verticalSpeedInfluence))*Math.sign(this.verticalSpeed);
        }
        

        const speedFactor = Math.min(1, Math.abs(this.speed) / this.config.speedNormalization.value);

        const {
            pitchMomentumDamping,
            stallRecoveryForce,
            speedInfluenceOnPitch,
            maxPitchMomentum
        } = this.config;


        // Stall recovery when pitched up at low speeds
        // if (this.pitch > 0) {
        //     const stallFactor = Math.max(0, 1 - speedFactor * 2);
        //     pitchForce -= this.pitch * stallRecoveryForce.value * stallFactor;
        // }

        // Speed influence on pitch
        const speedPitchInfluence = speedInfluenceOnPitch.value * speedFactor;
        const targetPitch = this.config.targetPitchMultiplier.value * Math.min(1, speedFactor * .02);
        pitchForce += (targetPitch - this.pitch) * speedPitchInfluence;
        

        // Apply pitch momentum physics
        this.pitchMomentum *= Math.pow(pitchMomentumDamping.value, dt * 60);
        this.pitchMomentum += pitchForce * dt;

        // Clamp pitch momentum
        const maxMomentum = maxPitchMomentum.value;
        this.pitchMomentum = Math.max(-maxMomentum, Math.min(maxMomentum, this.pitchMomentum));

        // Apply pitch momentum to pitch angle
        this.pitch += this.pitchMomentum;

        // Clamp pitch angle
        const maxAngle = this.config.maxPitch.value * Math.PI / 180;
        this.pitch = Math.max(-maxAngle, Math.min(maxAngle, this.pitch));
    }

    _updateTurnPhysics(deltaTime, input) {
        const dt = Math.max(0.001, Math.min(0.1, deltaTime));
        const {
            turnMomentumDamping,
            maxTurnMomentum,
            rollFactor,
            maxRoll,
            rollRecoveryRate
        } = this.config;

        // Apply turn input to turn momentum
        if (input.turn !== 0) {
            this.turnMomentum += input.turn / (1.0 + Math.abs(this.speed) / this.config.speedNormalization.value);
        } else if (Math.abs(this.turnMomentum) > this.config.momentumThreshold.value) {
            // Damping is applied below, no need for specific zeroing here unless desired
        } else {
            this.turnMomentum = 0;
        }

        // Apply damping to turn momentum
        this.turnMomentum *= Math.pow(turnMomentumDamping.value, dt * 60);

        // Clamp turn momentum
        this.turnMomentum = Math.max(-maxTurnMomentum.value, Math.min(maxTurnMomentum.value, this.turnMomentum));

        // Apply turn momentum to orientation
        if (Math.abs(this.turnMomentum) > this.config.momentumThreshold.value * 0.2) {
            const q = new this.THREE.Quaternion().setFromAxisAngle(this.normal, this.turnMomentum);
            this.forward.applyQuaternion(q);
            this.right.applyQuaternion(q);
        }

        // Calculate target roll based on turn momentum
        const targetRoll = this.turnMomentum * rollFactor.value;

        // Smoothly transition to target roll
        this.roll = this.THREE.MathUtils.lerp(
            this.roll,
            targetRoll,
            1 - Math.pow(rollRecoveryRate.value, dt * 60)
        );

        // Clamp roll angle
        const maxRollRadians = maxRoll.value * Math.PI / 180;
        this.roll = Math.max(-maxRollRadians, Math.min(maxRollRadians, this.roll));
    }

    _updatePosition(deltaTime) {
        const { pitch, speed, position, forward } = this;

        // Calculate horizontal and vertical components of speed based on pitch
        const horizontalComponent = speed * Math.cos(pitch);
        const verticalComponent = speed * Math.sin(pitch);

        
        // Store current speeds for display/external use
        this.lastVerticalSpeed = this.verticalSpeed;
        this.verticalSpeed = verticalComponent;
        this.verticalAcceleration = (this.verticalSpeed - this.lastVerticalSpeed)
        this.horizontalSpeed = horizontalComponent;

        // Update altitude based on vertical speed
        this.currentAltitude = Math.max(1, this.currentAltitude + verticalComponent * deltaTime);

        // Set position based on altitude (distance from center)
        position.normalize().multiplyScalar(this.config.worldRadius.value - this.currentAltitude);

        // Move horizontally
        this.position.addScaledVector(forward, horizontalComponent * deltaTime);

        // Update mesh position
        this.mesh.position.copy(position);

        // Collision check is handled by the simulator
    }

    _pitchCarpet(angle) {
        const maxAngle = this.config.maxPitch.value * Math.PI / 180;
        this.pitch += angle / (1.0 + Math.abs(this.speed) / this.config.speedNormalization.value);
        this.pitch = Math.max(-maxAngle, Math.min(maxAngle, this.pitch));
    }

    _updateSpeedFromAltitude() {
        const relativeAltitude = this.config.equilibriumAltitude.value - this.currentAltitude;
        const speedSquared = Math.pow(this.config.equilibriumSpeed.value, 2) +
            2 * this.config.gravity.value * relativeAltitude;

        this.speed = Math.max(
            this.config.minSpeed.value,
            Math.min(
                this.config.maxSpeed.value*1000.,
                Math.sign(speedSquared) * Math.sqrt(Math.abs(speedSquared))
            )
        );
    }

    _animateSurfer() {
        // Direct mapping from carpet physics state (no axis swapping needed)
        const currentPitch = this.pitch*.1;       // Forward/back lean
        const currentRoll = this.roll*5.;         // Left/right lean  
        const currentHeight = this.currentAltitude*.01;
        const pitchVelocity = this.pitchMomentum*.01;   // Rate of pitch change
        const rollVelocity = this.turnMomentum*.01;     // Rate of roll change
        const verticalVelocity = this.verticalSpeed*.01; // Height change rate

        // CARPET-DRIVEN BALANCE SHIFTS - character reacts to carpet dynamics
        const balanceShiftX = (
            currentRoll * -0.5 + 
            rollVelocity * -2.0 +
            verticalVelocity * 0.3
        ) * this.surferParams.balanceX;
        
        const balanceShiftZ = (
            currentPitch * -0.4 +
            pitchVelocity * -1.5
        ) * this.surferParams.balanceZ;

        // FEET STAY PLANTED - update foot positions if width changed
        this.skeleton.leftFoot.position.x = -this.surferParams.footWidth / 2;
        this.skeleton.rightFoot.position.x = this.surferParams.footWidth / 2;
        this.skeleton.leftLowerLeg.position.x = -this.surferParams.footWidth / 2;
        this.skeleton.rightLowerLeg.position.x = this.surferParams.footWidth / 2;
        this.skeleton.leftLowerLeg.rotation.z = this.surferParams.leftLegAngle;
        this.skeleton.rightLowerLeg.rotation.z = this.surferParams.rightLegAngle;

        // DYNAMIC CARPET-DRIVEN KNEE BEND - character driven procedurally from carpet
        // Base knee bend driven by carpet height and vertical motion
        let baseTargetKneeBend = 
            this.surferParams.kneeBend +                    // Base crouch level
            currentHeight * -0.0004 +                       // Higher altitude = stand more, lower = crouch more (scaled for carpet altitude range)
            verticalVelocity * .1                          // Rising = anticipate by extending, falling = compress
            ;                  // Accelerating down = crouch more, up = extend more

        if(this.verticalAcceleration) baseTargetKneeBend += Math.abs(this.verticalAcceleration) * 0.07; // Accelerating down = crouch more, up = extend more

        // Individual leg responses to carpet roll (asymmetric loading)
        const leftLegRollResponse = currentRoll * 0.3;     // Left leg loads more when carpet rolls right
        const rightLegRollResponse = currentRoll * -0.3;   // Right leg loads more when carpet rolls left

        // Individual leg responses to carpet pitch (symmetric loading)  
        const legPitchResponse = Math.abs(currentPitch) * 0.2; // Both legs bend more with forward/back pitch

        // Final targets with all influences
        this.kneeBendState.leftTarget = baseTargetKneeBend + leftLegRollResponse + legPitchResponse + this.surferParams.leftLegOffset;
        this.kneeBendState.rightTarget = baseTargetKneeBend + rightLegRollResponse + legPitchResponse + this.surferParams.rightLegOffset;
        
        // Apply lag - smoothly transition current toward target for each leg
        this.kneeBendState.lagFactor = this.surferParams.bendLag;
        this.kneeBendState.leftCurrent += (this.kneeBendState.leftTarget - this.kneeBendState.leftCurrent) * this.kneeBendState.lagFactor;
        this.kneeBendState.rightCurrent += (this.kneeBendState.rightTarget - this.kneeBendState.rightCurrent) * this.kneeBendState.lagFactor;
        
        // Carpet-reactive micro-adjustments instead of time-based
        const leftKneeBend = Math.max(0.1, this.kneeBendState.leftCurrent + rollVelocity * 0.1);
        const rightKneeBend = Math.max(0.1, this.kneeBendState.rightCurrent - rollVelocity * 0.1);
        
        this.skeleton.leftKnee.rotation.x = -leftKneeBend;
        this.skeleton.rightKnee.rotation.x = -rightKneeBend;

        // CALCULATE WORLD POSITIONS OF THIGH ENDPOINTS (the debug spheres)
        // Update world matrices to get accurate positions
        this.skeleton.leftLowerLeg.updateMatrixWorld();
        this.skeleton.leftKnee.updateMatrixWorld(); 
        this.skeleton.leftThighEnd.updateMatrixWorld();
        
        this.skeleton.rightLowerLeg.updateMatrixWorld();
        this.skeleton.rightKnee.updateMatrixWorld();
        this.skeleton.rightThighEnd.updateMatrixWorld();
        
        // Get world positions of thigh endpoints
        const leftThighWorldPos = new this.THREE.Vector3();
        const rightThighWorldPos = new this.THREE.Vector3();
        this.skeleton.leftThighEnd.getWorldPosition(leftThighWorldPos);
        this.skeleton.rightThighEnd.getWorldPosition(rightThighWorldPos);
        
        // Convert world positions back to root coordinate space for hip placement
        const rootWorldMatrix = new this.THREE.Matrix4();
        this.skeleton.root.updateMatrixWorld();
        rootWorldMatrix.copy(this.skeleton.root.matrixWorld).invert();
        
        leftThighWorldPos.applyMatrix4(rootWorldMatrix);
        rightThighWorldPos.applyMatrix4(rootWorldMatrix);
        
        // POSITION HIP at exact midpoint between thigh endpoints
        const hipX = (leftThighWorldPos.x + rightThighWorldPos.x) / 2;
        const hipY = (leftThighWorldPos.y + rightThighWorldPos.y) / 2;
        const hipZ = (leftThighWorldPos.z + rightThighWorldPos.z) / 2;
        this.skeleton.hip.position.set(hipX, hipY, hipZ);
        
        // CALCULATE HIP TILT from actual thigh endpoint height difference
        const thighHeightDifference = rightThighWorldPos.y - leftThighWorldPos.y;
        const thighWidthDistance = rightThighWorldPos.x - leftThighWorldPos.x;
        const realHipTiltAngle = Math.atan2(thighHeightDifference, thighWidthDistance) * this.surferParams.hipTiltAmount;
        
        // Apply hip rotations
        this.skeleton.hip.rotation.x = (leftKneeBend + rightKneeBend) * 0.15;
        this.skeleton.hip.rotation.z = balanceShiftX * 0.8 + realHipTiltAngle;

        // THREE-SEGMENT SPINE - carpet-driven movement
        const spineBaseBalance = -currentRoll * 0.3; // Direct carpet roll response
        const hipTiltInfluence = realHipTiltAngle * 0.7;
        
        // Lower spine - most responsive to carpet dynamics
        const lowerSpineCounterTilt = -realHipTiltAngle * this.surferParams.spineCounter * 0.3;
        this.skeleton.lowerSpine.rotation.z = spineBaseBalance + hipTiltInfluence + lowerSpineCounterTilt;
        this.skeleton.lowerSpine.rotation.x = currentPitch * this.surferParams.spineX1 + pitchVelocity * this.surferParams.spineX1 * 2.0; // Forward/back response to carpet pitch
        this.skeleton.lowerSpine.rotation.y = currentRoll * this.surferParams.spineTwist + rollVelocity * this.surferParams.spineTwist * 1.5; // Twist response to carpet roll
        
        // Middle spine - moderate response, transitional
        const middleSpineBalance = spineBaseBalance * 0.7;
        const middleSpineCounterTilt = -realHipTiltAngle * this.surferParams.spineCounter * 0.5;
        this.skeleton.middleSpine.rotation.z = middleSpineBalance + hipTiltInfluence * 0.5 + middleSpineCounterTilt;
        this.skeleton.middleSpine.rotation.x = currentPitch * this.surferParams.spineX2 * 0.8 + pitchVelocity * this.surferParams.spineX2 * 1.5; // Reduced pitch response
        this.skeleton.middleSpine.rotation.y = currentRoll * this.surferParams.spineTwist * 0.6 + rollVelocity * this.surferParams.spineTwist * 1.0; // Reduced twist response
        
        // Upper spine - focused on head stability, minimal carpet response
        const upperSpineBalance = spineBaseBalance * 0.4;
        const upperSpineCounterTilt = -realHipTiltAngle * this.surferParams.spineCounter * 0.8;
        this.skeleton.upperSpine.rotation.z = upperSpineBalance + hipTiltInfluence * 0.2 + upperSpineCounterTilt;
        this.skeleton.upperSpine.rotation.x = currentPitch * this.surferParams.spineX3 * 0.5 + verticalVelocity * this.surferParams.spineX3; // Minimal pitch + height anticipation
        this.skeleton.upperSpine.rotation.y = currentRoll * this.surferParams.spineTwist * 0.3 + rollVelocity * this.surferParams.spineTwist * 0.5; // Minimal twist for head tracking

        // ARMS - carpet-driven balance movements
        const finalUpperSpineBalance = upperSpineBalance + hipTiltInfluence * 0.2 + upperSpineCounterTilt;
        const armBalanceLeft = finalUpperSpineBalance * -this.surferParams.armSpread + rollVelocity * 0.3;
        const armBalanceRight = finalUpperSpineBalance * -this.surferParams.armSpread + rollVelocity * -0.3;
        
        // Left arm positioning - extend out to left side
        this.skeleton.leftShoulder.rotation.z = -this.surferParams.armSpread + armBalanceLeft;
        this.skeleton.leftShoulder.rotation.x = this.surferParams.armForward + currentPitch * 0.2; // Forward response to carpet pitch
        this.skeleton.leftElbow.rotation.x = -this.surferParams.elbowBend + pitchVelocity * 0.3; // Elbow response to pitch velocity
        
        // Right arm positioning - extend out to right side
        this.skeleton.rightShoulder.rotation.z = this.surferParams.armSpread + armBalanceRight;
        this.skeleton.rightShoulder.rotation.x = this.surferParams.armForward + currentPitch * 0.2; // Forward response to carpet pitch
        this.skeleton.rightElbow.rotation.x = -this.surferParams.elbowBend + pitchVelocity * 0.3; // Elbow response to pitch velocity

        // WRIST ANIMATION - keep hands level with carpet
        const carpetRollInfluence = currentRoll * this.surferParams.handLevel;
        const carpetPitchInfluence = currentPitch * this.surferParams.handLevel * 0.5;
        
        // Left wrist - counter-rotate to maintain level with carpet
        const leftArmTotalTilt = this.skeleton.leftShoulder.rotation.z + finalUpperSpineBalance * 0.3;
        this.skeleton.leftWrist.rotation.z = -leftArmTotalTilt * this.surferParams.handLevel + carpetRollInfluence;
        this.skeleton.leftWrist.rotation.x = -this.skeleton.leftShoulder.rotation.x * this.surferParams.handLevel + carpetPitchInfluence;
        this.skeleton.leftWrist.rotation.y = rollVelocity * 0.1; // Natural movement based on carpet roll velocity
        
        // Right wrist - counter-rotate to maintain level with carpet  
        const rightArmTotalTilt = this.skeleton.rightShoulder.rotation.z + finalUpperSpineBalance * 0.3;
        this.skeleton.rightWrist.rotation.z = -rightArmTotalTilt * this.surferParams.handLevel + carpetRollInfluence;
        this.skeleton.rightWrist.rotation.x = -this.skeleton.rightShoulder.rotation.x * this.surferParams.handLevel + carpetPitchInfluence;
        this.skeleton.rightWrist.rotation.y = rollVelocity * -0.1; // Natural movement based on carpet roll velocity

        // NECK - carpet-driven movement for balance and looking
        const neckScan = currentRoll * this.surferParams.headScan * 0.5; // Scan based on carpet roll
        const neckTiltAmount = rollVelocity * this.surferParams.neckTilt; // Tilt response to carpet roll velocity
        const neckBendAmount = currentPitch * this.surferParams.neckBend + pitchVelocity * this.surferParams.neckBend; // Bend response to carpet pitch
        
        this.skeleton.neck.rotation.y = this.surferParams.headGaze + neckScan;
        this.skeleton.neck.rotation.z = neckTiltAmount - finalUpperSpineBalance * 0.4;
        this.skeleton.neck.rotation.x = neckBendAmount;

        // HEAD - subtle movement on top of neck movement, also carpet-driven
        this.skeleton.head.rotation.y = -0.3 + rollVelocity * 0.2; // Track roll changes
        this.skeleton.head.rotation.x = verticalVelocity * 0.1; // Anticipate height changes
        this.skeleton.head.rotation.z = -neckTiltAmount * 0.3;

        // SHOULDERS - carpet-driven counter-rotation for natural movement
        this.skeleton.shoulders.rotation.z = -finalUpperSpineBalance * 0.2;
        this.skeleton.shoulders.rotation.y = rollVelocity * 0.1; // Respond to carpet roll changes
    }

    // ---- EMISSION POINT FOR TRAIL EFFECTS ----

    getEmissionPoint() {
        // Single emission point at center of tail
        const tailPipe = new this.THREE.Vector3(0, 0, 2); // Center of tail
        // Transform to world space
        const worldPos = tailPipe.clone().applyMatrix4(this.mesh.matrixWorld);
        return worldPos;
    }
    
    getEmissionVelocities() {
        // Get carpet's backward direction as initial velocity direction
        const backwardDir = this.forward.clone().negate();
        
        // Scale by speed with a much higher multiplier for more dramatic effect
        const speedFactor = this.speed * 2.0; // Dramatically increased from 0.01
        
        // Add some variation to left and right tailpipes
        const rightVel = backwardDir.clone().multiplyScalar(speedFactor)
            .add(new this.THREE.Vector3(0.1, 0, 0).multiplyScalar(speedFactor * 0.2));
            
        const leftVel = backwardDir.clone().multiplyScalar(speedFactor)
            .add(new this.THREE.Vector3(-0.1, 0, 0).multiplyScalar(speedFactor * 0.2));
        
        // return [rightVel, leftVel];
        return [0., 0.,]
    }

    // ---- ORIENTATION & RESET ----

    updateOrientation() {
        // Recalculate orientation vectors based on position
        this.normal.copy(this.position).normalize().negate(); // Points inward (up)
        // Ensure forward and right are orthogonal to normal and each other
        this.forward.crossVectors(this.normal, this.right).normalize();
        this.right.crossVectors(this.forward, this.normal).normalize();

        // Update mesh quaternion
        if (this.mesh) {
            const baseMatrix = new this.THREE.Matrix4().makeBasis(
                this.right, this.normal, this.forward.clone().negate() // Z is backward
            );
            const baseQuaternion = new this.THREE.Quaternion().setFromRotationMatrix(baseMatrix);

            const pitchQ = new this.THREE.Quaternion().setFromAxisAngle(
                new this.THREE.Vector3(1, 0, 0), // Pitch around local X (right vector)
                this.pitch
            );

            const rollQ = new this.THREE.Quaternion().setFromAxisAngle(
                new this.THREE.Vector3(0, 0, 1), // Roll around local Z (forward vector)
                this.roll
            );
            
            // Apply pitch and roll relative to the carpet's local axes
            // Order: Base orientation, then roll, then pitch
            const combinedQ = new this.THREE.Quaternion()
                .multiplyQuaternions(baseQuaternion, rollQ) // Apply roll first to the base
                .multiply(pitchQ); // Then apply pitch

            this.mesh.quaternion.copy(combinedQ);
            
            // Ensure matrixWorld is updated for correct emission point calculation
            this.mesh.updateMatrix();
            this.mesh.updateMatrixWorld(true); // Force update entire chain
        }
    }
    
    reset() {
        const { worldRadius, equilibriumAltitude, equilibriumSpeed } = this.config;

        this.position.set(0, 0, worldRadius.value - equilibriumAltitude.value);
        this.forward.set(0, -1, 0);
        this.right.set(1, 0, 0);
        this.normal.set(0, 0, -1);
        
        this.pitch = 0;
        this.pitchMomentum = 0;
        this.roll = 0;
        this.turnMomentum = 0;
        
        this.currentAltitude = equilibriumAltitude.value;
        this.verticalSpeed = 0;
        this.horizontalSpeed = 0;
        this.speed = equilibriumSpeed.value;
        
        this.mesh.position.copy(this.position);
        this.updateOrientation(); // Recalculate normal and update mesh quaternion
    }
}

export { Carpet };