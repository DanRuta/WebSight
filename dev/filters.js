"use strict"

class Filters {

    static get availableFilters () {
        return ["No effect", "Sobel 3x3", "Sobel 5x5", "Frei-Chen"]
    }

    static compileShader (name) {
        return `
            uniform sampler2D texture;
            uniform sampler2D fireTex;
            uniform sampler2D noiseTex;
            uniform float width;
            uniform float height;
            uniform float radius;
            uniform float intensity;
            uniform vec2 resolution;
            varying vec2 vUv;

            uniform float edgeR;
            uniform float edgeG;
            uniform float edgeB;

            uniform float surfaceR;
            uniform float surfaceG;
            uniform float surfaceB;

            uniform float fireTimer;
            uniform float lightCols[5];
            uniform float lightColsEnds[5];

            float rand(vec2 co){
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
            }

            void main() {

                float w = 1.0 / width;
                float h = 1.0 / height;

                vec4 pixel = texture2D(texture, vUv);

                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < radius) {

                    ${this[name+"Body"]}

                    gl_FragColor = newColour*(1.0-intensity) + pixel*intensity;

                    ${this.hasBackground ? this.addBackground : ""}

                    ${this.hasReducedColours ? this.reducedColoursBody : ""}

                    ${this.colourBlindness && this.colourBlindness != "none" ? this.colourBlindnessBody : ""}

                    ${this.isInverted ? this.invertedBody : ""}

                } else {
                    gl_FragColor = vec4(pixel.rgb, 1.0);
                }

            }
        `
    }

    static get noeffectBody () {
        return `vec4 newColour = vec4(pixel.rgb, 1.0);`
    }

    static get invertedBody () {
        return `
            gl_FragColor.rgb = 1.0 - gl_FragColor.rgb;
        `
    }

    static get reducedColoursBody () {
        return `
            gl_FragColor.r = float(floor(gl_FragColor.r * 5.0 ) / 5.0);
            gl_FragColor.g = float(floor(gl_FragColor.g * 5.0 ) / 5.0);
            gl_FragColor.b = float(floor(gl_FragColor.b * 5.0 ) / 5.0);
        `
    }

    static get addBackground () {
        return `
            gl_FragColor.r += pixel.r * 0.9;
            gl_FragColor.g += pixel.g * 0.9;
            gl_FragColor.b += pixel.b * 0.9;
        `
    }

    /*
    1   0   -1
    2   0   -2
    1   0   -1
    */
    static get sobel3x3Body () {
        return `
            vec4 n[9];
            n[0] = texture2D(texture, vUv + vec2(0.0, 0.0) );
            n[1] = texture2D(texture, vUv + vec2(w, 0.0) );
            n[2] = texture2D(texture, vUv + vec2(2.0*w, 0.0) );
            n[3] = texture2D(texture, vUv + vec2(0.0*w, h) );
            n[4] = texture2D(texture, vUv + vec2(w, h) );
            n[5] = texture2D(texture, vUv + vec2(2.0*w, h) );
            n[6] = texture2D(texture, vUv + vec2(0.0, 2.0*h) );
            n[7] = texture2D(texture, vUv + vec2(w, 2.0*h) );
            n[8] = texture2D(texture, vUv + vec2(2.0*w, 2.0*h) );

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

            vec3 sobel = vec3(sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)));
            sobel.r = surfaceR * (1.0 - sobel.r) + sobel.r * edgeR;
            sobel.g = surfaceG * (1.0 - sobel.g) + sobel.g * edgeG;
            sobel.b = surfaceB * (1.0 - sobel.b) + sobel.b * edgeB;

            vec4 newColour = vec4( sobel, 1.0 );
        `
    }

