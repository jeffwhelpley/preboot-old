/**
 * Author: Jeff Whelpley
 * Date: 6/5/15
 *
 * Build the client side preboot code and put it in the dist folder
 */
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var clientCodeGenerator = require('../src/server/client_code_generator');

module.exports = function (gulp, opts) {
    var prebootOptions = opts.prebootOptions || {};

    return function () {
        return clientCodeGenerator.getClientCodeStream(prebootOptions)
            .pipe(rename('preboot.js'))
            .pipe(gulp.dest('./dist'));
    };
};