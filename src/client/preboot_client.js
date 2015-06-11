/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This is the main entry point for the client side bootstrap library.
 * This will be browserified and then inlined in the head of an HTML
 * document along with a call to this module that passes in the
 * browser document object and all the options. See the
 * README for details on how this works
 */
var dom             = require('./dom');
var eventManager    = require('./event_manager');
var bufferManager   = require('./buffer/buffer_manager');

// in each client-side module, we store state in an object so we can mock
// it out during testing and easily reset it as necessary
var state = {
    canComplete: true,      // set to false if preboot paused through an event
    completeCalled: false,  // set to true once the completion event has been raised
    freeze: null            // only used if freeze option is passed in
};

/**
 * Get function to run once window has loaded
 * @param opts
 * @returns {Function}
 */
function getOnLoadHandler(opts) {
    return function onLoad() {

        // re-initialize dom now that we have the body
        dom.init({ window: window });

        // make sure the app root is set
        dom.updateRoots(dom.getDocumentNode(opts.appRoot));

        // if we are buffering, need to switch around the divs
        if (opts.buffer) {
            bufferManager.prep(opts);
        }

        // if we could potentiall freeze the UI, we need to prep (i.e. to add divs for overlay, etc.)
        if (opts.freeze) {
            state.freeze.prep(opts);
        }

        // start listening to events
        eventManager.startListening(opts);
    };
}

/**
 * Get a function to run once bootstrap has completed
 * @param opts
 * @returns {Function}
 */
function getBootstrapCompleteHandler(opts) {
    return function onComplete() {

        //TODO: in future can have client app pass data to preboot through BootstrapComplete event

        // track that complete has been called
        state.completeCalled = true;

        // if we can't complete (i.e. preboot paused), just return right away
        if (!state.canComplete) { return; }

        // else we can complete, so get started with events
        eventManager.replayEvents(opts);                        // replay events on client DOM
        if (opts.buffer) { bufferManager.switchBuffer(opts); }  // switch from server to client buffer
        if (opts.freeze) { state.freeze.cleanup(); }            // cleanup freeze divs like overlay
        eventManager.cleanup(opts);                             // cleanup event listeners
    };
}

/**
 * Pause the completion process
 */
function pauseCompletion() {
    state.canComplete = false;
}

/**
 * Resume the completion process; if complete already called,
 * call it again right away.
 *
 * @param opts
 * @returns {Function}
 */
function getResumeCompleteHandler(opts) {
    return function onResume() {
        state.canComplete = true;

        if (state.completeCalled) {

            // using setTimeout to fix weird bug where err thrown on
            // serverRoot.remove() in buffer switch
            setTimeout(function () {
                getBootstrapCompleteHandler(opts)();
            }, 10);
        }
    };
}

/**
 * Start preboot
 * @param opts
 */
function start(opts) {

    // freeze strategy is used at this top level, so need to get ref
    state.freeze = (typeof opts.freeze === 'string') ?
        require('./freeze/freeze_with_' + opts.freeze + '.js') :
        opts.freeze;

    // set up handlers for different preboot lifecycle events
    dom.init({ window: window });
    dom.onLoad(getOnLoadHandler(opts));
    dom.on(opts.pauseEvent, pauseCompletion);
    dom.on(opts.resumeEvent, getResumeCompleteHandler(opts));
    dom.on(opts.completeEvent, getBootstrapCompleteHandler(opts));
}

// only expose start
module.exports = {
    eventManager: eventManager,
    bufferManager: bufferManager,
    start: start
};
