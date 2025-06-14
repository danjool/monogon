// Carpet Flow Field module - adapted from matrix-flow-field.js
import * as THREE from 'three';

export class CarpetFlowField {
    constructor(scene, camera, renderer, carpet, config) {
        // Store references
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.carpet = carpet;
        this.config = config; // Flow field configuration
        
        // Get parameters from config (these will update in real-time)
        this.getParamsFromConfig();
        
        // Module scope variables
        this.positionRenderTarget1 = null;
        this.positionRenderTarget2 = null;
        this.velocityRenderTarget1 = null;
        this.velocityRenderTarget2 = null;
        this.computeScene = null;
        this.computeCamera = null;
        this.computeQuad = null;
        this.particleSystem = null;
        this.positionTexture1 = null;
        this.positionTexture2 = null;
        this.velocityTexture1 = null;
        this.velocityTexture2 = null;
        this.currentTexture = 0; // 0 = first set, 1 = second set
        this.time = 0;
        this.lastTime = 0;
        this.initialized = false;
        this.velocityMaterial = null;
        this.positionMaterial = null;
        this.frame = 0;
        
        // Initialize the system
        this.init();
    }
    
    getParamsFromConfig() {
        // Extract parameters from config - these will be read fresh each frame
        this.PARAMS = {
            simulationSize: this.config.simulationSize.value,
            bounds: this.config.bounds.value,
            time: 1,
            particleSize: this.config.particleSize.value,
            colorIntensity: this.config.colorIntensity.value,
            flowSpeed: this.config.flowSpeed.value,
            turbulence: this.config.turbulence.value,
            noiseScale: this.config.noiseScale.value,
            vortexScale: this.config.vortexScale.value,
            simSpeed: this.config.simSpeed.value,
            emissionRate: this.config.emissionRate.value,
            particleLifespan: this.config.particleLifespan.value,
            damping: this.config.damping.value,
        };
    }
    
