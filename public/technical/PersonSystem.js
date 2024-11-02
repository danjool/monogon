// PersonSystem.js
import * as THREE from 'three';

class Person extends THREE.Group {
    constructor({
        height = 10,
        color = '#FFFFFF',
        isChild = false,
        scene
    }) {
        super();
        this.scene = scene;
        // Scale everything relative to height
        const scale = height;
        this.scale.set(scale, scale, scale);

        // Configuration
        this.bodyWidth = isChild ? 1.2 : 1;
        this.bodyHeight = isChild ? 2 : 3;
        this.headRadius = isChild ? 0.6 : 0.5;
        this.neckDistance = 1.0 * this.headRadius;
        this.legWidth = 0.3;
        this.legHeight = isChild ? 1.5 : 2;
        this.armWidth = 0.25;
        this.armHeight = isChild ? 1.2 : 1.8;
        
        // Create materials
        this.material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
        
        // Initialize body parts
        this.initHead();
        this.initBody();
        this.initLegs();
        this.initArms();
        
        // Animation state
        this.walkSpeed = 2;
        this.headWobbleSpeed = 1.5;
        this.headWobbleAmount = 0.1;
        this.legSwingAmount = Math.PI / 6; // 30 degrees
        this.armSwingAmount = Math.PI / 4; // 45 degrees
        this.isWalking = false;
        this.timeOffset = Math.random() * Math.PI * 2; // Random starting phase

        // speech properties
        this.isSpeaking = false;
        this.speechTimer = 0;
        this.speechInterval = 0.5; // Time between speech particles
        this.currentSpeechEmoji = '💭';

         // holding properties
        this.heldObject = null;
        this.isHolding = false;
        this.originalArmRotation = this.rightArm.rotation.z;


        // pirouette properties
        this.isPirouetting = false;
        this.pirouetteProgress = 0;
        this.pirouetteDuration = 0;
        this.pirouetteStartPos = new THREE.Vector3();
        this.pirouetteEndPos = new THREE.Vector3();
        this.pirouetteStartRotation = 0;
        this.pirouetteTotalRotations = 2; // Number of 360° spins
    }

    startPirouette(endPos, duration = 1.0) {
        this.isPirouetting = true;
        this.pirouetteProgress = 0;
        this.pirouetteDuration = duration;
        this.pirouetteStartPos.copy(this.position);
        this.pirouetteEndPos = new THREE.Vector3(endPos.x, endPos.y, endPos.z);
        this.pirouetteStartRotation = this.rotation.y;

        // Raise arms for pirouette
        this.leftArm.rotation.z = 1 * Math.PI / 4;  // Arms up
        this.rightArm.rotation.z = -1 * Math.PI / 4;
        
        // Start walking animation for foot movement
        this.startWalking();
    }

    updatePirouette(deltaTime) {
        if (!this.isPirouetting) return;

        this.pirouetteProgress += deltaTime / this.pirouetteDuration;
        const t = this.pirouetteProgress
        
        if (this.pirouetteProgress >= 1) {
            this.completePirouette();
            return;
        }

        // Eased progress for smooth start and stop
        const eased = this.easeInOutQuad(this.pirouetteProgress);
        
        // Position interpolation
        this.position.lerpVectors(this.pirouetteStartPos, this.pirouetteEndPos, eased);
        
        // Rotation calculation - multiple spins
        const rotations = this.pirouetteTotalRotations * 2 * Math.PI;
        this.rotation.y = this.pirouetteStartRotation + (eased * rotations);
        
        // Add some vertical bounce
        const h0 = this.pirouetteStartPos.y;
        const h1 = this.pirouetteEndPos.y;
        const y = h0 * (1-t) + h1 * t + 4 * t * (1-t) * 1.0
        this.position.y = y;        
    }

