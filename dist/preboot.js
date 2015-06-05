var prebootOptions = {"focus":true,"buffer":false,"keypress":true,"serverRoot":"div.server","clientRoot":"div.client","completeEvent":"BootstrapComplete","listen":[{"name":"attributes"},{"name":"list","config":{"eventsBySelector":{"input[type=\"text\"]":"keypress","textarea":"keypress"}}},{"name":"list","config":{"eventsBySelector":{"input[type=\"text\"]":"keypress","textarea":"keypress"}}},{"name":"list","config":{"eventsBySelector":{"input[type=\"text\"]":"keypress","textarea":"keypress"}}},{"name":"list","config":{"eventsBySelector":{"input[type=\"text\"]":"keypress","textarea":"keypress"}}},{"name":"list","config":{"eventsBySelector":{"input[type=\"text\"]":"keypress","textarea":"keypress"}}},{"name":"list","config":{"eventsBySelector":{"input[type=\"text\"]":"keypress","textarea":"keypress"}}},{"name":"list","config":{"eventsBySelector":{"input[type=\"text\"]":"keypress","textarea":"keypress"}}},{"name":"list","config":{"eventsBySelector":{"input[type=\"text\"]":"keypress","textarea":"keypress"}}},{"name":"list","config":{"eventsBySelector":{"input[type=\"text\"]":"keypress","textarea":"keypress"}}},{"name":"list","config":{"eventsBySelector":{"input[type=\"text\"]":"keypress","textarea":"keypress"}}},{"name":"list","config":{"eventsBySelector":{"input[type=\"text\"]":"keypress","textarea":"keypress"}}}],"replay":[{"name":"rerender"}]};

require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./src/client/listen/listen_by_attributes.js":[function(require,module,exports){
/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This listen strategy will look for a specific attribute which contains all the elements
 * that a given element is listening to.
 *
 * @param document The browser document
 * @param config May contain the following values:
 *                  attributeName - Name of the events attribute (default preboot-events)
 */
function getNodeEvents(document, config) {
    config = config || {};

    // get all elements that have the preboot events attribute
    var attributeName = config.attributeName || 'preboot-events';
    var elems = document.querySelectorAll('[' + attributeName + ']');

    // if no elements found, return empty array since no node events
    if (!elems) { return []; }

    var nodeEvents = [];
    var i, j, elem, events;

    for (i = 0; i < elems.length; i++) {
        elem = elems[i];
        events = elem.getAttribute(attributeName).split(',');

        for (j = 0; j < events.length; j++) {
            nodeEvents.push({
                node:       elem,
                eventName:  events[i]
            });
        }
    }

    return nodeEvents;
}


module.exports = {
    getNodeEvents: getNodeEvents
};
},{}],"./src/client/listen/listen_by_list.js":[function(require,module,exports){
/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Listen by an explicit list of selectors mapped to a set of events
 *
 * @param document The browser document
 * @param config May contain eventsBySelector which is a map of selectors to events
 */
function getNodeEvents(document, config) {
    config = config || {};

    var nodeEvents = [];
    var eventsBySelector = config.eventsBySelector || {};
    var selectors = Object.keys(eventsBySelector);
    var selectorIdx, selector, elem, elems, i, j, events;

    // loop through selectors
    for (selectorIdx = 0; selectorIdx < selectors.length; selectorIdx++) {
        selector = selectors[selectorIdx];
        events = eventsBySelector[selector].split(',');
        elems = document.querySelectorAll(selector);

        // only do something if there are elements found
        if (elems) {

            // loop through elements
            for (i = 0; i < elems.length; i++) {
                elem = elems[i];

                // loop through events
                for (j = 0; j < events.length; j++) {
                    nodeEvents.push({
                        node:       elem,
                        eventName:  events[i]
                    });
                }
            }
        }
    }

    return nodeEvents;
}


module.exports = {
    getNodeEvents: getNodeEvents
};
},{}],"./src/client/replay/replay_after_rerender.js":[function(require,module,exports){
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

        console.log('attempting to find ' + serverNode.tagName + ' for replay');
        clientNode = findClientNode(document, serverNode);

        if (clientNode) {
            console.log('found node ' + clientNode.tagName + ' and dispatching event');
            clientNode.dispatchEvent(event);
        }
        else {
            console.log('did not find node for ' + clientNode.tagName);
            remainingEvents.push(eventData);
        }
    }

    return remainingEvents;
}