    // Utility functions shared between shaders
    get shaderUtilsCode() {
        return `
          // Simplex noise functions
          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
          vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
          
          float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            
            // First corner
            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            
            // Other corners
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            
            // Permutations
            i = mod289(i);
            vec4 p = permute(permute(permute(
                      i.z + vec4(0.0, i1.z, i2.z, 1.0))
                      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                      
            // Gradients
            float n_ = 0.142857142857; // 1.0/7.0
            vec3 ns = n_ * D.wyz - D.xzx;
            
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
            
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            
            // Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            
            // Mix final noise value
            vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
          }
          
          vec3 flowField(vec3 position, float time, float vortexScale, float noiseScale, vec3 vel) {
            vec3 flow = vec3(0.0);
            
            // Create vortex centers: players first, then sky fallback
            vec3 vortexCenters[8];
            vec3 playerPositions[8];
            playerPositions[0] = playerPosition1;
            playerPositions[1] = playerPosition2;
            playerPositions[2] = playerPosition3;
            playerPositions[3] = playerPosition4;
            playerPositions[4] = playerPosition5;
            playerPositions[5] = playerPosition6;
            playerPositions[6] = playerPosition7;
            playerPositions[7] = playerPosition8;
            
            // Sky vortex patterns
            vec3 skyVortexCenters[8];
            skyVortexCenters[0] = vec3( 20.0 * sin(time * 0.011),    15.0 * cos(time * 0.011),     10.0 * sin(time * 0.023));
            skyVortexCenters[1] = vec3( 99.0 * cos(time * 0.019),   -15.0 * sin(time * 0.09),    -55.0 * cos(time * 0.01));
            skyVortexCenters[2] = vec3( 117.0 * sin(time * 0.025),    -30.0 * cos(time * 0.08),    25.0 * sin(time * 0.07));
            skyVortexCenters[3] = vec3( 75.0 * cos(time * 0.013),    45.0 * sin(time * 0.021),     35.0 * cos(time * 0.017));
            skyVortexCenters[4] = vec3(-80.0 * sin(time * 0.016),   -25.0 * cos(time * 0.034),   -60.0 * sin(time * 0.012));
            skyVortexCenters[5] = vec3( 65.0 * cos(time * 0.028),    55.0 * sin(time * 0.015),    40.0 * cos(time * 0.026));
            skyVortexCenters[6] = vec3(-95.0 * sin(time * 0.022),    30.0 * cos(time * 0.018),   -45.0 * sin(time * 0.031));
            skyVortexCenters[7] = vec3( 85.0 * cos(time * 0.014),   -40.0 * sin(time * 0.029),    50.0 * cos(time * 0.024));
            
            for (int i = 0; i < 8; i++) {
              if (float(i) < vortexCount) {
                vortexCenters[i] = playerPositions[i] * 0.1;
              } else {
                vortexCenters[i] = skyVortexCenters[i];
              }
            }
            
            float vortexStrengths[8];
            vortexStrengths[0] = vortexStrength1;
            vortexStrengths[1] = vortexStrength2;
            vortexStrengths[2] = vortexStrength3;
            vortexStrengths[3] = vortexStrength4;
            vortexStrengths[4] = vortexStrength5;
            vortexStrengths[5] = vortexStrength6;
            vortexStrengths[6] = vortexStrength7;
            vortexStrengths[7] = vortexStrength8;
            
            vec3 playerForwards[8];
            playerForwards[0] = playerForward1;
            playerForwards[1] = playerForward2;
            playerForwards[2] = playerForward3;
            playerForwards[3] = playerForward4;
            playerForwards[4] = playerForward5;
            playerForwards[5] = playerForward6;
            playerForwards[6] = playerForward7;
            playerForwards[7] = playerForward8;
            
            for (int i = 0; i < 8; i++) {
              vec3 toVortex = vortexCenters[i] - position;
              float dist = length(toVortex);
              float strength = vortexStrengths[i] / (1.0 + 1.05 * dist * dist);
              
              if (strength == 0.0) continue;
              
              if (float(i) < vortexCount) {
                // Player vortices: orientation-based swirl
                vec3 playerForward = normalize(playerForwards[i]);
                vec3 toCenter = normalize(toVortex);
                vec3 tangent = normalize(cross(playerForward, toCenter));
                
                vec3 attraction = toCenter * 1.2;
                vec3 spiral = tangent * 1.8;
                // flow += (attraction + spiral) * strength; // disabled for tuning
              } else {
                // Sky vortices: perpendicular spiral pattern
                vec3 perpendicular = normalize(vec3(
                  toVortex.y - toVortex.z,
                  toVortex.z - toVortex.x,
                  toVortex.x - toVortex.y
                ));
                
                flow += (vortexScale*.5*(4.0-float(i))*normalize(toVortex) * 0.5 + perpendicular) * strength;
              }
            }
            
            // Wave motion
            float waveX = sin(position.x * waveFrequency + time * 0.2) * cos(position.z * waveFrequency * 1.2) * 0.3;
            float waveY = cos(position.y * waveFrequency + time * 0.15) * sin(position.x * waveFrequency * 1.2) * 0.3;
            float waveZ = sin(position.z * waveFrequency + time * 0.1) * cos(position.y * waveFrequency * 1.2) * 0.3;
            
            flow += vec3(waveX, waveY, waveZ) * waveAmplitude;
            
            // Noise for organic movement
            float scale = noiseAmplitude;
            vec3 noise = vec3(
              snoise(vec3(position.x * scale, position.y * scale, position.z * scale + time * 0.1)),
              snoise(vec3(position.x * scale + 100.0, position.y * scale, position.z * scale + time * 0.1)),
              snoise(vec3(position.x * scale, position.y * scale + 100.0, position.z * scale + time * 0.1))
            ) * noiseScale;
            
            flow += noise;
            
            return flow;
          }
          
          float random(vec2 uv, float seed) {
            return fract(sin(dot(uv, vec2(12.9898, 78.233) + seed)) * 43758.5453);
          }
        `;
    }

