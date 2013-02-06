var path = require('path');
var m = require('akeley');
var rewire = require('rewire');
var _ = require('underscore');


exports.test_wrapping = {
    setUp: function(cb) {
        this.b = rewire(path.join(__dirname, '../index.js'));
        cb();
    },

    test_syntax_check_ok: function(test) {
        var b = this.b;
        var tests = {};
        var mock_fs = {
            existsSync: m.create_func({return_value: true}),
            readFileSync: m.create_func({
                return_value: {
                    toString: m.create_func({return_value: 'var a = function() {};'})
                }
            })
        };
        b.__set__('fs', mock_fs);
        b.reqs = ['bogus', 'yup'];
        test.doesNotThrow(function() {
            b(tests);
        });
        test.equal(mock_fs.readFileSync.calls, 2, 'read two files');

        test.done();
    },

    test_syntax_check_fail: function(test) {
        var b = this.b;
        var tests = {};
        var mock_fs = {
            existsSync: m.create_func({return_value: true}),
            readFileSync: m.create_func({
                return_value: {
                    toString: m.create_func({return_value: 'var a = funtion() {};'})
                }
            })
        };
        b.__set__('fs', mock_fs);
        b.reqs = ['bogus', 'yup'];
        test.throws(function() {
            b(tests);
        });
        test.equal(mock_fs.readFileSync.calls, 1, 'read one file');

        test.done();
    },

    test_meta_html: function(test) {
        this.b.html = m.create_func();
        var test_html = '<html></html>';
        var test_obj = {
            html: test_html
        };
        var computed_test_obj = this.b(test_obj);
        test.ok(!computed_test_obj.html, 'html property deleted');
        test.ok(this.b.html.called, 'called html setter');
        test.equal(this.b.html.args[0][0], test_html, 'with appropriate html');
        test.done();
    },

    test_meta_provide: function(test) {
        var mock_window = {
            one: 1,
            two: 2,
            three: 3
        };
        var mock_jsdom = {
            env: function(html, reqs, cb) { cb(); }
        };
        this.b.__set__({jsdom: mock_jsdom});
        var test_provides = ['one','two','three'];
        var test_obj = {
            provide: test_provides,
            test_func0: function(t, w, one, two, three) {
                test.equal(one, 1, 'see 1st provided arg');
                test.equal(two, 2, 'see 2nd provided arg');
                test.equal(three, 3, 'see 3rd provided arg');

            }
        };
        var computed_test_obj = this.b(test_obj);
        test.ok(!computed_test_obj.provide, 'provide property deleted');
        computed_test_obj.test_func0.call({
            window: mock_window
        }, {});
        test.done()
    },

    test_meta_additional_reqs_empty: function(test) {
        var test_reqs = ['one', 'two'];
        var test_obj = {
            requires: test_reqs
        };
        var mock_env = m.create_func();
        this.b.__set__('jsdom', {
            env: mock_env
        });
        var computed_test_obj = this.b(test_obj);
        test.ok(!computed_test_obj.requires, 'requires property deleted');
        computed_test_obj.setUp(m.noop);
        test.ok(mock_env.called, 'sanity: called env');
        test.deepEqual(mock_env.args[0][1], test_reqs, 'see additional reqs');
        test.done();
    },

    test_meta_additional_reqs_nonempty: function(test) {
        var test_reqs = ['two', 'three'];
        this.b.require([
            'one',
            'two',
        ]);
        var test_obj = {
            requires: test_reqs
        };
        var mock_env = m.create_func();
        this.b.__set__('jsdom', {
            env: mock_env
        });
        var computed_test_obj = this.b({syntaxCheck:false}, test_obj);
        test.ok(!computed_test_obj.requires, 'requires property deleted');
        computed_test_obj.setUp(m.noop);
        test.ok(mock_env.called, 'sanity: called env');
        test.deepEqual(mock_env.args[0][1], ['one', 'two', 'three'], 'see additional reqs');
        test.done();
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
            test.equal(test_func_1.calls, 1, 'see 1st func called');
            test.deepEqual(test_func_1.args[0], [mock_test, mock_dom], 'see proper args');

            computed_test_obj.tearDown(function(){});
            test.equal(test_teardown.calls, 1, 'see call to test teardown');
            test.equal(test_teardown.args[0][1], mock_dom, 'see mock_dom in teardown');

            test.done();
        });
    }
};

exports.test_getters_setters = {
    setUp: function(cb) {
        this.b = require(path.join(__dirname, '../index.js'));
        cb();
    },
    test_set_root: function(test) {
        var root = '../../';
        this.b.setRequireRoot(root);
        test.equal(this.b.root, root, 'set root');
        test.done();
    },
    test_set_html: function(test) {
        var html = 'html';
        this.b.html(html);
        test.equal(this.b.html(), html, 'set html');
        test.done();
    }
};

exports.test_requiring = {
    setUp: function(cb) {
        this.b = require(path.join(__dirname, '../index.js'));
        cb();
    },
    tearDown: function(cb) {
        this.b.reqs = [];
        cb();
    },
    test_require_one: function(test) {
        var req = '/requirement';
        this.b.require(req);
        test.deepEqual(this.b.reqs, [req], 'see single req in reqs');
        test.done()
    },
    test_additive: function(test) {
        var req_one = '/req0';
        var req_two = ['/req1', '/req2'];
        this.b.require(req_one);
        this.b.require(req_two);
        var computed_reqs = this.b.reqs;
        test.equal(_(computed_reqs).difference(req_two.concat([req_one])), 0, 'got all reqs, unchanged');
        test.done();
    },
    test_require_absolute: function(test) {
        var reqs = [
            '/hi/there',
            '/what/is/the/haps',
        ];
        this.b.require(reqs);
        var computed_reqs = this.b.reqs;
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
        var computed_reqs = this.b.reqs;
        test.equal(_(computed_reqs).difference(
            _(reqs).map(function(s) { return root + s })
        ).length, 0, 'see computed paths');
        test.done();
    },
};
