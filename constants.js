exports.injectRoot = './';

exports.METADEFAULTS = {
    injects:[],
    provide:[],
    backend: 'jsdom',
    html:'<html><head></head><body></body></html>',
    syntaxCheck: true,
    setUp: function(cb) { cb(); },
    tearDown: function(cb) { cb(); }
};
