require.config({
	baseUrl: '../dist',
	paths: {
		spec: '../test/spec'
	}
});

require(['Runners'], function(Runners) {
	Runners.config({
		baseUrl: '../dist'
	});

	require(['../test/suite'], function() {
		// unit tests registered in suite.
	});
});