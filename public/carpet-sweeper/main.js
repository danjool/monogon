import * as THREE from 'three';
import { Carpet } from './carpet.js';
import { CarpetCamera } from './carpet-camera.js';
import { CarpetFlowField } from './carpet-flow-field.js';
import { Sweeper3D } from './sweeper.js';
import { Crosshair } from './crosshair.js';
import { WorldSphere } from './world-sphere.js';
import { InputManager } from './input-manager.js';
import { MenuSystem } from './menu-system.js';
import { InfoPanel } from './info-panel.js';
import { MultiplayerManager } from './multiplayer-manager.js';
import { carpetConfig } from './carpet-config.js';
import { cameraConfig } from './camera-config.js';
import { particlesConfig } from './particles-config.js';
import { visualsConfig } from './visuals-config.js';
import { TurnDebugManager } from './turn-debug-manager.js';
import { TrajectoryPredictor } from './trajectory-predictor.js';

export class CarpetMinesweeperGame {
    constructor() {
        // Store configurations
        this.configs = {
            carpet: carpetConfig,
            camera: cameraConfig,
            particles: particlesConfig,
            visuals: visualsConfig
        };
        
        this.initScene();
        this.initSystems();
        this.lastTime = performance.now();
        this.frameCount = 0;
    }
    
    initScene() {
        // Basic Three.js setup
        this.scene = new THREE.Scene();
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        this.scene.background = new THREE.Color(0x020209);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.logarithmicDepthBuffer = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Setup cameras
        this.setupCameras();
        
        // Create world
        this.createWorld();
        
        // Create carpet
        this.carpet = new Carpet(THREE, this.configs.carpet);
        this.scene.add(this.carpet.mesh);

        this.turnDebugManager = new TurnDebugManager(this.scene, this.carpet, this.configs.visuals);
        
        // Create camera controller
        this.cameraController = new CarpetCamera(
            THREE, 
            this.carpet, 
            this.configs.carpet, 
            this.configs.camera
        );
        this.activeCamera = this.cameraController.carpetCamera;
        
        // Create flow field for carpet trails
        this.flowField = new CarpetFlowField(
            this.scene,
            this.activeCamera,
            this.renderer,
            this.carpet,
            this.configs.particles,
        );
        
        // Create minesweeper game
        this.sweeper = new Sweeper3D(this.scene, {
            position: new THREE.Vector3(0, 0, this.configs.carpet.worldRadius.value - 5000),
            scale: this.configs.visuals.minesweeperScale.value
        }, this.configs.visuals);
        
        // Create crosshair
        this.crosshair = new Crosshair();
    }
    
    initSystems() {
        // Input system
        this.inputManager = new InputManager();
        
        // Menu system  
        this.menuSystem = new MenuSystem(this.configs);
        
        // Info panel
        this.infoPanel = new InfoPanel();
        
        // Multiplayer manager
        this.multiplayerManager = new MultiplayerManager(
            this.scene, 
            this.carpet, 
            this.sweeper, 
            this.configs
        );
        
        // Connect multiplayer to sweeper
        this.sweeper.setMultiplayerManager(this.multiplayerManager);
        this.flowField.setMultiplayerManager(this.multiplayerManager);

        this.trajectoryPredictor = new TrajectoryPredictor(this.scene, this.carpet, this.configs.visuals);
        this.trajectoryPredictor.show();
        
        // Watch for carpet color changes in menu
        this.setupColorChangeWatcher();
        
        // Bind window events
        this.bindWindowEvents();
    }
    
    setupColorChangeWatcher() {
        // Monitor carpet color changes from the menu and sync to multiplayer
        let lastColor = this.carpet.mesh.material.color.getHex();
        
        setInterval(() => {
            const currentColor = this.carpet.mesh.material.color.getHex();
            if (currentColor !== lastColor) {
                lastColor = currentColor;
                if (this.multiplayerManager) {
                    this.multiplayerManager.sendCarpetColor(currentColor);
                }
            }
        }, 1000); // Check every second
    }
    
    setupCameras() {
        // Fixed camera for debug viewing
        const cameraScale = 0.8;
        this.fixedCamera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            1.0, 
            this.configs.carpet.worldRadius.value * 2
        );
        
