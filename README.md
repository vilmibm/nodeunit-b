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
            // Note that these files will be checked for syntax errors.
            'jquery.js',
            'underscore.js',
            'lib_i_want_to_test.js' // provides, say, window.myLib
        ]);

        // wrap your test object
        exports.test_all_the_things = b({
            setUp: function(cb, w, b) {
                // w is a window object with a document attached
                // b is still b

                // mock out jquery.ajax
                w.$.ajax = function() { };
                // make these conveniently available to tests
                w.provide('$', '_', 'myLib');
                cb();
            },
            tearDown: function(cb, w, b) [
                // another chance to mutate b, w
                // (though w will be reset in setUp)
                cb();
            },
            test_thing: function(test, w, $, _, myLib) {
                $('<span/>').appendTo('body').addClass('foo');

                myLib.fooToBar();

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
        exports.test_object = b(opts, test_object);

The primary function. This produces a nodeunit test object that will provide a
DOM to setUp, tearDown, and test functions (see above code example).

Currently the only supported option is `syntaxCheck`. Setting it to false will
disable the automatic syntax checking of your require()d files. For example,

        exports.test_foo = b({syntaxCheck:false}, {
            test_bar: function(test) { }
        });

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

**provide**

        b.provide('$', '_');

Called within a setUp. Makes the named properties of window available as named
parameters to test functions. If you've called `b.provide('$', '_', 'myLib');
in your test object's setUp then you can write a test function like so:

        test_foo: function(test, w, $, _, myLib) {
            // $, _, myLib are all in scope for this test.
        }

Be careful of masking, say, a nodejs underscore running in your tests vs. a
window._ running in your front-end code.

## Changelog

2.0.0
 * `provide` feature
 * backwards compat brokenish, hence major version

1.1.0
 * syntax checking

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
