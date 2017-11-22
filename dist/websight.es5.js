"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var degToRad = function degToRad(x) {
    return x * Math.PI / 180;
};

window.addEventListener("load", function () {
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
    enterVRButton.addEventListener("click", function () {
        var controls = document.getElementById("controls");

        if (enterVRButton.classList.contains("small")) {
            closeVR();
            enterVRButton.classList.remove("small");
            controls.classList.remove("hidden");
        } else {
            if (navigator.userAgent.includes("Mobile VR")) {
                vrDisplay.requestPresent([{ source: renderer.domElement }]);
            } else {
                effect = new THREE.StereoEffect(renderer);
                effect.separation = 0;
                effect.setSize(window.innerWidth, window.innerHeight);
            }

            // Shrink VR button
            enterVRButton.classList.add("small");

            // Hide controls
            controls.classList.add("hidden");
        }
    });

    var closeVR = function closeVR() {
        effect = new THREE.VREffect(renderer);
        effect.separation = 0;
        effect.setSize(window.innerWidth, window.innerHeight);
    };

    // Scenes and camera
    var fov = 70;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000);
    scene.add(camera);

    // Box object
    var texture = void 0;
    var boxMaterial = void 0;
    var box = void 0;

    var makeBoxObject = function makeBoxObject() {
        window.video = document.createElement("video");
        video.autoplay = true;
        video.width = window.innerWidth / 2;
        video.height = window.innerHeight / 2;
        getVideoFeed();

        var boxWidth = video.width;
        var boxHeight = video.height;

        var boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, 1);
        texture = new THREE.Texture(video);
        texture.minFilter = THREE.NearestFilter;

        boxMaterial = new THREE.ShaderMaterial({
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
                },
                radius: {
                    type: "f",
                    value: 0.4
                },
                intensity: {
                    type: "f",
                    value: 1.0
                },
                edgeR: {
                    type: "f",
                    value: 1.0
                },
                edgeG: {
                    type: "f",
                    value: 1.0
                },
                edgeB: {
                    type: "f",
                    value: 1.0
                },
                surfaceR: {
                    type: "f",
                    value: 0.0
                },
                surfaceG: {
                    type: "f",
                    value: 0.0
                },
                surfaceB: {
                    type: "f",
                    value: 0.0
                },
                lightCols: {
                    type: "t",
                    value: [].concat(_toConsumableArray(new Array(25))).map(function (v) {
                        return Math.floor(Math.random() * 10 * video.width / 60);
                    })
                },
                lightColsEnds: {
                    type: "t",
                    value: [].concat(_toConsumableArray(new Array(60))).map(function (v) {
                        return Math.floor(Math.random() * 10 * video.height / 50);
                    })
                }
            },
            vertexShader: vertexShaderSource.text,
            fragmentShader: Filters.compileShader("sobel3x3")
        });

        box = new THREE.Mesh(boxGeometry, boxMaterial);
        scene.add(box);

        camera.position.z = 0.5 * boxWidth * Math.atan(degToRad(90 - fov / 2)) + 100;
    };

    var getVideoFeedAttempts = 0;

    var getVideoFeed = function getVideoFeed() {
        try {
            var mediaDevicesSupport = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

            if (mediaDevicesSupport) {
                navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (stream) {
                    video.src = window.URL.createObjectURL(stream);
                }).catch(function (err) {
                    console.log(err);
                    getVideoFeedAttempts++;

                    // Rarely, getting the camera fails. Re-attempting usually works, on refresh.
                    if (getVideoFeedAttempts < 3) {
                        getVideoFeed();
                    } else {
                        alert("There was an error accessing the camera. Please try again and ensure you are using https");
                    }
                });
            } else {
                var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

                if (getUserMedia) {
                    getUserMedia({ video: { facingMode: "environment" } }, function (stream) {
                        video.src = window.URL.createObjectURL(stream);
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
    };

    makeBoxObject();

    // Render loop
    var render = function render() {
        requestAnimationFrame(render);

        if (video.currentTime) {
            texture.needsUpdate = true;
        }

        if (Filters.matrix) {
            boxMaterial.uniforms.lightColsEnds.value = boxMaterial.uniforms.lightColsEnds.value.map(function (v) {
                return v -= Math.random() / 2;
            });
        }

        effect.render(scene, camera);
    };
    render();

    // Request fullscreen when tapped
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
        scene.remove(box);
        video.pause();
        makeBoxObject();

        setShader(document.querySelector(".filter-button:disabled").dataset.filter);
        setIntensity((parseFloat(document.getElementById("intensity-slider").value) || 0.01) / 100);
        setRadius(parseFloat(document.getElementById("radius-slider").value) / 100);
    });

    window.setShader = function (shader) {
        Filters.shader = shader;
        boxMaterial.fragmentShader = Filters.compileShader(shader);
        boxMaterial.needsUpdate = true;
    };

    window.setRadius = function (val) {
        boxMaterial.uniforms.radius.value = val;
    };

    window.setIntensity = function (val) {
        boxMaterial.uniforms.intensity.value = 1 - val;
    };

    window.toggleInverted = function () {
        Filters.isInverted = !Filters.isInverted;
        boxMaterial.fragmentShader = Filters.compileShader(Filters.shader);
        boxMaterial.needsUpdate = true;
    };

    window.setEdgeColour = function (_ref) {
        var _ref$r = _ref.r,
            r = _ref$r === undefined ? 0 : _ref$r,
            _ref$g = _ref.g,
            g = _ref$g === undefined ? 0 : _ref$g,
            _ref$b = _ref.b,
            b = _ref$b === undefined ? 0 : _ref$b;

        boxMaterial.uniforms.edgeR.value = r / 255;
        boxMaterial.uniforms.edgeG.value = g / 255;
        boxMaterial.uniforms.edgeB.value = b / 255;
    };

    // For reverting to, when toggling back to colour, from background
    var surfaceCache = { r: 0, g: 0, b: 0 };

    window.setSurfaceColour = function (_ref2) {
        var _ref2$r = _ref2.r,
            r = _ref2$r === undefined ? 0 : _ref2$r,
            _ref2$g = _ref2.g,
            g = _ref2$g === undefined ? 0 : _ref2$g,
            _ref2$b = _ref2.b,
            b = _ref2$b === undefined ? 0 : _ref2$b;

        boxMaterial.uniforms.surfaceR.value = surfaceCache.r = r / 255;
        boxMaterial.uniforms.surfaceG.value = surfaceCache.g = g / 255;
        boxMaterial.uniforms.surfaceB.value = surfaceCache.b = b / 255;
    };

    window.toggleReducedColours = function () {
        Filters.hasReducedColours = !Filters.hasReducedColours;
        boxMaterial.fragmentShader = Filters.compileShader(Filters.shader);
        boxMaterial.needsUpdate = true;
    };

    window.toggleBackground = function (isBackground) {

        Filters.hasBackground = !!isBackground;

        if (Filters.hasBackground) {
            boxMaterial.uniforms.surfaceR.value = 0;
            boxMaterial.uniforms.surfaceG.value = 0;
            boxMaterial.uniforms.surfaceB.value = 0;
        } else {
            boxMaterial.uniforms.surfaceR.value = surfaceCache.r;
            boxMaterial.uniforms.surfaceG.value = surfaceCache.g;
            boxMaterial.uniforms.surfaceB.value = surfaceCache.b;
        }

        boxMaterial.fragmentShader = Filters.compileShader(Filters.shader);
        boxMaterial.needsUpdate = true;
    };

    window.toggleMatrix = function () {

        Filters.matrix = true;

        clearInterval(Filters.matrixInterval);

        toggleBackground(false);
        setEdgeColour({ r: 0, g: 255, b: 0 });
        setIntensity(1);
        setRadius(1);

        boxMaterial.fragmentShader = Filters.compileShader("matrix");
        boxMaterial.needsUpdate = true;

        Filters.matrixInterval = setInterval(function () {

            for (var i = 0; i < boxMaterial.uniforms.lightColsEnds.value.length; i++) {
                if (boxMaterial.uniforms.lightColsEnds.value[i] < 0) {
                    boxMaterial.uniforms.lightCols.value[i] = Math.floor(Math.random() * 10 * video.width / 50);
                    boxMaterial.uniforms.lightColsEnds.value[i] = video.height / 5;
                }
            }
        }, 100);
    };
});

