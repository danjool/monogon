import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';


let container, stats, gui, controls;
let camera, scene, renderer;
let mouseX = 0, mouseY = 0;
let last = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 9000 );
	camera.position.z = 350;
	camera.position.y = 350;

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x000000 );
	// scene.fog = new THREE.Fog( 0xffffff, 100, 1000 );

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );

	stats = new Stats();
	gui = new dat.GUI();
	container.appendChild( stats.dom );

	controls = new THREE.OrbitControls( camera );
	controls.noZoom = false;
	controls.maxDistance = 4000;
	controls.noPan = false;
	controls.autoRotateSpeed = 0.0;
	controls.maxPolarAngle = 3.14;


	// document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	// document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	// document.addEventListener( 'touchmove', onDocumentTouchMove, false );
	// document.addEventListener( 'keydown', onDocumentKeyDown, false );
	// window.addEventListener( 'resize', onWindowResize, false );
	
	// var effectController = {
	// 	separation: 40.0,
	// 	bounds: 150.0,
	// 	cohesion: 200.0,
	// 	freedom: 0.75
	// };

	// var valuesChanger = function () {

	// 	velocityUniforms[ "separationDistance" ].value = effectController.separation;
	// 	velocityUniforms[ "bounds" ].value = effectController.bounds;
	// 	positionUniforms[ "bounds" ].value = effectController.bounds;
	// 	velocityUniforms[ "cohesionDistance" ].value = effectController.cohesion;
	// 	velocityUniforms[ "freedomFactor" ].value = effectController.freedom;

	// };

	// valuesChanger();

	// gui.add( effectController, "separation", 0.0, 10000.0, 0.01 ).onChange( valuesChanger );
	// gui.add( effectController, "bounds", 10.0, 1000.0, 1.0 ).onChange( valuesChanger );
	// gui.add( effectController, "cohesion", 0.0, 1000, 0.025 ).onChange( valuesChanger );
	// gui.close();

	// initPoints()

	// let circleGeom = new THREE.CircleGeometry( 400, 32 )
	// circleGeom.vertices.shift()
	// circleGeom.rotateX(Math.PI/2.0)
	// let circleMat = new THREE.LineBasicMaterial({color: 0xff00ff})
	// let gridHelper = new THREE.LineLoop( circleGeom, circleMat )
	// scene.add(gridHelper)

	let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    scene.add(light);

    light = new THREE.AmbientLight(0xFFFFFF, 4.0);
    scene.add(light);
	
	// let fbxZombie = await loadAnimatedModelAndPlay('./models/zombie/', 'mremireh_o_desbiens.fbx', 'walk.fbx', new THREE.Vector3(0,0,0), 0.1 )
	// console.log("fbxZombie", fbxZombie)

	// let map = new THREE.TextureLoader().load( 'textures/uv_grid_opengl.jpg' );
	// map.wrapS = map.wrapT = THREE.RepeatWrapping;
	// map.anisotropy = 16;
	// let material = new THREE.MeshPhongMaterial( { map: map, side: THREE.DoubleSide } );

	// let uniforms = {}
	// let customMat = new THREE.ShaderMaterial({
	// 	uniforms: uniforms,
	// 	vertexShader: 	document.getElementById('vShader'),
	// 	fragmentShader: document.getElementById('fShader')
	// })



	// fbxZombie.children[2].material = customMat

	// let object = new THREE.Mesh( new THREE.SphereBufferGeometry( 10, 20, 10 ), customMat );
	// object.position.set( - 300, 0, 200 );
	// scene.add( object );

	// object = new THREE.Mesh( new THREE.IcosahedronBufferGeometry( 75, 1 ), material );
	// object.position.set( - 100, 0, 200 );
	// scene.add( object );

	// object = new THREE.Mesh( new THREE.OctahedronBufferGeometry( 75, 2 ), material );
	// object.position.set( 100, 0, 200 );
	// scene.add( object );

	// object = new THREE.Mesh( new THREE.TetrahedronBufferGeometry( 75, 0 ), material );
	// object.position.set( 300, 0, 200 );
	// scene.add( object );

	// object = new THREE.Mesh( new THREE.PlaneBufferGeometry( 100, 100, 4, 4 ), material );
	// object.position.set( - 300, 0, 0 );
	// scene.add( object );

	// object = new THREE.Mesh( new THREE.BoxBufferGeometry( 100, 100, 100, 4, 4, 4 ), material );
	// object.position.set( - 100, 0, 0 );
	// scene.add( object );

	// object = new THREE.Mesh( new THREE.CircleBufferGeometry( 50, 20, 0, Math.PI * 2 ), material );
	// object.position.set( 100, 0, 0 );
	// scene.add( object );

	// object = new THREE.Mesh( new THREE.RingBufferGeometry( 10, 50, 20, 5, 0, Math.PI * 2 ), material );
	// object.position.set( 300, 0, 0 );
	// scene.add( object );

	// object = new THREE.Mesh( new THREE.TorusBufferGeometry( 50, 20, 20, 20 ), material );
	// object.position.set( 100, 0, - 200 );
	// scene.add( object );

	// object = new THREE.Mesh( new THREE.TorusKnotBufferGeometry( 50, 10, 50, 20 ), material );
	// object.position.set( 300, 0, - 200 );
	// scene.add( object );

	// object = new THREE.Mesh( new THREE.CylinderBufferGeometry( 25, 75, 100, 40, 5 ), material );
	// object.position.set( - 300, 0, - 200 );
	// scene.add( object );
	addExperimentalCube()
}

