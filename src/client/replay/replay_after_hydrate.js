/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This replay strategy assumes that the client did not blow away
 * the server generated HTML and that the elements in memory for
 * preboot can be used to replay the events.
 *
 * @param document Not used for this strategy
 * @param events Array of events to replay
 * @param config
 */
function replayEvents(document, events, config) {
    var i, eventData, node, event;
    var remainingEvents = [];

    for (i = 0; i < events; i++) {
        eventData = events[i];
        event = eventData.event;
        node = eventData.node;

        // if we should check to see if the node exists in the DOM before dispatching
        // NOTE: this can be expensive so this option is false by default
        if (config.checkIfExists) {

            // if exists, dispatch event, else add to list of remaining events
            if (document.body.contains(node)) {
                node.dispatchEvent(event);
            }
            else {
                remainingEvents.push(eventData);
            }
        }

        // else we don't care if exists, so just dispatch the event
        else {
            node.dispatchEvent(event);
        }
    }

    return remainingEvents;
}

module.exports = {
    replayEvents: replayEvents
};