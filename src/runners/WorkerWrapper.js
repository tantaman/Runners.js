;function WorkerWrapper(worker) {
	this.worker = worker;
}

WorkerWrapper.prototype = {
	postMessage: function(m) {
		this.worker.postMessage(m);
	},

	onMessage: function(handler) {
		// TODO: addEventListener
		this.worker.onmessage = handler;
	},

	terminate: function() {
		this.worker.terminate();
	},

	addTask: function(task) {
		this.currentTask = task;
		var self = this;
		// TODO: will need to bind interrupt to a specific task at some point.
		// If we are going to allow interleaving of async tasks within a worker.
		task.onInterruptRequest(function() {
			self.postMessage({
				type: 'interrupt'
			});
		});
	},

	// TODO: if we allow multiple tasks on one worker
	// (e.g., a-sync tasks) then
	// currentTask will need to be a map
	// of task-id to task.
	_workCompleted: function(data) {
		var state;
		if (data.type === 'failed') {
			state = 'rejected';
		} else {
			state = 'resolved';
		}

		this.currentTask._setState(state, data.result);
	},

	_progressMade: function(data) {
		this.currentTask._progressMade(data);
	}
};