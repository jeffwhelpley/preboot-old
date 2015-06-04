/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This replay strategy assumes that the client completely re-rendered
 * the page so reboot will need to find the element in the new client
 * rendered DOM that matches the element it has in memory.
 */
var nodeCache = {};

/**
 * Given a node from the server rendered view, find the equivalent
 * node in the client rendered view.
 *
 * @param document
 * @param serverNode
 */
function findClientNode(document, serverNode) {
    var serverNodeString = serverNode.toString();

    // first check to see if we already mapped this node
    var nodes = nodeCache[serverNodeString] || [];
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].serverNode === serverNode) {
            return nodes[i].clientNode;
        }
    }


    // either do select by ID or class or tagName
    // then look though and find by position in DOM


    // if we get here, then nothing cached, so proceed to
    document.querySelectorAll(serverNode.tagName);
}


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

    for (i = 0; i < events; i++) {
        eventData = events[i];
        event = eventData.event;
        serverNode = eventData.node;
        clientNode = findClientNode(document, serverNode);

        if (clientNode) {
            clientNode.dispatchEvent(event)
        }
        else {
            remainingEvents.push(eventData);
        }
    }

    return remainingEvents;
}

module.exports = {
    findClientNode: findClientNode,
    replayEvents: replayEvents
};