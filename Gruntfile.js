var path = require('path')
module.exports = function(grunt){
    grunt.initConfig({
        bower : {
            install : {
                options:{
                    copy: true,
                    targetDir: './client/Vendor',
                    layout: function(type, component, source){
                        console.log(source);
                        if (source.endsWith(".js")) {
                            return "Scripts";
                        }
                        else if (source.endsWith(".css")) {
                            return "Css"
                        }
                        else if(source.indexOf('glyphicons') !== -1) {
                            return "fonts"
                        }
                        else{
                            return ".useless"
                        }
                    },
                    install: true,
                    verbose: false,
                    prune: false,
                    cleanTargetDir: false,
                    cleanBowerDir: false,
                    bowerOptions: {}
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-bower-task');

    grunt.registerTask('default', []);
};