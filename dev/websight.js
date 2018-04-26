"use strict"

const degToRad = x => x * Math.PI / 180

window.addEventListener("load", () => {
    // Renderer and VR stuff
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
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
        const controls = document.getElementById("controls")

        if (enterVRButton.classList.contains("small")) {
            closeVR()
            enterVRButton.classList.remove("small")
            controls.classList.remove("hidden")
        } else {
            if (navigator.userAgent.includes("Mobile VR")) {
                vrDisplay.requestPresent([{ source: renderer.domElement }])
            } else {
                effect = new THREE.StereoEffect(renderer)
                effect.separation = 0
                effect.setSize(window.innerWidth, window.innerHeight)
            }

            // Shrink VR button
            enterVRButton.classList.add("small")

            // Hide controls
            controls.classList.add("hidden")
        }
    })

    const closeVR = () => {
        effect = new THREE.VREffect(renderer)
        effect.separation = 0
        effect.setSize(window.innerWidth, window.innerHeight)
    }

    // Scenes and camera
    const fov = 70
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000)
    scene.add(camera)

    // Box object
    let texture
    let fireTexture
    let noiseTexture
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

        fireTexture = new THREE.Texture(fire)
        fireTexture.minFilter = THREE.NearestFilter
        fireTexture.wrapS = THREE.RepeatWrapping
        fireTexture.wrapT = THREE.RepeatWrapping

        noiseTexture = new THREE.Texture(noise)
        noiseTexture.minFilter = THREE.NearestFilter
        noiseTexture.wrapS = THREE.RepeatWrapping
        noiseTexture.wrapT = THREE.RepeatWrapping


        boxMaterial = new THREE.ShaderMaterial({
            uniforms: {
                texture: {
                    type: "t",
                    value: texture
                },
                fireTex: {
                    type: "t",
                    value: fireTexture
                },
                noiseTex: {
                    type: "t",
                    value: noiseTexture
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
                    value: [...new Array(10)].map(v => Math.floor(Math.random()*10*video.width/60))
                },
                lightColsEnds: {
                    type: "t",
                    value: [...new Array(10)].map(v => Math.floor(Math.random()*10*video.height/50))
                },
                fireTimer: {
                    type: "f",
                    value: 0.0
                }
            },
            vertexShader: vertexShaderSource.text,
            fragmentShader: Filters.compileShader("sobel3x3")
        })

        box = new THREE.Mesh(boxGeometry, boxMaterial)
        scene.add(box)

        camera.position.z = 0.5 * boxWidth * Math.atan(degToRad(90 - fov / 2)) + 100
    }

    let getVideoFeedAttempts = 0

    const getVideoFeed = () => {

        let errMessage = "There was an error accessing the camera."

        if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
            errMessage += " iOS might still have no support for camera API."
        }

        if (!location.protocol.startsWith("https")) {
            errMessage += " Please make sure you are using https."
        }

        try {

            if ("mozGetUserMedia" in navigator) {
                navigator.mozGetUserMedia(
                    {video: { facingMode: "environment" }},
                    stream => {
                        video.srcObject = stream
                    },
                    err => {
                        console.log(err)
                        alert(errMessage)
                    }
                )
            } else {
                const mediaDevicesSupport = navigator.mediaDevices && navigator.mediaDevices.getUserMedia

                if (mediaDevicesSupport) {
                    navigator.mediaDevices
                        .getUserMedia({ video: { facingMode: "environment" } })
                        .then(stream => {
                            video.srcObject = stream
                        })
                        .catch(err => {
                            console.log(err)
                            getVideoFeedAttempts++

                            // Rarely, getting the camera fails. Re-attempting usually works, on refresh.
                            if (getVideoFeedAttempts<3) {
                                getVideoFeed()
                            } else {
                                alert(errMessage)
                            }
                        })
                } else {
                    const getUserMedia =
                        navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia

                    if (getUserMedia) {
                        getUserMedia(
                            { video: { facingMode: "environment" } },
                            stream => {
                                video.srcObject = stream
                            },
                            err => {
                                console.log(err)
                                alert(errMessage)
                            }
                        )
                    } else {
                        alert("Camera not available")
                    }
                }
            }

        } catch (e) {
            alert(errMessage)
        }
    }

    // Render loop
    const render = () => {
        requestAnimationFrame(render)

        if (video.currentTime) {
            texture.needsUpdate = true
        }

        if (Filters.fire) {
            fireTexture.needsUpdate = true
            noiseTexture.needsUpdate = true
        }

        if (Filters.matrix) {
            boxMaterial.uniforms.lightColsEnds.value = boxMaterial.uniforms.lightColsEnds.value.map(v => v -= Math.random()/2)
        }

        effect.render(scene, camera)
    }

    makeBoxObject()
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

        setShader(document.querySelector(".filter-button:disabled").dataset.filter)
        setIntensity((parseFloat(document.getElementById("intensity-slider").value)||0.01) / 100)
        setRadius(parseFloat(document.getElementById("radius-slider").value) / 100)
    })

    window.setShader = shader => {
        Filters.shader = shader
        boxMaterial.fragmentShader = Filters.compileShader(shader)
        boxMaterial.needsUpdate = true
    }

    window.setRadius = val => {
        boxMaterial.uniforms.radius.value = val
    }

    window.setIntensity = val => {
        boxMaterial.uniforms.intensity.value = 1 - val
    }

    window.toggleInverted = () => {
        Filters.isInverted = !Filters.isInverted
        boxMaterial.fragmentShader = Filters.compileShader(Filters.shader)
        boxMaterial.needsUpdate = true
    }

    window.setEdgeColour = ({r=0, g=0, b=0}) => {
        boxMaterial.uniforms.edgeR.value = r / 255
        boxMaterial.uniforms.edgeG.value = g / 255
        boxMaterial.uniforms.edgeB.value = b / 255
    }

    // For reverting to, when toggling back to colour, from background
    const surfaceCache = {r: 0, g: 0, b: 0}

    window.setSurfaceColour = ({r=0, g=0, b=0}) => {
        boxMaterial.uniforms.surfaceR.value = surfaceCache.r = r / 255
        boxMaterial.uniforms.surfaceG.value = surfaceCache.g = g / 255
        boxMaterial.uniforms.surfaceB.value = surfaceCache.b = b / 255
    }

    window.toggleReducedColours = () => {
        Filters.hasReducedColours = !Filters.hasReducedColours
        boxMaterial.fragmentShader = Filters.compileShader(Filters.shader)
        boxMaterial.needsUpdate = true
    }

    window.toggleBackground = isBackground => {

        Filters.hasBackground = !!isBackground

        if (Filters.hasBackground) {
            boxMaterial.uniforms.surfaceR.value = 0
            boxMaterial.uniforms.surfaceG.value = 0
            boxMaterial.uniforms.surfaceB.value = 0
        } else {
            boxMaterial.uniforms.surfaceR.value = surfaceCache.r
            boxMaterial.uniforms.surfaceG.value = surfaceCache.g
            boxMaterial.uniforms.surfaceB.value = surfaceCache.b
        }

        boxMaterial.fragmentShader = Filters.compileShader(Filters.shader)
        boxMaterial.needsUpdate = true
    }

    window.updateColourBlindness = type => {
        Filters.colourBlindness = type.toLowerCase()
        boxMaterial.fragmentShader = Filters.compileShader(Filters.shader)
        boxMaterial.needsUpdate = true
    }

    window.toggleMatrix = () => {

        Filters.matrix = true

        clearInterval(Filters.matrixInterval)

        toggleBackground(false)
        setEdgeColour({r: 0, g: 255, b: 0})
        setIntensity(1)
        setRadius(1)

        boxMaterial.fragmentShader = Filters.compileShader("matrix")
        boxMaterial.needsUpdate = true

        Filters.matrixInterval = setInterval(() => {

            for (let i=0; i<boxMaterial.uniforms.lightColsEnds.value.length; i++) {
                if (boxMaterial.uniforms.lightColsEnds.value[i] < 0) {
                    boxMaterial.uniforms.lightCols.value[i] = Math.floor(Math.random()*10*video.width/50)
                    boxMaterial.uniforms.lightColsEnds.value[i] = video.height/5
                }
            }

        }, 100)
    }


    window.toggleFire = (off) => {

        if (off) {
            Filters.fire = false
            audioElem.pause()
            boxMaterial.uniforms.fireTimer.value = 10000000
            clearInterval(Filters.fireInterval)
            window.setShader(Filters.shader)
            return
        }

        if (Filters.fire) {
            return
        }


        Filters.fire = true
        Filters.fireTimer = 0
        clearInterval(Filters.matrixInterval)
        clearInterval(Filters.fireInterval)

        boxMaterial.uniforms.surfaceR.value = surfaceCache.r
        boxMaterial.uniforms.surfaceG.value = surfaceCache.g
        boxMaterial.uniforms.surfaceB.value = surfaceCache.b
        setEdgeColour({r: 255, g: 177, b: 0})
        setIntensity(1)
        setRadius(1)

        boxMaterial.fragmentShader = Filters.compileShader("fire")
        boxMaterial.needsUpdate = true

        Filters.fireInterval = setInterval(() => {
            Filters.fireTimer += 8
            boxMaterial.uniforms.fireTimer.value = (Filters.fireTimer % fire.height/2) / fire.height
        }, 2)

        // Audio
        if (Filters.fire) {
            // audioElem.currentTime = 47
            audioElem.play()
        }
    }
})
