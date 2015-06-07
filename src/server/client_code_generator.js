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

// map of input opts to client code
var clientCodeCache = {};

/**
 * Stringify an object and include functions
 * @param obj
 */
function stringifyWithFunctions(obj) {
    return JSON.stringify(obj, function (key, value) {
        if (!!(value && value.constructor && value.call && value.apply)) {  // if function
            return value.toString();
        }
        else {
            return value;
        }
    });
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
    opts.pauseEvent = opts.pauseEvent || 'PrebootPause';
    opts.resumeEvent = opts.resumeEvent || 'PrebootResume';
    opts.completeEvent = opts.completeEvent || 'BootstrapComplete';

    // set default strategies
    opts.listen = opts.listen || [];
    opts.replay = opts.replay || [];

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

    // if keypress, add strategy for capturing all keypress events
    if (opts.keypress) {
        opts.listen.push({
            name: 'list',
            eventsBySelector: {
                'input[type="text"]':   ['keypress', 'keyup', 'keydown'],
                'textarea':             ['keypress', 'keyup', 'keydown']
            }
        })
    }

    // if we want to wait pause bootstrap completion while the user is typing
    if (opts.pauseOnTyping) {
        opts.listen.push({
            name: 'list',
            eventsBySelector: {
                'input[type="text"]':   ['focus'],
                'textarea':             ['focus']
            },
            doNotReplay: true,
            dispatchEvent: opts.pauseEvent
        });
        opts.listen.push({
            name: 'list',
            eventsBySelector: {
                'input[type="text"]':   ['blur'],
                'textarea':             ['blur']
            },
            doNotReplay: true,
            dispatchEvent: opts.resumeEvent
        });
    }

    // set default values if none exist
    if (!opts.listen.length) {
        opts.listen.push({ name: 'attributes' });
    }
    if (!opts.replay.length) {
        opts.replay.push({ name: 'rerender' });
    }

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
    var listenStrategiesRequired = {};
    var replayStrategiesRequired = {};

    // client code entry file
    var b = browserify({
        entries: ['src/client/preboot_client.js'],
        standalone: 'preboot'
    });

    // add the listen strategy files to the bundle
    var i, strategy, name;
    for (i = 0; i < opts.listen.length; i++) {
        strategy = opts.listen[i];
        name = strategy.name;

        if (listenStrategies[name] && !listenStrategiesRequired[name]) {
            b.require('./src/client/listen/listen_by_' + name + '.js',
                { expose: './listen/listen_by_' + name + '.js' });
            listenStrategiesRequired[name] = true;
        }
    }

    // add the replay strategy files to teh bundle
    for (i = 0; i < opts.replay.length; i++) {
        strategy = opts.replay[i];
        name = strategy.name;

        if (replayStrategies[name] && !replayStrategiesRequired[name]) {
            b.require('./src/client/replay/replay_after_' + name + '.js',
                { expose: './replay/replay_after_' + name + '.js' });
            replayStrategiesRequired[name] = true;
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

    var outputStream = b.bundle()
        .pipe(source('src/client/preboot_client.js'))
        .pipe(buffer())
        .pipe(insert.append('\n\npreboot.init(' + stringifyWithFunctions(opts) + ');\n\n'));

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

    // check cache first
    var cacheKey = JSON.stringify(opts);
    if (clientCodeCache[cacheKey]) {
        return new Q(clientCodeCache[cacheKey]);
    }

    // get the client code
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

            clientCodeCache[cacheKey] = clientCode;
            deferred.resolve(clientCode);
        });

    return deferred.promise;
}

module.exports = {
    getPrebootOptions: stringifyWithFunctions,
    getClientCodeStream: getClientCodeStream,
    getClientCode: getClientCode
};