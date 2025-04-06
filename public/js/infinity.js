/**
 * infinity.js
 * Cyberspace-themed Three.js background with platonic solids
 * Created for Monogon Cyberspace landing page
 */

import InfinityPlatonicSolid from './InfinityPlatonicSolids.js';

// Golden ratio (phi) for our color calculations
const PHI = (1 + Math.sqrt(5)) / 2; // ~1.618033988749895

// Scene variables
let scene, camera, renderer;
let solids = [], solidGroup;
let clock;
let gridPlane;
let canvas;
let mouseX = 0, mouseY = 0, timeSinceMouseMove = 0;

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
    scene.fog = new THREE.FogExp2(0x000511, 0.0205);
    
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
    const width = 512;           // Width of terrain (x-axis)
    const depth = 128;            // Depth of terrain (z-axis)
    const maxHeight = 3;         // Maximum height variation
    const sheetDepth = 100;       // Depth of the sheets extending downward
    
    // Create a group to hold both lines and sheets
    const terrainGroup = new THREE.Group();
    
    // Store all vertices for later use with sheets
    const allVertices = [];
    
    // Create different colors for depth perception
    const lineColors = [];
    for (let i = 0; i < numLines; i++) {
        // Calculate color based on line index - further lines are slightly darker
        const intensity = 0.5 + (0.5 * (1 - i / numLines));
        const color = new THREE.Color(0x11a3aa);
        color.multiplyScalar(intensity);
        lineColors.push(color);
    }
    
    // 1. First create and add the lines (keeping the original appearance)
    
    // Create geometry for terrain lines
    const terrainGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(numVertices * numLines * 3);
    const colors = new Float32Array(numVertices * numLines * 3);
    
    // Set colors for the lines
    for (let i = 0; i < numLines; i++) {
        const color = lineColors[i];
        for (let j = 0; j < numVertices; j++) {
            colors.set([color.r, color.g, color.b], (i * numVertices + j) * 3);
        }
    }
    
    // Create terrain vertices with varying heights
    for (let i = 0; i < numLines; i++) {
        const zPos = (i / (numLines - 1)) * depth - depth / 2;
        const lineVertices = [];
        
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
            const slope = 1/2;
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
            lineVertices.push({ x: xPos, y: height, z: zPos });
        }
        
        allVertices.push(lineVertices);
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
        transparent: false
    });
    
    const terrainLines = new THREE.LineSegments(terrainGeometry, terrainMaterial);
    
    // 2. Now create the sheet meshes below each line
    
    // Create a sheet for each terrain line
    for (let i = 0; i < numLines; i++) {
        const lineVertices = allVertices[i];
        const color = lineColors[i];
        
        // Create sheet geometry
        const sheetGeometry = new THREE.BufferGeometry();
        const sheetVertices = [];
        const sheetIndices = [];
        
        // Create vertices for the sheet - two for each original vertex (top and bottom)
        for (let j = 0; j < lineVertices.length; j++) {
            const vertex = lineVertices[j];
            
            // Top vertex (same as the line)
            sheetVertices.push(vertex.x, vertex.y, vertex.z);
            
            // Bottom vertex (extends down by sheetDepth)
            sheetVertices.push(vertex.x, vertex.y - sheetDepth, vertex.z);
        }
        
        // Create triangles for the sheet
        for (let j = 0; j < lineVertices.length - 1; j++) {
            const topLeft = j * 2;
            const bottomLeft = j * 2 + 1;
            const topRight = (j + 1) * 2;
            const bottomRight = (j + 1) * 2 + 1;
            
            // First triangle (top-left, bottom-left, top-right)
            sheetIndices.push(topLeft, bottomLeft, topRight);
            
            // Second triangle (bottom-left, bottom-right, top-right)
            sheetIndices.push(bottomLeft, bottomRight, topRight);
        }
        
        // Create the sheet mesh
        sheetGeometry.setAttribute('position', new THREE.Float32BufferAttribute(sheetVertices, 3));
        sheetGeometry.setIndex(sheetIndices);
        sheetGeometry.computeVertexNormals();
        
        const sheetMaterial = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.FrontSide,
            transparent: false,
            opacity: 1.0,
            depthWrite: true
        });
        
        const sheetMesh = new THREE.Mesh(sheetGeometry, sheetMaterial);
        terrainGroup.add(sheetMesh);
    }
    
    // Add the lines on top of the sheets
    // terrainGroup.add(terrainLines);
    
    // Position the entire terrain group
    terrainGroup.position.y = -10; // Move terrain down a bit
    terrainGroup.position.z = -50; // Move terrain back a bit
    scene.add(terrainGroup);
}

