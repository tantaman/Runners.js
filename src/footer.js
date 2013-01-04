if (typeof define !== 'undefined') {
	define(function() {
		return workerFactory;
	});
} else if (typeof exports !== 'undefined') {
	exports = workerFactory;
} else {
	window.Runners = workerFactory;	
}