    completePirouette() {
        this.isPirouetting = false;
        this.position.copy(this.pirouetteEndPos);
        this.rotation.y = this.pirouetteStartRotation; // Reset to original rotation
        
        // Reset arms
        this.leftArm.rotation.z = 0;
        this.rightArm.rotation.z = 0;
        
        this.stopWalking();
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    holdObject(object) {
        if (this.isHolding) {
            this.releaseObject();
        }
        
        this.heldObject = object;
        this.isHolding = true;
        
        this.rightArm.rotation.z = -3 * Math.PI / 2;
        
        if (object) {
            this.rightArm.add(object);
            // Position at the end of the arm
            object.position.set(0, this.armHeight, 0);
            // If it's a SpriteText, we might want to adjust its scale
            if (object.type === 'Sprite') {
                object.scale.set(0.5, 0.5, 0.5);
            }
        }
    }

    releaseObject() {
        if (this.heldObject) {
            const worldPosition = new THREE.Vector3();
            this.heldObject.getWorldPosition(worldPosition);

            this.scene.add(this.heldObject);
            this.heldObject.position.copy(worldPosition);

            this.rightArm.remove(this.heldObject);
            this.heldObject = null;
            this.isHolding = false;
            this.rightArm.rotation.z = this.originalArmRotation;
        }
    }

    initHead() {
        const headGeometry = new THREE.CircleGeometry(this.headRadius, 32);
        this.head = new THREE.Mesh(headGeometry, this.material);
        this.head.position.y = this.bodyHeight + this.neckDistance // Slight gap between head and body
        this.add(this.head);
    }

    initLegs() {
        const legGeometry = new THREE.Shape();
        const legRadius = this.legWidth / 2;
        
        legGeometry.moveTo(-this.legWidth / 2, 0);
        legGeometry.lineTo(this.legWidth / 2, 0);
        legGeometry.lineTo(this.legWidth / 2, this.legHeight - legRadius);
        legGeometry.quadraticCurveTo(
            this.legWidth / 2, this.legHeight,
            0, this.legHeight
        );
        legGeometry.quadraticCurveTo(
            -this.legWidth / 2, this.legHeight,
            -this.legWidth / 2, this.legHeight - legRadius
        );
        legGeometry.lineTo(-this.legWidth / 2, 0);

        const legShape = new THREE.ShapeGeometry(legGeometry);
        
        this.leftLeg = new THREE.Mesh(legShape, this.material);
        this.leftLeg.position.x = -this.bodyWidth / 4;
        
        this.rightLeg = new THREE.Mesh(legShape.clone(), this.material);
        this.rightLeg.position.x = this.bodyWidth / 4;
        
        this.add(this.leftLeg, this.rightLeg);
    }

    initArms() {
        const armGeometry = new THREE.Shape();
        const armRadius = this.armWidth / 2;
        
        armGeometry.moveTo(-this.armWidth / 2, 0);
        armGeometry.lineTo(this.armWidth / 2, 0);
        armGeometry.lineTo(this.armWidth / 2, this.armHeight - armRadius);
        armGeometry.quadraticCurveTo(
            this.armWidth / 2, this.armHeight,
            0, this.armHeight
        );
        armGeometry.quadraticCurveTo(
            -this.armWidth / 2, this.armHeight,
            -this.armWidth / 2, this.armHeight - armRadius
        );
        armGeometry.lineTo(-this.armWidth / 2, 0);

        const armShape = new THREE.ShapeGeometry(armGeometry);
        
        this.leftArm = new THREE.Mesh(armShape, this.material);
        this.leftArm.position.set(-this.bodyWidth / 4 , this.bodyHeight * 0.8, 0);
        
        this.rightArm = new THREE.Mesh(armShape.clone(), this.material);
        this.rightArm.position.set(this.bodyWidth / 4, this.bodyHeight * 0.8, 0);
        
        this.add(this.leftArm, this.rightArm);
    }

    initBody() {
        const bodyGeometry = new THREE.Shape();
        bodyGeometry.moveTo(-this.bodyWidth / 2, 0);

        bodyGeometry.lineTo(this.bodyWidth / 2, 0);
        bodyGeometry.lineTo(this.bodyWidth / 2, this.bodyHeight - this.headRadius);
        
        // rounded top corners, like the arms
        bodyGeometry.quadraticCurveTo(
            this.bodyWidth / 2, this.bodyHeight,
            0, this.bodyHeight
        );
        bodyGeometry.quadraticCurveTo(
            -this.bodyWidth / 2, this.bodyHeight,
            -this.bodyWidth / 2, this.bodyHeight - this.headRadius
        );

        const bodyShape = new THREE.ShapeGeometry(bodyGeometry);
        this.body = new THREE.Mesh(bodyShape, this.material);
        this.add(this.body);
    }

    getSpeechPosition() {
        // Return position above the person's head
        return new THREE.Vector3(
            this.position.x,
            this.position.y + this.bodyHeight + this.headRadius * 2,
            this.position.z
        );
    }

    startSpeaking(emoji = '💭', duration = 3) {
        console.log('startSpeaking', emoji, duration, this);
        this.isSpeaking = true;
        this.currentSpeechEmoji = emoji;
        setTimeout(() => {
            this.isSpeaking = false;
        }, duration * 1000);
    }

    stopSpeaking() {
        this.isSpeaking = false;
    }

    update(deltaTime) {
        const time = performance.now() / 1000 + this.timeOffset;

        if (this.isPirouetting) {
            this.updatePirouette(deltaTime);
            return { shouldEmit: false };
        }

        if (this.isWalking) {
            // Leg animation
            this.leftLeg.position.y = -this.legHeight/2 + Math.sin(time * this.walkSpeed * 10.) * this.legHeight / 2;
            this.rightLeg.position.y = -this.legHeight/2 + -Math.sin(time * this.walkSpeed * 10.) * this.legHeight / 2;
            
        } else { // Reset leg positions
            this.leftLeg.position.y = -1;
            this.rightLeg.position.y = -1;

            // Reset arm positions
            this.leftArm.rotation.z = Math.PI;
            this.rightArm.rotation.z = Math.PI;

        }

        // Subtle head wobble
        this.head.position.x = Math.sin(time * this.headWobbleSpeed) * this.headWobbleAmount;
        this.head.position.y = this.bodyHeight + this.neckDistance + 
        Math.abs(Math.sin(time * this.headWobbleSpeed * 2)) * this.headWobbleAmount;
        
        if (this.isSpeaking) {
            this.speechTimer += deltaTime;
            if (this.speechTimer >= this.speechInterval) {
                this.speechTimer = 0;
                return { shouldEmit: true, emoji: this.currentSpeechEmoji };
            }
        }

        // If holding an object, keep the arm up
        if (this.isHolding) {
            this.rightArm.rotation.z = -3 * Math.PI / 2;
        }
         
        return { shouldEmit: false };
    }

    startWalking() {
        this.isWalking = true;
    }

    stopWalking() {
        this.isWalking = false;
        this.leftLeg.rotation.z = 0;
        this.rightLeg.rotation.z = 0;
        this.leftArm.rotation.z = 0;
        this.rightArm.rotation.z = 0;
    }

    wave() {
        this.rightArm.rotation.z = -Math.PI / 4;
    }

    stopWaving() {
        this.rightArm.rotation.z = 0;
    }
}

export class PersonSystem {
    constructor(scene) {
        this.scene = scene;
        this.people = {
            kids: [],
            appraisers: [],
            audience: []
        };
    }

