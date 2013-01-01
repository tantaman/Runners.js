define(['w'],
function(Workers) {
	'use strict';

	Workers.config({
		baseUrl: '../src'
	});

	function failure() {
		throw 'Task failed';
	}

	describe('Workers', function() {
		describe('All worker pools (AbstractWorkerPool)', function() {
			var pool = Workers.newFixedWorkerPool(2);
			it('Allows submission of functions', function(done) {
				pool.submit(function() {
					return 'ran';
				}).then(function(result) {
					expect(result).to.equal('ran');
					done();
				}, failure);
			});

			it('Allows submission of functions with arguments', function(done) {
				pool.submit([1,2,3,4], function(a1,a2,a3,a4) {
					return [a1,a2,a3,a4];
				}).then(function(result) {
					expect(result).to.deep.equal([1,2,3,4]);
					done();
				}, failure);
			});

			it('Allows submission of functions with args and context', function(done) {
				pool.submit([1,2], {that: 'this'}, function(a1, a2) {
					return {
						args: [a1, a2],
						context: this
					};
				}).then(function(result) {
					expect(result).to.deep.equal({
						args: [1,2],
						context: {that: 'this'}
					});
					done();
				}, failure);
			});

			it('Allows submission of function with context and no args', function(done) {
				pool.submit({one: 'two'}, function() {
					return this;
				}).then(function(result) {
					expect(result).to.deep.equal({
						one: 'two'
					});
					done();
				}, failure);
			});

			it('Returns promises from submissions', function(done) {
				var promise = pool.submit(function() {
					return 'result';
				});

				promise.pipe(function(result) {
					return result + 'piped';
				});

				promise.done(function(result) {
					expect(result).to.equal('resultpiped');
					done();
				});
			});

			it('Provides a shutdown mechanism to terminate workers', function() {
				// TODO: how can we really verify the working of terminate?
			});

			// Run function with with so that they have access to 
			// 'worker.interrupted' var?
			it('Allows interruption of tasks / workers', function() {
				// TODO
			});
		});

		describe('FixedWorkerPool', function() {
			var pool = Workers.newFixedWorkerPool(3);
			it('Allocates N workers', function() {
				expect(pool.numWorkers()).to.equal(3);
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