    /*
    2   1   0   -1  -2
    3   2   0   -2  -3
    4   3   0   -3  -4
    3   2   0   -2  -3
    2   1   0   -1  -2
    */
    static get sobel5x5Body () {
        return `
            vec4 n[25];

            for (int i=-2; i<=2; i++) {
                for (int j=-2; j<=2; j++) {
                    n[(j+2)+(i+2)*5] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );
                }
            }

            vec4 sobel_x = 2.0*n[4] + 3.0*n[9] + 4.0*n[14] + 3.0*n[19] + 2.0*n[24] +
                           n[3] + 2.0*n[8] + 3.0*n[13] + 2.0*n[18] + n[23] -
                           (2.0*n[0] + 3.0*n[5] + 4.0*n[10] + 3.0*n[15] + 2.0*n[20] +
                           n[1] + 2.0*n[6] + 3.0*n[11] + 2.0*n[16] + n[21]);

            vec4 sobel_y = 2.0*n[0] + n[1] + n[3] + n[4] +
                           3.0*n[5] + 2.0*n[6] + 2.0*n[8] + 3.0*n[9] -
                           (3.0*n[15] + 2.0*n[16] + 2.0*n[18] + 3.0*n[19] +
                            2.0*n[20] + n[21] + n[23] + n[24]);

            float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0 / 9.0;
            float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0 / 9.0;

            sobel_x.r = avg_x;
            sobel_x.g = avg_x;
            sobel_x.b = avg_x;
            sobel_y.r = avg_y;
            sobel_y.g = avg_y;
            sobel_y.b = avg_y;

            vec3 sobel = vec3(sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)));
            sobel.r = surfaceR * (1.0 - sobel.r) + sobel.r * edgeR;
            sobel.g = surfaceG * (1.0 - sobel.g) + sobel.g * edgeG;
            sobel.b = surfaceB * (1.0 - sobel.b) + sobel.b * edgeB;

            vec4 newColour = vec4(sobel, 1.0 );
        `
    }

    static get freichenBody () {
        return `

            vec2 texel = vec2(1.0 / width, 1.0 / height);
            mat3 I;
            mat3 G[9];
            float cnv[9];

            G[0] = mat3( 0.3535533845424652, 0, -0.3535533845424652, 0.5, 0, -0.5, 0.3535533845424652, 0, -0.3535533845424652 );
            G[1] = mat3( 0.3535533845424652, 0.5, 0.3535533845424652, 0, 0, 0, -0.3535533845424652, -0.5, -0.3535533845424652 );
            G[2] = mat3( 0, 0.3535533845424652, -0.5, -0.3535533845424652, 0, 0.3535533845424652, 0.5, -0.3535533845424652, 0 );
            G[3] = mat3( 0.5, -0.3535533845424652, 0, -0.3535533845424652, 0, 0.3535533845424652, 0, 0.3535533845424652, -0.5 );
            G[4] = mat3( 0, -0.5, 0, 0.5, 0, 0.5, 0, -0.5, 0 );
            G[5] = mat3( -0.5, 0, 0.5, 0, 0, 0, 0.5, 0, -0.5 );
            G[6] = mat3( 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.6666666865348816, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204 );
            G[7] = mat3( -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, 0.6666666865348816, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408 );
            G[8] = mat3( 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408 );

            // Get intensity
            I[0][0] = length(texture2D(texture, vUv + texel * vec2(-1.0,-1.0) ).rgb);
            I[0][1] = length(texture2D(texture, vUv + texel * vec2(-1.0,0.0) ).rgb);
            I[0][2] = length(texture2D(texture, vUv + texel * vec2(-1.0,1.0) ).rgb);
            I[1][0] = length(texture2D(texture, vUv + texel * vec2(0.0,-1.0) ).rgb);
            I[1][1] = length(texture2D(texture, vUv + texel * vec2(0.0,0.0) ).rgb);
            I[1][2] = length(texture2D(texture, vUv + texel * vec2(0.0,1.0) ).rgb);
            I[2][0] = length(texture2D(texture, vUv + texel * vec2(1.0,-1.0) ).rgb);
            I[2][1] = length(texture2D(texture, vUv + texel * vec2(1.0,0.0) ).rgb);
            I[2][2] = length(texture2D(texture, vUv + texel * vec2(1.0,1.0) ).rgb);

            // Convolve
            cnv[0] = pow(dot(G[0][0], I[0]) + dot(G[0][1], I[1]) + dot(G[0][2], I[2]) , 2.0);
            cnv[1] = pow(dot(G[1][0], I[0]) + dot(G[1][1], I[1]) + dot(G[1][2], I[2]) , 2.0);
            cnv[2] = pow(dot(G[2][0], I[0]) + dot(G[2][1], I[1]) + dot(G[2][2], I[2]) , 2.0);
            cnv[3] = pow(dot(G[3][0], I[0]) + dot(G[3][1], I[1]) + dot(G[3][2], I[2]) , 2.0);
            cnv[4] = pow(dot(G[4][0], I[0]) + dot(G[4][1], I[1]) + dot(G[4][2], I[2]) , 2.0);
            cnv[5] = pow(dot(G[5][0], I[0]) + dot(G[5][1], I[1]) + dot(G[5][2], I[2]) , 2.0);
            cnv[6] = pow(dot(G[6][0], I[0]) + dot(G[6][1], I[1]) + dot(G[6][2], I[2]) , 2.0);
            cnv[7] = pow(dot(G[7][0], I[0]) + dot(G[7][1], I[1]) + dot(G[7][2], I[2]) , 2.0);
            cnv[8] = pow(dot(G[8][0], I[0]) + dot(G[8][1], I[1]) + dot(G[8][2], I[2]) , 2.0);

            float M = (cnv[0] + cnv[1]) + (cnv[2] + cnv[3]);
            float S = (cnv[4] + cnv[5]) + (cnv[6] + cnv[7]) + (cnv[8] + M);

            vec3 freiChen = vec3(sqrt(M/S)) * 2.0;
            freiChen.r = surfaceR * (1.0 - freiChen.r) + freiChen.r * edgeR;
            freiChen.g = surfaceG * (1.0 - freiChen.g) + freiChen.g * edgeG;
            freiChen.b = surfaceB * (1.0 - freiChen.b) + freiChen.b * edgeB;

            vec4 newColour = vec4(freiChen, 1.0 );
        `
    }