    createKid(options = {}) {
        const kid = new Person({
            height: 1,
            isChild: true,
            scene: this.scene,
            ...options
        });
        this.people.kids.push(kid);
        this.scene.add(kid);
        kid.position.y = 1;
        return kid;
    }

    createAppraiser(options = {}) {
        const appraiser = new Person({
            height: 1,
            scene: this.scene,
            ...options
        });
        this.people.appraisers.push(appraiser);
        this.scene.add(appraiser);
        return appraiser;
    }

    createAudience(count, rowCount, areaWidth, areaDepth, startZ) {
        const peoplePerRow = Math.ceil(count / rowCount);
        const spacing = {
            x: areaWidth / peoplePerRow,
            z: areaDepth / rowCount
        };

        for (let row = 0; row < rowCount; row++) {
            for (let col = 0; col < peoplePerRow; col++) {
                if (this.people.audience.length >= count) break;

                const person = new Person({
                    height: 1 + Math.random() * .2,
                    color: `hsl(0, 0%, ${Math.floor(50 + Math.random() * 20)}%)`,
                    scene: this.scene,
                });

                person.position.set(
                    (col - peoplePerRow / 2) * spacing.x + spacing.x / 2,
                    1,
                    startZ + row * spacing.z
                );

                this.people.audience.push(person);
                this.scene.add(person);
            }
        }
    }

    update(deltaTime) {
        Object.values(this.people).flat().forEach(person => {
            const updateResult = person.update(deltaTime);
            if (updateResult.shouldEmit && this.particleSystem) {
                const speechPos = person.getSpeechPosition();
                this.particleSystem.emitEmojiParticles(
                    { x: speechPos.x, y: speechPos.y, z: speechPos.z },
                    updateResult.emoji,
                    1,  // emit one particle at a time
                    2   // particle lifetime in seconds
                );
            }
        });
    }

