define(['Runners'],
function(Runners) {
	'use strict';

	function failure() {
		throw 'Task failed';
	}

	describe('Runner', function() {
		var worker = Runners.newRunner('../../test/spec/dummyRunner.js');
		// TODO: the worker may not be ready..
		// Need to add a ready listener so we know when all function registrations
		// have been received.

		// it('Returns a worker that returns promises after promiseMessage calls', function() {

		// });
		describe('ready', function() {
			it('Notifies when ready (scripts have been imported and functions registered)',
			function(done) {
				done();
			});

			it('Provides an error to ready callbacks if there was an error loading scripts',
			function(done) {
				done();
			});
		});

		describe('fns', function() {
			it('Is a map of registered functions', function(done) {
				worker.ready(function() {
					var funcs = Object.keys(worker.fns);
					expect(funcs).to.deep.equal(['noPromises', 'myAsync', 'soren', 'kant', 'either']);
					done();
				});
			});

			it('Returns a promise when invoking a function from the func map', function(done) {
				worker.ready(function() {
					worker.fns.soren().then(function(result) {
						expect(result).to.equal('kierk');
						done();
					});
				});
			});

			it('Allows arguments to be passed to the functions in the map', function(done) {
				worker.ready(function() {
					worker.fns.either(1, 2).then(function(result) {
						expect(result).to.equal('1or2');
						done();
					});
				});
			});

			it('Does not return a promise for a function if specified for that func', function(done) {
				worker.ready(function() {
					expect(worker.fns.noPromises()).to.equal(undefined);
					done();
				});
			});

			it('Allows registration of async functions', function(done) {
				worker.ready(function() {
					worker.fns.myAsync().then(function(result) {
						expect(result).to.equal('async ran');
						done();
					});
				});
			});
		});

		describe('submit', function() {
			it('Allows submission of new functions', function(done) {
				// No need to await ready since we are submitting a new function
				worker.submit(function() {
					return 'o snap';
				}).then(function(result) {
					expect(result).to.equal('o snap');
					done();
				});
			});
		});	

		describe("Submit's promise", function() {

		});

		describe("fn's promises", function() {

		});

		it('Returns interruptable promises', function() {

		});		
	});
});