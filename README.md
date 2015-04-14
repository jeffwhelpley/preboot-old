# angular-preboot

The purpose of this library is to demonstrate how we can record events on a server rendered
page BEFORE Angular bootstraps. It would work like this:

1. The server rendered page includes this inline JavaScript
1. As soon as the document loads, this code will immediately add event handlers to the document wherever there
are Angular events defined in the HTML (i.e. either (someevent)="blah()" or on-someevent="blah()"
1. Each time one of these events occur, all the relevant info is saved to a global array angularPreBootEvents
1. Once Angular bootstrapping is complete, Angular looks at angularPreBootEvents and replays the events as appropriate

## Installation

You will need to pull down the repo to try this out.

```
git clone git@github.com:jeffwhelpley/angular-preboot.git
```

Then simply run gulp

```
gulp
```

And open your browser to http://localhost:8080/.

## Discussion Points

This works fine, but a number of things to discuss:

* **Selection** - After some attempts to select the DOM nodes with a selector, I decided to just walk the entire
DOM tree and look for the ()= or on- attributes. It should still be fast enough, but we can discuss. I also 
considered having the server pass in specific elements as parameters, but we probably want to avoid that
complexity unless we need it for optimization purposes.
* **preventDefault** - I realized that in order to prevent unwanted behavior with form submissions and that sort of
thing, we need to event.preventDefault() wherever there is an Angular event handler. Let's discuss if this will
cause any unwanted side effects.
* **testing** - I don't have any formal tests set up yet. Let's talk about what type of tests we need to have
in order to ensure this will work for all our use cases.
