"use strict"

const initUI = () => {

    Filters.colourBlindness = "none"
    const filters = Filters.availableFilters
    const initialFilter = window.localStorage.getItem("filter") || "sobel3x3"

    window.setShader(initialFilter)

    const controlsRoot = document.getElementById("controls")
    const filtersRoot = controlsRoot.getElementsByClassName("filters")[0]
    const slidersRoot = controlsRoot.getElementsByClassName("sliders")[0]

    // Create filter buttons
    const filterButtons = filters.map((filter) => {
        const button = document.createElement("button")
        button.dataset.filter = filter.toLowerCase().replace(/\s|\-/g, "")
        button.innerText = filter
        button.classList.add("filter-button")

        if (button.dataset.filter === initialFilter) button.disabled = true

        filtersRoot.appendChild(button)
        return button
    }, [])

    // Radius slider
    const radiusSlider = document.getElementById("radius-slider")
    const radiusValue = document.getElementById("radius-value")
    radiusSlider.value = parseInt(window.localStorage.getItem("radius")) || 50

    // Intensity slider
    const intensitySlider = document.getElementById("intensity-slider")
    const intensityValue = document.getElementById("intensity-value")
    intensitySlider.value = parseInt(window.localStorage.getItem("intensity")) || 100

    // Events
    document.addEventListener("click", ({ target }) => {
        if (target.dataset.filter) {
            window.setShader(target.dataset.filter)
            filterButtons.forEach(button => button.disabled = false)
            target.disabled = true
            window.localStorage.setItem("filter", target.dataset.filter)
        }
    })

    const updateRadius = ({ target }) => {
        window.setRadius(target.value / 100)
        radiusValue.innerText = `${target.value}%`
        window.localStorage.setItem("radius", target.value)
    }
    updateRadius({target: radiusSlider})

    radiusSlider.addEventListener("change", updateRadius)
    radiusSlider.addEventListener("mousemove", updateRadius)

    const updateIntensity = ({ target }) => {
        window.setIntensity(target.value === "0" ? 0.01 : target.value / 100)
        intensityValue.innerText = `${target.value}%`
        window.localStorage.setItem("intensity", target.value)
    }
    updateIntensity({target: intensitySlider})

    intensitySlider.addEventListener("mousemove", updateIntensity)
    intensitySlider.addEventListener("change", updateIntensity)

    const controlMenuToggle = document.querySelector("#controls .toggle")
    controlMenuToggle.addEventListener("click", () => controlsRoot.classList.toggle("open"))

    invertedCheckbox.addEventListener("click", () => toggleInverted())
    reducedColoursCheckbox.addEventListener("click", () => toggleReducedColours())
    surfaceCheckbox.addEventListener("click", () => toggleBackground(!Filters.hasBackground))

    const edgePicker = document.getElementById("edge-picker")
    const surfacePicker = document.getElementById("surface-picker")

    colourBlindness.addEventListener("change", () => updateColourBlindness(colourBlindness.value))

    window.updateColour = (type, jscolor) => {
        const rgb = {
            r: Math.floor(jscolor.rgb[0]),
            g: Math.floor(jscolor.rgb[1]),
            b: Math.floor(jscolor.rgb[2])
        }

        type === 'edge' ? window.setEdgeColour(rgb) : window.setSurfaceColour(rgb)

        if (document.querySelector("button[data-filter=sobel3x3]").disabled && rgb.r==0 && rgb.g==255 && rgb.b==0
            && surfaceCheckbox.checked && !reducedColoursCheckbox.checked && !invertedCheckbox.checked) {
            toggleMatrix()
        }

        if (document.querySelector("button[data-filter=sobel3x3]").disabled && rgb.r==255 && rgb.g==0 && rgb.b==0
            && surfaceCheckbox.checked && !reducedColoursCheckbox.checked && !invertedCheckbox.checked) {

            if (!Filters.fire) {
                toggleFire()
            }
        } else {
            if (Filters.fire) {
                window.toggleFire(true)
            }
        }
    }

    if (location.hash=="#matrix") {
        toggleMatrix()
    }

    if (location.hash=="#fire") {
        toggleFire()
    }

    // Fire shader
    const audioSrc = document.createElement("source")
    audioSrc.src = "fire.mp3"
    audioElem.appendChild(audioSrc)

    // YOLO
    let loadedAI = false
    const aiCheckbox = document.getElementById("ai-detection-checkbox")
    aiCheckbox.addEventListener("click", () => {

        if (!loadedAI) {

            // Lazy load all the necessary scripts
            const scripts = [
                "lib/class_names.js",
                "lib/postprocess.js",
                "lib/yolo.js"
            ]

            loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@0.9.0").then(() => {
                Promise.all(scripts.map(s => loadScript(s))).then(async () => {

                    aiSection.style.display = "block"

                    model = await downloadModel()
                    yoloSpinner.remove()

                    loadedAI = true
                    window.aiTurnedOn = true

                    // Active checkboxes
                    let yoloActiveClasses = window.localStorage.getItem("yoloActiveClasses")
                    if (yoloActiveClasses) {
                        yoloActiveClasses = JSON.parse(yoloActiveClasses)

                        Object.keys(yoloActiveClasses).forEach(key => {
                            activeClasses[key] = yoloActiveClasses[key]
                        })
                    }

                    // Cached colours
                    let yoloClassColours = window.localStorage.getItem("yoloClassColours")
                    if (yoloClassColours) {
                        yoloClassColours = JSON.parse(yoloClassColours)

                        Object.keys(yoloClassColours).forEach(key => {
                            classColours[key] = yoloClassColours[key]
                        })
                    }

                    // Add all the classification groups' toggles and colour inputs
                    Object.keys(classColours).forEach(key => {

                        const labelElem = document.createElement("label")
                        labelElem.for = `aiCheckbox-${key}`

                        const checkboxElem = document.createElement("input")
                        checkboxElem.type = "checkbox"
                        checkboxElem.checked = activeClasses[key]
                        labelElem.appendChild(checkboxElem)

                        checkboxElem.addEventListener("click", () => {
                            activeClasses[key] = checkboxElem.checked
                            window.localStorage.setItem("yoloActiveClasses", JSON.stringify(activeClasses))
                        })

                        const labelText = document.createElement("span")
                        labelText.innerText = capitalize(key)
                        labelElem.appendChild(labelText)

                        const jsColorInput = document.createElement("input")
                        const jsColorElem = new jscolor(jsColorInput)
                        jsColorElem.fromString(classColours[key])
                        jsColorInput.readonly = true

                        jsColorElem.onFineChange = () => {
                            classColours[key] = jsColorElem.toHEXString().slice(1, 7)
                            window.localStorage.setItem("yoloClassColours", JSON.stringify(classColours))
                        }

                        const container = document.createElement("div")
                        container.appendChild(labelElem)
                        container.appendChild(jsColorInput)
                        aiSection.appendChild(container)
                    })
                })
            })

        } else {
            window.aiTurnedOn = aiCheckbox.checked
            aiSection.style.display = window.aiTurnedOn ? "block" : "none"
        }

        if (!window.aiTurnedOn) {
            detectionContext.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height)
        }
    })

    inferenceIntervalInput.addEventListener("change", () => {
        inferenceInterval = parseInt(inferenceIntervalInput.value)
        localStorage.setItem("inferenceInterval", inferenceInterval)
    })
}

