function Queue(maxSize) {
	this._maxSize = (maxSize == null) ? -1 : maxSize;
	this._list = new LinkedList();
}

Queue.prototype = {
	add: function(value) {
		this._list.pushFront(value);
	},

	remove: function() {
		return this._list.popBack();
	},

	clear: function() {
		this._list.clear();
	},

	full: function() {
		if (this._maxSize < 0) return false;

		return this._list.size() >= this._maxSize;
	},

	size: function() { return this._list.size(); }
};