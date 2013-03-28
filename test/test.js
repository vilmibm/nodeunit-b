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

    testMetaProvide: function(test) {
        var mockWindow = {
            one: 1,
            two: 2,
            three: 3
        };
        var mockJsdom = {
            env: function(html, reqs, cb) { cb(); }
        };
        this.b.__set__({jsdom: mockJsdom});
        var testProvides = ['one','two','three'];
        var testObj = {
            provide: testProvides,
            testFunc0: function(t, w, one, two, three) {
                test.equal(one, 1, 'see 1st provided arg');
                test.equal(two, 2, 'see 2nd provided arg');
                test.equal(three, 3, 'see 3rd provided arg');

            }
        };
        var computedTestObj = this.b(testObj);
        computedTestObj.testFunc0.call({
            window: mockWindow
        }, {});
        test.done()
    },

    testMetaAdditionalInjectsEmpty: function(test) {
        var testInjects = ['one', 'two'];
        var testObj = {
            injects: testInjects
        };
        var mockEnv = m.create_func();
        this.b.__set__('jsdom', {
            env: mockEnv
        });
        var computedTestObj = this.b(testObj);
        computedTestObj.setUp(m.noop);
        test.ok(mockEnv.called, 'sanity: called env');
        test.deepEqual(mockEnv.args[0][1], testInjects, 'see additional injects');
        test.done();
    },

    testMetaAdditionalInjectsNonempty: function(test) {
        var testInjects = ['two', 'three'];
        this.b.inject([
            'one',
            'two',
        ]);
        var testObj = {
            syntaxCheck: false,
            injects: testInjects
        };
        var mockEnv = m.create_func();
        this.b.__set__('jsdom', {
            env: mockEnv
        });
        var computedTestObj = this.b(testObj);
        computedTestObj.setUp(m.noop);
        test.ok(mockEnv.called, 'sanity: called env');
        test.deepEqual(mockEnv.args[0][1], ['one', 'two', 'three'], 'see additional injects');
        test.done();
    },

};

