// ScoringSystem.js
import * as THREE from 'three';
import { SpriteText } from './SpriteText.js';

export class ScoringSystem {
    constructor(scene) {
        this.scene = scene;
        this.scoreParticles = [];
        this.particlePool = [];
        this.MAX_PARTICLES = 400; // Room for all possible points
        
        // Grid configuration
        // Grid configuration
        this.gridConfig = {
            startX: -100.,   // Left-right position
            startY: 0,  // Height of the grid
            startZ: -100 - 80,  // Far side for the grid
            colsPerRow: 30, // How many columns to use for each category, really per row
            rowSpacing: 6,
            columnSpacing: 6,
            rowOffset: new THREE.Vector3(0, 4, 0),    // Vertical spacing between rows
            columnOffset: new THREE.Vector3(4, 0, 0)  // Horizontal spacing between columns
        };

        // Score categories and their positions in the grid
        this.categories = {
            instantChallenge: { startRow: 8, points: 100, emoji: '⚡', currentIndex: 20},
            creativity: { startRow: 8, points: 20, emoji: '💭', currentIndex: 0 },
            
            destructionDesign: { startRow: 7, points: 15, emoji: '💥', currentIndex: 0},
            destructionInnovation: { startRow: 7, points: 15, emoji: '🔧', currentIndex: 15},
            
            frustrationPoint: { startRow: 6, points: 15, emoji: '😤', currentIndex: 0},
            wishfulScene: { startRow: 6, points: 15, emoji: '🌟', currentIndex: 15 },
            
            stackRisk: { startRow: 5, points: 30, emoji: '🔺', currentIndex: 0},
            teamChoice2: { startRow: 4, points: 30, emoji: '🎭', currentIndex: 0},
            teamChoice1: { startRow: 3, points: 30, emoji: '🎨', currentIndex: 0},
            stackableRisk: { startRow: 2, points: 30, emoji: '🎲', currentIndex: 0},
            
            assemblyDesign: { startRow: 1, points: 15, emoji: '⚙️', currentIndex: 0},
            assemblyInnovation: { startRow: 1, points: 15, emoji: '💡', currentIndex: 15},
            
            storytellingStart: { startRow: 0, points: 5, emoji: '📖', currentIndex: 0 },
            storytellingMiddle: { startRow: 0, points: 5, emoji: '📚', currentIndex: 12},
            storytellingEnd: { startRow: 0, points: 5, emoji: '📝', currentIndex: 25},
        };

        this.initParticlePool();
    }

    initParticlePool() {
        for (let i = 0; i < this.MAX_PARTICLES; i++) {
            const particle = new SpriteText('⭐', 1, 'white');
            particle.visible = false;
            const scale = 6.0;
            particle.scale.set(scale, scale, scale);
            this.scene.add(particle);
            this.particlePool.push(particle);
        }
    }

    getTargetPosition(category) {
        const categoryConfig = this.categories[category];
        if (!categoryConfig) return null;

        // Calculate position in the grid
        // js modulo is the operator we want here, not remainder, its; a % b
        const column = categoryConfig.currentIndex % this.gridConfig.colsPerRow;
        
        // Increment the column counter for next time
        // instead of start row, figure it out based on the current index and columns per category 
        const row = categoryConfig.startRow + Math.floor(categoryConfig.currentIndex / this.gridConfig.colsPerRow);
        categoryConfig.currentIndex += 1;

        return new THREE.Vector3(
            this.gridConfig.startX + (column * this.gridConfig.columnSpacing),
            this.gridConfig.startY + (row * this.gridConfig.rowSpacing),
            this.gridConfig.startZ 
        );
    }

    getParticle() {
        return this.particlePool.find(p => !p.visible);
    }

    emitAllScoreParticles() {
        Object.keys(this.categories).forEach(category => {
            const categoryConfig = this.categories[category];
            if (!categoryConfig) return;
            // Emit a particle for each point in the category
            for (let i = 0; i < categoryConfig.points; i++){
                this.emitScoreParticle(category, new THREE.Vector3(0, 0, 0));    
            }
        });
    }

    emitScoreParticle(category, sourcePosition) {
        const categoryConfig = this.categories[category];
        if (!categoryConfig) return;

        const particle = this.getParticle();
        if (!particle) return;

        // Set initial position and properties
        particle.position.copy(sourcePosition);
        particle.visible = true;
        particle.text = categoryConfig.emoji;

        const targetPos = this.getTargetPosition(category);
        if (!targetPos) return;

        const particleData = {
            particle,
            sourcePos: sourcePosition.clone(),
            targetPos: targetPos,
            progress: 0,
            speed: 0.5 + Math.random() * 0.5
        };

        this.scoreParticles.push(particleData);
    }

update(deltaTime) {
    // Process particles from back to front to safely remove completed ones
    for (let i = this.scoreParticles.length - 1; i >= 0; i--) {
        const data = this.scoreParticles[i];
        
        data.progress = Math.min(1, data.progress + deltaTime * data.speed);
        
        // If we're very close to the target but not quite there, snap to final position
        if (data.progress > 0.99) {
            data.particle.position.copy(data.targetPos);
            data.progress = 1;
            continue;
        }
        
        // Calculate position using quadratic Bezier curve
        const t = data.progress;
        const controlPoint = new THREE.Vector3(
            data.sourcePos.x,
            data.targetPos.y + 10,
            data.sourcePos.z
        );

        // Early in the animation, add some randomness
        let randomOffset = new THREE.Vector3();
        const wiggle = 1.0;
        if (t < 0.8) {  // Only apply randomness during the first 80% of travel
            randomOffset.set(
                (Math.random() - 0.5) * (1 - t) * wiggle,  // Decrease random effect over time
                (Math.random() - 0.5) * (1 - t) * wiggle,
                (Math.random() - 0.5) * (1 - t) * wiggle
            );
        }

        // Quadratic Bezier curve calculation
        const position = new THREE.Vector3(
            Math.pow(1 - t, 2) * data.sourcePos.x + 2 * (1 - t) * t * controlPoint.x + t * t * data.targetPos.x,
            Math.pow(1 - t, 2) * data.sourcePos.y + 2 * (1 - t) * t * controlPoint.y + t * t * data.targetPos.y,
            Math.pow(1 - t, 2) * data.sourcePos.z + 2 * (1 - t) * t * controlPoint.z + t * t * data.targetPos.z
        );

        // Apply diminishing random offset
        position.add(randomOffset);
        
        // Update particle position
        data.particle.position.copy(position);
        
        // Keep opacity at full
        data.particle.material.opacity = 1.0;
        
        // Remove completed particles
        if (data.progress >= 1) {
            this.scoreParticles.splice(i, 1);
        }
    }
}

    clearScores() {
        this.scoreParticles.forEach(data => {
            data.particle.visible = false;
        });
        this.scoreParticles = [];
        
        // Reset all category column counters
        Object.values(this.categories).forEach(category => {
            category.currentIndex = 0;
        });
    }
}