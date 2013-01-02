;function normalizeArgs(args, context, func, id) {
	if (typeof args === 'function') {
		func = args;
		id = context;
		context = null;
		args = null;
	} else if (!Array.isArray(args) && typeof args === 'object') {
		id = func;
		func = context;
		context = args;
		args = null;
	} else if (Array.isArray(args) && typeof context === 'function') {
		id = func;
		func = context;
		context = null;
	}

	return {
		args: args,
		context: context,
		func: func,
		id: id
	};
}

function AbstractRunnerPool(taskQueue, minWorkers, maxWorkers) {
	this._queue = taskQueue;
	this._minWorkers = minWorkers;
	this._maxWorkers = maxWorkers;
	this._runningWorkers = new LinkedList();
	this._idleWorkers = new LinkedList();

	this._receiveWorkerMessage = this._receiveWorkerMessage.bind(this);

	for (var i = 0; i < minWorkers; ++i) {
		var worker = this._createWorker();
		this._idleWorkers.add(worker);
	}
}

AbstractRunnerPool.prototype = {
	submit: function(args, context, func, id) {
		if (this._terminated)
			throw 'Pool has been terminated and can not accept new tasks.';

		var normalizedArgs = normalizeArgs(args, context, func, id);
		var wrappedTask = new TaskWrapper(normalizedArgs);

		if (this._idleWorkers.size() > 0) {
			var worker = this._idleWorkers.remove().value;
			this._dispatchToWorker(worker, wrappedTask);
		} else if (this._runningWorkers.size() < this._maxWorkers) {
			var worker = this._createWorker();
			this._dispatchToWorker(worker, wrappedTask);
		} else {
			if (this._queue.full()) {
				throw 'Task queue has reached its limit';
			}

			this._queue.add(wrappedTask);
		}

		return wrappedTask.promise();
	},

	numWorkers: function() {
		return this._idleWorkers.size() + this._runningWorkers.size();
	},

	queueSize: function() {
		return this._queue.size();
	},

	_dispatchToWorker: function(worker, wrappedTask) {
		// TODO: check function cache
		wrappedTask.task.func = wrappedTask.task.func.toString();

		worker.runningNode = this._runningWorkers.add(worker);
		worker.addTask(wrappedTask);
		worker.postMessage({type: 'task', data: wrappedTask.task});
	},

	_createWorker: function() {
		var worker = new WorkerWrapper(this._createActualWorker());
		var self = this;
		worker.onMessage(function(e) {
			self._receiveWorkerMessage(worker, e);
		});

		return worker;
	},

	terminate: function() {
		this._queue.clear();
		this._runningWorkers.forEach(function(worker) {
			worker.terminate();
		}, this);

		this._idleWorkers.forEach(function(worker) {
			worker.terminate();
		}, this);

		this._runningWorkers.clear();
		this._idleWorkers.clear();
		this._terminated = true;
	},

	_receiveWorkerMessage: function(worker, e) {
		switch (e.data.type) {
			case 'completed':
			case 'failed':
				try {
					worker._workCompleted(e.data);
				} catch (e) {
					console.log(e);
				}

				if (this._queue.size() > 0) {
					this._dispatchToWorker(worker, this._queue.remove().value);
				} else {
					this._runningWorkers.removeWithNode(worker.runningNode);
					worker.runningNode = null;
					this._idleWorkers.add(worker);
				}
			break;
			case 'progress':
				worker._progressMade(e.data.data);
			break;
		}
	}
};