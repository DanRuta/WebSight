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

        uglify: {
            my_target: {
                options: {
                    sourceMap: true,
                    mangle: false,
                },
                files: {
                    "dist/sobel-sight.min.js" : ["dev/sobel.js"],
                    // "dist/dependencies.min.js" : ["lib/three.min.js", "dist/dependencies.concat.js"]
                }
            }
        },

        watch: {
            dev: {
                files: ["dev/sobel.js"],
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

    grunt.registerTask("default", ["watch"])
}