module.exports = grunt => {
    grunt.initConfig({
        concat: {
            options: {
                sourceMap: true
            },
            "js": {
                src: ["dev/js/sobel-js.js"],
                dest: "dist/sobel-sight-js.concat.js"
            },
            "wa": {
                src: ["dev/js/sobel-wa.js", "dist/ssWASM.js"],
                dest: "dist/sobel-sight-wa.concat.js"
            },
            "vr": {
                src: ["dev/js/sobel-vr.js"],
                dest: "dist/sobel-sight-vr.concat.js"
            },
            // "deps": {
            //     src: ["lib/*.js", "!lib/three.min.js"],
            //     dest: "dist/dependencies.concat.js"
            // }
        },

        uglify: {
            my_target: {
                options: {
                    sourceMap: false,
                    mangle: false,
                },
                files: {
                    "dist/sobel-sight-wa.min.js" : ["dist/sobel-sight-wa.concat.js"],
                    "dist/sobel-sight-js.min.js" : ["dist/sobel-sight-js.concat.js"],
                    "dist/sobel-sight-vr.min.js" : ["dist/sobel-sight-vr.concat.js"],
                    // "dist/dependencies.min.js" : ["lib/three.min.js", "dist/dependencies.concat.js"]
                }
            }
        },

        exec: {
            build: "C:/emsdk/emsdk_env.bat & echo Building... & emcc -o ./dist/ssWASM.js ./dev/cpp/emscripten.cpp -O3 -s ALLOW_MEMORY_GROWTH=1 -s WASM=1 -s NO_EXIT_RUNTIME=1 -std=c++1z"
        },

        watch: {
            cpp: {
                files: ["dev/cpp/*.cpp", "dev/cpp/*.h"],
                tasks: ["exec:build", "concat:wa", "uglify"]
            },
            js: {
                files: ["dev/js/*.js"],
                tasks: ["concat", "uglify"]
            },
            deps: {
                files: ["lib/*.js"],
                tasks: ["concat:deps", "uglify"]
            }
        }
    })

    grunt.loadNpmTasks("grunt-contrib-watch")
    grunt.loadNpmTasks('grunt-contrib-concat')
    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks("grunt-exec")

    grunt.registerTask("default", ["watch"])
}