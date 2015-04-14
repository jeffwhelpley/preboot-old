var gulp    = require('gulp');
var connect = require('gulp-connect');

gulp.task('server', function() {
    connect.server();
});

gulp.task('default', ['server']);