/**
 * Author: Jeff Whelpley
 * Date: 6/7/15
 *
 *
 */
var name        = 'client/replay/replay_after_hydrate';
var taste       = require('taste');
var strategy    = taste.target(name);

describe('UNIT ' + name, function () {
    describe('replayEvents()', function () {
        it('should do nothing and return empty array if no params', function () {
            var expected = [];
            var actual = strategy.replayEvents();
            actual.should.deep.equal(expected);
        });

        it('should dispatch all events w/o checkIfExists', function () {
            var node1 = { name: 'node1', dispatchEvent: taste.spy() };
            var node2 = { name: 'node2', dispatchEvent: taste.spy() };
            var events = [
                { event: { name: 'evt1' }, node: node1 },
                { event: { name: 'evt2' }, node: node2 }
            ];
            var config = {};
            var opts = {};

            var expected = [];
            var actual = strategy.replayEvents(events, config, opts);
            actual.should.deep.equal(expected);
            node1.dispatchEvent.should.have.callCount(1);
            node2.dispatchEvent.should.have.callCount(1);
        });

        it('should checkIfExists then dispatch', function () {
            var node1 = { name: 'node1', dispatchEvent: taste.spy() };
            var node2 = { name: 'node2', dispatchEvent: taste.spy() };
            var events = [
                { event: { name: 'evt1' }, node: node1 },
                { event: { name: 'evt2' }, node: node2 }
            ];
            var config = { checkIfExists: true };
            var opts = {
                document: {
                    body: {
                        contains: function (node) {
                            return node.name === 'node1';  // only node1 valid
                        }
                    }
                }
            };

            var expected = [events[1]];  // node2 returned as remaining
            var actual = strategy.replayEvents(events, config, opts);
            actual.should.deep.equal(expected);
            node1.dispatchEvent.should.have.callCount(1);
            node2.dispatchEvent.should.not.have.been.called;
        });
    });
});