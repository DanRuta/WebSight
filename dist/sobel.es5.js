"use strict";

var degToRad = function degToRad(x) {
    return x * Math.PI / 180;
};

window.addEventListener("load", function () {

    window.video = document.createElement("video");
    video.autoplay = true;

    video.width = window.innerWidth / 2;
    video.height = window.innerHeight / 2;

    var fov = 70;
    var boxWidth = video.width;
    var boxHeight = video.height;

    // Renderer and VR stuff
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.backgroundColor = "black";

    var effect = new THREE.VREffect(renderer);
    effect.separation = 0;
    effect.setSize(window.innerWidth, window.innerHeight);

    var vrDisplay = void 0;

    if (navigator.getVRDisplays) {
        navigator.getVRDisplays().then(function (displays) {
            return displays.length && (vrDisplay = displays[0]);
        });
    }

    // Button to enable VR mode
    var vrButton = VRSamplesUtil.addButton("Enter VR", "E", "/images/cardboard64.png", function () {

        if (navigator.userAgent.includes("Mobile VR")) {
            vrDisplay.requestPresent([{ source: renderer.domElement }]);
        } else {
            effect = new THREE.StereoEffect(renderer);
            effect.separation = 0;
            effect.setSize(window.innerWidth, window.innerHeight);
            document.getElementById("vr-sample-button-container").style.display = "none";
        }
    });

    // Scenes and camera
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 0.5 * boxWidth * Math.atan(degToRad(90 - fov / 2)) + 100;
    scene.add(camera);

    // Box object
    var boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, 1);
    var texture = new THREE.Texture(video);
    texture.minFilter = THREE.NearestFilter;

    var boxMaterial = new THREE.ShaderMaterial({
        uniforms: {
            texture: {
                type: "t",
                value: texture
            },
            width: {
                type: "f",
                value: video.width
            },
            height: {
                type: "f",
                value: video.height
            }
        },
        vertexShader: vertexShaderSource.text,
        fragmentShader: fragmentShaderSource.text
    });
    var box = new THREE.Mesh(boxGeometry, boxMaterial);
    scene.add(box);

    // Render loop
    var render = function render() {
        requestAnimationFrame(render);

        if (video.currentTime) {
            texture.needsUpdate = true;
        }

        effect.render(scene, camera);
    };
    render();

    // Do fullscreen + prevent the display from going to sleep when tapped
    if (!window.location.href.includes("localhost")) {

        renderer.domElement.addEventListener("click", function () {
            document.fullscreenEnabled && renderer.domElement.requestFullScreen() || document.webkitFullscreenEnabled && renderer.domElement.webkitRequestFullScreen() || document.mozFullScreenEnabled && renderer.domElement.mozRequestFullScreen() || document.msFullScreenEnabled && renderer.domElement.msRequestFullScreen();
        });
    }

    // Resizing
    window.addEventListener("resize", function () {
        effect.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    // Start camera capture
    try {
        var mediaDevicesSupport = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

        if (mediaDevicesSupport) {

            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (stream) {
                video.src = window.URL.createObjectURL(stream);
                video.play();
            }).catch(function (err) {
                console.log(err);
                alert("There was an error accessing the camera. Please try again and ensure you are using https");
            });
        } else {

            var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

            if (getUserMedia) {
                getUserMedia({ video: { facingMode: "environment" } }, function (stream) {
                    video.src = window.URL.createObjectURL(stream);
                    video.play();
                }, function (err) {
                    console.log(err);
                    alert("There was an error accessing the camera. Please try again and ensure you are using https.");
                });
            } else {
                alert("Camera not available");
            }
        }
    } catch (e) {
        alert("Error getting camera feed. Please ensure you are using https.");
    }
});
