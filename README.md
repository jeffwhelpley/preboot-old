# angular-preboot

The purpose of this library is to demonstrate how we can record events on a server rendered
page BEFORE Angular bootstraps. This works by doing the following:

1. The server rendered page includes this inline JavaScript
1. As soon as the document loads, this code will do one of two things (TBD on which one we will choose):
    * immediately add event handlers to the document wherever there are Angular events defined in the HTML (i.e. either (someevent)="blah()" or on-someevent="blah()"
    * OR we simply look for elements with a class 'preboot' and use all the events in the preboot-events attribute
    * OR some combination of these two
1. Each time one of these events occur, all the relevant info is saved to a global array angularPreBoot.events
1. Once Angular bootstrapping is complete, Angular looks at angularPreBoot.events and replays the events as appropriate
1. Finally, Angular calls angularPreBoot.cleanup() to remove all the preboot event handlers and delete preboot events

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

* **Selection** - We need to decide on whether to do the DOM walk, class selection or something in between
* **preventDefault** - I realized that in order to prevent unwanted behavior with form submissions and that sort of
thing, we need to event.preventDefault() wherever there is an Angular event handler. Let's discuss if this will
cause any unwanted side effects.
* **testing** - I don't have any formal tests set up yet. Let's talk about what type of tests we need to have
in order to ensure this will work for all our use cases.
