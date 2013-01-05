require.config({
	baseUrl: '../dist',
	paths: {
		spec: '../test/spec'
		//Runners: 'Runners.min'
	}
});

require(['Runners'], function(Runners) {
	Runners.config({
		path: '../dist/'
	});

	require(['../test/suite'], function() {
		// unit tests registered in suite.
	});
});