$(function() {
  	$( "#slider-nslices").slider({
  		min: minSlices, max: maxSlices, step:1, value: slices,
  		slide: function(event, ui){
				slices = ui.value
				graphIt();
  		}
  	});

    $( "#slider-range" ).slider({
      range: true, min: -100, max: 100, step:0.0001,
      values: [ 0, 2 ],
      slide: function( event, ui ) { 
      	startX = ui.values[0]; endX = ui.values[1];
      	$("#xmin").val(ui.values[0]);
      	$("#xmax").val(ui.values[1]);
      	graphIt();
      }
    });

    $( "#xmin" ).change( function(){
    	$( "#slider-range" ).slider("values", 0, $(this).val() );
    	startX = Number( $(this).val() );
    	graphIt();    	
    });

		$( "#xmax" ).change( function(){
    	$( "#slider-range" ).slider("values", 1, $(this).val() );
    	endX = Number( $(this).val() );
    	graphIt();    	
    });
  }
);

function toggleDropDown(a) {
    document.getElementById(a).classList.toggle("show");
}
function switchFunctions(i){
  f = functions[i];
  F = indefs[i];
}
function switchAlignments(i){
  alignment = alignments[i];
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {

    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
    graphIt();
  }
}


///////////////////////////////////////////////////////////////////////////////
// MAIN
///////////////////////////////////////////////////////////////////////////////


var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var mouse = new THREE.Vector2();

var riemanns = [];
var riemannSum = 0; var sumLabel;
var slices = 8, maxSlices = 1024, minSlices = 1;
var startX = 0.0;
var endX = 2.0;
var sliceSize = (endX - startX)/slices;
var alignments = [ "left", "right", "middle", "random", "minimum", "maximum" ];
var alignment = alignments[0];
var functions = [
  (x)=>{
    return x;
  }, (x)=>{
    return Math.pow(x - 1, 3) - x + 1;
  },(x)=>{
    return 1/(x*x + 2);
  }, (x)=>{
    if (Math.abs(x)>0) return (x)*Math.sin(1/x)
    else return x*Math.sin(Math.sign(x)*1/.00000001)
  }, (x)=>{
    return Math.pow(x,2) - 1;
  }, (x)=>{
    return Math.sin(x) + .5*Math.sin(x*2) + 2.0*Math.sin(x/2.);
  }
]
var indefs = [
  (x)=>{
    return .5*x*x;
  }, (x)=>{
    return .25*Math.pow(x,4.) - x*x*x + x*x;
  }, (x)=>{
    return Math.atan2( x, Math.sqrt(2) )/Math.sqrt(2);
  }, (x)=>{
    return NaN;
    return .5*(MM.Si(1.0/x) + x*( x*Math.sin(1/x) + Math.cos(1/x) ));
  }, (x)=>{
    return (1.0/3.0)*Math.pow(x,3) - x;
  }, (x)=>{
    return -1.*Math.cos(x) - .25*Math.cos(x*2) -4.0*Math.cos(x/2.);
  }
]
var f = functions[1];
var F = indefs[1];

var RED = new THREE.Color(0xee4444);
var red = new THREE.Color(0xffbbbb);
var BLUE = new THREE.Color(0x4455AA);
var blue = new THREE.Color(0x88AADD);

var grids = []; var labels = []; var gridLabels = [];
var curve;

init();
animate();