    static get matrixBody () {
        return `

            // ==============
            // Edge detection
            // ==============
            vec4 n[9];
            n[0] = texture2D(texture, vUv + vec2(0.0, 0.0) );
            n[1] = texture2D(texture, vUv + vec2(w, 0.0) );
            n[2] = texture2D(texture, vUv + vec2(2.0*w, 0.0) );
            n[3] = texture2D(texture, vUv + vec2(0.0*w, h) );
            n[4] = texture2D(texture, vUv + vec2(w, h) );
            n[5] = texture2D(texture, vUv + vec2(2.0*w, h) );
            n[6] = texture2D(texture, vUv + vec2(0.0, 2.0*h) );
            n[7] = texture2D(texture, vUv + vec2(w, 2.0*h) );
            n[8] = texture2D(texture, vUv + vec2(2.0*w, 2.0*h) );

            vec4 sobel_x = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
            vec4 sobel_y = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);

            float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 12.0;
            float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 12.0;

            vec3 sobel = vec3(0, sqrt((avg_x * avg_x) + (avg_y * avg_y)) , 0);
            // ==============


            // ==============
            // Calculate highlighed columns values' intensities (looks better)
            // ==============
            float colIndex = floor(vUv.x*1000.0 / 10.0);
            float rowIndex = floor(vUv.y*1000.0 / 10.0);

            float colIntensity = 0.05;

            for (int i=0; i<25; i++) {
                if (lightCols[i] == colIndex) {
                    for (int j=0; j<20; j++) {
                        if (lightColsEnds[i] <= rowIndex) {
                            if (lightColsEnds[i] >= rowIndex-1.0 && lightColsEnds[i] <= rowIndex+1.0 ) {
                                colIntensity = 10.05;
                            } else {
                                colIntensity = 1.2 * min(max(lightColsEnds[i], 0.0) / rowIndex, 0.5) + 0.05;
                            }
                        }
                    }
                }
            }
            // ==============

            // ==============
            // Render the characters
            // ==============
            int modX = int((mod(vUv.x*1000.0, 10.0)*10.0)/10.0);
            int modY = int((mod( (vUv.y+colIndex*rand(vec2(colIndex, colIndex))) * 1000.0, 10.0)*10.0)/10.0);

            float x = floor(vUv.x*1000.0 / 10.0);
            float y = floor(vUv.y*1000.0 / 10.0);

            vec4 texRand = texture2D(texture, vec2(x, y));
            int charSelected = int(rand(vec2(x * texRand.r, y * texRand.r)) *2.0);

            float val = 0.0;

            if (charSelected==0) {
                // Draw '0'
                if ((modY==1 || modY==8) && (modX>=3 && modX<=6) ||
                    (modY>=2 && modY<=7) && (modX==2 || modX==3 || modX==6 || modX==7)) {
                    val = 1.0;
                }
            } else {
                // Draw '1'
                if ((modY==7 || modY==6) && modX==4 ||
                    (modX==5 || modX==6) && modY>0 && modY<9 ||
                    (modY==2 || modY==1) && modX>=4 && modX<=7) {
                    val = 1.0;
                }
            }

            sobel.g += val * (sobel.g + colIntensity);
            sobel.r = 0.3 * val * (sobel.g + colIntensity);
            sobel.b = sobel.r;

            // ==============

            vec4 newColour = vec4( sobel, 1.0 );
        `
    }

