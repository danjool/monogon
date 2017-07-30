
var raytrace3THREE = function(){
// MAIN
// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var sphereMesh;
var fakeCamPos = new THREE.Vector3(0, 25, 90)

var arrdensity = 10;

// custom global variables
var cube;
var N;
this.timePassed = 0.0;

init();
animate();

// FUNCTIONS 		
function calcRayDist(ro, rd){
	
  var oc = new THREE.Vector3();
  oc.subVectors(ro, sphereMesh.position)
  var b = 2.0*rd.dot(oc);
  var c = oc.dot(oc) - 100; // 100 is the radius of the sphere squared
  var h = b*b - 4.0*c;
  if (h<0.0) {
  	return 200.0;
  }
  else {
  	var d = (-1*b- Math.sqrt(h))/2.0;
  	return d;
  }
}

function init() 
{
	// SCENE
	clock.start();
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	//SCREEN_WIDTH = 800
	SCREEN_HEIGHT = 800;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	//fakeCam = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	//fakeCam.position.set(fakeCamPos.x, fakeCamPos.y, fakeCamPos.z);
	//fakeCamHelper = new THREE.CameraHelper(fakeCam);
	//scene.add(fakeCamHelper)
	scene.add(camera);
	camera.position.set(-160, 60, 90 );
	//camera.lookAt(scene.position);	
	//camera.lookAt(new THREE.Vector3(0, 50, 500));	
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	renderer.domElement.display = "block";

	container = document.getElementById( 'raytrace3' );
	container.appendChild( renderer.domElement );
	
	// EVENTS
	//THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.target = new THREE.Vector3(0,25,25);
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,250,0);
	scene.add(light);
	var dirLight = new THREE.DirectionalLight(0xffffff);
	dirLight.position.set(1,0,0);
	scene.add(dirLight);

	// SKYBOX/FOG
			var imagePrefix = "images/nightSkyBox/GalaxyTex_";
			var directions  = ["PositiveX", "NegativeX", "PositiveY", "NegativeY", "PositiveZ", "NegativeZ"];
			var imageSuffix = ".png";
			var skyGeometry = new THREE.CubeGeometry( 1000, 1000, 1000 );	
			var materialArray = [];
			for (var i = 0; i < 6; i++)
				materialArray.push( new THREE.MeshBasicMaterial({
					map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
					side: THREE.BackSide
				}));
			var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
			var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
			scene.add( skyBox );
	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
	//var jsonLoader = new THREE.JSONLoader();

	//tradional rendering of the swinging sphere
	var sphereGeom = new THREE.SphereGeometry(10, 16, 8);
	var wireframeMat = new THREE.MeshBasicMaterial( { color: 0x00ee00, wireframe: true, transparent: true } ); 
	sphereMesh = new THREE.Mesh(sphereGeom.clone(), wireframeMat);
	scene.add(sphereMesh);
	
	////////////
	// CUSTOM //
	////////////

	//////////////
	// SHADERS! //
	//////////////

	// use "this." to create global object
	// var ballTexture = new THREE.ImageUtils.loadTexture('images/UV_Grid_Sm.jpg');
	// this.customUniforms = 
	// {
	// 	baseTexture: { type: "t", value: ballTexture },
	// 	mixAmount: 	 { type: "f", value: 0.0 },
	// 	N: 					 { type: "i", value: N}
	// };

	var planeGeom = new THREE.PlaneGeometry(50, 50);
	var planeMat = new THREE.MeshBasicMaterial( {color: 0x990000});

	this.rayCastUniforms = 
	{
		pos: {type: "v3", value: camera.position},
		time: {type: "f", value: 1.0},
		fakeCamPos: {type: "v3", value: fakeCamPos}
	};
	var rayCastMaterial = new THREE.ShaderMaterial({
		uniforms: rayCastUniforms,
		vertexShader: document.getElementById('rayCastVert').textContent,
		fragmentShader: document.getElementById('rayCastFrag').textContent,
		side: THREE.DoubleSide
	})


	rayCastPlane = new THREE.Mesh( planeGeom.clone(), rayCastMaterial);
	rayCastPlane.position.set(0, 25, 25);
	camera.lookAt(rayCastPlane.position)
	scene.add(rayCastPlane);
	/*
	rayCastPlane = new THREE.Mesh( planeGeom.clone(), rayCastMaterial);
	rayCastPlane.rotation.x = (Math.PI/2.0);
	rayCastPlane.position.set(0, 50, 0);
	scene.add(rayCastPlane);
	*/
}

//figure out little arrows
var mn = Math.ceil(-1*arrdensity/2);
var mx = mn + arrdensity;

for (i = mn; i <= mx; i++){
	for (j = mn; j<= mx; j++){
		object = new THREE.ArrowHelper( new THREE.Vector3( j*50/arrdensity, -fakeCamPos.y+(50/arrdensity)*i+25, -fakeCamPos.z+25 ).normalize(), new THREE.Vector3( 0, 0, 0 ), 100, 0x999999, 1,.1 );
		object.position.set( fakeCamPos.x, fakeCamPos.y, fakeCamPos.z );
		object.name = "arrow";
		object.i = i;
		object.j = j;
		scene.add( object );	
	}
}

//visualize the fake camera with a simple tube:
var geometry = new THREE.CylinderGeometry( 10, 1, 10, 8, 1, true);
var material = new THREE.MeshNormalMaterial( {color: 0xffff00, wireframe: true} );
var cylinder = new THREE.Mesh( geometry, material );
cylinder.position.set(fakeCamPos.x, fakeCamPos.y, fakeCamPos.z)
cylinder.rotation.x = -Math.PI/2;
cylinder.rotation.y = -Math.PI/4;
scene.add( cylinder );

function elementInViewport(el) {
  var top = el.offsetTop;
  var left = el.offsetLeft;
  var width = el.offsetWidth;
  var height = el.offsetHeight;

  while(el.offsetParent) {
    el = el.offsetParent;
    top += el.offsetTop;
    left += el.offsetLeft;
  }

  return (
    top < (window.pageYOffset + window.innerHeight) &&
    left < (window.pageXOffset + window.innerWidth) &&
    (top + height) > window.pageYOffset &&
    (left + width) > window.pageXOffset
  );
}

function animate() 
{
  requestAnimationFrame( animate );
  if (elementInViewport(container)){
  	render();		
		update();	
  }
}

function update()
{
	var t = clock.getElapsedTime();
	this.rayCastUniforms.time.value = t;
	//30.0*sin(sin(time)), 0.0, 60.0-30.0*cos(sin(time))
	sphereMesh.position.set( 30.0*Math.sin(Math.sin(t)), 60.0-30.0*Math.cos(Math.sin(t)), 0.0);
	if ( keyboard.pressed("z") ) 
	{ 
		//action
	}
	for (var c in scene.children) {
		if (scene.children[c].name == "arrow"){
			
			var i = scene.children[c].i;
			var j = scene.children[c].j;
			var l = calcRayDist(fakeCamPos, new THREE.Vector3(j*50/arrdensity, -fakeCamPos.y+i*50/arrdensity+25, -fakeCamPos.z+25).normalize())

			if (l != 200) scene.children[c].setColor(0xee0000)
			else scene.children[c].setColor(0x222222)

			scene.children[c].setLength(l, .5,1);
		}
	}
	
	controls.update();
}

function render() 
{
	renderer.render( scene, camera );

}

}