    toggleWalking(group, isWalking) {
        if (this.people[group]) {
            this.people[group].forEach(person => {
                isWalking ? person.startWalking() : person.stopWalking();
            });
        }
    }

    movePeople(group, targetPositions, duration = .1) {
        if (!this.people[group] || !targetPositions) {
            console.warn(`Invalid group "${group}" or target positions ${targetPositions}`);
            return;
        }

        const positions = Array.isArray(targetPositions) ? targetPositions : [targetPositions];

        this.people[group].forEach((person, index) => {
            if (!positions[index]) return;

            const target = positions[index];
            
            if (target && (target.x !== undefined || target.y !== undefined || target.z !== undefined)) {
                const targetPos = new THREE.Vector3(
                    target.x || person.position.x,
                    target.y || person.position.y,
                    target.z || person.position.z
                );

                person.startWalking();
                
                const startPos = person.position.clone();
                let time = 0;

                const animate = () => {
                    time += 1/60;
                    const t = Math.min(time / duration, 1);
                    
                    person.position.lerpVectors(startPos, targetPos, t);

                    if (t < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        person.stopWalking();
                    }
                };

                animate();
            }
        });
    }

    makeAllPeopleLookAt(target) {
        Object.values(this.people).flat().forEach(person => {
            person.lookAt(target);
        });
    }

    makeGroupLookAt(group, target) {
        console.log('makeGroupLookAt', group, target); // target could be a object, could be a string like 
        // if (typeof target === 'string') {
        //     target = this.getLookAtTarget(target);
        // }
        // if (this.people[group]) {
        //     console.log('people', this.people[group]);
        //     this.people[group].forEach(person => {
        //         // person.lookAt(target); // busted for now
        //     });
        // }
    }

    stopGroupLooking(group) {
        if (this.people[group]) {
            this.people[group].forEach(person => {
                person.stopLooking();
            });
        }
    }

    makePersonHoldObject(group, personIndex, object) {
        if (this.people[group] && this.people[group][personIndex]) {
            this.people[group][personIndex].holdObject(object);
        }
    }

    makePersonReleaseObject(group, personIndex) {
        if (this.people[group] && this.people[group][personIndex]) {
            this.people[group][personIndex].releaseObject();
        }
    }

    makeGroupWave(group) {
        if (this.people[group]) {
            this.people[group].forEach(person => {
                person.wave();
            });
        }
    }

    makePeoplePirouette(group, targetPositions, duration = 1.0) {
        if (!this.people[group] || !targetPositions) {
            console.warn(`Invalid group "${group}" or target positions`);
            return;
        }

        const positions = Array.isArray(targetPositions) ? targetPositions : [targetPositions];

        this.people[group].forEach((person, index) => {
            if (!positions[index]) return;

            const target = positions[index];
            if (target && (target.x !== undefined || target.y !== undefined || target.z !== undefined)) {
                const targetPos = new THREE.Vector3(
                    target.x || person.position.x,
                    target.y || person.position.y,
                    target.z || person.position.z
                );

                person.startPirouette(targetPos, duration);
            }
        });
    }

    stopGroupWaving(group) {
        if (this.people[group]) {
            this.people[group].forEach(person => {
                person.stopWaving();
            });
        }
    }

    makePersonSpeak(group, index, emoji = '💭', duration = 3) {
        if (this.people[group] && this.people[group][index]) {
            this.people[group][index].startSpeaking(emoji, duration);
        }
    }

    makeGroupSpeak(group, emoji = '💭', duration = 3) {
        if (this.people[group]) {
            this.people[group].forEach(person => {
                person.startSpeaking(emoji, duration);
            });
        }
    }

    stopPersonSpeaking(group, index) {
        if (this.people[group] && this.people[group][index]) {
            this.people[group][index].stopSpeaking();
        }
    }

    stopGroupSpeaking(group) {
        if (this.people[group]) {
            this.people[group].forEach(person => {
                person.stopSpeaking();
            });
        }
    }

    setParticleSystem(particleSystem) {
        this.particleSystem = particleSystem;
    }

    getKids() {
        return this.people.kids;
    }

    getAppraisers() {
        return this.people.appraisers;
    }
}