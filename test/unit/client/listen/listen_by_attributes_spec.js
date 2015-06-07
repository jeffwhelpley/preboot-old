/**
 * Author: Jeff Whelpley
 * Date: 6/6/15
 *
 *
 */
var name        = 'client/listen/listen_by_attributes';
var taste       = require('taste');
var strategy    = taste.target(name);

describe('UNIT ' + name, function () {
    describe('getNodeEvents()', function () {
        it('should return nothing if no selection found', function () {
            var document = {
                querySelectorAll: function () {
                    return null;
                }
            };
            var expected = [];
            var actual = strategy.getNodeEvents({}, { document: document });
            actual.should.deep.equal(expected);
        });

        it('should return node events', function () {
            var document = {
                querySelectorAll: function () {
                    return [
                        { name: 'one', getAttribute: function () { return 'yo,mo'; }},
                        { name: 'two', getAttribute: function () { return 'shoo,foo'; }}
                    ];
                }
            };
            var expected = [
                { node: { name: 'one'}, eventName: 'yo' },
                { node: { name: 'one' }, eventName: 'mo' },
                { node: { name: 'two' }, eventName: 'shoo' },
                { node: { name: 'two' }, eventName: 'foo' }
            ];
            var actual = strategy.getNodeEvents({}, { document: document });
            JSON.stringify(actual).should.equal(JSON.stringify(expected));
        });
    });
});