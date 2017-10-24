"use strict"

window.addEventListener("load", () => {

    // Renderer and VR stuff
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true}) // Maybe no antialiasing for fps? Needs testing
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    let effect = new THREE.VREffect(renderer)
    effect.separation = 0
    effect.setSize(window.innerWidth, window.innerHeight)

    let vrDisplay
    navigator.getVRDisplays().then(displays => displays.length && (vrDisplay = displays[0]))

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
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.z = 680
    scene.add(camera)
    camera.rotation.order = "YXZ"

    // Canvases and textures
    const textureCanvas = document.createElement("canvas")
    textureCanvas.height = 1024
    textureCanvas.width = 2048
    const textureContext = textureCanvas.getContext("2d")

    const texture = new THREE.Texture(textureCanvas)


        // TEMP
        textureContext.rect(0,0, textureCanvas.width, textureCanvas.height)
        textureContext.fillStyle = "pink"
        textureContext.fill()

        textureContext.beginPath()
        textureContext.moveTo(0, 0)
        textureContext.strokeStyle = "orange"
        textureContext.lineTo(textureCanvas.width, textureCanvas.height)
        textureContext.lineWidth = 10
        textureContext.stroke()




    // Box object
    const boxGeometry = new THREE.BoxGeometry(window.innerWidth, window.innerHeight, 1)
    const boxMaterial = new THREE.MeshBasicMaterial({map: texture})
    const box = new THREE.Mesh(boxGeometry, boxMaterial)
    box.rotation.order = "YXZ"
    scene.add(box)

    // Set minFilter value, to resolve the power of two issue
    texture.minFilter = THREE.NearestFilter


    // Render loop
    // ===========
    const render = () => {
        requestAnimationFrame(render)

        texture.needsUpdate = true

        effect.render(scene, camera)
    }
    render()

    // Do fullscreen + prevent the display from going to sleep when tapped
    if (!window.location.href.includes("localhost")) {

        renderer.domElement.addEventListener("click", () => {

            new NoSleep().enable()

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
})