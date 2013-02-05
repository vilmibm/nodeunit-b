var fs = require('fs');
var path = require('path');
var vm = require('vm');

var jsdom = require('jsdom');
var _ = require('underscore');

var b = function(opts, tests) {
    if (arguments.length === 1) {
        tests = opts;
        opts = {
            syntaxCheck: true
        };
    }
    else {
        if (_(opts.syntaxCheck).isUndefined()) {
            opts.syntaxCheck = true;
        }
    }

    var setUp = tests.setUp || function(cb) { cb() };
    var tearDown = tests.tearDown || function(cb) { cb() };

    // allow setting html per test object
    if (tests.html) {
        b.html(tests.html);
    }
    var html = b.html;

    // allow extra reqs for this test object
    var additionalReqs = tests.requires || [];
    var reqs = b.reqs;

    // argument providing
    var provides = tests.provide || [];

    // clean up nodeunit-b properties
    ['requires', 'provide', 'html'].forEach(function(p) { delete tests[p] });

    // preprocess local reqs to check for syntax errors
    if (opts.syntaxCheck) {
        _(reqs).each(function(filename) {
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

    tests.setUp = function(cb) {
        var testcase = this;
        jsdom.env(html, _(reqs).union(additionalReqs), function(err, window) {
            if (err) {
                throw 'JSDom error: ' + err
            }
            testcase.window = window;
            setUp.call(testcase, cb, window, b);
        });
    };

    // set up test methods
    _(tests).chain()
        .functions()
        .filter(function(funcName) { return funcName.match(/^test/i); })
        .each(function(funcName) {
            var func = tests[funcName];
            tests[funcName] = function(test) {
                var w = this.window;
                var args = [test, w];
                var provide_args = provides.map(function(p) { return w[p] });
                return func.apply(this, args.concat(provide_args));
            };
        });

    tests.tearDown = function(cb) {
        tearDown.call(this, cb, this.window, b);
    };

    return tests;
};

_(b).extend({
    root: './',
    setRequireRoot: function() {
        this.root = path.join.apply(path, _(arguments).toArray());
        return this;
    },
    reqs: [],
    require: function(reqs) {
        if (_(reqs).isString()) { reqs = [reqs]; }
        var self = this;
        _(reqs).each(function(req) {
            if (!req.match(new RegExp('^'+path.sep))) {
                req = path.join(b.root, req);
            }
            self.reqs.push(req);
        });

        return this;
    },
    _html: '<html><head></head><body></body></html>',
});

Object.defineProperty(b, 'html', {
    get: function() { return this._html },
    set: function(html) { this._html = html; return b }
});

module.exports = b;
