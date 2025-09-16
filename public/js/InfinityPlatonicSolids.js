/**
 * InfinityPlatonicSolids.js
 * Three.js implementation of platonic solids with infinity mirror shader effects
 * Adapted from inf-platonic.html
 */

class InfinityPlatonicSolid {
    constructor(options = {}) {
        // Default options
        this.options = {
            solidType: options.solidType || 'dodecahedron',
            radius: options.radius || 1,
            position: options.position || new THREE.Vector3(0, 0, 0),
            rotation: options.rotation || new THREE.Euler(0, 0, 0),
            autoRotate: options.autoRotate !== undefined ? options.autoRotate : true,
            color: options.color || new THREE.Color(0.2, 0.8, 1.0) // Default blue color (like previous dodecahedron)
        };
        
        // Set rotation speeds (optional with defaults)
        this.rotationSpeed = {
            x: options.rotationSpeedX || 0.,
            y: options.rotationSpeedY || 0.
        };
        
        // Initialize solid transforms - same as in original implementation
        this.solidTransforms = {
            tetrahedron: {
                rotation: { x: Math.PI, y: 0, z: 0 },
                flip: { x: true, y: false, z: false },
                swap: { xy: false, xz: false, yz: false },
                scale: 1./3.
            },
            cube: {
                rotation: { x: 0, y: 0, z: 0 },
                flip: { x: false, y: false, z: false },
                swap: { xy: false, xz: false, yz: false },
                scale: 1.0
            },
            octahedron: {
                rotation: { x: 0, y: 0, z: 0 },
                flip: { x: false, y: false, z: false },
                swap: { xy: false, xz: false, yz: false },  
                scale: 0.58
            },
            dodecahedron: {
                rotation: { x: 0, y: 0, z: 0 },
                flip: { x: false, y: false, z: false },
                swap: { xy: true, xz: false, yz: true },
                scale: 0.8
            },
            icosahedron: {
                rotation: { x: 0, y: 0, z: 0 },
                flip: { x: false, y: false, z: false },
                swap: { xy: false, xz: false, yz: false },
                scale: 0.79
            }
        };
        
        // Current transform state (will be set in createSolid)
        this.transformState = null;
        
        // Create the solid
        this.createSolid();
    }
    
