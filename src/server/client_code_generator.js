/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 6/5/15
 *
 * Used to generate client code on the server
 */
var Q           = require('q');
var _           = require('lodash');
var uglify      = require('gulp-uglify');
var insert      = require('gulp-insert');
var source      = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var eventStream = require('event-stream');
var browserify  = require('browserify');

/* jshint camelcase: false */
var listenStrategies = { attributes: true, event_bindings: true, list: true };
var replayStrategies = { hydrate: true, rerender: true };

/**
 * Stringify an object and include functions
 * @param obj
 */
function stringifyWithFunctions(obj) {
    var optsStr = JSON.stringify(obj, function (key, value) {
        if (!!(value && value.constructor && value.call && value.apply)) {  // if function
            return value.toString();
        }
        else {
            return value;
        }
    });

    return 'var prebootOptions = ' + optsStr + ';\n\n';
}

/**
 * Normalize options so user can enter shorthand and it is
 * expanded as appropriate for the client code
 *
 * @param opts
 * @returns {*|{}}
 */
function normalizeOptions(opts) {
    opts = opts || {};

    // set default strategies
    opts.listen = opts.listen || [{ name: 'attributes' }];
    opts.replay = opts.replay || [{ name: 'rerender' }];

    // if strategies are strings turn them into arrays
    if (_.isString(opts.listen)) {
        opts.listen = [{ name: opts.listen }];
    }
    if (_.isString(opts.replay)) {
        opts.replay = [{ name: opts.replay }];
    }

    // loop through strategies and convert strings to objects
    opts.listen = opts.listen.map(function (val) {
        return _.isString(val) ? { name: val } : val;
    });
    opts.replay = opts.replay.map(function (val) {
        return _.isString(val) ? { name: val } : val;
    });

    return opts;
}

/**
 * Get the client code as a stream. The tricky parts here is how we
 * will only include the code in the final bundle that is actually
 * being referenced.
 *
 * @param opts
 * @returns {*}
 */
function getClientCodeStream(opts) {
    opts = normalizeOptions(opts);

    // client code entry file
    var b = browserify({
        entries: ['src/client/preboot_client.js']
    });

    // add the listen strategy files to the bundle
    var i, strategy;
    for (i = 0; i < opts.listen.length; i++) {
        strategy = opts.listen[i];

        if (listenStrategies[strategy.name]) {
            b.require('./src/client/listen/listen_by_' + strategy.name + '.js');
        }
    }

    // add the replay strategy files to teh bundle
    for (i = 0; i < opts.replay.length; i++) {
        strategy = opts.replay[i];

        if (replayStrategies[strategy.name]) {
            b.require('./src/client/replay/replay_after_' + strategy.name + '.js');
        }
    }

    // remove the focus code if we are not calling it
    if (!opts.focus) {
        b.ignore('focus_manager.js');
    }

    // remove the buffer code if we are not calling it
    if (!opts.buffer) {
        b.ignore('buffer_manager.js');
    }

    // remove the find client code if we are not calling it
    if (!opts.focus && opts.replay !== 'rerender') {
        b.ignore('find_client_node.js');
    }

    var outputStream = b.bundle()
        .pipe(source('src/client/preboot_client.js'))
        .pipe(buffer())
        .pipe(insert.prepend(stringifyWithFunctions(opts)));

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
    getPrebootOptions: stringifyWithFunctions,
    getClientCodeStream: getClientCodeStream,
    getClientCode: getClientCode
};