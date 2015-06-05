/**
 * Author: Jeff Whelpley
 * Date: 2/25/14
 *
 * Build for fakeblock
 */
var gulp    = require('gulp');
var taste   = require('taste');
var batter  = require('batter');

batter.whip(gulp, taste, {
    targetDir: __dirname + '/src',
    unitTargetCode: 'src/**/*.js'
});