    /**
     * Create the platonic solid with infinity mirror shader
     */
    createSolid() {
        // Set initial transform state based on solid type
        this.transformState = JSON.parse(JSON.stringify(this.solidTransforms[this.options.solidType]));
        
        console.log('Creating solid:', this.options.solidType, 'with radius:', this.options.radius);
        // Create geometry
        this.geometry = this.createGeometry(this.options.solidType);
        this.geometry.computeVertexNormals();
        
        // Create material with custom shader
        this.material = new THREE.ShaderMaterial({
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getFragmentShader(),
            uniforms: {
                iTime: { value: 0 },
                modelMatrix: { value: new THREE.Matrix4() },
                modelMatrixInverse: { value: new THREE.Matrix4() },
                planeEquations: { value: [] },
                totalPlane: { value: this.getPlaneCount(this.options.solidType) },
                edgeColor: { value: new THREE.Vector3(
                    this.options.color.r, 
                    this.options.color.g, 
                    this.options.color.b
                )}
            },
            radius: { value: this.options.radius },
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        // Create mesh and set initial position/rotation
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.options.position);
        this.mesh.rotation.copy(this.options.rotation);
        
        // Calculate initial plane equations
        this.updatePlaneEquations();
    }
    
    /**
     * Get the plane count for a given solid type
     */
    getPlaneCount(solidType) {
        switch(solidType) {
            case 'tetrahedron': return 4;
            case 'cube': return 6;
            case 'octahedron': return 8;
            case 'dodecahedron': return 12;
            case 'icosahedron': return 20;
            default: return 12;
        }
    }

    createGeometry(solidType) {
        const RADIUS = this.options.radius;
        
        switch(solidType) {
            case 'tetrahedron':
                return new THREE.TetrahedronGeometry(RADIUS, 0);
            case 'cube':
                return new THREE.BoxGeometry(RADIUS * 2, RADIUS * 2, RADIUS * 2);
            case 'octahedron':
                return new THREE.OctahedronGeometry(RADIUS, 0);
            case 'dodecahedron':
                return new THREE.DodecahedronGeometry(RADIUS, 0);
            case 'icosahedron':
                return new THREE.IcosahedronGeometry(RADIUS, 0);
            default:
                return new THREE.DodecahedronGeometry(RADIUS, 0);
        }
    }
    
    /**
     * Generate normals/planes for different platonic solids
     */
    generatePlatonicSolidPlanes(solidType) {
        const normals = [];
        
        switch(solidType) {
            case 'tetrahedron':
                // Regular tetrahedron with 4 faces
                // Using coordinates where vertices are at (±1, ±1, ±1) with even number of minus signs
                normals.push(
                    new THREE.Vector3(1, 1, 1).normalize(),
                    new THREE.Vector3(1, -1, -1).normalize(),
                    new THREE.Vector3(-1, 1, -1).normalize(),
                    new THREE.Vector3(-1, -1, 1).normalize()
                );
                break;
                
            case 'cube':
                // Regular cube/hexahedron with 6 faces
                normals.push(
                    new THREE.Vector3(1, 0, 0),  // +X face
                    new THREE.Vector3(-1, 0, 0), // -X face
                    new THREE.Vector3(0, 1, 0),  // +Y face
                    new THREE.Vector3(0, -1, 0), // -Y face
                    new THREE.Vector3(0, 0, 1),  // +Z face
                    new THREE.Vector3(0, 0, -1)  // -Z face
                );
                break;
                
            case 'octahedron':
                // Regular octahedron with 8 faces
                // Each face normal points from origin to the midpoint of the face
                const oct = 1/Math.sqrt(3);
                normals.push(
                    new THREE.Vector3(oct, oct, oct),
                    new THREE.Vector3(oct, oct, -oct),
                    new THREE.Vector3(oct, -oct, oct),
                    new THREE.Vector3(oct, -oct, -oct),
                    new THREE.Vector3(-oct, oct, oct),
                    new THREE.Vector3(-oct, oct, -oct),
                    new THREE.Vector3(-oct, -oct, oct),
                    new THREE.Vector3(-oct, -oct, -oct)
                );
                break;
                
            case 'dodecahedron':
                // Regular dodecahedron with 12 faces
                // Calculate the golden ratio (phi)
                const phi = (1 + Math.sqrt(5)) / 2;
                
                // Normalized vectors for constructing the dodecahedron planes
                const a = 1.0;
                const b = 1.0 / phi;
                
                // Normalize
                const norm = Math.sqrt(a*a + b*b);
                const a_norm = a / norm;
                const b_norm = b / norm;
                
                normals.push(
                    new THREE.Vector3(a_norm, b_norm, 0),
                    new THREE.Vector3(-a_norm, b_norm, 0),
                    new THREE.Vector3(a_norm, -b_norm, 0),
                    new THREE.Vector3(-a_norm, -b_norm, 0),
                    new THREE.Vector3(0, a_norm, b_norm),
                    new THREE.Vector3(0, -a_norm, b_norm),
                    new THREE.Vector3(0, a_norm, -b_norm),
                    new THREE.Vector3(0, -a_norm, -b_norm),
                    new THREE.Vector3(b_norm, 0, a_norm),
                    new THREE.Vector3(-b_norm, 0, a_norm),
                    new THREE.Vector3(b_norm, 0, -a_norm),
                    new THREE.Vector3(-b_norm, 0, -a_norm)
                );
                break;
                
            case 'icosahedron':
                // Regular icosahedron with 20 faces
                // Using the direct face normal approach from the shader code
                
                // Constants from the provided shader code
                const ico_a = 0.525731;
                const ico_b = 0.850651;
                
                // Create the 12 vertices of the icosahedron
                const vertices = [
                    // (0, ±ico_a, ±ico_b)
                    new THREE.Vector3(0, ico_a, ico_b),
                    new THREE.Vector3(0, ico_a, -ico_b),
                    new THREE.Vector3(0, -ico_a, ico_b),
                    new THREE.Vector3(0, -ico_a, -ico_b),
                    
                    // (±ico_b, 0, ±ico_a)
                    new THREE.Vector3(ico_b, 0, ico_a),
                    new THREE.Vector3(ico_b, 0, -ico_a),
                    new THREE.Vector3(-ico_b, 0, ico_a),
                    new THREE.Vector3(-ico_b, 0, -ico_a),
                    
                    // (±ico_a, ±ico_b, 0)
                    new THREE.Vector3(ico_a, ico_b, 0),
                    new THREE.Vector3(-ico_a, ico_b, 0),
                    new THREE.Vector3(ico_a, -ico_b, 0),
                    new THREE.Vector3(-ico_a, -ico_b, 0)
                ];
                
                // Define the 20 faces by vertex indices (from shader code)
                const faces = [
                    [0, 4, 2], [0, 6, 2], [1, 5, 3], [1, 7, 3],
                    [8, 0, 9], [8, 1, 9], [10, 2, 11], [10, 3, 11],
                    [4, 8, 5], [4, 10, 5], [6, 9, 7], [6, 11, 7],
                    [0, 8, 4], [0, 9, 6], [2, 4, 10], [2, 6, 11],
                    [1, 8, 5], [1, 9, 7], [3, 5, 10], [3, 7, 11]
                ];
                
                // Compute face normals
                for (const face of faces) {
                    const v1 = vertices[face[0]];
                    const v2 = vertices[face[1]];
                    const v3 = vertices[face[2]];
                    
                    // Calculate face normal
                    const a = new THREE.Vector3().subVectors(v2, v1);
                    const b = new THREE.Vector3().subVectors(v3, v1);
                    const normal = new THREE.Vector3().crossVectors(a, b).normalize();
                    
                    normals.push(normal);
                }
                break;
        }
        
        return normals;
    }
    
    /**
     * Update plane equations based on the current solid and transformations
     */
    updatePlaneEquations() {
        // Get base normals for the current solid type
        let normals = this.generatePlatonicSolidPlanes(this.options.solidType);
        
        // Apply transformations to all normals
        normals = normals.map(normal => {
            let x = normal.x;
            let y = normal.y;
            let z = normal.z;
            
            // Apply swaps
            if (this.transformState.swap.xy) {
                [x, y] = [y, x];
            }
            if (this.transformState.swap.xz) {
                [x, z] = [z, x];
            }
            if (this.transformState.swap.yz) {
                [y, z] = [z, y];
            }
            
            // Apply flips
            if (this.transformState.flip.x) x = -x;
            if (this.transformState.flip.y) y = -y;
            if (this.transformState.flip.z) z = -z;
            
            // Create vector with initial transformations
            let vec = new THREE.Vector3(x, y, z);
            
            // Apply rotations
            if (this.transformState.rotation.x !== 0) {
                vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.transformState.rotation.x);
            }
            if (this.transformState.rotation.y !== 0) {
                vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.transformState.rotation.y);
            }
            if (this.transformState.rotation.z !== 0) {
                vec.applyAxisAngle(new THREE.Vector3(0, 0, 1), this.transformState.rotation.z);
            }
            
            return vec;
        });
        
