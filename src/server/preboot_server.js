/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Main node.js interface to the preboot library. This can be used
 * either by a command line build tool or server side code in order
 * to generate the client side preboot JS that should be inserted
 * inline into a script tag in the HEAD section of an HTML document.
 */
var Q           = require('q');
//var gulp        = require('gulp');
var concat      = require('gulp-concat');
var uglify      = require('gulp-uglify');
//var buffer      = require('vinyl-buffer');
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

    return 'var prebootOptions = ' + optsStr;
}

/**
 * Get stream of string for prebootOptions
 * @param opts
 * @returns {*}
 */
function getPrebootOptionsStream(opts) {
    var s = new stream.Readable();
    s._read = function noop() {};
    s.push(getPrebootOptions(opts));
    s.push(null);
    return s;
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

    //return clientCodeStream.bundle();

    var outputStream = streamqueue(objMode,
        getPrebootOptionsStream(opts),  // var prebootOptions = {}
        clientCodeStream.bundle()       // the browserified client code
    )
        .pipe(concat('preboot.js'));

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
        .on('data', function (chunk) {
            clientCode += chunk;
        })
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

// functions exposed as API to the preboot library when required by node
module.exports = {
    getPrebootOptions: getPrebootOptions,
    getPrebootOptionsStream: getPrebootOptionsStream,
    getClientCodeStream: getClientCodeStream,
    getClientCode: getClientCode
};