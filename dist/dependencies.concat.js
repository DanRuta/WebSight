/* globals THREE */
/**
 * DeviceOrientationControls - applies device orientation on object rotation
 *
 * @param {Object} object - instance of THREE.Object3D
 * @constructor
 *
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 * @author jonobr1 / http://jonobr1.com
 * @author arodic / http://aleksandarrodic.com
 * @author doug / http://github.com/doug
 *
 * W3C Device Orientation control
 * (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

(function() {

  var deviceOrientation = {};
  var screenOrientation = window.orientation || 0;

  function onDeviceOrientationChangeEvent(evt) {
    deviceOrientation = evt;
  }
  window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);

  function getOrientation() {
    switch (window.screen.orientation || window.screen.mozOrientation) {
      case 'landscape-primary':
        return 90;
      case 'landscape-secondary':
        return -90;
      case 'portrait-secondary':
        return 180;
      case 'portrait-primary':
        return 0;
    }
    // this returns 90 if width is greater then height
    // and window orientation is undefined OR 0
    // if (!window.orientation && window.innerWidth > window.innerHeight)
    //   return 90;
    return window.orientation || 0;
  }

  function onScreenOrientationChangeEvent() {
    screenOrientation = getOrientation();
  }
  window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);


THREE.DeviceOrientationControls = function(object) {

  this.object = object;

  this.object.rotation.reorder('YXZ');

  this.freeze = true;

  this.movementSpeed = 1.0;
  this.rollSpeed = 0.005;
  this.autoAlign = true;
  this.autoForward = false;

  this.alpha = 0;
  this.beta = 0;
  this.gamma = 0;
  this.orient = 0;

  this.alignQuaternion = new THREE.Quaternion();
  this.orientationQuaternion = new THREE.Quaternion();

  var quaternion = new THREE.Quaternion();
  var quaternionLerp = new THREE.Quaternion();

  var tempVector3 = new THREE.Vector3();
  var tempMatrix4 = new THREE.Matrix4();
  var tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  var tempQuaternion = new THREE.Quaternion();

  var zee = new THREE.Vector3(0, 0, 1);
  var up = new THREE.Vector3(0, 1, 0);
  var v0 = new THREE.Vector3(0, 0, 0);
  var euler = new THREE.Euler();
  var q0 = new THREE.Quaternion(); // - PI/2 around the x-axis
  var q1 = new THREE.Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));


  this.update = (function(delta) {

    return function(delta) {

      if (this.freeze) return;

      // should not need this
      //var orientation = getOrientation();
      //if (orientation !== this.screenOrientation) {
        //this.screenOrientation = orientation;
        //this.autoAlign = true;
      //}

      this.alpha = deviceOrientation.gamma ?
        THREE.Math.degToRad(deviceOrientation.alpha) : 0; // Z
      this.beta = deviceOrientation.beta ?
        THREE.Math.degToRad(deviceOrientation.beta) : 0; // X'
      this.gamma = deviceOrientation.gamma ?
        THREE.Math.degToRad(deviceOrientation.gamma) : 0; // Y''
      this.orient = screenOrientation ?
        THREE.Math.degToRad(screenOrientation) : 0; // O

      // The angles alpha, beta and gamma
      // form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

      // 'ZXY' for the device, but 'YXZ' for us
      euler.set(this.beta, this.alpha, - this.gamma, 'YXZ');

      quaternion.setFromEuler(euler);
      quaternionLerp.slerp(quaternion, 0.5); // interpolate

      // orient the device
      if (this.autoAlign) this.orientationQuaternion.copy(quaternion); // interpolation breaks the auto alignment
      else this.orientationQuaternion.copy(quaternionLerp);

      // camera looks out the back of the device, not the top
      this.orientationQuaternion.multiply(q1);

      // adjust for screen orientation
      this.orientationQuaternion.multiply(q0.setFromAxisAngle(zee, - this.orient));

      this.object.quaternion.copy(this.alignQuaternion);
      this.object.quaternion.multiply(this.orientationQuaternion);

      if (this.autoForward) {

        tempVector3
          .set(0, 0, -1)
          .applyQuaternion(this.object.quaternion, 'ZXY')
          .setLength(this.movementSpeed / 50); // TODO: why 50 :S

        this.object.position.add(tempVector3);

      }

      if (this.autoAlign && this.alpha !== 0) {

        this.autoAlign = false;

        this.align();

      }

    };

  })();

  // //debug
  // window.addEventListener('click', (function(){
  //   this.align();
  // }).bind(this));

  this.align = function() {

    tempVector3
      .set(0, 0, -1)
      .applyQuaternion( tempQuaternion.copy(this.orientationQuaternion).inverse(), 'ZXY' );

    tempEuler.setFromQuaternion(
      tempQuaternion.setFromRotationMatrix(
        tempMatrix4.lookAt(tempVector3, v0, up)
     )
   );

    tempEuler.set(0, tempEuler.y, 0);
    this.alignQuaternion.setFromEuler(tempEuler);

  };

  this.connect = function() {
    this.freeze = false;
  };

  this.disconnect = function() {
    this.freze = true;
  };

};

})();


// NoSleep.min.js v0.5.0 - git.io/vfn01 - Rich Tibbett - MIT license
!function(A){function e(A,e,o){var t=document.createElement("source");t.src=o,t.type="video/"+e,A.appendChild(t)}var o={Android:/Android/gi.test(navigator.userAgent),iOS:/AppleWebKit/.test(navigator.userAgent)&&/Mobile\/\w+/.test(navigator.userAgent)},t={WebM:"data:video/webm;base64,GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu14EBY8WBAZyBACK1nEADdW5khkAFVl9WUDglhohAA1ZQOIOBAeBABrCBCLqBCB9DtnVAIueBAKNAHIEAAIAwAQCdASoIAAgAAUAmJaQAA3AA/vz0AAA=",MP4:"data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAG21kYXQAAAGzABAHAAABthADAowdbb9/AAAC6W1vb3YAAABsbXZoZAAAAAB8JbCAfCWwgAAAA+gAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIVdHJhawAAAFx0a2hkAAAAD3wlsIB8JbCAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAIAAAACAAAAAABsW1kaWEAAAAgbWRoZAAAAAB8JbCAfCWwgAAAA+gAAAAAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAVxtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEcc3RibAAAALhzdHNkAAAAAAAAAAEAAACobXA0dgAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAIAAgASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAFJlc2RzAAAAAANEAAEABDwgEQAAAAADDUAAAAAABS0AAAGwAQAAAbWJEwAAAQAAAAEgAMSNiB9FAEQBFGMAAAGyTGF2YzUyLjg3LjQGAQIAAAAYc3R0cwAAAAAAAAABAAAAAQAAAAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAAAEwAAAAEAAAAUc3RjbwAAAAAAAAABAAAALAAAAGB1ZHRhAAAAWG1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAAK2lsc3QAAAAjqXRvbwAAABtkYXRhAAAAAQAAAABMYXZmNTIuNzguMw=="},i=function(){return o.iOS?this.noSleepTimer=null:o.Android&&(this.noSleepVideo=document.createElement("video"),this.noSleepVideo.setAttribute("loop",""),e(this.noSleepVideo,"webm",t.WebM),e(this.noSleepVideo,"mp4",t.MP4)),this};i.prototype.enable=function(A){o.iOS?(this.disable(),this.noSleepTimer=window.setInterval(function(){window.location.href='/',window.setTimeout(window.stop,0)},A||15e3)):o.Android&&this.noSleepVideo.play()},i.prototype.disable=function(){o.iOS?this.noSleepTimer&&(window.clearInterval(this.noSleepTimer),this.noSleepTimer=null):o.Android&&this.noSleepVideo.pause()},A.NoSleep=i}(this);

/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */
/*global THREE, console */

