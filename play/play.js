/**
 * Author: Jeff Whelpley
 * Date: 6/5/15
 *
 * This is for playing with the preload code
 */
var handlebars  = require('handlebars');
var Hapi        = require('hapi');
var server      = new Hapi.Server();
var preboot     = require('../src/server/preboot_server');

server.connection({ port: 3000 });

// setup handlebars as the template engine
handlebars.registerHelper('safe', function(val) {
    return new handlebars.SafeString(val);
});
server.views({
    engines:    { html: handlebars },
    path:       __dirname
});

// only one route
server.route({
    method:     'GET',
    path:       '/',

    handler: function (request, reply) {

        // generate the client code (NOTE: in prod would just generate this ahead of time)
        preboot.getClientCode({
            listen:         [{ name: 'event_bindings' }],
            replay:         [{ name: 'rerender' }],
            focus:          true,
            buffer:         false,
            serverRoot:     'app.server-root',
            clientRoot:     'app.client-root',
            completeEvent:  'BootstrapComplete'
        })
            .then(function (clientCode) {
                reply.view('play', { prebootClientCode: clientCode });
            });
    }
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});