define(['Runners'],
function(Runners) {
	'use strict';

	function failure() {
		throw 'Task failed';
	}

	describe('PWorkers', function() {
		describe('newPWorker', function() {
			var worker = Runners.newPWorker('../../test/spec/dummyPromisingWorker.js');
			// TODO: the worker may not be ready..
			// Need to add a ready listener so we know when all function registrations
			// have been received.

			// it('Returns a worker that returns promises after promiseMessage calls', function() {

			// });

			it('Notifies when ready (scripts have been imported and functions registered)',
			function(done) {
				done();
			});

			it('Provides an error to done callbacks if there was an error loading scripts',
			function(done) {
				done();
			});

			it('Provides a function map', function(done) {
				worker.ready(function() {
					var funcs = Object.keys(worker.fns);
					expect(funcs).to.deep.equal(['noPromises', 'myAsync', 'soren', 'kant', 'either']);
					done();
				});
			});

			it('Allows submission of new functions', function(done) {
				// No need to await ready since we are submitting a new function
				worker.submit(function() {
					return 'o snap';
				}).then(function(result) {
					expect(result).to.equal('o snap');
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

			// it('Allows a context to be passed', function() {

			// });

			// it('Allows context and args to be passed', function() {

			// });

			it('Does not return a promise for a function if specified for that func', function(done) {
				worker.ready(function() {
					expect(worker.fns.noPromises()).to.equal(undefined);
					done();
				});
			});

			it('Returns interruptable promises', function() {

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

		describe('PWorkerPool', function() {
			var pool = Runners.newFixedPWorkerPool(2);
			// it('Allows basic submission of new funcs', function(done) {
			// 	pool.submit(function() {
			// 		return 'pooled';
			// 	}).then(function(result) {
			// 		expect(result).to.equal('pooled');
			// 		done();
			// 	});
			// });

			// it('Allows submission of new async funcs', function(done) {
			// 	pool.submit(function() {
			// 		setTimeout(function() {
			// 			ic.progress();
			// 			ic.done('done');
			// 		}, 30);
			// 	}, {async: true}).then(function(result) {
			// 		expect(result).to.equal('done');
			// 		done();
			// 	});
			// });


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

			it('Provides a shutdown mechanism to terminate workers', function(done) {
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

			it('Allows interrupts of a=synchronous tasks', function(done) {
				// pool.ready(
				// function() {
					var promise = pool.submit(function() {
						function beBusy() {
							if (!ic.interrupted)
								setTimeout(beBusy, 5);
							else
								ic.done('we were interrupted!');
						}

						setTimeout(beBusy, 5);
					}, {async: true});

					promise.then(function(result) {
						expect(result).to.equal('we were interrupted!');
						done();
					}, function(err) {
						console.log('err');
						console.log(err);
					});

					setTimeout(function() {
						promise.interrupt();
					}, 25);
			// 	});
			});

			it('Puts pending tasks in a queue when all workers are busy', function(done) {
				var pool = Runners.newFixedPWorkerPool(2);

				var task = function() {
					setTimeout(function() {
						ic.done();
					}, 500);
				};

				var opts = {async:true};

				pool.submit(task, opts);
				pool.submit(task, opts);

				pool.submit(task, opts);
				pool.submit(task, opts);

				setTimeout(function() {
					expect(pool.queueSize()).to.equal(2);
					pool.terminate();
					done();
				}, 45);
			});
		});


		describe('FixedPWorkerPool', function() {
			var pool = Runners.newFixedPWorkerPool(3);
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

				var t1Promise = pool.submit(task, opts).progress(function() {
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
		});

	});
});