module.exports = {
    replayEvents: replayEvents
};
},{"../find/find_client_node":3}],1:[function(require,module,exports){
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
    console.log('hiding client at ' + clientSelector);

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
    console.log('switching from ' + serverSelector + ' to ' + clientSelector);
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
},{}],2:[function(require,module,exports){
/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Handling events on the client side
 */
var eventListeners = [];
var events = [];

/* jshint camelcase: false */
var listenStrategies = { attributes: true, event_bindings: true, list: true };
var replayStrategies = { hydrate: true, rerender: true };

/**
 * For a given node, add an event listener based on the given attribute. The attribute
 * must match the Angular pattern for event handlers (i.e. either (event)='blah()' or
 * on-event='blah'
 *
 * @param node An element in the DOM
 * @param eventName The name of the event
 * @param shouldPreventDefault
 */
function addListener(node, eventName, shouldPreventDefault) {

    // this is what will be called when the event occurs
    function handler(event) {

        // we want to wait until client bootstraps so don't allow default action
        if (shouldPreventDefault) {
            event.preventDefault();
        }

        events.push({
            node:       node,
            event:      event,
            name:       eventName,
            time:       (new Date()).getTime()
        });
    }

    // add the actual event listener and keep a ref so we can remove the listener during cleanup
    node.addEventListener(eventName, handler);
    eventListeners.push({
        node:       node,
        name:       eventName,
        handler:    handler
    });
}

/**
 * Add event handlers
 * @param document
 * @param strategies
 */
function startListening(document, strategies) {

    // if strategies param is not an array just throw an error
    // preboot_server will handle all the nice type conversions for user convenience
    if (!strategies || strategies.constructor !== Array) {
        throw new Error('listen param must be array');
    }

    // most of the time there will just be one strategy, but more than one can be used
    var i, j, strategy, getNodeEvents, nodeEvents, nodeEvent, preventDefault;
    for (i = 0; i < strategies.length; i++) {
        strategy = strategies[i];
        preventDefault = strategy.config && strategy.config.preventDefault;

        // a strategy must either have getNodeEvents (i.e. a custom strategy) or be in list of valid strategies
        if (!strategy.getNodeEvents && !listenStrategies[strategy.name]) {
            throw new Error('Invalid listen strategy');
        }

        // we either use custom strategy or one from the listen dir
        getNodeEvents = strategy.getNodeEvents || require('./src/client/listen/listen_by_' + strategy.name + '.js').getNodeEvents;

        // get array of objs with 1 node and 1 event; add event listener for each
        nodeEvents = getNodeEvents(document, strategy.config);
        for (j = 0; j < nodeEvents.length; j++) {
            nodeEvent = nodeEvents[j];

            console.log('listening to ' + JSON.stringify(nodeEvent));
            addListener(nodeEvent.node, nodeEvent.eventName, preventDefault);
        }
    }
}

/**
 * Replay events
 * @param document
 * @param strategies
 */
function replayEvents(document, strategies) {

    // if strategies param is not an array just throw an error
    // preboot_server will handle all the nice type conversions for user convenience
    if (!strategies || strategies.constructor !== Array) {
        throw new Error('replay param must be array');
    }

    // most of the time there will just be one strategy, but more than one can be used
    var i, strategy, replayEvts;
    for (i = 0; i < strategies.length; i++) {
        strategy = strategies[i];

        // a strategy must either have replayEvents (i.e. a custom strategy) or be in list of valid strategies
        if (!strategy.replayEvents && !replayStrategies[strategy.name]) {
            throw new Error('Invalid replay strategy');
        }

        // we either use custom strategy or one from the listen dir
        replayEvts = strategy.replayEvents || require('./src/client/replay/replay_after_' + strategy.name + '.js').replayEvents;

        // get array of objs with 1 node and 1 event; add event listener for each
        events = replayEvts(document, events, strategy.config);
    }

    //TODO: figure out better solution for remaining events
    // if some events are remaining, log to the console
    if (events && events.length) {
        console.log('Not all events replayed: ');
        console.log(events);
    }
}

/**
 * Go through all the event listeners and clean them up
 * by removing them from the given node (i.e. element)
 */
function cleanup() {
    var listener, node;

    console.log('cleaning up listeners');

    // first cleanup the event listeners
    for (var i = 0; i < eventListeners.length; i++) {
        listener = eventListeners[i];
        node = listener.node;
        node.removeEventListener(listener.name, listener.handler);
    }

    // now remove the events
    events = [];
}

module.exports = {
    addListener: addListener,
    startListening: startListening,
    replayEvents: replayEvents,
    cleanup: cleanup
};
},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
 */
function setFocus(document) {
    console.log('attempting to set focus to ' + (currentFocus && currentFocus.tagName));
    var clientNode = findClientNode(document, currentFocus);
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
},{"../find/find_client_node":3}],5:[function(require,module,exports){
/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This is the main entry point for the client side bootstrap library.
 * This will be browserified and then inlined in the head of an HTML
 * document along with a call to this module that passes in the
 * browser document object and all the options. See the
 * preboot_server to see how this code is generated and inserted
 * into HTML. At a high level what is happening here is:
 *
 *      1) Start tracking events
 *      2) Start tracking focus
 *      3) Once bootstrap is complete:
 *              A) replay all events
 *              B) switch from the server buffer to the client buffer
 *              C) set focus at the last known location
 *              D) cleanup all resources
 *
 * Note that many of these steps are options and can be configured through
 * the opts input object. In the future we will optimize the amount of code
 * needed by doing custom builds where the code not needed would not be
 * included in the final client side JS generated.
 *
 * @param document
 * @param opts An object that contain any of the following values:
 *              listen - An array of objects that contain:
 *                          name - the name of the strategy (default attributes)
 *                          config - values passed into the strategy
 *                          getNodeEvents - a custom strategy implementation (params document and config)
 *              replay - An array of objects that contain:
 *                          name - the name of the strategy (default rerender)
 *                          config - values passed into the strategy
 *                          getNodeEvents - a custom strategy implementation (params document and config)
 *              focus - Boolean value if true, will keep track of focus on the page (true by default)
 *              buffer - Boolean value if true will switch buffers (see switch_buffer for details); default false
 *              keypress - Boolean value if true will capture all keypress events in all input[type=text] and textarea elements
 *              serverRoot - selector to get the server root node
 *              clientRoot - selector to get the client root node
 *              completeEvent - Name of event that will be raised on the document
 *                       when the client application bootstrap has completed
 */
