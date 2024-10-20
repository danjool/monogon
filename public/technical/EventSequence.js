// EventSequence.js
import * as THREE from 'three';

export class EventSequence {
  constructor(particleSystem, scene) {
    this.particleSystem = particleSystem;
    this.scene = scene;
    this.events = [
      { desc: "Initial setup", duration: 5, 
        cam: { x: 0, y: 20, z: 30 }, lookAt: "judges", 
        kidPositions: [{x: -100, y: 0, z: -100}], 
        adultPositions: [{x: 10, y: 0, z: -10}] 
    },
      { desc: "Team enters", duration: 3, 
        cam: { x: 20, y: 100, z: -200 }, lookAt: "centerOfScene", 
        kidPositions: [{x: 0, y: 0, z: 0}], adultPositions: [{x: 5, y: 0, z: 0}] },
      { desc: "Setup equipment", duration: 4, 
        cam: { x: 0, y: 15, z: 25 }, lookAt: "firstBox", 
            emitParticles: { pos: {x: 0, y: 1, z: 0}, emoji: "🔧", count: 2 } },
      { desc: "Story begins - Wishful Scene", duration: 5, 
        cam: { x: -10, y: 10, z: 15 }, lookAt: { x: 0, y: 5, z: 0 }, 
        emitParticles: { pos: {x: 0, y: 2, z: 0}, emoji: "💭", count: 1 } },
      { desc: "Assembly Equipment activates", duration: 2, 
        cam: { x: 5, y: 8, z: 20 }, lookAt: "assemblyZone", attraction: true, 
        emitParticles: { pos: {x: -2, y: 1, z: 0}, emoji: "✨", count: 3 } },
      { desc: "Stack assembly", duration: 4, 
        cam: { x: 0, y: 12, z: 18 }, lookAt: "topOfStack", attraction: true },
      { desc: "Team Choice Element 1", duration: 3, 
        cam: { x: 15, y: 10, z: 15 }, lookAt: "teamChoiceElement1", 
        emitParticles: { pos: {x: 5, y: 2, z: 0}, emoji: "🔮", count: 2 } },
      { desc: "Stack assembly completes", duration: 2, 
        cam: { x: 0, y: 15, z: 20 }, lookAt: "topOfStack", attraction: false },
      { desc: "Frustration Point", duration: 3, 
        cam: { x: -10, y: 12, z: 15 }, lookAt: "kid1", 
        emitParticles: { pos: {x: 0, y: 2, z: 0}, emoji: "😖", count: 1 } },
      { desc: "Destruction Equipment activates", duration: 2, 
        cam: { x: 10, y: 8, z: 20 }, lookAt: "centerOfScene", 
        emitParticles: { pos: {x: 2, y: 1, z: 0}, emoji: "💥", count: 3 } },
      { desc: "Stack Destruction", duration: 5, 
        cam: { x: 0, y: 20, z: 25 }, lookAt: "centerOfScene", attraction: false },
      { desc: "Items land in zones", duration: 3, 
        cam: { x: 0, y: 15, z: 30 }, lookAt: "centerOfScene", 
        emitParticles: [
        { pos: {x: -7, y: 0.5, z: -7}, emoji: "🌕", count: 2, lifetime: 5 },
        { pos: {x: -5, y: 0.5, z: -5}, emoji: "🌗", count: 2, lifetime: 4 },
        { pos: {x: -3, y: 0.5, z: -3}, emoji: "🌘", count: 1, lifetime: 3 },
      ]},
      { desc: "Team Choice Element 2", duration: 4, 
        cam: { x: 15, y: 10, z: 15 }, lookAt: "teamChoiceElement2", 
        emitParticles: { pos: {x: 5, y: 2, z: 0}, emoji: "🎭", count: 2 } },
      { desc: "Story resolution", duration: 5, 
        cam: { x: -5, y: 12, z: 20 }, lookAt: "kid2", 
        emitParticles: { pos: {x: 0, y: 2, z: 0}, emoji: "😄", count: 1 } },
      { desc: "Team calls TIME", duration: 2, 
        cam: { x: 0, y: 18, z: 25 }, lookAt: "centerOfScene", 
        emitParticles: { pos: {x: 0, y: 3, z: 0}, emoji: "⏰", count: 1 } },
      { desc: "Judges ask questions", duration: 10, 
        cam: { x: 10, y: 10, z: 30 }, lookAt: "judges", 
        kidPositions: [{x: 0, y: 0, z: -5}], adultPositions: [{x: 0, y: 0, z: 5}] },
      { desc: "Review points", duration: 5, 
        cam: { x: 0, y: 25, z: 35 }, lookAt: "centerOfScene", 
        emitParticles: { pos: {x: 0, y: 5, z: 0}, emoji: "🏆", count: 3 } },
    ];
    this.currentEventIndex = 0;
    this.eventTimer = 0;
    this.particleCooldown = 0;
    this.particleCooldownTime = 0.5; // Cooldown time in seconds
  }

