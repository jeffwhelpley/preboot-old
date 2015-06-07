/**
 * Author: Jeff Whelpley
 * Date: 6/6/15
 *
 *
 */
var name        = 'client/select/dom_selector';
var taste       = require('taste');
var domSelector = taste.target(name);

function addParent(node) {
    if (node && node.childNodes) {
        for (var i = 0; i < node.childNodes.length; i++) {
            node.childNodes[i].parentNode = node;
            addParent(node.childNodes[i]);
        }
    }
}

describe('UNIT ' + name, function () {
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
            var actual = domSelector.getNodeKey(node, rootNode);
            actual.should.equal(expected);
        });
    });

    describe('findClientNode()', function () {
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
        var opts = {
            serverRoot: serverRoot,
            clientRoot: clientRoot,
            document: {
                querySelectorAll: function () {
                    return [clientNode];
                }
            }
        };

        addParent(serverDocument);
        addParent(clientDocument);

        it('should find a client node from a server node', function () {
            var actual = domSelector.findClientNode(serverNode, opts);
            actual.should.equal(clientNode);

            var nodeInCache = domSelector.nodeCache['DIV_s2_s4'];
            taste.should.exist(nodeInCache, 'No item found in cache');
            nodeInCache.length.should.be.greaterThan(0);
            nodeInCache[0].clientNode.should.equal(clientNode);
            nodeInCache[0].serverNode.should.equal(serverNode);
        });

        it('should get client node from cache', function () {
            var expected = { blah: 'true' };
            domSelector.nodeCache['DIV_s2_s4'] = [{
                clientNode: expected,
                serverNode: serverNode
            }];

            var actual = domSelector.findClientNode(serverNode, opts);
            actual.should.equal(expected);
        });
    });
});