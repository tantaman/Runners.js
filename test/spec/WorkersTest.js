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
					try {
						expect(result).to.equal('resultpiped');
						done();
					} catch (e) {
						done(e);
					}
				});
			});

			it('Provides features for runnig async tasks', function(done) {
				pool.submit(function() {
					w.async(true);
					setTimeout(function() {
						w.done(':)');
					}, 30);
				}).then(function(result) {
					try {
						expect(result).to.equal(':)');
						done();
					} catch (e) {
						done(e);
					}
				}, failure);
			});

			it('Provides a shutdown mechanism to terminate workers', function(done) {
				// No real good way to test this?
				var pool = Workers.newFixedWorkerPool(1);
				var progCnt = 0;

				pool.submit(function() {
					function report() {
						w.progress();
						setTimeout(report, 20);
					}
					setTimeout(report, 0);
				}).progress(function() {
					progCnt += 1;
				});

				var lastCnt = progCnt;
				setTimeout(function() {
					expect(lastCnt).to.not.equal(progCnt);

					pool.terminate();

					setTimeout(function() {
						lastCnt = progCnt;
						setTimeout(function() {
							expect(lastCnt).to.equal(progCnt);
							done();
						});
					}, 30);
				}, 30);
			});

			it('Allows interruption of tasks / workers', function(done) {
				var promise = pool.submit(function() {
					w.async(true).interleave(false);

					function beBusy() {
						if (!w.interrupted) {
							setTimeout(beBusy, 5);
						} else {
							w.done('we were interrupted!');
						}
					}

					setTimeout(beBusy, 5);
				});

				promise.then(function(result) {
					expect(result).to.equal('we were interrupted!');
					done();
				}, failure);

				promise.interrupt();
			});

			it('Can cache tasks so as to not require re-serialization of the task function', function() {

			});
		});

		describe('FixedWorkerPool', function() {
			var pool = Workers.newFixedWorkerPool(3);
			it('Allocates N workers', function() {
				expect(pool.numWorkers()).to.equal(3);
			});

			it('Runs N tasks concurrently', function(done) {
				var t1Cnt = 0, t2Cnt = 0, t3Cnt = 0;
				var prevT1Cnt = t1Cnt, prevT2Cnt = t2Cnt, prevT3Cnt = t3Cnt;

				var task = function() {
					w.async(true).interleave(false);
					function makeProgress() {
						if (!w.interrupted) {
							w.progress();
							setTimeout(makeProgress, 15);
						} else {
							w.done();
						}
					}
					makeProgress();
				};

				var t1Promise = pool.submit(task).progress(function() {
					t1Cnt++;
				});

				var t2Promise = pool.submit(task).progress(function() {
					t2Cnt++;
				});

				var t3Promise = pool.submit(task).progress(function() {
					t3Cnt++;
				});

				setTimeout(function() {
					expect(t1Cnt).to.not.equal(prevT1Cnt);
					expect(t2Cnt).to.not.equal(prevT2Cnt);
					expect(t3Cnt).to.not.equal(prevT3Cnt);

					done();

					t1Promise.interrupt();
					t2Promise.interrupt();
					t3Promise.interrupt();
				}, 30);
			});

			it('Puts pending tasks in a queue when all workers are busy', function(done) {
				var pool = Workers.newFixedWorkerPool(2);

				var task = function() {
					w.async(true).interleave(false);
					setTimeout(function() {
						w.done();
					}, 15);
				};

				pool.submit(task);
				pool.submit(task);

				expect(pool.queueSize()).to.equal(0);

				pool.submit(task);
				pool.submit(task);

				expect(pool.queueSize()).to.equal(2);

				setTimeout(function() {
					expect(pool.queueSize()).to.equal(0);
					pool.terminate();
					done();
				}, 45);
			});

			it('Runs pending tasks when a worker becomes free', function(done) {
				var pool = Workers.newSingleWorkerPool();

				pool.submit(function() {
					w.async(true).interleave(false);
					setTimeout(function() {
						w.done();
					}, 15);
				});

				pool.submit(function() {
					return 'ran';
				}).then(function(result) {
					expect(result).to.equal('ran');
					done();
				}, failure);
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

			it('Allocates a new worker if the queue is full', function() {

			});

			it('Provides the option to allocate a new worker even if the queue is not full', function() {

			});

			it('Does not allocate more workers than the max pool size', function() {

			});
		});

		describe('ScheduledWorkerPool', function() {
			describe('schedule', function() {
				it('Allows a task to be scheduled at a fixed interval', function() {

				});

				it('Allows a task to be scheduled with a fixed delay between runs',
				function() {

				});
			});
		});

		describe('newWorker', function() {
			var worker = Workers.newWorker('../../test/spec/dummyPromisingWorker.js');
			// TODO: the worker may not be ready..
			// Need to add a ready listener so we know when all function registrations
			// have been received.

			// it('Returns a worker that returns promises after promiseMessage calls', function() {

			// });

			it('Provides a function map', function() {
				console.log(worker.fns);
				worker.fns.soren().then(function() {
					console.log('Ran soren');
				});
			});

			it('Allows arguments to be passed to the functions in the map', function() {

			});

			// it('Allows a context to be passed', function() {

			// });

			// it('Allows context and args to be passed', function() {

			// });

			it('Returns a promise when invoking a function from the func map', function() {

			});

			it('Can provide the names of its registered functions', function() {

			});

			it('Does not return a promise for a function if specified for that func', function() {

			});

			it('Returns interruptable promises', function() {

			});

			it('Allows registration of async functions', function() {

			});
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