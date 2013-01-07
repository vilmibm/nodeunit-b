var path = require('path');
var _ = require('underscore');

exports.test_wrapping = {
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
