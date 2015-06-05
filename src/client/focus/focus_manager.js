/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Manage focus
 */
var findClientNode = require('../find/find_client_node');
var currentFocus = null;
var trackingEnabled = false;

/**
 * Check the focus and then recursively call again after 50ms.
 * If tracking not enabled, though, returned w/o doing anything.
 * @param document
 */
function checkFocus(document) {
    if (trackingEnabled) {

        // if no active element, keep a ref for the last known one
        currentFocus = document.activeElement || currentFocus;

        // call this again recursively after 50 milliseconds
        setTimeout(function () {
            checkFocus(document);
        }, 50);
    }
}

/**
 * Start tracking focus on the page
 * @param document
 */
function startTracking(document) {
    trackingEnabled = true;
    checkFocus(document);
}

/**
 * This will stop currentFocus ref from changing
 */
function stopTracking() {
    trackingEnabled = false;
}

/**
 * Set focus at the last known location
 */
function setFocus() {
    var clientNode = findClientNode(currentFocus);
    if (clientNode) {
        clientNode.focus();

        //TODO: if input box, put cursor at the end of the text
    }
}

module.exports = {
    checkFocus: checkFocus,
    startTracking: startTracking,
    stopTracking: stopTracking,
    setFocus: setFocus
};