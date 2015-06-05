/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This replay strategy assumes that the client completely re-rendered
 * the page so reboot will need to find the element in the new client
 * rendered DOM that matches the element it has in memory.
 */
var findClientNode = require('../find/find_client_node');

/**
 * Loop through all events and replay each by trying to find a node
 * that most closely resembles the original.
 *
 * @param document
 * @param events
 * @returns {Array}
 */
function replayEvents(document, events) {
    var i, eventData, serverNode, clientNode, event;
    var remainingEvents = [];

    // loop through the events, find the appropriate client node and dispatch the event
    for (i = 0; i < events; i++) {
        eventData = events[i];
        event = eventData.event;
        serverNode = eventData.node;
        clientNode = findClientNode(document, serverNode);

        if (clientNode) {
            clientNode.dispatchEvent(event);
        }
        else {
            remainingEvents.push(eventData);
        }
    }

    return remainingEvents;
}

module.exports = {
    replayEvents: replayEvents
};