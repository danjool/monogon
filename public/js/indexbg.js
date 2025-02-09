var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var SCREEN_WIDTH, SCREEN_HEIGHT

var raycaster, mouse, polys,duals, polysList = [];
var postprocessing = {};
init();
animate();

function init() 
{
  scene = new THREE.Scene();
  SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
  var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
  camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  camera.position.set(520, -570, 80);
  camera.lookAt( new THREE.Vector3(50, -480,-50) ); 
  var canvas = document.getElementById("threejscanvas");
  if ( Detector.webgl ) renderer = new THREE.WebGLRenderer( {antialias:true, canvas:canvas} );
  else renderer = new THREE.CanvasRenderer(); 
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.setClearColor( 0x002244, 1);
  
  c = document.getElementById( 'ThreeJS' );
  c.appendChild( renderer.domElement );
  THREEx.WindowResize(renderer, camera);
  THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
  var light = new THREE.PointLight(0x444444);
  light.position.set(0,0,0);
  scene.add(light);
  var light = new THREE.DirectionalLight(0x994400);
  light.position.set(-1,-10,0);
  scene.add(light);//under reddish
  var light = new THREE.DirectionalLight(0x002255);
  light.position.set(-1,0,1);
  scene.add(light);
  var dirLight = new THREE.DirectionalLight(0x002244);
  dirLight.position.set(1,1,0);
  scene.add(dirLight);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  scene.fog = new THREE.FogExp2( 0x002244, 0.0010 );

  wfMat = new THREE.MeshBasicMaterial({wireframe: true});
  flatMat = new THREE.MeshPhongMaterial({wireframe: false, shading:THREE.FlatShading})

  platonics = []

  var radius = 50;
  var num = 10;
  platonics.push(new THREE.Mesh( new THREE.IcosahedronGeometry(radius, 0), flatMat))
  platonics.push(new THREE.Mesh( new THREE.OctahedronGeometry(radius, 0), flatMat))
  
  platonics.push(new THREE.Mesh( new THREE.TetrahedronGeometry(radius, 0), flatMat))
  platonics.push(new THREE.Mesh( new THREE.DodecahedronGeometry(radius, 0), flatMat))
  platonics.push(new THREE.Mesh( new THREE.BoxGeometry(radius, radius, radius), flatMat))

  dualMap = {0:3, 1:4, 2:2, 3:0, 4:1}
  dualRotMap = {0:Math.PI/2, 1: 0, 2: Math.PI/2, 3:Math.PI/2, 4:0}

  polys = new THREE.Object3D();
  duals = new THREE.Object3D();

  for (i = 0; i < num; i++){
    mesh = platonics[i%5].clone();
    mesh.position.set(0, 500*Math.cos(i*2*Math.PI/num), 500*Math.sin(i*2*Math.PI/num))
    mesh.name = i;

    dual = platonics[dualMap[i%5]].clone();
    dual.position.set(0, 500*Math.cos(i*2*Math.PI/num), 500*Math.sin(i*2*Math.PI/num))
    dual.scale.set(.1,.1,.1);
    dual.rotation.z = dualRotMap[i%5]
    dual.name = i;

    polys.add(mesh)
    duals.add(dual)
    polysList.push(mesh)
    polysList.push(dual)
  }

  scene.add(polys);
  scene.add(duals);
}


function onDocumentMouseDown( event ) {

  mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
  mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( polysList );

  console.log(camera.position, camera)

  if ( intersects.length > 0 ) {

    var currentSize = polys.children[intersects[ 0 ].object.name].scale.x
    var dualSize = Math.min(1.0, currentSize);
    currentSize = Math.min(1.0, 1.2 - currentSize);

    new TWEEN.Tween( duals.children[intersects[ 0 ].object.name].scale ).to( {
      x: dualSize, y: dualSize, z: dualSize }
      , 2000).easing( TWEEN.Easing.Elastic.Out).start();
    new TWEEN.Tween( polys.children[intersects[ 0 ].object.name].scale ).to( {
      x: currentSize, y: currentSize, z: currentSize }
      , 2000).easing( TWEEN.Easing.Elastic.In).delay(0).start();
  }
}

function animate() 
{
  requestAnimationFrame( animate );
  renderer.render( scene, camera );
  TWEEN.update();
  polys.rotateOnAxis(new THREE.Vector3(1,0,0), .0005);
  duals.rotateOnAxis(new THREE.Vector3(1,0,0), .0005);
}