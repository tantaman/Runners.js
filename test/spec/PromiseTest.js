define(['Runners'],
function(Runners) {
	describe('Promise', function() {
		describe('then', function() {
			beforEach(function() {

			});

			it('Allows registration of done callbacks', function() {

			});

			it('Allows registration of failure callbacks', function() {

			});

			it('Allows registration of progress callbacks', function() {

			});

			it('Allows registration of all three types of callbacks', function() {

			});
		});

		describe('done', function() {
			it('Allows observing for completion', function() {

			});

			it('Provides the result in the completion callback', function() {

			});


			it('Allows multiple completion observers', function() {

			});


			it('Supports jquery\'s awkward done arguments style', function() {

			});
		});

	
		describe('fail', function() {
			it('Allows observing for failure', function() {

			});

			it('Provides the result / exception / cause of the failure case', function() {

			});
		});

		describe('always', function() {

		});

		describe('progress', function() {

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

		it('Calls completion observers in the order they were added', function() {

		});
	});
});