function addExperimentalCube() {
  let uniforms = {
        colorB: {type: 'vec3', value: new THREE.Color(0xACB6E5)},
        colorA: {type: 'vec3', value: new THREE.Color(0x74ebd5)}
    }

  let geometry = new THREE.BoxGeometry(1, 1, 1)
  let material =  new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: 	document.getElementById('vShader'),
	fragmentShader: document.getElementById('fShader')
  })

  let mesh = new THREE.Mesh(geometry, material)
  mesh.position.x = 2
  scene.add(mesh)
  // sceneObjects.push(mesh)
}


let mixers = []
async function loadAnimatedModelAndPlay(path, modelFile, animFile, offset, scale) {
	return new Promise( (resolve, reject)=>{
		const loader = new FBXLoader();
		loader.setPath(path);
		loader.load(modelFile, (fbx) => {
		  fbx.scale.setScalar(scale);
		  fbx.traverse(c => {
		    c.castShadow = true;
		  });
		  fbx.position.copy(offset);

		  const anim = new FBXLoader();
		  anim.setPath(path);
		  anim.load(animFile, (anim) => {
		    const m = new THREE.AnimationMixer(fbx);
		    mixers.push(m);
		    const idle = m.clipAction(anim.animations[0]);
		    idle.play();
		  });
		  scene.add(fbx);
		  resolve(fbx)
		});	
	} )
}

init();
animate();

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) {
	mouseX = event.clientX - windowHalfX;
	mouseY = event.clientY - windowHalfY;
}

function onDocumentTouchStart( event ) {
	if ( event.touches.length === 1 ) {
		event.preventDefault();
		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;

	}
}

function onDocumentKeyDown( event ) {
	console.log(event)
}

function onDocumentTouchMove( event ) {
	if ( event.touches.length === 1 ) {
		event.preventDefault();
		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;
	}
}

function animate() {
	requestAnimationFrame( animate );
	render();
	stats.update();
	if(controls){
		controls.update()	
	}
	
}

function render() {
	var now = performance.now();
	var delta = ( now - last ) / 1000.0;
	if ( delta > 1 ) delta = 1; // safety cap on large deltas
	last = now;

	// if (mixers) {
 //      mixers.map( m => m.update(delta) );
 //    }

	// positionUniforms[ "time" ].value = now;
	renderer.render( scene, camera );
}

