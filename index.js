var path = require('path');
var jsdom = require('jsdom');
var _ = require('underscore');

var b = function(tests) {
    var setUp = tests.setUp || function(cb) { cb() };
    var tearDown = tests.tearDown || function(cb) { cb() };
    var html = b._html;
    var reqs = b._reqs;

    tests.setUp = function(cb) {
        var testcase = this;
        jsdom.env(html, reqs, function(err, window) {
            testcase.window = window;
            setUp.call(testcase, cb, window);
        });
    };

    tests.tearDown = function(cb) {
        tearDown.call(this, cb, this.window);
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
                return func.call(this, test, this.window);
            };
        });

    return tests;
};

b._root = __dirname;
b.setRequireRoot = function() {
    var args = _.toArray(arguments);
    b._root = path.join.apply(path, args);

    return b;
};

b._html = '<html><head></head><body></body></html>';
b.html = function(html) { b._html = html; };

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
};


module.exports = b;