    get velocityShader() {
        return `
          uniform sampler2D positionTexture;
          uniform sampler2D velocityTexture;
          uniform float time;
          uniform float deltaTime;
          uniform float turbulence;
          uniform float noiseScale;
          uniform float vortexScale;
          uniform vec3 carpetPosition;
          uniform vec3 emissionPoint1;
          uniform vec3 emissionPoint2;
          uniform vec3 emissionPoint3;
          uniform vec3 emissionPoint4;
          uniform vec3 emissionPoint5;
          uniform vec3 emissionPoint6;
          uniform vec3 emissionPoint7;
          uniform vec3 emissionPoint8;
          uniform vec3 emissionVelocity1;
          uniform vec3 emissionVelocity2;
          uniform vec3 emissionVelocity3;
          uniform vec3 emissionVelocity4;
          uniform vec3 emissionVelocity5;
          uniform vec3 emissionVelocity6;
          uniform vec3 emissionVelocity7;
          uniform vec3 emissionVelocity8;
          uniform float damping;
          uniform float vortexStrength;
          uniform float vortexCount;
          uniform float waveAmplitude;
          uniform float waveFrequency;
          uniform float noiseAmplitude;
          uniform float mixingRate;
          uniform vec3 playerPosition1;
          uniform vec3 playerPosition2;
          uniform vec3 playerPosition3;
          uniform vec3 playerPosition4;
          uniform vec3 playerPosition5;
          uniform vec3 playerPosition6;
          uniform vec3 playerPosition7;
          uniform vec3 playerPosition8;
          uniform vec3 playerForward1;
          uniform vec3 playerForward2;
          uniform vec3 playerForward3;
          uniform vec3 playerForward4;
          uniform vec3 playerForward5;
          uniform vec3 playerForward6;
          uniform vec3 playerForward7;
          uniform vec3 playerForward8;
          uniform float vortexStrength1;
          uniform float vortexStrength2;
          uniform float vortexStrength3;
          uniform float vortexStrength4;
          uniform float vortexStrength5;
          uniform float vortexStrength6;
          uniform float vortexStrength7;
          uniform float vortexStrength8;
          
          varying vec2 vUv;
          
          ${this.shaderUtilsCode}
          
          void main() {
            vec4 posData = texture2D(positionTexture, vUv);
            vec3 pos = posData.xyz;
            float life = posData.w;
            
            vec4 velData = texture2D(velocityTexture, vUv);
            vec3 vel = velData.xyz;
            float initialSpeed = velData.w;
            
            vec3 flowVector = flowField(pos*.1, time, vortexScale, noiseScale, vel) * turbulence; // * (2.0 - life);
            
            vel = mix(vel, flowVector, mixingRate * min(deltaTime * 10.6, 1.0));
            
            if( life == 0.975 ) {
              vel = vec3(0.0, 0.0, 0.0);
              vec3 carpetForce = 10.* normalize(carpetPosition);
              vel += carpetForce;
            }
            gl_FragColor = vec4(vel, initialSpeed);
          }
        `;
    }

    get positionShader() {
        return `
          uniform sampler2D positionTexture;
          uniform sampler2D velocityTexture;
          uniform float time;
          uniform float deltaTime;
          uniform float flowSpeed;
          uniform float bounds;
          uniform float emissionRate;
          uniform float particleLifespan;
          uniform float frameCount;
          uniform vec3 carpetPosition;
          uniform vec3 emissionPoint1;
          uniform vec3 emissionPoint2;
          uniform vec3 emissionPoint3;
          uniform vec3 emissionPoint4;
          uniform vec3 emissionPoint5;
          uniform vec3 emissionPoint6;
          uniform vec3 emissionPoint7;
          uniform vec3 emissionPoint8;
          uniform float vortexStrength;
          uniform float vortexCount;
          uniform float waveAmplitude;
          uniform float waveFrequency;
          uniform float noiseAmplitude;
          uniform vec3 playerPosition1;
          uniform vec3 playerPosition2;
          uniform vec3 playerPosition3;
          uniform vec3 playerPosition4;
          uniform vec3 playerPosition5;
          uniform vec3 playerPosition6;
          uniform vec3 playerPosition7;
          uniform vec3 playerPosition8;
          uniform vec3 playerForward1;
          uniform vec3 playerForward2;
          uniform vec3 playerForward3;
          uniform vec3 playerForward4;
          uniform vec3 playerForward5;
          uniform vec3 playerForward6;
          uniform vec3 playerForward7;
          uniform vec3 playerForward8;
          uniform float vortexStrength1;
          uniform float vortexStrength2;
          uniform float vortexStrength3;
          uniform float vortexStrength4;
          uniform float vortexStrength5;
          uniform float vortexStrength6;
          uniform float vortexStrength7;
          uniform float vortexStrength8;
          
          varying vec2 vUv;
          
          ${this.shaderUtilsCode}
          
          void main() {
            vec4 posData = texture2D(positionTexture, vUv);
            vec3 pos = posData.xyz;
            float life = posData.w;
            
            vec3 vel = texture2D(velocityTexture, vUv).xyz;
            
            pos += vel * flowSpeed * deltaTime;
            
            life -= 0.01 * deltaTime * .06;

            // Deterministic particle emission based on frame and UV
            int frameWrappedAroundSimSizeSquared = int(mod(frameCount , float(256 * 256)));
            int uvWrappedAroundSimSizeSquared = int(mod(vUv.x * 256.0*256.0 + vUv.y*256., float(256 * 256)));

            if(frameWrappedAroundSimSizeSquared == uvWrappedAroundSimSizeSquared) {
              int emissionIndex = int(mod(float(uvWrappedAroundSimSizeSquared), 8.0));
              
              if(emissionIndex == 0) pos = emissionPoint1;
              else if(emissionIndex == 1) pos = emissionPoint2;
              else if(emissionIndex == 2) pos = emissionPoint3;
              else if(emissionIndex == 3) pos = emissionPoint4;
              else if(emissionIndex == 4) pos = emissionPoint5;
              else if(emissionIndex == 5) pos = emissionPoint6;
              else if(emissionIndex == 6) pos = emissionPoint7;
              else pos = emissionPoint8;
              
              life = 0.975; 
            }
            gl_FragColor = vec4(pos, life);
          }
        `;
    }

