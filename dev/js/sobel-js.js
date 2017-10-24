"use strict"

const sobelFilter = {
    x: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
    y: [[1, 2, 1], [0, 0, 0], [-1, -2, -1]]
}

class Sobel {

    constructor () {
        this.video = document.createElement("video")
    }

    buildMatrix (cx, cy) {
        const matrix = []

        for (let i = 0, y = 3; i < 3; i++, y++) {
            matrix[i] = []

            for (let j = 0, x = 3; j < 3; j++, x++) {
                const nx = cx + x
                const ny = cy + y

                if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
                    matrix[i][j] = undefined
                } else {
                    matrix[i][j] = (ny * this.width + nx) * 4
                }
            }
        }

        return matrix
    }

    isBorder (x, y) {
        return ((x == 0 && y < this.height && y >= 0) ||
                (y == 0 && x < this.width && x >= 0) ||
                (x == this.width - 1 && y < this.height && y >= 0) ||
                (y == this.height - 1 && x < this.width && x >= 0))
    }

    convolve (context) {

        const imgDataCopy = context.getImageData(0, 0, this.width, this.height)

        // Convolve
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {

                const pixelIndex = y * this.width + x
                const cvsIndex = x * 4 + y * this.width * 4
                const matrix = this.buildMatrix(x, y)

                let edgeX = 0
                let edgeY = 0

                if (!this.isBorder(x, y)) {
                    for (let i = 0; i < 3; i++) {
                        for (let j = 0; j < 3; j++) {

                            if (matrix[i][j]) {
                                edgeX += imgDataCopy.data[matrix[i][j]] * sobelFilter.x[i][j]
                                edgeY += imgDataCopy.data[matrix[i][j]] * sobelFilter.y[i][j]
                            }
                        }
                    }
                }

                const grad = Math.round(Math.sqrt(edgeX * edgeX + edgeY * edgeY))
                const i = (x + y * this.width) * 4

                imgDataCopy.data[i]     = grad
                imgDataCopy.data[i + 1] = grad
                imgDataCopy.data[i + 2] = grad

            }
        }

        context.putImageData(imgDataCopy, 0, 0)
    }

    record () {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

            navigator.mediaDevices.getUserMedia({video: true}).then(stream => {
                this.video.src = window.URL.createObjectURL(stream)
                this.video.play()
            })

        } else {
            alert("No camera available")
        }
    }

    setSize () {
        this.video.width = window.innerWidth / 2
        this.video.height = window.innerHeight / 2
        this.height = this.video.height
        this.width = this.video.width
    }
}

