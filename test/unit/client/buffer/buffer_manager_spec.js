/**
 * Author: Jeff Whelpley
 * Date: 6/6/15
 *
 *
 */
var name        = 'client/buffer/buffer_manager';
var taste       = require('taste');
var bufferMgr   = taste.target(name);

describe('UNIT ' + name, function () {
    describe('hideClient()', function () {
        it('should set the style to display none', function () {
            var clientRoot = { style: {}};
            var expected = 'none';
            bufferMgr.hideClient(clientRoot);
            clientRoot.style.display.should.equal(expected);
        });
    });

    describe('switchBuffer()', function () {
        it('should set clientRoot to display block', function () {
            var clientRoot = { style: {}};
            var expected = 'block';
            bufferMgr.switchBuffer({ clientRoot: clientRoot });
            clientRoot.style.display.should.equal(expected);
        });

        it('should call remove on server root', function () {
            var clientRoot = { style: {}};
            var serverRoot = { remove: taste.spy() };
            var opts = { clientRoot: clientRoot, serverRoot: serverRoot };
            var expected = 'block';
            bufferMgr.switchBuffer(opts);
            clientRoot.style.display.should.equal(expected);
            serverRoot.remove.should.have.callCount(1);
        });
    });
});