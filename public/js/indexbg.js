import * as THREE from 'three';

var scene, camera, renderer;
var SCREEN_WIDTH, SCREEN_HEIGHT;
var raycaster, mouse, polys, duals, polysList = [];

// Simple TWEEN replacement for this basic animation
var TWEEN = {
    tweens: [],
    update: function() {
        for (let i = this.tweens.length - 1; i >= 0; i--) {
            const tween = this.tweens[i];
            const elapsed = Date.now() - tween.startTime;
            const progress = Math.min(elapsed / tween.duration, 1);
            
            // Simple easing
            const easedProgress = tween.easing(progress);
            
            // Update target properties
            for (const prop in tween.to) {
                tween.target[prop] = tween.from[prop] + (tween.to[prop] - tween.from[prop]) * easedProgress;
            }
            
            if (progress >= 1) {
                this.tweens.splice(i, 1);
            }
        }
    },
    Tween: function(target) {
        this.target = target;
        this.from = {};
        this.to = {};
        this.duration = 2000;
        this.startTime = 0;
        this.easing = function(t) { return t; }; // Linear by default
        
        this.to = function(props) {
            this.to = props;
            // Store initial values
            for (const prop in props) {
                this.from[prop] = this.target[prop];
            }
            return this;
        };
        
        this.easing = function(easingFunc) {
            this.easing = easingFunc;
            return this;
        };
        
        this.start = function() {
            this.startTime = Date.now();
            TWEEN.tweens.push(this);
            return this;
        };
        
        return this;
    },
    Easing: {
        Elastic: {
            Out: function(t) {
                if (t === 0) return 0;
                if (t === 1) return 1;
                const p = 0.3;
                const s = p / 4;
                return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
            },
            In: function(t) {
                if (t === 0) return 0;
                if (t === 1) return 1;
                const p = 0.3;
                const s = p / 4;
                return -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
            }
        }
    }
};

// Simple window resize handler
function handleResize() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
}

init();
animate();

function init() {
    scene = new THREE.Scene();
    SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(520, -570, 80);
    camera.lookAt(new THREE.Vector3(50, -480, -50));
    
    var canvas = document.getElementById("threejscanvas");
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.setClearColor(0x002244, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    var container = document.getElementById('ThreeJS');
    container.appendChild(renderer.domElement);
    
    // Add window resize listener
    window.addEventListener('resize', handleResize);
    
    var light = new THREE.PointLight(0x444444);
    light.position.set(0, 0, 0);
    scene.add(light);
    var light = new THREE.DirectionalLight(0x994400);
    light.position.set(-1, -10, 0);
    scene.add(light);//under reddish
    var light = new THREE.DirectionalLight(0x002255);
    light.position.set(-1, 0, 1);
    scene.add(light);
    var dirLight = new THREE.DirectionalLight(0x002244);
    dirLight.position.set(1, 1, 0);
    scene.add(dirLight);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    scene.fog = new THREE.FogExp2(0x002244, 0.0010);

    var flatMat = new THREE.MeshPhongMaterial({ wireframe: false, flatShading: true });

    var platonics = []

    var radius = 50;
    var num = 10;
    platonics.push(new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 0), flatMat))
    platonics.push(new THREE.Mesh(new THREE.OctahedronGeometry(radius, 0), flatMat))

    platonics.push(new THREE.Mesh(new THREE.TetrahedronGeometry(radius, 0), flatMat))
    platonics.push(new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 0), flatMat))
    platonics.push(new THREE.Mesh(new THREE.BoxGeometry(radius, radius, radius), flatMat))

    var dualMap = { 0: 3, 1: 4, 2: 2, 3: 0, 4: 1 }
    var dualRotMap = { 0: Math.PI / 2, 1: 0, 2: Math.PI / 2, 3: Math.PI / 2, 4: 0 }

    polys = new THREE.Object3D();
    duals = new THREE.Object3D();

    for (var i = 0; i < num; i++) {
        var mesh = platonics[i % 5].clone();
        mesh.position.set(0, 500 * Math.cos(i * 2 * Math.PI / num), 500 * Math.sin(i * 2 * Math.PI / num))
        mesh.name = i;

        var dual = platonics[dualMap[i % 5]].clone();
        dual.position.set(0, 500 * Math.cos(i * 2 * Math.PI / num), 500 * Math.sin(i * 2 * Math.PI / num))
        dual.scale.set(.1, .1, .1);
        dual.rotation.z = dualRotMap[i % 5]
        dual.name = i;

        polys.add(mesh)
        duals.add(dual)
        polysList.push(mesh)
        polysList.push(dual)
    }

    scene.add(polys);
    scene.add(duals);
}


function onDocumentMouseDown(event) {
    mouse.x = (event.clientX / renderer.domElement.width) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(polysList);

    console.log(camera.position, camera)

    if (intersects.length > 0) {
        var currentSize = polys.children[intersects[0].object.name].scale.x
        var dualSize = Math.min(1.0, currentSize);
        currentSize = Math.min(1.0, 1.2 - currentSize);

        new TWEEN.Tween(duals.children[intersects[0].object.name].scale).to({
            x: dualSize, y: dualSize, z: dualSize
        }).easing(TWEEN.Easing.Elastic.Out).start();
        
        new TWEEN.Tween(polys.children[intersects[0].object.name].scale).to({
            x: currentSize, y: currentSize, z: currentSize
        }).easing(TWEEN.Easing.Elastic.In).start();
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    TWEEN.update();
    polys.rotateOnAxis(new THREE.Vector3(1, 0, 0), .0005);
    duals.rotateOnAxis(new THREE.Vector3(1, 0, 0), .0005);
}