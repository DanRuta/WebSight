module.exports = grunt => {
    grunt.initConfig({
        concat: {
            options: {
                sourceMap: true
            },
            "deps": {
                src: ["lib/*.js", "!lib/three.min.js"],
                dest: "dist/dependencies.concat.js"
            }
        },

        babel: {
            options: {
                presets: ["env"]
            },
            dist: {
                files: {
                    "dist/sobel.es5.js": ["dev/sobel.js"]
                }
            }
        },

        uglify: {
            my_target: {
                options: {
                    sourceMap: true,
                    mangle: false,
                },
                files: {
                    "dist/sobel-sight.min.js" : ["dist/sobel.es5.js"],
                    // "dist/dependencies.min.js" : ["lib/three.min.js", "dist/dependencies.concat.js"]
                }
            }
        },

        watch: {
            dev: {
                files: ["dev/sobel.js"],
                tasks: ["concat", "babel", "uglify"]
            },
            deps: {
                files: ["lib/*.js"],
                tasks: ["concat:deps", "uglify"]
            }
        }
    })

    grunt.loadNpmTasks("grunt-babel")
    grunt.loadNpmTasks("grunt-contrib-watch")
    grunt.loadNpmTasks('grunt-contrib-concat')
    grunt.loadNpmTasks('grunt-contrib-uglify')

    grunt.registerTask("default", ["watch"])
}