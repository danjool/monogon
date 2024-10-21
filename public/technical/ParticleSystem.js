// ParticleSystem.js
import * as THREE from 'three';
import { SpriteText } from './SpriteText.js';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.particlePool = [];
    this.MAX_PARTICLES = 100; // Reduced from 300
    this.PARTICLE_BUDGET = 50; // New particle budget
    this.initParticles();
  }

  initParticles() {
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      const particle = new SpriteText('🌓', 0.5, 'rgba(255, 255, 255, 1)');
      particle.visible = false;
      this.scene.add(particle);
      this.particlePool.push(particle);
    }
  }

  getParticle() {
    if (this.particles.length >= this.PARTICLE_BUDGET) {
      return null; // Don't create new particles if we've reached the budget
    }
    
    let particle = this.particlePool.find(p => !p.visible);
    if (!particle) {
      return null; // Don't create new particles if the pool is exhausted
    }
    return particle;
  }

  emitEmojiParticles(position, emoji, count, lifetime = 2) {
    for (let i = 0; i < count; i++) {
      let particle = this.getParticle();
      if (!particle) break; // Stop if we can't get more particles

      particle.text = emoji;
      particle.position.copy(position).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      ));
      particle.visible = true;
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 1 + 0.5,
        (Math.random() - 0.5) * 0.5
      );
      particle.userData.lifetime = lifetime;
      particle.userData.maxLifetime = lifetime;
      particle.userData.type = 'emoji';
      this.particles.push(particle);
    }
  }

  emitParticlesForBox(box, emojiCount = 4) {
    if (box.userData.particlesEmitted >= emojiCount) return;

    for (let i = 0; i < emojiCount; i++) {
      let particle = this.getParticle();
      if (!particle) break; // Stop if we can't get more particles

      particle.text = '💰';
      particle.position.copy(box.position);
      particle.visible = true;
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 2 + 1,
        (Math.random() - 0.5) * 0.5
      );
      particle.userData.lifetime = 2;
      particle.userData.originalBox = box;
      particle.userData.type = 'box';
      this.particles.push(particle);
      box.userData.particlesEmitted++;
    }
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime));
      particle.userData.lifetime -= deltaTime;

      if (particle.userData.type === 'emoji') {
        const alpha = particle.userData.lifetime / particle.userData.maxLifetime;
        particle.material.opacity = alpha;
      }

      if (particle.userData.lifetime <= 0) {
        particle.visible = false;
        if (particle.userData.type === 'box') {
          particle.position.copy(particle.userData.originalBox.position);
          particle.userData.originalBox.userData.particlesEmitted--;
        }
        this.particles.splice(i, 1);
        this.particlePool.push(particle);
      }
    }
  }

  updateFromPhysics(emojiCounts) {
    this.scene.meshes.forEach((mesh, index) => {
      if (Math.abs(mesh.position.y - this.scene.boxSize) < 0.01) {
        this.emitParticlesForBox(mesh, emojiCounts[index]);
      }
    });
  }
}