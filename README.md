# preboot

This is a server-side library that allows you to generate a small piece of client-side code 
which can be used to interact with browser events as soon as the window onload occurs.  

* [Use Cases](#use-cases)
* [Installation](#installation)
* [Play](#play)
* [Options](#options)
* [Customized Build](#customized-build)
* [Listen Strategies](#listen-strategies)
* [Replay Strategies](#replay-strategies)
* [Buffering](#buffering)
* [ToDos](#todos)

## Use Cases


TODO: work on this section...

The problem this library solves has to do with the fact that it typically takes several seconds
for a modern client-side JavaScript web app to download and fully bootstrap. This means that
the user may be staring at a blank screen for 5 seconds before the client web app finally 
shows them something. To address this issue, several frameworks have started to implement
server rendering so that the initial page load contains a server rendered view that the
user can look at while the client bootstraps. The only issue, however, is that even though the
user can see the server rendered view, they can't actually interact with the page (other than
links) until the client web app bootstrap is complete. This can lead to UX issues, especially
if the page contains a form. That is where this preboot library comes in. By injecting
preboot into the HEAD section of your server rendered view you can do any of the following:

1. Respond to events - For example, when user clicks button, show spinner
1. Maintain focus - Even if the client web app blows away the server view and re-renders the page, you can maintain focus
1. Record events and play them back later - Keyboard events, button clicks or anything else 
can essentially be deferred until the client is ready to handle them

## Installation

To use this library, you would first install it through npm:

```
npm install preboot
```

Then you can either include it in a gulp task:

```
var preboot = require('preboot');
var opts = {};  // see options section below

gulp.task('preboot', function () {
    return preboot.getClientCodeStream(opts)
        .pipe(gulp.dest('dist'));
});
```

Or you can generate the preboot code in your web server and inject it inline into your server page template.
This is an example with Hapi.js. First the node.js code:

```
var preboot = require('preboot');
var Hapi = require('hapi');
var server = new Hapi.Server();
var handlebars = require('handlebars');

handlebars.registerHelper('safe', function(val) {
    return new handlebars.SafeString(val);
});

server.views({
    engines:    { html: handlebars },
    path:       __dirname
});

server.connection({ port: 3000 });

server.route(
    method:     'GET',
    path:       '/',
    handler: function (request, reply) {
        var opts = {};  // see options section below
        
        preboot.getClientCode(opts)  // can pass callback to second param if you don't like promises
            .then(function (clientCode) {
                reply.view('play', { prebootClientCode: clientCode });
            });
    }
);
```

Then the template for your server page would look like this:

```html
<html>
<head>
    <script>
        {{safe prebootClientCode}}
    </script>
</head>
<body>
    
</body>
</html>
```

The second option should be faster (i.e. since it is inline instead of an extra download)
and it allows you to change the preboot options on a page by page basis 
(if you want to for whatever reason).

The only other thing you will need to make sure you implement is that preboot needs to
know when the client-side web app has finished bootstrapping. So you will need to raise 
an event (either in the framework code or the first thing your app does). By default
this is 'BootstrapComplete'. For example:

```
window.document.dispatchEvent(new Event('BootstrapComplete'));
```

## Play

If you want to play with this library and/or contribute, 
first fork this repo or just clone it locally:

```
git clone git@github.com:jeffwhelpley/preboot.git
```

Then simply run these gulp commands

```
gulp build
gulp play
```

Finally open your browser to http://localhost:3000. To mess around with the options and capabilities,
you will want to modify these files:

1. build/task.build.js - This is where the options are set for Play.
1. play/play.html - The server and client rendered views
1. play/play.js - You can switch from using the external lib, to inline here

The play files still need a lot of work, but you can at least start to get the idea by messing with these.

## Options

These are the options you can pass into preboot:

* `listen` - See Listen Strategies section below. This can either be a string (name of a listen strategy) or array. If an array, each element can
either be a string (name of a listen strategy) or an object that has the following values:
    * `name` - The name of the strategy. This is only used if using a built-in strategy (see Listen Strategies section below)
    * `getNodeEvents` - Either name or this must be filled in for each listen strategy. The purpose here is to implement
    some code that findes and returns objects where each object contains one node and one event name. The input params to
    this function are `strategy` which is the listen strategy and `opts` which are all the options. Note that
    the opts will contain document, serverRoot and clientRoot in addition to opts sent into preboot.
    * `preventDefault` - The default handlers for a given event will not be executed. This use useful for form submit buttons.
    * `dispatchEvent` - The name of an event that should be dispatched on window.document. This is useful for aggregating events.
    * `overlay` - If true, an overlay will be displayed when this event is raised. Useful for button clicks.
    * `doNotReplay` - By default all events will be replayed. If true, however, these events will not.
    * `attributeName` - Only used by the attributes strategy to identify the name of the attribute that will have
    all the events that need to be recorded (default value is 'preboot-events')
    * `eventsBySelector` - This is only used by the selectors strategy. It should be an object that maps a selector
    string to an array of events.
    * `action` - This is can be a function which takes the node and event as input params and can run some custom
    code when a particular event occurs.
* `replay` - See Replay Strategies section below. This can either be a string (name of a replay strategy) or array. If an array, each element can
             either be a string (name of a replay strategy) or an object that has the following values:
     * `name` - The name of the strategy. This is only used if using a built-in strategy (see Replay Strategies section below)
     * `replayEvents` - Either name or this must be filled in for each replay strategy. The purpose here is replay 
     a set of events on the client view. The input params to this function are `events` which is an array
     of eventData objects (i.e. wrapper around events containing node as well), `strategy` which is the 
     listen strategy and `opts` which are all the options. Note that
     the opts will contain document, serverRoot and clientRoot in addition to opts sent into preboot.
     * `checkIfExists` - This boolean value is only used for the hydrate strategy. If true it will do an extra
     check to make sure a target element exists in the visible DOM before attempting to dispatch an event to it.
* `focus` - If true, focus will be maintained from server to client view. Every 50ms the document.activeElement
will be recorded. Once the bootstrap is complete, the client view element that matches the most recent
server view element with focus will get the focus. (Boolean, default false)
* `buffer` - If true, preboot will switch a client view with a server view once the bootstrap process has
completed. This can be useful in some cases where the framework does a re-render of the page, but you
don't want the client view to be displayed until the bootstrap is completely done (i.e. in order to avoid
any jank that may occur during the bootstrapping process). (Boolean, default false)
* `keyPress` - If true, all keystrokes in a textbox or textarea will be transferred from the server
view to the client view. (Boolean, default false)
* `buttonPress` - If true, button presses will be recorded and they will cause an overlay to appear so 
the user can't do anything until the client bootstrap is complete. In other words, you would use this
option if you want to process a button click on the client side, but you don't want the user to do
anything else once they click on it. (Boolean, default false)
* `pauseOnTyping` - If true, the preboot completion will be delayed until the user's focus leaves any 
textbox or textarea (Boolean, default false)
* `serverRoot` - A selector that can be used to find the root element for the server rendered view 
(String, default 'body')
* `clientRoot` - A selector that can be used to find the root element for the client rendered view 
(String, default 'body')
* `completeEvent` - When an event with a name matching the one provided here is raised, preboot will replay all 
recorded events and do other completion tasks.
* `pauseEvent` - When an event with a name matching the one provided here is raised, preboot will not complete. 
In other words, it won't play back and recorded events. (String, default 'PrebootPause')
* `resumeEvent` - When an event with a name matching the one provided here is raised, preboot will resume. 
If the completeEvent was raised, then it will call the complete function which replays recorded events. 
(String, default 'PrebootResume')
* `uglify` - You can always uglify the output of the client code stream yourself, but if you set this
option to true preboot will do it for you.

## Customized Build

The generated client-side code for preboot is customized based on the options you select. So, in other words,
if you only use the attributes listen strategy, the code for the other listen strategies will not
be incldued in the generated code. This was done so that the code could be as small as possible and it would
be feasible to inline in the HEAD of your server rendered view.

## Listen Strategies

The goal of the listen strategies is to inspect the server view and find events on particular nodes that need
to be tracked. It is trival to implement your own custom strategy by passing in a function into the
getNodeEvents option (see [options](#options)), but here are the built-in strategies that you can choose from:
 
1. **attributes** - This strategy will inspect the server view for any element that contains a particular attribute
name (default is 'preboot-events'). So if there is a `<input preboot-events="keypress,focus">` then all keypress
and focus events on that input element would be tracked.
1. **event_bindings** - This strategy is only useful with Angular 2. It walks the DOM to loop for event bindings 
(i.e. anything with ()="" or on-*=""). This is useful for play, but likely shouldn't be used for real since
it can be slow (i.e. walking the DOM), doesn't allow configuration for different types of events and it
doesn't track Angular events defined within a component definition (i.e. not in the template).
1. **selectors** - This strategy requires the use of the eventsBySelector option (see [options section](#options) above).
You basically specify a selector and the events you want for those nodes. For example:
`{ 'input[type="text"],button': ['keypress', 'keydown', 'keyup'] }`

In most cases, you will want to employ multiple strategies and/or the same strategy multiple times with
different configurations for different use cases. Note that certain preboot options will automatically
add certain strategies. For example, if you set the keyPress option to true, then the following 
listen strategy will automatically be added:

```
{
    name: 'selectors',
    overlay: true,
    preventDefault: true,
    eventsBySelector: {
        'input[type="submit"]': ['click'],
        'button':               ['click']
    }
}
```

The return object for all built-in strategies (as well as any custom getNodeEvents) is:

```
{
    node: node,  // the DOM element that is being tracked
    eventName: eventName  // the name of the event to watch out for on that element
}
```

## Replay Strategies

The goal of the replay strategies is to take a list of nodeEvents and replay them in the client rendered
view. It is trival to implement your own custom strategy by passing in a function into the
replayEvents option (see [options](#options)), but here are the built-in strategies that you can choose from:
 
1. **hydrate** - This assumes that the server view and the client view are the same. In other words,
the DOM elements in memory for the server view are still there with the client view. So, when replaying
events, we can simply use the existing nodes in memory. Easy peasy.
1. **rerender** - During a re-render, the client view typically blows the server view away. This would
mean that the nodes we have in memory are no longer valid. However, we can use the nodes in memory
to help find the new client rendered nodes. Once we do, we replay the events, set focus, etc.

## Buffering

When your client framework is re-rendering (i.e. overwriting) the server rendered view, it could lead to 
some unexpected behavior during the transition (often seen as jank). One option to resolve this is
to buffer your client view in a hidden DIV while the user continues to look at the server view. For example:

```
<div class="server">
    <input
            style="height: 50px; width: 50%; font-size: 24px; padding: 20px; margin: 20px 25%"
            type="text"
            name="one">
    <button
            style="height: 50px; width: 50%; font-size: 24px text-align: center; margin: 20px 25%"
            preboot-events="click"
        >Server View</button>
</div>
<div class="client">

</div>
```

If you set the buffer preboot option to true and pass 'div.server' into serverRoot and 'div.client' into clientRoot,
then preboot will automatically do `display: none` on div.client until the client bootstrap is complete. Then it
will switch the buffer by setting div.client to `display: block` and removing the server rendered view from the DOM.

## ToDos

Although this library works really well with my preliminary basic tests, there is still a lot of work to be done.
Any help you want to give in any of these areas with a pull request would be much appreciated.

1. Karma unit tests - This library has extensive server side tests, but is lacking in automated client side tests.
1. Framework integrations - We are already working on an integration with Angular 1.x and Angular 2, but we
need help testing this out with Ember, React and other frameworks.
1. Browser support - So far I have only be testing on the latest version of Chrome. Need help to get working on
other browsers, especially IE.
1. Performance - No performance testing has been done yet. We likely need this at some point since the whole
goal here is to improve percieved performance.

