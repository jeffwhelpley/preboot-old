# Preboot Contributors Guide

Although this library works really well with my preliminary basic tests, there is still a lot of work to be done.
Any help you want to give in any of these areas with a pull request would be much appreciated.
 
1. **Karma unit tests** - This library has extensive server side tests, but is lacking in automated client side tests.
1. **Framework integrations** - We are already working on an integration with Angular 1.x and Angular 2, but we
need help testing this out with Ember, React and other frameworks.
1. **Browser support** - So far I have only be testing on the latest version of Chrome. Need help to get working on
other browsers, especially IE.
1. **Performance** - No performance testing has been done yet. We likely need this at some point since the whole
goal here is to improve percieved performance.
1. **Build time warning messages** - Much better warning/error messages while attempting to build the preboot client
side code to help guide developers.
1. **Optional Code** - Need to get the Browserify ignore() working. Something messed up with it now.

More info coming soon on the internals of this library, but if you look through the code, you will find that it
has a lot of comments is should be pretty easy to follow along. Start with 
[preboot_client](https://github.com/jeffwhelpley/preboot/blob/master/src/client/preboot_client.js).