        // Calculate and validate plane equations for each face
        const planeEquations = [];
        for (let i = 0; i < normals.length; i++) {
            const normal = normals[i];
            
            // The distance from origin to face scaled by the user-controlled factor
            const d = -this.options.radius * this.transformState.scale;
            
            // Plane equation: Ax + By + Cz + D = 0
            planeEquations.push(normal.x, normal.y, normal.z, d);
        }
        
        // Update the shader uniform
        this.material.uniforms.planeEquations.value = planeEquations;
        this.material.uniforms.totalPlane.value = normals.length;
    }
    
    /**
     * Change the solid type
     */
    setSolidType(solidType) {
        // Only change if different
        if (this.options.solidType === solidType) return;
        
        // Set new type
        this.options.solidType = solidType;
        
        // Update transform state
        this.transformState = JSON.parse(JSON.stringify(this.solidTransforms[solidType]));
        
        // Update geometry
        if (this.mesh && this.geometry) {
            this.geometry.dispose();
            this.geometry = this.createGeometry(solidType);
            this.mesh.geometry = this.geometry;
        }
        
        // Update plane equations
        this.updatePlaneEquations();
    }
    
    /**
     * Update the solid for animation
     */
    update(delta) {
        if (!this.mesh) return;

        this.material.uniforms.iTime.value += delta;
        this.material.uniforms.modelMatrix.value.copy(this.mesh.matrixWorld);
        this.material.uniforms.modelMatrixInverse.value.copy(this.mesh.matrixWorld).invert();
    }

    addToScene(scene) {
        if (scene && this.mesh) {
            scene.add(this.mesh);
        }
    }
    
    /**
     * Remove from scene and clean up
     */
    dispose() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        
        if (this.geometry) {
            this.geometry.dispose();
        }
        
        if (this.material) {
            this.material.dispose();
        }
    }
    
    /**
     * Returns the vertex shader
     */
    getVertexShader() {
        return `
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `;
    }
    
    /**
     * Returns the fragment shader
     */
    getFragmentShader() {
        return `
            uniform float iTime;
            uniform mat4 modelMatrix;
            uniform mat4 modelMatrixInverse;
            uniform vec4 planeEquations[20]; // Max 20 planes for icosahedron
            uniform float radius;           // Radius of the solid
            uniform int totalPlane;          // Dynamic face count
            uniform vec3 edgeColor;          // Color parameter for the edges
            
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            
            const float fltMax = 1000000000.0;
            const float fltMin = -1000000000.0;
            const int maxRef = 30;            // Maximum reflections
            
            // Store each face's plane equation
            
            // Get face ID (1-based indexing)
            int getid(int index) {
                return index + 1;
            }
            
            // Convert camera and vertex positions to object space
            vec3 worldToObject(vec3 worldPos) {
                return (modelMatrixInverse * vec4(worldPos, 1.0)).xyz;
            }
            
            // Test for intersection with the polyhedron
            bool convexIntersect(in vec3 ro, in vec3 rd, out vec2 oDis, out vec3 oOutNor, out vec3 oInNor, out ivec2 ids) {
                // Initialize with defaults
                oDis = vec2(fltMin, fltMax);
                oOutNor = oInNor = vec3(0.0);
                ids = ivec2(-1);
                
                // Check against all faces
                for(int i = 0; i < 20; i++) { // Loop through max possible faces
                    if(i >= totalPlane) break; // Stop at actual face count
                    
                    // Get plane equation Ax + By + Cz + D = 0
                    vec4 plane = planeEquations[i];
                    vec3 planeNormal = vec3(plane.x, plane.y, plane.z);
                    float planeConstant = plane.w;
                    
                    // Check ray-plane intersection
                    float denom = dot(planeNormal, rd);
                    
                    // Skip near-parallel rays to avoid numerical issues
                    if(abs(denom) < 1e-6) continue;
                    
                    // t = -(dot(N, o) + d) / dot(N, d)
                    float t = -(dot(planeNormal, ro) + planeConstant) / denom;
                    
                    if(denom < 0.0) { // Ray entering the polyhedron
                        if(t > oDis.x) {
                            oDis.x = t;
                            oOutNor = planeNormal;
                            ids.x = getid(i);
                        }
                    } else { // Ray exiting the polyhedron
                        if(t < oDis.y) {
                            oDis.y = t;
                            oInNor = -planeNormal;
                            ids.y = getid(i);
                        }
                    }
                }
                
                return oDis.x < oDis.y && oDis.y > 0.0;
            }
            
            // Maps a value from 0-12 to a unique color
            vec3 faceIdToColor(int faceId) {
                // Generate unique colors for each face
                float hue = float(faceId) / float(totalPlane);
                
                // HSV to RGB conversion for nicely distributed colors
                vec3 c = vec3(hue, 0.8, 0.9);
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }
            
            // Main render function with reflection tracing
            vec4 render(in vec3 ro, in vec3 rd) {
                // Default background color (dark space)
                vec3 color = vec3(0.01, 0.01, 0.02);
                float alpha = 1.0;
                
                vec3 oN, iN;
                ivec2 ids;
                vec2 d;
                
                // Set dark nearly transparent face color
                vec3 faceColor = vec3(0.01, 0.01, 0.03);
                
                // Use the provided edge color with animation effect
                // No need to declare separate variable, use the uniform directly
                vec3 edgeColor = edgeColor; // * (0.8 + 0.4 * sin(iTime * 2.0));
                
                // Stack to track our reflection path
                vec3 positions[maxRef + 1];
                vec3 directions[maxRef + 1];
                int faceIDs[maxRef + 1];
                float distances[maxRef + 1];
                float edgeFactors[maxRef + 1];
                
                // First intersection test
                if(convexIntersect(ro, rd, d, oN, iN, ids)) {
                    // We hit the dodecahedron - start tracking
                    positions[0] = ro + rd * d.x;
                    directions[0] = rd;
                    faceIDs[0] = ids.x;
                    distances[0] = d.x;
                    edgeFactors[0] = 0.0;
                    
                    // Current path state
                    vec3 currentPos = ro + rd * d.y;
                    vec3 currentDir = reflect(rd, iN);
                    int prevFace = ids.y;
                    int reflCount = 1;
                    
                    // Distance to nearest edge for initial hit
                    float minEdgeDist = 1.0;
                    
                    // For each plane, calculate distance to its edges
                    for(int j = 0; j < 20; j++) {
                        if(j >= totalPlane) break; // Stop at actual face count
                        if(j != ids.x - 1) { // Don't check against the face we hit
                            vec4 otherPlane = planeEquations[j];
                            
                            // Intersection point of our ray with the entry face
                            vec3 hitPoint = ro + rd * d.x;
                            
                            // Distance from hitPoint to the other plane
                            float distToPlane = abs(dot(vec3(otherPlane.xyz), hitPoint) + otherPlane.w);
                            
                            // If planes are close to intersecting, we're near an edge
                            minEdgeDist = min(minEdgeDist, distToPlane / (.2));
                        }
                    }
                    
                    // Record edge factor for first hit
                    edgeFactors[0] = 1.0 - smoothstep(0.0, 0.15, minEdgeDist);
                    
                    // Process reflections
                    for(int i = 0; i < maxRef; i++) {
                        // Check for next intersection
                        if(convexIntersect(currentPos, currentDir, d, oN, iN, ids)) {
                            // Store all state
                            positions[i+1] = currentPos + currentDir * d.x;
                            directions[i+1] = currentDir;
                            faceIDs[i+1] = ids.x;
                            distances[i+1] = d.x;
                            
                            // Calculate edge proximity for this reflection
                            minEdgeDist = 1.0;
                            for(int j = 0; j < 20; j++) {
                                if(j >= totalPlane) break;
                                if(j != ids.x - 1) {
                                    vec4 otherPlane = planeEquations[j];
                                    vec3 hitPoint = currentPos + currentDir * d.x;
                                    float distToPlane = abs(dot(vec3(otherPlane.xyz), hitPoint) + otherPlane.w);
                                    minEdgeDist = min(minEdgeDist, distToPlane / (.3 ));
                                }
                            }
                            
                            // Record edge factor - stronger for closer reflections
                            edgeFactors[i+1] = (1.0 - smoothstep(0.0, 0.1, minEdgeDist)) * (1.0 - float(i) / float(maxRef + 1));
                            
                            reflCount++;
                            prevFace = ids.y;
                            
                            // Update ray for next reflection
                            currentPos = currentPos + currentDir * d.y;
                            currentDir = reflect(currentDir, iN);
                        } else {
                            break;
                        }
                    }
                    
                    // Now actually render all our collected reflections
                    // Clear color to start
                    color = faceColor;
                    
                    // Add edge glows from every reflection
                    float totalIntensity = 0.0;
                    
                    // Base edge intensity comes from the first intersection
                    float edgeIntensity = edgeFactors[0] * 0.99;
                    
                    // Add contribution from each reflection
                    for(int i = 1; i < reflCount; i++) {
                        // Each edge contributes to final color based on depth
                        float reflStrength = 1.0 - float( i ) / float(maxRef );
                        edgeIntensity += edgeFactors[i] * reflStrength * 0.5;
                    }
                    
                    // Add reflection edge glow to color
                    color = mix(faceColor, edgeColor, min(edgeIntensity, 0.95));
                    
                    // Make the polyhedron interior properly transparent/translucent
                    // This helps see the structure better
                    alpha = 0.999;
                    
                    // Add bright point at each reflection point with varying intensity
                    for(int i = 0; i < reflCount; i++) {
                        float reflStrength = 1.0 / float(i + 2);
                        
                        // Make direct view of edges very bright
                        color += edgeColor * edgeFactors[i] * reflStrength * 0.6;
                    }
                }
                
                return vec4(color, alpha);
            }
            
            void main() {
                // Calculate view ray in world space
                vec3 worldPos = vWorldPosition;
                vec3 viewDir = normalize(worldPos - cameraPosition);
                
                // Transform the ray origin (camera) and direction to object space
                vec3 ro = worldToObject(cameraPosition);
                vec3 rd = normalize(worldToObject(cameraPosition + viewDir) - ro);
                
                // Render the infinite reflection effect
                vec4 color = render(ro, rd);
                
                // Apply tone mapping and gamma correction
                // color.rgb = pow(color.rgb, vec3(0.4545)); // gamma correction (1/2.2)
                
                gl_FragColor = color;
            }
        `;
    }

    setPosition(x, y, z) {
        if (this.mesh) {
            this.mesh.position.set(x, y, z);
        }
    }

    getMesh() {
        return this.mesh;
    }
}

export default InfinityPlatonicSolid;
