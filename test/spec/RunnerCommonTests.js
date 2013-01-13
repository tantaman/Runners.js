/**
Runner and RunnerPool both have the same interface
so they allow many of the same operations.

These tests should then apply to both Runners and RunnerPools.
*/
define(function() {
	function failure() {
		throw 'Task failed';
	}

	return {
		runnables: function(worker) {
			it('Is a map of registered functions', function(done) {
				worker.ready(function() {
					var funcs = Object.keys(worker.fns);
					expect(funcs).to.deep.equal(['stayBusy', 'noPromises', 'myAsync', 'soren', 'kant', 'either']);
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

			it('Allows registration of async functions', function(done) {
				worker.ready(function() {
					worker.fns.myAsync().then(function(result) {
						expect(result).to.equal('async ran');
						done();
					});
				});
			});
		},

		submit: function(runner) {
			it('Allows submission of functions', function(done) {
				runner.submit(function() {
					return 'ran';
				}).then(function(result) {
					expect(result).to.equal('ran');
					done();
				}, failure);
			});

			it('Allows submission of functions with arguments', function(done) {
				runner.submit([1,2,3,4], function(a1,a2,a3,a4) {
					return [a1,a2,a3,a4];
				}).then(function(result) {
					expect(result).to.deep.equal([1,2,3,4]);
					done();
				}, failure);
			});

			it('Allows submission of functions with args and context', function(done) {
				runner.submit([1,2], {that: 'this'}, function(a1, a2) {
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
				runner.submit({one: 'two'}, function() {
					return this;
				}).then(function(result) {
					expect(result).to.deep.equal({
						one: 'two'
					});
					done();
				}, failure);
			});

			it('Returns promises from submissions', function(done) {
				var promise = runner.submit(function() {
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
				runner.submit(function() {
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
		},

		runnables_promise: function() {
			it('Allows interruption of tasks / workers', function() {

			});
		},

		submits_promise: function(runner) {
			it('Allows interruption of tasks / workers', function(done) {
				var promise = runner.submit(function() {
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

			it('Allows observation of failures', function(done) {
				var promise = runner.submit(function() {
					throw 'Shit shit guys';
				});

				promise.fail(function(result) {
					expect(result).to.equal('Shit shit guys');
					done();
				});
			});

			it('Allows observation of success', function(done) {
				var promise = runner.submit(function() {
					return 'good';
				});

				promise.done(function(result) {
					expect(result).to.equal('good');
					done();
				});
			});

			it('Allows piping of results', function(done) {
				var cnt = 0;
				var promise = runner.submit(function() {
					return 2;
				});

				var pipe = function(r) {
					return r*10;
				};

				var cb = function(r) {
					++cnt;
					expect(r).to.equal(20);
					if (cnt == 2)
						done();
				};

				promise.pipe(pipe);

				promise.done(cb);

				promise = runner.submit(function() {
					throw 2;
				});

				promise.pipe(null, pipe);

				promise.fail(cb);
			});

			it('Allows listening for progress reports', function(done) {
				var promise = runner.submit(function() {
					ic.progress(1);
					ic.progress(2);
					ic.progress(3);
				});

				var progCnt = 0;
				promise.progress(function(r) {
					progCnt++;
					expect(progCnt).to.equal(r);
				});

				promise.done(done);
			});
		}
	};
});