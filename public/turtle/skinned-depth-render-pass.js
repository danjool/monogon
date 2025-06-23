// Skinned Depth Render Pass
// Enhanced postprocessing pass that properly handles animated GLTF models with skeletal animation

class SkinnedDepthRenderPass extends THREE.Pass {
    constructor(scene, camera) {
        super();
        
        this.scene = scene;
        this.camera = camera;
        this.needsSwap = false;
        
        // Create regular depth material for static meshes
        this.depthMaterial = new THREE.ShaderMaterial({
            uniforms: {
                cameraNear: { value: camera.near },
                cameraFar: { value: camera.far }
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
        
        // Create skinned depth material for animated meshes
        this.skinnedDepthMaterial = new THREE.ShaderMaterial({
            uniforms: {
                cameraNear: { value: camera.near },
                cameraFar: { value: camera.far }
            },
            vertexShader: `
                #include <skinning_pars_vertex>
                varying float vDepth;
                
                void main() {
                    #include <skinbase_vertex>
                    #include <begin_vertex>
                    #include <skinning_vertex>
                    #include <project_vertex>
                    
                    // mvPosition is already defined by project_vertex chunk
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
            `,
            skinning: true
        });
        
        // Create render target for depth
        this.depthTarget = null;
        this.originalMaterials = new Map();
    }
    
    setSize(width, height) {
        if (this.depthTarget) {
            this.depthTarget.dispose();
        }
        
        this.depthTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            type: THREE.UnsignedByteType,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });
    }
    
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        if (!this.depthTarget) {
            const size = renderer.getSize(new THREE.Vector2());
            this.setSize(size.x, size.y);
        }
        
        // Update camera parameters for both materials
        this.depthMaterial.uniforms.cameraNear.value = this.camera.near;
        this.depthMaterial.uniforms.cameraFar.value = this.camera.far;
        this.skinnedDepthMaterial.uniforms.cameraNear.value = this.camera.near;
        this.skinnedDepthMaterial.uniforms.cameraFar.value = this.camera.far;
        
        // Store original materials and apply appropriate depth materials
        this.originalMaterials.clear();
        this.scene.traverse((child) => {
            if (child.isMesh && child.material) {
                this.originalMaterials.set(child, child.material);
                
                // Use skinned depth material for SkinnedMesh, regular for others
                if (child.isSkinnedMesh) {
                    child.material = this.skinnedDepthMaterial;
                } else {
                    child.material = this.depthMaterial;
                }
            }
        });
        
        // Render depth to target
        const currentRenderTarget = renderer.getRenderTarget();
        renderer.setRenderTarget(this.depthTarget);
        renderer.render(this.scene, this.camera);
        
        // Restore original materials
        this.originalMaterials.forEach((material, child) => {
            child.material = material;
        });
        
        // Restore render target
        renderer.setRenderTarget(currentRenderTarget);
    }
    
    getDepthTexture() {
        return this.depthTarget ? this.depthTarget.texture : null;
    }
    
    dispose() {
        if (this.depthTarget) {
            this.depthTarget.dispose();
        }
        this.depthMaterial.dispose();
        this.skinnedDepthMaterial.dispose();
        this.originalMaterials.clear();
    }
}

export default SkinnedDepthRenderPass;