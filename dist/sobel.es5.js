'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var degToRad = function degToRad(x) {
    return x * Math.PI / 180;
};

window.addEventListener('load', function () {
    // Renderer and VR stuff
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.backgroundColor = 'black';

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
    enterVRButton.addEventListener('click', function () {
        if (navigator.userAgent.includes('Mobile VR')) {
            vrDisplay.requestPresent([{ source: renderer.domElement }]);
        } else {
            effect = new THREE.StereoEffect(renderer);
            effect.separation = 0;
            effect.setSize(window.innerWidth, window.innerHeight);
        }

        // hide controls
        var controls = document.getElementById('controls');
        controls.style.display = 'none';
    });

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
        window.video = document.createElement('video');
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
                    type: 't',
                    value: texture
                },
                width: {
                    type: 'f',
                    value: video.width
                },
                height: {
                    type: 'f',
                    value: video.height
                },
                radius: {
                    type: 'f',
                    value: 0.4
                },
                intensity: {
                    type: 'f',
                    value: 1.0
                }
            },
            vertexShader: vertexShaderSource.text,
            fragmentShader: Filters.compileShader('sobel3x3')
        });

        box = new THREE.Mesh(boxGeometry, boxMaterial);
        scene.add(box);

        camera.position.z = 0.5 * boxWidth * Math.atan(degToRad(90 - fov / 2)) + 100;
    };

    var getVideoFeed = function getVideoFeed() {
        try {
            var mediaDevicesSupport = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

            if (mediaDevicesSupport) {
                navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function (stream) {
                    video.src = window.URL.createObjectURL(stream);
                }).catch(function (err) {
                    console.log(err);
                    alert('There was an error accessing the camera. Please try again and ensure you are using https');
                });
            } else {
                var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

                if (getUserMedia) {
                    getUserMedia({ video: { facingMode: 'environment' } }, function (stream) {
                        video.src = window.URL.createObjectURL(stream);
                    }, function (err) {
                        console.log(err);
                        alert('There was an error accessing the camera. Please try again and ensure you are using https.');
                    });
                } else {
                    alert('Camera not available');
                }
            }
        } catch (e) {
            alert('Error getting camera feed. Please ensure you are using https.');
        }
    };

    makeBoxObject();

    // Render loop
    var render = function render() {
        requestAnimationFrame(render);

        if (video.currentTime) {
            texture.needsUpdate = true;
        }

        effect.render(scene, camera);
    };
    render();

    // Request fullscreen when tapped
    if (!window.location.href.includes('localhost')) {
        renderer.domElement.addEventListener('click', function () {
            ;document.fullscreenEnabled && renderer.domElement.requestFullScreen() || document.webkitFullscreenEnabled && renderer.domElement.webkitRequestFullScreen() || document.mozFullScreenEnabled && renderer.domElement.mozRequestFullScreen() || document.msFullScreenEnabled && renderer.domElement.msRequestFullScreen();
        });
    }

    // Resizing
    window.addEventListener('resize', function () {
        effect.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        scene.remove(box);
        video.pause();
        makeBoxObject();
    });

    // =======
    //  Temporary, until the UI is implemented
    // =======
    window.setShader = function (shader) {
        boxMaterial.fragmentShader = Filters.compileShader(shader);
        boxMaterial.needsUpdate = true;
    };
    window.setRadius = function (val) {
        boxMaterial.uniforms.radius.value = val;
    };
    window.setIntensity = function (val) {
        boxMaterial.uniforms.intensity.value = 1 - val;
    };
    // =======
});

"use strict";

