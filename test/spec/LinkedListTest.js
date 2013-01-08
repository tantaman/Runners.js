define(['Runners'],
function(Runners) {
	describe('LinkedList', function() {
		describe('pushBack', function() {
			var list;

			beforeEach(function() {
				list = new Runners.LinkedList();
			});

			it('Adds entries to the end of the list', function() {
				for (var i = 0; i < 33; ++i) {
					list.pushBack(i);
					expect(list.back().value).to.equal(i);
				}
			});

			it('Exposes the actual node that was added', function() {
				var addition = list.pushBack('t');
				expect(addition.value).to.equal('t');

				list.pushBack('x');
				expect(addition.next.value).to.equal('x');
			});

			it('Increases the size of the list', function() {
				for (var i = 0; i < 100; ++i) {
					list.pushBack('x');
					expect(list.size()).to.equal(i+1);
				}
			});
		});

		describe('remove / popBack', function() {
			var list;

			beforeEach(function() {
				list = new Runners.LinkedList();
				list.pushBack(1);
				list.pushBack(2);
				list.pushBack(3);
			});

			it('Removes an element from the end of the list', function() {
				list.remove();
				expect(list.back().value).to.equal(2);
				list.popBack();
				expect(list.back().value).to.equal(1);
				list.popBack();
				expect(list.back()).to.equal(null);
			});

			it('Fails if the list is empty', function() {
				list = new Runners.LinkedList();
				var ex = false;
				try {
					list.remove();
				} catch (e) {
					ex = true;
				}

				expect(ex).to.equal(true);
			});

			it('Decreases the size of the list', function() {
				var size = list.size();

				while (list.size > 0) {
					list.remove();
					expect(list.size()).to.equal(size - 1);
					size -= 1;
				}
			});

			it('Returns the node that was removed', function() {
				var node = list.remove();
				expect(node.value).to.equal(3);
				expect(node.prev.value).to.equal(2);
				expect(node.prev.next).to.equal(null);
			});
		});

		describe('popFront', function() {
			var list;

			beforeEach(function() {
				list = new Runners.LinkedList();
				list.pushBack(1);
				list.pushBack(2);
				list.pushBack(3);
			});

			it('Returns the node that was removed', function() {
				var n = list.popFront();
				expect(n.value).to.equal(1);
				expect(n.next.value).to.equal(2);
			});

			it('Removes an element from the front of the list', function() {
				list.popFront();
				expect(list.front().value).to.equal(2);
				list.popFront();
				expect(list.front().value).to.equal(3);
			});

			it('Decreases the size of the list', function() {
				var size = list.size();
				while (list.size() > 0) {
					list.popFront();
					expect(list.size()).to.equal(size - 1);
					size -= 1;
				}
			});

			it('Fails on empty lists', function() {
				var ex = false;
				try {
					while (list.size() > -1) {
						list.popFront();
					}
				} catch (e) {
					ex = true;
				}

				expect(ex).to.equal(true);
			});
		});

		describe('add / pushFront', function() {
			var list;
			beforeEach(function() {
				list = new Runners.LinkedList();
			});

			it('Adds entries to the front of the list', function() {
				for (var i = 0; i < 100; ++i) {
					list.pushFront(i);
					expect(list.front().value).to.equal(i);
				}
			});

			it('Exposes the actual node that was added', function() {
				list.pushFront(1);
				var n = list.add(2);
				expect(n.value).to.equal(2);
				expect(n.next.value).to.equal(1);
			});

			it('Increases the size of the list', function() {
				for (var i = 0; i < 29; ++i) {
					list.add(i);
					expect(list.size()).to.equal(i+1);
				}
			});
		});

		describe('removeWithNode', function() {
			var list;
			beforeEach(function() {
				list = new Runners.LinkedList();
			});

			it('Removes an arbitrary node from the list', function() {
				var n1 = list.add(3);
				var n2 = list.add(2);
				var n3 = list.add(1);

				list.removeWithNode(n2);

				expect(list.front().value).to.equal(1);
				expect(list.back().value).to.equal(3);

				list.removeWithNode(n1);
				expect(list.front()).to.equal(list.back());
				expect(list.front()).to.not.equal(null);
				expect(list.back()).to.not.equal(null);

				list.removeWithNode(n3);
				expect(list.front()).to.equal(null);
				expect(list.back()).to.equal(null);
			});

			it('Leaves the list in order', function() {
				var nodes = [];
				for (var i = 0; i < 100; ++i) {
					if (Math.random() * 3 < 1) {
						nodes.push(list.pushBack(i));
					} else {
						list.pushBack(i);
					}
				}

				nodes.forEach(function(node) {
					list.removeWithNode(node);
					var prevVal = -1;
					list.forEach(function(val) {
						expect(val > prevVal).to.equal(true);
					});
				});
			});

			it('DOES NOT fail on an empty list', function() {
				var ex = false;
				try {
					list.removeWithNode({value: 1, next: null, prev: null});
				} catch (e) {
					ex = true;
				}
				expect(ex).to.equal(false);
			});

			it('Reduces the size by one', function() {
				for (var i = 0; i < 11; ++i) {
					list.add(i);
				}

				var prevSize = list.size();
				while (list.size() > 0) {
					list.removeWithNode(list.front());
					expect(list.size()).to.equal(prevSize - 1);
					prevSize -= 1;
				}

			});
		});

		describe('forEach', function() {
			var list;
			beforeEach(function() {
				list = new Runners.LinkedList();
				for (var i = 0; i < 99; ++i) {
					list.pushBack(i);
				}
			});

			it('Iterates every element in the list', function() {
				var cnt = 0;
				list.forEach(function(e) {
					++cnt;
				});

				expect(cnt).to.equal(99);
			});

			it('Iterates the list in order', function() {
				var prev = -1;
				list.forEach(function(e) {
					expect(e > prev).to.equal(true);
					prev = e;
				});
			});
		});

		describe('size', function() {
			it('Returns the size of the list', function() {
				var list = new Runners.LinkedList();
				for (var i = 0; i < 23; ++i) {
					list.add(i);
					expect(list.size()).to.equal(i+1);
				}
			});
		})
	});
});