        this.fixedCamera.position.set(
            this.configs.carpet.worldRadius.value * 0.5 * cameraScale,
            this.configs.carpet.worldRadius.value * 0.5 * cameraScale,
            this.configs.carpet.worldRadius.value * 0.9 * cameraScale
        );
        this.fixedCamera.lookAt(0, 0, 0);
    }
    
    createWorld() {
        // Create world sphere with all world objects
        this.worldSphere = new WorldSphere(this.configs.carpet.worldRadius.value);
        this.scene.add(this.worldSphere.getWorldGroup());
        this.scene.add(this.worldSphere.getBaseAltitudeSphere());
    }
    
    bindWindowEvents() {
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            this.renderer.setSize(width, height);
            
            [this.fixedCamera, this.cameraController.carpetCamera].forEach(camera => {
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            });
        });
    }
    
    processInput(deltaTime) {
        // Update input systems
        this.inputManager.update();
        
        // Get action input for special controls
        const actionInput = this.inputManager.getActionInput();
        
        // Handle camera toggle
        if (actionInput.toggleCamera) {
            this.activeCamera = this.activeCamera === this.fixedCamera ? 
                this.cameraController.carpetCamera : this.fixedCamera;
        }
        
        // Handle reset actions
        if (actionInput.resetCarpet) {
            this.resetCarpet();
        }
        
        // Handle menu input
        const menuInput = this.inputManager.getMenuInput();
        if (menuInput.toggleMenu) {
            this.menuSystem.toggle();
        }
        
        // Handle menu close with B button or Escape
        if (this.menuSystem.isVisible() && menuInput.back) {
            this.menuSystem.hide();
        }
        
        // Route input based on menu visibility
        if (this.menuSystem.isVisible()) {
            this.menuSystem.handleMenuInput(menuInput);
            // Show crosshair but don't process game input
            this.crosshair.hide();
            return { pitch: 0, turn: 0, boost: 0, reverse: 0, cameraYaw: 0, cameraPitch: 0 };
        } else {
            // Show crosshair and process game input normally
            this.crosshair.show();
            
            // Handle minesweeper interaction
            if (actionInput.click) {
                this.sweeper.checkInteraction(this.activeCamera, true);
                this.inputManager.consumeClick();
            }
            
            // Get carpet input
            return this.inputManager.getCarpetInput(deltaTime, this.configs.carpet);
        }
    }
    
    resetCarpet() {
        this.carpet.reset();
        this.cameraController.reset();
    }
    
    applyBoostEffects(input, deltaTime) {
        if (input.boost > 0 || input.reverse > 0) {
            const config = this.configs.carpet;
            
            // Apply deadzone
            let boostInput = Math.max(0, input.boost - config.triggerDeadzone.value);
            let reverseInput = Math.max(0, input.reverse - config.triggerDeadzone.value);
            
            // Normalize after deadzone
            if (boostInput > 0) {
                boostInput = boostInput / (1.0 - config.triggerDeadzone.value);
            }
            if (reverseInput > 0) {
                reverseInput = reverseInput / (1.0 - config.triggerDeadzone.value);
            }
            
            // Apply response curve
            boostInput = Math.pow(boostInput, config.triggerResponseCurve.value);
            reverseInput = Math.pow(reverseInput, config.triggerResponseCurve.value);
            
            // Apply sensitivity and max effect
            const effectiveBoost = boostInput * config.triggerSensitivity.value * config.maxTriggerEffect.value;
            const effectiveReverse = reverseInput * config.triggerSensitivity.value * config.maxTriggerEffect.value;
            
            // Apply to equilibrium altitude
            config.equilibriumAltitude.value += effectiveBoost * config.boostRate.value * deltaTime;
            config.equilibriumAltitude.value -= effectiveReverse * config.boostRate.value * deltaTime;
                
            // Clamp altitude
            config.equilibriumAltitude.value = Math.min(
                Math.max(100, config.equilibriumAltitude.value),
                config.worldRadius.value * 0.9
            );
        }
    }
    
    updateSystems(input, deltaTime) {
        // Update carpet physics
        this.carpet.updatePhysics(deltaTime, input);

        this.turnDebugManager.update();
        
        // Update camera
        this.cameraController.update(input);
        
        // Update flow field
        // get those 8 emission points from the trajectory predictor
        const emissionPoints = this.trajectoryPredictor.getMarkersPositionsForEmissionPoints(8);
        this.flowField.update(deltaTime, emissionPoints, this.frameCount);
        
        // this.flowField.update(deltaTime, this.trajectoryPredictor.emissionPoint, this.frameCount);
        
        // Update minesweeper animations (pass camera for debug cube) and get hit status
        const hasSweeperHit = this.sweeper.update(deltaTime, this.activeCamera);
        
        // Update other players (smooth interpolation)
        if (this.multiplayerManager) {
            this.multiplayerManager.otherPlayers.forEach(player => {
                player.update(deltaTime);
            });
        }
        
        // Update world sphere
        this.worldSphere.updateBaseAltitudeSphere(
            this.configs.carpet.worldRadius.value,
            this.configs.carpet.equilibriumAltitude.value
        );
        
        // Update info panel
        this.infoPanel.update(
            this.carpet,
            this.inputManager.getGamepadInfo().active,
            this.configs.carpet.worldRadius.value,
            this.multiplayerManager ? this.multiplayerManager.getPlayerCount() : 1
        );

        this.trajectoryPredictor.update(deltaTime, input);
        
        // Update crosshair visibility based on sweeper hit detection
        this.crosshair.updateVisibility(hasSweeperHit, Date.now());
    }
    
    checkCollisions() {
        if (this.worldSphere.checkCollision(
            this.carpet.position, 
            this.configs.carpet.worldRadius.value
        )) {
            this.resetCarpet();
        }
    }
    
    calculateDeltaTime() {
        const now = performance.now();
        const deltaTime = this.lastTime ? Math.min(0.1, (now - this.lastTime) / 1000) : 0;
        this.lastTime = now;
        return deltaTime;
    }
    
    animate() {
        const deltaTime = this.calculateDeltaTime();
        this.frameCount++;
        requestAnimationFrame(() => this.animate());
        
        // Process all input
        const input = this.processInput(deltaTime);
        
        // Apply boost effects
        this.applyBoostEffects(input, deltaTime);
        
        // Update all systems
        this.updateSystems(input, deltaTime, this.frameCount);
        
        // Check collisions
        this.checkCollisions();
        
        // Render the scene
        this.renderer.render(this.scene, this.activeCamera);
    }
}

export function init() {
    const game = new CarpetMinesweeperGame();
    game.animate();
}