    // Render shader for particles
    get particleVertexShader() {
        return `
          uniform sampler2D positionTexture;
          uniform float particleSize;
          uniform float time;
          
          varying vec3 vColor;
          varying float vLife;
          
          // HSL to RGB conversion
          vec3 hsl2rgb(vec3 c) {
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
            return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
          }
          
          void main() {
            // Get particle UV from position attribute
            vec2 uv = position.xy;
            
            // Sample position texture to get particle position and life
            vec4 texData = texture2D(positionTexture, uv);
            vec3 pos = texData.xyz;
            float life = texData.w;
            
            // Handle invisible particles
            if (life <= 0.0) {
              // Move inactive particles far away and make them invisible
              gl_Position = vec4(0.0, 0.0, 10000.0, 1.0);
              gl_PointSize = 0.0;
              vLife = 0.0;
              vColor = vec3(0.0);
              return;
            }
            
            // For newly created particles, set appropriate life for display
            vLife = min(life, 0.98);
            
              // Random particles in space - standard color scheme
              float dist = length(pos);
              float hue = mod(dist * 0.001, 1.0);
              float saturation = 1.0;
              float lightness = 0.5;
              vColor = hsl2rgb(vec3(hue, saturation, lightness));
            
            
            // Use positions directly without scaling, in world space
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            
            // Apply distance-based sizing with a minimum size to ensure visibility
            // float size = max(particleSize * 2.0, particleSize * (100.0 / max(10.0, -mvPosition.z))); 
            float size = particleSize * 10000.0 / (1. + mvPosition.z * 0.01);
            
            // Apply life-based scaling for fade in/out
            // gl_PointSize = size * (0.3 + 0.7 * vLife);
            // gl_PointSize = clamp( (5.3 - 0.7 * vLife), 2., 10.0); // Clamp size for visibility
            // gl_PointSize = clamp(size, .2, 10.0);

float fovFactor = 1.15; // approximately 1/tan(37.5°)
  float apparentSize = particleSize * fovFactor / (-mvPosition.z);
  gl_PointSize = clamp(apparentSize*19900., 2.0, 64.0);

            gl_Position = projectionMatrix * mvPosition;
          }
        `;
    }

    get particleFragmentShader() {
        return `
          varying vec3 vColor;
          varying float vLife;
          
          uniform float colorIntensity;
          
          void main() {
            // Discard fragments for inactive particles
            if (vLife <= 0.01) discard;
            
            // Calculate distance from center of point
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            
            // Create soft particle effect
            float strength = smoothstep(0.5, 0.0, dist);
            
            // Apply brightness based on life
            float brightness = vLife * colorIntensity;
            
            // Apply color with adjusted brightness
            gl_FragColor = vec4(vColor * brightness, strength * vLife);
            
            // Discard pixels outside of point radius
            if (dist > 0.5) discard;
          }
        `;
    }

    init() {
        // Return if already initialized
        if (this.initialized) return;
        
        // Create Three.js components for the GPU compute passes
        this.computeScene = new THREE.Scene();
        this.computeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.computeQuad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            null
        );
        this.computeScene.add(this.computeQuad);
        
        const size = this.PARAMS.simulationSize;
        
        // Create position textures - xyz: position, w: life
        this.positionTexture1 = this.createDataTexture(size, (i, size) => {
            // Random position in a sphere (like in matrix-flow-field.js)
            const radius = Math.random() * this.PARAMS.bounds * 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            return [
                radius * Math.sin(phi) * Math.cos(theta), // x
                radius * Math.sin(phi) * Math.sin(theta), // y
                radius * Math.cos(phi),                   // z
                Math.random() * 0.98                      // life (random between 0-0.98)
            ];
        });
        
        this.positionTexture2 = this.positionTexture1.clone();
        
        // Create velocity textures - xyz: velocity, w: initial speed
        this.velocityTexture1 = this.createDataTexture(size, (i, size) => {            
            return [ 0, 0, 0, 0, ];
        });
        
        this.velocityTexture2 = this.velocityTexture1.clone();
        
