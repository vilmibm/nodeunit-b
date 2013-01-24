var path = require('path');
var fs = require('fs');
var vm = require('vm');

var jsdom = require('jsdom');
var _ = require('underscore');

var b = function(opts, tests) {
    if (arguments.length == 1) {
        tests = opts;
        opts = {
            syntaxCheck: true
        }
    }

    var setUp = tests.setUp || function(cb) { cb() };
    var tearDown = tests.tearDown || function(cb) { cb() };

    // allow setting html per test object
    if (tests.html) {
        b.html(tests.html);
    }
    var html = b._html;

    // allow extra reqs for this test object
    var additionalReqs = tests.requires || [];
    var reqs = b._reqs;

    // allow setting of provides when setting up test obj
    if (tests.provide) {
        b.provide(tests.provide);
    }

    // clean up nodeunit-b properties
    ['requires', 'provide', 'html'].forEach(function(p) { delete tests[p] });

    // preprocess local reqs to check for syntax errors
    if (opts.syntaxCheck) {
        _(reqs).each(function(filename) {
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
            testcase.window = window;
            setUp.call(testcase, cb, window, b);
        });
    };

    tests.tearDown = function(cb) {
        var wrapped_cb = function() {
            // clear provides each time through so they're clear after the last
            // run.
            b.setProvides([]);
            cb();
        };
        tearDown.call(this, wrapped_cb, this.window, b);
    };

    // set up test methods
    _(tests).chain()
        .functions()
        .filter(function(funcName) {
            return funcName.match(/^test/i);
        })
        .each(function(funcName) {
            var func = tests[funcName];
            tests[funcName] = function(test) {
                var w = this.window;
                var args = [test, w];
                var provide_args = b.getProvides().map(function(p) { return w[p] });
                return func.apply(this, args.concat(provide_args));
            };
        });

    return tests;
};

b.provide = function() {
    var props = _(arguments).toArray();
    b._provides = _(b._provides).union(props);

    return b;
};
b.getProvides = function() {
    return b._provides;
};
b.setProvides = function(propertyList) {
    b._provides = propertyList;
};
b._provides = [];

b._root = './';
b.setRequireRoot = function() {
    var args = _.toArray(arguments);
    b._root = path.join.apply(path, args);

    return b;
};

b._html = '<html><head></head><body></body></html>';
b.html = function(html) {
    b._html = html;

    return b;
};

b._reqs = [];
b.require = function(reqs) {
    if (_(reqs).isString()) {
        reqs = [reqs];
    }
    _(reqs).each(function(req) {
        if (!req.match(new RegExp('^'+path.sep))) {
            req = path.join(b._root, req);
        }
        b._reqs.push(req);
    });

    return b;
};


module.exports = b;
