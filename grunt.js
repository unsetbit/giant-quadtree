module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    hug: {
      client: {
        src: './src/quadtree.js',
        dest: 'dist/quadtree-expanded.js',
        exportedVariable: 'Quadtree',
        exports: './src/quadtree.js'
      },
      clientExport: {
        src: './src/quadtree.js',
        dest: 'dist/quadtree-module.js',
        exports: './src/quadtree.js'
      }
    }, 
    min: {
      client: {
        src: ['<config:hug.client.dest>'],
        dest: 'dist/quadtree.js'
      }
    },
    watch: {
      all: {
        files: './src/**/*',
        tasks: 'hug'
      }
    }
  });

  grunt.loadNpmTasks('grunt-hug');

  grunt.registerTask('dev', 'hug watch');
  grunt.registerTask('default', 'hug min');
};