"use strict";

var Filters = function () {
    function Filters() {
        _classCallCheck(this, Filters);
    }

    _createClass(Filters, null, [{
        key: "compileShader",
        value: function compileShader(name) {
            return "\n            uniform sampler2D texture;\n            uniform float width;\n            uniform float height;\n            uniform float radius;\n            uniform float intensity;\n            uniform vec2 resolution;\n            varying vec2 vUv;\n\n            uniform float edgeR;\n            uniform float edgeG;\n            uniform float edgeB;\n\n            uniform float surfaceR;\n            uniform float surfaceG;\n            uniform float surfaceB;\n\n            uniform float lightCols[5];\n            uniform float lightColsEnds[5];\n\n            float rand(vec2 co){\n                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n            }\n\n            void main() {\n\n                float w = 1.0 / width;\n                float h = 1.0 / height;\n\n                vec4 pixel = texture2D(texture, vUv);\n\n                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < radius) {\n\n                    " + this[name + "Body"] + "\n\n                    gl_FragColor = newColour*(1.0-intensity) + pixel*intensity;\n\n                    " + (this.hasBackground ? this.addBackground : "") + "\n\n                    " + (this.hasReducedColours ? this.reducedColoursBody : "") + "\n\n                    " + (this.isInverted ? this.invertedBody : "") + "\n\n                } else {\n                    gl_FragColor = vec4(pixel.rgb, 1.0);\n                }\n\n            }\n        ";
        }
    }, {
        key: "availableFilters",
        get: function get() {
            return ["No effect", "Sobel 3x3", "Sobel 5x5", "Frei-Chen"];
        }
    }, {
        key: "noeffectBody",
        get: function get() {
            return "vec4 newColour = vec4(pixel.rgb, 1.0);";
        }
    }, {
        key: "invertedBody",
        get: function get() {
            return "\n            gl_FragColor.rgb = 1.0 - gl_FragColor.rgb;\n        ";
        }
    }, {
        key: "reducedColoursBody",
        get: function get() {
            return "\n            gl_FragColor.r = float(floor(gl_FragColor.r * 5.0 ) / 5.0);\n            gl_FragColor.g = float(floor(gl_FragColor.g * 5.0 ) / 5.0);\n            gl_FragColor.b = float(floor(gl_FragColor.b * 5.0 ) / 5.0);\n        ";
        }
    }, {
        key: "addBackground",
        get: function get() {
            return "\n            gl_FragColor.r += pixel.r * 0.9;\n            gl_FragColor.g += pixel.g * 0.9;\n            gl_FragColor.b += pixel.b * 0.9;\n        ";
        }

        /*
        1   0   -1
        2   0   -2
        1   0   -1
        */

    }, {
        key: "sobel3x3Body",
        get: function get() {
            return "\n            vec4 n[9];\n\n            for (int i=-1; i<=1; i++) {\n                for (int j=-1; j<=1; j++) {\n                    n[(j+1)+(i+1)*3] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );\n                }\n            }\n\n            vec4 sobel_x = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);\n            vec4 sobel_y = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);\n\n            float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;\n            float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;\n\n            sobel_x.r = avg_x;\n            sobel_x.g = avg_x;\n            sobel_x.b = avg_x;\n            sobel_y.r = avg_y;\n            sobel_y.g = avg_y;\n            sobel_y.b = avg_y;\n\n            vec3 sobel = vec3(sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)));\n            sobel.r = surfaceR * (1.0 - sobel.r) + sobel.r * edgeR;\n            sobel.g = surfaceG * (1.0 - sobel.g) + sobel.g * edgeG;\n            sobel.b = surfaceB * (1.0 - sobel.b) + sobel.b * edgeB;\n\n            vec4 newColour = vec4( sobel, 1.0 );\n        ";
        }

        /*
        2   1   0   -1  -2
        3   2   0   -2  -3
        4   3   0   -3  -4
        3   2   0   -2  -3
        2   1   0   -1  -2
        */

    }, {
        key: "sobel5x5Body",
        get: function get() {
            return "\n            vec4 n[25];\n\n            for (int i=-2; i<=2; i++) {\n                for (int j=-2; j<=2; j++) {\n                    n[(j+2)+(i+2)*5] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );\n                }\n            }\n\n            vec4 sobel_x = 2.0*n[4] + 3.0*n[9] + 4.0*n[14] + 3.0*n[19] + 2.0*n[24] +\n                           n[3] + 2.0*n[8] + 3.0*n[13] + 2.0*n[18] + n[23] -\n                           (2.0*n[0] + 3.0*n[5] + 4.0*n[10] + 3.0*n[15] + 2.0*n[20] +\n                           n[1] + 2.0*n[6] + 3.0*n[11] + 2.0*n[16] + n[21]);\n\n            vec4 sobel_y = 2.0*n[0] + n[1] + n[3] + n[4] +\n                           3.0*n[5] + 2.0*n[6] + 2.0*n[8] + 3.0*n[9] -\n                           (3.0*n[15] + 2.0*n[16] + 2.0*n[18] + 3.0*n[19] +\n                            2.0*n[20] + n[21] + n[23] + n[24]);\n\n            float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0 / 9.0;\n            float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0 / 9.0;\n\n            sobel_x.r = avg_x;\n            sobel_x.g = avg_x;\n            sobel_x.b = avg_x;\n            sobel_y.r = avg_y;\n            sobel_y.g = avg_y;\n            sobel_y.b = avg_y;\n\n            vec3 sobel = vec3(sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)));\n            sobel.r = surfaceR * (1.0 - sobel.r) + sobel.r * edgeR;\n            sobel.g = surfaceG * (1.0 - sobel.g) + sobel.g * edgeG;\n            sobel.b = surfaceB * (1.0 - sobel.b) + sobel.b * edgeB;\n\n            vec4 newColour = vec4(sobel, 1.0 );\n        ";
        }
    }, {
        key: "freichenBody",
        get: function get() {
            return "\n\n            vec2 texel = vec2(1.0 / width, 1.0 / height);\n            mat3 I;\n            mat3 G[9];\n            float cnv[9];\n\n            G[0] = mat3( 0.3535533845424652, 0, -0.3535533845424652, 0.5, 0, -0.5, 0.3535533845424652, 0, -0.3535533845424652 );\n            G[1] = mat3( 0.3535533845424652, 0.5, 0.3535533845424652, 0, 0, 0, -0.3535533845424652, -0.5, -0.3535533845424652 );\n            G[2] = mat3( 0, 0.3535533845424652, -0.5, -0.3535533845424652, 0, 0.3535533845424652, 0.5, -0.3535533845424652, 0 );\n            G[3] = mat3( 0.5, -0.3535533845424652, 0, -0.3535533845424652, 0, 0.3535533845424652, 0, 0.3535533845424652, -0.5 );\n            G[4] = mat3( 0, -0.5, 0, 0.5, 0, 0.5, 0, -0.5, 0 );\n            G[5] = mat3( -0.5, 0, 0.5, 0, 0, 0, 0.5, 0, -0.5 );\n            G[6] = mat3( 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.6666666865348816, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204 );\n            G[7] = mat3( -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, 0.6666666865348816, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408 );\n            G[8] = mat3( 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408 );\n\n            // Get intensity\n            I[0][0] = length(texture2D(texture, vUv + texel * vec2(-1.0,-1.0) ).rgb);\n            I[0][1] = length(texture2D(texture, vUv + texel * vec2(-1.0,0.0) ).rgb);\n            I[0][2] = length(texture2D(texture, vUv + texel * vec2(-1.0,1.0) ).rgb);\n            I[1][0] = length(texture2D(texture, vUv + texel * vec2(0.0,-1.0) ).rgb);\n            I[1][1] = length(texture2D(texture, vUv + texel * vec2(0.0,0.0) ).rgb);\n            I[1][2] = length(texture2D(texture, vUv + texel * vec2(0.0,1.0) ).rgb);\n            I[2][0] = length(texture2D(texture, vUv + texel * vec2(1.0,-1.0) ).rgb);\n            I[2][1] = length(texture2D(texture, vUv + texel * vec2(1.0,0.0) ).rgb);\n            I[2][2] = length(texture2D(texture, vUv + texel * vec2(1.0,1.0) ).rgb);\n\n            // Convolve\n            cnv[0] = pow(dot(G[0][0], I[0]) + dot(G[0][1], I[1]) + dot(G[0][2], I[2]) , 2.0);\n            cnv[1] = pow(dot(G[1][0], I[0]) + dot(G[1][1], I[1]) + dot(G[1][2], I[2]) , 2.0);\n            cnv[2] = pow(dot(G[2][0], I[0]) + dot(G[2][1], I[1]) + dot(G[2][2], I[2]) , 2.0);\n            cnv[3] = pow(dot(G[3][0], I[0]) + dot(G[3][1], I[1]) + dot(G[3][2], I[2]) , 2.0);\n            cnv[4] = pow(dot(G[4][0], I[0]) + dot(G[4][1], I[1]) + dot(G[4][2], I[2]) , 2.0);\n            cnv[5] = pow(dot(G[5][0], I[0]) + dot(G[5][1], I[1]) + dot(G[5][2], I[2]) , 2.0);\n            cnv[6] = pow(dot(G[6][0], I[0]) + dot(G[6][1], I[1]) + dot(G[6][2], I[2]) , 2.0);\n            cnv[7] = pow(dot(G[7][0], I[0]) + dot(G[7][1], I[1]) + dot(G[7][2], I[2]) , 2.0);\n            cnv[8] = pow(dot(G[8][0], I[0]) + dot(G[8][1], I[1]) + dot(G[8][2], I[2]) , 2.0);\n\n            float M = (cnv[0] + cnv[1]) + (cnv[2] + cnv[3]);\n            float S = (cnv[4] + cnv[5]) + (cnv[6] + cnv[7]) + (cnv[8] + M);\n\n            vec3 freiChen = vec3(sqrt(M/S)) * 2.0;\n            freiChen.r = surfaceR * (1.0 - freiChen.r) + freiChen.r * edgeR;\n            freiChen.g = surfaceG * (1.0 - freiChen.g) + freiChen.g * edgeG;\n            freiChen.b = surfaceB * (1.0 - freiChen.b) + freiChen.b * edgeB;\n\n            vec4 newColour = vec4(freiChen, 1.0 );\n        ";
        }
    }, {
        key: "matrixBody",
        get: function get() {
            // 10x10 pixel.g values for '0' and '1'
            var charData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            return "\n            float c[" + charData.length + "];\n            " + charData.map(function (d, i) {
                return "c[" + i + "]=" + d + ".0;";
            }).join("\n") + "\n\n            // ==============\n            // Edge detection\n            // ==============\n            vec4 m[9];\n\n            for (int i=-1; i<=1; i++) {\n                for (int j=-1; j<=1; j++) {\n                    m[(j+1)+(i+1)*3] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );\n                }\n            }\n\n            vec4 sobel_x = m[2] + (2.0*m[5]) + m[8] - (m[0] + (2.0*m[3]) + m[6]);\n            vec4 sobel_y = m[0] + (2.0*m[1]) + m[2] - (m[6] + (2.0*m[7]) + m[8]);\n\n            float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;\n            float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;\n\n            sobel_x.r = avg_x;\n            sobel_x.g = avg_x;\n            sobel_x.b = avg_x;\n            sobel_y.r = avg_y;\n            sobel_y.g = avg_y;\n            sobel_y.b = avg_y;\n\n            vec3 sobel = vec3(sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)));\n            sobel.g = sobel.g * edgeG;\n            // ==============\n\n\n            // ==============\n            // Get the average intensity over a 5x5 area\n            // ==============\n            vec4 n[25];\n\n            for (int i=-2; i<=2; i++) {\n                for (int j=-2; j<=2; j++) {\n                    n[(j+2)+(i+2)*5] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );\n                }\n            }\n\n            sobel_x = 2.0*n[4] + 3.0*n[9] + 4.0*n[14] + 3.0*n[19] + 2.0*n[24] +\n                       n[3] + 2.0*n[8] + 3.0*n[13] + 2.0*n[18] + n[23] -\n                       (2.0*n[0] + 3.0*n[5] + 4.0*n[10] + 3.0*n[15] + 2.0*n[20] +\n                       n[1] + 2.0*n[6] + 3.0*n[11] + 2.0*n[16] + n[21]);\n\n            sobel_y = 2.0*n[0] + n[1] + n[3] + n[4] +\n                       3.0*n[5] + 2.0*n[6] + 2.0*n[8] + 3.0*n[9] -\n                       (3.0*n[15] + 2.0*n[16] + 2.0*n[18] + 3.0*n[19] +\n                        2.0*n[20] + n[21] + n[23] + n[24]);\n\n            avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0 / 9.0;\n            avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0 / 9.0;\n\n            sobel_x.r = avg_x;\n            sobel_x.g = avg_x;\n            sobel_x.b = avg_x;\n            sobel_y.r = avg_y;\n            sobel_y.g = avg_y;\n            sobel_y.b = avg_y;\n\n            vec3 sobel5x5 = vec3(sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)));\n            float avgIntensity = sobel5x5.g;\n            // ==============\n\n\n            sobel.r = 0.0;\n            sobel.b = 0.0;\n            sobel.g = 0.25 * sobel.g;\n\n\n            float pWidth = 1.0 / width;\n            float pHeight = 1.0 / height;\n\n            // ==============\n            // Calculate highlighed columns values' intensities (looks better)\n            // ==============\n            float colIndex = floor(vUv.x*1000.0 / 10.0);\n            float rowIndex = floor(vUv.y*1000.0 / 10.0);\n\n            float colIntensity = 0.0;\n\n            for (int i=0; i<25; i++) {\n                if (lightCols[i] == colIndex) {\n                    for (int j=0; j<20; j++) {\n                        if (lightColsEnds[i] <= rowIndex) {\n                            if (lightColsEnds[i] >= rowIndex-1.0 && lightColsEnds[i] <= rowIndex+1.0 ) {\n                                colIntensity = 10.0;\n                            } else {\n                                colIntensity = 1.2 * min(max(lightColsEnds[i], 0.0) / rowIndex, 0.5);;\n                            }\n                        }\n                    }\n                }\n            }\n            // ==============\n\n            // ==============\n            // Render the characters\n            // ==============\n            float modX = floor(mod(vUv.x*1000.0, 10.0)*10.0)/10.0;\n            float modY = floor(mod( (vUv.y+colIndex*rand(vec2(colIndex, colIndex))) *1000.0, 10.0)*10.0)/10.0;\n\n            int charIX = int(modX / (10.0 / float(10)));\n            int charIY = int(modY / (10.0 / float(10)));\n\n            float x = floor(vUv.x*1000.0 / 10.0);\n            float y = floor(vUv.y*1000.0 / 10.0);\n\n            vec4 texRand = texture2D(texture, vec2(x, y));\n\n            float colour = rand(vec2(x * (texRand.r + texRand.g + texRand.b) / 3.0, y * (texRand.r + texRand.g + texRand.b) / 3.0));\n            int charSelected = int(floor(colour*2.0));\n\n            // Quite possibbly the worst hack I've ever written in my life\n            // GLSL can't take non-const values for array indeces, but it can\n            // take loop indeces, so I've got nested loops, to use THEIR indeces\n            for (int cs=0; cs<2; cs++) {\n                if (cs==charSelected) {\n                    for (int i=0; i<10; i++) {\n                        if (i==charIY) {\n                            for (int j=0; j<10; j++) {\n                                if (j==charIX) {\n                                    sobel.g += c[cs*100 + 100-10*i + j] * (avgIntensity + colIntensity + 0.05);\n                                    sobel.rb += 0.3 * c[cs*100 + 100-10*i + j] * (avgIntensity + colIntensity + 0.05);\n                                    break;\n                                }\n                            }\n                            break;\n                        }\n                    }\n                    break;\n                }\n            }\n            // ==============\n\n            vec4 newColour = vec4( sobel, 1.0 );\n        ";
        }
    }]);

    return Filters;
}();

