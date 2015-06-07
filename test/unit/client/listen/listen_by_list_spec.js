/**
 * Author: Jeff Whelpley
 * Date: 6/6/15
 *
 *
 */
var name        = 'client/listen/listen_by_list';
var taste       = require('taste');
var strategy    = taste.target(name);

describe('UNIT ' + name, function () {
    describe('getNodeEvents()', function () {
        it('should return nothing if nothing from query', function () {
            var config = {
                eventsBySelector: { 'div.blah': 'evt1,evt2' }
            };
            var opts = {
                document: {
                    querySelectorAll: function () {
                        return null;
                    }
                }
            };

            var expected = [];
            var actual = strategy.getNodeEvents(config, opts);
            actual.should.deep.equal(expected);
        });

        it('should return node events', function () {
            var config = {
                eventsBySelector: { 'div.blah': 'evt1,evt2' }
            };
            var opts = {
                document: {
                    querySelectorAll: function () {
                        return [
                            { name: 'one' }, { name: 'two' }
                        ];
                    }
                }
            };

            var expected = [
                { node: { name: 'one' }, eventName: 'evt1' },
                { node: { name: 'one' }, eventName: 'evt2' },
                { node: { name: 'two' }, eventName: 'evt1' },
                { node: { name: 'two' }, eventName: 'evt2' }
            ];
            var actual = strategy.getNodeEvents(config, opts);
            actual.should.deep.equal(expected);
        });
    });
});