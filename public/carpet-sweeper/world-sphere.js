import * as THREE from 'three';

export class WorldSphere {
    constructor(radius, segments = 256) {
        this.radius = radius;
        this.segments = segments;
        
        // Create world group that contains everything
        this.worldGroup = new THREE.Group();
        
        // Create the main sphere
        this.mesh = this.createSphere();
        this.worldGroup.add(this.mesh);
        
        // Create skyscrapers
        this.createSkyscrapers();
        
        // Create base altitude sphere
        this.baseAltitudeSphere = this.createBaseAltitudeSphere();
    }
    
    createSphere() {
        // Create custom geometry with only latitude/longitude lines, no diagonals
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        // Latitude lines (horizontal circles)
        const latSegments = Math.floor(this.segments);
        for (let lat = 0; lat <= latSegments; lat++) {
            // spaced evenly from -PI/2 to PI/2, so that the rects are close to square
            const theta = (lat / latSegments) * Math.PI;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            for (let lon = 0; lon <= this.segments; lon++) {
                // spaced evenly from 0 to 2*PI
                const phi = (lon / this.segments) * 2 * Math.PI;
                const x = this.radius * sinTheta * Math.cos(phi);
                const y = this.radius * sinTheta * Math.sin(phi);
                const z = this.radius * cosTheta;
                vertices.push(x, y, z);
            }
        }
        
        // Create line segments for latitude lines
        for (let lat = 0; lat <= latSegments; lat++) {
            for (let lon = 0; lon < this.segments; lon++) {
                const current = lat * (this.segments + 1) + lon;
                const next = current + 1;
                indices.push(current, next);
            }
        }
        
        // Create line segments for longitude lines
        for (let lon = 0; lon < this.segments; lon++) {
            for (let lat = 0; lat < latSegments; lat++) {
                const current = lat * (this.segments + 1) + lon;
                const below = current + (this.segments + 1);
                indices.push(current, below);
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        
        const material = new THREE.LineBasicMaterial({
            color: 0x3366cc,
            transparent: true,
            opacity: 0.3
        });
        
        return new THREE.LineSegments(geometry, material);
    }
    
    createSkyscrapers() {
        // Tall skyscrapers
        let h = 8000;
        const skyscraperGeometry = new THREE.BoxGeometry(40, 40, h);
        const skyscraperMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        let radius = this.radius - h/2;
        
        for (let i = 0; i < 1000; i++) {
            const skyscraper = new THREE.Mesh(skyscraperGeometry, skyscraperMaterial);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            
            skyscraper.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
            
            const outwardDirection = skyscraper.position.clone().normalize();
            const targetPosition = skyscraper.position.clone().add(outwardDirection.multiplyScalar(1000));
            skyscraper.lookAt(new THREE.Vector3(0, 0, 0));
            
            this.worldGroup.add(skyscraper);
        }

        // Medium skyscrapers in a ring pattern
        h = 1400;
        radius = this.radius - h/2;
        const skyscraperMaterial2 = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const skyscraperGeometry2 = new THREE.BoxGeometry(40, 40, h);
        const n = 400;
        
        for (let i = 0; i < n; i++) {
            const skyscraper = new THREE.Mesh(skyscraperGeometry2, skyscraperMaterial2);
            
            const theta = Math.PI * 2 * (i / n);
            const phi = Math.acos(i / n) * Math.PI / 2 - Math.PI / 2;
            
            skyscraper.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
            
            const outwardDirection = skyscraper.position.clone().normalize();
            const targetPosition = skyscraper.position.clone().add(outwardDirection.multiplyScalar(2000));
            skyscraper.lookAt(targetPosition);
            
            this.worldGroup.add(skyscraper);
        }
    }
    
    createBaseAltitudeSphere() {
        const geometry = new THREE.SphereGeometry(1, 128, 48);
        
        return new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({
                color: 0x6666aa,
                transparent: false,
                opacity: 0.3,
                side: THREE.FrontSide
            })
        );
    }
    
    // Get the world group to add to scene
    getWorldGroup() {
        return this.worldGroup;
    }
    
    // Get base altitude sphere for separate handling
    getBaseAltitudeSphere() {
        return this.baseAltitudeSphere;
    }
    
    // Update base altitude sphere scale based on equilibrium altitude
    updateBaseAltitudeSphere(worldRadius, equilibriumAltitude) {
        this.baseAltitudeSphere.visible = false; // Keep hidden for now
        const radius = worldRadius - equilibriumAltitude;
        this.baseAltitudeSphere.scale.set(radius, radius, radius);
    }
    
    // Check collision with world boundary
    checkCollision(carpetPosition, worldRadius) {
        return carpetPosition.length() >= worldRadius - 1;
    }
}