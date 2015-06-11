/**
 * Author: Jeff Whelpley
 * Date: 6/11/15
 *
 * Server side testing for some the DOM wrapper
 */
var name    = 'client/dom';
var taste   = require('taste');
var dom     = taste.target(name);

function addParent(node) {
    if (node && node.childNodes) {
        for (var i = 0; i < node.childNodes.length; i++) {
            node.childNodes[i].parentNode = node;
            addParent(node.childNodes[i]);
        }
    }
}

var serverNode = { nodeName: 'DIV' };
var serverDocument = {
    childNodes: [{}, {}, {
        childNodes: [{}, {
            childNodes: [{}, {}, {}, serverNode]
        }]
    }]
};
var serverRoot = serverDocument.childNodes[2];
var clientNode = { nodeName: 'DIV' };
var clientDocument = {
    childNodes: [{}, {}, {
        childNodes: [{}, {
            childNodes: [{}, {}, {}, clientNode]
        }]
    }]
};
var clientRoot = clientDocument.childNodes[2];
clientRoot.querySelectorAll = function () {
    return [clientNode];
};

addParent(serverDocument);
addParent(clientDocument);

describe('UNIT ' + name, function () {

    beforeEach(function () {
        dom.reset();
    });

    describe('getNodeKey()', function () {
        it('should generate a key based of the node structure', function () {
            var node = { nodeName: 'DIV' };
            var document = {
                childNodes: [{}, {}, {
                    childNodes: [{}, {
                        childNodes: [{}, {}, {}, node]
                    }]
                }]
            };
            var rootNode = document.childNodes[2];

            addParent(document);

            var expected = 'DIV_s2_s4';
            var actual = strategy.getNodeKey(node, rootNode);
            actual.should.equal(expected);
        });
    });

    describe('findClientNode()', function () {
        it('should find a client node from a server node', function () {
            dom.reset();
            dom.state.clientRoot = clientRoot;
            dom.state.appRoot = dom.state.serverRoot = serverRoot;

            var actual = strategy.findClientNode(serverNode);
            actual.should.equal(clientNode);

            /* jshint camelcase: false */
            var nodeInCache = strategy.nodeCache.DIV_s2_s4;
            taste.should.exist(nodeInCache, 'No item found in cache');
            nodeInCache.length.should.be.greaterThan(0);
            nodeInCache[0].clientNode.should.equal(clientNode);
            nodeInCache[0].serverNode.should.equal(serverNode);
        });

        it('should get client node from cache', function () {
            dom.reset();
            dom.state.clientRoot = clientRoot;
            dom.state.appRoot = dom.state.serverRoot = serverRoot;

            var expected = { blah: 'true' };

            /* jshint camelcase: false */
            strategy.nodeCache.DIV_s2_s4 = [{
                clientNode: expected,
                serverNode: serverNode
            }];

            var actual = strategy.findClientNode(serverNode);
            actual.should.equal(expected);
        });
    });
});