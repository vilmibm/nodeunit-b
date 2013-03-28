var path = require('path');

var m = require('akeley'),
rewire = require('rewire'),
_ = require('underscore');

var METADEFAULTS = require('../constants').METADEFAULTS;

exports.testMeta = {
    setUp: function(cb) {
        this.b = rewire(path.join(__dirname, '../index.js'));
        cb();
    },
    testSeeAllKeys: function(test) {
        var testObj = {};
        var wrapped = this.b(testObj);
        var difference = _.difference(_(METADEFAULTS).keys(), _(wrapped).keys());
        test.ok(difference.length === 0, 'see all meta keys inserted');
        test.done();
    },
    testMetaHtml: function(test) {
        var mockJsdom = {
            env: m.create_func({func:function(h, r, cb) { cb(); }})
        };
        this.b.__set__({jsdom: mockJsdom});
        var testHtml = '<html></html>';
        var testObj = {
            html: testHtml
        };
        var computedTestObj = this.b(testObj);
        computedTestObj.setUp(function() {});
        test.equal(mockJsdom.env.args[0][0], testHtml, 'see right html');
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
        computed_test_obj.test_func0.call({
            window: mock_window
        }, {});
        test.done()
    },

    test_meta_additional_injects_empty: function(test) {
        var test_injects = ['one', 'two'];
        var test_obj = {
            injects: test_injects
        };
        var mock_env = m.create_func();
        this.b.__set__('jsdom', {
            env: mock_env
        });
        var computed_test_obj = this.b(test_obj);
        computed_test_obj.setUp(m.noop);
        test.ok(mock_env.called, 'sanity: called env');
        test.deepEqual(mock_env.args[0][1], test_injects, 'see additional injects');
        test.done();
    },

    test_meta_additional_injects_nonempty: function(test) {
        var test_injects = ['two', 'three'];
        this.b.inject([
            'one',
            'two',
        ]);
        var test_obj = {
            syntaxCheck: false,
            injects: test_injects
        };
        var mock_env = m.create_func();
        this.b.__set__('jsdom', {
            env: mock_env
        });
        var computed_test_obj = this.b(test_obj);
        computed_test_obj.setUp(m.noop);
        test.ok(mock_env.called, 'sanity: called env');
        test.deepEqual(mock_env.args[0][1], ['one', 'two', 'three'], 'see additional injects');
        test.done();
    },

};

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
        b.injects = ['bogus', 'yup'];
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
        b.injects = ['bogus', 'yup'];
        test.throws(function() {
            b(tests);
        });
        test.equal(mock_fs.readFileSync.calls, 1, 'read one file');

        test.done();
    },

    test_just_tests: function(test) {
        var mock_test = m.create_mock();
        var mock_dom = m.create_mock();
        var mock_env = m.create_func({func:function(html, injects, cb) {
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
        var mock_env = m.create_func({func:function(html, injects, cb) {
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

exports.test_setters = {
    setUp: function(cb) {
        this.b = require(path.join(__dirname, '../index.js'));
        cb();
    },
    test_set_root: function(test) {
        var root = '../../';
        this.b.setInjectRoot(root);
        test.equal(this.b.root, root, 'set root');
        test.done();
    }
};

exports.test_injecting = {
    setUp: function(cb) {
        this.b = require(path.join(__dirname, '../index.js'));
        cb();
    },
    tearDown: function(cb) {
        this.b.injects = [];
        cb();
    },
    test_inject_one: function(test) {
        var inject = '/injection';
        this.b.inject(inject);
        test.deepEqual(this.b.injects, [inject], 'see single inject in injects');
        test.done()
    },
    test_additive: function(test) {
        var inject_one = '/inject0';
        var inject_two = ['/inject1', '/inject2'];
        this.b.inject(inject_one);
        this.b.inject(inject_two);
        var computed_injects = this.b.injects;
        test.equal(_(computed_injects).difference(inject_two.concat([inject_one])), 0, 'got all injects, unchanged');
        test.done();
    },
    test_inject_absolute: function(test) {
        var injects = [
            '/hi/there',
            '/what/is/the/haps',
        ];
        this.b.inject(injects);
        var computed_injects = this.b.injects;
        test.equal(computed_injects.length, 2, 'see 2 injects');
        test.equal(_(computed_injects).difference(injects).length, 0, 'got all injects, unchanged');
        test.done();
    },
    test_inject_relative: function(test) {
        var injects = [
            'hi/there',
            'what/is/the/haps',
        ];
        var root = '../';
        this.b.setInjectRoot(root);
        this.b.inject(injects);
        var computed_injects = this.b.injects;
        test.equal(_(computed_injects).difference(
            _(injects).map(function(s) { return root + s })
        ).length, 0, 'see computed paths');
        test.done();
    },
};
