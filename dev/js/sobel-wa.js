"use strict"

class Sobel {

    constructor (module) {
        this.module = module
    }

    convolve (context) {

        // UInt8
        const imageData = context.getImageData(0, 0, this.width, this.height)
        const typedArray = imageData.data
        const buf = Module._malloc(typedArray.length)
        Module.HEAPU8.set(typedArray, buf)

        const ptr = this.module.ccall("_convolve", null, ["number", "number"], [buf, typedArray.length])

        let counter = 0

        for (let i=0; i<typedArray.length; i+=4) {
            imageData.data[i] = Module.HEAPU8[ptr + i/4  + 3]
            imageData.data[i+1] = Module.HEAPU8[ptr + i/4  + 3]
            imageData.data[i+2] = Module.HEAPU8[ptr + i/4  + 3]
            counter++
        }

        context.putImageData(imageData, 0, 0)
        this.module._free(buf)
    }

    setSize (height, width) {
        this.height = height
        this.width = width
        this.module.ccall("setSize", null, ["number", "number"], [height, width])
    }
}

