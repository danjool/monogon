// EventSequence.js
import * as THREE from 'three';
import { TextOverlaySystem } from './TextOverlaySystem.js';

export class EventSequence {
    constructor(particleSystem, scene, physicsWorker, controls, renderer, camera) {
    this.particleSystem = particleSystem;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.physicsWorker = physicsWorker;
    this.controls = controls;
    this.textOverlays = []
    this.textOverlaySystem = new TextOverlaySystem(this.scene, this.camera, this.renderer);
    // for reference, the zones after arbitraryFactor are: 10 assembly, 25 tgt1, 35 tgt2, 40 tgt3, 100 presentation area
    this.events = [
        { desc: "Checkout new Models", duration: 200, 
            cam: { x: -40, y: 2, z: 54 }, lookAt: "kid1", 
            attraction: false,
            camLerpSpeed: undefined,
            kidPositions: [
                {x: -40, y: 1, z: 40}, 
                {x: -50, y: 1, z: -50}, 
                {x: -55, y: 1, z: -50}, 
            ], 
            appraiserPositions: [
                {x: 20, y: 1, z: -10},
                {x: 20, y: 1, z: -20}
            ], 
            fixedOverlays: [],
            object3DOverlays: [],
        },
        { desc: "Overview", duration: 5, 
            cam: { x: 0, y: 460, z: -40 }, lookAt: { x: 0, y: 0, z: -40 },
            camLerpSpeed: undefined,  // No lerp
            attraction: false,
            kidPositions: [
                {x: -40, y: 1, z: 40}, 
                {x: -50, y: 5, z: -50}, 
                {x: -55, y: 5, z: -50}, 
            ], 
            appraiserPositions: [
                {x: 20, y: 7.5, z: -10},
                {x: 20, y: 7.5, z: -20}
            ], 
            fixedOverlays: [],
            object3DOverlays: [
                { text: 'Presentation Area', object3D: this.scene.presentationArea, offset: { x: 0, y: -40 } },
                { text: '20ftx20ft', object3D: this.scene.presentationArea, offset: { x: 0, y: 20 } },
            ],
        },
        { desc: "Initial setup", duration: 5, 
            cam: { x: -60, y: 20, z: 130 }, lookAt: "kid1", 
            attraction: false,
            camLerpSpeed: 0.05,
            kidPositions: [
                {x: -45, y: 5, z: -50}, 
                {x: -50, y: 5, z: -50}, 
                {x: -55, y: 5, z: -50}, 
            ], 
            appraiserPositions: [
                {x: 20, y: 7.5, z: -10},
                {x: 20, y: 7.5, z: -20}
            ], 
            fixedOverlays: [],
            object3DOverlays: [],
        },
        { desc: "Team enters", duration: 5, 
            cam: { x: -60, y: 20, z: 130 }, lookAt: "kid1", attraction: false,
            kidPositions: [
                {x: -10, y: 5, z: -15}, 
                {x: -10, y: 5, z: -5}, 
                {x: -10, y: 5, z: -10}, 
            ], 
        },
        { desc: "Setup equipment", duration: 4, 
            cam: { x: -60, y: 20, z: 130 }, lookAt: "kid1", attraction: false,
            kidPositions: [
                {x: -10, y: 5, z: -15}, 
                {x: -10, y: 5, z: -5}, 
                {x: -10, y: 5, z: -10}, 
            ], 
        },
        { desc: "Story begins - Wishful Scene", duration: 5, 
            cam: { x: -60, y: 20, z: 130 }, lookAt: "kid1", attraction: false,
            kidPositions: [
                {x: -10, y: 5, z: -15}, 
                {x: -10, y: 5, z: -5}, 
                {x: -10, y: 5, z: -10}, 
            ], 
        },
        { desc: "Assembly Equipment activates", duration: 2, 
            cam: { x: -60, y: 20, z: 130 }, lookAt: "kid1", attraction: false,
            kidPositions: [
                {x: -10, y: 5, z: -15}, 
                {x: -10, y: 5, z: -5}, 
                {x: -10, y: 5, z: -10}, 
            ], 
                attraction: true, 
                emitParticles: { pos: {x: -2, y: 1, z: 0}, emoji: "✨", count: 3 } 
        },
        { desc: "Stack assembly (15/15 pts Design Assembly, my magic wand is designed well) (15/15 pts Innovation Assembly)", duration: 4, 
        cam: { x: -60, y: 20, z: 130 }, lookAt: "kid1", attraction: false,
            kidPositions: [
                {x: -10, y: 5, z: -15}, 
                {x: -10, y: 5, z: -5}, 
                {x: -10, y: 5, z: -10}, 
            ], 
        },  
      { desc: "Team Choice Element 1", duration: 3, 
        cam: { x: 80, y: 100, z: 80 }, lookAt: "teamChoiceElement1", 
        emitParticles: { pos: {x: 5, y: 2, z: 0}, emoji: "🔮", count: 2 } },
      { desc: "Stack assembly completes", duration: 2, 
        cam: { x: 0, y: 80, z: 20 }, lookAt: "topOfStack", },
      { desc: "Frustration Point", duration: 3, 
        cam: { x: -100, y: 12, z: 80 }, lookAt: "kid1", 
        emitParticles: { pos: {x: 0, y: 2, z: 0}, emoji: "😖", count: 1 } },
      { desc: "Destruction Equipment activates", duration: 2, 
        cam: { x: 100, y: 8, z: 20 }, lookAt: "centerOfScene", 
        emitParticles: { pos: {x: 2, y: 1, z: 0}, emoji: "💥", count: 3 }, 
        attraction: false },
      { desc: "Stack Destruction", duration: 5, 
        cam: { x: 0, y: 20, z: 25 }, lookAt: "centerOfScene", 
        attraction: false },
      { desc: "Items land in zones", duration: 3, 
        cam: { x: 0, y: 80, z: 30 }, lookAt: "centerOfScene", 
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
        kidPositions: [{x: 0, y: 0, z: -5}], appraiserPositions: [{x: 0, y: 0, z: 5}],
        emitParticles: { pos: {x: 0, y: 5, z: 0}, emoji: "❓", count: 3 } },
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
    this.textOverlaySystem.update();
    let currentEvent = this.events[this.currentEventIndex];
    this.eventTimer += deltaTime;
    this.particleCooldown -= deltaTime;

    // console.log('update', this.currentEventIndex, currentEvent);

    if(deltaTime === this.eventTimer) { // First frame of new event
        
        if (currentEvent.fixedOverlays) {
            if (currentEvent.fixedOverlays.length < 1) {
                console.log('Removing all Fixed Overlays');
                this.textOverlays.forEach(overlay => {
                    if(overlay.type === 'fixed') this.textOverlaySystem.removeOverlay(overlay);
                });
            }
            
            currentEvent.fixedOverlays.forEach(overlay => {
                console.log('Adding Fixed Overlay', overlay.text);
                const element = this.textOverlaySystem.addFixedOverlay(...Object.values(overlay));
                this.textOverlays.push(element);
            });
        }
        if (currentEvent.object3DOverlays) {
            if (currentEvent.object3DOverlays.length < 1) {
                console.log('Removing all 3D Overlays');
                this.textOverlays.forEach(overlay => {
                    if(overlay.type === '3D') this.textOverlaySystem.removeOverlay(overlay);
                });
            }
            currentEvent.object3DOverlays.forEach(overlay => {
                console.log('Adding 3DOverlay', overlay.text);
                const element = this.textOverlaySystem.addObject3DOverlay(...Object.values(overlay));
                this.textOverlays.push(element);
            });
        }

        // new way, using PersonSystem
        if(currentEvent.kidPositions) this.scene.personSystem.movePeople('kids', currentEvent.kidPositions);
        if(currentEvent.appraiserPositions) this.scene.personSystem.movePeople('appraisers', currentEvent.appraiserPositions);
        if(currentEvent.audiencePositions) this.scene.personSystem.movePeople('audience', currentEvent.audiencePositions);
    }

    if(currentEvent.camLerpSpeed !== undefined) {
        camera.position.lerp(
            new THREE.Vector3(currentEvent.cam.x, currentEvent.cam.y, currentEvent.cam.z), 
            currentEvent.camLerpSpeed
        );
    } else {
        camera.position.set(currentEvent.cam.x, currentEvent.cam.y, currentEvent.cam.z);
    }

    const lookAtTarget = this.getLookAtTarget(currentEvent.lookAt);
    if (lookAtTarget) {
        const vec = new THREE.Vector3(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z)
        // console.log('lookAtTarget', lookAtTarget, vec);
        camera.lookAt(lookAtTarget);
        camera.lookAtTarget = lookAtTarget;
        this.controls.target.set(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
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

    // Toggle attraction if specified in the event
    if (currentEvent.attraction !== undefined) {
        const currentAttraction = this.physicsWorker.isAttracted;
        if (currentAttraction !== currentEvent.attraction)this.toggleAttraction(currentEvent.attraction);
    }

    // Move to next event
    const durationMultiplier = 2.0;
    if (this.eventTimer >= currentEvent.duration * durationMultiplier) {
        this.currentEventIndex = (this.currentEventIndex + 1) % this.events.length;
        currentEvent = this.events[this.currentEventIndex];
        this.eventTimer = 0;
        console.log('Switching to event', this.currentEventIndex, this.events[this.currentEventIndex].desc, this.events[this.currentEventIndex].lookAt);        
    }
  }

  toggleAttraction(isAttracted) {
    console.log('toggleAttraction', isAttracted);
    this.physicsWorker.toggleAttraction(isAttracted);
    this.scene.toggleAttractionVisuals(isAttracted);
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
          return this.scene.appraisers[0] ? this.scene.appraisers[0].position : null;
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