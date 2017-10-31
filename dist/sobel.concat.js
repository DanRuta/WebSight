"use strict"

const degToRad = x => x * Math.PI / 180

window.addEventListener("load", () => {

    window.video = document.createElement("video")
    video.autoplay = true

    video.width = window.innerWidth / 2
    video.height = window.innerHeight / 2

    const fov = 70
    const boxWidth = video.width
    const boxHeight = video.height


    // Renderer and VR stuff
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    renderer.domElement.style.backgroundColor = "black"

    let effect = new THREE.VREffect(renderer)
    effect.separation = 0
    effect.setSize(window.innerWidth, window.innerHeight)

    let vrDisplay

    if (navigator.getVRDisplays) {
        navigator.getVRDisplays().then(displays => displays.length && (vrDisplay = displays[0]))
    }

    // Button to enable VR mode
    const vrButton = VRSamplesUtil.addButton("Enter VR", "E", "/images/cardboard64.png", () => {

        if (navigator.userAgent.includes("Mobile VR")) {
            vrDisplay.requestPresent([{source: renderer.domElement}])
        } else {
            effect = new THREE.StereoEffect(renderer)
            effect.separation = 0
            effect.setSize(window.innerWidth, window.innerHeight)
            document.getElementById("vr-sample-button-container").style.display = "none"
        }
    })


    // Scenes and camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.z = 0.5 * boxWidth * Math.atan(degToRad(90 - fov / 2)) + 100
    scene.add(camera)


    // Box object
    const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, 1)
    const texture = new THREE.Texture(video)
    texture.minFilter = THREE.NearestFilter

    const boxMaterial = new THREE.ShaderMaterial({
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
            }
        },
        vertexShader: vertexShaderSource.text,
        fragmentShader: Filters.compileShader("sobel3x3")
    })
    const box = new THREE.Mesh(boxGeometry, boxMaterial)
    scene.add(box)


    // Render loop
    const render = () => {
        requestAnimationFrame(render)

        if (video.currentTime) {
            texture.needsUpdate = true
        }

        effect.render(scene, camera)
    }
    render()

    // Do fullscreen + prevent the display from going to sleep when tapped
    if (!window.location.href.includes("localhost")) {

        renderer.domElement.addEventListener("click", () => {
            document.fullscreenEnabled && renderer.domElement.requestFullScreen() ||
            document.webkitFullscreenEnabled && renderer.domElement.webkitRequestFullScreen() ||
            document.mozFullScreenEnabled && renderer.domElement.mozRequestFullScreen() ||
            document.msFullScreenEnabled && renderer.domElement.msRequestFullScreen()
        })
    }


    // Resizing
    window.addEventListener("resize", () => {
        effect.setSize(window.innerWidth, window.innerHeight)
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    })

    // Start camera capture
    try {
        const mediaDevicesSupport = navigator.mediaDevices && navigator.mediaDevices.getUserMedia

        if (mediaDevicesSupport) {

            navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}}).then(stream => {
                video.src = window.URL.createObjectURL(stream)
                video.play()
            }).catch(err => {
                console.log(err)
                alert("There was an error accessing the camera. Please try again and ensure you are using https")
            })

        } else {

            const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia

            if (getUserMedia) {
                getUserMedia({video: {facingMode: "environment"}}, stream => {
                    video.src = window.URL.createObjectURL(stream)
                    video.play()
                }, err => {
                    console.log(err)
                    alert("There was an error accessing the camera. Please try again and ensure you are using https.")
                })
            } else {
                alert("Camera not available")
            }
        }
    } catch (e) {
        alert("Error getting camera feed. Please ensure you are using https.")
    }

    // =======
    //  Temporary, until the UI is implemented
    // =======
    window.setShader = shader => {
        boxMaterial.fragmentShader = Filters.compileShader(shader)
        boxMaterial.needsUpdate = true
    }
    window.setRadius = val => {
        boxMaterial.uniforms.radius.value = val
    }
    window.setIntensity = val => {
        boxMaterial.uniforms.intensity.value = 1-val
    }
    // =======
})
"use strict"

class Filters {

    static compileShader (name) {
        return `
            uniform sampler2D texture;
            uniform float width;
            uniform float height;
            uniform float radius;
            uniform float intensity;
            varying vec2 vUv;

            void main() {

                float w = 1.0 / width;
                float h = 1.0 / height;

                vec4 pixel = texture2D(texture, vUv);

                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < radius) {

                    ${this[name+"Body"]}

                    if (intensity!=1.0) {
                        newColour.r = newColour.r*(1.0-intensity) + pixel.r*intensity;
                        newColour.g = newColour.g*(1.0-intensity) + pixel.g*intensity;
                        newColour.b = newColour.b*(1.0-intensity) + pixel.b*intensity;
                    }
                    gl_FragColor = newColour;

                } else {
                    vec4 pixel = texture2D(texture, vUv);
                    gl_FragColor = vec4(pixel.r, pixel.g, pixel.b, 1.0);
                }
            }
        `
    }

    /*
    1   0   -1
    2   0   -2
    1   0   -1
    */
    static get sobel3x3Body () {
        return `
            vec4 n[9];

            for (int i=-1; i<=1; i++) {
                for (int j=-1; j<=1; j++) {
                    n[(j+1)+(i+1)*3] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );
                }
            }

            vec4 sobel_x = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
            vec4 sobel_y = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);

            float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;
            float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;

            sobel_x.r = avg_x;
            sobel_x.g = avg_x;
            sobel_x.b = avg_x;
            sobel_y.r = avg_y;
            sobel_y.g = avg_y;
            sobel_y.b = avg_y;

            vec4 newColour = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );
        `
    }

    /*
    2   1   0   -1  -2
    3   2   0   -2  -3
    4   3   0   -3  -4
    3   2   0   -2  -3
    2   1   0   -1  -2
    */
    static get sobel5x5Body () {
        return `
            vec4 n[25];

            for (int i=-2; i<=2; i++) {
                for (int j=-2; j<=2; j++) {
                    n[(j+2)+(i+2)*5] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );
                }
            }

            vec4 sobel_x = 2.0*n[4] + 3.0*n[9] + 4.0*n[14] + 3.0*n[19] + 2.0*n[24] +
                           n[3] + 2.0*n[8] + 3.0*n[13] + 2.0*n[18] + n[23] -
                           (2.0*n[0] + 3.0*n[5] + 4.0*n[10] + 3.0*n[15] + 2.0*n[20] +
                           n[1] + 2.0*n[6] + 3.0*n[11] + 2.0*n[16] + n[21]);

            vec4 sobel_y = 2.0*n[0] + n[1] + n[3] + n[4] +
                           3.0*n[5] + 2.0*n[6] + 2.0*n[8] + 3.0*n[9] -
                           (3.0*n[15] + 2.0*n[16] + 2.0*n[18] + 3.0*n[19] +
                            2.0*n[20] + n[21] + n[23] + n[24]);

            float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;
            float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;
            sobel_x.r = avg_x;
            sobel_x.g = avg_x;
            sobel_x.b = avg_x;
            sobel_y.r = avg_y;
            sobel_y.g = avg_y;
            sobel_y.b = avg_y;
            vec4 newColour = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );
        `
    }

    static get invertedBody () {
        return `
            vec4 pixel = texture2D(texture, vUv);
            vec4 newColour = vec4( 1.0 - pixel.r, 1.0 - pixel.g, 1.0 - pixel.b, 1.0 );
        `
    }
}
//# sourceMappingURL=sobel.concat.js.map