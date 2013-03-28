var fs = require('fs'),
path = require('path');
vm = require('vm');

var jsdom = require('jsdom'),
_ = require('underscore');

var constants = require('./constants');

var extractMeta = function(testObj) {
    return _(testObj).defaults(constants.METADEFAULTS);
};

var b = function(testObj) {
    testObj = extractMeta(testObj);
    var setUp = testObj.setUp;
    var tearDown = testObj.tearDown;

    // allow extra injects for this test object
    var additionalInjects = testObj.injects;
    var injects = b.injects;

    // argument providing
    var provides = testObj.provide;

    // preprocess local injects to check for syntax errors
    if (testObj.syntaxCheck) {
        _(injects).each(function(filename) {
            if (!fs.existsSync(filename)) {
                throw 'Local file does not exist: ' + filename;
            }

            var code = fs.readFileSync(filename).toString();

            try {
                vm.createScript(code);
            } catch (e) {
                throw 'Syntax error in local file: ' + filename + ': ' + e;
            }
        });
    }

    testObj.setUp = function(cb) {
        var testcase = this;
        jsdom.env(testObj.html, _(injects).union(additionalInjects), function(err, window) {
            if (err) {
                throw 'JSDom error: ' + err
            }
            testcase.window = window;
            setUp.call(testcase, cb, window, b);
        });
    };

    // set up test methods
    _(testObj).chain()
        .functions()
        .filter(function(funcName) { return funcName.match(/^test/i); })
        .each(function(funcName) {
            var func = testObj[funcName];
            testObj[funcName] = function(test) {
                var w = this.window;
                var args = [test, w];
                var provide_args = provides.map(function(p) { return w[p] });
                return func.apply(this, args.concat(provide_args));
            };
        });

    testObj.tearDown = function(cb) {
        tearDown.call(this, cb, this.window, b);
    };

    return testObj;
};

_(b).extend({
    root: constants.injectRoot,
    setInjectRoot: function() {
        this.root = path.join.apply(path, _(arguments).toArray());
        return this;
    },
    injects: [],
    inject: function(injects) {
        if (_(injects).isString()) { injects = [injects]; }
        _(injects).each(function(injection) {
            if (!injection.match(new RegExp('^'+path.sep))) {
                injection = path.join(b.root, injection);
            }
            this.injects.push(injection);
        }.bind(this));

        return this;
    }
});

module.exports = b;
