/**
 * Author: Jeff Whelpley
 * Date: 6/4/15
 *
 * Unit testing preboot server
 */
var name    = 'server/preboot_server';
var taste   = require('taste');
var preboot = taste.target(name);

describe('UNIT ' + name, function () {
    describe('getPrebootOptions()', function () {
        it('should stringify basic object', function () {
            var obj = { blah: 'foo' };
            var expected = 'var prebootOptions = ' + JSON.stringify(obj);
            var actual = preboot.getPrebootOptions(obj);
            actual.should.equal(expected);
        });

        it('should stringify with functions', function () {
            var obj = { blah: 'foo', zoo: function (blah) { return blah + 1; }};
            var expected = 'var prebootOptions = ' + '{"blah":"foo","zoo":"function (blah) { return blah + 1; }"}';
            var actual = preboot.getPrebootOptions(obj);
            actual.should.equal(expected);
        });
    });

    describe('getClientCode()', function () {
        it('should return some client code by default', function (done) {
            preboot.getClientCode()
                .then(function (code) {

                    console.log(code);
                    taste.should.exist(code);
                    done();
                })
                .catch(done);
        });
    });
});
