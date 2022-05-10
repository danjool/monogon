var firstTHREE = function(){

// MAIN
// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var fakeCamPos = new THREE.Vector3(0, 25, 90)
var rayCastUniforms;
var arrdensity = 10;

// custom global variables
var cube;
var N;
this.timePassed = 0.0;


init();
animate();

function init() 
{
	// SCENE
	clock.start();
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	// SCREEN_WIDTH = 800
	SCREEN_HEIGHT *=.8;
	SCREEN_WIDTH = 600;
	SCREEN_HEIGHT = 600;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);

	//scene.add(fakeCamHelper)
	scene.add(camera);
	camera.position.set( 3, 5, 10 );
	//camera.lookAt(new THREE.Vector3(0, 50, 500));	
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	renderer.domElement.display = "block";
	renderer.setClearColor( 0xF72822, 1 );

	container = document.getElementById( 'distancefield1' );

	container.appendChild( renderer.domElement );
	// EVENTS
	//THREEx.WindowResize(renderer, camera);
	// THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.target = new THREE.Vector3(0,0,0);
	controls.noZoom = false;

	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,250,0);
	scene.add(light);
	var dirLight = new THREE.DirectionalLight(0xffffff);
	dirLight.position.set(1,0,0);
	scene.add(dirLight);

	var textureLoader = new THREE.TextureLoader();

	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );

	//////////////
	// SHADERS! //
	//////////////

	var planeGeom = new THREE.PlaneGeometry(50, 50);
	var planeMat = new THREE.MeshBasicMaterial( {color: 0x990000});

	rayCastUniforms = 
	{
		pos: {type: "v3", value: camera.position},
		time: {type: "f", value: 1.0},
		fakeCamPos: {type: "v3", value: fakeCamPos}
	};

	var vs = "varying vec2 vUv; varying vec4 myPos; varying vec3 myVert;"+
"void main(){ vUv = uv; myPos = modelMatrix * vec4( position, 1.0);	myVert = position;"+
	"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}"


	var rayCastMaterial = new THREE.ShaderMaterial({
		uniforms: rayCastUniforms,
		vertexShader: vs,//document.getElementById('rayCastVert').textContent,
		fragmentShader: document.getElementById('rayCastFrag').textContent,
		side: THREE.DoubleSide
	})

	rayCastPlane = new THREE.Mesh( planeGeom.clone(), rayCastMaterial);
	rayCastPlane.position.set(0, 0, 0);
	camera.lookAt(rayCastPlane.position)
	scene.add(rayCastPlane);

}

function animate() 
{
  requestAnimationFrame( animate );
	render();		
	update();
}

function update()
{
	var t = clock.getElapsedTime();
	rayCastUniforms.time.value = t;
	//sphereMesh.position.set( 30.0*Math.sin(Math.sin(t)), 60.0-30.0*Math.cos(Math.sin(t)), 0.0);
	if ( keyboard.pressed("z") ) 
	{ 
		//action
	}
	rayCastPlane.lookAt(camera.position);
	controls.update();
}

function render() 
{
	renderer.render( scene, camera );

}

}();