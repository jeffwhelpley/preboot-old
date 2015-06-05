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
(function (document, opts) {
    var eventManager = require('./event_manager');
    var focusManager = require('./focus/focus_manager');
    var bufferManager = require('./buffer/buffer_manager');

    opts = opts || {};                                      // set default value for opts

    // get server and client roots used for comparing nodes for rerender strategy
    var serverRoot = document.querySelectorAll(opts.serverRoot || opts.clientRoot || 'body');
    var clientRoot = document.querySelectorAll(opts.clientRoot || opts.serverRoot || 'body');

    // as soon as the document loads, start running
    window.onload = function() {
        if (opts.buffer) {
            bufferManager.hideClient(document, opts.clientRoot);
        }

        eventManager.startListening(document, opts.listen);     // add all the event handlers

        if (opts.focus) {
            focusManager.startTracking(document);               // start tracking focus on the page
        }
    };

    // listen for bootstrap complete event
    document.addEventListener(opts.completeEvent || 'BootstrapComplete', function () {
        console.log('preboot got BootstrapComplete event');

        if (opts.focus) { focusManager.stopTracking(); }        // stop tracking focus so we retain the last focus

        // replay events on client DOM
        eventManager.replayEvents(document, opts.replay, serverRoot, clientRoot);

        // now that we have replayed the events, if a buffer exists switch it so client view displayed
        if (opts.buffer) {
            bufferManager.switchBuffer(document, opts.clientRoot, opts.serverRoot);
        }

        if (opts.focus) {                                       // set focus if an option
            focusManager.setFocus(document, serverRoot, clientRoot);
        }

        eventManager.cleanup();                                 // do final event cleanup
    });
})(window.document, window.prebootOptions);
