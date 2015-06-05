/**
 * Author: Jeff Whelpley
 * Date: 6/4/15
 *
 * Unit testing generator server
 */
var name        = 'server/client_code_generator';
var taste       = require('taste');
var generator   = taste.target(name);

describe('UNIT ' + name, function () {
    //describe('getPrebootOptions()', function () {
    //    it('should stringify basic object', function () {
    //        var obj = { blah: 'foo' };
    //        var expected = 'var prebootOptions = ' + JSON.stringify(obj);
    //        var actual = generator.getPrebootOptions(obj);
    //        actual.should.equal(expected);
    //    });
    //
    //    it('should stringify with functions', function () {
    //        var obj = { blah: 'foo', zoo: function (blah) { return blah + 1; }};
    //        var expected = 'var prebootOptions = ' + '{"blah":"foo","zoo":"function (blah) { return blah + 1; }"}';
    //        var actual = generator.getPrebootOptions(obj);
    //        actual.should.equal(expected);
    //    });
    //});

    describe('getClientCode()', function () {
        it('should return some client code by default', function (done) {
            generator.getClientCode()
                .then(function (code) {
                    taste.should.exist(code);
                    done();
                })
                .catch(done);
        });

        //it('should return some client code by default', function () {
        //    return generator.getClientCodeStream();
        //});
    });
});
