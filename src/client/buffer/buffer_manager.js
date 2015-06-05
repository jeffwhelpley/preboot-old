/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Manage the switching of buffers
 */

/**
 * The client is hidden while the client is bootstrapping
 * @param document
 * @param clientSelector
 */
function hideClient(document, clientSelector) {
    var clientRoot = document.querySelector(clientSelector);
    if (clientRoot) {
        clientRoot.style.display = 'none';
    }
}

/**
 * We want to simultaneously remove the server node from the DOM
 * and display the client node
 *
 * @param document
 * @param clientSelector
 * @param serverSelector
 */
function switchBuffer(document, clientSelector, serverSelector) {
    var clientRoot = document.querySelector(clientSelector);
    var serverRoot = document.querySelector(serverSelector);

    if (!clientRoot || !serverRoot) {
        throw new Error('buffer option set, but clientRoot and/or serverRoot invalid');
    }

    // this will effectively do the switch
    serverRoot.remove();  //TODO: this does not work at all on IE; need alternative
    clientRoot.style.display = 'block';
}

module.exports = {
    hideClient: hideClient,
    switchBuffer: switchBuffer
};