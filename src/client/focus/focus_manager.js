/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Manage focus
 */
var domSelector = require('../select/dom_selector');
var currentFocus = null;
var trackingEnabled = false;

/**
 * Check the focus and then recursively call again after 50ms.
 * If tracking not enabled, though, returned w/o doing anything.
 * @param document
 */
function checkFocus(document) {
    if (trackingEnabled) {

        if (document.activeElement && document.activeElement !== currentFocus) {
            console.log('focus changed to ' + document.activeElement.tagName);
        }

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
    console.log('starting to track focus');

    trackingEnabled = true;
    checkFocus(document);
}

/**
 * This will stop currentFocus ref from changing
 */
function stopTracking() {
    console.log('stopping focus tracking');
    trackingEnabled = false;
}

/**
 * Set focus at the last known location
 * @param document
 * @param serverRoot
 * @param clientRoot
 */
function setFocus(document, serverRoot, clientRoot) {
    console.log('attempting to set focus to ' + (currentFocus && currentFocus.tagName));

    var clientNode = domSelector.findClientNode(document, currentFocus, serverRoot, clientRoot);
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