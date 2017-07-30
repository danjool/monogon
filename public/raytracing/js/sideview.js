var sideviewTHREE = function(){
var container, scene, camera, renderer;
var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight, SCREEN_HEIGHT = 400;
var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
if ( Detector.webgl )
    renderer = new THREE.WebGLRenderer( {antialias:true} );
else
    renderer = new THREE.CanvasRenderer(); 
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.domElement.display = "block";
    container = document.getElementById( 'sideview' );
    container.appendChild( renderer.domElement );
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
camera.position.set(2, 0, 8)
scene.add(camera);
renderer.setClearColor( 0x272822, 1 );
var dirLight2 = new THREE.DirectionalLight(0xffffff);
dirLight2.position.set(1,1,1);
scene.add(dirLight2);

var controls2 = new THREE.OrbitControls( camera, renderer.domElement);
controls2.target = new THREE.Vector3(0,0,0);controls2.enabled = true;
controls2.noZoom = true;

//var axisHelper = new THREE.AxisHelper( 1 );
//scene.add( axisHelper );

//where the line hits the point on the sphere
var v = new THREE.Vector3( -5, .5, .5 ).normalize()
v.multiplyScalar(8.5);
v.add(new THREE.Vector3(5,0,0))

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


//line


var dd = new THREE.Vector3( -5, .5, .5 ).normalize().add(new THREE.Vector3(5,0,0));
//red ray from cam to sphere x
var material = new THREE.LineBasicMaterial({color: 0xFF3D73});
var geometry = new THREE.Geometry();
geometry.vertices.push(
    dd, v    
);
var line = new THREE.Line( geometry, material );
//scene.add( line );

scene.add( new THREE.ArrowHelper( new THREE.Vector3( -5, .5, .5 ).normalize(), dd, 7.47, 0xFF3D73, .1, .1 )); 

//aqua d line
var material = new THREE.LineBasicMaterial({color: 0x00B9D7});
var geometry = new THREE.Geometry();
geometry.vertices.push(
    new THREE.Vector3( 5, 0, 0 ),    
    new THREE.Vector3( -5, .5, .5 ).normalize().add(new THREE.Vector3(5,0,0))
);
var line = new THREE.Line( geometry, material );
//scene.add( line );

//cone to rep vector d
var geometry = new THREE.CylinderGeometry( .1, 0, .2, 8, 1, false);
var material = new THREE.MeshLambertMaterial( {color: 0x00B9D7, wireframe: false} );
var cylinder = new THREE.Mesh( geometry, material );
cylinder.position.set(dd.x, dd.y, dd.z)
cylinder.rotation.z -= Math.PI/2
cylinder.position.set(dd.x, dd.y, dd.z)
// scene.add( cylinder );//

scene.add( new THREE.ArrowHelper( new THREE.Vector3( -5, .5, .5 ).normalize(), new THREE.Vector3( 5, 0, 0 ), 1, 0x00B9D7, .1, .1));

//green radius indicator line
var material = new THREE.LineBasicMaterial({color: 0x82CDB9});
var geometry = new THREE.Geometry();
geometry.vertices.push(
    new THREE.Vector3( -5, 0, 0 ), 
    new THREE.Vector3( -5, 2, 0 )
);
var line = new THREE.Line( geometry, material );
scene.add( line );

var gridHelper = new THREE.GridHelper( 2, .5 );        
gridHelper.rotation.z = Math.PI/2;
scene.add( gridHelper );

//https://github.com/mrdoob/three.js/issues/5871
//var arrhelp = new THREE.ArrowHelper( new THREE.Vector3( 0,0,0 ).normalize(), new THREE.Vector3( 1, 0, 0 ), 10, 0xff9999, 1,.1 );       
//scene.add( arrhelp );    

/*
var loader = new THREE.JSONLoader(); // init the loader util
loader.load('models/eye.json', function (geometry) {
        var material = new THREE.MeshLambertMaterial( {color:0xffffff, emissive:0x050505, shading:THREE.FlatShading, opacity:0,  
        vertexColors: THREE.VertexColors} );
  var mesh = new THREE.Mesh(
    geometry,
    material
  );
  mesh.rotation.y = -Math.PI/2;
  mesh.position.x = 5;
  scene.add(mesh);
});
*/

// var loader = new THREE.FontLoader();
// loader.load('droid_sans_bold.typeface.js', function( loadedFont ){

// })

//TEXT!!
// function plopText(txt, pos, rot, ht, col){

//     var materialFront = new THREE.MeshBasicMaterial( { color: col } );
//     var materialSide = new THREE.MeshBasicMaterial( { color: col } );
//     var materialArray = [ materialFront, materialSide ];
//     var textGeom = new THREE.TextGeometry( txt, 
//     {
//         size: .5, height: ht, curveSegments: 4,
//         weight: "bold", style: "normal",
//         font: "droid sans",
//         //font: "droid_sans_bold",
//         bevelThickness: .1, bevelSize: .01, bevelEnabled: false,
//         material: 0, extrudeMaterial: 1
//     });
    
//     var textMaterial = new THREE.MeshFaceMaterial(materialArray);
//     var textMesh = new THREE.Mesh(textGeom, textMaterial );
    
//     textGeom.computeBoundingBox();
//     var textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;
    
    
//     textMesh.position.set( pos[0]-textWidth/2, pos[1], pos[2] );

//     textMesh.rotation.x = rot[0]; //-Math.PI / 4 + .6;
//     textMesh.rotation.y = rot[1];//.1
//     textMesh.rotation.z = rot[2]
//     textMesh.lookAt(camera.position)
//     //textMesh.lookAt(new THREE.Vector3(0,0,0))
//     //textMesh.rotation.y += .4;
//     textMesh.name = "text";
//     scene.add(textMesh);
//     return textMesh;
//     }

// var texts = []
// texts.push(plopText("s", [-5, -.5, 0], [0,0,0], .01, 0xA6E22E))
// texts.push(plopText("x", [v.x, v.y+.25, v.z], [0,0,0], .01, 0xFFFFFF))
// texts.push(plopText("r", [-5, .8, .4], [0,0,0], .01, 0x000000))
// texts.push(plopText("o", [5, -.5, 0], [0,0,0], .01, 0xFD971F))
// texts.push(plopText("p", [0, 0, .5], [0,0,0], .01, 0xFDF5A9))
// texts.push(plopText("d", [4.4, .5, 0], [0,0,0], .01, 0x00B9D7))

var labels = [];
labels.push( label("s", -5, -.2, 0, "#A6E22E"));
labels.push( label("x", v.x, v.y, v.z, "#FFFFFF" ));
labels.push( label("r", -5, .8, .4, "#82CDB9" ));
labels.push( label("o", 5, -.2, 0, "#FD971F" ));
labels.push( label("p", 0, .2, .5, "#FDF5A9" ));
labels.push( label("d", 4.4, .5, 0, "#00B9D7" ));

function toScreenPosition(obj, camera){
    var vector = new THREE.Vector3();
    // var widthHalf = 0.5*renderer.context.canvas.width;
    // var heightHalf = 0.5*renderer.context.canvas.height;
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
    // document.body.appendChild(div);
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

function animate2(){
    requestAnimationFrame( animate2 );
    if (elementInViewport(container)){
        renderer.render( scene, camera ); //render
        for (var i in labels) labels[i].update();
    }
    //update text meshes
    //for (t = 0; t < texts.length; t++){ texts[t].lookAt(camera.position) }


}


}();