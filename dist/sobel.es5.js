"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
        fragmentShader: Filters.sobel5x5
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

    // =======
    //  Temporary, until the UI is implemented
    // =======
    window.updateTo = function (shader) {
        boxMaterial.fragmentShader = Filters[shader];
        boxMaterial.needsUpdate = true;
    };
    // =======
});
"use strict";

var Filters = function () {
    function Filters() {
        _classCallCheck(this, Filters);
    }

    _createClass(Filters, null, [{
        key: "inverted",
        get: function get() {
            return "\n            uniform sampler2D texture;\n            varying vec2 vUv;\n\n            void main() {\n                vec4 pixel = texture2D(texture, vUv);\n                gl_FragColor = vec4( 1.0 - pixel.r, 1.0 - pixel.g, 1.0 - pixel.b, 1.0 );\n            }\n        ";
        }
    }, {
        key: "invertedCircle",
        get: function get() {
            return "\n            uniform sampler2D texture;\n            varying vec2 vUv;\n\n            void main() {\n                vec4 pixel = texture2D(texture, vUv);\n\n                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < 0.4) {\n                    gl_FragColor = vec4( 1.0 - pixel.r, 1.0 - pixel.g, 1.0 - pixel.b, 1.0 );\n\n                } else {\n                    gl_FragColor = vec4(pixel.r, pixel.g, pixel.b, 1.0);\n                }\n            }\n        ";
        }
    }, {
        key: "sobel8020",
        get: function get() {
            return "\n            uniform sampler2D texture;\n            uniform float width;\n            uniform float height;\n            varying vec2 vUv;\n\n            void main() {\n                float w = 1.0 / width;\n                float h = 1.0 / height;\n                vec4 n[9];\n                vec4 pixel = texture2D(texture, vUv);\n\n                for (int i=-1; i<=1; i++) {\n                    for (int j=-1; j<=1; j++) {\n                        n[(j+1)+(i+1)*3] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );\n                    }\n                }\n\n                vec4 sobel_x = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);\n                vec4 sobel_y = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);\n                float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;\n                float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;\n                sobel_x.r = pixel.r*0.8 + avg_x;\n                sobel_x.g = pixel.g*0.8 + avg_x;\n                sobel_x.b = pixel.b*0.8 + avg_x;\n                sobel_y.r = pixel.r*0.8 + avg_y;\n                sobel_y.g = pixel.g*0.8 + avg_y;\n                sobel_y.b = pixel.b*0.8 + avg_y;\n                gl_FragColor = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );\n            }\n        ";
        }
    }, {
        key: "sobelCircle",
        get: function get() {
            return "\n            uniform sampler2D texture;\n            uniform float width;\n            uniform float height;\n            varying vec2 vUv;\n\n            void main() {\n\n                float w = 1.0 / width;\n                float h = 1.0 / height;\n                vec4 n[9];\n\n                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < 0.4) {\n\n                    for (int i=-1; i<=1; i++) {\n                        for (int j=-1; j<=1; j++) {\n                            n[(j+1)+(i+1)*3] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );\n                        }\n                    }\n\n                    vec4 sobel_x = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);\n                    vec4 sobel_y = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);\n\n                    float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;\n                    float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;\n                    sobel_x.r = avg_x;\n                    sobel_x.g = avg_x;\n                    sobel_x.b = avg_x;\n                    sobel_y.r = avg_y;\n                    sobel_y.g = avg_y;\n                    sobel_y.b = avg_y;\n\n                    gl_FragColor = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );\n                } else {\n                    vec4 pixel = texture2D(texture, vUv);\n                    gl_FragColor = vec4(pixel.r, pixel.g, pixel.b, 1.0);\n                }\n            }\n        ";
        }
    }, {
        key: "sobelCircle8020",
        get: function get() {
            return "\n            uniform sampler2D texture;\n            uniform float width;\n            uniform float height;\n            varying vec2 vUv;\n\n            void main() {\n\n                float w = 1.0 / width;\n                float h = 1.0 / height;\n                vec4 n[9];\n\n                vec4 pixel = texture2D(texture, vUv);\n\n                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < 0.4) {\n\n                    for (int i=-1; i<=1; i++) {\n                        for (int j=-1; j<=1; j++) {\n                            n[(j+1)+(i+1)*3] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );\n                        }\n                    }\n\n                    vec4 sobel_x = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);\n                    vec4 sobel_y = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);\n\n                    float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;\n                    float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;\n\n                    sobel_x.r = pixel.r*0.8 + avg_x;\n                    sobel_x.g = pixel.g*0.8 + avg_x;\n                    sobel_x.b = pixel.b*0.8 + avg_x;\n                    sobel_y.r = pixel.r*0.8 + avg_y;\n                    sobel_y.g = pixel.g*0.8 + avg_y;\n                    sobel_y.b = pixel.b*0.8 + avg_y;\n\n                    gl_FragColor = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );\n                } else {\n                    vec4 pixel = texture2D(texture, vUv);\n                    gl_FragColor = vec4(pixel.r, pixel.g, pixel.b, 1.0);\n                }\n            }\n        ";
        }

        /*
        1   0   -1
        2   0   -2
        1   0   -1
        */

    }, {
        key: "sobel",
        get: function get() {
            return "\n            uniform sampler2D texture;\n            uniform float width;\n            uniform float height;\n            varying vec2 vUv;\n\n            void main() {\n                float w = 1.0 / width;\n                float h = 1.0 / height;\n                vec4 n[9];\n                for (int i=-1; i<=1; i++) {\n                    for (int j=-1; j<=1; j++) {\n                        n[(j+1)+(i+1)*3] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );\n                    }\n                }\n                vec4 sobel_x = n[2] + 2.0*n[5] + n[8] - (n[0] + 2.0*n[3] + n[6]);\n                vec4 sobel_y = n[0] + 2.0*n[1] + n[2] - (n[6] + 2.0*n[7] + n[8]);\n\n                float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;\n                float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;\n                sobel_x.r = avg_x;\n                sobel_x.g = avg_x;\n                sobel_x.b = avg_x;\n                sobel_y.r = avg_y;\n                sobel_y.g = avg_y;\n                sobel_y.b = avg_y;\n                gl_FragColor = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );\n            }\n        ";
        }

        /*
        2   1   0   -1  -2
        3   2   0   -2  -3
        4   3   0   -3  -4
        3   2   0   -2  -3
        2   1   0   -1  -2
        */

    }, {
        key: "sobel5x5",
        get: function get() {
            return "\n            uniform sampler2D texture;\n            uniform float width;\n            uniform float height;\n            varying vec2 vUv;\n\n            void main() {\n                float w = 1.0 / width;\n                float h = 1.0 / height;\n                vec4 n[25];\n\n                for (int i=-2; i<=2; i++) {\n                    for (int j=-2; j<=2; j++) {\n                        n[(j+2)+(i+2)*5] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );\n                    }\n                }\n\n                vec4 sobel_x = 2.0*n[4] + 3.0*n[9] + 4.0*n[14] + 3.0*n[19] + 2.0*n[24] +\n                               n[3] + 2.0*n[8] + 3.0*n[13] + 2.0*n[18] + n[23] -\n                               (2.0*n[0] + 3.0*n[5] + 4.0*n[10] + 3.0*n[15] + 2.0*n[20] +\n                               n[1] + 2.0*n[6] + 3.0*n[11] + 2.0*n[16] + n[21]);\n\n                vec4 sobel_y = 2.0*n[0] + n[1] + n[3] + n[4] +\n                               3.0*n[5] + 2.0*n[6] + 2.0*n[8] + 3.0*n[9] -\n                               (3.0*n[15] + 2.0*n[16] + 2.0*n[18] + 3.0*n[19] +\n                                2.0*n[20] + n[21] + n[23] + n[24]);\n\n                float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;\n                float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;\n                sobel_x.r = avg_x;\n                sobel_x.g = avg_x;\n                sobel_x.b = avg_x;\n                sobel_y.r = avg_y;\n                sobel_y.g = avg_y;\n                sobel_y.b = avg_y;\n                gl_FragColor = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );\n            }\n        ";
        }
    }]);

    return Filters;
}();
//# sourceMappingURL=sobel.concat.js.map
