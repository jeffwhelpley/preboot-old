/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Main node.js interface to the preboot library. This can be used
 * either by a command line build tool or server side code in order
 * to generate the client side preboot JS that should be inserted
 * inline into a script tag in the HEAD section of an HTML document.
 */
var gulp = require('gulp');

/**
 * This is the main function for the preboot library. The input
 * is an options object while the output is a string with all the
 * client side preboot JavaScript code.
 *
 * @param opts The available options are:
 *              listen - String or Object (default 'attributes'). If string is name of strategy. If object, conforms to this:
 *                                      {
 *                                          name: String,       // name of string which must match file in listen folder if no strategy function provided
 *                                          config: {},         // config data passed into the strategy
 *                                          strategy: Function  // custom strategy implementation
 *                                      }
 *              replay - String or Object (default 'rerender'). If string is name of strategy. If object, conforms to this:
 *                                      {
 *                                          name: String,       // name of string which must match file in replay folder if no strategy function provided
 *                                          config: {},         // config data passed into the strategy
 *                                          strategy: Function  // custom strategy implementation
 *                                      }
 *              uglify Boolean - If true will uglify the JavaScript string returned (default true)
 *              focus Boolean - If true, will track focus and retain after bootstrap complete
 *              completeEvent String - Event that is raised on the document when the client has bootstrapped (default BootstrapComplete)
 */
function generateClientCode(opts) {

}

// functions exposed as API to the preboot library when required by node
module.exports = {
    generateClientCode: generateClientCode
};