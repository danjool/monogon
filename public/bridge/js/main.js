import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';

// Custom TV effect shader
const TVEffectShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "time": { value: 0.0 },
        "resolution": { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        "noiseIntensity": { value: 0.2 },
        "scanlineIntensity": { value: 0.1 },
        "scanlineCount": { value: 800.0 },
        "vignetteIntensity": { value: 0.8 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform vec2 resolution;
        uniform float noiseIntensity;
        uniform float scanlineIntensity;
        uniform float scanlineCount;
        uniform float vignetteIntensity;
        
        varying vec2 vUv;
        
        // Random noise function
        float random(vec2 p) {
            vec2 k1 = vec2(
                23.14069263277926, // e^pi (Gelfond's constant)
                2.665144142690225 // 2^sqrt(2) (Gelfond–Schneider constant)
            );
            return fract(cos(dot(p, k1)) * 12345.6789);
        }
        
        void main() {
            // Get the original color
            vec4 color = texture2D(tDiffuse, vUv);
            
            // Add noise
            float noise = random(vUv * time) * noiseIntensity;
            color.rgb += noise - noiseIntensity / 2.0;
            
            // Add scanlines
            float scanline = sin(vUv.y * scanlineCount + time) * scanlineIntensity;
            color.rgb += scanline;
            
            // Add vignette effect
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);
            color.rgb *= smoothstep(0.8, 0.2, dist * vignetteIntensity);
            
            // Slightly shift RGB channels for chromatic aberration
            float aberrationAmount = 0.003;
            color.r = texture2D(tDiffuse, vUv + vec2(aberrationAmount, 0.0)).r;
            color.b = texture2D(tDiffuse, vUv - vec2(aberrationAmount, 0.0)).b;
            
            // Output the final color
            gl_FragColor = color;
        }
    `
};

// Scene setup
let scene, camera, renderer, composer;
let stars = [];
let nebulae = [];
let starfield;

// Animation variables
let time = 0;
const starSpeed = 0.02;
const nebulaSpeed = 0.005;

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('spaceScene'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000);
    
    // Create stars
    createStars();
    
    // Create nebulae
    createNebulae();
    
    // Create starfield (distant stars)
    createStarfield();
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    // Post-processing
    setupPostProcessing();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
}

// Create stars
function createStars() {
    const starGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const starCount = 200;
    
    for (let i = 0; i < starCount; i++) {
        const starMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(
                0.8 + Math.random() * 0.2,
                0.8 + Math.random() * 0.2,
                0.8 + Math.random() * 0.2
            ),
            transparent: true,
            opacity: Math.random() * 0.5 + 0.5
        });
        
        const star = new THREE.Mesh(starGeometry, starMaterial);
        
        // Random position
        star.position.x = Math.random() * 40 - 20;
        star.position.y = Math.random() * 40 - 20;
        star.position.z = Math.random() * 40 - 20;
        
        // Store original z position for animation
        star.userData.originalZ = star.position.z;
        star.userData.speed = Math.random() * 0.05 + 0.02;
        
        scene.add(star);
        stars.push(star);
    }
}

// Create nebulae
function createNebulae() {
    const nebulaCount = 5;
    const nebulaGeometry = new THREE.PlaneGeometry(10, 10);
    
    for (let i = 0; i < nebulaCount; i++) {
        // Create a canvas for the nebula texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Generate a nebula-like texture
        const colors = [
            [41, 95, 153],   // Blue
            [142, 92, 174],  // Purple
            [113, 33, 119],  // Deep purple
            [202, 103, 149], // Pink
            [206, 169, 73]   // Gold
        ];
        
        const colorIndex = Math.floor(Math.random() * colors.length);
        const [r, g, b] = colors[colorIndex];
        
        // Create gradient
        const gradient = ctx.createRadialGradient(
            128, 128, 0,
            128, 128, 128
        );
        
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.3)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        // Add some noise
        for (let j = 0; j < 1000; j++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const radius = Math.random() * 2;
            const opacity = Math.random() * 0.5;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fill();
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        const nebulaMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        
        // Random position and rotation
        nebula.position.x = Math.random() * 30 - 15;
        nebula.position.y = Math.random() * 30 - 15;
        nebula.position.z = Math.random() * -30 - 10;
        
        nebula.rotation.x = Math.random() * Math.PI;
        nebula.rotation.y = Math.random() * Math.PI;
        nebula.rotation.z = Math.random() * Math.PI;
        
        // Random scale
        const scale = Math.random() * 3 + 2;
        nebula.scale.set(scale, scale, 1);
        
        // Store original z position for animation
        nebula.userData.originalZ = nebula.position.z;
        nebula.userData.speed = Math.random() * 0.01 + 0.005;
        nebula.userData.rotationSpeed = {
            x: Math.random() * 0.001 - 0.0005,
            y: Math.random() * 0.001 - 0.0005,
            z: Math.random() * 0.001 - 0.0005
        };
        
        scene.add(nebula);
        nebulae.push(nebula);
    }
}

// Create starfield (distant stars)
function createStarfield() {
    const starCount = 2000;
    const starfieldGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        
        // Position
        positions[i3] = (Math.random() - 0.5) * 200;
        positions[i3 + 1] = (Math.random() - 0.5) * 200;
        positions[i3 + 2] = Math.random() * -100 - 50;
        
        // Color
        const brightness = 0.7 + Math.random() * 0.3;
        colors[i3] = brightness;
        colors[i3 + 1] = brightness;
        colors[i3 + 2] = brightness;
    }
    
    starfieldGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starfieldGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const starfieldMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    starfield = new THREE.Points(starfieldGeometry, starfieldMaterial);
    scene.add(starfield);
}

// Setup post-processing
function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    
    // Render pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Bloom pass
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.5,  // strength
        0.4,  // radius
        0.85  // threshold
    );
    composer.addPass(bloomPass);
    
    // TV effect pass
    const tvEffectPass = new ShaderPass(TVEffectShader);
    composer.addPass(tvEffectPass);
    
    // Gamma correction pass
    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    composer.addPass(gammaCorrectionPass);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    time += 0.01;
    
    // Update TV effect shader time
    composer.passes.forEach(pass => {
        if (pass.uniforms && pass.uniforms.time) {
            pass.uniforms.time.value = time;
        }
    });
    
    // Animate stars
    stars.forEach(star => {
        star.position.z += star.userData.speed;
        
        // Reset star position if it goes too far
        if (star.position.z > 10) {
            star.position.z = -30;
            star.position.x = Math.random() * 40 - 20;
            star.position.y = Math.random() * 40 - 20;
        }
        
        // Pulse star brightness
        const material = star.material;
        material.opacity = 0.5 + Math.sin(time * 3 + star.position.x) * 0.2;
    });
    
    // Animate nebulae
    nebulae.forEach(nebula => {
        nebula.position.z += nebula.userData.speed;
        
        // Rotate nebula
        nebula.rotation.x += nebula.userData.rotationSpeed.x;
        nebula.rotation.y += nebula.userData.rotationSpeed.y;
        nebula.rotation.z += nebula.userData.rotationSpeed.z;
        
        // Reset nebula position if it goes too far
        if (nebula.position.z > 10) {
            nebula.position.z = -40;
            nebula.position.x = Math.random() * 30 - 15;
            nebula.position.y = Math.random() * 30 - 15;
        }
    });
    
    // Slowly rotate starfield
    if (starfield) {
        starfield.rotation.y += 0.0001;
        starfield.rotation.z += 0.0002;
    }
    
    // Render the scene with post-processing
    composer.render();
}

// Initialize the scene when the page loads
window.addEventListener('load', init);
