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
            startZ: 0,  // Far side for the grid
            startY: 15,  // Height of the grid
            startX: -50,   // Left-right position
            columnsPerCategory: 30, // How many columns to use for each category
            rowSpacing: 4,
            columnSpacing: 4
        };

        // Score categories and their positions in the grid
        this.categories = {
                wishfulScene: { 
                    startRow: 0, 
                    points: 15, 
                    emoji: '🌟',
                    currentColumn: 0 // Track how many points we've placed
                },
                creativity: { 
                    startRow: 1, 
                    points: 20, 
                    emoji: '💭',
                    currentColumn: 0
                },
                storytellingStart: { 
                    startRow: 2, 
                    points: 5, 
                    emoji: '📖',
                    currentColumn: 0
                },
            assemblyDesign: { startRow: 3, points: 15, emoji: '⚙️', currentColumn: 0},
            assemblyInnovation: { startRow: 4, points: 15, emoji: '💡', currentColumn: 0},
            stackableRisk: { startRow: 5, points: 30, emoji: '🎲', currentColumn: 0},
            teamChoice1: { startRow: 6, points: 30, emoji: '🎨', currentColumn: 0},
            stackRisk: { startRow: 7, points: 30, emoji: '🔺', currentColumn: 0},
            storytellingMiddle: { startRow: 8, points: 5, emoji: '📚', currentColumn: 0},
            frustrationPoint: { startRow: 9, points: 15, emoji: '😤', currentColumn: 0},
            destructionDesign: { startRow: 10, points: 15, emoji: '💥', currentColumn: 0},
            destructionInnovation: { startRow: 11, points: 15, emoji: '🔧', currentColumn: 0},
            teamChoice2: { startRow: 12, points: 30, emoji: '🎭', currentColumn: 0},
            storytellingEnd: { startRow: 13, points: 5, emoji: '📝', currentColumn: 0},
            instantChallenge: { startRow: 14, points: 100, emoji: '⚡', currentColumn: 0}
        };

        this.initParticlePool();
    }

    initParticlePool() {
        for (let i = 0; i < this.MAX_PARTICLES; i++) {
            const particle = new SpriteText('⭐', 1, 'white');
            particle.visible = false;
            const scale = 2.0;
            particle.scale.set(scale, scale, scale);
            this.scene.add(particle);
            this.particlePool.push(particle);
        }
    }

    getTargetPosition(category) {
        const categoryConfig = this.categories[category];
        if (!categoryConfig) return null;

        const row = categoryConfig.startRow ;
        // Calculate position in the grid
        const column = categoryConfig.currentColumn;
        console.log('row', row, 'column', column, 'category', category);
        
        // Increment the column counter for next time
        categoryConfig.currentColumn = (categoryConfig.currentColumn + 1) % this.gridConfig.columnsPerCategory;

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
        this.scoreParticles.forEach(data => {
            if (data.progress < 1) {
                data.progress += deltaTime * data.speed;
                
                // Bezier curve movement for more interesting particle path
                const t = data.progress;
                const controlPoint = new THREE.Vector3(
                    data.sourcePos.x,
                    data.targetPos.y + 10,
                    data.sourcePos.z
                );

                // Quadratic Bezier curve
                data.particle.position.set(
                    Math.pow(1 - t, 2) * data.sourcePos.x + 2 * (1 - t) * t * controlPoint.x + t * t * data.targetPos.x,
                    Math.pow(1 - t, 2) * data.sourcePos.y + 2 * (1 - t) * t * controlPoint.y + t * t * data.targetPos.y,
                    Math.pow(1 - t, 2) * data.sourcePos.z + 2 * (1 - t) * t * controlPoint.z + t * t * data.targetPos.z
                );

                // Fade in as it reaches its destination
                // data.particle.material.opacity = Math.min(1, t * 2);
                data.particle.material.opacity = 1.0;
            }
        });
    }

    clearScores() {
        this.scoreParticles.forEach(data => {
            data.particle.visible = false;
        });
        this.scoreParticles = [];
        
        // Reset all category column counters
        Object.values(this.categories).forEach(category => {
            category.currentColumn = 0;
        });
    }
}