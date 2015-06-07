/**
 * Author: Jeff Whelpley
 * Date: 6/6/15
 *
 *
 */
var name        = 'client/focus/focus_manager';
var taste       = require('taste');
var focusMgr    = taste.target(name);
var state       = focusMgr.state;

describe('UNIT ' + name, function () {
    describe('checkFocus()', function () {
        it('should do nothing if tracking not enabled', function () {
            state.trackingEnabled = false;
            state.currentFocus = null;
            var document = { activeElement: 'blah' };
            focusMgr.checkFocus(document);
            taste.should.not.exist(state.currentFocus);
        });

        it('should change current focus to document active element', function () {
            state.trackingEnabled = true;
            var document = { activeElement: 'blah' };
            focusMgr.checkFocus(document);
            state.currentFocus.should.equal(document.activeElement);
            state.trackingEnabled = false;
        });

        it('should keep current focus if no active element', function () {
            state.trackingEnabled = true;
            state.currentFocus = 'foo';
            var document = { activeElement: null };
            focusMgr.checkFocus(document);
            state.currentFocus.should.equal('foo');
            state.trackingEnabled = false;
        });
    });

    describe('startTracking()', function () {
        it('should set the current active element', function () {
            var document = { activeElement: 'blah' };
            focusMgr.startTracking(document);
            state.currentFocus.should.equal(document.activeElement);
            state.trackingEnabled.should.equal(true);
            state.trackingEnabled = false;
        });
    });

    describe('stopTracking()', function () {
        it('should set trackingEnabled to false', function () {
            state.trackingEnabled = true;
            focusMgr.stopTracking();
            state.trackingEnabled.should.equal(false);
        });
    });

    describe('setFocus()', function () {
        it('should do nothing if no current focus', function () {
            state.currentFocus = null;
            focusMgr.setFocus({});
        });

        // can't test mocking setFocus without domSelector; do this later
    });
});