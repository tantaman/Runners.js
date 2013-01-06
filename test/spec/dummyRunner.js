'use strict';
self.runnables = {
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

workerContext.register('stayBusy', function() {
	var ic = workerContext.invocation();
	var a = 1;
	function beBusy() {
		a += 1;
		if (!ic.interrupted)
			setTimeout(beBusy, 5);
		else {
			ic.done(a);
		}
	}

	beBusy();

}, true, true);

workerContext.register('noPromises', function() {

}, false);

workerContext.register('myAsync', function(a1) {
	var ic = workerContext.invocation();
	setTimeout(function() {
		ic.done('async ran');
	}, 15);
}, true, true);