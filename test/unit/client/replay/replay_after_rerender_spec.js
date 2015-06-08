/**
 * Author: Jeff Whelpley
 * Date: 6/7/15
 *
 *
 */
var name        = 'client/replay/replay_after_rerender';
var taste       = require('taste');
var strategy    = taste.target(name);

describe('UNIT ' + name, function () {
    describe('replayEvents()', function () {
        it('should do nothing and return empty array if no params', function () {
            var expected = [];
            var actual = strategy.replayEvents();
            actual.should.deep.equal(expected);
        });

        it('should dispatch to node found in client view', function () {
            var node1 = { name: 'node1', dispatchEvent: taste.spy() };
            var node2 = { name: 'node2', dispatchEvent: taste.spy() };
            var events = [
                { event: { name: 'evt1' }, node: node1 },
                { event: { name: 'evt2' }, node: node2 }
            ];
            var config = {};
            var runOnce = false;
            var opts = {
                serverRoot: events[0],
                clientRoot: events[0],
                document: {}
            };
            opts.clientRoot.querySelectorAll = function () {
                if (runOnce) {
                    return null;
                }
                else {
                    runOnce = true;
                    return [node1];
                }
            };

            var expected = [events[1]];  // second event still there
            var actual = strategy.replayEvents(events, config, opts);
            actual.should.deep.equal(expected);
            node1.dispatchEvent.should.have.callCount(1);
            node2.dispatchEvent.should.not.have.been.called;
        });
    });
});