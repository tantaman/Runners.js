define(['Runners'],
function(Runners) {
	/*
	TODO: include a templating systems and auto-generate these tests...
	They are all pretty darn similar.
	*/
	describe('Promise', function() {
		describe('then', function() {
			var promise;
			var pubPromise;
			beforeEach(function() {
				promise = new Runners.PrivatePromise();
				pubPromise = Runners.createPublicInterface(promise);
			});

			it('Allows registration of done callbacks', function() {
				var called = false;
				pubPromise.then(function() {
					called = true;
				});

				promise._setState('resolved');

				expect(called).to.equal(true);
			});

			it('Allows registration of failure callbacks', function() {
				var called = false;
				pubPromise.then(null, function() {
					called = true;
				});

				promise._setState('rejected');

				expect(called).to.equal(true);
			});

			it('Allows registration of progress callbacks', function() {
				var called = 0;
				pubPromise.then(null, null, function() {
					called += 1;
				});

				promise._progressMade();
				promise._progressMade();

				expect(called).to.equal(2);
			});

			it('Allows registration of all three types of callbacks', function() {
				var state = {};
				pubPromise.then(function() {
					state.complete = true;
				}, function() {
					state.failed = true;
				}, function() {
					state.progress = true;
				});

				promise._progressMade();
				promise._setState('resolved');


				expect(Object.keys(state).length).to.equal(2);
				expect('failed' in state).to.equal(false);
			});

			it('Calls you back immediately if the promise is already resolved/rejected',
			function() {
				promise._setState('resolved');
				var called = false;
				promise.then(function() {
					called = true;
				});

				expect(called).to.equal(true);
			});
		});

		describe('done', function() {
			var promise;
			var pubPromise;
			beforeEach(function() {
				promise = new Runners.PrivatePromise();
				pubPromise = Runners.createPublicInterface(promise);
			});
			it('Allows observing for completion', function() {
				var called = false;
				pubPromise.done(function() {
					called = true;
				});

				promise._setState('resolved');

				expect(called).to.equal(true);
			});

			it('Provides the result in the completion callback', function() {
				var res = '';
				pubPromise.done(function(result) {
					res = result;
				});

				promise._setState('resolved', 1);

				expect(res).to.equal(1);
			});


			it('Supports jquery\'s awkward done arguments style', function() {
				var callCount = 0;
				var f = function() {
					++callCount;
				};

				pubPromise.done(f);

				pubPromise.done(f,f,f);
				pubPromise.done(f, [f,f,f], f, [f]);

				promise._setState('resolved');

				expect(callCount).to.equal(10);
			});
		});

	
		describe('fail', function() {
			var promise;
			var pubPromise;
			beforeEach(function() {
				promise = new Runners.PrivatePromise();
				pubPromise = Runners.createPublicInterface(promise);
			});

			it('Allows observing for failure', function() {
				var failed = false;
				pubPromise.fail(function() {
					failed = true;
				});

				promise._setState('rejected');

				expect(failed).to.equal(true);
			});

			it('Provides the result / exception / cause of the failure case', function() {
				var failed = false;
				pubPromise.fail(function(reason) {
					failed = true;
					expect(reason).to.equal('zomg');
				});

				promise._setState('rejected', 'zomg');

				expect(failed).to.equal(true);
			});
		});

		describe('always', function() {
			it('Allows registration of a callback that is called in any case (failure or success)',
			function () {
				var promise = new Runners.PrivatePromise();
				var pubPromise = Runners.createPublicInterface(promise);

				var called = false;
				pubPromise.always(function(result) {
					called = true;
					expect(result).to.equal(1);
				});

				promise._setState('resolved', 1);

				expect(called).to.equal(true);

				promise = new Runners.PrivatePromise();
				pubPromise = Runners.createPublicInterface(promise);
				called = false;
				pubPromise.always(function(result) {
					called = true;
					expect(result).to.equal('zomg');
				});

				promise._setState('rejected', 'zomg');

				expect(called).to.equal(true);
			})
		});

		describe('progress', function() {
			it('Allows registration of progress callbacks', function() {
				var promise = new Runners.PrivatePromise();
				var pubPromise = Runners.createPublicInterface(promise);

				var progCnt = 0;
				pubPromise.progress(function(d) {
					expect(d).to.equal(progCnt);
					++progCnt;
				});

				while (progCnt < 10)
					promise._progressMade(progCnt);
			});
		});

		describe('pipe', function() {
			it('Allows a translator to be inserted to modify the completion result', function() {

			});
			
			it('Allows a translator to be inserted to modify the failure result', function() {

			});
		});

		describe('interrupt', function() {

		});

		describe('cancel', function() {

		});

		describe('state', function() {

		});
	});
});