var Filters = function () {
    function Filters() {
        _classCallCheck(this, Filters);
    }

    _createClass(Filters, null, [{
        key: 'availableFilters',
        value: function availableFilters() {
            // return ['sobel3x3', 'sobel5x5', 'inverted', "freichen256"];
            return Object.getOwnPropertyNames(Filters).filter(function (m) {
                return m.includes("Body");
            }).map(function (m) {
                return m.replace("Body", "");
            });
        }
    }, {
        key: 'compileShader',
        value: function compileShader(name) {
            return '\n            uniform sampler2D texture;\n            uniform float width;\n            uniform float height;\n            uniform float radius;\n            uniform float intensity;\n            uniform vec2 resolution;\n            varying vec2 vUv;\n\n            void main() {\n\n                float w = 1.0 / width;\n                float h = 1.0 / height;\n\n                vec4 pixel = texture2D(texture, vUv);\n\n                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < radius) {\n\n                    ' + this[name + "Body"] + '\n\n                    if (intensity!=1.0) {\n                        newColour = newColour*(1.0-intensity) + pixel*intensity;\n                    }\n                    gl_FragColor = newColour;\n\n                } else {\n                    gl_FragColor = vec4(pixel.rgb, 1.0);\n                }\n            }\n        ';
        }

        /*
        1   0   -1
        2   0   -2
        1   0   -1
        */

    }, {
        key: 'sobel3x3Body',
        get: function get() {
            return '\n            vec4 n[9];\n\n            for (int i=-1; i<=1; i++) {\n                for (int j=-1; j<=1; j++) {\n                    n[(j+1)+(i+1)*3] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );\n                }\n            }\n\n            vec4 sobel_x = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);\n            vec4 sobel_y = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);\n\n            float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;\n            float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;\n\n            sobel_x.r = avg_x;\n            sobel_x.g = avg_x;\n            sobel_x.b = avg_x;\n            sobel_y.r = avg_y;\n            sobel_y.g = avg_y;\n            sobel_y.b = avg_y;\n\n            vec4 newColour = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );\n        ';
        }

        /*
        2   1   0   -1  -2
        3   2   0   -2  -3
        4   3   0   -3  -4
        3   2   0   -2  -3
        2   1   0   -1  -2
        */

    }, {
        key: 'sobel5x5Body',
        get: function get() {
            return '\n            vec4 n[25];\n\n            for (int i=-2; i<=2; i++) {\n                for (int j=-2; j<=2; j++) {\n                    n[(j+2)+(i+2)*5] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );\n                }\n            }\n\n            vec4 sobel_x = 2.0*n[4] + 3.0*n[9] + 4.0*n[14] + 3.0*n[19] + 2.0*n[24] +\n                           n[3] + 2.0*n[8] + 3.0*n[13] + 2.0*n[18] + n[23] -\n                           (2.0*n[0] + 3.0*n[5] + 4.0*n[10] + 3.0*n[15] + 2.0*n[20] +\n                           n[1] + 2.0*n[6] + 3.0*n[11] + 2.0*n[16] + n[21]);\n\n            vec4 sobel_y = 2.0*n[0] + n[1] + n[3] + n[4] +\n                           3.0*n[5] + 2.0*n[6] + 2.0*n[8] + 3.0*n[9] -\n                           (3.0*n[15] + 2.0*n[16] + 2.0*n[18] + 3.0*n[19] +\n                            2.0*n[20] + n[21] + n[23] + n[24]);\n\n            float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0 / 9.0;\n            float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0 / 9.0;\n            sobel_x.r = avg_x;\n            sobel_x.g = avg_x;\n            sobel_x.b = avg_x;\n            sobel_y.r = avg_y;\n            sobel_y.g = avg_y;\n            sobel_y.b = avg_y;\n            vec4 newColour = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );\n        ';
        }
    }, {
        key: 'invertedBody',
        get: function get() {
            return '\n            vec4 pixel = texture2D(texture, vUv);\n            vec4 newColour = vec4( 1.0 - pixel.rgb, 1.0 );\n        ';
        }
    }, {
        key: 'freichenBody',
        get: function get() {
            return '\n\n            vec2 texel = vec2(1.0 / width, 1.0 / height);\n            mat3 I;\n            mat3 G[9];\n            float cnv[9];\n\n            G[0] = mat3( 0.3535533845424652, 0, -0.3535533845424652, 0.5, 0, -0.5, 0.3535533845424652, 0, -0.3535533845424652 );\n            G[1] = mat3( 0.3535533845424652, 0.5, 0.3535533845424652, 0, 0, 0, -0.3535533845424652, -0.5, -0.3535533845424652 );\n            G[2] = mat3( 0, 0.3535533845424652, -0.5, -0.3535533845424652, 0, 0.3535533845424652, 0.5, -0.3535533845424652, 0 );\n            G[3] = mat3( 0.5, -0.3535533845424652, 0, -0.3535533845424652, 0, 0.3535533845424652, 0, 0.3535533845424652, -0.5 );\n            G[4] = mat3( 0, -0.5, 0, 0.5, 0, 0.5, 0, -0.5, 0 );\n            G[5] = mat3( -0.5, 0, 0.5, 0, 0, 0, 0.5, 0, -0.5 );\n            G[6] = mat3( 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.6666666865348816, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204 );\n            G[7] = mat3( -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, 0.6666666865348816, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408 );\n            G[8] = mat3( 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408 );\n\n            // Get intensity\n            I[0][0] = length(texture2D(texture, vUv + texel * vec2(-1.0,-1.0) ).rgb);\n            I[0][1] = length(texture2D(texture, vUv + texel * vec2(-1.0,0.0) ).rgb);\n            I[0][2] = length(texture2D(texture, vUv + texel * vec2(-1.0,1.0) ).rgb);\n            I[1][0] = length(texture2D(texture, vUv + texel * vec2(0.0,-1.0) ).rgb);\n            I[1][1] = length(texture2D(texture, vUv + texel * vec2(0.0,0.0) ).rgb);\n            I[1][2] = length(texture2D(texture, vUv + texel * vec2(0.0,1.0) ).rgb);\n            I[2][0] = length(texture2D(texture, vUv + texel * vec2(1.0,-1.0) ).rgb);\n            I[2][1] = length(texture2D(texture, vUv + texel * vec2(1.0,0.0) ).rgb);\n            I[2][2] = length(texture2D(texture, vUv + texel * vec2(1.0,1.0) ).rgb);\n\n            // Convolve\n            cnv[0] = pow(dot(G[0][0], I[0]) + dot(G[0][1], I[1]) + dot(G[0][2], I[2]) , 2.0);\n            cnv[1] = pow(dot(G[1][0], I[0]) + dot(G[1][1], I[1]) + dot(G[1][2], I[2]) , 2.0);\n            cnv[2] = pow(dot(G[2][0], I[0]) + dot(G[2][1], I[1]) + dot(G[2][2], I[2]) , 2.0);\n            cnv[3] = pow(dot(G[3][0], I[0]) + dot(G[3][1], I[1]) + dot(G[3][2], I[2]) , 2.0);\n            cnv[4] = pow(dot(G[4][0], I[0]) + dot(G[4][1], I[1]) + dot(G[4][2], I[2]) , 2.0);\n            cnv[5] = pow(dot(G[5][0], I[0]) + dot(G[5][1], I[1]) + dot(G[5][2], I[2]) , 2.0);\n            cnv[6] = pow(dot(G[6][0], I[0]) + dot(G[6][1], I[1]) + dot(G[6][2], I[2]) , 2.0);\n            cnv[7] = pow(dot(G[7][0], I[0]) + dot(G[7][1], I[1]) + dot(G[7][2], I[2]) , 2.0);\n            cnv[8] = pow(dot(G[8][0], I[0]) + dot(G[8][1], I[1]) + dot(G[8][2], I[2]) , 2.0);\n\n            float M = (cnv[0] + cnv[1]) + (cnv[2] + cnv[3]);\n            float S = (cnv[4] + cnv[5]) + (cnv[6] + cnv[7]) + (cnv[8] + M);\n\n            vec4 newColour = vec4(vec3(sqrt(M/S)) * 2.0, 1.0 );\n        ';
        }
    }, {
        key: 'freichen256Body',
        get: function get() {
            return '\n            vec2 texel = vec2(1.0 / width, 1.0 / height);\n            mat3 I;\n            mat3 G[9];\n            float cnv[9];\n\n            G[0] = mat3( 0.3535533845424652, 0, -0.3535533845424652, 0.5, 0, -0.5, 0.3535533845424652, 0, -0.3535533845424652 );\n            G[1] = mat3( 0.3535533845424652, 0.5, 0.3535533845424652, 0, 0, 0, -0.3535533845424652, -0.5, -0.3535533845424652 );\n            G[2] = mat3( 0, 0.3535533845424652, -0.5, -0.3535533845424652, 0, 0.3535533845424652, 0.5, -0.3535533845424652, 0 );\n            G[3] = mat3( 0.5, -0.3535533845424652, 0, -0.3535533845424652, 0, 0.3535533845424652, 0, 0.3535533845424652, -0.5 );\n            G[4] = mat3( 0, -0.5, 0, 0.5, 0, 0.5, 0, -0.5, 0 );\n            G[5] = mat3( -0.5, 0, 0.5, 0, 0, 0, 0.5, 0, -0.5 );\n            G[6] = mat3( 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.6666666865348816, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204 );\n            G[7] = mat3( -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, 0.6666666865348816, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408 );\n            G[8] = mat3( 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408 );\n\n            // Get intensity\n            I[0][0] = length(texture2D(texture, vUv + texel * vec2(-1.0,-1.0) ).rgb);\n            I[0][1] = length(texture2D(texture, vUv + texel * vec2(-1.0,0.0) ).rgb);\n            I[0][2] = length(texture2D(texture, vUv + texel * vec2(-1.0,1.0) ).rgb);\n            I[1][0] = length(texture2D(texture, vUv + texel * vec2(0.0,-1.0) ).rgb);\n            I[1][1] = length(texture2D(texture, vUv + texel * vec2(0.0,0.0) ).rgb);\n            I[1][2] = length(texture2D(texture, vUv + texel * vec2(0.0,1.0) ).rgb);\n            I[2][0] = length(texture2D(texture, vUv + texel * vec2(1.0,-1.0) ).rgb);\n            I[2][1] = length(texture2D(texture, vUv + texel * vec2(1.0,0.0) ).rgb);\n            I[2][2] = length(texture2D(texture, vUv + texel * vec2(1.0,1.0) ).rgb);\n\n            // Convolve\n            cnv[0] = pow(dot(G[0][0], I[0]) + dot(G[0][1], I[1]) + dot(G[0][2], I[2]) , 2.0);\n            cnv[1] = pow(dot(G[1][0], I[0]) + dot(G[1][1], I[1]) + dot(G[1][2], I[2]) , 2.0);\n            cnv[2] = pow(dot(G[2][0], I[0]) + dot(G[2][1], I[1]) + dot(G[2][2], I[2]) , 2.0);\n            cnv[3] = pow(dot(G[3][0], I[0]) + dot(G[3][1], I[1]) + dot(G[3][2], I[2]) , 2.0);\n            cnv[4] = pow(dot(G[4][0], I[0]) + dot(G[4][1], I[1]) + dot(G[4][2], I[2]) , 2.0);\n            cnv[5] = pow(dot(G[5][0], I[0]) + dot(G[5][1], I[1]) + dot(G[5][2], I[2]) , 2.0);\n            cnv[6] = pow(dot(G[6][0], I[0]) + dot(G[6][1], I[1]) + dot(G[6][2], I[2]) , 2.0);\n            cnv[7] = pow(dot(G[7][0], I[0]) + dot(G[7][1], I[1]) + dot(G[7][2], I[2]) , 2.0);\n            cnv[8] = pow(dot(G[8][0], I[0]) + dot(G[8][1], I[1]) + dot(G[8][2], I[2]) , 2.0);\n\n            float M = (cnv[0] + cnv[1]) + (cnv[2] + cnv[3]);\n            float S = (cnv[4] + cnv[5]) + (cnv[6] + cnv[7]) + (cnv[8] + M);\n\n            vec3 p = vec3(sqrt(M/S)) * 2.0;\n            p.r = float(floor(pixel.r * 5.0 ) / 5.0) - p.r;\n            p.g = float(floor(pixel.g * 5.0 ) / 5.0) - p.g;\n            p.b = float(floor(pixel.b * 5.0 ) / 5.0) - p.b;\n\n            vec4 newColour = vec4(p.rgb, 1.0 );\n        ';
        }
    }, {
        key: 'palette256Body',
        get: function get() {
            return '\n            pixel.r = float(floor(pixel.r * 5.0 ) / 5.0);\n            pixel.g = float(floor(pixel.g * 5.0 ) / 5.0);\n            pixel.b = float(floor(pixel.b * 5.0 ) / 5.0);\n\n            vec4 newColour = vec4(pixel.rgb, 1.0);\n        ';
        }
    }]);

    return Filters;
}();

