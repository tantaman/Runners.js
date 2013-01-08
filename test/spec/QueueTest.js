define(['Runners'],
function(Runners) {
	describe('Queue', function() {
		describe('add', function() {
			it('Throws an error if queue is already at capacity', function() {
				var q = new Runners.Queue(3);
				q.add(1);
				q.add(2);
				q.add(3);
				var ex = false;
				try {
					q.add(4);
				} catch (e) {
					ex = true;
				}

				expect(ex).to.equal(true);
			});
		});

		// TODO: require and run the linked list test for these items on Queue?
		// It'd be safer than this.
		describe('remove', function() {
			it('Just delegates to LinkedList', function(){});
		});

		describe('removeWithNode', function() {
			it('Just delegates to LinkedList', function(){});
		});

		describe('clear', function() {
			it('Just delegates to LinkedList', function(){});
		});

		describe('full', function() {
			it('Returns true if the queue is full', function() {
				var q = new Runners.Queue(0);
				expect(q.full()).to.equal(true);
				q = new Runners.Queue(3);
				q.add(1);
				q.add(2);
				q.add(3);
				expect(q.full()).to.equal(true);
			});

			it('Returns false if the queue is not full', function() {
				var q = new Runners.Queue(4);
				expect(q.full()).to.equal(false);
			});
		});

		describe('size', function() {
			it('Just delegates to LinkedList', function(){});
		});
	});
});