        // Create render targets for compute passes
        const rtOptions = {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            stencilBuffer: false,
            depthBuffer: false
        };
        
        this.positionRenderTarget1 = new THREE.WebGLRenderTarget(size, size, rtOptions);
        this.positionRenderTarget2 = new THREE.WebGLRenderTarget(size, size, rtOptions);
        this.velocityRenderTarget1 = new THREE.WebGLRenderTarget(size, size, rtOptions);
        this.velocityRenderTarget2 = new THREE.WebGLRenderTarget(size, size, rtOptions);
        
        // Copy initial data to render targets
        this.renderer.setRenderTarget(this.positionRenderTarget1);
        this.renderer.render(new THREE.Scene(), this.computeCamera); // Clear
        this.renderer.setRenderTarget(this.positionRenderTarget2);
        this.renderer.render(new THREE.Scene(), this.computeCamera); // Clear
        this.renderer.setRenderTarget(this.velocityRenderTarget1);
        this.renderer.render(new THREE.Scene(), this.computeCamera); // Clear
        this.renderer.setRenderTarget(this.velocityRenderTarget2);
        this.renderer.render(new THREE.Scene(), this.computeCamera); // Clear
        this.renderer.setRenderTarget(null);
        
        // Create the particle system
        this.createParticles(size);
        
