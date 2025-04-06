/**
 * infinity.js
 * Cyberspace-themed Three.js background with platonic solids
 * Created for Monogon Cyberspace landing page
 */

import InfinityPlatonicSolid from './InfinityPlatonicSolids.js';

// Scene variables
let scene, camera, renderer;
let solids = [], solidGroup;
let clock;
let gridPlane;
let canvas;

// Initialize everything
init();
animate();

function init() {
    // Get canvas element
    canvas = document.getElementById('bg-canvas');
    
    // Create clock for time-based animations
    clock = new THREE.Clock();
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000511);
    scene.fog = new THREE.FogExp2(0x000511, 0.025);
    
    // Create camera
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 2000);
    camera.position.set(0, 0, 25);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Add ambient light
    scene.add(new THREE.AmbientLight(0x111122));
    
    // Create grid for cyberspace effect
    createGrid();
    
    // Create platonic solids
    createPlatonicSolids();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Add mouse move listener for interactive camera movement
    document.addEventListener('mousemove', onMouseMove);
}

function createGrid() {
    // Create multiple terrain lines
    const numVertices = 64;      // Points per line
    const numLines = 20;         // Number of parallel lines
    const width = 256;           // Width of terrain (x-axis)
    const depth = 64;          // Depth of terrain (z-axis)
    const maxHeight = 3;        // Maximum height variation
    
    // Create geometry for terrain lines
    const terrainGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(numVertices * numLines * 3);
    const colors = new Float32Array(numVertices * numLines * 3);
    
    // Create different colors for depth perception
    for (let i = 0; i < numLines; i++) {
        // Calculate color based on line index - further lines are slightly darker
        const intensity = 0.5 + (0.5 * (1 - i / numLines));
        const color = new THREE.Color(0x00f3ff);
        color.multiplyScalar(intensity);
        
        for (let j = 0; j < numVertices; j++) {
            colors.set([color.r, color.g, color.b], (i * numVertices + j) * 3);
        }
    }
    
    // Create terrain vertices with varying heights
    for (let i = 0; i < numLines; i++) {
        const zPos = (i / (numLines - 1)) * depth - depth / 2;
        
        for (let j = 0; j < numVertices; j++) {
            const xPos = (j / (numVertices - 1)) * width - width / 2;
            
            // Generate height using a combination of noise functions
            // Each line will have a different but consistent pattern
            let height = 0;
            
            // Simple zigzag pattern based on x position and line index
            height = Math.sin(xPos * 0.2 + i * 0.5) * maxHeight * 0.7;
            
            // Add some higher frequency variation
            height += Math.sin(xPos * 0.5) * maxHeight * 0.3;
            
            // Offset base height for each line to create a rolling terrain effect
            height += Math.sin(i * 0.3) * maxHeight * 0.4;

            // find distance from diagonal line with 'slop' 2/3 through center of terrain, anything above that is 0
            const slope = 1/3;
            const distanceFromDiagonal = Math.abs(xPos * slope - zPos);
            const whatSide = Math.sign(xPos * slope - zPos);
            if (distanceFromDiagonal > .5 && whatSide < 0) {
                height = -maxHeight + Math.abs(height) * 0.1;
            }

            // add a hill to the upper right of the terrain
            const hillCenterX = 30.5;
            const hillCenterZ = -17.5;
            const hillRadius = 25;
            const hillHeight = 16;
            const distanceToHill = Math.sqrt(Math.pow(xPos - hillCenterX, 2) + Math.pow(zPos - hillCenterZ, 2));
            if (distanceToHill < hillRadius) {
                height += hillHeight * (1 - distanceToHill / hillRadius);
            }

            
            vertices.set([xPos, height, zPos], (i * numVertices + j) * 3);
        }
    }
    
    terrainGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    terrainGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // For a wireframe effect, we need to define lines connecting consecutive vertices
    const indices = [];
    for (let i = 0; i < numLines; i++) {
        for (let j = 0; j < numVertices - 1; j++) {
            const currentVertex = i * numVertices + j;
            const nextVertex = currentVertex + 1;
            indices.push(currentVertex, nextVertex);
        }
    }
    
    terrainGeometry.setIndex(indices);
    
    const terrainMaterial = new THREE.LineBasicMaterial({ 
        vertexColors: true,
        linewidth: 1,
        opacity: 0.8,
        transparent: true
    });
    
    const terrainLines = new THREE.LineSegments(terrainGeometry, terrainMaterial);
    terrainLines.position.y = -10; // Move terrain down a bit
    terrainLines.position.z = -30; // Move terrain back a bit
    scene.add(terrainLines);
}

