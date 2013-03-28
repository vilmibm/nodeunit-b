var _ = require('underscore');

modules.exports = function(backend) {
    if (backend === 'jsdom') {
        return require('jsdom').env.bind(require('jsdom'));
    }
    else if (backend === 'phantomjs') {
        var phantom = require('phantom');
        return phantomEnv(phantom);
    }
};

var phantomEnv = function(phantom) {
    return function() {
        
    };
};
