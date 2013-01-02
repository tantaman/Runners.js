;window.Runners = workerFactory;

if (typeof define !== 'undefined') {
	define(function() {
		return workerFactory;
	});
}