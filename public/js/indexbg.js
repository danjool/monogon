var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var SCREEN_WIDTH, SCREEN_HEIGHT

// custom global variables
var raycaster, mouse, polys,duals, polysList = [];
var postprocessing = {};
init();
animate();

// FUNCTIONS    
function init() 
{
  // SCENE
  scene = new THREE.Scene();
  // CAMERA
  SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
  var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
  camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  //camera.position.set(120, -570, 80);
  camera.position.set(520, -570, 80);
  //camera.rotation.set(1.178,.50, -.86);
  camera.lookAt( new THREE.Vector3(50, -480,-50) ); 
  // RENDERER { canvas: canvas }
  var canvas = document.getElementById("threejscanvas");
  if ( Detector.webgl ) renderer = new THREE.WebGLRenderer( {antialias:true, canvas:canvas} );
  else renderer = new THREE.CanvasRenderer(); 
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.setClearColor( 0x002244, 1);
  
  c = document.getElementById( 'ThreeJS' );
  c.appendChild( renderer.domElement );
  // EVENTS
  THREEx.WindowResize(renderer, camera);
  THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
  // CONTROLS
  //controls = new THREE.OrbitControls( camera, renderer.domElement );
  //controls.enabled = true;
  // LIGHT
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
  // FLOOR
  /*
  var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
  floorTexture.repeat.set( 10, 10 );
  var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
  var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
  var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -0.5;
  floor.rotation.x = Math.PI / 2;
  scene.add(floor);
  */
  // SKYBOX/FOG
  /*
  var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
  var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
  var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
  scene.add(skyBox);
  
  */
  scene.fog = new THREE.FogExp2( 0x002244, 0.0010 );
  //var jsonLoader = new THREE.JSONLoader();
  
  ////////////
  // CUSTOM //
  ////////////

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

  //polys.position.set(0,0,0)

  scene.add(polys);
  scene.add(duals);
  
  // initPostprocessing();

  //renderer.autoClear = false;
  
  /*
  initPostprocessing();
  postprocessing.bokeh.uniforms[ "focus" ].value = 40.0;
  postprocessing.bokeh.uniforms[ "aperture" ].value = 0.000055;
  postprocessing.bokeh.uniforms[ "maxblur" ].value = 1.0;
  */


}


function onDocumentMouseDown( event ) {

  //event.preventDefault();

  mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
  mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( polysList );

  console.log(camera.position, camera)

  if ( intersects.length > 0 ) {
    //console.log(intersects[ 0 ])
    //console.log(intersects[ 0 ].object.name)
    //console.log(duals.children[intersects[ 0 ].object.name])
    //duals.children[intersects[ 0 ].object.name].scale.set(1,1,1);

    var currentSize = polys.children[intersects[ 0 ].object.name].scale.x
    var dualSize = Math.min(1.0, currentSize);
    currentSize = Math.min(1.0, 1.2 - currentSize);
    //console.log(currentSize); 

    new TWEEN.Tween( duals.children[intersects[ 0 ].object.name].scale ).to( {
      x: dualSize, y: dualSize, z: dualSize }
      , 2000).easing( TWEEN.Easing.Elastic.Out).start();
    new TWEEN.Tween( polys.children[intersects[ 0 ].object.name].scale ).to( {
      x: currentSize, y: currentSize, z: currentSize }
      , 2000).easing( TWEEN.Easing.Elastic.In).delay(0).start();
    

    /*
    new TWEEN.Tween( intersects[ 0 ].object.rotation ).to( {
      x: Math.random() * 2 * Math.PI,
      y: Math.random() * 2 * Math.PI,
      z: Math.random() * 2 * Math.PI }, 2000 )
    .easing( TWEEN.Easing.Elastic.Out).start(); */
  }
}

// function initPostprocessing() {
//  var renderPass = new THREE.RenderPass( scene, camera );

//  var bokehPass = new THREE.BokehPass( scene, camera, {
//    focus:    1.0,
//    aperture: 0.025,
//    maxblur:  1.0,

//    width: SCREEN_WIDTH,
//    height: SCREEN_HEIGHT
//  } );

//  bokehPass.renderToScreen = true;

//  var composer = new THREE.EffectComposer( renderer );

//  composer.addPass( renderPass );
//  composer.addPass( bokehPass );

//  postprocessing.composer = composer;
//  postprocessing.bokeh = bokehPass;

// }

function animate() 
{
  requestAnimationFrame( animate );
  render();   
  update();
}

function update()
{
  if ( keyboard.pressed("z") ) 
  { 
    // do something
  }

  TWEEN.update();
  polys.rotateOnAxis(new THREE.Vector3(1,0,0), .0005);
  duals.rotateOnAxis(new THREE.Vector3(1,0,0), .0005);
  
  //controls.update();
}

function render() 
{

  //postprocessing.composer.render( 0.1 );
  renderer.render( scene, camera );

}
