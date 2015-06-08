/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Handling events on the client side
 */
var state = {
    eventListeners: [],
    events: [],
    overlay: null
};

/**
 * Hide the overlay by setting to display none
 */
function hideOverlay() {
    if (state.overlay) {
        state.overlay.style.display = 'none';
    }
}

/**
 * Display overlay by sticking div at end of body
 * @param document
 * @param timeout - So that we can timeout quickly for unit tests
 */
function displayOverlay(document, timeout) {
    var overlay = state.overlay = document.createElement('div');
    var style = overlay.style;

    overlay.className = 'preboot-overlay';
    style.zIndex = '9999999';
    style.position = 'absolute';
    style.top = '0';
    style.left = '0';
    style.width = '100%';
    style.height = '100%';
    style.background = '#263741';
    style.opacity = '.27';
    document.body.appendChild(overlay);

    // hide overlay after 4 seconds regardless of whether bootstrap complete
    setTimeout(hideOverlay, (timeout || 4000));
}

/**
 * For a given node, add an event listener based on the given attribute. The attribute
 * must match the Angular pattern for event handlers (i.e. either (event)='blah()' or
 * on-event='blah'
 *
 * @param document
 * @param strategy
 * @param node
 * @param eventName
 */
function getEventHandler(document, strategy, node, eventName) {
    return function (event) {

        // we want to wait until client bootstraps so don't allow default action
        if (strategy.preventDefault) {
            event.preventDefault();
        }

        // if we want to raise an event that others can listen for
        if (strategy.dispatchEvent) {
            document.dispatchEvent(new window.Event(strategy.dispatchEvent));
        }

        // if callback provided for a custom action when an event occurs
        if (strategy.action) {
            strategy.action(node, event);
        }

        // if we should show overlay when user hits button so there is no further action
        if (strategy.overlay) {
            displayOverlay(document);
        }

        // we will record events for later replay unless explicitly marked as doNotReplay
        if (!strategy.doNotReplay) {
            state.events.push({
                node:       node,
                value:      strategy.trackValue ? node.value : null,
                event:      event,
                name:       eventName,
                time:       (new Date()).getTime()
            });
        }
    };
}

/**
 * Loop through node events and add listeners
 * @param nodeEvents
 * @param strategy
 * @param opts
 */
function addEventListeners(nodeEvents, strategy, opts) {
    for (var i = 0; i < nodeEvents.length; i++) {
        var nodeEvent = nodeEvents[i];
        var node = nodeEvent.node;
        var eventName = nodeEvent.eventName;
        var document = opts.document;
        var handler = getEventHandler(document, strategy, node, eventName);

        // add the actual event listener and keep a ref so we can remove the listener during cleanup
        node.addEventListener(eventName, handler);
        state.eventListeners.push({
            node:       node,
            name:       eventName,
            handler:    handler
        });
    }
}

/**
 * Add event handlers
 * @param opts
 */
function startListening(opts) {
    var listenStrategies = opts.listen || [];

    for (var i = 0; i < listenStrategies.length; i++) {
        var strategy = listenStrategies[i];

        // we either use custom strategy or one from the listen dir
        var getNodeEvents = strategy.getNodeEvents ||
            require('./listen/listen_by_' + strategy.name + '.js').getNodeEvents;

        // get array of objs with 1 node and 1 event; add event listener for each
        var nodeEvents = getNodeEvents(strategy, opts);
        addEventListeners(nodeEvents, strategy, opts);
    }
}

/**
 * Loop through replay strategies and call replayEvents functions
 * @param opts
 */
function replayEvents(opts) {
    var replayStrategies = opts.replay || [];

    for (var i = 0; i < replayStrategies.length; i++) {
        var strategy = replayStrategies[i];

        // we either use custom strategy or one from the listen dir
        var replayEvts = strategy.replayEvents ||
            require('./replay/replay_after_' + strategy.name + '.js').replayEvents;

        // get array of objs with 1 node and 1 event; add event listener for each
        state.events = replayEvts(state.events, strategy, opts);
    }

    //TODO: figure out better solution for remaining events
    // if some events are remaining, log to the console
    //if (state.events && state.events.length) {
    //    console.log('Not all events replayed: ');
    //    console.log(state.events);
    //}
}

/**
 * Go through all the event listeners and clean them up
 * by removing them from the given node (i.e. element)
 */
function cleanup() {
    var listener, node;

    // first cleanup the event listeners
    for (var i = 0; i < state.eventListeners.length; i++) {
        listener = state.eventListeners[i];
        node = listener.node;
        node.removeEventListener(listener.name, listener.handler);
    }

    // hide overlay if it exists
    hideOverlay();

    // now remove the events
    state.events = [];
}

module.exports = {
    state: state,
    hideOverlay: hideOverlay,
    displayOverlay: displayOverlay,
    getEventHandler: getEventHandler,
    addEventListeners: addEventListeners,
    startListening: startListening,
    replayEvents: replayEvents,
    cleanup: cleanup
};