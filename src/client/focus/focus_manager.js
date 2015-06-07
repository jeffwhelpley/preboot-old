/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Manage focus
 */
var domSelector = require('../select/dom_selector');
var state = {
    currentFocus: null,
    trackingEnabled: false
};

/**
 * Check the focus and then recursively call again after 50ms.
 * If tracking not enabled, though, returned w/o doing anything.
 * @param document
 */
function checkFocus(document) {
    if (state.trackingEnabled) {

        if (document.activeElement && document.activeElement !== state.currentFocus) {
            console.log('focus changed to ' + document.activeElement.tagName);
        }

        // if no active element, keep a ref for the last known one
        state.currentFocus = document.activeElement || state.currentFocus;

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

    state.trackingEnabled = true;
    checkFocus(document);
}

/**
 * This will stop state.currentFocus ref from changing
 */
function stopTracking() {
    console.log('stopping focus tracking');
    state.trackingEnabled = false;
}

/**
 * Set focus at the last known location
 * @param opts
 */
function setFocus(opts) {
    console.log('attempting to set focus to ' + (state.currentFocus && state.currentFocus.tagName));

    var clientNode = domSelector.findClientNode(state.currentFocus, opts);
    if (clientNode) {
        clientNode.focus();

        //TODO: if input box, put cursor at the end of the text
    }
}

module.exports = {
    state: state,
    checkFocus: checkFocus,
    startTracking: startTracking,
    stopTracking: stopTracking,
    setFocus: setFocus
};