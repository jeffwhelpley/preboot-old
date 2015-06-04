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
 */
var eventManager = require('./event_manager');
var focusManager = require('./focus/focus_manager');
var switchBuffer = require('./buffer/switch_buffer');

/**
 * This is called in the head section of HTML with the following params:
 * @param document Usually the browser document, but can be mocked for testing
 * @param opts An object that contain any of the following values:
 *              listen - An array of object that contains:
 *                          name - the name of the strategy (default attributes)
 *                          config - values passed into the strategy
 *                          getNodeEvents - a custom strategy implementation (params document and config)
*               replay - An array of object that contains:
 *                          name - the name of the strategy (default rerender)
 *                          config - values passed into the strategy
 *                          getNodeEvents - a custom strategy implementation (params document and config)
 *              focus - Boolean value if true, will keep track of focus on the page (true by default)
 *              buffer - Boolean value if true will switch buffers (see switch_buffer for details); default false
 *              completeEvent - Name of event that will be raised on the document
 *                       when the client application bootstrap has completed
 *
 */
module.exports = function prebootClient(document, opts) {
    opts = opts || {};                                      // set default value for opts

    eventManager.startListening(document, opts.listen);     // add all the event handlers

    if (opts.focus) {
        focusManager.trackFocus();                          // start tracking focus on the page
    }

    // listen for bootstrap complete event
    document.addEventListener(opts.completeEvent || 'BootstrapComplete', function () {
        eventManager.replayEvents(opts.replay);             // replay events

        if (opts.buffer) { switchBuffer(); }                // switch buffers if an option
        if (opts.focus) { focusManager.setFocus(); }        // set focus if an option

        eventManager.cleanup();                             // do final event cleanup
    });
};