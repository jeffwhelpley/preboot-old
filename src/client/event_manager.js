/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Handling events on the client side
 */
var eventListeners = [];
var events = [];

/* jshint camelcase: false */
var listenStrategies = { attributes: true, event_bindings: true, list: true };
var replayStrategies = { hydrate: true, rerender: true };

/**
 * For a given node, add an event listener based on the given attribute. The attribute
 * must match the Angular pattern for event handlers (i.e. either (event)='blah()' or
 * on-event='blah'
 *
 * @param node An element in the DOM
 * @param eventName The name of the event
 */
function addListener(node, eventName) {

    // this is what will be called when the event occurs
    function handler(event) {

        // we want to wait until client bootstraps so don't allow default action
        event.preventDefault();
        events.push({
            node:       node,
            event:      event,
            name:       eventName,
            time:       (new Date()).getTime()
        });
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
 * Add event handlers
 * @param document
 * @param strategies
 */
function startListening(document, strategies) {

    // default listen strategy is 'attributes' which looks for a specific attribute in the DOM
    strategies = strategies || [{ name: 'attributes' }];

    // if strategies param is not an array just throw an error
    // preboot_server will handle all the nice type conversions for user convenience
    if (strategies.constructor !== Array) {
        throw new Error('listen param must be array');
    }

    // most of the time there will just be one strategy, but more than one can be used
    var i, j, strategy, getNodeEvents, nodeEvents;
    for (i = 0; i < strategies.length; i++) {
        strategy = strategies[i];

        // a strategy must either have getNodeEvents (i.e. a custom strategy) or be in list of valid strategies
        if (!strategy.getNodeEvents && !listenStrategies[strategy.name]) {
            throw new Error('Invalid listen strategy');
        }

        // we either use custom strategy or one from the listen dir
        getNodeEvents = strategy.getNodeEvents || require('./src/client/listen/listen_by_' + strategy.name + '.js').getNodeEvents;

        // get array of objs with 1 node and 1 event; add event listener for each
        nodeEvents = getNodeEvents(document);
        for (j = 0; j < nodeEvents.length; j++) {
            addListener(nodeEvents[j].node, nodeEvents[j].eventName);
        }
    }
}

/**
 * Replay events
 * @param document
 * @param strategies
 */
function replayEvents(document, strategies) {

    // default replay strategy is rerender
    strategies = strategies || [{ name: 'rerender' }];

    // if strategies param is not an array just throw an error
    // preboot_server will handle all the nice type conversions for user convenience
    if (strategies.constructor !== Array) {
        throw new Error('replay param must be array');
    }

    // most of the time there will just be one strategy, but more than one can be used
    var i, strategy, replayEvts;
    for (i = 0; i < strategies.length; i++) {
        strategy = strategies[i];

        // a strategy must either have replayEvents (i.e. a custom strategy) or be in list of valid strategies
        if (!strategy.replayEvents && !replayStrategies[strategy.name]) {
            throw new Error('Invalid replay strategy');
        }

        // we either use custom strategy or one from the listen dir
        replayEvts = strategy.replayEvents || require('./src/client/replay/replay_after_' + strategy.name + '.js').replayEvents;

        // get array of objs with 1 node and 1 event; add event listener for each
        events = replayEvts(document, events, strategy.config);
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

    // first cleanup the event listeners
    for (var i = 0; i < eventListeners.length; i++) {
        listener = eventListeners[i];
        node = listener.node;
        node.removeEventListener(listener.name, listener.handler);
    }

    // now remove the events
    events = [];
}

module.exports = {
    addListener: addListener,
    startListening: startListening,
    replayEvents: replayEvents,
    cleanup: cleanup
};