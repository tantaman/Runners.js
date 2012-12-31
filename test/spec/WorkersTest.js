define(['w'],
function(Workers) {
	'use strict';

	describe('Workers', function() {
		describe('All worker pools (AbstractWorkerPool)', function() {
			it('Allows submission of functions', function() {

			});

			it('Allows submission of functions with arguments', function() {

			});

			it('Allows submission of functions with args and context', function() {

			});

			it('Returns a promise', function() {

			});

			it('Provides a shutdown mechanism to terminate workers', function() {

			});

			// Run function with with so that they have access to 
			// 'worker.interrupted' var?
			it('Allows interruption of tasks / workers', function() {

			});
		});

		describe('FixedWorkerPool', function() {
			it('Allocates N workers', function() {

			});

			it('Runs N tasks concurrently', function() {

			});

			it('Puts pending tasks in a queue when all workers are busy', function() {

			});

			it('Runs pending tasks when a worker becomes free', function() {

			});

			it('Allows specification of queue size', function() {

			});

			it('Rejects execution when queue is full and all workers are busy', function() {

			});
		});

		describe('CachedWorkerPool', function() {
			it('Allocates new workers as needed', function() {

			});

			it('Does not allocate new workers until the queue is full', function() {

			});

			it('Allocates a new worker if the quee is full', function() {

			});

			it('Provides the option to allocate a new worker even if the queue is not full', function() {

			});

			it('Does not allocate more workers than the max pool size', function() {

			});
		});

		describe('newWorker', function() {

		});

		describe('promises', function() {
			it('Allows observing for completion', function() {

			});

			it('Allows observing for failure', function() {

			});

			it('Provides the result in the completion callback', function() {

			});

			it('Allows multiple completion observers', function() {

			});

			it('Calls completion observers in the order they were added', function() {

			});

			it('Supports jquery\'s awkward done and failure arguments', function() {

			});

			it('Provides the result / exception of the failure case', function() {

			});

			it('Allows a translator to be inserted to modify the completion result', function() {

			});

			it('Allows a translator to be inserted to modify the failure result', function() {

			});
		});
	});
});