(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.preboot = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./freeze/freeze_with_spinner.js":[function(require,module,exports){
/**
 * Author: Jeff Whelpley
 * Date: 6/9/15
 *
 * Freeze by showing a spinner
 */
var dom = require('../dom');
var eventManager = require('../event_manager');

var state = {
    overlay: null,
    spinner: null
};

/**
 * Create the overlay and spinner nodes
 * @param opts
 */
function prep(opts) {
    var freezeStyles = opts.freezeStyles || {};
    var overlayStyles = freezeStyles.overlay || {};
    var spinnerStyles = freezeStyles.spinner || {};

    // add the overlay and spinner to the end of the body
    state.overlay = dom.addNodeToBody('div', overlayStyles.className, overlayStyles.style);
    state.spinner = dom.addNodeToBody('div', spinnerStyles.className, spinnerStyles.style);

    // when a freeze event occurs, show the overlay and spinner
    dom.on(opts.freezeEvent, function (event) {
        var activeNode = eventManager.state.activeNode;
        if (activeNode) {
            state.spinner.style.top = activeNode.offsetTop;
            state.spinner.style.left = activeNode.offsetLeft;
            //activeNode.blur();
        }

        state.overlay.style.display = 'block';
        state.spinner.style.display = 'block';

        setTimeout(function () {
            if (state.overlay) {
                state.overlay.style.display = 'none';
            }
            if (state.spinner) {
                state.spinner.style.display = 'none';
            }
        }, 4000);
    });
}

/**
 * Remove the overlay and spinner
 */
function cleanup() {
    dom.removeNode(state.overlay);
    dom.removeNode(state.spinner);

    state.overlay = null;
    state.spinner = null;
}

module.exports = {
    state: state,
    prep: prep,
    cleanup: cleanup
};
},{"../dom":2,"../event_manager":3}],"./listen/listen_by_selectors.js":[function(require,module,exports){
/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Listen by an explicit list of selectors mapped to a set of events
 */
var dom = require('../dom');

/**
 * Get all node events for a given set of selectors
 * @param strategy
 * @returns {Array}
 */
function getNodeEvents(strategy) {
    var nodeEvents = [];
    var eventsBySelector = strategy.eventsBySelector || {};
    var selectors = Object.keys(eventsBySelector);
    var selectorIdx, selector, elem, elems, i, j, events;

    // loop through selectors
    for (selectorIdx = 0; selectorIdx < selectors.length; selectorIdx++) {
        selector = selectors[selectorIdx];
        events = eventsBySelector[selector];
        elems = dom.getAllAppNodes(selector);

        // only do something if there are elements found
        if (elems) {

            // loop through elements
            for (i = 0; i < elems.length; i++) {
                elem = elems[i];

                // loop through events
                for (j = 0; j < events.length; j++) {
                    nodeEvents.push({
                        node:       elem,
                        eventName:  events[j]
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
},{"../dom":2}],"./replay/replay_after_rerender.js":[function(require,module,exports){
/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This replay strategy assumes that the client completely re-rendered
 * the page so reboot will need to find the element in the new client
 * rendered DOM that matches the element it has in memory.
 */
var dom = require('../dom');

/**
 * Loop through all events and replay each by trying to find a node
 * that most closely resembles the original.
 *
 * @param events
 * @param strategy
 * @param log
 * @returns {Array}
 */
function replayEvents(events, strategy, log) {
    var i, eventData, serverNode, clientNode, event;
    var remainingEvents = [];
    events = events || [];

    // loop through the events, find the appropriate client node and dispatch the event
    for (i = 0; i < events.length; i++) {
        eventData = events[i];
        event = eventData.event;
        serverNode = eventData.node;
        clientNode = dom.findClientNode(serverNode);

        if (clientNode) {
            clientNode.value = serverNode.value;  // need to explicitly set value since keypress events won't transfer
            clientNode.dispatchEvent(event);
            log(3, serverNode, clientNode, event);
        }
        else {
            log(4, serverNode);
            remainingEvents.push(eventData);
        }
    }

    return remainingEvents;
}

module.exports = {
    replayEvents: replayEvents
};
},{"../dom":2}],1:[function(require,module,exports){
/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Manage the switching of buffers
 */
var dom = require('../dom');
var state = {
    switched: false
};

/**
 * Create a second div that will be the client root
 * for an app
 */
function prep() {

    // server root is the app root when we get started
    var serverRoot = dom.state.appRoot;

    // client root is going to be a shallow clone of the server root
    var clientRoot = serverRoot.cloneNode(false);

    // client in the DOM, but not displayed until time for switch
    clientRoot.style.display = 'none';

    // insert the client root right before the server root
    serverRoot.parentNode.insertBefore(clientRoot, serverRoot);

    // update the dom manager to store the server and client roots
    // first param is the appRoot
    dom.updateRoots(serverRoot, serverRoot, clientRoot);
}

/**
 * We want to simultaneously remove the server node from the DOM
 * and display the client node
 */
function switchBuffer() {

    // get refs to the roots
    var clientRoot = dom.state.clientRoot || dom.state.appRoot;
    var serverRoot = dom.state.serverRoot || dom.state.appRoot;

    // don't do anything if already switched
    if (state.switched) { return; }

    // remove the server root if not same as client and not the body
    if (serverRoot !== clientRoot && serverRoot.nodeName !== 'BODY') {
        serverRoot.remove ?
            serverRoot.remove() :
            serverRoot.style.display = 'none';
    }

    // display the client
    clientRoot.style.display = 'block';

    // update the roots; first param is the new appRoot; serverRoot now null
    dom.updateRoots(clientRoot, null, clientRoot);

    // finally mark state as switched
    state.switched = true;
}

module.exports = {
    state: state,
    prep: prep,
    switchBuffer: switchBuffer
};
},{"../dom":2}],2:[function(require,module,exports){
/**
 * Author: Jeff Whelpley
 * Date: 6/10/15
 *
 * This is a wrapper for the DOM that is used by preboot. We do this
 * for a few reasons. It makes the other preboot code more simple,
 * makes things easier to test (i.e. just mock out the DOM) and it
 * centralizes our DOM related interactions so we can more easily
 * add fixes for different browser quirks
 */
var state = {};
var nodeCache = {};

/**
 * Initialize the DOM state based on input
 * @param opts
 */
function init(opts) {
    state.window = opts.window || state.window || {};
    state.document = opts.document || state.window.document || {};
    state.body = opts.body || state.document.body;
    state.appRoot = opts.appRoot || state.body;
    state.serverRoot = state.clientRoot = state.appRoot;
}

/**
 * Setter for app root
 * @param appRoot
 * @param serverRoot
 * @param clientRoot
 */
function updateRoots(appRoot, serverRoot, clientRoot) {
    state.appRoot       = appRoot;
    state.serverRoot    = serverRoot;
    state.clientRoot    = clientRoot;
}

/**
 * Get a node in the document
 * @param selector
 * @returns {Element}
 */
function getDocumentNode(selector) {
    return state.document.querySelector(selector);
}

/**
 * Get one app node
 * @param selector
 * @returns {Element}
 */
function getAppNode(selector) {
    return state.appRoot.querySelector(selector);
}

/**
 * Get all app nodes for a given selector
 * @param selector
 */
function getAllAppNodes(selector) {
    return state.appRoot.querySelectorAll(selector);
}

/**
 * Get all nodes under the client root
 * @param selector
 * @returns {*|NodeList}
 */
function getClientNodes(selector) {
    return state.clientRoot.querySelectorAll(selector);
}

/**
 * Add event listener at window level
 * @param handler
 */
function onLoad(handler) {
    state.window.addEventListener('load', handler);
}

/**
 * These are global events that get passed around. Currently
 * we use the document to do this.
 * @param eventName
 * @param handler
 */
function on(eventName, handler) {
    state.document.addEventListener(eventName, handler);
}

/**
 * Dispatch an event on the document
 * @param eventName
 */
function dispatchGlobalEvent(eventName) {
    state.document.dispatchEvent(new state.window.Event(eventName));
}

/**
 * Dispatch an event on a specific node
 * @param node
 * @param eventName
 */
function dispatchNodeEvent(node, eventName) {
    node.dispatchEvent(new state.window.Event(eventName));
}

/**
 * Check to see if the app contains a particular node
 * @param node
 * @returns boolean
 */
function appContains(node) {
    return state.appRoot.contains(node);
}

/**
 * Create a new element
 * @param type
 * @param className
 * @param styles
 */
function addNodeToBody(type, className, styles) {
    var elem = state.document.createElement(type);
    elem.className = className;

    if (styles) {
        for (var key in styles) {
            if (styles.hasOwnProperty(key)) {
                elem.style[key] = styles[key];
            }
        }
    }

    return state.body.appendChild(elem);
}

/**
 * Remove a node since we are done with it
 * @param node
 */
function removeNode(node) {
    node.remove ?
        node.remove() :
        node.style.display = 'none';
}

/**
 * Get a unique key for a node in the DOM
 * @param node
 * @param rootNode - Need to know how far up we go
 */
function getNodeKey(node, rootNode) {
    var ancestors = [];
    var temp = node;
    while (temp && temp !== rootNode) {
        ancestors.push(temp);
        temp = temp.parentNode;
    }

    // push the rootNode on the ancestors
    if (temp) {
        ancestors.push(temp);
    }

    // now go backwards starting from the root
    var key = node.nodeName;
    var len = ancestors.length;
    var i, j;

    for (i = (len - 1); i >= 0; i--) {
        temp = ancestors[i];

        //key += '_d' + (len - i);

        if (temp.childNodes && i > 0) {
            for (j = 0; j < temp.childNodes.length; j++) {
                if (temp.childNodes[j] === ancestors[i - 1]) {
                    key += '_s' + (j + 1);
                    break;
                }
            }
        }
    }

    return key;
}

/**
 * Given a node from the server rendered view, find the equivalent
 * node in the client rendered view.
 *
 * @param serverNode
 */
function findClientNode(serverNode) {

    // if nothing passed in, then no client node
    if (!serverNode) { return null; }

    // we use the string of the node to compare to the client node & as key in cache
    var serverNodeKey = getNodeKey(serverNode, state.serverRoot);

    // first check to see if we already mapped this node
    var nodes = nodeCache[serverNodeKey] || [];
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].serverNode === serverNode) {
            return nodes[i].clientNode;
        }
    }

    //TODO: improve this algorithm in the future so uses fuzzy logic (i.e. not necessarily perfect match)
    var selector = serverNode.tagName;
    var className = (serverNode.className || '').replace('ng-binding', '').trim();

    if (serverNode.id) {
        selector += '#' + serverNode.id;
    }
    else if (className) {
        selector += '.' + className.replace(/ /g, '.');
    }

    var clientNodes = getClientNodes(selector);
    for (i = 0; clientNodes && i < clientNodes.length; i++) {
        var clientNode = clientNodes[i];

        //TODO: this assumes a perfect match which isn't necessarily true
        if (getNodeKey(clientNode, state.clientRoot) === serverNodeKey) {

            // add the client/server node pair to the cache
            nodeCache[serverNodeKey] = nodeCache[serverNodeKey] || [];
            nodeCache[serverNodeKey].push({
                clientNode: clientNode,
                serverNode: serverNode
            });

            return clientNode;
        }
    }

    // if we get here it means we couldn't find the client node
    return null;
}

module.exports = {
    state: state,
    nodeCache: nodeCache,

    init: init,
    updateRoots: updateRoots,
    getDocumentNode: getDocumentNode,
    getAppNode: getAppNode,
    getAllAppNodes: getAllAppNodes,
    getClientNodes: getClientNodes,
    onLoad: onLoad,
    on: on,
    dispatchGlobalEvent: dispatchGlobalEvent,
    dispatchNodeEvent: dispatchNodeEvent,
    appContains: appContains,
    addNodeToBody: addNodeToBody,
    removeNode: removeNode,
    getNodeKey: getNodeKey,
    findClientNode: findClientNode
};
},{}],3:[function(require,module,exports){
/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Handling events on the client side
 */
var dom = require('./dom');
var state = {
    eventListeners: [],
    events: [],
    listening: false,
    activeNode: null
};

/**
 * For a given node, add an event listener based on the given attribute. The attribute
 * must match the Angular pattern for event handlers (i.e. either (event)='blah()' or
 * on-event='blah'
 *
 * @param strategy
 * @param node
 * @param eventName
 */
function getEventHandler(strategy, node, eventName) {
    return function (event) {

        // if we aren't listening anymore (i.e. bootstrap complete)
        // then don't capture any more events
        if (!state.listening) {
            return;
        }

        // we want to wait until client bootstraps so don't allow default action
        if (strategy.preventDefault) {
            event.preventDefault();
        }

        // if we want to raise an event that others can listen for
        if (strategy.dispatchEvent) {
            dom.dispatchGlobalEvent(strategy.dispatchEvent);
        }

        // if callback provided for a custom action when an event occurs
        if (strategy.action) {
            strategy.action(node, event, dom);
        }

        // when tracking focus keep a ref to the last active node
        if (strategy.trackFocus) {
            state.activeNode = (event.type === 'focusin') ? event.target : null;
        }

        //TODO: remove this hack after angularu presentation
        if (eventName === 'keyup' && event.which === 13 && node.attributes['(keyup.enter)']) {
            dom.dispatchGlobalEvent('PrebootFreeze');
        }

        // we will record events for later replay unless explicitly marked as doNotReplay
        if (!strategy.doNotReplay) {
            state.events.push({
                node:       node,
                event:      event,
                name:       eventName,
                time:       (new Date()).getTime()
            });
        }
    };
}

/**
 * Loop through node events and add listeners
 * @param nodeEvents
 * @param strategy
 */
function addEventListeners(nodeEvents, strategy) {
    for (var i = 0; i < nodeEvents.length; i++) {
        var nodeEvent = nodeEvents[i];
        var node = nodeEvent.node;
        var eventName = nodeEvent.eventName;
        var handler = getEventHandler(strategy, node, eventName);

        // add the actual event listener and keep a ref so we can remove the listener during cleanup
        node.addEventListener(eventName, handler);
        state.eventListeners.push({
            node:       node,
            name:       eventName,
            handler:    handler
        });
    }
}

/**
 * Add event handlers
 * @param opts
 */
function startListening(opts) {
    var listenStrategies = opts.listen || [];

    state.listening = true;
    for (var i = 0; i < listenStrategies.length; i++) {
        var strategy = listenStrategies[i];

        // we either use custom strategy or one from the listen dir
        var getNodeEvents = strategy.getNodeEvents ||
            require('./listen/listen_by_' + strategy.name + '.js').getNodeEvents;

        // get array of objs with 1 node and 1 event; add event listener for each
        var nodeEvents = getNodeEvents(strategy, dom);
        addEventListeners(nodeEvents, strategy, opts);
    }
}

/**
 * Loop through replay strategies and call replayEvents functions
 * @param opts
 * @param log
 */
function replayEvents(opts, log) {
    var replayStrategies = opts.replay || [];

    state.listening = false;
    for (var i = 0; i < replayStrategies.length; i++) {
        var strategy = replayStrategies[i];

        // we either use custom strategy or one from the listen dir
        var replayEvts = strategy.replayEvents ||
            require('./replay/replay_after_' + strategy.name + '.js').replayEvents;

        // get array of objs with 1 node and 1 event; add event listener for each
        state.events = replayEvts(state.events, strategy, log, dom);
    }

    //TODO: figure out better solution for remaining events
    // if some events are remaining, log to the console
    //if (state.events && state.events.length) {
    //    console.log('Not all events replayed: ');
    //    console.log(state.events);
    //}
}

/**
 * Go through all the event listeners and clean them up
 * by removing them from the given node (i.e. element)
 * @param opts
 */
function cleanup(opts) {
    var listener, node;

    // if we are setting focus and there is an active element, do it
    if (opts.focus && state.activeNode) {
        var activeClientNode = dom.findClientNode(state.activeNode);
        if (activeClientNode) {
            activeClientNode.focus();
        }
    }

    // cleanup the event listeners
    for (var i = 0; i < state.eventListeners.length; i++) {
        listener = state.eventListeners[i];
        node = listener.node;
        node.removeEventListener(listener.name, listener.handler);
    }

    // now remove the events
    state.events = [];
}

module.exports = {
    state: state,
    getEventHandler: getEventHandler,
    addEventListeners: addEventListeners,
    startListening: startListening,
    replayEvents: replayEvents,
    cleanup: cleanup
};
},{"./dom":2}],4:[function(require,module,exports){
/**
 * Author: Jeff Whelpley
 * Date: 6/19/15
 *
 * Logger for preboot that can be used when the debug
 * option is used. It will print out info about what
 * is happening during the preboot process
 */

module.exports = {};

//function logOptions(opts) {
//    console.log('preboot options are:');
//    console.log(opts);
//}
//
//function logEvents(events) {
//    console.log('preboot events captured are:');
//    console.log(events);
//}
//
//function replaySuccess(serverNode, clientNode, event) {
//    console.log('replaying:');
//    console.log({
//        serverNode: serverNode,
//        clientNode: clientNode,
//        event: event
//    });
//}
//
//function missingClientNode(serverNode) {
//    console.log('preboot could not find client node for:');
//    console.log(serverNode);
//}
//
//var logMap = {
//    '1': logOptions,
//    '2': logEvents,
//    '3': replaySuccess,
//    '4': missingClientNode
//};
//
//function log() {
//    if (!arguments.length) { return; }
//
//    var id = arguments[0] + '';
//    var fn = logMap[id];
//
//    if (fn) {
//        var args = arguments.length > 0 ? [].splice.call(arguments, 1) : [];
//        fn.apply(null, args);
//    }
//}
//
//module.exports = {
//    log: log
//};
},{}],5:[function(require,module,exports){
/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This is the main entry point for the client side bootstrap library.
 * This will be browserified and then inlined in the head of an HTML
 * document along with a call to this module that passes in the
 * browser document object and all the options. See the
 * README for details on how this works
 */
var dom             = require('./dom');
var eventManager    = require('./event_manager');
var bufferManager   = require('./buffer/buffer_manager');
var log             = require('./log').log || function () {};

// in each client-side module, we store state in an object so we can mock
// it out during testing and easily reset it as necessary
var state = {
    canComplete: true,      // set to false if preboot paused through an event
    completeCalled: false,  // set to true once the completion event has been raised
    freeze: null,           // only used if freeze option is passed in
    opts: null,
    started: false
};

/**
 * Get a function to run once bootstrap has completed
 */
function done() {
    var opts = state.opts;

    log(2, eventManager.state.events);

    // track that complete has been called
    state.completeCalled = true;

    // if we can't complete (i.e. preboot paused), just return right away
    if (!state.canComplete) { return; }

    // else we can complete, so get started with events
    eventManager.replayEvents(opts, log);                   // replay events on client DOM
    if (opts.buffer) { bufferManager.switchBuffer(opts); }  // switch from server to client buffer
    if (opts.freeze) { state.freeze.cleanup(); }            // cleanup freeze divs like overlay
    eventManager.cleanup(opts);                             // cleanup event listeners
}

/**
 * Get function to run once window has loaded
 * @param opts
 * @returns {Function}
 */
function getOnLoadHandler(opts) {
    return function onLoad() {

        // re-initialize dom now that we have the body
        dom.init({ window: window });

        // make sure the app root is set
        dom.updateRoots(dom.getDocumentNode(opts.appRoot));

        // if we are buffering, need to switch around the divs
        if (opts.buffer) {
            bufferManager.prep(opts);
        }

        // if we could potentially freeze the UI, we need to prep (i.e. to add divs for overlay, etc.)
        if (opts.freeze) {
            state.freeze.prep(opts);
        }

        // start listening to events
        eventManager.startListening(opts);
    };
}

/**
 * Pause the completion process
 */
function pauseCompletion() {
    state.canComplete = false;
}

/**
 * Resume the completion process; if complete already called,
 * call it again right away.
 *
 * @returns {Function}
 */
function getResumeCompleteHandler() {
    return function onResume() {
        state.canComplete = true;

        if (state.completeCalled) {

            // using setTimeout to fix weird bug where err thrown on
            // serverRoot.remove() in buffer switch
            setTimeout(done, 10);
        }
    };
}

/**
 * Init preboot
 * @param opts
 */
function init(opts) {
    state.opts = opts;

    log(1, opts);

    // freeze strategy is used at this top level, so need to get ref
    state.freeze = (typeof opts.freeze === 'string') ?
        require('./freeze/freeze_with_' + opts.freeze + '.js') :
        opts.freeze;

    // set up handlers for different preboot lifecycle events
    dom.init({ window: window });
}

/**
 * Start preboot
 */
function start() {

    // we can only start once, so don't do anything if called multiple times
    if (state.started) { return; }

    // initialize the window
    dom.init({ window: window });

    // if body there, then run load handler right away, otherwise register for onLoad
    dom.state.body ?
        getOnLoadHandler(state.opts)() :
        dom.onLoad(getOnLoadHandler(state.opts));

    // set up other handlers
    dom.on(state.opts.pauseEvent, pauseCompletion);
    dom.on(state.opts.resumeEvent, getResumeCompleteHandler());
}

// only expose start
module.exports = {
    eventManager: eventManager,
    bufferManager: bufferManager,
    init: init,
    start: start,
    done: done
};

},{"./buffer/buffer_manager":1,"./dom":2,"./event_manager":3,"./log":4}]},{},[5])(5)
});

preboot.init({"appRoot":"app","freeze":"spinner","replay":[{"name":"rerender"}],"focus":true,"buffer":true,"keyPress":true,"buttonPress":true,"debug":false,"pauseEvent":"PrebootPause","resumeEvent":"PrebootResume","freezeEvent":"PrebootFreeze","listen":[{"name":"selectors","eventsBySelector":{"input[type=\"text\"],textarea":["keypress","keyup","keydown"]}},{"name":"selectors","eventsBySelector":{"input[type=\"text\"],textarea":["focusin","focusout"]},"trackFocus":true,"doNotReplay":true},{"name":"selectors","preventDefault":true,"eventsBySelector":{"input[type=\"submit\"],button":["click"]},"dispatchEvent":"PrebootFreeze"}],"freezeStyles":{"overlay":{"className":"preboot-overlay","style":{"position":"absolute","display":"none","zIndex":"9999999","top":"0","left":"0","width":"100%","height":"100%"}},"spinner":{"className":"preboot-spinner","style":{"position":"absolute","display":"none","zIndex":"99999999"}}}});

