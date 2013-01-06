// TODO: Pull out a common base class or mixin for this and AbstractRunnerPool
// to share.
var RunnerPool =
(function() {
	var regDoc = "register: function(name, func, [promise=true] [, async=false] [, interleave=false])";
	function RunnerPool(url, taskQueue, minWorkers, maxWorkers) {
		this._url = url;
		this._queue = taskQueue;
		this._minWorkers = minWorkers;
		this._maxWorkers = maxWorkers;
		this._runningWorkers = new LinkedList();
		this._idleWorkers = new LinkedList();
		this._readyCbs = [];
		this._pendingCreations = 0;

		this._workerCreated = this._workerCreated.bind(this);

		for (var i = 0; i < minWorkers; ++i) {
			this._createWorker(workerReady);
		}

		var readyWorkers = 0;
		var self = this;
		function workerReady(worker, err) {
			self._workerCreated(worker, err);
			++readyWorkers;
			if (readyWorkers == minWorkers) {
				self._ready();
			}
		}
	}

	RunnerPool.prototype = {
		_createWorker: function(cb) {
			++this._pendingCreations;
			var worker = new Runner(this._url)
			worker.ready(cb);
			return worker;
		},

		_ready: function() {
			this._isReady = true;
			this._readyCbs.forEach(function(cb) {
				cb();
			});
			this._readyCbs = [];
		},

		ready: function(cb) {
			if (this._isReady) {
				cb();
			} else {
				this._readyCbs = combineArgs(this._readyCbs, arguments);
			}
		},

		_workerCreated: function(worker, err) {
			--this._pendingCreations;
			if (err) {
				log.error(this._url + ": Error adding worker.")
				log.error(err);
			} else if (this._terminated) {
				worker.terminate();
			} else {
				if (!this.fns) {
					this._createFns(worker);
				}

				this._workerCompleted(worker);
			}
		},

		_createFns: function(worker) {
			this.fns = {};

			var self = this;
			for (var fname in worker.fns) {
				var registration = worker.registrations[fname];
				this.fns[fname] = (function(registration, fname) {
					return function() {
						return self._submit({
							fn: worker.fns[fname],
							opts: registration,
							args: arguments
						});
					};
				})(registration, fname);
			}

			this.runnables = this.fns;
		},

		submit: function(args, context, fn, opts) {
			var task = normalizeArgs(args, context, fn, opts);
			task.type = 'pass_invoke';
			if (!this._isReady) {
				task.promise = new Promise();
				this._queue.add(task);
				return task.promise;
			} else {
				return this._submit(task);
			}
		},

		_submit: function(task) {
			if (!task.opts.promise) {
				throw this._url + ": All functions used in a PWorkerPool must return" +
				" a promise.  Check your function registration. " + regDoc;
			}

			var result = null;
			var worker = null;
			if (this._idleWorkers.size() > 0) {
				worker = this._idleWorkers.remove().value;
				var promise = this._dispatchToWorker(worker, task);
				result = promise;
			} else if (this.numWorkers() < this._maxWorkers) {
				result = this._queueTask(task);
				this._createWorker(this._workerCreated);
			} else {
				result = this._queueTask(task);
			}

			return createPublicInterface(result);
		},

		_queueTask: function(task) {
			task.queueNode = this._queue.add(task);
			var _this = this;
			return (task.promise = new Promise()).cancel(function(mayInterrupt) {
				if (task.queueNode) {
					_this._queue.removeWithNode(task.queueNode);
					task.promise._setState('rejected', 'canceled');
				} else if (mayInterrupt) {
					task.promise.interrupt();
				}
			});
		},

		_workerCompleted: function(worker, registration) {
			if (this._queue.size() > 0) {
				var task = this._queue.remove().value;
				delete task.queueNode;
				var promise = this._dispatchToWorker(worker, task);
			} else {
				if (worker.runningNode) {
					this._runningWorkers.removeWithNode(worker.runningNode);
					worker.runningNode = null;
					// Push front to keep interleavers at a low priority.
					this._idleWorkers.pushFront(worker);
				} // TODO check reg for interleave?
				else {
					this._idleWorkers.add(worker);
				}
			}
		},

		numWorkers: function() {
			return this._idleWorkers.size() + this._runningWorkers.size()
				+ this._pendingCreations;
		},

		queueSize: function() {
			return this._queue.size();
		},

		// TODO: handle exceptions and cleanup of the pool on errors
		_dispatchToWorker: function(worker, task) {
			worker.runningNode = this._runningWorkers.add(worker);
			var promise;
			try {
				if (task.type === 'pass_invoke') {
					promise = task.promise;
					delete task.promise;
					promise = worker._submit(task, promise);
				} else {
					var promise = task.fn.apply({
						__promise: task.promise
					}, task.args);
				}

				var self = this;
				promise.always(function() {
					self._workerCompleted(worker, task.opts);
				});
			} catch (e) {
				promise = 'Failed dispatching task to worker';
				log.error(promise);
				log.error(e.stack);
				this._workerCompleted(worker);
			}

			return promise;
		},

		terminate: function() {
			while (this._queue.size() > 0) {
				var task = this._queue.remove();
				task.value.promise._setState('rejected', 'terminated');
			}

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
		}
	};

	return RunnerPool;
})();