// This set of controls performs orbiting, dollying (zooming), and panning. It maintains
// the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
// supported.
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe
//
// This is a drop-in replacement for (most) TrackballControls used in examples.
// That is, include this js file and wherever you see:
//      controls = new THREE.TrackballControls( camera );
//      controls.target.z = 150;
// Simple substitute "OrbitControls" and the control should work as-is.

THREE.OrbitControls = function ( object, domElement ) {

  this.object = object;
  this.domElement = ( domElement !== undefined ) ? domElement : document;

  // API

  // Set to false to disable this control
  this.enabled = true;

  // "target" sets the location of focus, where the control orbits around
  // and where it pans with respect to.
  this.target = new THREE.Vector3();

  // center is old, deprecated; use "target" instead
  this.center = this.target;

  // This option actually enables dollying in and out; left as "zoom" for
  // backwards compatibility
  this.noZoom = false;
  this.zoomSpeed = 1.0;

  // Limits to how far you can dolly in and out
  this.minDistance = 0;
  this.maxDistance = Infinity;

  // Set to true to disable this control
  this.noRotate = false;
  this.rotateSpeed = 1.0;

  // Set to true to disable this control
  this.noPan = false;
  this.keyPanSpeed = 7.0; // pixels moved per arrow key push

  // Set to true to automatically rotate around the target
  this.autoRotate = false;
  this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  this.minPolarAngle = 0; // radians
  this.maxPolarAngle = Math.PI; // radians

  // Set to true to disable use of the keys
  this.noKeys = false;

  // The four arrow keys
  this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

  ////////////
  // internals

  var scope = this;

  var EPS = 0.000001;

  var rotateStart = new THREE.Vector2();
  var rotateEnd = new THREE.Vector2();
  var rotateDelta = new THREE.Vector2();

  var panStart = new THREE.Vector2();
  var panEnd = new THREE.Vector2();
  var panDelta = new THREE.Vector2();
  var panOffset = new THREE.Vector3();

  var offset = new THREE.Vector3();

  var dollyStart = new THREE.Vector2();
  var dollyEnd = new THREE.Vector2();
  var dollyDelta = new THREE.Vector2();

  var phiDelta = 0;
  var thetaDelta = 0;
  var scale = 1;
  var pan = new THREE.Vector3();

  var lastPosition = new THREE.Vector3();

  var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

  var state = STATE.NONE;

  // for reset

  this.target0 = this.target.clone();
  this.position0 = this.object.position.clone();

  // so camera.up is the orbit axis

  var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
  var quatInverse = quat.clone().inverse();

  // events

  var changeEvent = { type: 'change' };
  var startEvent = { type: 'start'};
  var endEvent = { type: 'end'};

  this.rotateLeft = function ( angle ) {

    if ( angle === undefined ) {

      angle = getAutoRotationAngle();

    }

    thetaDelta -= angle;

  };

  this.rotateUp = function ( angle ) {

    if ( angle === undefined ) {

      angle = getAutoRotationAngle();

    }

    phiDelta -= angle;

  };

  // pass in distance in world space to move left
  this.panLeft = function ( distance ) {

    var te = this.object.matrix.elements;

    // get X column of matrix
    panOffset.set( te[ 0 ], te[ 1 ], te[ 2 ] );
    panOffset.multiplyScalar( - distance );

    pan.add( panOffset );

  };

  // pass in distance in world space to move up
  this.panUp = function ( distance ) {

    var te = this.object.matrix.elements;

    // get Y column of matrix
    panOffset.set( te[ 4 ], te[ 5 ], te[ 6 ] );
    panOffset.multiplyScalar( distance );

    pan.add( panOffset );

  };

  // pass in x,y of change desired in pixel space,
  // right and down are positive
  this.pan = function ( deltaX, deltaY ) {

    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

    if ( scope.object.fov !== undefined ) {

      // perspective
      var position = scope.object.position;
      var offset = position.clone().sub( scope.target );
      var targetDistance = offset.length();

      // half of the fov is center to top of screen
      targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

      // we actually don't use screenWidth, since perspective camera is fixed to screen height
      scope.panLeft( 2 * deltaX * targetDistance / element.clientHeight );
      scope.panUp( 2 * deltaY * targetDistance / element.clientHeight );

    } else if ( scope.object.top !== undefined ) {

      // orthographic
      scope.panLeft( deltaX * (scope.object.right - scope.object.left) / element.clientWidth );
      scope.panUp( deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight );

    } else {

      // camera neither orthographic or perspective
      console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );

    }

  };

  this.dollyIn = function ( dollyScale ) {

    if ( dollyScale === undefined ) {

      dollyScale = getZoomScale();

    }

    scale /= dollyScale;

  };

  this.dollyOut = function ( dollyScale ) {

    if ( dollyScale === undefined ) {

      dollyScale = getZoomScale();

    }

    scale *= dollyScale;

  };

  this.update = function () {

    var position = this.object.position;

    offset.copy( position ).sub( this.target );

    // rotate offset to "y-axis-is-up" space
    offset.applyQuaternion( quat );

    // angle from z-axis around y-axis

    var theta = Math.atan2( offset.x, offset.z );

    // angle from y-axis

    var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

    if ( this.autoRotate ) {

      this.rotateLeft( getAutoRotationAngle() );

    }

    theta += thetaDelta;
    phi += phiDelta;

    // restrict phi to be between desired limits
    phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

    // restrict phi to be betwee EPS and PI-EPS
    phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

    var radius = offset.length() * scale;

    // restrict radius to be between desired limits
    radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

    // move target to panned location
    this.target.add( pan );

    offset.x = radius * Math.sin( phi ) * Math.sin( theta );
    offset.y = radius * Math.cos( phi );
    offset.z = radius * Math.sin( phi ) * Math.cos( theta );

    // rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion( quatInverse );

    position.copy( this.target ).add( offset );

    this.object.lookAt( this.target );

    thetaDelta = 0;
    phiDelta = 0;
    scale = 1;
    pan.set( 0, 0, 0 );

    if ( lastPosition.distanceToSquared( this.object.position ) > EPS ) {

      this.dispatchEvent( changeEvent );

      lastPosition.copy( this.object.position );

    }

  };


  this.reset = function () {

    state = STATE.NONE;

    this.target.copy( this.target0 );
    this.object.position.copy( this.position0 );

    this.update();

  };

  function getAutoRotationAngle() {

    return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

  }

  function getZoomScale() {

    return Math.pow( 0.95, scope.zoomSpeed );

  }

  function onMouseDown( event ) {

    if ( scope.enabled === false ) return;
    event.preventDefault();

    if ( event.button === 0 ) {
      if ( scope.noRotate === true ) return;

      state = STATE.ROTATE;

      rotateStart.set( event.clientX, event.clientY );

    } else if ( event.button === 1 ) {
      if ( scope.noZoom === true ) return;

      state = STATE.DOLLY;

      dollyStart.set( event.clientX, event.clientY );

    } else if ( event.button === 2 ) {
      if ( scope.noPan === true ) return;

      state = STATE.PAN;

      panStart.set( event.clientX, event.clientY );

    }

    scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
    scope.domElement.addEventListener( 'mouseup', onMouseUp, false );
    scope.dispatchEvent( startEvent );

  }

  function onMouseMove( event ) {

    if ( scope.enabled === false ) return;

    event.preventDefault();

    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

    if ( state === STATE.ROTATE ) {

      if ( scope.noRotate === true ) return;

      rotateEnd.set( event.clientX, event.clientY );
      rotateDelta.subVectors( rotateEnd, rotateStart );

      // rotating across whole screen goes 360 degrees around
      scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

      // rotating up and down along whole screen attempts to go 360, but limited to 180
      scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

      rotateStart.copy( rotateEnd );

    } else if ( state === STATE.DOLLY ) {

      if ( scope.noZoom === true ) return;

      dollyEnd.set( event.clientX, event.clientY );
      dollyDelta.subVectors( dollyEnd, dollyStart );

      if ( dollyDelta.y > 0 ) {

        scope.dollyIn();

      } else {

        scope.dollyOut();

      }

      dollyStart.copy( dollyEnd );

    } else if ( state === STATE.PAN ) {

      if ( scope.noPan === true ) return;

      panEnd.set( event.clientX, event.clientY );
      panDelta.subVectors( panEnd, panStart );

      scope.pan( panDelta.x, panDelta.y );

      panStart.copy( panEnd );

    }

    scope.update();

  }

  function onMouseUp( /* event */ ) {

    if ( scope.enabled === false ) return;

    scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
    scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
    scope.dispatchEvent( endEvent );
    state = STATE.NONE;

  }

  function onMouseWheel( event ) {

    if ( scope.enabled === false || scope.noZoom === true ) return;

    event.preventDefault();
    event.stopPropagation();

    var delta = 0;

    if ( event.wheelDelta !== undefined ) { // WebKit / Opera / Explorer 9

      delta = event.wheelDelta;

    } else if ( event.detail !== undefined ) { // Firefox

      delta = - event.detail;

    }

    if ( delta > 0 ) {

      scope.dollyOut();

    } else {

      scope.dollyIn();

    }

    scope.update();
    scope.dispatchEvent( startEvent );
    scope.dispatchEvent( endEvent );

  }

  function onKeyDown( event ) {

    if ( scope.enabled === false || scope.noKeys === true || scope.noPan === true ) return;

    switch ( event.keyCode ) {

      case scope.keys.UP:
        scope.pan( 0, scope.keyPanSpeed );
        scope.update();
        break;

      case scope.keys.BOTTOM:
        scope.pan( 0, - scope.keyPanSpeed );
        scope.update();
        break;

      case scope.keys.LEFT:
        scope.pan( scope.keyPanSpeed, 0 );
        scope.update();
        break;

      case scope.keys.RIGHT:
        scope.pan( - scope.keyPanSpeed, 0 );
        scope.update();
        break;

    }

  }

  function touchstart( event ) {

    if ( scope.enabled === false ) return;

    switch ( event.touches.length ) {

      case 1: // one-fingered touch: rotate

        if ( scope.noRotate === true ) return;

        state = STATE.TOUCH_ROTATE;

        rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        break;

      case 2: // two-fingered touch: dolly

        if ( scope.noZoom === true ) return;

        state = STATE.TOUCH_DOLLY;

        var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
        var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
        var distance = Math.sqrt( dx * dx + dy * dy );
        dollyStart.set( 0, distance );
        break;

      case 3: // three-fingered touch: pan

        if ( scope.noPan === true ) return;

        state = STATE.TOUCH_PAN;

        panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        break;

      default:

        state = STATE.NONE;

    }

    scope.dispatchEvent( startEvent );

  }

  function touchmove( event ) {

    if ( scope.enabled === false ) return;

    event.preventDefault();
    event.stopPropagation();

    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

    switch ( event.touches.length ) {

      case 1: // one-fingered touch: rotate

        if ( scope.noRotate === true ) return;
        if ( state !== STATE.TOUCH_ROTATE ) return;

        rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        rotateDelta.subVectors( rotateEnd, rotateStart );

        // rotating across whole screen goes 360 degrees around
        scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
        // rotating up and down along whole screen attempts to go 360, but limited to 180
        scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

        rotateStart.copy( rotateEnd );

        scope.update();
        break;

      case 2: // two-fingered touch: dolly

        if ( scope.noZoom === true ) return;
        if ( state !== STATE.TOUCH_DOLLY ) return;

        var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
        var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
        var distance = Math.sqrt( dx * dx + dy * dy );

        dollyEnd.set( 0, distance );
        dollyDelta.subVectors( dollyEnd, dollyStart );

        if ( dollyDelta.y > 0 ) {

          scope.dollyOut();

        } else {

          scope.dollyIn();

        }

        dollyStart.copy( dollyEnd );

        scope.update();
        break;

      case 3: // three-fingered touch: pan

        if ( scope.noPan === true ) return;
        if ( state !== STATE.TOUCH_PAN ) return;

        panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        panDelta.subVectors( panEnd, panStart );

        scope.pan( panDelta.x, panDelta.y );

        panStart.copy( panEnd );

        scope.update();
        break;

      default:

        state = STATE.NONE;

    }

  }

  function touchend( /* event */ ) {

    if ( scope.enabled === false ) return;

    scope.dispatchEvent( endEvent );
    state = STATE.NONE;

  }

  this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
  this.domElement.addEventListener( 'mousedown', onMouseDown, false );
  this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
  this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

  this.domElement.addEventListener( 'touchstart', touchstart, false );
  this.domElement.addEventListener( 'touchend', touchend, false );
  this.domElement.addEventListener( 'touchmove', touchmove, false );

  window.addEventListener( 'keydown', onKeyDown, false );

  // force an update at start
  this.update();

};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );

