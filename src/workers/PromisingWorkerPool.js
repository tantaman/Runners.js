// TODO: Pull out a common base class or mixin for this and AbstractRunnerPool
// to share.
var regDoc = "register: function(name, func, [promise=true] [, async=false] [, interleave=false])";
function PromisingWorkerPool(url, taskQueue, minWorkers, maxWorkers) {
	this._url = url;
	this._queue = taskQueue;
	this._minWorkers = minWorkers;
	this._maxWorkers = maxWorkers;
	this._runningWorkers = new LinkedList();
	this._idleWorkers = new LinkedList();
	this._readyCbs = [];

	this._workerCreated = this._workerCreated.bind(this);

	for (var i = 0; i < minWorkers; ++i) {
		var worker = this._createWorker(workerReady);
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

PromisingWorkerPool.prototype = {
	_createWorker: function(cb) {
		var worker = new PromisingWorker(this._url)
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
		if (err) {
			console.log(this._url + ": Error adding worker.")
			console.log(err);
		} else {
			if (!this.fns) {
				this._createFns(worker);
			}
			this._idleWorkers.add(worker);
		}
	},

	_createFns: function(worker) {
		this.fns = {};

		var self = this;
		for (var fname in worker.fns) {
			var registration = worker.registrations[fname];
			this.fns[fname] = (function(registration, fname) {
				return function() {
					return self._submit(worker.fns[fname], registration, arguments);
				};
			})(registration, fname);
		}
	},

	// TODO: allow stuff to be submitted even before we are ready for it
	submit: function(args, context, fn, opts) {
		var n = normalizeArgs(args, context, fn, opts);
		return this._submit(n.fn, n.opts, n.args, n.context, true);
	},

	_submit: function(fn, registration, args, context, passInvoke) {
		if (!registration.promise) {
			throw this._url + ": All functions used in a PWorkerPool must return" +
			" a promise.  Check your function registration. " + regDoc;
		}

		var task = {
			fn: fn,
			opts: registration,
			args: args,
			context: context,
			passInvoke: passInvoke
		};

		var result = null;
		var worker = null;
		if (this._idleWorkers.size() > 0) {
			worker = this._idleWorkers.remove().value;
			var promise = this._dispatchToWorker(worker, task);
			if (registration.interleave)
				this._idleWorkers.add(worker);
			result = promise;
		} else if (this.numWorkers() < this._maxWorkers) {
			var promise = new Promise();
			var self = this;
			// TODO: this is problematic.
			// We can have multiple creations before our guys are ready
			// and easily blow out the worker limit.
			// We just need to make PromisingWorker smarter and have a
			// 'submit on ready' function
			this._createWorker(function(newWorker, err) {
				worker = newWorker;
				if (err) {
					console.log(this._url + ": Error adding worker.")
					console.log(err);
				} else {
					task.promise = promise;
					self._dispatchToWorker(worker, task);
					// if (registration.interleave)
						// self._idleWorkers.add(worker);
				}
			});
			result = promise;
		} else {
			if (this._queue.full()) {
				throw 'Task queue has reached its limit';
			}

			result = task.promise = new Promise();
			this._queue.add(task);
		}

		var self = this;
		result.always(function() {
			self._workerCompleted(worker, registration);
		});

		return result ? createPublicInterface(result) : undefined;
	},

	_workerCompleted: function(worker, registration) {
		if (this._queue.size() > 0) {
			var task = this._queue.remove().value;
			var promise = this._dispatchToWorker(worker, task);
		} else {
			if (worker.runningNode) {
				this._runningWorkers.removeWithNode(worker.runningNode);
				worker.runningNode = null;
				// Push front to keep interleavers at a low priority.
				this._idleWorkers.pushFront(worker);
			} // TODO check reg for interleave?
			else {
				// This is an interleaver.
				// Move to the back of the idle worker list.
			}
		}
	},

	numWorkers: function() {
		return this._idleWorkers.size() + this._runningWorkers.size();
	},

	queueSize: function() {
		return this._queue.size();
	},

	// TODO: handle exceptions and cleanup of the pool on errors
	_dispatchToWorker: function(worker, task) {
		worker.runningNode = this._runningWorkers.add(worker);
		if (task.passInvoke) {
			delete task.passInvoke;
			var promise = task.promise;
			delete task.promise;
			return worker._submit(task, promise);
		} else {
			var promise = task.fn.apply({
				__promise: task.promise
			}, task.args);

			return promise;
		}
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
	}
};