// FUNCTIONS    
function init() 
{
  // SCENE
  scene = new THREE.Scene();
  // CAMERA
  var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
  var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.0001, FAR = 20000;
  //camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
  camera = new THREE.OrthographicCamera( -SCREEN_WIDTH/200, SCREEN_WIDTH/200, SCREEN_HEIGHT/200, -SCREEN_HEIGHT/200, 0.00001, 20000 );
  scene.add(camera);
  camera.position.set(0,0,3);
  camera.lookAt(scene.position);  
  // RENDERER
  if ( Detector.webgl ) renderer = new THREE.WebGLRenderer( {antialias:true} );
  else renderer = new THREE.CanvasRenderer(); 
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.setClearColor( 0x444444, 1);
  container = document.getElementById( 'ThreeJS' );
  container.appendChild( renderer.domElement );
  // EVENTS
  THREEx.WindowResize(renderer, camera);
  THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
  // CONTROLS
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.minPolarAngle = Math.PI/2; controls.maxPolarAngle = Math.PI/2;
  controls.minAzimuthAngle = 0; controls.maxAzimuthAngle = 0;
  controls.maxDistance = 100;
  
  ////////////
  // CUSTOM //
  ////////////

  for (var i = -2; i < 4; i++){
    var grid = new THREE.GridHelper( Math.pow(10, i),Math.pow(10, i-1));
    grid.rotation.x = Math.PI/2;
    scene.add(grid); grids.push(grid);
    gridLabels.push( label("", -1, 0, 0 )); gridLabels.push( label("", -1, 0, 0 ));
  }

  //try adding a bunch of planeGeometry's to rep Riemann rects

  var geometry = new THREE.PlaneGeometry( 1, 1, 1, 1 );
  var material = new THREE.MeshBasicMaterial( {color: 0x4455AA, side: THREE.DoubleSide} );
  
  for (var i = 0; i < maxSlices; i++){
    var plane = new THREE.Mesh( geometry, material.clone() );
    var x = startX + i * sliceSize;
    var y = f(x);
    plane.scale.x = sliceSize;
    if (y!== 0) plane.scale.y = y;
    else plane.scale.y = 0.0001;

    plane.position.x = x + sliceSize / 2.0;
    plane.position.y = y/2.0;
    plane.position.z = 0.0000002;
    if ( i > slices) plane.visible = false;

    if ( i % 2 === 0) {
      if (y > 0) plane.material.color = new THREE.Color(0x88AADD);
      else plane.material.color = new THREE.Color(0xffbbbb);
    }
    else{
      if (y > 0) plane.material.color = new THREE.Color(0x4455AA);
      else plane.material.color = new THREE.Color(0xff3333);
    }

    riemanns.push(plane);
    scene.add( plane );
  }
  //render the line
  var geometry = new THREE.Geometry();
  for ( var i = 0; i < screen.width; i ++ ) {
    var x = startX + i*(endX - startX)/64
    var y = f(x)
    geometry.vertices.push( new THREE.Vector3( x, y, 0.1 ) );
  }
  // lines
  curve = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1.0 } ) );
  scene.add( curve );

  var yGeom = new THREE.Geometry();
  yGeom.vertices.push( new THREE.Vector3(0 , -1000, 1)); yGeom.vertices.push( new THREE.Vector3(0 , 1000, 1));
  scene.add( new THREE.Line(yGeom, new THREE.LineBasicMaterial({color:0x222222, opacity:1.0})) );
  var xGeom = new THREE.Geometry();
  xGeom.vertices.push( new THREE.Vector3(-1000 , 0, 1)); xGeom.vertices.push( new THREE.Vector3(1000 , 0, 1));
  scene.add( new THREE.Line(xGeom, new THREE.LineBasicMaterial({color:0x222222, opacity:1.0})) );
  graphIt();
}

//////////////// END INIT

function graphIt()
{
  sliceSize = (endX - startX)/slices;
  riemannSum = 0;
  for (var i = 0; i < maxSlices; i++){
    var plane = riemanns[i];
    var x = startX + i * sliceSize;
    var y = f(x);
    if (alignment === "right") y = f(x + sliceSize);
    if (alignment === "middle") y = f(x + sliceSize/2.0);
    if (alignment === "random") {
      var xr = Math.sin(i+endX+startX+slices)*10000;
      xr = xr - Math.floor(xr);
      y = f(x+sliceSize*xr);
    }
    if (alignment === "minimum") y = Math.min( f(x + sliceSize), f(x) );
    if (alignment === "maximum") y = Math.max( f(x + sliceSize), f(x) );
    
    plane.scale.x = sliceSize;
    if (y!== 0) plane.scale.y = y;
    else plane.scale.y = 0.0001;
    plane.position.x = x + sliceSize / 2.0;
    plane.position.y = y/2.0;
    plane.position.z = 0.02;

    if ( i % 2 === 0) {
      if (y > 0) plane.material.color = blue;
      else plane.material.color = red;
    }
    else{
      if (y > 0) plane.material.color = BLUE;
      else plane.material.color = RED;
    }

    if ( i >= slices) plane.visible = false;
    else {
      plane.visible = true;
      riemannSum += y*sliceSize;
    }
  };

  //find actual area
  actualArea = F(endX) - F(startX);

  $(".rsum").text( "Riemann Sum:\n "+riemannSum);
  $(".area").text( "Actual Area:\n "+actualArea);
}

