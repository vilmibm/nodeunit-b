# nodeunit-b

_being a library for conveniently testing browser javascript with node_

nodeunit-b provides a convenient interface around jsdom, bootstrapping
front-end code with a DOM and allowing you to unit test it with nothing more
than node and a few libraries (ie, no browser).


## Example

        var b = require('nodeunit-b');

        // you'll want to use __dirname to pin root relative to your test file.
        // arguments to setRequireRoot are run through path.join.
        b.setRequireRoot(__dirname, '../../');

        // front-end dependencies to require and inject into the DOM.
        b.require([
            // relative to where you set require root
            'jquery.js',
            'underscore.js',
            'lib_i_want_to_test.js' // provides, say, window.myLib
        ]);

        // wrap your test object
        exports.test_all_the_things = b({
            setUp: function(cb, b) {
                // mock out jquery.ajax
                b.$.ajax = function() { };
                cb();
            },
            tearDown: function(cb, b) [
                // another chance to mutate b
                cb();
            },
            test_thing: function(test, b) {
                var $ = b.$;
                $('<span/>').appendTo('body').addClass('foo');

                b.myLib.fooToBar();

                test.ok($('span').hasClass('bar'), 'we set the class');
                test.ok(!$('span').hasClass('foo'), 'and removed the old one');

                test.done();
            }
        });


## Install

        npm install nodeunit-b


## API

**b**

        exports.test_object = b(test_object);

The primary function. This produces a nodeunit test object that will provide a
DOM to setUp, tearDown, and test functions (see above code example).

**setRequireRoot**

        b.setRequireRoot('../');

Set the location to which front-end requires will be relative. For example, if your test resides in:

        /home/nate/src/proj/static/js/myLib/tests/test.js

and you want to reference dependencies in `/home/nate/src/proj/static/js/`, then:

        b.setRequireRoot('../../');

will set the require root to `/home/nate/src/proj/static/js/`.

**require**

        b.require(['jquery.js', 'underscore.js', 'myLib.js']);

or

        b.require('myLib.js');

Inject a dependency into the DOM.

**html**

        b.html('<html class="ie"></html>');

Sets the HTML used to bootstrap the DOM. By default this HTML is set to:

        <html><head></head><body></body></html>

## Changelog

1.0.1
 * slight improvement to setRequireRoot.
 * fluent interface
 * doc clarification

1.0.0
 * it works

## Author

nathaniel k smith <nathanielksmith@gmail.com>

## License

MIT
