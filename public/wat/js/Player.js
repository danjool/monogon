console.log("Player.js loaded");

function setupPlayer( myself ){
  
  var playerMat = new THREE.MeshPhongMaterial( {skinning: true, morphTargets: true,
		color: Number(myself.color), emissive:0x111111, opacity:1, shading: THREE.FlatShading});
	
	jsonLoader.load("models/player1shapekeys2.json", function(geometry, colors){
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();
		player = new THREE.SkinnedMesh( geometry, playerMat); /*global player THREE*/
		player.position.set( myself.position.x, myself.position.y, myself.position.z );
		player.rotation.x = 0; //cause sometimes the rotation gets borked and saved to the server
		player.rotation.z = 0;
		player.tilex = Math.floor(player.position.x/10);
		player.tilez = Math.floor(player.position.z/10);
		player.rotation.set( myself.rotation.x, myself.rotation.y, myself.rotation.z, "XYZ" );
		player.velocity = new THREE.Vector3(0,0,0);
		player.baseSpeed = 0.2;
		player.maxSpeed = 0.6;
		player.speed = 0.2;
	  player.name = myself.name;
	  player.color = Number( myself.color) ;
	  player.loggedin = true;
	  //var nametag = addText( {text:player.name, position:{x:0,y:2,z:2}, color:'#FFFFFF'} );
		//player.add(nametag);
		scene.add(player); 
		var camTarget = new THREE.Object3D(); 
		camTarget.translateY(5);
		camTarget.translateZ(5);
		player.add( camTarget ); player.camTarget = player.children[1];
		player.camTarget.add( camera); /*global camera*/
		camera.position.set( 0, 5, -15 );
		console.log("loaded player + model: ", player.name);
		updateTerrain( player.tilex, player.tilez );
		
		floorLight = new THREE.PointLight(0x00ff00, 1.0, 50.0);
	  floorLight.position.set( 0, -1, 0);
	  player.add(floorLight);
		
	});	
}

function notBlocked( dir, dist ){
	raycaster.set( new THREE.Vector3(0,1.5,0).add(player.position), 
			dir.transformDirection( player.matrixWorld ), 1.5, 3.0 );
		var ints = raycaster.intersectObjects(scene.children);
		if ( ints.length > 0 && ints[0].distance > dist ) return true;
		else return false;
}

