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
    this.manualMode = false;

    this.defaultCam = { x: -180, y: 40, z: -180 };

    // for reference, the zones after arbitraryFactor are: 10 assembly, 25 tgt1, 35 tgt2, 40 tgt3, 100 presentation area
    this.events = [
      {
        desc: "debug",
        duration: .01,
        cam: { x: -140, y: 9, z: -52 },
        lookAt: "kid1",
        onStart: function(scene) {
          scene.personSystem.movePeople('kids', [
                {x: -115, y: 1, z: 10},
                {x: -125, y: 1, z: 10},
                {x: -120, y: 1, z: 15},
            ],
            .01
          );
          scene.personSystem.movePeople('appraisers', [
            {x: -120, y: 1, z: -10},
            {x: -125, y: 1, z: -10},
            .01
          ]);
        }
    },
    {
        desc: "Overview of Presentation Area",
        duration: 1.,
        cam: { x: 0, y: 460, z: 1 },
        lookAt: { x: 0, y: 0, z: -40 },
        onStart: function(scene) {
            this.textOverlaySystem.addObject3DOverlay('Presentation Area', (new THREE.Object3D()).translateX(-100).translateZ(-160));
            this.textOverlaySystem.addObject3DOverlay('20ftx20ft', (new THREE.Object3D()).translateX(-100).translateZ(-140));
        }
    },
    {
        desc: "Overview of Target Zones",
        duration: 2,
        camLerpSpeed: 0.05,
        cam: { x: 0, y: 160, z: 0 },
        lookAt: { x: 0, y: 0, z: -1 },
        onStart: function(scene) {
            this.textOverlaySystem.removeAll3DOverlays();

            this.textOverlaySystem.addObject3DOverlay('Assembly Zone', (new THREE.Object3D()).translateX(-10).translateZ(-10));
            this.textOverlaySystem.addObject3DOverlay('2\'', (new THREE.Object3D()).translateX(-2).translateZ(7));
            this.textOverlaySystem.addObject3DOverlay('2\'', (new THREE.Object3D()).translateX(-10).translateZ(0));

            this.textOverlaySystem.addObject3DOverlay('Target Zone 1', (new THREE.Object3D()).translateX(-25).translateZ(-25));
            this.textOverlaySystem.addObject3DOverlay('5\'', (new THREE.Object3D()).translateX(-2).translateZ(22));
            this.textOverlaySystem.addObject3DOverlay('5\'', (new THREE.Object3D()).translateX(-25).translateZ(0));

            this.textOverlaySystem.addObject3DOverlay('Target Zone 2', (new THREE.Object3D()).translateX(-35).translateZ(-35));
            this.textOverlaySystem.addObject3DOverlay('7\'', (new THREE.Object3D()).translateX(-2).translateZ(32));
            this.textOverlaySystem.addObject3DOverlay('7\'', (new THREE.Object3D()).translateX(-35).translateZ(0));

            this.textOverlaySystem.addObject3DOverlay('Target Zone 3', (new THREE.Object3D()).translateX(-40).translateZ(-40));
            this.textOverlaySystem.addObject3DOverlay('8\'', (new THREE.Object3D()).translateX(-2).translateZ(37));
            this.textOverlaySystem.addObject3DOverlay('8\'', (new THREE.Object3D()).translateX(-40).translateZ(0));
        }
    },
    {
        desc: "Check in with Appraisers",
        duration: 4.0,
        cam: { x: -120, y: 10, z: 50 },
        lookAt: { x: -90, y: 0, z: -100 },
        camLerpSpeed: 0.05,
        onStart: function(scene) {
            this.textOverlaySystem.removeAll3DOverlays();
            
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
          duration: 10.5,
          camLerpSpeed: 0.05,
          cam: { x: 0, y: 10, z: 100 },
            lookAt: { x: 0, y: 0, z: -100 },
            camLerpSpeed: 0.5,
          onStart: function(scene) {
              this.textOverlaySystem.removeAll3DOverlays();
              scene.personSystem.movePeople('appraisers', [
                  {x: -75, y: 1.0, z: 30},
                  {x: -30, y: 1.0, z: 20}
              ]);

              this.scene.scoringSystem.emitAllScoreParticles();
          }
      },
    //   {
    //     desc: "Are You Ready?",
    //     duration: 2,
    //     cam: this.defaultCam,
    //     lookAt: "appraisers",
    //     onStart: function(scene) {
    //         scene.personSystem.makePersonSpeak('appraisers', 0, '❓', 2);
    //         setTimeout(() => {
    //             scene.personSystem.makeGroupSpeak('kids', '👍', 1);
    //         }, 1000);
    //     }
    // },
    // {
    //     desc: "Time Starts Now!",
    //     duration: 2,
    //     cam: this.defaultCam,
    //     lookAt: "kid1",
    //     onStart: function(scene) {
    //         scene.personSystem.makePersonSpeak('appraisers', 0, '⏱️', 1);
    //     }
    // },
    //   {
    //       desc: "Team Enters with Equipment",
    //       duration: .5,
    //       cam: this.defaultCam,
    //       lookAt: "kid1",
    //       onStart: function(scene) {
    //           scene.personSystem.movePeople('kids', [
    //               {x: -10, y: 5, z: -15}, 
    //               {x: -10, y: 5, z: -5}, 
    //               {x: -10, y: 5, z: -10}
    //           ]);
    //           scene.personSystem.makeGroupSpeak('kids', '🔧', 2);
    //       }
    //   },
    //   {
    //       desc: "Setup Equipment",
    //       duration: .4,
    //       cam: this.defaultCam,
    //       lookAt: "centerOfScene",
    //       onStart: function(scene) {
    //         // toss the other props into the presentation zone, like the two team choice elements
    //         this.startToss(scene.magicWand, scene.magicWand.position, new  THREE.Vector3(-10, 1, 30), 2, 5, 1, 5);
    //         this.startToss(scene.megaphone, scene.megaphone.position, new  THREE.Vector3(-20, 1, 30), 2, 5, 1, 5);

    //         // toss the teacm choice elements
    //         this.startToss(scene.teamChoiceElement1, scene.teamChoiceElement1.position, new  THREE.Vector3(-10, 1, -30), 2, 5, 1, 5);
    //         this.startToss(scene.teamChoiceElement2, scene.teamChoiceElement2.position, new  THREE.Vector3(-20, 1, -30), 2, 5, 1, 5);


    //       }
    //   },
    //   {
    //     desc: "Setup Equipment 2",
    //     duration: .4,
    //     cam: this.defaultCam,
    //     lookAt: "centerOfScene",
    //     onStart: function(scene) {
    //         scene.visualStackables.forEach((mesh, index) => {
    //             this.startToss(mesh, mesh.position, scene.assemblyZone.position, 2, 5);
    //         });

    //         // move kids to presentation area 
    //         scene.personSystem.movePeople('kids', [
    //             {x: -10, y: 1, z: -60},
    //             {x: -10, y: 1, z: 20},
    //             {x: -10, y: 1, z: -80},
    //         ]);
    //     }
    //   },
    //   {
    //       desc: "Story Begins - Wishful Scene",
    //       duration: 50,
    //       cam: { x: 60, y: 40, z: 180 },
    //       lookAt: { x: 30, y: 30, z: 15 },
    //       onStart: function(scene) {

    //         // switch visibility of the stackables
    //         scene.swapStackablesVisibility();

    //           scene.personSystem.makePersonSpeak('kids', 0, '✨', 3);
    //           scene.personSystem.makePersonSpeak('kids', 1, '🌟', 3);
            //   this.particleSystem.emitEmojiParticles(
            //       {x: -10, y: 3, z: -10},
            //       "💫",
            //       3
            //   );
            // instaed Emit score particles at the appropriate moments in your EventSequence
            // setTimeout(() => {
            //     scene.scoringSystem.emitScoreParticle(
            //         'wishfulScene',
            //         new THREE.Vector3(-10, 3, -10)
            //     );
            // }, 500);
    
            // setTimeout(() => {
            //     for (let i = 0; i < 20; i++) { // Creativity points
            //         setTimeout(() => {
            //             scene.scoringSystem.emitScoreParticle(
            //                 'creativity',
            //                 new THREE.Vector3(-10, 3, -10)
            //             );
            //         }, i * 100); // Stagger each point's emission
            //     }
            // }, 1000);
    
            // setTimeout(() => {
            //     for (let i = 0; i < 5; i++) { // Initial storytelling points
            //         setTimeout(() => {
            //             scene.scoringSystem.emitScoreParticle(
            //                 'storytellingStart',
            //                 new THREE.Vector3(-10, 3, -10)
            //             );
            //         }, i * 100);
            //     }
            // }, 1500);
            

            // this.scene.scoringSystem.emitAllScoreParticles();
        //   }
    //   },
    //   {
    //       desc: "Assembly Equipment Activates",
    //       duration: .2,
    //       cam: this.defaultCam,
    //       lookAt: "centerOfScene",
    //       onStart: function(scene) {
    //           this.toggleAttraction(true);
              
    //           scene.personSystem.makeGroupSpeak('kids', '🎯', 2);
    //       }
    //   },
    //   {
    //       desc: "Stack Assembly",
    //       duration: 4,
    //       cam: this.defaultCam,
    //       lookAt: "centerOfScene",
    //       onStart: function(scene) {
    //           scene.personSystem.makePersonSpeak('kids', 0, '🎮', 3);
    //           this.particleSystem.emitEmojiParticles(
    //               {x: 0, y: 2, z: 0},
    //               "⚡",
    //               2
    //           );
    //       }
    //   },
    //   {
    //       desc: "Team Choice Element 1",
    //       duration: 3,
    //       cam: this.defaultCam,
    //       lookAt: "teamChoiceElement1",
    //       onStart: function(scene) {
    //           this.particleSystem.emitEmojiParticles(
    //               {x: 5, y: 2, z: 0},
    //               "🔮",
    //               2
    //           );
    //           scene.personSystem.makePersonSpeak('kids', 1, '🎨', 2);
    //       }
    //   },
    //   {
    //       desc: "Stack Assembly Completes",
    //       duration: 2,
    //       cam: this.defaultCam,
    //       lookAt: "topOfStack",
    //       onStart: function(scene) {
    //           this.particleSystem.emitEmojiParticles(
    //               {x: 0, y: 10, z: 0},
    //               "🎯",
    //               2
    //           );
    //           scene.personSystem.makeGroupSpeak('kids', '🎉', 2);
    //       }
    //   },
    //   {
    //       desc: "Frustration Point",
    //       duration: 3,
    //       cam: this.defaultCam,
    //       lookAt: "kid1",
    //       onStart: function(scene) {
    //           scene.personSystem.makePersonSpeak('kids', 0, '😖', 3);
    //           scene.personSystem.makePersonSpeak('kids', 1, '😟', 3);
    //           scene.personSystem.makePersonSpeak('kids', 2, '😨', 3);
    //           this.particleSystem.emitEmojiParticles(
    //               {x: 0, y: 2, z: 0},
    //               "😖",
    //               1
    //           );
    //       }
    //   },
    //   {
    //     desc: "Destruction Equipment Activates",
    //     duration: 2,
    //     cam: this.defaultCam,
    //     lookAt: "centerOfScene",
    //     onStart: function(scene) {
    //         this.toggleAttraction(false);
            
    //         // Animate black hole expansion and contraction
    //         const blackHole = scene.blackHole;
    //         const expandDuration = 1.0; // seconds
    //         const maxScale = 6.0;
            
    //         // Expansion animation
    //         const expand = () => {
    //             const startScale = 0.1;
    //             let startTime = Date.now();
                
    //             const expandAnimation = () => {
    //                 const elapsed = (Date.now() - startTime) / 1000;
    //                 const progress = Math.min(elapsed / expandDuration, 1);
    //                 const scale = startScale + (maxScale - startScale) * progress;
                    
    //                 blackHole.scale.set(scale, scale, scale);
                    
    //                 if (progress < 1) {
    //                     requestAnimationFrame(expandAnimation);
    //                 } else {
    //                     // Start contraction after expansion
    //                     contract();
    //                 }
    //             };
                
    //             requestAnimationFrame(expandAnimation);
    //         };
            
    //         // Contraction animation
    //         const contract = () => {
    //             const startTime = Date.now();
                
    //             const contractAnimation = () => {
    //                 const elapsed = (Date.now() - startTime) / 1000;
    //                 const progress = Math.min(elapsed / expandDuration, 1);
    //                 const scale = maxScale * (1 - progress);
                    
    //                 blackHole.scale.set(scale, scale, scale);
                    
    //                 if (progress < 1) {
    //                     requestAnimationFrame(contractAnimation);
    //                 }
    //             };
                
    //             requestAnimationFrame(contractAnimation);
    //         };
            
    //         // Start the animation sequence
    //         expand();
            
    //         // Audio-visual feedback for the team
    //         scene.personSystem.makeGroupSpeak('kids', '🌌', 2);
    //     },
    //   },
    //   {
    //       desc: "Stack Destruction",
    //       duration: 5,
    //       cam: this.defaultCam,
    //       lookAt: "centerOfScene"
    //   },
    //   {
    //       desc: "Items Land in Zones",
    //       duration: 3,
    //       cam: this.defaultCam,
    //       lookAt: "centerOfScene",
    //       onStart: function(scene) {
    //           const emissions = [
    //               { pos: {x: -7, y: 0.5, z: -7}, emoji: "🌕", count: 2, lifetime: 5 },
    //               { pos: {x: -5, y: 0.5, z: -5}, emoji: "🌗", count: 2, lifetime: 4 },
    //               { pos: {x: -3, y: 0.5, z: -3}, emoji: "🌘", count: 1, lifetime: 3 }
    //           ];
    //           emissions.forEach(emission => {
    //               this.particleSystem.emitEmojiParticles(
    //                   emission.pos,
    //                   emission.emoji,
    //                   emission.count,
    //                   emission.lifetime
    //               );
    //           });
    //       }
    //   },
    //   {
    //       desc: "Team Choice Element 2",
    //       duration: 4,
    //       cam: this.defaultCam,
    //       lookAt: "teamChoiceElement2",
    //       onStart: function(scene) {
    //           this.particleSystem.emitEmojiParticles(
    //               {x: 5, y: 2, z: 0},
    //               "🎭",
    //               2
    //           );
    //           scene.personSystem.makePersonSpeak('kids', 2, '🎨', 2);
    //       }
    //   },
    //   {
    //       desc: "Story Resolution",
    //       duration: 5,
    //       cam: this.defaultCam,
    //       lookAt: "kid2",
    //       onStart: function(scene) {
    //           scene.personSystem.makeGroupSpeak('kids', '😄', 2);
    //           this.particleSystem.emitEmojiParticles(
    //               {x: 0, y: 2, z: 0},
    //               "😄",
    //               1
    //           );
    //       }
    //   },
    //   {
    //       desc: "Team Calls TIME",
    //       duration: 2,
    //       cam: this.defaultCam,
    //       lookAt: "centerOfScene",
    //       onStart: function(scene) {
    //           scene.personSystem.makeGroupSpeak('kids', '⏰', 1);
    //           this.particleSystem.emitEmojiParticles(
    //               {x: 0, y: 3, z: 0},
    //               "⏰",
    //               1
    //           );
    //       }
    //   },
    //   {
    //       desc: "Appraisers Ask Questions",
    //       duration: 10,
    //       cam: this.defaultCam,
    //       lookAt: "appraisers",
    //       onStart: function(scene) {
    //           scene.personSystem.movePeople('kids', [
    //               {x: 0, y: 0, z: -5}
    //           ]);
    //           scene.personSystem.movePeople('appraisers', [
    //               {x: 0, y: 0, z: 5}
    //           ]);
    //           scene.personSystem.makeGroupSpeak('appraisers', '❓', 3);
    //           this.particleSystem.emitEmojiParticles(
    //               {x: 0, y: 5, z: 0},
    //               "❓",
    //               3
    //           );
    //       }
    //   },
    //   {
    //       desc: "Review Points",
    //       duration: 5,
    //       cam: this.defaultCam,
    //       lookAt: "centerOfScene",
    //       onStart: function(scene) {
    //           scene.personSystem.makeGroupSpeak('appraisers', '🏆', 2);
    //           this.particleSystem.emitEmojiParticles(
    //               {x: 0, y: 5, z: 0},
    //               "🏆",
    //               3
    //           );
    //       }
    //   }
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
    
    if(!this.manualMode) {
        this.eventTimer += deltaTime;
        this.particleCooldown -= deltaTime;
    }
    document.addEventListener('keydown', (e) => {
        if(e.code === 'Space') {
            console.log('Space pressed - next event');
            this.manualMode = true;
            this.currentEventIndex = (this.currentEventIndex + 1) % this.events.length;
            this.eventTimer = 0;
            currentEvent = this.events[this.currentEventIndex];
        }
        if(e.code === 'KeyA') {
            console.log('A pressed - auto mode');
            this.manualMode = false;
        }
    });

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

    if(currentEvent.camLerpSpeed !== undefined && currentEvent.cam) {
        camera.position.lerp(
            new THREE.Vector3(currentEvent.cam.x, currentEvent.cam.y, currentEvent.cam.z), 
            currentEvent.camLerpSpeed
        );
    } else if(currentEvent.cam) {
        camera.position.set(currentEvent.cam.x, currentEvent.cam.y, currentEvent.cam.z);
    }

  // Handle lookAt target
  const lookAtTarget = this.getLookAtTarget(currentEvent.lookAt);
  if (lookAtTarget) {
    // Store the lookAt target for controls
    this.currentLookAtTarget = lookAtTarget;
    
    if (currentEvent.camLerpSpeed !== undefined) {
      // If we're lerping the camera, also lerp the lookAt
      if (!this.lastLookAtTarget) {
        this.lastLookAtTarget = lookAtTarget.clone();
      }
      
      this.lastLookAtTarget.lerp(lookAtTarget, currentEvent.camLerpSpeed);
      camera.lookAt(this.lastLookAtTarget);
      this.controls.target.copy(this.lastLookAtTarget);
    } else {
      // Immediate lookAt
      camera.lookAt(lookAtTarget);
      this.controls.target.copy(lookAtTarget);
      this.lastLookAtTarget = lookAtTarget.clone();
    }
  }

  // Important: Update controls after changing target
  this.controls.update();
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