function toScreenPosition(obj, camera){
    var vector = new THREE.Vector3();
    var widthHalf = 0.5*renderer.context.canvas.width;
    var heightHalf = 0.5*renderer.context.canvas.height;
    
    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);   
    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return { 
        x: vector.x,
        y: vector.y
    };
}

//FACTORY function for labels
function label( text, x, y, z ) {
  var obj = new THREE.Object3D()
  obj.position.set( x, y, z);
  var div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.fontFamily = 'Arial';
  div.style.overflow = 'hidden';
  div.style.width = 100; div.style.height = 100;
  div.style.color = "rgba(255, 255, 255, 1.0)";
  div.style.backgroundColor = "rgba(255,0,0,0.0)";
  div.innerHTML = text; document.body.appendChild(div);
  return {
    update: function(){
      s = toScreenPosition( obj, camera );
      div.style.left = s.x+'px'; 
      div.style.top = s.y+'px';
    },
    move: function(x,y,z){ obj.position.set( x,y,z);},
    setText: function( text ){div.innerHTML = text;},
    setColor: function( color ){div.style.color = color;}
  }
}

function animate() 
{
  requestAnimationFrame( animate );
  update();
  render();   
}

function update()
{
  if ( keyboard.pressed("z") ) 
  { 
    //action
  }
  controls.update();
  for (var l = 0; l < labels.length; l++) labels[l].update();
  for (var l = 0; l < gridLabels.length; l++) gridLabels[l].update();
  for (var i = 0; i < grids.length; i ++){
    var size = Math.pow(10, i-2)
    var stepSize = Math.pow(10, i-1-2)
    grids[i].position.x = size*(Math.floor(-.5+camera.position.x/size)+1)
    grids[i].position.y = size*(Math.floor(-.5+camera.position.y/size)+1)

    var zoom = size/(camera.right);
    
    grids[i].material.opacity = zoom;
    grids[i].material.transparent = true;

    var x1 = Number( (grids[i].position.x + size).toPrecision(3) );
    var y1 = Number( (grids[i].position.y + size).toPrecision(3) );
    var x2 = Number( (grids[i].position.x - size).toPrecision(3) );
    var y2 = Number( (grids[i].position.y - size).toPrecision(3) );

    gridLabels[i*2].move(    Number(x1) + stepSize/3.0, y1 - stepSize/3.0, 0 );
    gridLabels[i*2 +1].move( Number(x2) + stepSize/3.0, y2 - stepSize/3.0, 0 );
    gridLabels[i*2].setText(    "("+x1+", "+ y1+")", 0 );
    gridLabels[i*2 +1].setText( "("+x2+", "+ y2+")", 0 );
    gridLabels[i*2].setColor("rgba(255, 255, 255,"+1*zoom+")");
    gridLabels[i*2+1].setColor("rgba(255, 255, 255,"+1*zoom+")");
  }
  //update the curve
  var left = camera.left/camera.zoom + camera.position.x;
  var right = camera.right/camera.zoom + camera.position.x;
  var top = camera.top/camera.zoom + camera.position.y;
  var bottom = camera.bottom/camera.zoom + camera.position.y;

  for (var i = 0; i < curve.geometry.vertices.length; i++){
    var x = left + i*(right - left)/curve.geometry.vertices.length;
    curve.geometry.vertices[i].x = x;
    curve.geometry.vertices[i].y = f(x);
  }
  curve.geometry.verticesNeedUpdate = true;

  //reorient the ortho camera so panning can actually handle zoomed in/out
  camera.left /= camera.zoom; camera.right /=camera.zoom; 
  camera.top /=camera.zoom; camera.bottom /= camera.zoom;
  camera.zoom = 1;

  //move the slider range graphical width to represent x-axis
  $( "#slider-range" ).css("top", ( camera.position.y/(camera.top - camera.bottom)*window.innerHeight + window.innerHeight/2.0)  +"px");
  $( "#slider-range" ).css("width", 200.0/(camera.right - camera.left)*window.innerWidth +"px");
  $( "#slider-range" ).css("left", (camera.position.x + 100.0)/(camera.left - camera.right)*window.innerWidth + window.innerWidth/2.0 +"px");
}

function render() 
{
  renderer.render( scene, camera );
}