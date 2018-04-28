module.exports = grunt => {
    grunt.initConfig({
        concat: {
            options: {
                sourceMap: true
            },
            "js": {
                src: ["dev/websight.js", "dev/filters.js", "dev/ui.js"],
                dest: "dist/websight.concat.js"
            },
            "deps": {
                src: ["lib/jscolor.js", "lib/StereoEffect.js", "lib/VREffect.js"],
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
                    "dist/websight.min.js" : ["dist/websight.concat.js"],
                    "dist/dependencies.min.js" : ["lib/three.min.js", "dist/dependencies.concat.js"]
                }
            }
        },

        watch: {
            dev: {
                files: ["dev/*.js"],
                tasks: ["concat:js", "uglify"]
            },
            deps: {
                files: ["lib/*.js"],
                tasks: ["concat:deps", "uglify"]
            }
        }
    })

    grunt.loadNpmTasks("grunt-contrib-watch")
    grunt.loadNpmTasks('grunt-contrib-concat')
    grunt.loadNpmTasks('grunt-contrib-uglify-es')

    grunt.registerTask("default", ["watch"])
}