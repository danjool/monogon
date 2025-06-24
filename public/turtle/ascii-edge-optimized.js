// ASCII Edge Effect Module
// Modular implementation of the AcerolaFX ASCII post-processing effect

// Default configuration with sensible values
const DEFAULT_CONFIG = {
    doG: {
        kernelSize: 2,
        sigma: 2.0,
        sigmaScale: 1.6,
        tau: 1.0,
        threshold: 0.005
    },
    edge: {
        depthThreshold: 0.1,
        normalThreshold: 0.1,
        sensitivity: 1.0
    },
    luminance: {
        scale: 1.0,
        exposure: 3.2,
        attenuation: 1.2,
        characterContrast: 1.0
    },
    ascii: {
        edgeThreshold: 8,
        colorPassThrough: false
    }
};

class ASCIIEdgePass extends THREE.ShaderPass {
    constructor(width, height, config = {}) {
        // Initialize with a simple pass-through shader - we'll override render()
        super({
            uniforms: {
                tDiffuse: { value: null }
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
                varying vec2 vUv;
                void main() {
                    gl_FragColor = texture2D(tDiffuse, vUv);
                }
            `
        });
        
        this.width = width;
        this.height = height;
        this.debugMode = 0;
        
        // Merge user config with defaults
        this.config = this.mergeConfig(DEFAULT_CONFIG, config);
        
        this.setupRenderTargets();
        this.createASCIITextures();
        this.setupMaterials();
        this.setupQuad();
        console.log('ASCIIEdgePass initialized with config:', this.config)
        console.log('Phase 1+3+4: Lower Res + Merged Luminance/Downscale + Merged Edge/Sobel (Phase 2 skipped)')
    }
    
    static create(width, height, config = {}) {
        return new ASCIIEdgePass(width, height, config);
    }
    
    mergeConfig(defaults, userConfig) {
        const result = JSON.parse(JSON.stringify(defaults)); // Deep clone
        
        for (const category in userConfig) {
            if (result[category]) {
                Object.assign(result[category], userConfig[category]);
            }
        }
        
        return result;
    }
    
    setupRenderTargets() {
        // Validate and ensure minimum dimensions
        this.width = Math.max(4, this.width || 800);
        this.height = Math.max(4, this.height || 600);
        
        // Calculate half-resolution dimensions with proper minimums
        this.dogWidth = Math.max(2, Math.floor(this.width / 2));
        this.dogHeight = Math.max(2, Math.floor(this.height / 2));
        this.normalWidth = Math.max(2, Math.floor(this.width / 2));
        this.normalHeight = Math.max(2, Math.floor(this.height / 2));
        
        // Calculate downscale dimensions
        this.downscaleWidth = Math.max(1, Math.floor(this.width / 8));
        this.downscaleHeight = Math.max(1, Math.floor(this.height / 8));
        
        // Base options for most render targets
        const options = {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            type: THREE.UnsignedByteType,
            stencilBuffer: false
        };
        
        // Options for render targets that will be upscaled (use linear filtering)
        const upscaleOptions = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            type: THREE.UnsignedByteType,
            stencilBuffer: false
        };
        
        // Main scene render target
        this.sceneTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
            ...options,
            format: THREE.RGBAFormat
        });
        
        // Phase 3: Luminance target removed - merged into downscale pass
        
        // Half-resolution luminance target for DoG processing
        this.luminanceHalfTarget = new THREE.WebGLRenderTarget(this.dogWidth, this.dogHeight, {
            ...options,
            format: THREE.RGBAFormat
        });
        
        // Downscaled target (1/8 resolution)
        this.downscaleTarget = new THREE.WebGLRenderTarget(this.downscaleWidth, this.downscaleHeight, {
            ...options,
            format: THREE.RGBAFormat
        });
        
        // DoG targets (half resolution for performance)
        this.dogTarget1 = new THREE.WebGLRenderTarget(this.dogWidth, this.dogHeight, {
            ...options,
            format: THREE.RGBAFormat
        });
        
        // dogTarget2: DoG result (will be upscaled)
        this.dogTarget2 = new THREE.WebGLRenderTarget(this.dogWidth, this.dogHeight, {
            ...upscaleOptions,
            format: THREE.RGBAFormat
        });
        
        // Edge targets
        // Phase 4: Merged edge+sobel target (replaces separate edge+sobel targets)
        this.edgeSobelTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
            ...options,
            format: THREE.RGBAFormat
        });
        
        // Normal target (half resolution for performance, will be upscaled)
        this.normalTarget = new THREE.WebGLRenderTarget(this.normalWidth, this.normalHeight, {
            ...upscaleOptions,
            format: THREE.RGBAFormat
        });
        
        // Full-resolution targets for upscaled results
        this.dogUpscaleTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
            ...options,
            format: THREE.RGBAFormat
        });
        
        // normalUpscaleTarget: RGBA (RGB normal + depth in alpha)
        this.normalUpscaleTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
            ...options,
            format: THREE.RGBAFormat
        });
        
        // Custom depth render target
        this.customDepthTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
            ...options,
            format: THREE.HalffloatType,
        });
    }
    
    createASCIITextures() {
        const loader = new THREE.TextureLoader();
        
        // Load edge ASCII PNG
        loader.load('../edgesASCII.png', (texture) => {
            this.edgesASCII = texture;
            this.edgesASCII.minFilter = THREE.NearestFilter;
            this.edgesASCII.magFilter = THREE.NearestFilter;
            this.edgesASCII.wrapS = THREE.RepeatWrapping;
            this.edgesASCII.wrapT = THREE.RepeatWrapping;
            
            if (this.asciiMaterial) {
                this.asciiMaterial.uniforms.tEdgesASCII.value = this.edgesASCII;
                this.asciiMaterial.uniforms.uEdgeTextureDims.value.set(40, 8);
                this.asciiMaterial.uniforms.uEdgeCharCount.value = 5.0;
                this.asciiMaterial.uniforms.uCellSize.value.set(8, 8);
            }
            console.log('Loaded edgesASCII.png');
        }, undefined, (error) => {
            console.error('Failed to load edgesASCII.png:', error);
        });
        
        // Load fill ASCII PNG  
        loader.load('../fillASCII.png', (texture) => {
            this.fillASCII = texture;
            this.fillASCII.minFilter = THREE.NearestFilter;
            this.fillASCII.magFilter = THREE.NearestFilter;
            this.fillASCII.wrapS = THREE.RepeatWrapping;
            this.fillASCII.wrapT = THREE.RepeatWrapping;
            
            if (this.asciiMaterial) {
                this.asciiMaterial.uniforms.tFillASCII.value = this.fillASCII;
                this.asciiMaterial.uniforms.uFillTextureDims.value.set(80, 8);
                this.asciiMaterial.uniforms.uFillCharCount.value = 10.0;
            }
            console.log('Loaded fillASCII.png');
        }, undefined, (error) => {
            console.error('Failed to load fillASCII.png:', error);
        });
    }
    
    setupMaterials() {
        // Custom depth material for better depth rendering
        this.customDepthMaterial = new THREE.ShaderMaterial({
            uniforms: {
                cameraNear: { value: 0.1 },
                cameraFar: { value: 1000.0 }
            },
            vertexShader: `
                varying float vDepth;
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    vDepth = -mvPosition.z;
                }
            `,
            fragmentShader: `
                uniform float cameraNear;
                uniform float cameraFar;
                varying float vDepth;
                
                void main() {
                    float normalizedDepth = (vDepth - cameraNear) / (cameraFar - cameraNear);
                    normalizedDepth = clamp(normalizedDepth, 0.0, 1.0);
                    gl_FragColor = vec4(normalizedDepth, normalizedDepth, normalizedDepth, 1.0);
                }
            `
        });
        
        // Luminance extraction material
        this.luminanceMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                uZoom: { value: 1.0 },
                uOffset: { value: new THREE.Vector2(0, 0) },
                uLuminanceScale: { value: this.config.luminance.scale }
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
                uniform float uZoom;
                uniform vec2 uOffset;
                uniform float uLuminanceScale;
                varying vec2 vUv;
                
                vec2 transformUV(vec2 uv) {
                    vec2 zoomUV = uv * 2.0 - 1.0;
                    zoomUV += vec2(-uOffset.x, uOffset.y) * 2.0;
                    zoomUV *= uZoom;
                    zoomUV = zoomUV * 0.5 + 0.5;
                    return zoomUV;
                }
                
                float luminance(vec3 color) {
                    return dot(color, vec3(0.299, 0.587, 0.114));
                }
                
                void main() {
                    vec2 uv = transformUV(vUv);
                    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                        gl_FragColor = vec4(0.0);
                        return;
                    }
                    vec3 color = texture2D(tDiffuse, uv).rgb;
                    float lum = luminance(color) * uLuminanceScale;
                    lum = clamp(lum, 0.0, 1.0);
                    gl_FragColor = vec4(lum, lum, lum, 1.0);
                }
            `
        });
        
        // Simple downscale material for half-resolution luminance
        this.luminanceDownscaleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null }
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
                varying vec2 vUv;
                void main() {
                    gl_FragColor = texture2D(tDiffuse, vUv);
                }
            `
        });
        
        // Upscale material for bringing half-res results back to full-res
        // Uses linear filtering for smoother interpolation
        this.upscaleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null }
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
                varying vec2 vUv;
                void main() {
                    gl_FragColor = texture2D(tDiffuse, vUv);
                }
            `
        });
        
        // Phase 3: Merged luminance+downscale material (combines 2 passes into 1)
        this.downscaleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                uCellSize: { value: new THREE.Vector2(8, 8) },
                resolution: { value: new THREE.Vector2(this.width, this.height) },
                uZoom: { value: 1.0 },
                uOffset: { value: new THREE.Vector2(0, 0) },
                uLuminanceScale: { value: this.config.luminance.scale }
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
                uniform vec2 uCellSize;
                uniform vec2 resolution;
                uniform float uZoom;
                uniform vec2 uOffset;
                uniform float uLuminanceScale;
                varying vec2 vUv;
                
                vec2 transformUV(vec2 uv) {
                    vec2 zoomUV = uv * 2.0 - 1.0;
                    zoomUV += vec2(-uOffset.x, uOffset.y) * 2.0;
                    zoomUV *= uZoom;
                    zoomUV = zoomUV * 0.5 + 0.5;
                    return zoomUV;
                }
                
                float luminance(vec3 color) {
                    return dot(color, vec3(0.299, 0.587, 0.114));
                }
                
                void main() {
                    // Downscale cell logic - quantize to ASCII cell grid
                    vec2 coord = vUv * resolution;
                    vec2 baseCoord = floor(coord / uCellSize.x) * uCellSize.x;
                    vec2 normalizedCoord = baseCoord / resolution;
                    
                    // Apply UV transform and sample scene (merged from luminance pass)
                    vec2 uv = transformUV(normalizedCoord);
                    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                        gl_FragColor = vec4(0.0);
                        return;
                    }
                    
                    vec3 color = texture2D(tDiffuse, uv).rgb;
                    
                    // Calculate luminance inline (merged from luminance pass)
                    float lum = luminance(color) * uLuminanceScale;
                    lum = clamp(lum, 0.0, 1.0);
                    
                    gl_FragColor = vec4(color, lum);
                }
            `
        });
        
        // Gaussian blur material
        this.blurMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                uDirection: { value: new THREE.Vector2(1, 0) },
                uSigma: { value: this.config.doG.sigma },
                uSigmaScale: { value: this.config.doG.sigmaScale },
                uKernelSize: { value: this.config.doG.kernelSize },
                resolution: { value: new THREE.Vector2(this.dogWidth, this.dogHeight) }
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
                uniform vec2 uDirection;
                uniform float uSigma;
                uniform float uSigmaScale;
                uniform int uKernelSize;
                uniform vec2 resolution;
                varying vec2 vUv;
                
                float gaussian(float sigma, float pos) {
                    return (1.0 / sqrt(2.0 * 3.14159 * sigma * sigma)) * exp(-(pos * pos) / (2.0 * sigma * sigma));
                }
                
                void main() {
                    vec2 texelSize = 1.0 / resolution;
                    vec2 blur = vec2(0.0);
                    vec2 kernelSum = vec2(0.0);
                    
                    for (int i = -10; i <= 10; i++) {
                        if (abs(i) > uKernelSize) continue;
                        
                        float fi = float(i);
                        vec2 luminance = texture2D(tDiffuse, vUv + fi * uDirection * texelSize).rr;
                        vec2 gauss = vec2(gaussian(uSigma, fi), gaussian(uSigma * uSigmaScale, fi));
                        
                        blur += luminance * gauss;
                        kernelSum += gauss;
                    }
                    
                    blur /= kernelSum;
                    gl_FragColor = vec4(blur.r, blur.g, blur.r, 1.0);
                }
            `
        });
        
        // DoG (Difference of Gaussians) material
        this.dogMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                tOriginal: { value: null },
                uDirection: { value: new THREE.Vector2(0, 1) },
                uSigma: { value: this.config.doG.sigma },
                uSigmaScale: { value: this.config.doG.sigmaScale },
                uKernelSize: { value: this.config.doG.kernelSize },
                uTau: { value: this.config.doG.tau },
                uThreshold: { value: this.config.doG.threshold },
                resolution: { value: new THREE.Vector2(this.dogWidth, this.dogHeight) }
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
                uniform sampler2D tOriginal;
                uniform vec2 uDirection;
                uniform float uSigma;
                uniform float uSigmaScale;
                uniform int uKernelSize;
                uniform float uTau;
                uniform float uThreshold;
                uniform vec2 resolution;
                varying vec2 vUv;
                
                float gaussian(float sigma, float pos) {
                    return (1.0 / sqrt(2.0 * 3.14159 * sigma * sigma)) * exp(-(pos * pos) / (2.0 * sigma * sigma));
                }
                
                void main() {
                    vec2 texelSize = 1.0 / resolution;
                    vec2 blur = vec2(0.0);
                    vec2 kernelSum = vec2(0.0);
                    
                    for (int i = -10; i <= 10; i++) {
                        if (abs(i) > uKernelSize) continue;
                        
                        float fi = float(i);
                        vec2 luminance = texture2D(tDiffuse, vUv + fi * uDirection * texelSize).rg;
                        vec2 gauss = vec2(gaussian(uSigma, fi), gaussian(uSigma * uSigmaScale, fi));
                        
                        blur += luminance * gauss;
                        kernelSum += gauss;
                    }
                    
                    blur /= kernelSum;
                    
                    float blur1 = blur.r;
                    float blur2 = blur.g;
                    float D = blur1 - uTau * blur2;
                    D = (D >= uThreshold) ? 1.0 : 0.0;
                    
                    gl_FragColor = vec4(D, D, D, 1.0);
                }
            `
        });
        
        // Normal calculation material
        this.normalMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDepth: { value: null },
                resolution: { value: new THREE.Vector2(this.normalWidth, this.normalHeight) },
                cameraNear: { value: 0.01 },
                cameraFar: { value: 100.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDepth;
                uniform vec2 resolution;
                uniform float cameraNear;
                uniform float cameraFar;
                varying vec2 vUv;
                
                float linearizeDepth(float depth) {
                    float z = depth * 2.0 - 1.0;
                    return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
                }
                
                void main() {
                    vec2 texelSize = 1.0 / resolution;
                    
                    float depth = linearizeDepth(texture2D(tDepth, vUv).r);
                    float depthL = linearizeDepth(texture2D(tDepth, vUv - vec2(texelSize.x, 0.0)).r);
                    float depthR = linearizeDepth(texture2D(tDepth, vUv + vec2(texelSize.x, 0.0)).r);
                    float depthU = linearizeDepth(texture2D(tDepth, vUv - vec2(0.0, texelSize.y)).r);
                    float depthD = linearizeDepth(texture2D(tDepth, vUv + vec2(0.0, texelSize.y)).r);
                    
                    float scale = 100.0;
                    vec3 normal = normalize(vec3(
                        (depthL - depthR) * scale,
                        (depthU - depthD) * scale, 
                        1.0
                    ));
                    
                    normal = normal * 0.5 + 0.5;
                    float originalDepth = texture2D(tDepth, vUv).r;
                    
                    gl_FragColor = vec4(normal, originalDepth);
                }
            `
        });
        
        // Edge detection material
        // Phase 4: Merged edge+sobel material (combines 2 passes into 1)
        this.edgeSobelMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDoG: { value: null },
                tNormals: { value: null },
                uUseDepth: { value: true },
                uUseNormals: { value: true },
                uDepthThreshold: { value: this.config.edge.depthThreshold },
                uNormalThreshold: { value: this.config.edge.normalThreshold },
                uDepthMin: { value: 0.0 },
                uDepthMax: { value: 1.0 },
                uEdgeSensitivity: { value: this.config.edge.sensitivity },
                resolution: { value: new THREE.Vector2(this.width, this.height) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDoG;
                uniform sampler2D tNormals;
                uniform bool uUseDepth;
                uniform bool uUseNormals;
                uniform float uDepthThreshold;
                uniform float uNormalThreshold;
                uniform float uDepthMin;
                uniform float uDepthMax;
                uniform float uEdgeSensitivity;
                uniform vec2 resolution;
                varying vec2 vUv;
                
                // Helper function to calculate edge intensity at any UV coordinate
                float getEdgeIntensity(vec2 uv) {
                    vec2 texelSize = 1.0 / resolution;
                    
                    vec4 c = texture2D(tNormals, uv);
                    vec4 w = texture2D(tNormals, uv - vec2(texelSize.x, 0.0));
                    vec4 e = texture2D(tNormals, uv + vec2(texelSize.x, 0.0));
                    vec4 n = texture2D(tNormals, uv - vec2(0.0, texelSize.y));
                    vec4 s = texture2D(tNormals, uv + vec2(0.0, texelSize.y));
                    
                    float edgeValue = 0.0;
                    
                    if (c.w < uDepthMin || c.w > uDepthMax) {
                        return 0.0;
                    }
                    
                    if (uUseDepth) {
                        float depthSum = 0.0;
                        depthSum += abs(w.w - c.w);
                        depthSum += abs(e.w - c.w);
                        depthSum += abs(n.w - c.w);
                        depthSum += abs(s.w - c.w);
                        
                        float depthScale = 1.0 - c.w;
                        depthSum *= (0.5 + depthScale * 1.5);
                        
                        if (depthSum > uDepthThreshold) {
                            edgeValue = max(edgeValue, min(depthSum * 2.0, 1.0));
                        }
                    }
                    
                    if (uUseNormals) {
                        vec3 normalSum = vec3(0.0);
                        normalSum += abs(w.rgb - c.rgb);
                        normalSum += abs(e.rgb - c.rgb);
                        normalSum += abs(n.rgb - c.rgb);
                        normalSum += abs(s.rgb - c.rgb);
                        
                        float normalMagnitude = dot(normalSum, vec3(1.0));
                        if (normalMagnitude > uNormalThreshold) {
                            edgeValue = max(edgeValue, normalMagnitude);
                        }
                    }
                    
                    float dog = texture2D(tDoG, uv).r;
                    return max(dog, edgeValue) * uEdgeSensitivity;
                }
                
                void main() {
                    // STEP 1: Calculate edge intensity at current pixel
                    float edge = getEdgeIntensity(vUv);
                    
                    // STEP 2: Calculate Sobel direction using edge intensity
                    vec2 texelSize = 1.0 / resolution;
                    
                    // 9-sample Sobel kernel on edge intensity
                    float tl = getEdgeIntensity(vUv + vec2(-texelSize.x, -texelSize.y));
                    float tm = getEdgeIntensity(vUv + vec2(0.0, -texelSize.y));
                    float tr = getEdgeIntensity(vUv + vec2(texelSize.x, -texelSize.y));
                    float ml = getEdgeIntensity(vUv + vec2(-texelSize.x, 0.0));
                    float mm = edge; // Current pixel (already calculated)
                    float mr = getEdgeIntensity(vUv + vec2(texelSize.x, 0.0));
                    float bl = getEdgeIntensity(vUv + vec2(-texelSize.x, texelSize.y));
                    float bm = getEdgeIntensity(vUv + vec2(0.0, texelSize.y));
                    float br = getEdgeIntensity(vUv + vec2(texelSize.x, texelSize.y));
                    
                    float sobelX = -tl + tr - 2.0*ml + 2.0*mr - bl + br;
                    float sobelY = -tl - 2.0*tm - tr + bl + 2.0*bm + br;
                    
                    float magnitude = length(vec2(sobelX, sobelY));
                    float angle = atan(sobelY, sobelX);
                    
                    float absTheta = abs(angle) / 3.14159;
                    float direction = -1.0;
                    
                    if (magnitude > 0.1) {
                        if ((absTheta >= 0.0 && absTheta < 0.05) || (absTheta > 0.9 && absTheta <= 1.0)) {
                            direction = 0.0; // VERTICAL
                        }
                        else if (absTheta > 0.45 && absTheta < 0.55) {
                            direction = 1.0; // HORIZONTAL
                        }
                        else if (absTheta > 0.05 && absTheta < 0.45) {
                            direction = (angle > 0.0) ? 2.0 : 3.0; // DIAGONAL 1
                        }
                        else if (absTheta > 0.55 && absTheta < 0.9) {
                            direction = (angle > 0.0) ? 3.0 : 2.0; // DIAGONAL 2
                        }
                    }
                    
                    // Output: R=edge_intensity, G=sobel_direction, B=sobel_magnitude, A=1.0
                    gl_FragColor = vec4(edge, direction / 4.0, magnitude, 1.0);
                }
            `
        });
        
        // ASCII selection material
        this.asciiMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tScene: { value: null },
                tLuminance: { value: null },
                tDownscale: { value: null },
                tEdges: { value: null },
                tSobel: { value: null },
                tEdgesASCII: { value: this.edgesASCII },
                tFillASCII: { value: this.fillASCII },
                uEdges: { value: true },
                uBackgroundColor: { value: new THREE.Vector3(0, 0, 0) },
                uBlendWithBase: { value: 0.0 },
                uCharacterContrast: { value: this.config.luminance.characterContrast },
                uEdgeThreshold: { value: this.config.ascii.edgeThreshold },
                uEdgeTextureDims: { value: new THREE.Vector2(40, 8) },
                uFillTextureDims: { value: new THREE.Vector2(80, 8) },
                uCellSize: { value: new THREE.Vector2(8, 8) },
                uEdgeCharCount: { value: 5.0 },
                uFillCharCount: { value: 9.0 },
                uFillOffsetLeft: { value: 4.0 },
                uFillOffsetDown: { value: 4.0 },
                uDebugDirectionMultiplier: { value: 5.0 },
                uDebugDirectionOffset: { value: 0.0 },
                uDebugShowDirections: { value: false },
                uExposure: { value: this.config.luminance.exposure },
                uAttenuation: { value: this.config.luminance.attenuation },
                uColorPassThrough: { value: this.config.ascii.colorPassThrough },
                resolution: { value: new THREE.Vector2(this.width, this.height) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tScene;
                uniform sampler2D tLuminance;
                uniform sampler2D tDownscale;
                uniform sampler2D tEdges;
                uniform sampler2D tSobel;
                uniform sampler2D tEdgesASCII;
                uniform sampler2D tFillASCII;
                uniform bool uEdges;
                uniform vec3 uBackgroundColor;
                uniform float uBlendWithBase;
                uniform float uCharacterContrast;
                uniform float uEdgeThreshold;
                uniform vec2 uEdgeTextureDims;
                uniform vec2 uFillTextureDims;
                uniform vec2 uCellSize;
                uniform float uEdgeCharCount;
                uniform float uFillCharCount;
                uniform float uFillOffsetLeft;
                uniform float uFillOffsetDown;
                uniform float uDebugDirectionMultiplier;
                uniform float uDebugDirectionOffset;
                uniform bool uDebugShowDirections;
                uniform float uExposure;
                uniform float uAttenuation;
                uniform bool uColorPassThrough;
                uniform vec2 resolution;
                varying vec2 vUv;
                
                void main() {
                    vec2 pixelCoord = vUv * resolution;
                    vec2 offsetPixelCoord = pixelCoord + vec2(uFillOffsetLeft, uFillOffsetDown);
                    vec2 tileCoord = floor(offsetPixelCoord / uCellSize.x);
                    vec2 localCoord = mod(offsetPixelCoord, uCellSize.x);
                    
                    vec2 tileUV = (tileCoord * uCellSize.x + 0.5 * uCellSize.x) / resolution;
                    vec4 downscaleInfo = texture2D(tDownscale, tileUV);
                    
                    float edgeSum = 0.0;
                    vec4 directionCount = vec4(0.0);
                    
                    for (int x = 0; x < 8; x++) {
                        if (float(x) >= uCellSize.x) break;
                        for (int y = 0; y < 8; y++) {
                            if (float(y) >= uCellSize.y) break;
                            vec2 sampleCoord = (tileCoord * uCellSize.x + vec2(float(x), float(y))) / resolution;
                            float edge = texture2D(tEdges, sampleCoord).r;
                            vec2 sobel = texture2D(tSobel, sampleCoord).rg;
                            
                            if (edge > 0.1) {
                                edgeSum += 1.0;
                                float direction = sobel.g * uDebugDirectionMultiplier + uDebugDirectionOffset; // Phase 4: Read direction from G channel in merged texture
                                
                                if (direction < 1.0) directionCount.x += 1.0;
                                else if (direction < 2.0) directionCount.y += 1.0;
                                else if (direction < 3.0) directionCount.z += 1.0;
                                else directionCount.w += 1.0;
                            }
                        }
                    }
                    
                    float maxDir = max(max(directionCount.x, directionCount.y), max(directionCount.z, directionCount.w));
                    int dominantDirection = -1;
                    
                    if (maxDir >= uEdgeThreshold) {
                        if (directionCount.x == maxDir) dominantDirection = 0;
                        else if (directionCount.y == maxDir) dominantDirection = 1;
                        else if (directionCount.z == maxDir) dominantDirection = 2;
                        else dominantDirection = 3;
                    }
                    
                    vec3 ascii = vec3(0.0);
                    
                    if (dominantDirection >= 0 && uEdges) {
                        vec2 edgeUV = vec2(
                            localCoord.x + float(((dominantDirection == 2) ? 3 : (dominantDirection == 3) ? 2 : dominantDirection) + 1) * uCellSize.x,
                            localCoord.y
                        );
                        edgeUV /= uEdgeTextureDims;
                        ascii = texture2D(tEdgesASCII, edgeUV).rgb;
                    } else {
                        float luminance = downscaleInfo.a;
                        luminance = clamp(pow(luminance * uExposure, uAttenuation), 0.0, 1.0);
                        luminance = max(0.0, (floor(luminance * 10.0) - 1.0)) / 10.0;
                        luminance = clamp(luminance, 0.0, 1.0);
                        float charIndex = floor(luminance * uFillCharCount);
                        charIndex = clamp(charIndex, 0.0, uFillCharCount - 1.0);
                        
                        vec2 fillUV = vec2(
                            localCoord.x + charIndex * uCellSize.x,
                            localCoord.y
                        );
                        fillUV /= uFillTextureDims;
                        ascii = texture2D(tFillASCII, fillUV).rgb;
                    }
                    
                    float contrastMask = pow(ascii.r, 1.0 / max(uCharacterContrast, 0.1));
                    vec3 finalColor;

                    if (uDebugShowDirections) {
                        if (dominantDirection == 0) finalColor = vec3(1.0, 0.0, 0.0); 
                        else if (dominantDirection == 1) finalColor = vec3(0.0, 1.0, 0.0); 
                        else if (dominantDirection == 2) finalColor = vec3(0.0, 0.0, 1.0); 
                        else if (dominantDirection == 3) finalColor = vec3(1.0, 1.0, 0.0); 
                        else finalColor = vec3(0.0, 0.0, 0.0); 
                    } else {
                        if (uColorPassThrough) {
                            if (contrastMask > 0.5) {
                                finalColor = downscaleInfo.rgb;
                            } else {
                                finalColor = vec3(0.0, 0.0, 0.0);
                            }
                        } else {
                            if (contrastMask > 0.5) {
                                finalColor = mix(vec3(0.0, 0.8, 1.0), downscaleInfo.rgb, uBlendWithBase);
                            } else {
                                finalColor = vec3(0.0, 0.1, 0.3);
                            }
                        }
                    }
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `
        });
    }
    
    setupQuad() {
        const geometry = new THREE.PlaneGeometry(2, 2);
        this.quad = new THREE.Mesh(geometry);
    }
    
    setDebugMode(mode) {
        this.debugMode = mode;
    }
    
    setDepthTexture(depthTexture) {
        this.externalDepthTexture = depthTexture;
    }
    
    updateConfig(newConfig) {
        // Merge new config with existing config
        this.config = this.mergeConfig(this.config, newConfig);
        
        // Update material uniforms with new values
        if (this.blurMaterial) {
            this.blurMaterial.uniforms.uSigma.value = this.config.doG.sigma;
            this.blurMaterial.uniforms.uSigmaScale.value = this.config.doG.sigmaScale;
            this.blurMaterial.uniforms.uKernelSize.value = this.config.doG.kernelSize;
        }
        
        if (this.dogMaterial) {
            this.dogMaterial.uniforms.uSigma.value = this.config.doG.sigma;
            this.dogMaterial.uniforms.uSigmaScale.value = this.config.doG.sigmaScale;
            this.dogMaterial.uniforms.uKernelSize.value = this.config.doG.kernelSize;
            this.dogMaterial.uniforms.uTau.value = this.config.doG.tau;
            this.dogMaterial.uniforms.uThreshold.value = this.config.doG.threshold;
        }
        
        if (this.downscaleMaterial) {
            this.downscaleMaterial.uniforms.uLuminanceScale.value = this.config.luminance.scale;
        }
        
        if (this.edgeSobelMaterial) {
            this.edgeSobelMaterial.uniforms.uDepthThreshold.value = this.config.edge.depthThreshold;
            this.edgeSobelMaterial.uniforms.uNormalThreshold.value = this.config.edge.normalThreshold;
            this.edgeSobelMaterial.uniforms.uEdgeSensitivity.value = this.config.edge.sensitivity;
        }
        
        if (this.asciiMaterial) {
            this.asciiMaterial.uniforms.uCharacterContrast.value = this.config.luminance.characterContrast;
            this.asciiMaterial.uniforms.uEdgeThreshold.value = this.config.ascii.edgeThreshold;
            this.asciiMaterial.uniforms.uExposure.value = this.config.luminance.exposure;
            this.asciiMaterial.uniforms.uAttenuation.value = this.config.luminance.attenuation;
            this.asciiMaterial.uniforms.uColorPassThrough.value = this.config.ascii.colorPassThrough;
        }
    }
    
    resize(width, height) {
        // Validate and ensure minimum dimensions
        this.width = Math.max(4, width);
        this.height = Math.max(4, height);
        
        // Update half-resolution dimensions with proper minimums
        this.dogWidth = Math.max(2, Math.floor(this.width / 2));
        this.dogHeight = Math.max(2, Math.floor(this.height / 2));
        this.normalWidth = Math.max(2, Math.floor(this.width / 2));
        this.normalHeight = Math.max(2, Math.floor(this.height / 2));
        
        // Resize full-resolution targets
        this.sceneTarget.setSize(this.width, this.height);
        // Phase 3: luminanceTarget removed - merged into downscale pass
        this.edgeSobelTarget.setSize(this.width, this.height); // Phase 4: Merged edge+sobel target
        this.customDepthTarget.setSize(this.width, this.height);
        this.dogUpscaleTarget.setSize(this.width, this.height);
        this.normalUpscaleTarget.setSize(this.width, this.height);
        
        // Resize half-resolution targets
        this.luminanceHalfTarget.setSize(this.dogWidth, this.dogHeight);
        this.dogTarget1.setSize(this.dogWidth, this.dogHeight);
        this.dogTarget2.setSize(this.dogWidth, this.dogHeight);
        this.normalTarget.setSize(this.normalWidth, this.normalHeight);
        
        // Update downscale target
        this.downscaleWidth = Math.max(1, Math.floor(this.width / 8));
        this.downscaleHeight = Math.max(1, Math.floor(this.height / 8));
        this.downscaleTarget.setSize(this.downscaleWidth, this.downscaleHeight);
        
        // Update resolution uniforms
        const resolution = new THREE.Vector2(this.width, this.height);
        const dogResolution = new THREE.Vector2(this.dogWidth, this.dogHeight);
        const normalResolution = new THREE.Vector2(this.normalWidth, this.normalHeight);
        
        // Phase 3: luminanceMaterial removed - merged into downscale
        this.downscaleMaterial.uniforms.resolution.value = resolution;
        this.blurMaterial.uniforms.resolution.value = dogResolution;
        this.dogMaterial.uniforms.resolution.value = dogResolution;
        this.normalMaterial.uniforms.resolution.value = normalResolution;
        this.edgeSobelMaterial.uniforms.resolution.value = resolution;
        this.asciiMaterial.uniforms.resolution.value = resolution;
    }
    
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        // Store the current render target
        const currentRenderTarget = renderer.getRenderTarget();
        
        // 1. Phase 3: Merged luminance+downscale for ASCII cells (replaces separate luminance+downscale passes)
        this.quad.material = this.downscaleMaterial;
        this.downscaleMaterial.uniforms.tDiffuse.value = readBuffer.texture;
        renderer.setRenderTarget(this.downscaleTarget);
        renderer.render(this.quad, orthoCamera);
        
        // 2. Create half-resolution luminance for DoG processing (still needed)
        this.quad.material = this.luminanceDownscaleMaterial;
        this.luminanceDownscaleMaterial.uniforms.tDiffuse.value = this.downscaleTarget.texture;
        renderer.setRenderTarget(this.luminanceHalfTarget);
        renderer.render(this.quad, orthoCamera);
        
        if (this.debugMode === 2) {
            this.quad.material = new THREE.MeshBasicMaterial({ map: this.downscaleTarget.texture });
            renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
            renderer.render(this.quad, orthoCamera);
            return;
        }
        
        // 4. Horizontal blur (DoG step 1) - now at half resolution
        this.quad.material = this.blurMaterial;
        this.blurMaterial.uniforms.tDiffuse.value = this.luminanceHalfTarget.texture;
        this.blurMaterial.uniforms.uDirection.value.set(1, 0);
        renderer.setRenderTarget(this.dogTarget1);
        renderer.render(this.quad, orthoCamera);
        
        if (this.debugMode === 3) {
            this.quad.material = new THREE.MeshBasicMaterial({ map: this.dogTarget1.texture });
            renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
            renderer.render(this.quad, orthoCamera);
            return;
        }
        
        // 5. Vertical blur + DoG (DoG step 2) - still at half resolution
        this.quad.material = this.dogMaterial;
        this.dogMaterial.uniforms.tDiffuse.value = this.dogTarget1.texture;
        this.dogMaterial.uniforms.tOriginal.value = this.luminanceHalfTarget.texture;
        this.dogMaterial.uniforms.uDirection.value.set(0, 1);
        renderer.setRenderTarget(this.dogTarget2);
        renderer.render(this.quad, orthoCamera);
        
        if (this.debugMode === 4) {
            this.quad.material = new THREE.MeshBasicMaterial({ map: this.dogTarget2.texture });
            renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
            renderer.render(this.quad, orthoCamera);
            return;
        }
        
        // 5. Use depth texture (from external depth pass or fallback to black)
        let depthTexture = this.externalDepthTexture;
        if (!depthTexture) {
            // Fallback to black texture if no depth provided
            if (!this.blackTexture) {
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 1;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, 1, 1);
                this.blackTexture = new THREE.CanvasTexture(canvas);
            }
            depthTexture = this.blackTexture;
        }
        
        // 6. Calculate normals at half resolution
        this.quad.material = this.normalMaterial;
        this.normalMaterial.uniforms.tDepth.value = depthTexture;
        renderer.setRenderTarget(this.normalTarget);
        renderer.render(this.quad, orthoCamera);
        
        // 7. Upscale DoG result to full resolution
        this.quad.material = this.upscaleMaterial;
        this.upscaleMaterial.uniforms.tDiffuse.value = this.dogTarget2.texture;
        renderer.setRenderTarget(this.dogUpscaleTarget);
        renderer.render(this.quad, orthoCamera);
        
        // 8. Upscale normal result to full resolution  
        this.quad.material = this.upscaleMaterial;
        this.upscaleMaterial.uniforms.tDiffuse.value = this.normalTarget.texture;
        renderer.setRenderTarget(this.normalUpscaleTarget);
        renderer.render(this.quad, orthoCamera);
        
        if (this.debugMode === 5) {
            this.quad.material = new THREE.MeshBasicMaterial({ map: this.normalUpscaleTarget.texture });
            renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
            renderer.render(this.quad, orthoCamera);
            return;
        }
        
        // 8. Phase 4: Merged edge+sobel detection using upscaled results
        this.quad.material = this.edgeSobelMaterial;
        this.edgeSobelMaterial.uniforms.tDoG.value = this.dogUpscaleTarget.texture;
        this.edgeSobelMaterial.uniforms.tNormals.value = this.normalUpscaleTarget.texture;
        renderer.setRenderTarget(this.edgeSobelTarget);
        renderer.render(this.quad, orthoCamera);
        
        if (this.debugMode === 6) {
            this.quad.material = new THREE.MeshBasicMaterial({ map: this.edgeSobelTarget.texture });
            renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
            renderer.render(this.quad, orthoCamera);
            return;
        }
        
        // 9. Final ASCII composition
        this.quad.material = this.asciiMaterial;
        this.asciiMaterial.uniforms.tScene.value = readBuffer.texture;
        this.asciiMaterial.uniforms.tLuminance.value = this.downscaleTarget.texture; // Phase 3: Use merged downscale target
        this.asciiMaterial.uniforms.tDownscale.value = this.downscaleTarget.texture;
        this.asciiMaterial.uniforms.tEdges.value = this.edgeSobelTarget.texture; // Phase 4: Use merged edge+sobel target
        this.asciiMaterial.uniforms.tSobel.value = this.edgeSobelTarget.texture; // Phase 4: Use merged edge+sobel target
        
        if (this.debugMode === 1) {
            // Show original scene
            this.quad.material = new THREE.MeshBasicMaterial({ map: readBuffer.texture });
        }
        
        renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
        renderer.render(this.quad, orthoCamera);
    }
    
    dispose() {
        // Dispose of render targets
        this.sceneTarget?.dispose();
        // Phase 3: luminanceTarget removed - merged into downscale pass
        this.luminanceHalfTarget?.dispose();
        this.downscaleTarget?.dispose();
        this.dogTarget1?.dispose();
        this.dogTarget2?.dispose();
        this.dogUpscaleTarget?.dispose();
        this.normalTarget?.dispose();
        this.normalUpscaleTarget?.dispose();
        this.edgeSobelTarget?.dispose(); // Phase 4: Merged edge+sobel target
        this.customDepthTarget?.dispose();
        
        // Dispose of materials
        this.customDepthMaterial?.dispose();
        // Phase 3: luminanceMaterial removed - merged into downscale material
        this.luminanceDownscaleMaterial?.dispose();
        this.upscaleMaterial?.dispose();
        this.downscaleMaterial?.dispose();
        this.blurMaterial?.dispose();
        this.dogMaterial?.dispose();
        this.normalMaterial?.dispose();
        this.edgeSobelMaterial?.dispose(); // Phase 4: Merged edge+sobel material
        this.asciiMaterial?.dispose();
        
        // Dispose of textures
        this.edgesASCII?.dispose();
        this.fillASCII?.dispose();
        this.blackTexture?.dispose();
        
        // Dispose of geometry
        this.quad?.geometry?.dispose();
    }
}

export default ASCIIEdgePass;
