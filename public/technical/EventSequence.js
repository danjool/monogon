// EventSequence.js
import * as THREE from 'three';
import { TextOverlaySystem } from './TextOverlaySystem.js';

/**
 * Story Begins: move text to left
 * Teach Choice Element 1: move labels to bottom
 */

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

    document.addEventListener('keydown', (e) => {
      if(e.code === 'Space') {
          console.log('Space pressed - next event');
          this.manualMode = true;
          this.currentEventIndex = (this.currentEventIndex + 1) % this.events.length;
          this.clearActiveTimeouts();
          this.eventTimer = 0;
      }
      if(e.code === 'KeyA') {
          console.log('A pressed - auto mode');
          this.manualMode = false;
      }
    });

    this.activeTimeouts = new Set();

    // for reference, the zones after arbitraryFactor are: 10 assembly, 25 tgt1, 35 tgt2, 40 tgt3, 100 presentation area
    this.events = [
      {
        desc: "debug",
        duration: .00001,
        cam: { x: -140, y: 9, z: -52 },
        lookAt: "kid1",
        onStart: function(scene) {

          scene.resetProps();

          scene.personSystem.movePeople('kids', [
                {x: -115, y: 1, z: 17},
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

          // this.scene.scoringSystem.emitAllScoreParticles();
          this.scene.scoringSystem.clearScores()

          // reset the stackables
          scene.visualStackables.forEach((mesh, index) => {
            mesh.position.set(-110, 0, index * .5 * 2.1);
          });
        }
    },
    {
        desc: "Overview of Presentation Area",
        duration: 4,
        cam: { x: 0, y: 460, z: 1 },
        lookAt: { x: 0, y: 0, z: -40 },
        onStart: function(scene) {
            this.textOverlaySystem.addObject3DOverlay('Presentation Area', (new THREE.Object3D()).translateX(-100).translateZ(-160));
            this.textOverlaySystem.addObject3DOverlay('20ftx20ft', (new THREE.Object3D()).translateX(-100).translateZ(-140));
        }
    },
    {
        desc: "Overview of Target Zones",
        duration: 4,
        camLerpSpeed: 0.05,
        cam: { x: 0, y: 160, z: 0 },
        lookAt: { x: 0, y: 0, z: -1 },
        onStart: function(scene) {
            this.textOverlaySystem.removeAll3DOverlays();

            this.textOverlaySystem.addObject3DOverlay('Assembly Zone', (new THREE.Object3D()).translateX(-10).translateZ(-10));
            this.textOverlaySystem.addObject3DOverlay('2\'', (new THREE.Object3D()).translateX(-2).translateZ(6));
            this.textOverlaySystem.addObject3DOverlay('2\'', (new THREE.Object3D()).translateX(-10).translateZ(0));

            this.textOverlaySystem.addObject3DOverlay('Target Zone 1', (new THREE.Object3D()).translateX(-25).translateZ(-25));
            this.textOverlaySystem.addObject3DOverlay('5\'', (new THREE.Object3D()).translateX(-2).translateZ(21));
            this.textOverlaySystem.addObject3DOverlay('5\'', (new THREE.Object3D()).translateX(-25).translateZ(0));

            this.textOverlaySystem.addObject3DOverlay('Target Zone 2', (new THREE.Object3D()).translateX(-35).translateZ(-35));
            this.textOverlaySystem.addObject3DOverlay('7\'', (new THREE.Object3D()).translateX(-2).translateZ(31));
            this.textOverlaySystem.addObject3DOverlay('7\'', (new THREE.Object3D()).translateX(-35).translateZ(0));

            this.textOverlaySystem.addObject3DOverlay('Target Zone 3', (new THREE.Object3D()).translateX(-40).translateZ(-40));
            this.textOverlaySystem.addObject3DOverlay('8\'', (new THREE.Object3D()).translateX(-2).translateZ(36));
            this.textOverlaySystem.addObject3DOverlay('8\'', (new THREE.Object3D()).translateX(-40).translateZ(0));

            this.textOverlays.push(
              this.textOverlaySystem.addFixedOverlay('Stackables receive 1/2, 1, or 2 points for coming to rest in Target Zones', 10, 200, {
                  fontSize: '16px',
                  width: '300px',
              })
            )
        }
    },
    {
        desc: "Check in with Appraisers",
        duration: 8.0,
        cam: { x: -160, y: 10, z: 50 },
        lookAt: { x: -40, y: 0, z: -100 },
        camLerpSpeed: 0.05,
        onStart: function(scene) {
            this.textOverlaySystem.removeAll3DOverlays();
            
            // use this.scene.personSystem.makeGroupLookAt to get the kids and appraisers to look at the camera
            scene.personSystem.makeGroupLookAt('kids', {x: -160, y: 10, z: 50});
            scene.personSystem.makeGroupLookAt('appraisers', {x: -160, y: 10, z: 50});

            // Conversation sequence
            this.setManagedTimeout(() => {
                scene.personSystem.makePersonSpeak('appraisers', 0, '📋', 2);
                scene.personSystem.makePersonSpeak('appraisers', 1, '❓', 2);
                this.textOverlays.push(
                  this.textOverlaySystem.addFixedOverlay('Team and Appraisers review the Challenge items, ensuring all props, parts and persons are valid', 10, 250, {
                      fontSize: '16px',
                      width: '550px',
                  })
                )
            }, 1000);
            
            this.setManagedTimeout(() => {
                scene.personSystem.makePersonSpeak('kids', 0, '📏', 2); // measuring
                scene.personSystem.makePersonSpeak('kids', 1, '⚖️', 2); // weights
                scene.personSystem.makePersonSpeak('kids', 2, '✅', 2); // confirmation
            }, 4000);

            
        }
    },
      {
          desc: "Prepare Outside Presentation Area",
          duration: 3,
          cam: { x: -150, y: 10, z: 20 },
          lookAt: { x: 40, y: 0, z: 0 },
          camLerpSpeed: 0.05,
          onStart: function(scene) {
              this.textOverlaySystem.removeAll3DOverlays();
              scene.personSystem.movePeople('appraisers', [
                  {x: -75, y: 1.0, z: 30},
                  {x: -30, y: 1.0, z: 20}
              ]);

              scene.personSystem.makeGroupLookAt('audience', {x: -150, y: 10, z: 20});
          }
      },
      {
        desc: "Are You Ready?",
        duration: 3,
        cam: { x: -150, y: 10, z: 20 },
        lookAt: { x: 40, y: 0, z: 0 },
        lookAt: "appraisers",
        onStart: function(scene) {
            scene.personSystem.makePersonSpeak('appraisers', 0, '❓', 2);
            this.setManagedTimeout(() => {
                scene.personSystem.makeGroupSpeak('kids', '👍', 1);
            }, 1000);
        }
    },
    {
        desc: "Time Starts Now!",
        duration: 3,
        cam: { x: -150, y: 10, z: 20 },
        lookAt: { x: 40, y: 0, z: 0 },
        onStart: function(scene) {
            scene.personSystem.makePersonSpeak('appraisers', 0, '⏱️', 1);
        }
    },
      {
        desc: "Team Enters with Equipment",
          duration: 4,
          cam: { x: -150, y: 10, z: 20 },
          lookAt: { x: 40, y: 0, z: 0 },
          onStart: function(scene) {

            scene.personSystem.movePeople('kids', [
                {x: -10, y: 1, z: -15}, 
                {x: -10, y: 1, z: -5}, 
                {x: -10, y: 1, z: -10}
            ]);
            scene.personSystem.makeGroupSpeak('kids', '🔧', 2);
            // toss the other props into the presentation zone, like the two team choice elements
            this.startToss(scene.magicWand, scene.magicWand.position, new  THREE.Vector3(10, 1, -50), 2, 5, 1, 5);
            this.startToss(scene.megaphone, scene.megaphone.position, new  THREE.Vector3(-10, 1, -50), 2, 5, 1, 5);

            // toss the teacm choice elements
            this.startToss(scene.teamChoiceElement1, scene.teamChoiceElement1.position, new  THREE.Vector3(-10, 1, -45), 2, 5, 1, 5);
            this.startToss(scene.teamChoiceElement2, scene.teamChoiceElement2.position, new  THREE.Vector3(-20, 1, -45), 2, 5, 1, 5);

            // toss the teamSign
            this.startToss(scene.teamSign, scene.teamSign.position, new  THREE.Vector3(-54, 1, 10), 2, 5, 1, 5);

            scene.visualStackables.forEach((mesh, index) => {
              // this.startToss(mesh, mesh.position, scene.assemblyZone.position, 2, 5);
              this.startToss(mesh, mesh.position, 
                {
                  x: -5 + Math.random() * 10,
                  y: 1,
                  z: -5 + Math.random() * 10
                }, 2, 5);
            });
          }
      },
      {
        desc: "Story Begins - Wishful Scene",
        duration: 10,
        cam: { x: -28, y: 16, z: 80 },
        lookAt: { x: -28, y: 8, z: -20 },
        camLerpSpeed: 0.05,
        onStart: function(scene) {
          scene.personSystem.makeGroupLookAt('audience', {x: 0, y: 0, z: 0});

          scene.swapStackablesVisibility();

          scene.personSystem.movePeople('appraisers', [
            {x: -30, y: 1.0, z: -20},
            {x: -30, y: 1.0, z: 20},
            .01
          ]);

          scene.personSystem.makePersonSpeak('kids', 0, '✨', 3);
          scene.personSystem.makePersonSpeak('kids', 1, '🌟', 3);

          for (let i = 0; i < 4; i++) {
            this.setManagedTimeout(() => {
              scene.personSystem.makePeoplePirouette('kids', [
                {x: -10 + 5 * Math.cos(i * Math.PI / 2), y: 1, z: -10 + 5 * Math.sin(i * Math.PI / 2)},
                {x: -10 + 5 * Math.cos(i * Math.PI / 2 + Math.PI / 2), y: 1, z: -10 + 5 * Math.sin(i * Math.PI / 2 + Math.PI / 2)},
                {x: -10 + 5 * Math.cos(i * Math.PI / 2 + Math.PI), y: 1, z: -10 + 5 * Math.sin(i * Math.PI / 2 + Math.PI)},
              ], 2.0);
            }, i * 2000);
          }

          this.setManagedTimeout(() => {
            scene.scoringSystem.emitScoreParticles(
                'wishfulScene',
                scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                15
            );
           
          this.textOverlays.push(
              this.textOverlaySystem.addFixedOverlay('A wishful scene was memorable! 15 points', 10, 200, { width: '300px' })
            )
          }, 6000);

          this.setManagedTimeout(() => {
            scene.scoringSystem.emitScoreParticles(

                'creativity',
                scene.personSystem.getAppraisers()[1].getSpeechPosition(),
                20
            );
            this.textOverlays.push(
              this.textOverlaySystem.addFixedOverlay('A THING lacked, Creatively told! 20 points', 10, 250, { width: '300px',})
            )
          }, 7000);

          this.setManagedTimeout(() => {
            scene.scoringSystem.emitScoreParticles(
                'storytellingStart',
                scene.personSystem.getAppraisers()[1].getSpeechPosition(),
                5
            );
            this.textOverlays.push(
              this.textOverlaySystem.addFixedOverlay('Storytelling is Clear and Effective! 5 points', 10, 300, { width: '300px',})
            )
          }, 8000);            
          }
      },
      {
          desc: "Assembly Equipment Activates",
          duration: 8,
          onStart: function(scene) {
            this.toggleAttraction(true);
              
            scene.personSystem.makeGroupSpeak('kids', '🎯', 2);

            this.setManagedTimeout(() => {
              scene.scoringSystem.emitScoreParticles(
                  'assemblyDesign',
                  scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                  15
              );
              this.textOverlays.push(
                this.textOverlaySystem.addFixedOverlay('Design Assembly is well done! 15 points', 20, 200, { width: '300px' })
              )
            }, 2000);

            this.setManagedTimeout(() => {
              scene.scoringSystem.emitScoreParticles(
                  'assemblyInnovation',
                  scene.personSystem.getAppraisers()[1].getSpeechPosition(),
                  15
              );
              this.textOverlays.push(
                this.textOverlaySystem.addFixedOverlay('Innovation Assembly is well done! 15 points', 20, 250, { width: '300px' })
              )
            }, 4000);
          }
      },
      {
          desc: "Team signals completion of Stack Assembly",
          duration: 3,
          onStart: function(scene) {
              scene.personSystem.makeGroupSpeak('kids', '✅', 2);

              this.setManagedTimeout(() => {
                  scene.scoringSystem.emitScoreParticles(
                      'stackableRisk',
                      scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                      30
                  );
                  this.textOverlays.push(
                    this.textOverlaySystem.addFixedOverlay('Stackables least risky shape! 30 points', 20, 300, { width: '300px' })
                  )
              }, 1000);

              this.setManagedTimeout(() => {
                scene.scoringSystem.emitScoreParticles(
                    'stackRisk',
                    scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                    30
                );
                this.textOverlays.push(
                  this.textOverlaySystem.addFixedOverlay('Stacked one atop another! 30 points', 20, 350, { width: '300px' })
                )
            }, 2000);
          }
      },
      {
          desc: "Team Choice Element 1",
          duration: 4,
          cam: { x: -20, y: 1, z: -25 },
          lookAt: { x: -20, y: 4, z: -45 },
          camLerpSpeed: 0.05,
          onStart: function(scene) {

            // move kids around the team choice element 1
            scene.personSystem.movePeople('kids', [
                {x: -15, y: 1, z: -45}, 
                {x: -25, y: 1, z: -45}, 
                {x: -25, y: 1, z: -40}
            ]);
            // move appraisers behind the kids
            scene.personSystem.movePeople('appraisers', [
                {x: -10, y: 1, z: -60},
                {x: -20, y: 1, z: -60}
            ]);

            scene.personSystem.makePersonSpeak('kids', 1, '🎨', 2);            
            this.setManagedTimeout(() => {
                scene.scoringSystem.emitScoreParticles(
                    'teamChoice1',
                    scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                    10
                );
                this.textOverlays.push(
                  this.textOverlaySystem.addFixedOverlay('Creativity and Originality! 10 points', 10, 580, {width: '300px'})
                )
            }, 1000);

            this.setManagedTimeout(() => {
                scene.scoringSystem.emitScoreParticles(
                    'teamChoice1',
                    scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                    10
                );
                this.textOverlays.push(
                  this.textOverlaySystem.addFixedOverlay('Quality, Workmanship, or Effort! 10 points', 320, 580, {width: '300px'})
                )
            }, 2000);

            this.setManagedTimeout(() => {
                scene.scoringSystem.emitScoreParticles(
                    'teamChoice1',
                    scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                    10
                );
                this.textOverlays.push(
                  this.textOverlaySystem.addFixedOverlay('Integration into the Presentation! 10 points', 640, 580, {width: '400px'})
                )
            }, 3000);

          }
      },
      {
          desc: "Frustration Point",
          duration: 4,
          cam: { x: -20, y: 8, z: 45 },
          lookAt: { x: -20, y: 8, z: -45 },
          camLerpSpeed: 0.05,
          onStart: function(scene) {
              scene.personSystem.makePersonSpeak('kids', 0, '😖', 3);
              scene.personSystem.makePersonSpeak('kids', 1, '😟', 3);
              scene.personSystem.makePersonSpeak('kids', 2, '😨', 3);

              this.setManagedTimeout(() => {
                scene.scoringSystem.emitScoreParticles(
                    'storytellingMiddle',
                    scene.personSystem.getAppraisers()[1].getSpeechPosition(),
                    5
                );
                this.textOverlays.push(
                  this.textOverlaySystem.addFixedOverlay('Storytelling is Clear and Effective! 5 points', 20, 480, {width: '300px' })
                )
              }, 1000);

              this.setManagedTimeout(() => {
                scene.scoringSystem.emitScoreParticles(
                    'frustrationPoint',
                    scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                    15
                );
                this.textOverlays.push(
                  this.textOverlaySystem.addFixedOverlay('Dramatic Impact of Frustration Point! 15 points', 20, 400, {width: '300px' })
                )
              }, 2000);

              scene.personSystem.movePeople('kids', [
                  {x: -15, y: 1, z: -25}, 
                  {x: -25, y: 1, z: -35}, 
                  {x: -25, y: 1, z: -30}
              ]);
              
              scene.personSystem.makePersonHoldObject('kids', 0, scene.megaphone);
          }
      },
      {
        desc: "Destruction Equipment Activates",
        duration: 6,
        cam: { x: -20, y: 10, z: 80 },
        lookAt: { x: -20, y: 11, z: -20 },
        onStart: function(scene) {
            this.toggleAttraction(false);
            
            const blackHole = scene.blackHole;
            const expandDuration = 1.0; // seconds
            const maxScale = 10.0;
            
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
            
            const contract = () => {
                const startTime = Date.now();
                
                const contractAnimation = () => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const progress = Math.min(elapsed / expandDuration, 1);
                    const scale = maxScale * (1 - progress);
                    
                    blackHole.position.set(0, 0, 0);
                    blackHole.scale.set(scale, scale, scale);
                    
                    if (progress < 1) {
                        requestAnimationFrame(contractAnimation);
                    }
                };
                
                requestAnimationFrame(contractAnimation);
            };
            
            expand();
            
            scene.personSystem.makeGroupSpeak('kids', '🌌', 2);

            this.setManagedTimeout(() => {
                scene.scoringSystem.emitScoreParticles(
                    'destructionDesign',
                    scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                    15
                );
                this.textOverlays.push(
                  this.textOverlaySystem.addFixedOverlay('Destruction Equipment, Technically Designed: 15 points', 20, 280, {width: '550px'})
                )
            }, 1000);

            this.setManagedTimeout(() => {
                scene.scoringSystem.emitScoreParticles(
                    'destructionInnovation',
                    scene.personSystem.getAppraisers()[1].getSpeechPosition(),
                    15
                );
                this.textOverlays.push(
                  this.textOverlaySystem.addFixedOverlay('Innovative Destruction! 15 points', 20, 380, {width: '550px'})
                )
            }, 2000);

            this.setManagedTimeout(() => {
              scene.personSystem.makePersonReleaseObject('kids', 0); // drop that megaphone
            }, 5000);
        },
      },
      {
          desc: "S'pose Items Come to Rest in Zones",
          duration: 3,
          onStart: function(scene) {
              scene.swapStackablesVisibility(true);

              // Toss all visual stackables along a spread
              scene.visualStackables.forEach((mesh, index) => {
                  this.startToss(mesh, mesh.position, 
                    {
                        x: -43.5 + index * 2.1, y: .5, z: 0
                    }, 2, 5);
              });
          }
      },
      {
          desc: "Team signals end of Stack Destruction",
          duration: 3,
          onStart: function(scene) {
              scene.personSystem.makeGroupSpeak('kids', '🔚', 2);
          }
      },
      {
          desc: "No Points are allocated to Stackables in the Assembly Zone",
          duration: 6,
          camLerpSpeed: 0.5,
          cam: { x: -2, y: 5, z: 40 },
          lookAt: { x: 2, y: 0, z: 0 },
          onStart: function(scene) {           
            this.textOverlaySystem.addObject3DOverlay('0', scene.visualStackables[17], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('0', scene.visualStackables[18], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('0', scene.visualStackables[19], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('0', scene.visualStackables[16], { x: 0, y: 20 });
          }
      },
      {
          desc: "1/2 Points are allocated to Stackables in Target Zone 1",
          duration: 6,
          camLerpSpeed: 0.5,
          cam: { x: -20, y: 5, z: 40 },
          lookAt: { x: -20, y: 0, z: 0 },
          onStart: function(scene) {
            // 16 to 12
            this.textOverlaySystem.addObject3DOverlay('1/2', scene.visualStackables[9], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('1/2', scene.visualStackables[10], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('1/2', scene.visualStackables[11], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('1/2', scene.visualStackables[12], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('1/2', scene.visualStackables[13], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('1/2', scene.visualStackables[14], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('1/2', scene.visualStackables[15], { x: 0, y: 20 });           

          }
      },
      {
          desc: "1 Point is allocated to Stackables in Target Zone 2",
          duration: 6,
          camLerpSpeed: 0.5,
          cam: { x: -30, y: 5, z: 40 },
          lookAt: { x: -30, y: 0, z: 0 },
          onStart: function(scene) {
            this.textOverlaySystem.addObject3DOverlay('1', scene.visualStackables[8], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('1', scene.visualStackables[7], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('1', scene.visualStackables[6], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('1', scene.visualStackables[5], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('1', scene.visualStackables[4], { x: 0, y: 20 });
          }
      },
      {
        desc: "2 Points are allocated to Stackables in Target Zone 3",
        duration: 6,
        camLerpSpeed: 0.5,
        cam: { x: -37, y: 5, z: 40 },
        lookAt: { x: -37, y: 0, z: 0 },
        onStart: function(scene) {
            this.textOverlaySystem.addObject3DOverlay('2', scene.visualStackables[3], { x: 0, y: 20 });
            this.textOverlaySystem.addObject3DOverlay('2', scene.visualStackables[2], { x: 0, y: 20 });
        }
      },
      {
        desc: "0 Points are allocated to Stackables beyond Target Zone 3",
        duration: 6,
        camLerpSpeed: 0.5,
        cam: { x: -43, y: 5, z: 40 },
        lookAt: { x: -43, y: 0, z: 0 },
        onStart: function(scene) {
          this.textOverlaySystem.addObject3DOverlay('0', scene.visualStackables[0], { x: 0, y: 20 });
          this.textOverlaySystem.addObject3DOverlay('0', scene.visualStackables[1], { x: 0, y: 20 });
        }
      },
      {
        desc: "A Stackable resting in two zones is awarded the lower point value",
        duration: 6,
        camLerpSpeed: 0.5,
        cam: { x: -35, y: 5, z: 40 },
        lookAt: { x: -35, y: 0, z: 0 },
        onStart: function(scene) {
          this.textOverlaySystem.removeAll3DOverlays();
          this.textOverlaySystem.addObject3DOverlay('1', scene.visualStackables[4], { x: 0, y: 20 });
        }
      },
      
      {
          desc: "Team Choice Element 2",
          duration: 4,
          cam: { x: -43, y: 5, z: 40 },
          lookAt: { x: -43, y: 0, z: 0 },
          onStart: function(scene) {
              this.textOverlaySystem.removeAll3DOverlays();
              scene.personSystem.makePersonSpeak('kids', 2, '🎨', 2);

              this.setManagedTimeout(() => {
                  scene.scoringSystem.emitScoreParticles(
                      'teamChoice2',
                      scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                      10
                  );
                  this.textOverlays.push(
                    this.textOverlaySystem.addFixedOverlay('Creativity and Originality! 10 points', 600, 380, { width: '550px' })
                  )
              }, 1000);

              this.setManagedTimeout(() => {
                  scene.scoringSystem.emitScoreParticles(
                      'teamChoice2',
                      scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                      10
                  );
                  this.textOverlays.push(
                    this.textOverlaySystem.addFixedOverlay('Quality, Workmanship, or Effort! 10 points', 600, 480, { width: '550px' })
                  )
              }, 2000);

              this.setManagedTimeout(() => {
                  scene.scoringSystem.emitScoreParticles(
                      'teamChoice2',
                      scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                      10
                  );
                  this.textOverlays.push(
                    this.textOverlaySystem.addFixedOverlay('Integration into the Presentation! 10 points', 600, 580, { width: '550px' })
                  )
              }, 3000);
          }
      },
      {
          desc: "Story Resolution",
          duration: 8,
          cam: { x: -20, y: 10, z: 80 },
          lookAt: "kid1",
          onStart: function(scene) {
              // another multikid dance
              for (let i = 0; i < 4; i++) {
                this.setManagedTimeout(() => {
                  scene.personSystem.makePeoplePirouette('kids', [
                    {x: -10 + 5 * Math.cos(i * Math.PI / 2), y: 1, z: -10 + 5 * Math.sin(i * Math.PI / 2)},
                    {x: -10 + 5 * Math.cos(i * Math.PI / 2 + Math.PI / 2), y: 1, z: -10 + 5 * Math.sin(i * Math.PI / 2 + Math.PI / 2)},
                    {x: -10 + 5 * Math.cos(i * Math.PI / 2 + Math.PI), y: 1, z: -10 + 5 * Math.sin(i * Math.PI / 2 + Math.PI)},
                  ], 2.0);
                }, i * 2000);
              }

              this.setManagedTimeout(() => {
                scene.scoringSystem.emitScoreParticles(
                    'storytellingEnd',
                    scene.personSystem.getAppraisers()[1].getSpeechPosition(),
                    5
                );
                this.textOverlays.push(
                  this.textOverlaySystem.addFixedOverlay('Storytelling is Clear and Effective! 5 points', 20, 480, {width: '550px' })
                )
              }, 1000);
          }
      },
      {
          desc: "Team Calls TIME",
          duration: 2,
          cam: { x: 0, y: 10, z: 100 },
          lookAt: "centerOfScene",
          onStart: function(scene) {
              scene.personSystem.makeGroupSpeak('kids', '⏰', 9);
          }
      },
      {
          desc: "Appraisers Ask Questions",
          duration: 6,
          cam: { x: -20, y: 10, z: 80 },
          lookAt: { x: -20, y: 20, z: -20 },
          onStart: function(scene) {
              scene.personSystem.movePeople('kids', [
                {x: 0, y: 0, z: -5},
                {x: 0, y: 0, z: -15},
                {x: 0, y: 0, z: -10}
              ]);
              scene.personSystem.movePeople('appraisers', [
                  {x: 0, y: 0, z: 5}
              ]);
              scene.personSystem.makeGroupSpeak('appraisers', '❓', 9);
          }
      },
      {
          desc: "Review Points",
          duration: 10,
          cam: { x: -20, y: 10, z: 80 },
          lookAt: { x: -20, y: 20, z: -20 },
          camLerpSpeed: 0.05,
          onStart: function(scene) {
              scene.personSystem.makeGroupSpeak('appraisers', '🏆', 2);

              this.setManagedTimeout(() => {
                scene.scoringSystem.emitScoreParticles(
                    'instantChallenge',
                    scene.personSystem.getAppraisers()[0].getSpeechPosition(),
                    100
                );
                this.textOverlays.push(
                  this.textOverlaySystem.addFixedOverlay('Instant Challenge! 100 points', 10, 380, { width: '300px' })
                )
              }, 1000);
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

    setManagedTimeout(callback, delay) {
        const timeoutId = setTimeout(() => {
            callback();
            this.activeTimeouts.delete(timeoutId);
        }, delay);
        this.activeTimeouts.add(timeoutId);
        return timeoutId;
    }

    clearActiveTimeouts() {
        this.activeTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.activeTimeouts.clear();
    }

  update(deltaTime, camera) {
    this.textOverlaySystem.update();
    this.tossAnimations = this.tossAnimations.filter(toss => !toss.update(deltaTime));
    let currentEvent = this.events[this.currentEventIndex];
    
    
    this.eventTimer += deltaTime;
    this.particleCooldown -= deltaTime;

    if(deltaTime === this.eventTimer || 0 === this.eventTimer) { // First frame of new event
        if (currentEvent.desc){
          
          this.textOverlays.forEach(overlay => {
            if(overlay.type === 'fixed') this.textOverlaySystem.removeOverlay(overlay);
          });
          
          const element = this.textOverlaySystem.addFixedOverlay(`  ${currentEvent.desc}`, 10, 60, {
              fontSize: '16px',
              width: '300px',
          });
          this.textOverlays.push(element);

        }

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

        if(currentEvent.cam) {
          this.scene.personSystem.makeGroupLookAt('kids', {x: currentEvent.cam.x, y: currentEvent.cam.y, z: currentEvent.cam.z});
          this.scene.personSystem.makeGroupLookAt('appraisers', {x: currentEvent.cam.x, y: currentEvent.cam.y, z: currentEvent.cam.z});
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

  emitScoreParticles(scene, category, position, points, message) {
    scene.scoringSystem.emitScoreParticles(category, position, points);
    return scene.textOverlaySystem.addFixedOverlay(message, 600, 380, {
        fontSize: '24px',
        width: '550px'
    });
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