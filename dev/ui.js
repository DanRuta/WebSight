window.addEventListener('load', () => {
    const filters = Filters.availableFilters()
    const filterRoot = document.getElementById('controls')

    // create filter buttons
    filters.forEach(filter => {
        const button = document.createElement('button')
        button.dataset.filter = filter
        button.innerText = filter
        button.classList.add('filter-button')

        filterRoot.appendChild(button)
    })

    // radius slider
    const radiusSlider = document.createElement('input')
    radiusSlider.type = 'range'
    radiusSlider.name = 'radius'
    radiusSlider.value = 50
    radiusSlider.min = 0
    radiusSlider.max = 100
    radiusSlider.step = 1

    // radius slider label
    const radiusLabel = document.createElement('label')
    radiusLabel.for = 'radius'
    radiusLabel.innerText = 'Radius: '

    // radius slider value
    const radiusValue = document.createElement('span')
    radiusValue.innerText = '50%'

    radiusLabel.appendChild(radiusSlider)
    radiusLabel.appendChild(radiusValue)
    filterRoot.appendChild(radiusLabel)

    // intensity slider
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

    // events
    document.addEventListener('click', ({ target }) => {
        if (target.dataset.filter) window.setShader(target.dataset.filter)
    })

    radiusSlider.addEventListener('change', ({ target }) => {
        window.setRadius(target.value / 100)
        radiusValue.innerText = `${target.value}%`
    })

    intensitySlider.addEventListener('change', ({ target }) => {
        window.setIntensity(target.value === '0' ? 0.01 : target.value / 100)
        intensityValue.innerText = `${target.value}%`
    })
})
