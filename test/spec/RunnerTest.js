define(['Runners', '../../test/spec/RunnerCommonTests'],
function(Runners, CommonTests) {
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

		describe('runnables / fns', function() {
			CommonTests.runnables.call(this, worker);
		});

		describe("fn's promises", function() {
			CommonTests.runnables_promise.call(this, worker);
		});

		describe('submit', function() {
			CommonTests.submit.call(this, worker);
			// it('Allows submission of new functions', function(done) {
			// 	// No need to await ready since we are submitting a new function
			// 	worker.submit(function() {
			// 		return 'o snap';
			// 	}).then(function(result) {
			// 		expect(result).to.equal('o snap');
			// 		done();
			// 	});
			// });
		});	

		describe("Submit's promise", function() {
			CommonTests.submits_promise.call(this, worker);
		});

		it('Returns interruptable promises', function() {
		});		
	});
});