'use strict';
self.exports = {
	soren: function() {
		return 'kierk';
	},

	kant: function() {
		return 'duty';
	},

	either: function(a, b) {
		return a + 'or' + b;
	}
};

w.register('noPromises', function() {

}, false);

w.register('myAsync', function(a1, done) {
	done = arguments[arguments.length - 1];
	setTimeout(function() {
		done('async ran');
	}, 15);
}, true, true);