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
      {
        desc: "debug",
        duration: 1.00001,
        cam: { x: 22, y: 9, z: -52 },
        lookAt: { x: 0, y: 2, z: 0 },
        onStart: function(scene) {
          // move the blocks, the stackabls to x = - presentationAreaSize / 2, quickly
          // you also have to move  the stackabls in terms of the simulation
          scene.meshes.forEach((mesh, index) => {
            console.log('moving mesh', mesh, index);
          });
          scene.personSystem.movePeople('kids', [
            {x: -50, y: 1, z: 10},
            {x: -55, y: 1, z: 10},
            {x: -50, y: 1, z: 15},
            .0001
          ]);
          scene.personSystem.movePeople('appraisers', [
            {x: -50, y: 1, z: -10},
            {x: -55, y: 1, z: -10},
            .0001
          ]);

          this.physicsWorker.setToSideline();
        }
    },
      {
          desc: "Overview",
          duration: 1.5,
          cam: { x: 0, y: 460, z: -41 },
          lookAt: { x: 0, y: 0, z: -40 },
          onStart: function(scene) {
              this.textOverlaySystem.addObject3DOverlay(
                  'Presentation Area',
                  scene.presentationArea,
                  { x: -scene.presentationAreaSize, y: -40 }
              );
              this.textOverlaySystem.addObject3DOverlay(
                  '20ftx20ft',
                  scene.presentationArea,
                  { x: -scene.presentationAreaSize, y: 20 }
              );
              scene.personSystem.movePeople('kids', [
                  {x: -40, y: 1, z: 40}, 
                  {x: -50, y: 5, z: -50}, 
                  {x: -55, y: 5, z: -50},
                  .01
              ]);
              scene.personSystem.movePeople('appraisers', [
                  {x: 20, y: 7.5, z: -10},
                  {x: 20, y: 7.5, z: -20}
              ]);
          }
      },
      {
        desc: "Overview of Target Zones",
        duration: 10.5,
        camLerpSpeed: 0.005,
        cam: { x: 0, y: 160, z: 0 },
        lookAt: { x: 0, y: 0, z: -1 },
        onStart: function(scene) {
          this.textOverlaySystem.removeAll3DOverlays();
          this.textOverlaySystem.addObject3DOverlay('Zone 1', scene.targetZones[0], { x: 0, y: -20 });
          this.textOverlaySystem.addObject3DOverlay('Zone 2', scene.targetZones[1], { x: 0, y: -30 });
          this.textOverlaySystem.addObject3DOverlay('Zone 3', scene.targetZones[2], { x: 0, y: -70 });
        }
      },
      {
        desc: "Check in with Appraisers",
        duration: .8,
        cam: { x: -120, y: 20, z: 120 },
        lookAt: "kid1",
        onStart: function(scene) {
            // Position team outside presentation area (at 100 units)
            scene.personSystem.movePeople('kids', [
                {x: -110, y: 1, z: 110},
                {x: -115, y: 1, z: 110},
                {x: -120, y: 1, z: 110}
            ]);
            
            // Appraisers with clipboards
            scene.personSystem.movePeople('appraisers', [
                {x: -105, y: 1, z: 105},
                {x: -100, y: 1, z: 105}
            ]);
            
            // Conversation sequence
            setTimeout(() => {
                scene.personSystem.makePersonSpeak('appraisers', 0, '📋', 2);
                scene.personSystem.makePersonSpeak('appraisers', 1, '❓', 2);
            }, 1000);
            
            setTimeout(() => {
                scene.personSystem.makePersonSpeak('kids', 0, '📏', 2); // measuring
                scene.personSystem.makePersonSpeak('kids', 1, '⚖️', 2); // weights
                scene.personSystem.makePersonSpeak('kids', 2, '✅', 2); // confirmation
            }, 3000);
        }
    },
      {
          desc: "Initial Setup Outside Presentation Area",
          duration: .5,
          cam: { x: -60, y: 20, z: 130 },
          lookAt: "kid1",
          camLerpSpeed: 0.05,
          onStart: function(scene) {
              this.textOverlaySystem.removeAll3DOverlays();
              scene.personSystem.movePeople('kids', [
                  {x: -45, y: 5, z: -50}, 
                  {x: -50, y: 5, z: -50}, 
                  {x: -55, y: 5, z: -50}
              ]);
              scene.personSystem.movePeople('appraisers', [
                  {x: 20, y: 7.5, z: -10},
                  {x: 20, y: 7.5, z: -20}
              ]);
          }
      },
      {
        desc: "Are You Ready?",
        duration: .3,
        cam: { x: -100, y: 20, z: 100 },
        lookAt: "appraisers",
        onStart: function(scene) {
            scene.personSystem.makePersonSpeak('appraisers', 0, '❓', 2);
            setTimeout(() => {
                scene.personSystem.makeGroupSpeak('kids', '👍', 1);
            }, 1000);
        }
    },
    {
        desc: "Time Starts Now!",
        duration: .2,
        cam: { x: -90, y: 20, z: 90 },
        lookAt: "kid1",
        onStart: function(scene) {
            scene.personSystem.makePersonSpeak('appraisers', 0, '⏱️', 1);
            this.particleSystem.emitEmojiParticles(
                {x: -95, y: 5, z: 95},
                "🎬",
                2
            );
        }
    },
      {
          desc: "Team Enters with Equipment",
          duration: .5,
          cam: { x: -60, y: 20, z: -130 },
          lookAt: "kid1",
          onStart: function(scene) {
              scene.personSystem.movePeople('kids', [
                  {x: -10, y: 5, z: -15}, 
                  {x: -10, y: 5, z: -5}, 
                  {x: -10, y: 5, z: -10}
              ]);
              scene.personSystem.makeGroupSpeak('kids', '🔧', 2);
          }
      },
      {
          desc: "Setup Equipment",
          duration: .4,
          cam: { x: -60, y: 20, z: 130 },
          lookAt: "kid1",
          onStart: function(scene) {
              this.particleSystem.emitEmojiParticles(
                  {x: -10, y: 2, z: -10},
                  "🔧",
                  2
              );
              scene.personSystem.makeGroupSpeak('kids', '⚡', 2);
          }
      },
      {
          desc: "Story Begins - Wishful Scene",
          duration: 5,
          cam: { x: -60, y: 20, z: 130 },
          lookAt: "kid1",
          onStart: function(scene) {
              scene.personSystem.makePersonSpeak('kids', 0, '✨', 3);
              scene.personSystem.makePersonSpeak('kids', 1, '🌟', 3);
              this.particleSystem.emitEmojiParticles(
                  {x: -10, y: 3, z: -10},
                  "💫",
                  3
              );
          }
      },
      {
          desc: "Assembly Equipment Activates",
          duration: 2,
          cam: { x: -60, y: 20, z: 130 },
          lookAt: "kid1",
          onStart: function(scene) {
              this.toggleAttraction(true);
              this.particleSystem.emitEmojiParticles(
                  {x: -2, y: 1, z: 0},
                  "✨",
                  3
              );
              scene.personSystem.makeGroupSpeak('kids', '🎯', 2);
          }
      },
      {
          desc: "Stack Assembly",
          duration: 4,
          cam: { x: -60, y: 20, z: 130 },
          lookAt: "kid1",
          onStart: function(scene) {
              scene.personSystem.makePersonSpeak('kids', 0, '🎮', 3);
              this.particleSystem.emitEmojiParticles(
                  {x: 0, y: 2, z: 0},
                  "⚡",
                  2
              );
          }
      },
      {
          desc: "Team Choice Element 1",
          duration: 3,
          cam: { x: 80, y: 100, z: 80 },
          lookAt: "teamChoiceElement1",
          onStart: function(scene) {
              this.particleSystem.emitEmojiParticles(
                  {x: 5, y: 2, z: 0},
                  "🔮",
                  2
              );
              scene.personSystem.makePersonSpeak('kids', 1, '🎨', 2);
          }
      },
      {
          desc: "Stack Assembly Completes",
          duration: 2,
          cam: { x: 0, y: 80, z: 20 },
          lookAt: "topOfStack",
          onStart: function(scene) {
              this.particleSystem.emitEmojiParticles(
                  {x: 0, y: 10, z: 0},
                  "🎯",
                  2
              );
              scene.personSystem.makeGroupSpeak('kids', '🎉', 2);
          }
      },
      {
          desc: "Frustration Point",
          duration: 3,
          cam: { x: -100, y: 12, z: 80 },
          lookAt: "kid1",
          onStart: function(scene) {
              scene.personSystem.makePersonSpeak('kids', 0, '😖', 3);
              scene.personSystem.makePersonSpeak('kids', 1, '😟', 3);
              scene.personSystem.makePersonSpeak('kids', 2, '😨', 3);
              this.particleSystem.emitEmojiParticles(
                  {x: 0, y: 2, z: 0},
                  "😖",
                  1
              );
          }
      },
      {
        desc: "Destruction Equipment Activates",
        duration: 2,
        cam: { x: 100, y: 8, z: 20 },
        lookAt: "centerOfScene",
        onStart: function(scene) {
            this.toggleAttraction(false);
            
            // Animate black hole expansion and contraction
            const blackHole = scene.blackHole;
            const expandDuration = 1.0; // seconds
            const maxScale = 6.0;
            
            // Expansion animation
            const expand = () => {
                const startScale = 0.1;
                let startTime = Date.now();
                
                const expandAnimation = () => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const progress = Math.min(elapsed / expandDuration, 1);
                    const scale = startScale + (maxScale - startScale) * progress;
                    
                    blackHole.scale.set(scale, scale, scale);
                    
                    if (progress < 1) {
                        requestAnimationFrame(expandAnimation);
                    } else {
                        // Start contraction after expansion
                        contract();
                    }
                };
                
                requestAnimationFrame(expandAnimation);
            };
            
            // Contraction animation
            const contract = () => {
                const startTime = Date.now();
                
                const contractAnimation = () => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const progress = Math.min(elapsed / expandDuration, 1);
                    const scale = maxScale * (1 - progress);
                    
                    blackHole.scale.set(scale, scale, scale);
                    
                    if (progress < 1) {
                        requestAnimationFrame(contractAnimation);
                    }
                };
                
                requestAnimationFrame(contractAnimation);
            };
            
            // Start the animation sequence
            expand();
            
            // Audio-visual feedback for the team
            scene.personSystem.makeGroupSpeak('kids', '🌌', 2);
        },
      },
      {
          desc: "Stack Destruction",
          duration: 5,
          cam: { x: 0, y: 20, z: 25 },
          lookAt: "centerOfScene"
      },
      {
          desc: "Items Land in Zones",
          duration: 3,
          cam: { x: 0, y: 80, z: 30 },
          lookAt: "centerOfScene",
          onStart: function(scene) {
              const emissions = [
                  { pos: {x: -7, y: 0.5, z: -7}, emoji: "🌕", count: 2, lifetime: 5 },
                  { pos: {x: -5, y: 0.5, z: -5}, emoji: "🌗", count: 2, lifetime: 4 },
                  { pos: {x: -3, y: 0.5, z: -3}, emoji: "🌘", count: 1, lifetime: 3 }
              ];
              emissions.forEach(emission => {
                  this.particleSystem.emitEmojiParticles(
                      emission.pos,
                      emission.emoji,
                      emission.count,
                      emission.lifetime
                  );
              });
          }
      },
      {
          desc: "Team Choice Element 2",
          duration: 4,
          cam: { x: 15, y: 10, z: 15 },
          lookAt: "teamChoiceElement2",
          onStart: function(scene) {
              this.particleSystem.emitEmojiParticles(
                  {x: 5, y: 2, z: 0},
                  "🎭",
                  2
              );
              scene.personSystem.makePersonSpeak('kids', 2, '🎨', 2);
          }
      },
      {
          desc: "Story Resolution",
          duration: 5,
          cam: { x: -5, y: 12, z: 20 },
          lookAt: "kid2",
          onStart: function(scene) {
              scene.personSystem.makeGroupSpeak('kids', '😄', 2);
              this.particleSystem.emitEmojiParticles(
                  {x: 0, y: 2, z: 0},
                  "😄",
                  1
              );
          }
      },
      {
          desc: "Team Calls TIME",
          duration: 2,
          cam: { x: 0, y: 18, z: 25 },
          lookAt: "centerOfScene",
          onStart: function(scene) {
              scene.personSystem.makeGroupSpeak('kids', '⏰', 1);
              this.particleSystem.emitEmojiParticles(
                  {x: 0, y: 3, z: 0},
                  "⏰",
                  1
              );
          }
      },
      {
          desc: "Appraisers Ask Questions",
          duration: 10,
          cam: { x: 10, y: 10, z: 30 },
          lookAt: "appraisers",
          onStart: function(scene) {
              scene.personSystem.movePeople('kids', [
                  {x: 0, y: 0, z: -5}
              ]);
              scene.personSystem.movePeople('appraisers', [
                  {x: 0, y: 0, z: 5}
              ]);
              scene.personSystem.makeGroupSpeak('appraisers', '❓', 3);
              this.particleSystem.emitEmojiParticles(
                  {x: 0, y: 5, z: 0},
                  "❓",
                  3
              );
          }
      },
      {
          desc: "Review Points",
          duration: 5,
          cam: { x: 0, y: 25, z: 35 },
          lookAt: "centerOfScene",
          onStart: function(scene) {
              scene.personSystem.makeGroupSpeak('appraisers', '🏆', 2);
              this.particleSystem.emitEmojiParticles(
                  {x: 0, y: 5, z: 0},
                  "🏆",
                  3
              );
          }
      }
  ];
    this.currentEventIndex = 0;
    this.eventTimer = 0;
    this.particleCooldown = 0;
    this.particleCooldownTime = 0.5; // Cooldown time in seconds
    this.tossAnimations = [];
  }

  startToss(object, startPos, endPos, duration = 1, maxHeight = 5) {
    const toss = new TossAnimation(object, startPos, endPos, duration, maxHeight);
    this.tossAnimations.push(toss);
    return toss;
}

  update(deltaTime, camera) {
    this.textOverlaySystem.update();
    this.tossAnimations = this.tossAnimations.filter(toss => !toss.update(deltaTime));
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

        // use makeGroupLookAt to have the kids look at the appraisers
        if(currentEvent.kidLookAt) this.scene.personSystem.makeGroupLookAt('kids', this.getLookAtTarget(currentEvent.kidLookAt));
        if(currentEvent.appraiserLookAt) this.scene.personSystem.makeGroupLookAt('appraisers', this.getLookAtTarget(currentEvent.appraiserLookAt));

        // Handle speech events
        if(currentEvent.speechEvents) {
            currentEvent.speechEvents.forEach(speech => {
                if(speech.index !== undefined) {
                    this.scene.personSystem.makePersonSpeak(
                        speech.group,
                        speech.index,
                        speech.emoji,
                        speech.duration
                    );
                } else {
                    this.scene.personSystem.makeGroupSpeak(
                        speech.group,
                        speech.emoji,
                        speech.duration
                    );
                }
            });
        }

        if(currentEvent.onStart) {
          currentEvent.onStart.call(this, this.scene);
        }
    } // end of first frame of new event

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
        let vec = new THREE.Vector3(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z)
        
        if (currentEvent.camLerpSpeed !== undefined) {
          vec = lookAtTarget.clone().lerp(vec, currentEvent.camLerpSpeed);
          camera.lookAt(vec);
          camera.lookAtTarget = vec;
          this.controls.target.set(vec.x, vec.y, vec.z);
        } else {
          camera.lookAt(lookAtTarget);
          camera.lookAtTarget = lookAtTarget;
          this.controls.target.set(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
        }

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
        case 'appraisers':
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

class TossAnimation {
  constructor(object, startPos, endPos, duration, maxHeight = 5) {
      this.object = object;
      this.startPos = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
      this.endPos = new THREE.Vector3(endPos.x, endPos.y, endPos.z);
      this.duration = duration;
      this.maxHeight = maxHeight;
      this.elapsed = 0;
      this.isComplete = false;
  }

  update(deltaTime) {
      if (this.isComplete) return true;

      this.elapsed += deltaTime;
      const t = Math.min(this.elapsed / this.duration, 1);

      // Linear interpolation for x and z
      const x = this.startPos.x + (this.endPos.x - this.startPos.x) * t;
      const z = this.startPos.z + (this.endPos.z - this.startPos.z) * t;

      // Parabolic arc for y
      // h(t) = h0 * (1-t) + h1 * t + t * (1-t) * maxHeight
      // where h0 is start height, h1 is end height
      const h0 = this.startPos.y;
      const h1 = this.endPos.y;
      const y = h0 * (1-t) + h1 * t + 4 * t * (1-t) * this.maxHeight;

      this.object.position.set(x, y, z);

      if (t >= 1) {
          this.isComplete = true;
          this.object.position.copy(this.endPos);
          return true;
      }
      return false;
  }
}