/**
 * @author alteredq / http://alteredqualia.com/
 * @authod mrdoob / http://mrdoob.com/
 * @authod arodic / http://aleksandarrodic.com/
 * @authod fonserbc / http://fonserbc.github.io/
 *
 * Off-axis stereoscopic effect based on http://paulbourke.net/stereographics/stereorender/
 */

THREE.StereoEffect = function ( renderer ) {

	// API

	this.separation = 3;

	/*
	 * Distance to the non-parallax or projection plane
	 */
	this.focalLength = 15;

	// internals

	var _width, _height;

	var _position = new THREE.Vector3();
	var _quaternion = new THREE.Quaternion();
	var _scale = new THREE.Vector3();

	var _cameraL = new THREE.PerspectiveCamera();
	var _cameraR = new THREE.PerspectiveCamera();

	var _fov;
	var _outer, _inner, _top, _bottom;
	var _ndfl, _halfFocalWidth, _halfFocalHeight;
	var _innerFactor, _outerFactor;

	// initialization

	renderer.autoClear = false;

	this.setSize = function ( width, height ) {

		_width = width / 2;
		_height = height;

		renderer.setSize( width, height );

	};

	this.render = function ( scene, camera, willClear ) {

		scene.updateMatrixWorld();

		if ( camera.parent === undefined ) camera.updateMatrixWorld();
	
		camera.matrixWorld.decompose( _position, _quaternion, _scale );

		// Stereo frustum calculation

		// Effective fov of the camera
		_fov = THREE.Math.radToDeg( 2 * Math.atan( Math.tan( THREE.Math.degToRad( camera.fov ) * 0.5 ) ) );

		_ndfl = camera.near / this.focalLength;
		_halfFocalHeight = Math.tan( THREE.Math.degToRad( _fov ) * 0.5 ) * this.focalLength;
		_halfFocalWidth = _halfFocalHeight * 0.5 * camera.aspect;

		_top = _halfFocalHeight * _ndfl;
		_bottom = -_top;
		_innerFactor = ( _halfFocalWidth + this.separation / 2.0 ) / ( _halfFocalWidth * 2.0 );
		_outerFactor = 1.0 - _innerFactor;

		_outer = _halfFocalWidth * 2.0 * _ndfl * _outerFactor;
		_inner = _halfFocalWidth * 2.0 * _ndfl * _innerFactor;

		// left

		_cameraL.projectionMatrix.makeFrustum(
			-_outer,
			_inner,
			_bottom,
			_top,
			camera.near,
			camera.far
		);

		_cameraL.position.copy( _position );
		_cameraL.quaternion.copy( _quaternion );
		_cameraL.translateX( - this.separation / 2.0 );

		// right

		_cameraR.projectionMatrix.makeFrustum(
			-_inner,
			_outer,
			_bottom,
			_top,
			camera.near,
			camera.far
		);

		_cameraR.position.copy( _position );
		_cameraR.quaternion.copy( _quaternion );
		_cameraR.translateX( this.separation / 2.0 );

		//

		renderer.setViewport( 0, 0, _width * 2, _height );

		if(willClear)
			renderer.clear();

		renderer.setViewport( 0, 0, _width, _height );
		renderer.render( scene, _cameraL );

		renderer.setViewport( _width, 0, _width, _height );
		renderer.render( scene, _cameraR );

		if(willClear)
			renderer.clearDepth()
	};

};

// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

window.VRSamplesUtil = (function () {

  "use strict";

  // Lifted from the WebVR Polyfill
  function isMobile () {
    return /Android/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function getMessageContainer () {
    var messageContainer = document.getElementById("vr-sample-message-container");
    if (!messageContainer) {
      messageContainer = document.createElement("div");
      messageContainer.id = "vr-sample-message-container";
      messageContainer.style.fontFamily = "sans-serif";
      messageContainer.style.position = "absolute";
      messageContainer.style.zIndex = "999";
      messageContainer.style.left = "0";
      messageContainer.style.top = "0";
      messageContainer.style.right = "0";
      messageContainer.style.margin = "0";
      messageContainer.style.padding = "0";
      messageContainer.align = "center";
      document.body.appendChild(messageContainer);
    }
    return messageContainer;
  }

  function addMessageElement (message, backgroundColor) {
    var messageElement = document.createElement("div");
    messageElement.classList.add = "vr-sample-message";
    messageElement.style.color = "#FFF";
    messageElement.style.backgroundColor = backgroundColor;
    messageElement.style.borderRadius = "3px";
    messageElement.style.position = "relative";
    messageElement.style.display = "inline-block";
    messageElement.style.margin = "0.5em";
    messageElement.style.padding = "0.75em";

    messageElement.innerHTML = message;

    getMessageContainer().appendChild(messageElement);

    return messageElement;
  }

  // Makes the given element fade out and remove itself from the DOM after the
  // given timeout.
  function makeToast (element, timeout) {
    element.style.transition = "opacity 0.5s ease-in-out";
    element.style.opacity = "1";
    setTimeout(function () {
      element.style.opacity = "0";
      setTimeout(function () {
        if (element.parentElement)
          element.parentElement.removeChild(element);
      }, 500);
    }, timeout);
  }

  function addError (message, timeout) {
    var element = addMessageElement("<b>ERROR:</b> " + message, "#D33");

    if (timeout) {
      makeToast(element, timeout);
    }

    return element;
  }

  function addInfo (message, timeout) {
    var element = addMessageElement(message, "#22A");

    if (timeout) {
      makeToast(element, timeout);
    }

    return element;
  }

  function getButtonContainer () {
    var buttonContainer = document.getElementById("vr-sample-button-container");
    if (!buttonContainer) {
      buttonContainer = document.createElement("div");
      buttonContainer.id = "vr-sample-button-container";
      buttonContainer.style.fontFamily = "sans-serif";
      buttonContainer.style.position = "absolute";
      buttonContainer.style.zIndex = "999";
      buttonContainer.style.left = "0";
      buttonContainer.style.bottom = "0";
      buttonContainer.style.right = "0";
      buttonContainer.style.margin = "0";
      buttonContainer.style.padding = "0";
      buttonContainer.align = "right";
      document.body.appendChild(buttonContainer);
    }
    return buttonContainer;
  }

  function addButtonElement (message, key, icon) {
    var buttonElement = document.createElement("div");
    buttonElement.classList.add = "vr-sample-button";
    buttonElement.style.color = "#FFF";
    buttonElement.style.fontWeight = "bold";
    buttonElement.style.backgroundColor = "#888";
    buttonElement.style.borderRadius = "5px";
    buttonElement.style.border = "3px solid #555";
    buttonElement.style.position = "relative";
    buttonElement.style.display = "inline-block";
    buttonElement.style.margin = "0.5em";
    buttonElement.style.padding = "0.75em";
    buttonElement.style.cursor = "pointer";
    buttonElement.align = "center";

    if (icon) {
      buttonElement.innerHTML = "<img src='" + icon + "'/><br/>" + message;
    } else {
      buttonElement.innerHTML = message;
    }

    if (key) {
      var keyElement = document.createElement("span");
      keyElement.classList.add = "vr-sample-button-accelerator";
      keyElement.style.fontSize = "0.75em";
      keyElement.style.fontStyle = "italic";
      keyElement.innerHTML = " (" + key + ")";

      buttonElement.appendChild(keyElement);
    }

    getButtonContainer().appendChild(buttonElement);

    return buttonElement;
  }

  function addButton (message, key, icon, callback) {
    var keyListener = null;
    if (key) {
      var keyCode = key.charCodeAt(0);
      keyListener = function (event) {
        if (event.keyCode === keyCode) {
          callback(event);
        }
      };
      document.addEventListener("keydown", keyListener, false);
    }
    var element = addButtonElement(message, key, icon);
    element.addEventListener("click", function (event) {
      callback(event);
      event.preventDefault();
    }, false);

    return {
      element: element,
      keyListener: keyListener
    };
  }

  function removeButton (button) {
    if (!button)
      return;
    if (button.element.parentElement)
      button.element.parentElement.removeChild(button.element);
    if (button.keyListener)
      document.removeEventListener("keydown", button.keyListener, false);
  }

  return {
    isMobile: isMobile,
    addError: addError,
    addInfo: addInfo,
    addButton: addButton,
    removeButton: removeButton,
    makeToast: makeToast
  };
})();

/**
 * @author dmarcos / https://github.com/dmarcos
 * @author mrdoob / http://mrdoob.com
 */

THREE.VRControls = function ( object, onError ) {

	var scope = this;

	var vrInput;

	var standingMatrix = new THREE.Matrix4();

	function gotVRDevices( devices ) {

		for ( var i = 0; i < devices.length; i ++ ) {

			if ( ( 'VRDisplay' in window && devices[ i ] instanceof VRDisplay ) ||
				 ( 'PositionSensorVRDevice' in window && devices[ i ] instanceof PositionSensorVRDevice ) ) {

				vrInput = devices[ i ];
				break;  // We keep the first we encounter

			}

		}

		if ( !vrInput ) {

			if ( onError ) onError( 'VR input not available.' );

		}

	}

	if ( navigator.getVRDisplays ) {

		navigator.getVRDisplays().then( gotVRDevices );

	} else if ( navigator.getVRDevices ) {

		// Deprecated API.
		navigator.getVRDevices().then( gotVRDevices );

	}

	// the Rift SDK returns the position in meters
	// this scale factor allows the user to define how meters
	// are converted to scene units.

	this.scale = 1;

	// If true will use "standing space" coordinate system where y=0 is the
	// floor and x=0, z=0 is the center of the room.
	this.standing = false;

	// Distance from the users eyes to the floor in meters. Used when
	// standing=true but the VRDisplay doesn't provide stageParameters.
	this.userHeight = 1.6;

	this.update = function () {

		if ( vrInput ) {

			if ( vrInput.getPose ) {

				var pose = vrInput.getPose();

				if ( pose.orientation !== null ) {

					object.quaternion.fromArray( pose.orientation );

				}

				if ( pose.position !== null ) {

					object.position.fromArray( pose.position );

				} else {

					object.position.set( 0, 0, 0 );

				}

			} else {

				// Deprecated API.
				var state = vrInput.getState();

				if ( state.orientation !== null ) {

					object.quaternion.copy( state.orientation );

				}

				if ( state.position !== null ) {

					object.position.copy( state.position );

				} else {

					object.position.set( 0, 0, 0 );

				}

			}

			if ( this.standing ) {

				if ( vrInput.stageParameters ) {

					object.updateMatrix();

					standingMatrix.fromArray(vrInput.stageParameters.sittingToStandingTransform);
					object.applyMatrix( standingMatrix );

				} else {

					object.position.setY( object.position.y + this.userHeight );

				}

			}

			object.position.multiplyScalar( scope.scale );

		}

	};

	this.resetPose = function () {

		if ( vrInput ) {

			if ( vrInput.resetPose !== undefined ) {

				vrInput.resetPose();

			} else if ( vrInput.resetSensor !== undefined ) {

				// Deprecated API.
				vrInput.resetSensor();

			} else if ( vrInput.zeroSensor !== undefined ) {

				// Really deprecated API.
				vrInput.zeroSensor();

			}

		}

	};

	this.resetSensor = function () {

		console.warn( 'THREE.VRControls: .resetSensor() is now .resetPose().' );
		this.resetPose();

	};

	this.zeroSensor = function () {

		console.warn( 'THREE.VRControls: .zeroSensor() is now .resetPose().' );
		this.resetPose();

	};

	this.dispose = function () {

		vrInput = null;

	};

};

/**
 * @author dmarcos / https://github.com/dmarcos
 * @author mrdoob / http://mrdoob.com
 *
 * WebVR Spec: http://mozvr.github.io/webvr-spec/webvr.html
 *
 * Firefox: http://mozvr.com/downloads/
 * Chromium: https://webvr.info/get-chrome
 *
 */

THREE.VREffect = function ( renderer, onError ) {

	var vrDisplay, vrDisplays;
	var eyeTranslationL = new THREE.Vector3();
	var eyeTranslationR = new THREE.Vector3();
	var renderRectL, renderRectR;

	var frameData = null;
	if ( 'VRFrameData' in window ) {

		frameData = new VRFrameData();

	}

	function gotVRDisplays( displays ) {

		vrDisplays = displays;

		if ( displays.length > 0 ) {

			vrDisplay = displays[ 0 ];

		} else {

			if ( onError ) onError( 'HMD not available' );

		}

	}

	if ( navigator.getVRDisplays ) {

		navigator.getVRDisplays().then( gotVRDisplays );

	}

	//

	this.isPresenting = false;
	this.scale = 1;

	var scope = this;

	var rendererSize = renderer.getSize();
	var rendererUpdateStyle = false;
	var rendererPixelRatio = renderer.getPixelRatio();

	this.getVRDisplay = function () {

		return vrDisplay;

	};

	this.getVRDisplays = function () {

		return vrDisplays;

	};

	this.setSize = function ( width, height, updateStyle ) {

		rendererSize = { width: width, height: height };
		rendererUpdateStyle = updateStyle;

		if ( scope.isPresenting ) {

			var eyeParamsL = vrDisplay.getEyeParameters( 'left' );
			renderer.setPixelRatio( 1 );
			renderer.setSize( eyeParamsL.renderWidth * 2, eyeParamsL.renderHeight, false );

		} else {

			renderer.setPixelRatio( rendererPixelRatio );
			renderer.setSize( width, height, updateStyle );

		}

	};

	// fullscreen

	var canvas = renderer.domElement;
	var requestFullscreen;
	var exitFullscreen;
	var fullscreenElement;
	var leftBounds = [ 0.0, 0.0, 0.5, 1.0 ];
	var rightBounds = [ 0.5, 0.0, 0.5, 1.0 ];

	function onFullscreenChange() {

		var wasPresenting = scope.isPresenting;
		scope.isPresenting = vrDisplay !== undefined && vrDisplay.isPresenting;

		if ( scope.isPresenting ) {

			var eyeParamsL = vrDisplay.getEyeParameters( 'left' );
			var eyeWidth = eyeParamsL.renderWidth;
			var eyeHeight = eyeParamsL.renderHeight;

			var layers = vrDisplay.getLayers();
			if ( layers.length ) {

				var layer = layers[0];

				leftBounds = layer.leftBounds !== null && layer.leftBounds.length === 4 ? layer.leftBounds : [ 0.0, 0.0, 0.5, 1.0 ];
				rightBounds = layer.rightBounds !== null && layer.rightBounds.length === 4 ? layer.rightBounds : [ 0.5, 0.0, 0.5, 1.0 ];

			}

			if ( !wasPresenting ) {

				rendererPixelRatio = renderer.getPixelRatio();
				rendererSize = renderer.getSize();

				renderer.setPixelRatio( 1 );
				renderer.setSize( eyeWidth * 2, eyeHeight, false );

			}

		} else if ( wasPresenting ) {

			renderer.setPixelRatio( rendererPixelRatio );
			renderer.setSize( rendererSize.width, rendererSize.height, rendererUpdateStyle );

		}

	}

	window.addEventListener( 'vrdisplaypresentchange', onFullscreenChange, false );

	this.setFullScreen = function ( boolean ) {

		return new Promise( function ( resolve, reject ) {

			if ( vrDisplay === undefined ) {

				reject( new Error( 'No VR hardware found.' ) );
				return;

			}

			if ( scope.isPresenting === boolean ) {

				resolve();
				return;

			}

			if ( boolean ) {

				resolve( vrDisplay.requestPresent( [ { source: canvas } ] ) );

			} else {

				resolve( vrDisplay.exitPresent() );

			}

		} );

	};

	this.requestPresent = function () {

		return this.setFullScreen( true );

	};

	this.exitPresent = function () {

		return this.setFullScreen( false );

	};

	this.requestAnimationFrame = function ( f ) {

		if ( vrDisplay !== undefined ) {

			return vrDisplay.requestAnimationFrame( f );

		} else {

			return window.requestAnimationFrame( f );

		}

	};

	this.cancelAnimationFrame = function ( h ) {

		if ( vrDisplay !== undefined ) {

			vrDisplay.cancelAnimationFrame( h );

		} else {

			window.cancelAnimationFrame( h );

		}

	};

	this.submitFrame = function () {

		if ( vrDisplay !== undefined && scope.isPresenting ) {

			vrDisplay.submitFrame();

		}

	};

	this.autoSubmitFrame = true;

	// render

	var cameraL = new THREE.PerspectiveCamera();
	cameraL.layers.enable( 1 );

	var cameraR = new THREE.PerspectiveCamera();
	cameraR.layers.enable( 2 );

	this.render = function ( scene, camera, renderTarget, forceClear ) {

		if ( vrDisplay && scope.isPresenting ) {

			var autoUpdate = scene.autoUpdate;

			if ( autoUpdate ) {

				scene.updateMatrixWorld();
				scene.autoUpdate = false;

			}

			var eyeParamsL = vrDisplay.getEyeParameters( 'left' );
			var eyeParamsR = vrDisplay.getEyeParameters( 'right' );

			eyeTranslationL.fromArray( eyeParamsL.offset );
			eyeTranslationR.fromArray( eyeParamsR.offset );

			if ( Array.isArray( scene ) ) {

				console.warn( 'THREE.VREffect.render() no longer supports arrays. Use object.layers instead.' );
				scene = scene[ 0 ];

			}

			// When rendering we don't care what the recommended size is, only what the actual size
			// of the backbuffer is.
			var size = renderer.getSize();
			renderRectL = {
				x: Math.round( size.width * leftBounds[ 0 ] ),
				y: Math.round( size.height * leftBounds[ 1 ] ),
				width: Math.round( size.width * leftBounds[ 2 ] ),
				height:  Math.round(size.height * leftBounds[ 3 ] )
			};
			renderRectR = {
				x: Math.round( size.width * rightBounds[ 0 ] ),
				y: Math.round( size.height * rightBounds[ 1 ] ),
				width: Math.round( size.width * rightBounds[ 2 ] ),
				height:  Math.round(size.height * rightBounds[ 3 ] )
			};

			if ( renderTarget ) {

				renderer.setRenderTarget( renderTarget );
				renderTarget.scissorTest = true;

			} else  {

				renderer.setRenderTarget( null );
				renderer.setScissorTest( true );

			}

			if ( renderer.autoClear || forceClear ) renderer.clear();

			if ( camera.parent === null ) camera.updateMatrixWorld();

			camera.matrixWorld.decompose( cameraL.position, cameraL.quaternion, cameraL.scale );
			camera.matrixWorld.decompose( cameraR.position, cameraR.quaternion, cameraR.scale );

			var scale = this.scale;
			cameraL.translateOnAxis( eyeTranslationL, scale );
			cameraR.translateOnAxis( eyeTranslationR, scale );

			if ( vrDisplay.getFrameData ) {

				vrDisplay.depthNear = camera.near;
				vrDisplay.depthFar = camera.far;

				vrDisplay.getFrameData( frameData );

				cameraL.projectionMatrix.elements = frameData.leftProjectionMatrix;
				cameraR.projectionMatrix.elements = frameData.rightProjectionMatrix;

			} else {

				cameraL.projectionMatrix = fovToProjection( eyeParamsL.fieldOfView, true, camera.near, camera.far );
				cameraR.projectionMatrix = fovToProjection( eyeParamsR.fieldOfView, true, camera.near, camera.far );

				
			}

			// render left eye
			if ( renderTarget ) {

				renderTarget.viewport.set( renderRectL.x, renderRectL.y, renderRectL.width, renderRectL.height );
				renderTarget.scissor.set( renderRectL.x, renderRectL.y, renderRectL.width, renderRectL.height );

			} else {

				renderer.setViewport( renderRectL.x, renderRectL.y, renderRectL.width, renderRectL.height );
				renderer.setScissor( renderRectL.x, renderRectL.y, renderRectL.width, renderRectL.height );

			}
			renderer.render( scene, cameraL, renderTarget, forceClear );

			// render right eye
			if ( renderTarget ) {

				renderTarget.viewport.set( renderRectR.x, renderRectR.y, renderRectR.width, renderRectR.height );
				renderTarget.scissor.set( renderRectR.x, renderRectR.y, renderRectR.width, renderRectR.height );

			} else {

				renderer.setViewport( renderRectR.x, renderRectR.y, renderRectR.width, renderRectR.height );
				renderer.setScissor( renderRectR.x, renderRectR.y, renderRectR.width, renderRectR.height );

			}
			renderer.render( scene, cameraR, renderTarget, forceClear );

			if ( renderTarget ) {

				renderTarget.viewport.set( 0, 0, size.width, size.height );
				renderTarget.scissor.set( 0, 0, size.width, size.height );
				renderTarget.scissorTest = false;
				renderer.setRenderTarget( null );

			} else {

				renderer.setScissorTest( false );

			}

			if ( autoUpdate ) {

				scene.autoUpdate = true;

			}

			if ( scope.autoSubmitFrame ) {

				scope.submitFrame();

			}

			return;

		}

		// Regular render mode if not HMD

		renderer.render( scene, camera, renderTarget, forceClear );

	};

	//

	function fovToNDCScaleOffset( fov ) {

		var pxscale = 2.0 / ( fov.leftTan + fov.rightTan );
		var pxoffset = ( fov.leftTan - fov.rightTan ) * pxscale * 0.5;
		var pyscale = 2.0 / ( fov.upTan + fov.downTan );
		var pyoffset = ( fov.upTan - fov.downTan ) * pyscale * 0.5;
		return { scale: [ pxscale, pyscale ], offset: [ pxoffset, pyoffset ] };

	}

	function fovPortToProjection( fov, rightHanded, zNear, zFar ) {

		rightHanded = rightHanded === undefined ? true : rightHanded;
		zNear = zNear === undefined ? 0.01 : zNear;
		zFar = zFar === undefined ? 10000.0 : zFar;

		var handednessScale = rightHanded ? - 1.0 : 1.0;

		// start with an identity matrix
		var mobj = new THREE.Matrix4();
		var m = mobj.elements;

		// and with scale/offset info for normalized device coords
		var scaleAndOffset = fovToNDCScaleOffset( fov );

		// X result, map clip edges to [-w,+w]
		m[ 0 * 4 + 0 ] = scaleAndOffset.scale[ 0 ];
		m[ 0 * 4 + 1 ] = 0.0;
		m[ 0 * 4 + 2 ] = scaleAndOffset.offset[ 0 ] * handednessScale;
		m[ 0 * 4 + 3 ] = 0.0;

		// Y result, map clip edges to [-w,+w]
		// Y offset is negated because this proj matrix transforms from world coords with Y=up,
		// but the NDC scaling has Y=down (thanks D3D?)
		m[ 1 * 4 + 0 ] = 0.0;
		m[ 1 * 4 + 1 ] = scaleAndOffset.scale[ 1 ];
		m[ 1 * 4 + 2 ] = - scaleAndOffset.offset[ 1 ] * handednessScale;
		m[ 1 * 4 + 3 ] = 0.0;

		// Z result (up to the app)
		m[ 2 * 4 + 0 ] = 0.0;
		m[ 2 * 4 + 1 ] = 0.0;
		m[ 2 * 4 + 2 ] = zFar / ( zNear - zFar ) * - handednessScale;
		m[ 2 * 4 + 3 ] = ( zFar * zNear ) / ( zNear - zFar );

		// W result (= Z in)
		m[ 3 * 4 + 0 ] = 0.0;
		m[ 3 * 4 + 1 ] = 0.0;
		m[ 3 * 4 + 2 ] = handednessScale;
		m[ 3 * 4 + 3 ] = 0.0;

		mobj.transpose();

		return mobj;

	}

	function fovToProjection( fov, rightHanded, zNear, zFar ) {

		var DEG2RAD = Math.PI / 180.0;

		var fovPort = {
			upTan: Math.tan( fov.upDegrees * DEG2RAD ),
			downTan: Math.tan( fov.downDegrees * DEG2RAD ),
			leftTan: Math.tan( fov.leftDegrees * DEG2RAD ),
			rightTan: Math.tan( fov.rightDegrees * DEG2RAD )
		};

		return fovPortToProjection( fovPort, rightHanded, zNear, zFar );

	}

};

//# sourceMappingURL=dependencies.concat.js.map