        this.initialized = true;
    }

    // Create a texture filled with random data
    createDataTexture(size, generator) {
        const data = new Float32Array(size * size * 4);
        
        for (let i = 0; i < size * size; i++) {
            const stride = i * 4;
            const values = generator(i, size);
            
            data[stride] = values[0];     // r
            data[stride + 1] = values[1]; // g
            data[stride + 2] = values[2]; // b
            data[stride + 3] = values[3]; // a
        }
        
        const texture = new THREE.DataTexture(
            data,
            size,
            size,
            THREE.RGBAFormat,
            THREE.FloatType
        );
        
        texture.needsUpdate = true;
        return texture;
    }

    setMultiplayerManager(multiplayerManager) {
        this.multiplayerManager = multiplayerManager;
    }

    // Create the particle rendering system
    createParticles(size) {
        // Clean up previous system if it exists
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem);
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
        }
        
        // Create particle geometry - just a grid of UV coordinates
        const geometry = new THREE.BufferGeometry();
        const particles = size * size;
        
        const positions = new Float32Array(particles * 3);
        let p = 0;
        
        for (let j = 0; j < size; j++) {
            for (let i = 0; i < size; i++) {
                positions[p++] = (i + 0.5) / size;  // x = u
                positions[p++] = (j + 0.5) / size;  // y = v
                positions[p++] = 0;                 // z = unused
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create particle material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                positionTexture: { value: null },
                particleSize: { value: this.PARAMS.particleSize },
                colorIntensity: { value: this.PARAMS.colorIntensity },
                time: { value: 0 }
            },
            vertexShader: this.particleVertexShader,
            fragmentShader: this.particleFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create the particle system
        this.particleSystem = new THREE.Points(geometry, material);
        this.particleSystem.frustumCulled = false; // Disable frustum culling for particles
        this.scene.add(this.particleSystem);

        // Create compute shader materials
        this.velocityMaterial = new THREE.ShaderMaterial({
            uniforms: {
                positionTexture: { value: null },
                velocityTexture: { value: null },
                time: { value: 0 },
                deltaTime: { value: 0 },
                turbulence: { value: this.PARAMS.turbulence },
                noiseScale: { value: this.PARAMS.noiseScale },
                vortexScale: { value: this.PARAMS.vortexScale },
                carpetPosition: { value: new THREE.Vector3() },
                emissionPoint1: { value: new THREE.Vector3() },
                emissionPoint2: { value: new THREE.Vector3() },
                emissionPoint3: { value: new THREE.Vector3() },
                emissionPoint4: { value: new THREE.Vector3() },
                emissionPoint5: { value: new THREE.Vector3() },
                emissionPoint6: { value: new THREE.Vector3() },
                emissionPoint7: { value: new THREE.Vector3() },
                emissionPoint8: { value: new THREE.Vector3() },
                emissionVelocity1: { value: new THREE.Vector3() },
                emissionVelocity2: { value: new THREE.Vector3() },
                emissionVelocity3: { value: new THREE.Vector3() },
                emissionVelocity4: { value: new THREE.Vector3() },
                emissionVelocity5: { value: new THREE.Vector3() },
                emissionVelocity6: { value: new THREE.Vector3() },
                emissionVelocity7: { value: new THREE.Vector3() },
                emissionVelocity8: { value: new THREE.Vector3() },
                damping: { value: this.PARAMS.damping },
                vortexStrength: { value: this.config.vortexStrength.value },
                vortexCount: { value: this.config.vortexCount?.value || 0 },
                waveAmplitude: { value: this.config.waveAmplitude.value },
                waveFrequency: { value: this.config.waveFrequency.value },
                noiseAmplitude: { value: this.config.noiseAmplitude.value },
                mixingRate: { value: this.config.mixingRate.value },
                playerPosition1: { value: new THREE.Vector3() },
                playerPosition2: { value: new THREE.Vector3() },
                playerPosition3: { value: new THREE.Vector3() },
                playerPosition4: { value: new THREE.Vector3() },
                playerPosition5: { value: new THREE.Vector3() },
                playerPosition6: { value: new THREE.Vector3() },
                playerPosition7: { value: new THREE.Vector3() },
                playerPosition8: { value: new THREE.Vector3() },
                playerForward1: { value: new THREE.Vector3() },
                playerForward2: { value: new THREE.Vector3() },
                playerForward3: { value: new THREE.Vector3() },
                playerForward4: { value: new THREE.Vector3() },
                playerForward5: { value: new THREE.Vector3() },
                playerForward6: { value: new THREE.Vector3() },
                playerForward7: { value: new THREE.Vector3() },
                playerForward8: { value: new THREE.Vector3() },
                vortexStrength1: { value: 0.0 },
                vortexStrength2: { value: 0.0 },
                vortexStrength3: { value: 0.0 },
                vortexStrength4: { value: 0.0 },
                vortexStrength5: { value: 0.0 },
                vortexStrength6: { value: 0.0 },
                vortexStrength7: { value: 0.0 },
                vortexStrength8: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: this.velocityShader
        });
        
        this.positionMaterial = new THREE.ShaderMaterial({
            uniforms: {
                positionTexture: { value: null },
                velocityTexture: { value: null },
                time: { value: 0 },
                deltaTime: { value: 0 },
                flowSpeed: { value: this.PARAMS.flowSpeed },
                bounds: { value: this.PARAMS.bounds },
                emissionRate: { value: this.PARAMS.emissionRate },
                particleLifespan: { value: this.PARAMS.particleLifespan },
                frameCount: { value: 0 },
                carpetPosition: { value: new THREE.Vector3() },
                emissionPoint1: { value: new THREE.Vector3() },
                emissionPoint2: { value: new THREE.Vector3() },
                emissionPoint3: { value: new THREE.Vector3() },
                emissionPoint4: { value: new THREE.Vector3() },
                emissionPoint5: { value: new THREE.Vector3() },
                emissionPoint6: { value: new THREE.Vector3() },
                emissionPoint7: { value: new THREE.Vector3() },
                emissionPoint8: { value: new THREE.Vector3() },
                vortexStrength: { value: this.config.vortexStrength.value },
                vortexCount: { value: this.config.vortexCount?.value || 0 },
                waveAmplitude: { value: this.config.waveAmplitude.value },
                waveFrequency: { value: this.config.waveFrequency.value },
                noiseAmplitude: { value: this.config.noiseAmplitude.value },
                playerPosition1: { value: new THREE.Vector3() },
                playerPosition2: { value: new THREE.Vector3() },
                playerPosition3: { value: new THREE.Vector3() },
                playerPosition4: { value: new THREE.Vector3() },
                playerPosition5: { value: new THREE.Vector3() },
                playerPosition6: { value: new THREE.Vector3() },
                playerPosition7: { value: new THREE.Vector3() },
                playerPosition8: { value: new THREE.Vector3() },
                playerForward1: { value: new THREE.Vector3() },
                playerForward2: { value: new THREE.Vector3() },
                playerForward3: { value: new THREE.Vector3() },
                playerForward4: { value: new THREE.Vector3() },
                playerForward5: { value: new THREE.Vector3() },
                playerForward6: { value: new THREE.Vector3() },
                playerForward7: { value: new THREE.Vector3() },
                playerForward8: { value: new THREE.Vector3() },
                vortexStrength1: { value: 0.0 },
                vortexStrength2: { value: 0.0 },
                vortexStrength3: { value: 0.0 },
                vortexStrength4: { value: 0.0 },
                vortexStrength5: { value: 0.0 },
                vortexStrength6: { value: 0.0 },
                vortexStrength7: { value: 0.0 },
                vortexStrength8: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: this.positionShader
        });
    }

    // Perform compute shader passes and update the particle system
    compute(deltaTime, emissionPoints, frameCount) {
        // Skip if not initialized
        if (!this.initialized) return;
        
                // Get all emission points and player data from local carpet and other players
        const allEmissionPoints = [];
        const allEmissionVelocities = [];
        const allPlayerPositions = [];
        const allPlayerForwards = [];
        
        // Add local carpet
        allEmissionPoints.push(
          emissionPoints[0] || this.carpet.getEmissionPoint() || new THREE.Vector3(0, 0, 100000)
        );
        allEmissionVelocities.push(new THREE.Vector3(0, 0, 0)); // Zero velocity as requested
        allPlayerPositions.push(this.carpet.position.clone());
        allPlayerForwards.push(this.carpet.forward.clone());
        
        // Add other players if multiplayer is active
        if (this.multiplayerManager) {
            this.multiplayerManager.otherPlayers.forEach(player => {
                allEmissionPoints.push(player.getEmissionPoint());
                allEmissionVelocities.push(new THREE.Vector3(0, 0, 0)); // Zero velocity as requested
                allPlayerPositions.push(player.position ? player.position.clone() : new THREE.Vector3(0, 0, 100000));
                // Handle missing forward property - use default forward direction
                const forward = player.forward || new THREE.Vector3(0, -1, 0);
                allPlayerForwards.push(forward.clone ? forward.clone() : new THREE.Vector3(0, -1, 0));
            });
        }
        
        // Fill remaining slots up to 8 with emission points and default player data
        while (allEmissionPoints.length < 8) {
            allEmissionPoints.push( emissionPoints[allEmissionPoints.length] || new THREE.Vector3(0, 0, 100000) );
            allEmissionVelocities.push(new THREE.Vector3(0, 0, 0));
            allPlayerPositions.push(new THREE.Vector3(0, 0, 100000)); // Far away default position
            allPlayerForwards.push(new THREE.Vector3(0, -1, 0)); // Default forward
        }
        
        // Calculate vortex count (number of active players) with safety checks
        const otherPlayersCount = (this.multiplayerManager && this.multiplayerManager.otherPlayers) 
            ? this.multiplayerManager.otherPlayers.size : 0;
        const activePlayerCount = Math.min(8, 1 + (otherPlayersCount || 0));
        
        // Get current and next render targets
        const posFrom = this.currentTexture === 0 ? this.positionRenderTarget1 : this.positionRenderTarget2;
        const velFrom = this.currentTexture === 0 ? this.velocityRenderTarget1 : this.velocityRenderTarget2;
        const posTo = this.currentTexture === 0 ? this.positionRenderTarget2 : this.positionRenderTarget1;
        const velTo = this.currentTexture === 0 ? this.velocityRenderTarget2 : this.velocityRenderTarget1;
        
        // Update velocity uniforms
        this.velocityMaterial.uniforms.positionTexture.value = posFrom.texture;
        this.velocityMaterial.uniforms.velocityTexture.value = velFrom.texture;
        this.velocityMaterial.uniforms.time.value = this.PARAMS.time;
        this.velocityMaterial.uniforms.deltaTime.value = deltaTime;
        this.velocityMaterial.uniforms.turbulence.value = this.config.turbulence.value;
        this.velocityMaterial.uniforms.noiseScale.value = this.config.noiseScale.value;
        this.velocityMaterial.uniforms.vortexScale.value = this.config.vortexScale.value;
        this.velocityMaterial.uniforms.carpetPosition.value.copy(this.carpet.position);
        
        // Update all emission points and velocities
        for (let i = 0; i < 8; i++) {
            this.velocityMaterial.uniforms[`emissionPoint${i+1}`].value.copy(allEmissionPoints[i]);
            this.velocityMaterial.uniforms[`emissionVelocity${i+1}`].value.copy(allEmissionVelocities[i]);
        }
        
        // Update all player positions and forward vectors
        for (let i = 0; i < 8; i++) {
            this.velocityMaterial.uniforms[`playerPosition${i+1}`].value.copy(allPlayerPositions[i]);
            this.velocityMaterial.uniforms[`playerForward${i+1}`].value.copy(allPlayerForwards[i]);
        }
        
        // Set individual vortex strengths
        const baseVortexStrength = this.config.vortexStrength.value;
        for (let i = 0; i < 8; i++) {
            if (i < activePlayerCount) {
                // Player vortices: use moderate strength for nice effect
                this.velocityMaterial.uniforms[`vortexStrength${i+1}`].value = baseVortexStrength * 50.0;
            } else {
                // Sky vortices: use base strength
                this.velocityMaterial.uniforms[`vortexStrength${i+1}`].value = baseVortexStrength;
            }
        }
        
        this.velocityMaterial.uniforms.damping.value = this.config.damping.value;
        
        // Update advanced flow field uniforms
        this.velocityMaterial.uniforms.vortexStrength.value = this.config.vortexStrength.value;
        this.velocityMaterial.uniforms.vortexCount.value = activePlayerCount; // Use dynamic player count
        this.velocityMaterial.uniforms.waveAmplitude.value = this.config.waveAmplitude.value;
        this.velocityMaterial.uniforms.waveFrequency.value = this.config.waveFrequency.value;
        this.velocityMaterial.uniforms.noiseAmplitude.value = this.config.noiseAmplitude.value;
        this.velocityMaterial.uniforms.mixingRate.value = this.config.mixingRate.value;
        
        // Render velocity pass
        this.computeQuad.material = this.velocityMaterial;
        this.renderer.setRenderTarget(velTo);
        this.renderer.render(this.computeScene, this.computeCamera);
        
        // Update position uniforms
        this.positionMaterial.uniforms.positionTexture.value = posFrom.texture;
        this.positionMaterial.uniforms.velocityTexture.value = velTo.texture;
        this.positionMaterial.uniforms.time.value = this.PARAMS.time;
        this.positionMaterial.uniforms.deltaTime.value = deltaTime;
        this.positionMaterial.uniforms.flowSpeed.value = this.config.flowSpeed.value;
        this.positionMaterial.uniforms.bounds.value = this.config.bounds.value;
        this.positionMaterial.uniforms.emissionRate.value = this.config.emissionRate.value;
        this.positionMaterial.uniforms.particleLifespan.value = this.config.particleLifespan.value;
        this.positionMaterial.uniforms.frameCount.value = frameCount;
        this.positionMaterial.uniforms.carpetPosition.value.copy(this.carpet.position);
        
        // Update all emission points for position shader
        for (let i = 0; i < 8; i++) {
            this.positionMaterial.uniforms[`emissionPoint${i+1}`].value.copy(allEmissionPoints[i]);
        }
        
        // Update all player positions and forward vectors for position shader
        for (let i = 0; i < 8; i++) {
            this.positionMaterial.uniforms[`playerPosition${i+1}`].value.copy(allPlayerPositions[i]);
            this.positionMaterial.uniforms[`playerForward${i+1}`].value.copy(allPlayerForwards[i]);
        }
        
        // Set individual vortex strengths for position shader
        for (let i = 0; i < 8; i++) {
            if (i < activePlayerCount) {
                // Player vortices: use moderate strength for nice effect
                this.positionMaterial.uniforms[`vortexStrength${i+1}`].value = baseVortexStrength * 50.0;
            } else {
                // Sky vortices: use base strength
                this.positionMaterial.uniforms[`vortexStrength${i+1}`].value = baseVortexStrength;
            }
        }
        
        // Update advanced flow field uniforms for position shader
        this.positionMaterial.uniforms.vortexStrength.value = this.config.vortexStrength.value;
        this.positionMaterial.uniforms.vortexCount.value = activePlayerCount; // Use dynamic player count
        this.positionMaterial.uniforms.waveAmplitude.value = this.config.waveAmplitude.value;
        this.positionMaterial.uniforms.waveFrequency.value = this.config.waveFrequency.value;
        this.positionMaterial.uniforms.noiseAmplitude.value = this.config.noiseAmplitude.value;
        
        // Render position pass
        this.computeQuad.material = this.positionMaterial;
        this.renderer.setRenderTarget(posTo);
        this.renderer.render(this.computeScene, this.computeCamera);
        
        // Reset render target
        this.renderer.setRenderTarget(null);
        
        // Update particle system uniforms
        this.particleSystem.material.uniforms.positionTexture.value = posTo.texture;
        this.particleSystem.material.uniforms.particleSize.value = this.config.particleSize.value;
        this.particleSystem.material.uniforms.colorIntensity.value = this.config.colorIntensity.value;
        this.particleSystem.material.uniforms.time.value = this.PARAMS.time;
        
        // Swap textures for next frame
        this.currentTexture = 1 - this.currentTexture;
    }
    
    // Update method called from animation loop
    update(deltaTime, emissionPoints, frameCount) {
        // Skip if not fully initialized
        if (!this.initialized || !this.carpet) return;
        
        // Update time parameter using config
        this.PARAMS.time += deltaTime * this.config.simSpeed.value;
        
        // Run compute pass (GPU simulation)
        this.compute(deltaTime * this.config.simSpeed.value, emissionPoints, frameCount);
    }
}
