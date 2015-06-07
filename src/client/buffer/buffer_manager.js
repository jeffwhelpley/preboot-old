/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Manage the switching of buffers
 */

/**
 * The client is hidden while the client is bootstrapping
 * @param clientRoot
 */
function hideClient(clientRoot) {
    console.log('hiding client');
    clientRoot.style.display = 'none';
}

/**
 * We want to simultaneously remove the server node from the DOM
 * and display the client node
 *
 * @param opts
 */
function switchBuffer(opts) {
    console.log('switching from server buffer to client buffer');

    var clientRoot = opts.clientRoot;
    var serverRoot = opts.serverRoot;

    //TODO: this does not work at all on IE; need alternative
    // remove the server root if not same as client and not the body
    if (serverRoot && serverRoot !== clientRoot && serverRoot.nodeName !== 'BODY') {
        serverRoot.remove();
    }

    // display the client
    clientRoot.style.display = 'block';
}

module.exports = {
    hideClient: hideClient,
    switchBuffer: switchBuffer
};