    static get fireBody () {
        return `

            // Get the pixel below by this amount
            const int amount = 15;
            vec4 firePixel = vec4(0.0, 0.0, 0.0, 1.0);

            vec4 distort = texture2D(fireTex, vec2(vUv.x*4.0, (vUv.y-fireTimer/2.0)*4.0));
            vec4 noise = texture2D(noiseTex, vec2(vUv.x*4.0, (vUv.y-fireTimer)*4.0));

            // Go down a few pixels and find if there is a line within ^^ amount of pixels
            for (int r=0; r<amount; r++) {
                vec4 n[9];
                float fr = float(r) * h;
                n[0] = texture2D(texture, vUv + vec2(0.0, 0.0 - fr) );
                n[1] = texture2D(texture, vUv + vec2(w, 0.0 - fr) );
                n[2] = texture2D(texture, vUv + vec2(2.0*w, 0.0 - fr) );
                n[3] = texture2D(texture, vUv + vec2(0.0*w, h - fr) );
                n[4] = texture2D(texture, vUv + vec2(w, h - fr) );
                n[5] = texture2D(texture, vUv + vec2(2.0*w, h - fr) );
                n[6] = texture2D(texture, vUv + vec2(0.0, 2.0*h - fr) );
                n[7] = texture2D(texture, vUv + vec2(w, 2.0*h - fr) );
                n[8] = texture2D(texture, vUv + vec2(2.0*w, 2.0*h - fr) );

                vec4 sobel_x = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
                vec4 sobel_y = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);

                float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;
                float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;
                float sobel = sqrt(avg_x*avg_x) + sqrt(avg_y*avg_y) * noise.b;


                if (sobel > 0.5) {
                    firePixel.r = (1.0 - float(r) / float(amount)) * distort.r * sobel;
                    firePixel.g = firePixel.r / 2.0;

                    if (r<amount/2) {
                        firePixel.g += (1.0 - float(r) / float(amount/2)) * distort.r * noise.b / 8.0;
                        firePixel.r += (1.0 - float(r) / float(amount/2)) * distort.r * noise.b / 8.0;
                    }

                    if (r<2) {
                        firePixel.r = firePixel.r * 1.1;
                        firePixel.g = firePixel.g * 1.3;
                    }

                    break;
                }
            }

            vec4 newColour = pixel / 3.0;
            newColour.r += firePixel.r;
            newColour.g += firePixel.g;
        `
    }

    static get colourBlindnessBody () {

        // http://web.archive.org/web/20081014161121/http://www.colorjack.com/labs/colormatrix/
        const effects = {
            protanopia: [0.56667, 0.43333, 0,   0.55833, 0.44167, 0,   0, 0.24167, 0.75833],
            protanomaly: [0.81667, 0.18333, 0,  0.33333, 0.66667, 0,  0, 0.125, 0.875],
            deuteranopia: [0.625, 0.375, 0,   0.70, 0.30, 0,  0, 0.30, 0.70],
            deuteranomaly: [0.80, 0.20, 0,   0.25833, 0.74167, 0,  0, 0.14167, 0.85833],
            tritanopia: [0.95, 0.05, 0,   0, 0.43333, 0.56667,   0, 0.475, 0.525],
            tritanomaly: [0.96667, 0.03333, 0,   0, 0.73333, 0.26667,   0, 0.18333, 0.81667],
            achromatopsia: [0.299, 0.587, 0.114,   0.299, 0.587, 0.114,   0.299, 0.587, 0.114],
            achromatomaly: [0.618, 0.32, 0.062,   0.163, 0.775, 0.062,   0.163, 0.320, 0.516]
        }
        const M = effects[this.colourBlindness]

        return `
            gl_FragColor.r = gl_FragColor.r * ${M[0].toFixed(5)} + gl_FragColor.g * ${M[1].toFixed(5)} + gl_FragColor.b * ${M[2].toFixed(5)};
            gl_FragColor.g = gl_FragColor.r * ${M[3].toFixed(5)} + gl_FragColor.g * ${M[4].toFixed(5)} + gl_FragColor.b * ${M[5].toFixed(5)};
            gl_FragColor.b = gl_FragColor.r * ${M[6].toFixed(5)} + gl_FragColor.g * ${M[7].toFixed(5)} + gl_FragColor.b * ${M[8].toFixed(5)};
        `
    }
}