"use strict";

window.addEventListener("load", function () {

    var filters = Filters.availableFilters;
    var initialFilter = window.localStorage.getItem("filter") || "sobel3x3";

    window.setShader(initialFilter);

    var controlsRoot = document.getElementById("controls");
    var filtersRoot = controlsRoot.getElementsByClassName("filters")[0];
    var slidersRoot = controlsRoot.getElementsByClassName("sliders")[0];

    // Create filter buttons
    var filterButtons = filters.map(function (filter) {
        var button = document.createElement("button");
        button.dataset.filter = filter.toLowerCase().replace(/\s|\-/g, "");
        button.innerText = filter;
        button.classList.add("filter-button");

        if (button.dataset.filter === initialFilter) button.disabled = true;

        filtersRoot.appendChild(button);
        return button;
    }, []);

    // Radius slider
    var radiusSlider = document.getElementById("radius-slider");
    var radiusValue = document.getElementById("radius-value");
    radiusSlider.value = parseInt(window.localStorage.getItem("radius")) || 50;

    // Intensity slider
    var intensitySlider = document.getElementById("intensity-slider");
    var intensityValue = document.getElementById("intensity-value");
    intensitySlider.value = parseInt(window.localStorage.getItem("intensity")) || 100;

    // Events
    document.addEventListener("click", function (_ref3) {
        var target = _ref3.target;

        if (target.dataset.filter) {
            window.setShader(target.dataset.filter);
            filterButtons.forEach(function (button) {
                return button.disabled = false;
            });
            target.disabled = true;
            window.localStorage.setItem("filter", target.dataset.filter);
        }
    });

    var updateRadius = function updateRadius(_ref4) {
        var target = _ref4.target;

        window.setRadius(target.value / 100);
        radiusValue.innerText = target.value + "%";
        window.localStorage.setItem("radius", target.value);
    };
    updateRadius({ target: radiusSlider });

    radiusSlider.addEventListener("change", updateRadius);
    radiusSlider.addEventListener("mousemove", updateRadius);

    var updateIntensity = function updateIntensity(_ref5) {
        var target = _ref5.target;

        window.setIntensity(target.value === "0" ? 0.01 : target.value / 100);
        intensityValue.innerText = target.value + "%";
        window.localStorage.setItem("intensity", target.value);
    };
    updateIntensity({ target: intensitySlider });

    intensitySlider.addEventListener("mousemove", updateIntensity);
    intensitySlider.addEventListener("change", updateIntensity);

    var controlMenuToggle = document.querySelector("#controls .toggle");
    controlMenuToggle.addEventListener("click", function () {
        return controlsRoot.classList.toggle("open");
    });

    invertedCheckbox.addEventListener("click", function () {
        return toggleInverted();
    });
    reducedColoursCheckbox.addEventListener("click", function () {
        return toggleReducedColours();
    });
    surfaceCheckbox.addEventListener("click", function () {
        return toggleBackground(!Filters.hasBackground);
    });

    var edgePicker = document.getElementById("edge-picker");
    var surfacePicker = document.getElementById("surface-picker");

    window.updateColour = function (type, jscolor) {
        var rgb = {
            r: Math.floor(jscolor.rgb[0]),
            g: Math.floor(jscolor.rgb[1]),
            b: Math.floor(jscolor.rgb[2])
        };

        type === 'edge' ? window.setEdgeColour(rgb) : window.setSurfaceColour(rgb);

        if (document.querySelector("button[data-filter=sobel3x3]").disabled && rgb.r == 0 && rgb.g == 255 && rgb.b == 0 && surfaceCheckbox.checked && !reducedColoursCheckbox.checked && !invertedCheckbox.checked) {
            toggleMatrix();
        }
    };
});

//# sourceMappingURL=websight.concat.js.map
