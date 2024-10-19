// EventSequence.js
import * as THREE from 'three';

export class EventSequence {
  constructor(particleSystem, scene) {
    this.particleSystem = particleSystem;
    this.scene = scene;
    this.events = [
      { duration: 5, cam: { x: 0, y: 20, z: 30 }, lookAt: { x: 0, y: 0, z: 0 }, desc: "Initial setup", kidPositions: [{x: -10, y: 0, z: -10}], adultPositions: [{x: 10, y: 0, z: -10}] },
      { duration: 3, cam: { x: 20, y: 100, z: -200 }, lookAt: "centerOfScene", desc: "Team enters", kidPositions: [{x: 0, y: 0, z: 0}], adultPositions: [{x: 5, y: 0, z: 0}] },
      { duration: 4, cam: { x: 0, y: 15, z: 25 }, lookAt: "firstBox", desc: "Setup equipment", emitParticles: { pos: {x: 0, y: 1, z: 0}, emoji: "🔧", count: 2 } },
      { duration: 5, cam: { x: -10, y: 10, z: 15 }, lookAt: { x: 0, y: 5, z: 0 }, desc: "Story begins - Wishful Scene", emitParticles: { pos: {x: 0, y: 2, z: 0}, emoji: "💭", count: 1 } },
      { duration: 2, cam: { x: 5, y: 8, z: 20 }, lookAt: "assemblyZone", desc: "Assembly Equipment activates", attraction: true, emitParticles: { pos: {x: -2, y: 1, z: 0}, emoji: "✨", count: 3 } },
      { duration: 4, cam: { x: 0, y: 12, z: 18 }, lookAt: "topOfStack", desc: "Stack assembly", attraction: true },
      { duration: 3, cam: { x: 15, y: 10, z: 15 }, lookAt: "teamChoiceElement1", desc: "Team Choice Element 1", emitParticles: { pos: {x: 5, y: 2, z: 0}, emoji: "🔮", count: 2 } },
      { duration: 2, cam: { x: 0, y: 15, z: 20 }, lookAt: "topOfStack", desc: "Stack assembly completes", attraction: false },
      { duration: 3, cam: { x: -10, y: 12, z: 15 }, lookAt: "kid1", desc: "Frustration Point", emitParticles: { pos: {x: 0, y: 2, z: 0}, emoji: "😖", count: 1 } },
      { duration: 2, cam: { x: 10, y: 8, z: 20 }, lookAt: "centerOfScene", desc: "Destruction Equipment activates", emitParticles: { pos: {x: 2, y: 1, z: 0}, emoji: "💥", count: 3 } },
      { duration: 5, cam: { x: 0, y: 20, z: 25 }, lookAt: "centerOfScene", desc: "Stack Destruction", attraction: false },
      { duration: 3, cam: { x: 0, y: 15, z: 30 }, lookAt: "centerOfScene", desc: "Items land in zones", emitParticles: [
        { pos: {x: -7, y: 0.5, z: -7}, emoji: "🌕", count: 2, lifetime: 5 },
        { pos: {x: -5, y: 0.5, z: -5}, emoji: "🌗", count: 2, lifetime: 4 },
        { pos: {x: -3, y: 0.5, z: -3}, emoji: "🌘", count: 1, lifetime: 3 },
      ]},
      { duration: 4, cam: { x: 15, y: 10, z: 15 }, lookAt: "teamChoiceElement2", desc: "Team Choice Element 2", emitParticles: { pos: {x: 5, y: 2, z: 0}, emoji: "🎭", count: 2 } },
      { duration: 5, cam: { x: -5, y: 12, z: 20 }, lookAt: "kid2", desc: "Story resolution", emitParticles: { pos: {x: 0, y: 2, z: 0}, emoji: "😄", count: 1 } },
      { duration: 2, cam: { x: 0, y: 18, z: 25 }, lookAt: "centerOfScene", desc: "Team calls TIME", emitParticles: { pos: {x: 0, y: 3, z: 0}, emoji: "⏰", count: 1 } },
      { duration: 10, cam: { x: 10, y: 10, z: 30 }, lookAt: "judges", desc: "Judges ask questions", kidPositions: [{x: 0, y: 0, z: -5}], adultPositions: [{x: 0, y: 0, z: 5}] },
      { duration: 5, cam: { x: 0, y: 25, z: 35 }, lookAt: "centerOfScene", desc: "Review points", emitParticles: { pos: {x: 0, y: 5, z: 0}, emoji: "🏆", count: 3 } },
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
        console.log('lookAtTarget', lookAtTarget);
      camera.lookAt(lookAtTarget);
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
            const offset = new THREE.Vector3(i*.1, 0, 0);
          kid.position.lerp(new THREE.Vector3(...Object.values(currentEvent.kidPositions[i])) + offset, 0.05);
        }
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
    if (this.eventTimer >= currentEvent.duration) {
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