/**
 * Generate a palette of colors based on phi (golden ratio) offsets around the color wheel
 * This creates aesthetically pleasing color combinations
 * @param {number} baseHue - Starting hue (0-1)
 * @param {number} count - Number of colors to generate
 * @param {number} saturation - Color saturation (0-1)
 * @param {number} lightness - Color lightness/value (0-1) 
 * @returns {Array} - Array of THREE.Color objects
 */
function generatePhiColorPalette(baseHue = 0.61, count = 5, saturation = 0.9, lightness = 0.7) {
    const colors = [];
    
    // Normalize the base hue to 0-1 range if needed
    baseHue = baseHue % 1;
    if (baseHue < 0) baseHue += 1;
    
    for (let i = 0; i < count; i++) {
        // Calculate new hue by adding phi-based offset
        // This creates aesthetically pleasing distribution around the color wheel
        const hue = (baseHue + (i * (1 / PHI))) % 1;
        
        // Convert HSL to RGB
        const color = new THREE.Color();
        color.setHSL(hue, saturation, lightness);
        
        colors.push(color);
    }
    
    return colors;
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
    
    // Generate phi-based color palette for our solids
    // First color is for the main tetrahedron, the rest for the sub-solids
    const colorPalette = generatePhiColorPalette(0.333161, 5, 0.99, 0.68);
    
    // Create a primary large dodecahedron in the center
    const mainSolid = new InfinityPlatonicSolid({
        solidType: 'tetrahedron',
        radius: radius * 2,
        position: new THREE.Vector3(0, 0, 0),
        rotationSpeedX: 0.0,
        rotationSpeedY: 0.0,
        color: colorPalette[0] // First color from our palette
    });
    
    // mainSolid.addToScene(scene);
    solidGroup = new THREE.Group();
    solidGroup.position.set(0, 0, -3); // Move the group back a bit
    solidGroup.add(mainSolid.mesh);
    scene.add(solidGroup);
    solids.push(mainSolid);

    // create one of each of the remaining solids: cube, octahedron, dodecahedron, icosahedron
    // place each one at a different distance from the center, at angles aligned with the vertices of the main solid
    const distanceFromCenter = 6.5;
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
            rotationSpeedY: rotationSpeedY,
            color: colorPalette[i + 1] // Use the next color from our palette
        });
        // Set the solid's position and rotation speeds
        solid.mesh.position.copy(position);
        solid.rotationSpeedX = rotationSpeedX;
        solid.rotationSpeedY = rotationSpeedY;
        // Set the solid's scale
        solid.mesh.scale.set(.6, .6, .6);

        
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
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    timeSinceMouseMove = 0;
    
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
    // solidGroup.rotation.y += delta * 0.2;
    // solidGroup.rotation.x += delta * 0.1;
    // solidGroup.rotation.z += delta * 0.12847;

    // subtly base rotation based on slerping to mouse position
    const targetRotationX = mouseY * Math.PI / 1;
    const targetRotationY = -mouseX * Math.PI / 2;
    const rotationSpeed = 0.8;
    solidGroup.rotation.x += (targetRotationX - solidGroup.rotation.x) * rotationSpeed;
    solidGroup.rotation.y += (targetRotationY - solidGroup.rotation.y) * rotationSpeed;
    solidGroup.rotation.z += (mouseX * Math.PI / 4 - solidGroup.rotation.z) * rotationSpeed;
    // if timeSinceMouseMove is greater than 4 seconds, passively slerp around slowly
    if (timeSinceMouseMove > 4) {
        console.log('slerping around slowly')
        solidGroup.rotation.x += (Math.sin(clock.getElapsedTime() * 0.2) ) * rotationSpeed * 0.2;
        solidGroup.rotation.y += (Math.cos(clock.getElapsedTime() * 0.1) ) * rotationSpeed * 0.2;
        solidGroup.rotation.z += (Math.sin(clock.getElapsedTime() * 0.14) ) * rotationSpeed * 0.2;
    }

    const cameraDistanceFromCenter = Math.sqrt(camera.position.x * camera.position.x + camera.position.y * camera.position.y + camera.position.z * camera.position.z);
    // vibrate rotate the solidGroup inversely proportional to the distance from the center of the camera
    const vibrationAmount = 0.02 / cameraDistanceFromCenter;
    solidGroup.rotation.x += (Math.random() - 0.5) * vibrationAmount;
    

    // Animate all solids
    solids.forEach(solid => solid.update(delta));
    
    // Subtle camera movement
    camera.position.z = 5 + Math.sin(clock.getElapsedTime() * 0.2) * 2.5;
    
    // Update camera to always look at the center of the scene
    camera.lookAt(0, 0, -15);
    
    // Render the scene
    renderer.render(scene, camera);
    timeSinceMouseMove += delta;
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
