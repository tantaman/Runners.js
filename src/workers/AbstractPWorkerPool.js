function AbstractPWorkerPool(taskQueue, minWorkers, maxWorkers) {
	this._queue = taskQueue;
	this._minWorkers = minWorkers;
	this._maxWorkers = maxWorkers;
	this._runningWorkers = new LinkedList();
	this._idleWorkers = new LinkedList();

	for (var i = 0; i < minWorkers; ++i) {
		var worker = this._createWorker();
		this._idleWorkers.add(worker);
	}
}

AbstractPWorkerPool.prototype = {
	_createWorker: function() {
		
	}
};