(function (document, opts) {
    var eventManager = require('./event_manager');
    var focusManager = require('./focus/focus_manager');
    var bufferManager = require('./buffer/buffer_manager');

    opts = opts || {};                                      // set default value for opts

    //TODO: only potentially do switch over when user tabs out
    //TODO: spinner if user clicks on a button (how would user define this)
    //TODO: timeout for events

    // as soon as the document loads, start running
    window.onload = function() {
        if (opts.buffer) {
            bufferManager.hideClient(document, opts.clientRoot);
        }

        eventManager.startListening(document, opts.listen);     // add all the event handlers

        if (opts.focus) {
            focusManager.startTracking(document);               // start tracking focus on the page
        }
    };

    // listen for bootstrap complete event
    document.addEventListener(opts.completeEvent || 'BootstrapComplete', function () {
        console.log('preboot got BootstrapComplete event');

        if (opts.focus) { focusManager.stopTracking(); }        // stop tracking focus so we retain the last focus

        eventManager.replayEvents(document, opts.replay);       // replay events

        // now that we have replayed the events, if a buffer exists switch it so client view displayed
        if (opts.buffer) {
            bufferManager.switchBuffer(document, opts.clientRoot, opts.serverRoot);
        }

        if (opts.focus) { focusManager.setFocus(document); }    // set focus if an option

        eventManager.cleanup();                                 // do final event cleanup
    });
})(window.document, window.prebootOptions);

},{"./buffer/buffer_manager":1,"./event_manager":2,"./focus/focus_manager":4}]},{},[5]);
