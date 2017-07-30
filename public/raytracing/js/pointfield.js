var pointfieldTHREE = function(){
var container, scene, camera, renderer;
var geometry, colors = [], sprite, size, color, particles, material;
var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight, SCREEN_HEIGHT = 600;
var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
if ( Detector.webgl )
    renderer = new THREE.WebGLRenderer( {antialias:true} );
else
    renderer = new THREE.CanvasRenderer(); 
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.domElement.display = "block";
    container = document.getElementById( 'pointfield' );
    container.appendChild( renderer.domElement );
scene = new THREE.Scene();
scene.fog = new THREE.FogExp2( 0x272822, 0.01 );
camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
camera.position.set(2, 0, 8)
scene.add(camera);
renderer.setClearColor( 0x272822, 1 );
var dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(1,1,1);
scene.add(dirLight);

var controls = new THREE.OrbitControls( camera, renderer.domElement);
controls.target = new THREE.Vector3(0,0,0);controls.enabled = true;

var axisHelper = new THREE.AxisHelper( 1 );
scene.add( axisHelper );

var sphereGeom = new THREE.SphereGeometry(1, 16, 8);
	var wireframeMat = new THREE.MeshBasicMaterial( { color: 0xffee00, wireframe: true, transparent: true } ); 
	sphereMesh = new THREE.Mesh(sphereGeom.clone(), wireframeMat);
	sphereMesh.scale.set( 15/2.0, 15.0, 15.0);
	scene.add(sphereMesh);

geometry = new THREE.Geometry();
sprite = new THREE.TextureLoader().load( "sprites/ball.png" );
var dist = 20, counter = 0;
for ( var i = 0; i < dist; i ++ ) {
	var theta = i*2.0*Math.PI/dist;
		for ( var k = 0; k < dist; k ++ ) {
			counter ++;

			var r = k + 1;

			var x = r*Math.cos(theta)
			var z = r*Math.sin(theta)

			// var y = r*Math.cos(phi);
			var radicand = r*r -z*z - 4*x*x;
			//             r*r - r*r*sin2(th) - 4*r*r*cos(th)
			//             r*r*(1 - sin2(th) - 4*cos2(th) )
			var y = Math.sign(radicand)*Math.sqrt( Math.abs(radicand) );
			//y = Math.sqrt(radicand);

			var vertex = new THREE.Vector3( x,y,z );
			geometry.vertices.push( vertex );
			colors[ counter ] = new THREE.Color( 0xffffff );
			// colors[ counter ].setHSL( ( vertex.x + 1000 ) / 2000, 1, 0.5 );
			// colors[ counter ].setHSL( ellipsoid(vertex)/400.0, 1, 0.5 );
			colors[ counter ].setHSL( r/2.0/dist, 1, 0.5 );
}}
geometry.colors = colors;
material = new THREE.PointsMaterial( { size: .8, map: sprite, vertexColors: THREE.VertexColors, alphaTest: 0.5, transparent: true } );
material.color.setHSL( 1.0, 0.2, 0.7 );
particles = new THREE.Points( geometry, material );
scene.add( particles );

function ellipsoid( p ) { return (4.0*p.x*p.x + 1.0*p.y*p.y + 1.0*p.z*p.z - 225.0); }
function ellipsoidG( p) { return new THREE.Vector3(32.0*p.x, 8.0*p.y, 8.0*p.z); }

animate()
function animate(){
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

}();
