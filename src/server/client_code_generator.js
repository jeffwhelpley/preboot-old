/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 6/5/15
 *
 * Used to generate client code on the server
 */
var Q           = require('q');
var gulp        = require('gulp');
var concat      = require('gulp-concat');
var uglify      = require('gulp-uglify');
var streamify   = require('gulp-streamify');
var insert      = require('gulp-insert');
var source      = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var eventStream = require('event-stream');
var through     = require('through2');
var browserify  = require('browserify');
var stream      = require('stream');
var streamqueue = require('streamqueue');
var objMode     = { objectMode: true };

/**
 * Generate preboot options from the input options
 * @param opts
 */
function getPrebootOptions(opts) {
    var optsStr = JSON.stringify(opts, function (key, value) {

        // if function do toString()
        if (!!(value && value.constructor && value.call && value.apply)) {
            return value.toString();
        }
        else {
            return value;
        }
    });

    return 'var prebootOptions = ' + optsStr + ';';
}

/**
 * Get the client code as a stream
 * @param opts
 * @returns {*}
 */
function getClientCodeStream(opts) {
    opts = opts || {};

    var clientCodeStream = browserify({ entries: 'src/client/preboot_client.js' });

    if (!opts.focus) {
        clientCodeStream.ignore('focus_manager.js');
    }

    if (!opts.buffer) {
        clientCodeStream.ignore('buffer_manager.js');
    }

    if (!opts.focus && opts.replay !== 'rerender') {
        clientCodeStream.ignore('find_client_node.js');
    }

    var outputStream = clientCodeStream.bundle()
        .pipe(source('src/client/preboot_client.js'))
        .pipe(buffer())
        .pipe(insert.prepend(getPrebootOptions(opts)));

    // uglify if the option is passed in
    return opts.uglify ? outputStream.pipe(uglify()) : outputStream;
}

/**
 * Get client code as a string
 * @param opts
 * @param done
 * @return Promise
 */
function getClientCode(opts, done) {
    var deferred = Q.defer();
    var clientCode = '';

    getClientCodeStream(opts)
        .pipe(eventStream.map(function (file, cb) {
            clientCode += file.contents;
            cb(null, file);
        }))
        .on('error', function (err) {
            if (done) {
                done(err);
            }

            deferred.reject(err);
        })
        .on('end', function () {
            if (done) {
                done(null, clientCode);
            }

            deferred.resolve(clientCode);
        });

    return deferred.promise;
}

module.exports = {
    getPrebootOptions: getPrebootOptions,
    getClientCodeStream: getClientCodeStream,
    getClientCode: getClientCode
};