window.addEventListener('load', function () {
    var filters = Filters.availableFilters();
    var filterRoot = document.getElementById('controls');
    var initialFilter = 'sobel3x3';
    var filterButtons = [];

    window.setShader(initialFilter);

    // create filter buttons
    filters.forEach(function (filter) {
        var button = document.createElement('button');
        button.dataset.filter = filter;
        button.innerText = filter;
        button.classList.add('filter-button');

        if (filter === initialFilter) button.disabled = true;

        filterRoot.appendChild(button);
        filterButtons.push(button);
    });

    // radius slider
    var radiusSlider = document.createElement('input');
    radiusSlider.type = 'range';
    radiusSlider.name = 'radius';
    radiusSlider.value = 50;
    radiusSlider.min = 0;
    radiusSlider.max = 100;
    radiusSlider.step = 1;

    // radius slider label
    var radiusLabel = document.createElement('label');
    radiusLabel.for = 'radius';
    radiusLabel.innerText = 'Radius: ';

    // radius slider value
    var radiusValue = document.createElement('span');
    radiusValue.innerText = '50%';

    radiusLabel.appendChild(radiusSlider);
    radiusLabel.appendChild(radiusValue);
    filterRoot.appendChild(radiusLabel);

    // intensity slider
    var intensitySlider = document.createElement('input');
    intensitySlider.type = 'range';
    intensitySlider.name = 'intensity';
    intensitySlider.value = 100;
    intensitySlider.min = 0;
    intensitySlider.max = 100;
    intensitySlider.step = 1;

    var intensityLabel = document.createElement('label');
    intensityLabel.for = 'intensity';
    intensityLabel.innerText = 'Intensity: ';

    var intensityValue = document.createElement('span');
    intensityValue.innerText = '100%';

    intensityLabel.appendChild(intensitySlider);
    intensityLabel.appendChild(intensityValue);
    filterRoot.appendChild(intensityLabel);

    // events
    document.addEventListener('click', function (_ref) {
        var target = _ref.target;

        if (target.dataset.filter) {
            window.setShader(target.dataset.filter);

            filterButtons.forEach(function (button) {
                button.disabled = false;
            });
            target.disabled = true;
        }
    });

    radiusSlider.addEventListener('mousemove', function (_ref2) {
        var target = _ref2.target;

        window.setRadius(target.value / 100);
        radiusValue.innerText = target.value + '%';
    });

    intensitySlider.addEventListener('mousemove', function (_ref3) {
        var target = _ref3.target;

        window.setIntensity(target.value === '0' ? 0.01 : target.value / 100);
        intensityValue.innerText = target.value + '%';
    });
});

//# sourceMappingURL=sobel.concat.js.map
