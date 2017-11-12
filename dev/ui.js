"use strict"

window.addEventListener('load', () => {
    const filters = Filters.availableFilters()
    const filterRoot = document.getElementById('controls')
    const initialFilter = 'sobel3x3'
    const filterButtons = []

    window.setShader(initialFilter)

    // Create filter buttons
    filters.forEach(filter => {
        const button = document.createElement('button')
        button.dataset.filter = filter
        button.innerText = filter
        button.classList.add('filter-button')

        if (filter === initialFilter) button.disabled = true

        filterRoot.appendChild(button)
        filterButtons.push(button)
    })

    // Radius slider
    const radiusSlider = document.createElement('input')
    radiusSlider.type = 'range'
    radiusSlider.name = 'radius'
    radiusSlider.value = 50
    radiusSlider.min = 0
    radiusSlider.max = 100
    radiusSlider.step = 1

    // Radius slider label
    const radiusLabel = document.createElement('label')
    radiusLabel.for = 'radius'
    radiusLabel.innerText = 'Radius: '

    // Radius slider value
    const radiusValue = document.createElement('span')
    radiusValue.innerText = '50%'

    radiusLabel.appendChild(radiusSlider)
    radiusLabel.appendChild(radiusValue)
    filterRoot.appendChild(radiusLabel)

    // Intensity slider
    const intensitySlider = document.createElement('input')
    intensitySlider.type = 'range'
    intensitySlider.name = 'intensity'
    intensitySlider.value = 100
    intensitySlider.min = 0
    intensitySlider.max = 100
    intensitySlider.step = 1

    const intensityLabel = document.createElement('label')
    intensityLabel.for = 'intensity'
    intensityLabel.innerText = 'Intensity: '

    const intensityValue = document.createElement('span')
    intensityValue.innerText = '100%'

    intensityLabel.appendChild(intensitySlider)
    intensityLabel.appendChild(intensityValue)
    filterRoot.appendChild(intensityLabel)

    // Events
    document.addEventListener('click', ({ target }) => {
        if (target.dataset.filter) {
            window.setShader(target.dataset.filter)

            filterButtons.forEach(button => {
                button.disabled = false
            })
            target.disabled = true
        }
    })

    radiusSlider.addEventListener('mousemove', ({ target }) => {
        window.setRadius(target.value / 100)
        radiusValue.innerText = `${target.value}%`
    })

    intensitySlider.addEventListener('mousemove', ({ target }) => {
        window.setIntensity(target.value === '0' ? 0.01 : target.value / 100)
        intensityValue.innerText = `${target.value}%`
    })
})
