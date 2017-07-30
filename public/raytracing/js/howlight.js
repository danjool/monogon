var howlightTHREE = function(){

var container, scene, camera, renderer;

var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    //SCREEN_WIDTH = 800;
    SCREEN_HEIGHT = 600;
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
if ( Detector.webgl )
    renderer = new THREE.WebGLRenderer( {antialias:true} );
else
    renderer = new THREE.CanvasRenderer(); 
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.domElement.display = "block";
    container = document.getElementById( 'howlight' );
    container.appendChild( renderer.domElement );
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
camera.position.set(-2.6, .3, 4.5)
scene.add(camera);
renderer.setClearColor( 0x272822, 1 );
var dirLight2 = new THREE.DirectionalLight(0xffffff);
dirLight2.position.set(1,1,1);
scene.add(dirLight2);

var controls2 = new THREE.OrbitControls( camera, renderer.domElement);

controls2.enabled = true;
controls2.noZoom = true;

//where the line hits the point on the sphere
var v = new THREE.Vector3( -5, .5, .5 ).normalize()
v.multiplyScalar(8.5);
v.add(new THREE.Vector3(5,0,0))
controls2.target = v;
controls2.update();

//spheres
function plopSphere(r, col, em, op, tr, pos){
    var geometry = new THREE.SphereGeometry( r, 16, 8 );
    // var material = new THREE.MeshLambertMaterial({color: col, wireframe: false, emissive:em,opacity:op, transparent:tr});
    var material = new THREE.MeshBasicMaterial({color: col, wireframe: false, opacity:op, transparent:tr});
    var sphere = new THREE.Mesh( geometry, material );
    sphere.position.set(pos[0], pos[1], pos[2]);
    scene.add( sphere );
}

plopSphere(.05, 0xA6E22E, 0x000000, 1.0, false, [-5, 0, 0]);
plopSphere(.05, 0xFD971F, 0x000000, 1.0, false, [5, 0, 0]);
plopSphere(2, 0xA6E22E, 0xA6E22E, 0.3, true, [-5, 0,0]);
plopSphere(.05, 0xFFFFFF, 0x000000, 1.0, true, [v.x, v.y, v.z]);
plopSphere(.05, 0xFDF5A9, 0x000000, 1.0, true, [0, .5, .5]);


var dd = new THREE.Vector3( -5, .5, .5 ).normalize().add(new THREE.Vector3(5,0,0));

scene.add( new THREE.ArrowHelper( new THREE.Vector3( -5, .5, .5 ).normalize(), dd, 7.47, 0xFF3D73, .1, .1 )); 

scene.add( new THREE.ArrowHelper( new THREE.Vector3( -5, .5, .5 ).normalize(), new THREE.Vector3( 5, 0, 0 ), 1, 0x00B9D7, .1, .1));

//light directoin
//scene.add( new THREE.ArrowHelper( new THREE.Vector3( 0, 0, -1 ).normalize(), new THREE.Vector3(v.x, v.y, v.z + 1.0), 1.0, 0xFFFFFF, .1, .1 )); 
scene.add( new THREE.ArrowHelper( new THREE.Vector3( 0, 0, 1 ).normalize(), new THREE.Vector3( -2, 0, -2 ), 1.0, 0xFFFFFF, .1, .1 )); 

//green radius indicator line
var material = new THREE.LineBasicMaterial({color: 0x82CDB9});
var geometry = new THREE.Geometry();
geometry.vertices.push(
    new THREE.Vector3( -5, 0, 0 ), 
    new THREE.Vector3( -5, 2, 0 )
);
var line = new THREE.Line( geometry, material );
scene.add( line );

//black? vec from sphere center past x 1 unit

var vecNorm = new THREE.Vector3( v.x + 5, v.y, v.z ).normalize();
scene.add( new THREE.ArrowHelper( vecNorm, new THREE.Vector3(-5, 0, 0), 3.0, 0x000000, .1, .1 ) );

var gridHelper = new THREE.GridHelper( 2, .5 );        
gridHelper.rotation.z = Math.PI/2;
scene.add( gridHelper );

// vecNormLabel = 

var labels = [];
labels.push( label("s", -5, -.2, 0, "#A6E22E"));
labels.push( label("x", v.x, v.y, v.z, "#FFFFFF" ));
labels.push( label("r", -5, .8, .4, "#82CDB9" ));
labels.push( label("o", 5, -.2, 0, "#FD971F" ));
labels.push( label("p", 0, .2, .5, "#FDF5A9" ));
labels.push( label("d", 4.4, .5, 0, "#00B9D7" ));
labels.push( label("n", v.x+.4, v.y+.4, v.z + .3, "#000000" ));
//labels.push( label("l", v.x, v.y+.2, v.z +.5, "#FFFFFF" ));
labels.push( label("l", -2, .2, -1.5, "#FFFFFF" ));

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
    div.style.overflow = "hidden";
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
    renderer.render( scene, camera ); 
    for (var i in labels) labels[i].update();
}

}();