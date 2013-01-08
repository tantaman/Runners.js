define(['Runners', '../../test/spec/RunnerCommonTests'],
function(Runners, CommonTests) {
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
							setTimeout(makeProgress, 5);
						} else {
							ic.done();
						}
					}
					makeProgress();
				};

				var opts = {async: true};

				var t1Promise = pool.submit(task, opts);
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

			it('Puts pending tasks in a queue when all workers are busy (long run due to lots of delay timers in the test code)', function(done) {
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

			after(function() {
				pool.terminate();
			});
		});

		describe('runnables / fns', function() {
			var runner = Runners.newFixedRunnerPool('../test/spec/dummyRunner.js', 2);

			CommonTests.runnables.call(this, runner);

			it('Queues calls to functions when all workers are busy', 
			function(done) {
				var promises = [];
				promises.push(runner.fns.stayBusy());
				promises.push(runner.fns.stayBusy());
				promises.push(runner.fns.stayBusy());

				expect(runner.queueSize()).to.equal(1);

				promises.push(runner.fns.stayBusy());

				expect(runner.queueSize()).to.equal(2);

				promises[3].then(function() {
					done();
				}, function() {
					done();
				});

				promises.forEach(function(promise) {
					promise.cancel(true);
				});
			});

			it('Runs functions in the map immediately if workers are available',
			function() {
				var runner = Runners.newFixedRunnerPool('../test/spec/dummyRunner.js', 2);

				runner.ready(function() {
					runner.fns.kant();
					expect(runner.queueSize()).to.equal(0);
					runner.terminate();
				});
			});

			after(function() {
				runner.terminate();
			});
		});

		describe("a fn's promise", function() {
			var runner = Runners.newRunner('../test/spec/dummyRunner.js');
			CommonTests.runnables_promise.call(this, runner);

			after(function() {
				runner.terminate();
			});
		});

		describe('submit', function() {
			var pool = Runners.newFixedRunnerPool(2);

			CommonTests.submit.call(this, pool);

			after(function() {
				pool.terminate();
			});
		});

		describe("submit's promise", function() {
			var pool = Runners.newFixedRunnerPool(2);
			
			CommonTests.submits_promise.call(this, pool);

			after(function() {
				pool.terminate();
			});
		});

		describe('terminate', function() {
			it('Terminates all workers, running or not  (long run due to delay timers in test code since the is no way to be certain when the worker has actually terminated)', function(done) {
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