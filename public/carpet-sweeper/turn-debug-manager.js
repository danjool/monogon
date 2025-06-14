import * as THREE from 'three';

export class TurnDebugManager {
    constructor(scene, carpet, visualsConfig) {
        this.scene = scene;
        this.carpet = carpet;
        this.visualsConfig = visualsConfig;
        
        // Circular buffer for moving average (option 2)
        this.turnHistory = [];
        this.bufferSize = this.visualsConfig ? this.visualsConfig.debugBufferSize.value : 60;
        this.bufferIndex = 0;
        
        // Position history for geometric fitting (option 3)
        this.positionHistory = [];
        this.maxPositionHistory = this.bufferSize * 2;
        
        // Debug circle meshes
        this.circles = {
            geometric: null      // Light orange
        };
        
        this.createCircleMeshes();
    }
    
    createCircleMeshes() {
        const segments = 256;
        
        // Create circle geometries
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array((segments + 1) * 3);
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            positions[i * 3] = Math.cos(angle);
            positions[i * 3 + 1] = Math.sin(angle);
            positions[i * 3 + 2] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Geometric fitting circle (light orange)
        const debugOpacity = this.visualsConfig ? this.visualsConfig.debugCircleOpacity.value : 0.8;
        this.circles.geometric = new THREE.Line(
            geometry.clone(),
            new THREE.LineBasicMaterial({ 
                color: 0xffa07a, // Light orange
                transparent: true,
                opacity: debugOpacity
            })
        );
        this.circles.geometric.visible = false;
        this.scene.add(this.circles.geometric);
    }
    
    update() {
        // Check if debug should be shown
        if (this.visualsConfig && !this.visualsConfig.showTurnDebug.value) {
            this.circles.geometric.visible = false;
            return;
        }
        
        // Update buffer sizes in real-time
        if (this.visualsConfig) {
            this.bufferSize = this.visualsConfig.debugBufferSize.value;
            this.maxPositionHistory = this.bufferSize * 2;
        }
        
        // Update position history for geometric fitting
        this.updatePositionHistory();
        
        // Update turn history buffer for moving average
        this.updateTurnHistory();
        
        // Calculate and render all three approaches
        this.updateGeometricCircle();
    }
    
    updatePositionHistory() {
        this.positionHistory.push({
            position: this.carpet.position.clone(),
            timestamp: performance.now()
        });
        
        // Keep only recent history
        if (this.positionHistory.length > this.maxPositionHistory) {
            this.positionHistory.shift();
        }
    }
    
    updateTurnHistory() {
        const entry = {
            turnMomentum: this.carpet.turnMomentum,
            speed: this.carpet.speed,
            position: this.carpet.position.clone(),
            forward: this.carpet.forward.clone(),
            right: this.carpet.right.clone(),
            normal: this.carpet.normal.clone(),
            timestamp: performance.now()
        };
        
        if (this.turnHistory.length < this.bufferSize) {
            this.turnHistory.push(entry);
        } else {
            this.turnHistory[this.bufferIndex] = entry;
            this.bufferIndex = (this.bufferIndex + 1) % this.bufferSize;
        }
    }
    
    // Option 1: Real-time calculation (Pink)

    
    // Option 3: Geometric circle fitting (Light orange)
    updateGeometricCircle() {
        if (this.positionHistory.length < 20) {
            this.circles.geometric.visible = false;
            return;
        }
        
        // Use recent positions for circle fitting
        const recentPositions = this.positionHistory.slice(-30); // Last 30 positions
        const result = this.fitCircleToPoints(recentPositions.map(entry => entry.position));
        
        if (!result || result.radius < 100 || result.radius > 50000) {
            this.circles.geometric.visible = false;
            return;
        }
        
        this.positionCircle(
            this.circles.geometric, 
            result.center, 
            result.radius, 
            this.carpet.normal
        );
        this.circles.geometric.visible = true;
    }
    
    // Least squares circle fitting
    fitCircleToPoints(points) {
        if (points.length < 3) return null;
        
        // Convert 3D points to 2D in carpet's local plane
        const localPoints = this.projectPointsToPlane(points);
        if (localPoints.length < 3) return null;
        
        // Fit circle in 2D using least squares
        const result = this.fitCircle2D(localPoints);
        if (!result) return null;
        
        // Convert back to 3D
        const center3D = this.unprojectPointFromPlane(result.center);
        
        return {
            center: center3D,
            radius: result.radius
        };
    }
    
    projectPointsToPlane(points) {
        // Project points onto the plane defined by carpet's current orientation
        const carpetPos = this.carpet.position;
        const normal = this.carpet.normal.clone().normalize();
        const right = this.carpet.right.clone().normalize();
        const forward = this.carpet.forward.clone().normalize();
        
        return points.map(point => {
            const relative = point.clone().sub(carpetPos);
            return new THREE.Vector2(
                relative.dot(right),
                relative.dot(forward)
            );
        });
    }
    
    unprojectPointFromPlane(point2D) {
        const carpetPos = this.carpet.position;
        const right = this.carpet.right.clone().normalize();
        const forward = this.carpet.forward.clone().normalize();
        
        return carpetPos.clone()
            .add(right.multiplyScalar(point2D.x))
            .add(forward.multiplyScalar(point2D.y));
    }
    
    fitCircle2D(points) {
        if (points.length < 3) return null;
        
        // Use algebraic circle fitting (Kasa method)
        let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0;
        let sumX3 = 0, sumY3 = 0, sumX2Y = 0, sumXY2 = 0;
        
        for (const p of points) {
            const x = p.x, y = p.y;
            const x2 = x * x, y2 = y * y;
            
            sumX += x;
            sumY += y;
            sumX2 += x2;
            sumY2 += y2;
            sumXY += x * y;
            sumX3 += x2 * x;
            sumY3 += y2 * y;
            sumX2Y += x2 * y;
            sumXY2 += x * y2;
        }
        
        const n = points.length;
        const A = n * sumX2 - sumX * sumX;
        const B = n * sumXY - sumX * sumY;
        const C = n * sumY2 - sumY * sumY;
        const D = 0.5 * (n * sumXY2 - sumX * sumY2 + n * sumX3 - sumX * sumX2);
        const E = 0.5 * (n * sumX2Y - sumY * sumX2 + n * sumY3 - sumY * sumY2);
        
        const det = A * C - B * B;
        if (Math.abs(det) < 1e-10) return null;
        
        const cx = (D * C - B * E) / det;
        const cy = (A * E - B * D) / det;
        
        // Calculate radius
        let sumDistSq = 0;
        for (const p of points) {
            const dx = p.x - cx;
            const dy = p.y - cy;
            sumDistSq += dx * dx + dy * dy;
        }
        const radius = Math.sqrt(sumDistSq / n);
        
        return {
            center: new THREE.Vector2(cx, cy),
            radius: radius
        };
    }
    
    positionCircle(circleMesh, center, radius, normal) {
        circleMesh.position.copy(center);
        circleMesh.scale.setScalar(radius);
        
        // Orient circle to be perpendicular to normal (in the turn plane)
        const up = normal.clone().normalize();
        const forward = this.carpet.forward.clone().normalize();
        const right = forward.clone().cross(up).normalize();
        
        // Create rotation matrix to orient the circle
        const matrix = new THREE.Matrix4().makeBasis(right, forward, up);
        circleMesh.rotation.setFromRotationMatrix(matrix);
    }
    
    destroy() {
        // Clean up circle meshes
        Object.values(this.circles).forEach(circle => {
            if (circle) {
                this.scene.remove(circle);
                circle.geometry.dispose();
                circle.material.dispose();
            }
        });
    }
}