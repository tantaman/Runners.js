define(['Runners'],
function(Runners) {
	'use strict';

	function failure() {
		throw 'Task failed';
	}

	describe('RunnerPool', function() {
		describe('The general principle', function() {
			var pool = Runners.newFixedRunnerPool(3);
			it('Allocates N workers', function() {
				expect(pool.numWorkers()).to.equal(3);
			});

			it('Runs N tasks concurrently', function(done) {
				var t1Cnt = 0, t2Cnt = 0, t3Cnt = 0;
				var prevT1Cnt = t1Cnt, prevT2Cnt = t2Cnt, prevT3Cnt = t3Cnt;

				var task = function() {
					function makeProgress() {
						if (!ic.interrupted) {
							ic.progress();
							setTimeout(makeProgress, 15);
						} else {
							ic.done();
						}
					}
					makeProgress();
				};

				var opts = {async: true};

				var t1Promise = pool.submit(task, opts);
				console.log(t1Promise);
				t1Promise.progress(function() {
					t1Cnt++;
				});

				var t2Promise = pool.submit(task, opts).progress(function() {
					t2Cnt++;
				});

				var t3Promise = pool.submit(task, opts).progress(function() {
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
				var pool = Runners.newFixedRunnerPool(2);

				pool.ready(function() {
					var task = function() {
						setTimeout(function() {
							ic.done();
						}, 25);
					};

					var opts = {async:true};

					pool.submit(task, opts);
					pool.submit(task, opts);

					expect(pool.queueSize()).to.equal(0);

					pool.submit(task, opts);
					pool.submit(task, opts);

					expect(pool.queueSize()).to.equal(2);

					setTimeout(function() {
						expect(pool.queueSize()).to.equal(0);
						pool.terminate();
						done();
					}, 45);
				});
			});

			it('Runs pending tasks when a worker becomes free', function(done) {
				var pool = Runners.newFixedRunnerPool(1);

				pool.submit(function() {
					setTimeout(function() {
						ic.done();
					}, 15);
				}, {async:true});

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

		describe('fns', function() {

		});

		describe('a fns promise', function() {

		});

		describe('submit', function() {
			var pool = Runners.newFixedRunnerPool(2);
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
					setTimeout(function() {
						ic.done(':)');
					}, 30);
				}, {async:true}).then(function(result) {
					try {
						expect(result).to.equal(':)');
						done();
					} catch (e) {
						done(e);
					}
				}, failure);
			});

			it('Can cache tasks so as to not require re-serialization of the task function', function() {

			});
		});

		describe("submit's promise", function() {
			var pool = Runners.newFixedRunnerPool(2);
			it('Allows interruption of tasks / workers', function(done) {
				var promise = pool.submit(function() {
					function beBusy() {
						if (!ic.interrupted) {
							setTimeout(beBusy, 5);
						} else {
							ic.done('we were interrupted!');
						}
					}

					setTimeout(beBusy, 5);
				}, {async:true});

				promise.then(function(result) {
					expect(result).to.equal('we were interrupted!');
					done();
				}, failure);

				promise.interrupt();
			});

			it('Allows observation of failures', function() {

			});

			it('Allows observation of success', function() {

			});

			it('Allows piping of results', function() {

			});

			it('Allows listening for progress reports', function() {

			});
		});

		describe('terminate', function() {
			it('Terminates all workers, running or not', function(done) {
				// No real good way to test this?
				var pool = Runners.newFixedRunnerPool(1);
				var progCnt = 0;

				pool.submit(function() {
					function report() {
						ic.progress();
						setTimeout(report, 20);
					}
					setTimeout(report, 0);
				}, {async: true}).progress(function() {
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
		});




		// describe('CachedRunnerPool', function() {
		// 	it('Allocates new workers as needed', function() {

		// 	});

		// 	it('Does not allocate new workers until the queue is full', function() {

		// 	});

		// 	it('Allocates a new worker if the queue is full', function() {

		// 	});

		// 	it('Provides the option to allocate a new worker even if the queue is not full', function() {

		// 	});

		// 	it('Does not allocate more workers than the max pool size', function() {

		// 	});
		// });

		/*
		Don't really need this.
		We can accomplish the same things via:
		worker.submit(function() {
			function task() {
				code...
				setTimeout(task, 50);
			}
			task();
		}, {async:true, interleave: true});*/
		// describe('ScheduledRunnerPool', function() {
		// 	describe('schedule', function() {
		// 		it('Allows a task to be scheduled at a fixed interval', function() {

		// 		});

		// 		it('Allows a task to be scheduled with a fixed delay between runs',
		// 		function() {

		// 		});
		// 	});
		// });
	});
});