exports.testWrapping = {
    setUp: function(cb) {
        this.b = rewire(path.join(__dirname, '../index.js'));
        cb();
    },

    testSyntaxCheckOk: function(test) {
        var b = this.b;
        var tests = {};
        var mockFs = {
            existsSync: m.create_func({return_value: true}),
            readFileSync: m.create_func({
                return_value: {
                    toString: m.create_func({return_value: 'var a = function() {};'})
                }
            })
        };
        b.__set__('fs', mockFs);
        b.injects = ['bogus', 'yup'];
        test.doesNotThrow(function() {
            b(tests);
        });
        test.equal(mockFs.readFileSync.calls, 2, 'read two files');

        test.done();
    },

    testSyntaxCheckFail: function(test) {
        var b = this.b;
        var tests = {};
        var mockFs = {
            existsSync: m.create_func({return_value: true}),
            readFileSync: m.create_func({
                return_value: {
                    toString: m.create_func({return_value: 'var a = funtion() {};'})
                }
            })
        };
        b.__set__('fs', mockFs);
        b.injects = ['bogus', 'yup'];
        test.throws(function() {
            b(tests);
        });
        test.equal(mockFs.readFileSync.calls, 1, 'read one file');

        test.done();
    },

    testJustTests: function(test) {
        var mockTest = m.create_mock();
        var mockDom = m.create_mock();
        var mockEnv = m.create_func({func:function(html, injects, cb) {
            cb(null, mockDom);
        }});
        this.b.__set__('jsdom', { env: mockEnv, });
        var testFunc0 = m.create_func();
        var testFunc1 = m.create_func();
        var testObj = {
            testFunc0: testFunc0,
            testFunc1: testFunc1
        };

        var computedTestObj = this.b(testObj);

        test.ok(_(computedTestObj).has('setUp'), 'setUp added');
        test.ok(_(computedTestObj).has('tearDown'), 'tearDown added');

        var tearDown = computedTestObj.tearDown;
        computedTestObj.setUp(function() {
            test.equal(computedTestObj.window, mockDom, 'see mockDom');
            computedTestObj.testFunc0(mockTest);
            test.equal(testFunc0.calls, 1, 'see 0th func called');
            test.deepEqual(testFunc0.args[0], [mockTest, mockDom], 'see proper args');
            computedTestObj.testFunc1(mockTest);
            test.equal(testFunc1.calls, 1, 'see 0th func called');
            test.deepEqual(testFunc1.args[0], [mockTest, mockDom], 'see proper args');
            test.done();
        });
    },

    testWithSetUpTearDown: function(test) {
        var mockTest = m.create_mock();
        var mockDom = m.create_mock();
        var mockEnv = m.create_func({func:function(html, injects, cb) {
            cb(null, mockDom);
        }});
        this.b.__set__('jsdom', { env: mockEnv, });
        var testFunc0 = m.create_func();
        var testFunc1 = m.create_func();
        var testSetup = m.create_func({func:function(cb){cb();}});
        var testTeardown = m.create_func({func:function(cb){cb();}});
        var testObj = {
            setUp: testSetup,
            tearDown: testTeardown,
            testFunc0: testFunc0,
            testFunc1: testFunc1
        };

        var computedTestObj = this.b(testObj);

        test.ok(_(computedTestObj).has('setUp'), 'setUp retained');
        test.ok(_(computedTestObj).has('tearDown'), 'tearDown retained');

        computedTestObj.setUp(function() {
            test.equal(testSetup.calls, 1, 'see call to test setup');
            test.equal(computedTestObj.window, mockDom, 'see mockDom');
            test.equal(testSetup.args[0][1], mockDom, 'see mockDom in setup');

            computedTestObj.testFunc0(mockTest);
            test.equal(testFunc0.calls, 1, 'see 0th func called');
            test.deepEqual(testFunc0.args[0], [mockTest, mockDom], 'see proper args');

            computedTestObj.testFunc1(mockTest);
            test.equal(testFunc1.calls, 1, 'see 1st func called');
            test.deepEqual(testFunc1.args[0], [mockTest, mockDom], 'see proper args');

            computedTestObj.tearDown(function(){});
            test.equal(testTeardown.calls, 1, 'see call to test teardown');
            test.equal(testTeardown.args[0][1], mockDom, 'see mockDom in teardown');

            test.done();
        });
    }
};

exports.testSetters = {
    setUp: function(cb) {
        this.b = require(path.join(__dirname, '../index.js'));
        cb();
    },
    testSetRoot: function(test) {
        var root = '../../';
        this.b.setInjectRoot(root);
        test.equal(this.b.root, root, 'set root');
        test.done();
    }
};

exports.testInjecting = {
    setUp: function(cb) {
        this.b = require(path.join(__dirname, '../index.js'));
        cb();
    },
    tearDown: function(cb) {
        this.b.injects = [];
        cb();
    },
    testInjectOne: function(test) {
        var inject = '/injection';
        this.b.inject(inject);
        test.deepEqual(this.b.injects, [inject], 'see single inject in injects');
        test.done()
    },
    testAdditive: function(test) {
        var injectOne = '/inject0';
        var injectTwo = ['/inject1', '/inject2'];
        this.b.inject(injectOne);
        this.b.inject(injectTwo);
        var computedInjects = this.b.injects;
        test.equal(_(computedInjects).difference(injectTwo.concat([injectOne])), 0, 'got all injects, unchanged');
        test.done();
    },
    testInjectAbsolute: function(test) {
        var injects = [
            '/hi/there',
            '/what/is/the/haps',
        ];
        this.b.inject(injects);
        var computedInjects = this.b.injects;
        test.equal(computedInjects.length, 2, 'see 2 injects');
        test.equal(_(computedInjects).difference(injects).length, 0, 'got all injects, unchanged');
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
        var computedInjects = this.b.injects;
        test.equal(_(computedInjects).difference(
            _(injects).map(function(s) { return root + s })
        ).length, 0, 'see computed paths');
        test.done();
    },
};
