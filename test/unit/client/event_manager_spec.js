/**
 * Author: Jeff Whelpley
 * Date: 6/7/15
 *
 *
 */
var name        = 'client/event_manager';
var taste       = require('taste');
var strategy    = taste.target(name);

describe('UNIT ' + name, function () {
    describe('hideOverlay()', function () {
        it('should not do anything if no params', function () {
            strategy.hideOverlay();
            taste.should.not.exist(strategy.state.overlay);
        });

        it('should set the display prop if there is an overlay', function () {
            strategy.state.overlay = { style: {} };
            strategy.hideOverlay();
            strategy.state.overlay.style.display.should.equal('none');
        });
    });

    describe('displayOverlay()', function () {
        it('should display an overlay', function () {
            var document = {
                createElement: function () {
                    return { style: {} };
                },
                body: { appendChild: taste.spy() }
            };

            strategy.displayOverlay(document, 1);
            strategy.state.overlay.style.opacity.should.equal('.27');
            document.body.appendChild.should.have.callCount(1);
        });
    });

    describe('getEventHandler()', function () {
        it('should get handler that does nothing', function () {
            var document = {};
            var config = {};
            var node = {};
            var eventName = 'blah';

            strategy.state.eventListeners = [];
            strategy.state.events = [];
            strategy.getEventHandler(document, config, node, eventName)();
            strategy.state.events.length.should.equal(1);
        });
    });

    describe('addEventListeners()', function () {
        it('should loop through a set of nodeEvents', function () {
            var nodeEvents = [
                { node: { addEventListener: taste.spy() } },
                { node: { addEventListener: taste.spy() } }
            ];
            var config = {};
            var opts = {};

            strategy.state.eventListeners = [];
            strategy.addEventListeners(nodeEvents, config, opts);
            nodeEvents[0].node.addEventListener.should.have.callCount(1);
            strategy.state.eventListeners.length.should.equal(2);
            strategy.state.eventListeners[0].node.should.deep.equal(nodeEvents[0].node);
        });
    });

    describe('startListening()', function () {
        it('should add listeners for mock data', function () {
            var nodeEvents = [
                { node: { addEventListener: taste.spy() } },
                { node: { addEventListener: taste.spy() } }
            ];
            var opts = {
                listen: [{
                    getNodeEvents: function () {
                        return nodeEvents;
                    }
                }]
            };

            strategy.state.eventListeners = [];
            strategy.startListening(opts);
            nodeEvents[0].node.addEventListener.should.have.callCount(1);
            strategy.state.eventListeners.length.should.equal(2);
            strategy.state.eventListeners[0].node.should.deep.equal(nodeEvents[0].node);
        });
    });

    describe('replayEvents()', function () {
        it('should replay mock events with a mock strategy', function () {
            var remainingEvents = [{
                done: 'yes'
            }];
            var opts = {
                replay: [{
                    replayEvents: function () {
                        return remainingEvents;
                    }
                }]
            };

            strategy.state.events = [];
            strategy.replayEvents(opts);
            strategy.state.events.should.deep.equal(remainingEvents);
            strategy.state.events = [];
        });
    });

    describe('cleanup()', function () {
        it('should cleanup existing resources', function () {
            strategy.state.eventListeners = [];
            strategy.cleanup();
            strategy.state.events.should.deep.equal([]);
        });
    });
});