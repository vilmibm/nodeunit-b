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
    var html = b._html;
    var reqs = b._reqs;

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
