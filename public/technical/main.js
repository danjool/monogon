// main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Scene } from './Scene.js';
import { ParticleSystem } from './ParticleSystem.js';
import { EventSequence } from './EventSequence.js';
import { PhysicsWorker } from './PhysicsWorker.js';
import { TextOverlaySystem } from './TextOverlaySystem.js';

export class Main {
    constructor() {
        this.scene = new Scene();
        this.particleSystem = new ParticleSystem(this.scene);
        this.scene.personSystem.setParticleSystem(this.particleSystem);
        this.physicsWorker = new PhysicsWorker();
        this.clock = new THREE.Clock();
        
        this.init();
        this.eventSequence = new EventSequence(this.particleSystem, this.scene, this.physicsWorker, this.controls, this.renderer, this.camera);
        this.createTextOverlays();
        this.animate();
      }

  init() {
    this.initRenderer();
    this.initCamera();
    this.controls = this.initControls();
    this.initStats();
    this.initEventListeners();
    this.textOverlaySystem = new TextOverlaySystem(this.scene, this.camera, this.renderer);
  }

  createTextOverlays() {
    this.textOverlaySystem.addFixedOverlay('Tech Challenge Simulation', 10, 10, {
      fontSize: '20px',
      fontWeight: 'bold',
      textAlign: 'left',
      width: '300px',
    });

    // Add an overlay for each box
    // this.scene.meshes.forEach((mesh, index) => {
    //   this.textOverlaySystem.addObject3DOverlay(`Box ${index + 1}`, mesh, { x: 0, y: -30 });
    // });

    // Add an overlay for the current event
    this.currentEventOverlay = this.textOverlaySystem.addFixedOverlay('', 10, 120, {
        fontSize: '16px',
        textAlign: 'left',
        width: '300px',
    });
  }


  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(this.scene.fog.color);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.sortObjects = true;
    document.body.appendChild(this.renderer.domElement);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.5, 10000);
    // this.camera.position.set(Math.cos(Math.PI / 5) * 170, 15, Math.sin(Math.PI / 5) * 30);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.dampingFactor = 0.3;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;
    // to set an orbit controlled camera to "look at a thing", set the target:
    // this.controls.target.set(0, 0, 0);
    return this.controls;
  }

  initStats() {
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
    // hide initially
    this.stats.dom.style.display = 'none';
  }

  initEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onKeyDown(event) {
    if (event.key === 't') {
      this.toggleAttraction();
    }
  }

  toggleAttraction() {
    this.physicsWorker.toggleAttraction();
    this.scene.toggleAttractionVisuals();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();

    this.updatePhysics();
    
    this.particleSystem.update(deltaTime);
    this.scene.update(deltaTime);
    this.eventSequence.update(deltaTime, this.camera, this.scene, this.particleSystem);  // Pass particleSystem here
    if(this.scene.camera && this.scene.camera.lookAtTarget) {
        this.controls.target.set(this.scene.camera.lookAtTarget.x, this.scene.camera.lookAtTarget.y, this.scene.camera.lookAtTarget.z);
    }    
    this.controls.update();

    this.textOverlaySystem.update();

    this.renderer.render(this.scene, this.camera);
    this.stats.update();
  }

  updatePhysics() {
    this.physicsWorker.update().then(data => {
      this.scene.updateMeshes(data.positions, data.quaternions);
      // this.particleSystem.updateFromPhysics(data.emojiCounts); // currently invisible physics boxes sit next to assembly zone
    });
  }
}