  update(deltaTime, camera) {
    const currentEvent = this.events[this.currentEventIndex];
    this.eventTimer += deltaTime;
    this.particleCooldown -= deltaTime;

    // Update camera position
    camera.position.lerp(new THREE.Vector3(currentEvent.cam.x, currentEvent.cam.y, currentEvent.cam.z), 0.05);

    // Update camera lookAt
    const lookAtTarget = this.getLookAtTarget(currentEvent.lookAt);
    if (lookAtTarget) {
        // console.log('lookAtTarget', lookAtTarget);
    //   camera.lookAt(new THREE.Vector3(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z));
    }

    // Handle particle emissions with cooldown
    if (currentEvent.emitParticles && this.particleCooldown <= 0) {
      if (Array.isArray(currentEvent.emitParticles)) {
        currentEvent.emitParticles.forEach(emission => 
          this.particleSystem.emitEmojiParticles(emission.pos, emission.emoji, emission.count, emission.lifetime));
      } else {
        this.particleSystem.emitEmojiParticles(currentEvent.emitParticles.pos, currentEvent.emitParticles.emoji, 
                                               currentEvent.emitParticles.count, currentEvent.emitParticles.lifetime);
      }
      this.particleCooldown = this.particleCooldownTime;
    }

    // Update character positions
    if (currentEvent.kidPositions && this.scene.kids) {
      this.scene.kids.forEach((kid, i) => {
        if (currentEvent.kidPositions[i]) {
            // each kid should get an offset
            // const offset = new THREE.Vector3(i*.1, 0, 0);
            // console.log('kid', i, currentEvent.kidPositions[i]);
          kid.position.lerp(new THREE.Vector3(...Object.values(currentEvent.kidPositions[i])), 0.0005);
        }
      });
    } else {
        // leave the kids in the same place
        this.scene.kids.forEach((kid, i) => {
            // console.log('kid(none)', i, kid.position);
        });
    }

    if (currentEvent.adultPositions && this.scene.adults) {
      this.scene.adults.forEach((adult, i) => {
        if (currentEvent.adultPositions[i]) {
          adult.position.lerp(new THREE.Vector3(...Object.values(currentEvent.adultPositions[i])), 0.05);
        }
      });
    }

    // Move to next event
    const durationMultiplier = 2.0;
    if (this.eventTimer >= currentEvent.duration * durationMultiplier) {
      this.currentEventIndex = (this.currentEventIndex + 1) % this.events.length;
      this.eventTimer = 0;
      console.log('Switching to event', this.currentEventIndex, this.events[this.currentEventIndex].desc, this.events[this.currentEventIndex].lookAt);
    }
  }

  getLookAtTarget(lookAt) {
    if (typeof lookAt === 'string') {
      switch (lookAt) {
        case 'centerOfScene':
          return new THREE.Vector3(0, 0, 0);
        case 'firstBox':
          return this.scene.meshes[0] ? this.scene.meshes[0].position : null;
        case 'topOfStack':
          return this.scene.meshes.length > 0 ? this.scene.meshes[this.scene.meshes.length - 1].position : null;
        case 'assemblyZone':
          return this.scene.assemblyZone ? this.scene.assemblyZone.position : null;
        case 'teamChoiceElement1':
          return this.scene.teamChoiceElement1 ? this.scene.teamChoiceElement1.position : null;
        case 'teamChoiceElement2':
          return this.scene.teamChoiceElement2 ? this.scene.teamChoiceElement2.position : null;
        case 'kid1':
            console.log('kid1', this.scene.kids[0].position);
          return this.scene.kids[0] ? this.scene.kids[0].position : null;
        case 'kid2':
          return this.scene.kids[1] ? this.scene.kids[1].position : null;
        case 'judges':
          return this.scene.adults[0] ? this.scene.adults[0].position : null;
        default:
          console.warn(`Unknown lookAt target: ${lookAt}`);
          return null;
      }
    } else if (typeof lookAt === 'object' && lookAt !== null) {
      return new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z);
    }
    return null;
  }
}