function createPlatonicSolids() {
    const solidTypes = [
        'tetrahedron', 
        'cube', 
        'octahedron', 
        'dodecahedron', 
        'icosahedron'
    ];

    const subSolidTypes = [
        'cube', 
        'octahedron', 
        'dodecahedron', 
        'icosahedron'
    ];
    
    const radius = 2.5; // Size of each solid
    
    // Create a primary large dodecahedron in the center
    const mainSolid = new InfinityPlatonicSolid({
        solidType: 'tetrahedron',
        radius: radius * 2,
        position: new THREE.Vector3(0, 0, 0),
        rotationSpeedX: 0.0,
        rotationSpeedY: 0.0
    });
    
    // mainSolid.addToScene(scene);
    solidGroup = new THREE.Group();
    solidGroup.position.set(0, 0, -3); // Move the group back a bit
    solidGroup.add(mainSolid.mesh);
    scene.add(solidGroup);
    solids.push(mainSolid);

    // create one of each of the remaining solids: cube, octahedron, dodecahedron, icosahedron
    // place each one at a different distance from the center, at angles aligned with the vertices of the main solid
    const distanceFromCenter = 6;
    const sqrt2 = Math.sqrt(2);
    
// in 3d all the offsets are in the directions of the vertices of the main solid
        // all equidistant in a sphere around the main solid, four of them
    const offsets = [
        new THREE.Vector3(-sqrt2/2, sqrt2/2, -sqrt2/2),
        new THREE.Vector3(sqrt2/2, sqrt2/2, sqrt2/2),
        new THREE.Vector3(sqrt2/2, -sqrt2/2, -sqrt2/2),
        new THREE.Vector3(-sqrt2/2, -sqrt2/2, sqrt2/2),
    ]

    for (let i = 0; i < subSolidTypes.length; i++) {
        const solidType = subSolidTypes[i];


        const position = new THREE.Vector3(
            offsets[i].x * distanceFromCenter,
            offsets[i].y * distanceFromCenter,
            offsets[i].z * distanceFromCenter
        );

        const rotationSpeed = .01;

        const rotationSpeedX = .0001
        const rotationSpeedY = .0003
        const solid = new InfinityPlatonicSolid({
            solidType: solidType,
            radius: radius,
            position: position,
            rotationSpeedX: rotationSpeedX,
            rotationSpeedY: rotationSpeedY
        });
        // Set the solid's position and rotation speeds
        solid.mesh.position.copy(position);
        solid.rotationSpeedX = rotationSpeedX;
        solid.rotationSpeedY = rotationSpeedY;
        // Set the solid's scale
        solid.mesh.scale.set(.3, .3, .3);

        
        // Add the solid to the scene and the solids array
        // solid.addToScene(scene);
        solidGroup.add(solid.mesh);
        solids.push(solid);
    }

}

function onWindowResize() {
    // Update camera aspect ratio and projection matrix
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    // Get normalized mouse coordinates (-1 to 1)
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Subtle camera movement based on mouse position
    gsap.to(camera.position, {
        x: mouseX * 2,
        y: mouseY * 2,
        duration: 2,
        ease: 'power2.out'
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    // Get elapsed time
    const delta = clock.getDelta();
    
    // spin the solid group
    solidGroup.rotation.y += delta * 0.02;
    solidGroup.rotation.x += delta * 0.01;
    solidGroup.rotation.z += delta * 0.012847;

    // Animate all solids
    solids.forEach(solid => solid.update(delta));
    
    // Subtle camera movement
    camera.position.z = 5 + Math.sin(clock.getElapsedTime() * 0.1) * 2.5;
    
    // Update camera to always look at the center of the scene
    camera.lookAt(0, 0, -15);
    
    // Render the scene
    renderer.render(scene, camera);
}

// Add some GSAP-like tweening functionality if GSAP isn't available
if (typeof gsap === 'undefined') {
    window.gsap = {
        to: function(object, params) {
            const duration = params.duration || 1;
            const ease = params.ease || 'linear';
            delete params.duration;
            delete params.ease;
            
            const startValues = {};
            const changeValues = {};
            const startTime = performance.now();
            
            for (const key in params) {
                if (key !== 'onComplete' && key !== 'onUpdate') {
                    startValues[key] = object[key];
                    changeValues[key] = params[key] - startValues[key];
                }
            }
            
            function easeOutQuad(t) {
                return t * (2 - t);
            }
            
            function update() {
                const elapsed = (performance.now() - startTime) / 1000;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = ease === 'power2.out' ? easeOutQuad(progress) : progress;
                
                for (const key in changeValues) {
                    object[key] = startValues[key] + changeValues[key] * easedProgress;
                }
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else if (params.onComplete) {
                    params.onComplete();
                }
                
                if (params.onUpdate) {
                    params.onUpdate();
                }
            }
            
            update();
        }
    };
}
