"use strict"

const degToRad = x => x * Math.PI / 180

window.addEventListener("load", () => {

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
    enterVRButton.addEventListener("click", () => {
        if (navigator.userAgent.includes("Mobile VR")) {
            vrDisplay.requestPresent([{source: renderer.domElement}])
        } else {
            effect = new THREE.StereoEffect(renderer)
            effect.separation = 0
            effect.setSize(window.innerWidth, window.innerHeight)
            enterVRButton.style.display = "none"
        }
    })

    // Scenes and camera
    const fov = 70
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000)
    scene.add(camera)


    // Box object
    let texture
    let boxMaterial
    let box

    const makeBoxObject = () => {

        window.video = document.createElement("video")
        video.autoplay = true
        video.width = window.innerWidth / 2
        video.height = window.innerHeight / 2
        getVideoFeed()

        const boxWidth = video.width
        const boxHeight = video.height

        const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, 1)
        texture = new THREE.Texture(video)
        texture.minFilter = THREE.NearestFilter

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
                }
            },
            vertexShader: vertexShaderSource.text,
            fragmentShader: Filters.compileShader("sobel3x3")
        })

        box = new THREE.Mesh(boxGeometry, boxMaterial)
        scene.add(box)

        camera.position.z = 0.5 * boxWidth * Math.atan(degToRad(90 - fov / 2)) + 100
    }

    const getVideoFeed = () => {
        try {
            const mediaDevicesSupport = navigator.mediaDevices && navigator.mediaDevices.getUserMedia

            if (mediaDevicesSupport) {

                navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}}).then(stream => {
                    video.src = window.URL.createObjectURL(stream)
                }).catch(err => {
                    console.log(err)
                    alert("There was an error accessing the camera. Please try again and ensure you are using https")
                })

            } else {

                const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia

                if (getUserMedia) {
                    getUserMedia({video: {facingMode: "environment"}}, stream => {
                        video.src = window.URL.createObjectURL(stream)
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
    }

    makeBoxObject()

    // Render loop
    const render = () => {
        requestAnimationFrame(render)

        if (video.currentTime) {
            texture.needsUpdate = true
        }

        effect.render(scene, camera)
    }
    render()

    // Request fullscreen when tapped
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
        scene.remove(box)
        video.pause()
        makeBoxObject()
    })

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