"use strict"

class Filters {

    static get inverted () {
        return `
            uniform sampler2D texture;
            varying vec2 vUv;

            void main() {
                vec4 pixel = texture2D(texture, vUv);
                gl_FragColor = vec4( 1.0 - pixel.r, 1.0 - pixel.g, 1.0 - pixel.b, 1.0 );
            }
        `
    }

    static get invertedCircle () {
        return `
            uniform sampler2D texture;
            varying vec2 vUv;

            void main() {
                vec4 pixel = texture2D(texture, vUv);

                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < 0.4) {
                    gl_FragColor = vec4( 1.0 - pixel.r, 1.0 - pixel.g, 1.0 - pixel.b, 1.0 );

                } else {
                    gl_FragColor = vec4(pixel.r, pixel.g, pixel.b, 1.0);
                }
            }
        `
    }

    static get sobel8020 () {
        return `
            uniform sampler2D texture;
            uniform float width;
            uniform float height;
            varying vec2 vUv;

            void main() {
                float w = 1.0 / width;
                float h = 1.0 / height;
                vec4 n[9];
                vec4 pixel = texture2D(texture, vUv);

                for (int i=-1; i<=1; i++) {
                    for (int j=-1; j<=1; j++) {
                        n[(j+1)+(i+1)*3] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );
                    }
                }

                vec4 sobel_x = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
                vec4 sobel_y = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
                float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;
                float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;
                sobel_x.r = pixel.r*0.8 + avg_x;
                sobel_x.g = pixel.g*0.8 + avg_x;
                sobel_x.b = pixel.b*0.8 + avg_x;
                sobel_y.r = pixel.r*0.8 + avg_y;
                sobel_y.g = pixel.g*0.8 + avg_y;
                sobel_y.b = pixel.b*0.8 + avg_y;
                gl_FragColor = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );
            }
        `
    }

    static get sobelCircle () {
        return `
            uniform sampler2D texture;
            uniform float width;
            uniform float height;
            varying vec2 vUv;

            void main() {

                float w = 1.0 / width;
                float h = 1.0 / height;
                vec4 n[9];

                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < 0.4) {

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

                    gl_FragColor = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );
                } else {
                    vec4 pixel = texture2D(texture, vUv);
                    gl_FragColor = vec4(pixel.r, pixel.g, pixel.b, 1.0);
                }
            }
        `
    }

    static get sobelCircle8020 () {
        return `
            uniform sampler2D texture;
            uniform float width;
            uniform float height;
            varying vec2 vUv;

            void main() {

                float w = 1.0 / width;
                float h = 1.0 / height;
                vec4 n[9];

                vec4 pixel = texture2D(texture, vUv);

                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < 0.4) {

                    for (int i=-1; i<=1; i++) {
                        for (int j=-1; j<=1; j++) {
                            n[(j+1)+(i+1)*3] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );
                        }
                    }

                    vec4 sobel_x = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
                    vec4 sobel_y = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);

                    float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;
                    float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;

                    sobel_x.r = pixel.r*0.8 + avg_x;
                    sobel_x.g = pixel.g*0.8 + avg_x;
                    sobel_x.b = pixel.b*0.8 + avg_x;
                    sobel_y.r = pixel.r*0.8 + avg_y;
                    sobel_y.g = pixel.g*0.8 + avg_y;
                    sobel_y.b = pixel.b*0.8 + avg_y;

                    gl_FragColor = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );
                } else {
                    vec4 pixel = texture2D(texture, vUv);
                    gl_FragColor = vec4(pixel.r, pixel.g, pixel.b, 1.0);
                }
            }
        `
    }

    static get sobel () {
        return `
            uniform sampler2D texture;
            uniform float width;
            uniform float height;
            varying vec2 vUv;

            void main() {
                float w = 1.0 / width;
                float h = 1.0 / height;
                vec4 n[9];
                for (int i=-1; i<=1; i++) {
                    for (int j=-1; j<=1; j++) {
                        n[(j+1)+(i+1)*3] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );
                    }
                }
                // vec4 sobel_x = n[2] + 2.0*n[5] + n[8] - (n[0] + 2.0*n[3] + n[6]);
                // vec4 sobel_y = n[0] + 2.0*n[1] + n[2] - (n[6] + 2.0*n[7] + n[8]);
                vec4 sobel_x = n[2] + 2.0*n[5] + 1.0*n[8] +  -1.0* n[0] + -2.0*n[3] + -1.0*n[6];
                vec4 sobel_y = n[0] + 2.0*n[1] + 1.0*n[2] + -1.0*n[6] + -2.0*n[7] + -1.0*n[8];

                float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;
                float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;
                sobel_x.r = avg_x;
                sobel_x.g = avg_x;
                sobel_x.b = avg_x;
                sobel_y.r = avg_y;
                sobel_y.g = avg_y;
                sobel_y.b = avg_y;
                gl_FragColor = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );
            }
        `
    }

    static get sobel5x5 () {
        return `
            uniform sampler2D texture;
            uniform float width;
            uniform float height;
            varying vec2 vUv;

            void main() {
                float w = 1.0 / width;
                float h = 1.0 / height;
                vec4 n[25];

                for (int i=-2; i<=2; i++) {
                    for (int j=-2; j<=2; j++) {
                        n[(j+2)+(i+2)*5] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );
                    }
                }
                // vec4 sobel_x = 1.0*n[2] + 2.0*n[5] + 1.0*n[8] +  -1.0* n[0] + -2.0*n[3] + -1.0*n[6];

                vec4 sobel_x = 2.0*n[4] + 3.0*n[9] + 4.0*n[14] + 3.0*n[19] + 2.0*n[24] +
                               1.0*n[3] + 2.0*n[8] + 3.0*n[13] + 2.0*n[18] + 1.0*n[23] -
                               (2.0*n[0] + 3.0*n[5] + 4.0*n[10] + 3.0*n[15] + 2.0*n[20] +
                               1.0*n[1] + 2.0*n[6] + 3.0*n[11] + 2.0*n[16] + 1.0*n[21]);



                // vec4 sobel_y = 1.0*n[0] + 2.0*n[1] + 1.0*n[2] + -1.0*n[6] + -2.0*n[7] + -1.0*n[8];

                vec4 sobel_y = 2.0*n[0] + 1.0*n[1] + 1.0*n[3] + 1.0*n[4] +
                               3.0*n[5] + 2.0*n[6] + 2.0*n[8] + 3.0*n[9] -
                               (3.0*n[15] + 2.0*n[16] + 2.0*n[18] + 3.0*n[19] +
                                2.0*n[20] + 1.0*n[21] + 1.0*n[23] + 1.0*n[24]);







                float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;
                float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;
                sobel_x.r = avg_x;
                sobel_x.g = avg_x;
                sobel_x.b = avg_x;
                sobel_y.r = avg_y;
                sobel_y.g = avg_y;
                sobel_y.b = avg_y;
                gl_FragColor = vec4( sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)), 1.0 );
            }
        `
    }
}