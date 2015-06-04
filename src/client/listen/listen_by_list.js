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