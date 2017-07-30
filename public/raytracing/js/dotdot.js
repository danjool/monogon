var dotdotTHREE = function(){

var container, scene, camera, renderer;
var mouse = new THREE.Vector2( 0,0);
var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    //SCREEN_WIDTH = 800;
    SCREEN_HEIGHT = 400;
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
if ( Detector.webgl )
    renderer = new THREE.WebGLRenderer( {antialias:true} );
else
    renderer = new THREE.CanvasRenderer(); 
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.domElement.display = "block";
    container = document.getElementById( 'dotdot' );
    container.appendChild( renderer.domElement );
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
camera.position.set(0, 2, 6)
scene.add(camera);
renderer.setClearColor( 0x272822, 1 );
var dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(1,1,0);
scene.add(dirLight);

var controls2 = new THREE.OrbitControls( camera, renderer.domElement);
controls2.target = new THREE.Vector3(0,0,0);
controls2.enabled = false;
controls2.noZoom = true;

var lightVec = new THREE.ArrowHelper( new THREE.Vector3( -5, .5, 0 ).normalize(), new THREE.Vector3( 2, 2, 0 ), 1, 0xFFFFFF, .1, .1);
scene.add( lightVec );

var lightVecLabel = label("l", 0.0, 0.0, 0.0, "#FFFFFF");
var dotLabel = label("dot(l,n)= 1.0", -2.0, 1.5, 0.0, "#FFFFFF");

scene.add( new THREE.ArrowHelper( new THREE.Vector3( 0, 1, 0 ).normalize(), new THREE.Vector3( 0, 0, 0 ), 1, 0x127549, .1, .1));

var geometry = new THREE.BoxGeometry( 5, .01, 5 );
var material = new THREE.MeshLambertMaterial( {color: 0x127549} );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

document.addEventListener( 'mousemove', onDocumentMouseMove, false );
function onDocumentMouseMove( event ) {
    mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;
    var theta = Math.PI * mouse.x;
    dirLight.position.set( Math.cos(theta), Math.sin(theta), 0 );
    lightVec.setDirection( new THREE.Vector3( -Math.cos(theta), -Math.sin(theta), 0) );
    // lightVec.setLength( 1.0 + mouse.y, .1, .1 );
    // dirLight.intensity = 1.0 + mouse.y;
    lightVec.origin = new THREE.Vector3( Math.x, Math.y, 0 );
    lightVecLabel.move( 2-1*Math.cos(theta - .3), 2-1*Math.sin(theta -.3), 0 );
    dotLabel.setText("-dot(l,n)= "+ (Math.sin(theta)).toPrecision(2) );
}

var labels = [];
labels.push( label("n", 0.0, 0.0, 0.0, "#00B9D7" ));

function toScreenPosition(obj, camera){
    var vector = new THREE.Vector3();
    var widthHalf = 0.5*container.children[0].width;
    var heightHalf = 0.5*container.children[0].height;
    
    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);   
    vector.x = ( vector.x * widthHalf ) + widthHalf + container.children[0].offsetLeft;
    vector.y = - ( vector.y * heightHalf ) + heightHalf + container.children[0].offsetTop;

    return { 
        x: vector.x,
        y: vector.y
    };
}

//FACTORY function for labels
function label( text, x, y, z, col ) {
    if (col === undefined) {col = "#ffffff";}
    var obj = new THREE.Object3D()
    obj.position.set( x, y, z);
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.fontFamily = 'Arial';
    div.style.overflow = 'hidden';
    div.style["font-size"] = '20px';
    div.style.width = 100; div.style.height = 100;
    div.style.color = col;
    div.style.backgroundColor = "rgba(255,0,0,0.0)";
    div.innerHTML = text; 
    container.appendChild(div);
    return {
        update: function(){
            s = toScreenPosition( obj, camera );
            div.style.left = s.x+'px'; 
            div.style.top = s.y+'px';
            if (s.y < container.children[0].offsetTop || 
                s.y > (container.children[0].offsetTop + container.children[0].offsetHeight) ){
                div.style.visibility = "hidden";
            } else{ div.style.visibility = "visible"; }
        },
        move: function(x,y,z){ obj.position.set( x,y,z);},
        setText: function( text ){div.innerHTML = text;},
        setColor: function( color ){div.style.color = color;}
    }
}

animate2()
function animate2(){
    requestAnimationFrame( animate2 );
    renderer.render( scene, camera ); //render
    for (var i in labels) labels[i].update();
    lightVecLabel.update();
    dotLabel.update();
}


}();