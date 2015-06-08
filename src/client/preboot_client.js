/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This is the main entry point for the client side bootstrap library.
 * This will be browserified and then inlined in the head of an HTML
 * document along with a call to this module that passes in the
 * browser document object and all the options. See the
 * preboot_server to see how this code is generated and inserted
 * into HTML. At a high level what is happening here is:
 *
 *      1) Start tracking events
 *      2) Start tracking focus
 *      3) Once bootstrap is complete:
 *              A) replay all events
 *              B) switch from the server buffer to the client buffer
 *              C) set focus at the last known location
 *              D) cleanup all resources
 *
 * Note that many of these steps are options and can be configured through
 * the opts input object. In the future we will optimize the amount of code
 * needed by doing custom builds where the code not needed would not be
 * included in the final client side JS generated.
 *
 * @param document
 * @param opts An object that contain any of the following values:
 *              listen - An array of objects that contain:
 *                          name - the name of the strategy (default attributes)
 *                          config - values passed into the strategy
 *                          getNodeEvents - a custom strategy implementation (params document and config)
 *              replay - An array of objects that contain:
 *                          name - the name of the strategy (default rerender)
 *                          config - values passed into the strategy
 *                          getNodeEvents - a custom strategy implementation (params document and config)
 *              focus - Boolean value if true, will keep track of focus on the page (true by default)
 *              buffer - Boolean value if true will switch buffers (see switch_buffer for details); default false
 *              keypress - Boolean value if true will capture all keypress events in all input[type=text] and textarea elements
 *              serverRoot - selector to get the server root node
 *              clientRoot - selector to get the client root node
 *              completeEvent - Name of event that will be raised on the document
 *                       when the client application bootstrap has completed
 */
var eventManager = require('./event_manager');
var focusManager = require('./focus/focus_manager');
var bufferManager = require('./buffer/buffer_manager');
var state = {
    canComplete: true,      // set to false if preboot paused through an event
    completeCalled: false   // set to true once the completion event has been raised
};

/**
 * Most of the options should have been normalized by the clientCodeGenerator, so if
 * no options here, throw error. Really all this is for is to add window/document
 * based objects to the opts.
 *
 * @param opts
 */
function normalizeOptions(opts) {
    var document = opts.document = window.document;
    opts.serverRoot = document.querySelectorAll(opts.serverRoot || opts.clientRoot || 'body')[0];
    opts.clientRoot = opts.clientRoot ? document.querySelectorAll(opts.clientRoot)[0] : opts.serverRoot;
}

/**
 * Get function to run once window has loaded
 * @param opts
 * @returns {Function}
 */
function getOnLoadHandler(opts) {
    return function onLoad() {

        normalizeOptions(opts);                                 // get the server and client roots

        if (opts.buffer) {
            bufferManager.hideClient(opts.clientRoot);          // make sure client root is hidden
        }

        eventManager.startListening(opts);                      // add all the event handlers

        if (opts.focus) {
            focusManager.startTracking(opts.document);          // start tracking focus on the page
        }
    };
}

/**
 * Get a function to run once bootstrap has completed
 * @param opts
 * @returns {Function}
 */
function getBootstrapCompleteHandler(opts) {
    return function onComplete() {

        // track that complete has been called and don't do anything if we can't complete
        state.completeCalled = true;
        if (!state.canComplete) { return; }

        // can complete, so run it
        if (opts.focus) { focusManager.stopTracking(); }        // stop tracking focus so we retain the last focus
        eventManager.replayEvents(opts);                        // replay events on client DOM
        if (opts.buffer) { bufferManager.switchBuffer(opts); }  // switch from server to client buffer
        if (opts.focus) { focusManager.setFocus(opts); }        // set focus on client buffer
        eventManager.cleanup();                                 // cleanup event listeners
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
    return function onPause() {
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
    window.onload = getOnLoadHandler(opts);
    window.document.addEventListener(opts.pauseEvent, pauseCompletion);
    window.document.addEventListener(opts.resumeEvent, getResumeCompleteHandler(opts));
    window.document.addEventListener(opts.completeEvent, getBootstrapCompleteHandler(opts));
}

// only expose start
module.exports = {
    eventManager: eventManager,
    focusManager: focusManager,
    bufferManager: bufferManager,
    start: start
};
