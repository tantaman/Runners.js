function LinkedList() {
	this._head = null;
	this._tail = null;
	this._size = 0;
}

LinkedList.prototype = {
	pushBack: function(value) {
		++this._size;
		var node = {
			value: value,
			next: null,
			prev: null
		};
		if (this._head == null) {
			this._head = this._tail = node;
		} else {
			this._tail.next = node;
			node.prev = this._tail;
			this._tail = node;
		}

		return node;
	},

	popBack: function() {
		--this._size;
		var node = this._tail;
		this._tail = this._tail.prev;
		if (this._tail != null)
			this._tail.next = null;
		return node;
	},

	popFront: function() {
		--this._size;
		var node = this._head;
		this._head = this._head.next;
		this._head.prev = null;
		return node;
	},

	pushFront: function(value) {
		++this._size;
		var node = {
			value: value,
			next: null,
			prev: null
		};
		if (this._head == null) {
			this._head = this._tail = node;
		} else {
			this._head.prev = node;
			node.next = this._head;
			this._head = node;
		}

		return node;
	},

	removeWithNode: function(node) {
		if (node == null) throw 'Null node';

		--this._size;

		var prevNode = node.prev;
		var nextNode = node.next;
		if (prevNode != null) {
			prevNode.next = node.next;
		}

		if (nextNode != null) {
			nextNode.prev = node.prev;
		}

		node.next = node.prev = null;
	},

	add: function(value) {
		return this.pushFront(value);
	},

	remove: function() {
		return this.popBack();
	},

	forEach: function(func, ctx) {
		var crsr = this._head;
		while (crsr != null) {
			func.call(ctx, crsr.value);
			crsr = crsr.next;
		}
	},

	clear: function() {
		this._head = this._tail = null;
		this._size = 0;
	},

	size: function() { return this._size; }
};