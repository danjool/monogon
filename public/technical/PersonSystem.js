// PersonSystem.js
import * as THREE from 'three';

class Person extends THREE.Group {
    constructor({
        height = 10,
        color = '#FFFFFF',
        isChild = false
    }) {
        super();

        // Scale everything relative to height
        const scale = height / 10;
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
        this.material = new THREE.MeshBasicMaterial({ color });
        
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
    }

    initHead() {
        const headGeometry = new THREE.CircleGeometry(this.headRadius, 32);
        this.head = new THREE.Mesh(headGeometry, this.material);
        this.head.position.y = this.bodyHeight + this.neckDistance // Slight gap between head and body
        this.add(this.head);
    }

    initLegs() {
        // Create legs as rounded rectangles
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
        
        // Left leg
        this.leftLeg = new THREE.Mesh(legShape, this.material);
        this.leftLeg.position.x = -this.bodyWidth / 4;
        
        // Right leg
        this.rightLeg = new THREE.Mesh(legShape.clone(), this.material);
        this.rightLeg.position.x = this.bodyWidth / 4;
        
        this.add(this.leftLeg, this.rightLeg);
    }

    initArms() {
        // Create arms as rounded rectangles
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
        
        // Left arm
        this.leftArm = new THREE.Mesh(armShape, this.material);
        this.leftArm.position.set(-this.bodyWidth / 4 , this.bodyHeight * 0.8, 0);
        
        // Right arm
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

    update(deltaTime) {
        const time = performance.now() / 1000 + this.timeOffset;

        if (this.isWalking) {
            // Leg animation
            this.leftLeg.position.y = -this.legHeight/2 + Math.sin(time * this.walkSpeed * 10.) * this.legHeight / 2;
            this.rightLeg.position.y = -this.legHeight/2 + -Math.sin(time * this.walkSpeed * 10.) * this.legHeight / 2;
            
            // Arm animation (opposite to legs)
            // this.leftArm.rotation.z = -Math.sin(time * this.walkSpeed) * this.armSwingAmount;
            // this.rightArm.rotation.z = Math.sin(time * this.walkSpeed) * this.armSwingAmount;
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
    }

    startWalking() {
        this.isWalking = true;
    }

    stopWalking() {
        this.isWalking = false;
        // Reset positions
        this.leftLeg.rotation.z = 0;
        this.rightLeg.rotation.z = 0;
        this.leftArm.rotation.z = 0;
        this.rightArm.rotation.z = 0;
    }

    wave() {
        // Simple wave animation using tweening could be added here
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
            height: 10,
            isChild: true,
            ...options
        });
        this.people.kids.push(kid);
        this.scene.add(kid);
        kid.position.y = 1;
        return kid;
    }

    createAppraiser(options = {}) {
        const appraiser = new Person({
            height: 10,
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
                    height: 7 + Math.random() * 2,
                    color: `hsl(0, 0%, ${Math.floor(50 + Math.random() * 20)}%)`
                });

                person.position.set(
                    (col - peoplePerRow / 2) * spacing.x,
                    0,
                    startZ + row * spacing.z
                );

                this.people.audience.push(person);
                this.scene.add(person);
            }
        }
    }

    update(deltaTime) {
        // Update all people
        Object.values(this.people).flat().forEach(person => {
            person.update(deltaTime);
        });
    }

    toggleWalking(group, isWalking) {
        if (this.people[group]) {
            this.people[group].forEach(person => {
                isWalking ? person.startWalking() : person.stopWalking();
            });
        }
    }

    movePeople(group, targetPositions, duration = 1) {
        // Early return if group doesn't exist
        console.log('group', group, 'targetPositions', targetPositions);
        if (!this.people[group] || !targetPositions) {
            console.warn(`Invalid group "${group}" or target positions ${targetPositions}`);
            return;
        }

        // Ensure targetPositions is an array
        const positions = Array.isArray(targetPositions) ? targetPositions : [targetPositions];

        this.people[group].forEach((person, index) => {
            // Skip if no target position for this person
            if (!positions[index]) {
                return;
            }

            // Get target position
            const target = positions[index];
            
            // Ensure we have valid coordinates
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
        if (typeof target === 'string') {
            target = this.getLookAtTarget(target);
        }
        if (this.people[group]) {
            console.log('people', this.people[group]);
            this.people[group].forEach(person => {
                person.lookAt(target);
            });
        }
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

    // Utility method to make a whole group wave
    makeGroupWave(group) {
        if (this.people[group]) {
            this.people[group].forEach(person => {
                person.wave();
            });
        }
    }

    // Utility method to stop a whole group waving
    stopGroupWaving(group) {
        if (this.people[group]) {
            this.people[group].forEach(person => {
                person.stopWaving();
            });
        }
    }
}