import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CarPhysics } from './carphysics.js';
import { CameraController } from './camera.js';
import { setupGUI } from './gui.js';
import { checkAndCreateChunks } from './terrain.js';

class Game {
  constructor() {
    this.setupScene();
    this.setupPhysics();
    this.setupCar();
    this.setupGUI();
    this.animate();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    const light = new THREE.DirectionalLight();
    light.position.set(25, 50, 25);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0x404040));
    this.clock = new THREE.Clock();
  }

  setupPhysics() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.groundMaterial = new CANNON.Material('ground');
    this.wheelMaterial = new CANNON.Material('wheel');
  }

  setupCar() {
    this.carPhysics = new CarPhysics(this.scene, this.world);
    this.cameraController = new CameraController(this.camera, this.carPhysics.carMesh);
  }

  setupGUI() {
    setupGUI(this.groundMaterial, this.wheelMaterial, this.carPhysics.carBody, 
             this.carPhysics.wheelBodies, () => this.carPhysics.updateSprings());
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.1);
    
    this.world.step(delta);
    checkAndCreateChunks(this.carPhysics.carBody, this.scene, this.world, this.groundMaterial);
    
    this.carPhysics.update(delta);
    this.cameraController.update(this.carPhysics.wheelForwardVelocity, this.carPhysics.rightVelocity);
    
    this.renderer.render(this.scene, this.camera);
  }
}

new Game();