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

workerContext.register('noPromises', function() {

}, false);

workerContext.register('myAsync', function(a1) {
	var ic = workerContext.invocation();
	setTimeout(function() {
		ic.done('async ran');
	}, 15);
}, true, true);