var raytrace5THREE = function(){

// MAIN
// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var sphereMesh;
var fakeCamPos = new THREE.Vector3(0, 25, 90)
var rayCastUniforms;
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
	// SCREEN_WIDTH = 800
	SCREEN_HEIGHT = 400;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);

	//scene.add(fakeCamHelper)
	scene.add(camera);
	camera.position.set(0,40,100);
	//camera.lookAt(new THREE.Vector3(0, 50, 500));	
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	renderer.domElement.display = "block";
	renderer.setClearColor( 0x272822, 1 );

	container = document.getElementById( 'raytrace5' );

	container.appendChild( renderer.domElement );

	// EVENTS
	//THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.target = new THREE.Vector3(0,50,0);
	controls.noZoom = true;
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,250,0);
	scene.add(light);
	var dirLight = new THREE.DirectionalLight(0xffffff);
	dirLight.position.set(1,0,0);
	scene.add(dirLight);

	var textureLoader = new THREE.TextureLoader();

	// SKYBOX/FOG
			// var imagePrefix = "../images/nightSkyBox/GalaxyTex_";
			// var directions  = ["PositiveX", "NegativeX", "PositiveY", "NegativeY", "PositiveZ", "NegativeZ"];
			// var imageSuffix = ".png";
			// var skyGeometry = new THREE.BoxGeometry( 1000, 1000, 1000 );	
			// var materialArray = [];
			// for (var i = 0; i < 6; i++)
			// 	materialArray.push( new THREE.MeshBasicMaterial({
			// 		map: textureLoader.load( imagePrefix + directions[i] + imageSuffix ),
			// 		side: THREE.BackSide
			// 	}));
			// var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
			// var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
			// scene.add( skyBox );
	// scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
	//var jsonLoader = new THREE.JSONLoader();

	//tradional rendering of the swinging sphere
	var sphereGeom = new THREE.SphereGeometry(10, 16, 8);
	var wireframeMat = new THREE.MeshBasicMaterial( { color: 0x00ee00, wireframe: true, transparent: true } ); 
	sphereMesh = new THREE.Mesh(sphereGeom.clone(), wireframeMat);
	scene.add(sphereMesh);


	//////////////
	// SHADERS! //
	//////////////

	var planeGeom = new THREE.PlaneGeometry(50, 100);
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
		fragmentShader: document.getElementById('rayCastFragOneLight').textContent,
		side: THREE.DoubleSide
	})

	// var rayCastMaterialPixellated = new THREE.ShaderMaterial({
	// 	uniforms: rayCastUniforms,
	// 	vertexShader: vs,//document.getElementById('rayCastVert').textContent,
	// 	fragmentShader: document.getElementById('rayCastFragPixellated').textContent,
	// 	side: THREE.DoubleSide
	// })

	var rayCastMaterialFlat = new THREE.ShaderMaterial({
		uniforms: rayCastUniforms,
		vertexShader: vs,//document.getElementById('rayCastVert').textContent,
		fragmentShader: document.getElementById('rayCastFragFlat').textContent,
		side: THREE.DoubleSide
	})

	rayCastPlane = new THREE.Mesh( planeGeom.clone(), rayCastMaterial);
	rayCastPlane.position.set(-27, 50, 25);
	scene.add(rayCastPlane);

	// rayCastPlanePix = new THREE.Mesh( planeGeom.clone(), rayCastMaterialPixellated);
	// rayCastPlanePix.position.set(27, 40, 25);
	// scene.add(rayCastPlanePix);

	rayCastPlaneFlat = new THREE.Mesh( planeGeom.clone(), rayCastMaterialFlat);
	rayCastPlaneFlat.position.set(27, 50, 25);
	scene.add(rayCastPlaneFlat);

}

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
	rayCastUniforms.time.value = t;
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

}();