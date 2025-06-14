import * as THREE from 'three';

export class TrajectoryPredictor {
    constructor(scene, carpet, visualsConfig) {
        this.scene = scene;
        this.carpet = carpet; // Reference to real carpet to call its methods
        this.visualsConfig = visualsConfig;
        
        // Prediction parameters (now configurable)
        this.predictionSteps = this.visualsConfig ? this.visualsConfig.predictionSteps.value : 1000;
        this.markerInterval = this.visualsConfig ? this.visualsConfig.markerInterval.value : 20;
        this.maxMarkers = Math.floor(this.predictionSteps / this.markerInterval);
        
        // Visual markers - simple green emissive spheres
        this.markers = [];
        this.noInputMarkers = [];
        this.createMarkerPool();

        this.emissionPoint = new THREE.Vector3(); // Optional location to emit particles from

        // Phantom state to simulate forward without affecting real carpet
        this.phantomCarpet = null;
    }
    
    createMarkerPool() {
        const geometry = new THREE.SphereGeometry(1, 4, 6);
        const markerOpacity = this.visualsConfig ? this.visualsConfig.markerOpacity.value : 0.4;
        const markerSize = this.visualsConfig ? this.visualsConfig.markerSize.value : 0.5;
        
        for (let i = 0.0; i < this.maxMarkers; i+=1.0) {
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00, 
                emissive: 0x004400,
                transparent: true,
                opacity: markerOpacity
            });
            
            const marker = new THREE.Mesh(geometry, material);
            const scaleFactor = markerSize + (i / this.maxMarkers) * markerSize * 20; // Configurable scaling
            marker.scale.set(scaleFactor, scaleFactor, scaleFactor);
            marker.visible = false;
            this.scene.add(marker);
            this.markers.push(marker);
        }

        // Create a separate pool for no-input markers
        for (let i = 0.0; i < this.maxMarkers; i+=1.0) {
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff, 
                emissive: 0x00ffff,
                transparent: true,
                opacity: markerOpacity
            });
            
            const marker = new THREE.Mesh(geometry, material);
            const scaleFactor = markerSize + (i / this.maxMarkers) * markerSize * 80; // Configurable scaling  
            marker.scale.set(scaleFactor, scaleFactor, scaleFactor);
            marker.visible = false;
            this.scene.add(marker);
            this.noInputMarkers.push(marker);
        }
    }

    getMarkersPositionsForEmissionPoints(n=8) {
        // Get positions of all markers that are currently visible
        const positions = [];
        if (!this.markers || this.markers.length === 0) return positions;
        for (let i = 0; i < this.markers.length && positions.length < n; i+=4 ) {
            const marker = this.markers[i+1];
            positions.push(marker.position.clone());
        }
        return positions;
    }
    
    createPhantomCarpet() {
        // Create a copy of the real carpet that we can simulate forward
        const phantom = new this.carpet.constructor(this.carpet.THREE, this.carpet.config);
        
        // Copy current state from real carpet
        phantom.position.copy(this.carpet.position);
        phantom.forward.copy(this.carpet.forward);
        phantom.right.copy(this.carpet.right);
        phantom.normal.copy(this.carpet.normal);
        phantom.pitch = this.carpet.pitch;
        phantom.pitchMomentum = this.carpet.pitchMomentum;
        phantom.roll = this.carpet.roll;
        phantom.turnMomentum = this.carpet.turnMomentum;
        phantom.speed = this.carpet.speed;
        phantom.currentAltitude = this.carpet.currentAltitude;
        phantom.verticalSpeed = this.carpet.verticalSpeed;
        phantom.horizontalSpeed = this.carpet.horizontalSpeed;
        
        return phantom;
    }

    update(deltaTime, currentInput) {
        // Check if trajectory should be shown
        if (this.visualsConfig && !this.visualsConfig.showTrajectory.value) {
            this.hide();
            return;
        }
        
        // Update parameters from config in real-time
        if (this.visualsConfig) {
            this.predictionSteps = this.visualsConfig.predictionSteps.value;
            this.markerInterval = this.visualsConfig.markerInterval.value;
            this.maxMarkers = Math.floor(this.predictionSteps / this.markerInterval);
            
            // Update visual properties of all markers in real-time
            const currentOpacity = this.visualsConfig.markerOpacity.value;
            const currentSize = this.visualsConfig.markerSize.value;
            
            // Update main trajectory markers (green)
            this.markers.forEach((marker, i) => {
                marker.material.opacity = currentOpacity;
                const scaleFactor = currentSize + (i / this.maxMarkers) * currentSize * 20;
                marker.scale.set(scaleFactor, scaleFactor, scaleFactor);
            });
            
            // Update no-input markers (cyan) 
            this.noInputMarkers.forEach((marker, i) => {
                marker.material.opacity = currentOpacity;
                const scaleFactor = currentSize + (i / this.maxMarkers) * currentSize * 80;
                marker.scale.set(scaleFactor, scaleFactor, scaleFactor);
            });
        }
        
        // Hide all markers first
        this.markers.forEach(marker => marker.visible = false);
        this.noInputMarkers.forEach(marker => marker.visible = false);
        
        // Create fresh phantom carpet with current state
        this.phantomCarpet = this.createPhantomCarpet();
        
        let markerIndex = 0;
        
        // Simulate forward using the real carpet's physics methods
        for (let step = 0; step < this.predictionSteps; step++) {
            // Call the real carpet's physics update method
            this.phantomCarpet.updatePhysics(deltaTime, currentInput);
            
            // Place marker every N steps
            if (step % this.markerInterval === 0 && markerIndex < this.maxMarkers && markerIndex < this.markers.length) {
                const marker = this.markers[markerIndex];
                marker.position.copy(this.phantomCarpet.position);
                marker.visible = true;
                markerIndex++;
            }
        }
    }
    
    show() {
        this.markers.forEach(marker => {
            if (marker.visible) marker.visible = true;
        });
        this.noInputMarkers.forEach(marker => {
            if (marker.visible) marker.visible = true;
        });
    }
    
    hide() {
        this.markers.forEach(marker => marker.visible = false);
        this.noInputMarkers.forEach(marker => marker.visible = false);
    }
    
    destroy() {
        this.markers.forEach(marker => {
            this.scene.remove(marker);
            marker.geometry.dispose();
            marker.material.dispose();
        });
        this.noInputMarkers.forEach(marker => {
            this.scene.remove(marker);
            marker.geometry.dispose();
            marker.material.dispose();
        });
        this.markers = [];
    }
}