;function TaskWrapper(task) {
	this.task = task;
	this._promise = new Promise(this._interruptRequested.bind(this));
	this._publicPromise = createPublicInterface(this._promise);
	this._interruptRequestListeners = [];
}

TaskWrapper.prototype = {
	promise: function() {
		return this._publicPromise;
	},

	onInterruptRequest: function(cb) {
		this._interruptRequestListeners.push(cb);
	},

	_setState: function(state, result) {
		this._promise._setState(state, result);
	},

	_progressMade: function(data) {
		this._promise._progressMade(data);
	},

	_interruptRequested: function() {
		this._interruptRequestListeners.forEach(function(cb) {
			cb();
		}, this);
	}
}