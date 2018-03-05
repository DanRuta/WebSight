"use strict"

window.addEventListener("load", () => {

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
            toggleFire()
        }
    }

    if (location.hash=="#matrix") {
        toggleMatrix()
    }

    if (location.hash=="#fire") {
        toggleFire()
    }

})
