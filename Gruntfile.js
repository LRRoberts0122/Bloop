module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		sass: {
			dist: {
				options: {
					style: 'compressed',
					sourcemap: 'none',
					banner: '/* &copy; 2014 Lindsay Roberts http://www.designbyfish.com */\n'
				},
				files: {
					'www/css/main.css' : 'assets/sass/main.scss'
				}
			}
		},
		uglify: {
			options: {
				banner: '/* &copy; 2014 Lindsay Roberts http://www.designbyfish.com/ */\n'
			},
			my_target: {
				files: {
					'www/js/main.min.js' : ['assets/js/main.js'],
					'www/js/ie10-viewport-bug-workaround.min.js' : ['assets/js/ie10-viewport-bug-workaround.js'],
					'www/js/bootstrap.min.js' : ['bower_components/bootstrap-sass-official/assets/javascripts/bootstrap.js']
				}
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	
	grunt.registerTask('default', ['sass', 'uglify']);
};