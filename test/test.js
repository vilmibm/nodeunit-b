var path = require('path');
var m = require('akeley');
var rewire = require('rewire');
var _ = require('underscore');



exports.test_wrapping = {
    setUp: function(cb) {
        this.b = rewire(path.join(__dirname, '../index.js'));
        cb();
    },

    test_just_tests: function(test) {
        var mock_test = m.create_mock();
        var mock_dom = m.create_mock();
        var mock_env = m.create_func({func:function(html, reqs, cb) {
            cb(null, mock_dom);
        }});
        this.b.__set__('jsdom', { env: mock_env, });
        var test_func_0 = m.create_func();
        var test_func_1 = m.create_func();
        var test_obj = {
            test_func_0: test_func_0,
            test_func_1: test_func_1
        };

        var computed_test_obj = this.b(test_obj);

        test.ok(_(computed_test_obj).has('setUp'), 'setUp added');
        test.ok(_(computed_test_obj).has('tearDown'), 'tearDown added');

        var tearDown = computed_test_obj.tearDown;
        computed_test_obj.setUp(function() {
            test.equal(computed_test_obj.window, mock_dom, 'see mock_dom');
            computed_test_obj.test_func_0(mock_test);
            test.equal(test_func_0.calls, 1, 'see 0th func called');
            test.deepEqual(test_func_0.args[0], [mock_test, mock_dom], 'see proper args');
            computed_test_obj.test_func_1(mock_test);
            test.equal(test_func_1.calls, 1, 'see 0th func called');
            test.deepEqual(test_func_1.args[0], [mock_test, mock_dom], 'see proper args');
            test.done();
        });
    },

    test_with_setUp_tearDown: function(test) {
        var mock_test = m.create_mock();
        var mock_dom = m.create_mock();
        var mock_env = m.create_func({func:function(html, reqs, cb) {
            cb(null, mock_dom);
        }});
        this.b.__set__('jsdom', { env: mock_env, });
        var test_func_0 = m.create_func();
        var test_func_1 = m.create_func();
        var test_setup = m.create_func({func:function(cb){cb();}});
        var test_teardown = m.create_func({func:function(cb){cb();}});
        var test_obj = {
            setUp: test_setup,
            tearDown: test_teardown,
            test_func_0: test_func_0,
            test_func_1: test_func_1
        };

        var computed_test_obj = this.b(test_obj);

        test.ok(_(computed_test_obj).has('setUp'), 'setUp retained');
        test.ok(_(computed_test_obj).has('tearDown'), 'tearDown retained');

        computed_test_obj.setUp(function() {
            test.equal(test_setup.calls, 1, 'see call to test setup');
            test.equal(computed_test_obj.window, mock_dom, 'see mock_dom');
            test.equal(test_setup.args[0][1], mock_dom, 'see mock_dom in setup');

            computed_test_obj.test_func_0(mock_test);
            test.equal(test_func_0.calls, 1, 'see 0th func called');
            test.deepEqual(test_func_0.args[0], [mock_test, mock_dom], 'see proper args');

            computed_test_obj.test_func_1(mock_test);
            test.equal(test_func_1.calls, 1, 'see 0th func called');
            test.deepEqual(test_func_1.args[0], [mock_test, mock_dom], 'see proper args');

            computed_test_obj.tearDown(function(){});
            test.equal(test_teardown.calls, 1, 'see call to test teardown');
            test.equal(test_teardown.args[0][1], mock_dom, 'see mock_dom in teardown');

            test.done();
        });
    },
};

exports.test_setters = {
    setUp: function(cb) {
        this.b = require(path.join(__dirname, '../index.js'));
        cb();
    },
    test_set_root: function(test) {
        var root = '../../';
        this.b.setRequireRoot(root);
        test.equal(this.b._root, root, 'set root');
        test.done();
    },
    test_set_html: function(test) {
        var html = 'html';
        this.b.html(html);
        test.equal(this.b._html, html, 'set html');
        test.done();
    },
};

exports.test_requiring = {
    setUp: function(cb) {
        this.b = require(path.join(__dirname, '../index.js'));
        cb();
    },
    tearDown: function(cb) {
        this.b._reqs = [];
        cb();
    },
    test_require_one: function(test) {
        var req = '/requirement';
        this.b.require(req);
        test.deepEqual(this.b._reqs, [req], 'see single req in reqs');
        test.done()
    },
    test_additive: function(test) {
        var req_one = '/req0';
        var req_two = ['/req1', '/req2'];
        this.b.require(req_one);
        this.b.require(req_two);
        var computed_reqs = this.b._reqs;
        test.equal(_(computed_reqs).difference(req_two.concat([req_one])), 0, 'got all reqs, unchanged');
        test.done();
    },
    test_require_absolute: function(test) {
        var reqs = [
            '/hi/there',
            '/what/is/the/haps',
        ];
        this.b.require(reqs);
        var computed_reqs = this.b._reqs;
        test.equal(computed_reqs.length, 2, 'see 2 reqs');
        test.equal(_(computed_reqs).difference(reqs).length, 0, 'got all reqs, unchanged');
        test.done()
    },
    test_require_relative: function(test) {
        var reqs = [
            'hi/there',
            'what/is/the/haps',
        ];
        var root = '../';
        this.b.setRequireRoot(root);
        this.b.require(reqs);
        var computed_reqs = this.b._reqs;
        test.equal(_(computed_reqs).difference(
            _(reqs).map(function(s) { return root + s })
        ).length, 0, 'see computed paths');
        test.done();
    },
};
