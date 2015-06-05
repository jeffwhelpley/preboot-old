/**
 * Author: Jeff Whelpley
 * Date: 6/4/15
 *
 * This is used when there is a rerender and we need to find the
 * client rendered node that matches a server rendered node. It
 * is used by replay_after_rerender and focus_manager
 */
var nodeCache = {};

/**
 * Given a node from the server rendered view, find the equivalent
 * node in the client rendered view.
 *
 * @param document
 * @param serverNode
 */
module.exports = function findClientNode(document, serverNode) {

    // if nothing passed in, then no client node
    if (!serverNode) { return null; }

    // we use the string of the node to compare to the client node & as key in cache
    var serverNodeString = serverNode.toString();

    // first check to see if we already mapped this node
    var nodes = nodeCache[serverNodeString] || [];
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].serverNode === serverNode) {
            return nodes[i].clientNode;
        }
    }

    //TODO: improve this algorithm in the future
    var selector = serverNode.tagName;
    if (serverNode.id) {
        selector += '#' + serverNode.id;
    }
    else if (serverNode.className) {
        selector += serverNode.className.replace(/ /g, '.');
    }

    var clientNodes = document.querySelectorAll(selector);
    var clientNode;
    for (i = 0; i < clientNodes.length; i++) {
        clientNode = clientNodes[i];

        //TODO: this assumes a perfect match which isn't necessarily true
        if (clientNode.toString() === serverNodeString) {

            // add the client/server node pair to the cache
            nodeCache[serverNodeString] = nodeCache[serverNodeString] || [];
            nodeCache[serverNodeString].push({
                clientNode: clientNode,
                serverNode: serverNode
            });

            return clientNode;
        }
    }

    // if we get here it means we couldn't find the client node
    return null;
};