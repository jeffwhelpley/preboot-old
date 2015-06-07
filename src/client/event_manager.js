/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Handling events on the client side
 */
var eventListeners = [];
var events = [];
var overlay = null;

/* jshint camelcase: false */
var listenStrategies = { attributes: true, event_bindings: true, list: true };
var replayStrategies = { hydrate: true, rerender: true };

/**
 * Hide the overlay by setting to display none
 */
function hideOverlay() {
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Display overlay by sticking div at end of body
 * @param document
 */
function displayOverlay(document) {
    overlay = document.createElement('div');
    overlay.className = 'preboot-overlay';
    overlay.style.zIndex = '9999999';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = '#263741';
    overlay.style.opacity = '.27';
    document.body.appendChild(overlay);

    // hide overlay after 4 seconds regardless of whether bootstrap complete
    setTimeout(hideOverlay, 4000);
}

/**
 * For a given node, add an event listener based on the given attribute. The attribute
 * must match the Angular pattern for event handlers (i.e. either (event)='blah()' or
 * on-event='blah'
 *
 * @param nodeEvent
 * @param strategy
 * @param opts
 */
function addListener(nodeEvent, strategy, opts) {
    var node = nodeEvent.node;
    var eventName = nodeEvent.eventName;
    var document = opts.document;

    // this is what will be called when the event occurs
    function handler(event) {

        // we want to wait until client bootstraps so don't allow default action
        if (strategy.preventDefault) {
            event.preventDefault();
        }

        // if we want to raise an event that others can listen for
        if (strategy.dispatchEvent) {
            document.dispatchEvent(new Event(strategy.dispatchEvent));
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
            events.push({
                node:       node,
                event:      event,
                name:       eventName,
                time:       (new Date()).getTime()
            });
        }
    }

    // add the actual event listener and keep a ref so we can remove the listener during cleanup
    node.addEventListener(eventName, handler);
    eventListeners.push({
        node:       node,
        name:       eventName,
        handler:    handler
    });
}

/**
 * Loop through node events and add listeners
 * @param nodeEvents
 * @param strategy
 * @param opts
 */
function addListeners(nodeEvents, strategy, opts) {
    for (var i = 0; i < nodeEvents.length; i++) {
        var nodeEvent = nodeEvents[i];
        addListener(nodeEvent, strategy, opts);
    }
}

/**
 * Add event handlers
 * @param opts
 */
function startListening(opts) {
    for (var i = 0; i < opts.listen.length; i++) {
        var strategy = opts.listen[i];

        // we either use custom strategy or one from the listen dir
        var getNodeEvents = strategy.getNodeEvents ||
            require('./listen/listen_by_' + strategy.name + '.js').getNodeEvents;

        // get array of objs with 1 node and 1 event; add event listener for each
        var nodeEvents = getNodeEvents(strategy, opts);
        addListeners(nodeEvents, strategy, opts);
    }
}

/**
 * Loop through replay strategies and call replayEvents functions
 * @param opts
 */
function replayEvents(opts) {

    // loop through replay strategies
    for (var i = 0; i < opts.replay.length; i++) {
        var strategy = opts.replay[i];

        // we either use custom strategy or one from the listen dir
        var replayEvents = strategy.replayEvents ||
            require('./replay/replay_after_' + strategy.name + '.js').replayEvents;

        // get array of objs with 1 node and 1 event; add event listener for each
        events = replayEvents(events, strategy, opts);
    }

    //TODO: figure out better solution for remaining events
    // if some events are remaining, log to the console
    if (events && events.length) {
        console.log('Not all events replayed: ');
        console.log(events);
    }
}

/**
 * Go through all the event listeners and clean them up
 * by removing them from the given node (i.e. element)
 */
function cleanup() {
    var listener, node;

    console.log('cleaning up listeners');

    // first cleanup the event listeners
    for (var i = 0; i < eventListeners.length; i++) {
        listener = eventListeners[i];
        node = listener.node;
        node.removeEventListener(listener.name, listener.handler);
    }

    // hide overlay if it exists
    hideOverlay();

    // now remove the events
    events = [];
}

module.exports = {
    addListener: addListener,
    startListening: startListening,
    replayEvents: replayEvents,
    cleanup: cleanup
};