export function SphericalFirstPersonControls ( object, domElement ) {

	if ( domElement === undefined ) {
		console.warn( 'THREE.SphericalFirstPersonControls: The second parameter "domElement" is now mandatory.' );
		domElement = document;
	}

	this.object = object;
	this.domElement = domElement;

	// API

	this.enabled = true;

	this.movementSpeed = 1.0;
	this.lookSpeed = 0.005;

	this.lookVertical = true;
	this.autoForward = false;

	this.activeLook = true;

	this.heightSpeed = false;
	this.heightCoef = 1.0;
	this.heightMin = 0.0;
	this.heightMax = 1.0;

	this.constrainVertical = false;
	this.verticalMin = 0;
	this.verticalMax = Math.PI;

	this.mouseDragOn = false;

	// internals

	this.autoSpeedFactor = 0.0;

	this.mouseX = 0;
	this.mouseY = 0;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;

	this.viewHalfX = 0;
	this.viewHalfY = 0;

	this.origin = new THREE.Vector3( 0, 0, 0)

	// private variables

	var lat = 0;
	var lon = 0;

	var lookDirection = new THREE.Vector3();
	var spherical = new THREE.Spherical();
	var target = new THREE.Vector3();
	var targetPosition = new THREE.Vector3();

	//

	if ( this.domElement !== document ) {

		this.domElement.setAttribute( 'tabindex', - 1 );

	}

	//

	this.handleResize = function () {
		if ( this.domElement === document ) {

			this.viewHalfX = window.innerWidth / 2;
			this.viewHalfY = window.innerHeight / 2;
		} else {
			this.viewHalfX = this.domElement.offsetWidth / 2;
			this.viewHalfY = this.domElement.offsetHeight / 2;
		}
	};

	this.onMouseDown = function ( event ) {
		if ( this.domElement !== document ) {
			this.domElement.focus();
		}
		event.preventDefault();
		event.stopPropagation();
		if ( this.activeLook ) {
			switch ( event.button ) {
				case 0: this.moveForward = true; break;
				case 2: this.moveBackward = true; break;
			}
		}
		this.mouseDragOn = true;
	};

	this.onMouseUp = function ( event ) {
		event.preventDefault();
		event.stopPropagation();
		if ( this.activeLook ) {
			switch ( event.button ) {
				case 0: this.moveForward = false; break;
				case 2: this.moveBackward = false; break;
			}
		}
		this.mouseDragOn = false;
	};

	this.onMouseMove = function ( event ) {

		if ( this.domElement === document ) {
			this.mouseX = event.pageX - this.viewHalfX;
			this.mouseY = event.pageY - this.viewHalfY;
		} else {
			this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
			this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;
		}
	};

	this.onKeyDown = function ( event ) {
		//event.preventDefault();
		switch ( event.code ) {

			case 'ArrowUp':
			case 'KeyW': this.moveForward = true; break;

			case 'ArrowLeft':
			case 'KeyA': this.moveLeft = true; break;

			case 'ArrowDown':
			case 'KeyS': this.moveBackward = true; break;

			case 'ArrowRight':
			case 'KeyD': this.moveRight = true; break;

			case 'KeyR': this.moveUp = true; break;
			case 'KeyF': this.moveDown = true; break;

			case 'KeyE': this.reactToE()
		}
	};

	this.reactToE = function(){
		console.log(this.object)
		this.lookAt( targetPosition );
	}

	this.onKeyUp = function ( event ) {
		switch ( event.code ) {

			case 'ArrowUp':
			case 'KeyW': this.moveForward = false; break;

			case 'ArrowLeft':
			case 'KeyA': this.moveLeft = false; break;

			case 'ArrowDown':
			case 'KeyS': this.moveBackward = false; break;

			case 'ArrowRight':
			case 'KeyD': this.moveRight = false; break;

			case 'KeyR': this.moveUp = false; break;
			case 'KeyF': this.moveDown = false; break;

		}
	};

	this.lookAt = function ( x, y, z ) {
		if ( x.isVector3 ) {
			target.copy( x );
		} else {
			target.set( x, y, z );
		}
		console.log("up", this.object.up)
		this.object.lookAt( target );
		// setOrientation( this );
		return this;
	};

	this.update = function ( ) {

		
		var targetMovePosition = new THREE.Vector3();

		return function update( delta, r ) {

			if ( this.enabled === false ) return;

			if ( this.heightSpeed ) {

				var y = THREE.MathUtils.clamp( this.object.position.y, this.heightMin, this.heightMax );
				var heightDelta = y - this.heightMin;

				this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

			} else {

				this.autoSpeedFactor = 0.0;

			}

			var actualMoveSpeed = delta * this.movementSpeed;

			if ( this.moveForward || ( this.autoForward && ! this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
			if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

			// if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
			// if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

			if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
			if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

			// normalize the position to the sphere based on its radius r
			// this.object.position.clampLength(5.0, 5.0)

			var actualLookSpeed = this.activeLook ? delta * this.lookSpeed : 0;

			var verticalLookRatio = 1;

			if ( this.constrainVertical ) {

				verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

			}

			lon -= this.mouseX * actualLookSpeed;
			if ( this.lookVertical ) lat -= this.mouseY * actualLookSpeed * verticalLookRatio;

			// lat = Math.max( - 85, Math.min( 85, lat ) );

			var phi = THREE.MathUtils.degToRad( 90 - lat );
			var theta = THREE.MathUtils.degToRad( lon );

			if ( this.constrainVertical ) {

				phi = THREE.MathUtils.mapLinear( phi, 0, Math.PI, this.verticalMin, this.verticalMax );

			}

			var position = this.object.position;

			targetPosition.setFromSphericalCoords( 1.0, phi, theta ).add( position );

			// targetMovePosition = targetPosition.clone()

			// targetMovePosition.clampLength(5.0, 5.0)

			let up = new THREE.Vector3()
			up = up.subVectors( this.object.position, this.origin ).normalize()
			this.object.up = up

			if (this.object && this.moveRight){ this.object.rotateOnAxis( this.object.up, -.01 ) }
			if (this.object && this.moveLeft) { this.object.rotateOnAxis( this.object.up,  .01 ) }

			// this.lookAt(targetPosition)
			this.object.lookAt( targetPosition );

		};

	}();

	function contextmenu( event ) {

		event.preventDefault();

	}

	this.dispose = function () {

		this.domElement.removeEventListener( 'contextmenu', contextmenu );
		this.domElement.removeEventListener( 'mousedown', _onMouseDown );
		this.domElement.removeEventListener( 'mousemove', _onMouseMove );
		this.domElement.removeEventListener( 'mouseup', _onMouseUp );

		window.removeEventListener( 'keydown', _onKeyDown );
		window.removeEventListener( 'keyup', _onKeyUp );

	};

	var _onMouseMove = bind( this, this.onMouseMove );
	var _onMouseDown = bind( this, this.onMouseDown );
	var _onMouseUp = bind( this, this.onMouseUp );
	var _onKeyDown = bind( this, this.onKeyDown );
	var _onKeyUp = bind( this, this.onKeyUp );

	this.domElement.addEventListener( 'contextmenu', contextmenu );
	this.domElement.addEventListener( 'mousemove', _onMouseMove );
	this.domElement.addEventListener( 'mousedown', _onMouseDown );
	this.domElement.addEventListener( 'mouseup', _onMouseUp );

	window.addEventListener( 'keydown', _onKeyDown );
	window.addEventListener( 'keyup', _onKeyUp );

	function bind( scope, fn ) {

		return function () {

			fn.apply( scope, arguments );

		};

	}

	function setOrientation( controls ) {

		var quaternion = controls.object.quaternion;

		lookDirection.set( 0, 0, - 1 ).applyQuaternion( quaternion );
		spherical.setFromVector3( lookDirection );

		lat = 90 - THREE.MathUtils.radToDeg( spherical.phi );
		lon = THREE.MathUtils.radToDeg( spherical.theta );

	}

	this.handleResize();

	setOrientation( this );

};