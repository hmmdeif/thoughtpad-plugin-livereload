thoughtpad-plugin-livereload
=================================

[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

A thoughtpad plugin that responds to Javscript precompile event. It will load up primus scripts to allow the browser to respond to code changes.

## Usage

The plugin should be loaded using the [thoughtpad-plugin-manager](https://github.com/thoughtpad/thoughtpad-plugin-manager). Once this has been done then the plugin will respond to events. To use standalone:

```JavaScript
var man = require('thoughtpad-plugin-manager'),
    livereload = require('thoughtpad-plugin-livereload');

var thoughtpad = man.registerPlugins([livereload]);
thoughtpad.subscribe("javascript-precompile-complete", function (data) {
    console.log("Live reload code object here"); 
});
yield thoughtpad.notify("javascript-precompile-request", {});
```

## Tests

Ensure you have globally installed mocha - `npm -g install mocha`. Then you can run:

`mocha --harmony-generators`

Alternatively if you are in a *NIX environment `npm test` will run the tests plus coverage data.

## License

The code is available under the [MIT license](http://deif.mit-license.org/).

[travis-image]: https://img.shields.io/travis/thoughtpad/thoughtpad-plugin-livereload/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/thoughtpad/thoughtpad-plugin-livereload
[coveralls-image]: https://img.shields.io/coveralls/thoughtpad/thoughtpad-plugin-livereload/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/thoughtpad/thoughtpad-plugin-livereload?branch=master