function updatePlayer( delta ){
	var d = 1;//delta*600000.0;
	
	player.lastPos = player.position.clone();
	
	if (keyboard.pressed('shift')){ //run!
		player.speed = Math.min( 1.03*player.speed, player.maxSpeed ) ;
		var rotateAngle = d * Math.PI/100/2/player.speed;
		//turn
		if (moveLeft)     player.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle);
		if (moveRight)    player.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle);	
	} else { //walk.
		player.speed = Math.max( .95*player.speed, player.baseSpeed ) ; //slowdown
		//strafe
		if (moveLeft  && notBlocked(new THREE.Vector3( 1,0,0), 1.6))     player.translateX( d*player.baseSpeed );
		if (moveRight && notBlocked(new THREE.Vector3(-1,0,0), 1.6))    player.translateX( -d*player.baseSpeed );
	}
	
	//forward / backwards
	if (moveForward){
		if (notBlocked(new THREE.Vector3(0,0,1), 1.6) ) player.translateZ( d*player.speed );	
	}  
	if (moveBackward){
		if (notBlocked(new THREE.Vector3(0,0,-1), 1.6) ) player.translateZ(d* -player.speed );	
	} 
	
	//GEARS style camrotation when walking to match camera orientation
	if (moveForward || moveBackward || moveLeft || moveRight){
		var camRot = new THREE.Euler().setFromRotationMatrix( camera.matrix, "XYZ");
		var theta = camRot.y/20.0;
		player.rotateOnAxis( new THREE.Vector3(0,1,0), -theta);
		controls.rotateLeft(-theta);
	}
	
	//move the terrain to match the character
	player.oldtilex = player.tilex;
	player.oldtilez = player.tilez;
	player.tilex = Math.floor(player.position.x/10);
	player.tilez = Math.floor(player.position.z/10);
	if ( (player.tilex !== player.oldtilex) || (player.tilez !== player.oldtilez) ){
		//var oldGroundLevel = terrainFunc( 10*player.oldtilex +5, 10*player.oldtilez+5);
		// updateTerrain( player.tilex, player.tilez );
	}
	updateTerrain( player.tilex, player.tilez );
	player.groundLevel = terrainFunc( 10*player.tilex +5, 10*player.tilez+5);
	
	
	player.translateY( player.velocity.y );
	if (player.position.y > player.groundLevel ){ //above ground
		player.velocity.y -= .058*d; //gravity
		canJump = false;
	} else { //on ground
		player.position.y = player.groundLevel;
		player.velocity.y = 0;
		canJump = true;
	}
	
	
	if ( moveForward || moveBackward || moveLeft || moveRight 
		|| (player.velocity.y !== 0 ) || (player.position.y !== player.groundLevel ) ){
		//player.vel = new THREE.Vector3().subVectors(player.position, player.lastPos ).multiplyScalar(10);
		updateServer();
	}
	
	//animate the booty for walking
	if (moveForward || moveBackward){
		player.skeleton.bones[1].rotation.set( Math.PI + Math.cos(feetDriver), 0, 0 );
		feetDriver +=.15;
	} 
	else if (moveLeft || moveRight) {
		player.skeleton.bones[1].rotation.set( Math.PI, Math.sin(feetDriver), Math.sin(feetDriver) );
		feetDriver +=.15;
	}
	else {
		player.skeleton.bones[1].rotation.set( Math.PI, 0, 0 );
		feetDriver = 0;
	}

	//raise the camera a bit if it gets too close the ground
	player.camTarget.position.y = 5 + ( camera.position.y-Math.abs( camera.position.y ) )/-2.0;
	
	//change the green light from the floor
	floorLight.intensity = .95 
		- Math.abs( 5 - (player.position.x + 10005)%10 ) /10.0 
		- Math.abs( 5 - (player.position.z + 10005)%10 ) /10.0 
		- Math.abs( player.groundLevel - player.position.y )/20.0;
	floorLight.intensity*=floorLight.intensity*4.0*Math.PI;
}

//handle otherPlayers from the internet:
function OtherPlayer ( other ){
	console.log("other: ", other);
	var that = this;
	other.color = other.color || 0xff00ff;
	var color = new THREE.Color()
	color.setHex(other.color);
	jsonLoader.load("models/player1.json", function(geometry, colors){
		that.material = other.material || new THREE.MeshPhongMaterial( {
		color: color, emissive:0x222222, opacity:1, shading: THREE.FlatShading} );
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();
		that.material.skinning = true;
		that.mesh = new THREE.SkinnedMesh( geometry, that.material);
		that.mesh.position.set( other.position.x, other.position.y, other.position.z );
		that.mesh.castShadow=true;
		that.feetDriver = 0;
		that.name = other.name || "noname"; that.mesh.name = other.name || "noname";
		var nametag = addText( {text:other.name, position:{x:.8,y:2.7,z:1.2}, color:'#FFFFFF'} );
		that.mesh.add(nametag);
		scene.add( that.mesh );
		console.log("loaded other player: ", that.name );
		//console.log( otherPlayers );
	});	
}
OtherPlayer.prototype= {
	constructor: OtherPlayer,
	update: function( other ){
		this.feetDriver += .15;
		this.mesh.skeleton.bones[1].rotation.set( Math.PI + Math.cos( this.feetDriver), 0, 0 );
		this.mesh.position.set( other.position.x, other.position.y, other.position.z );
		this.mesh.rotation.set( other.rotation.x, other.rotation.y, other.rotation.z, "XYZ" );
		this.mesh.updateMatrix();
	}
};