/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Manage the switching of buffers
 */
var state = {
    switched: false
};

/**
 * The client is hidden while the client is bootstrapping
 * @param clientRoot
 */
function hideClient(clientRoot) {
    clientRoot.style.display = 'none';
}

/**
 * We want to simultaneously remove the server node from the DOM
 * and display the client node
 *
 * @param opts
 */
function switchBuffer(opts) {
    var clientRoot = opts.clientRoot;
    var serverRoot = opts.serverRoot;

    // don't do anything if already switched
    if (state.switched) { return; }

    // remove the server root if not same as client and not the body
    if (serverRoot && serverRoot !== clientRoot && serverRoot.nodeName !== 'BODY') {
        serverRoot.remove ?
            serverRoot.remove() :
            serverRoot.style.display = 'none';
    }

    // display the client and mark state as switched
    clientRoot.style.display = 'block';
    state.switched = true;
}

module.exports = {
    state: state,
    hideClient: hideClient,
    switchBuffer: switchBuffer
};