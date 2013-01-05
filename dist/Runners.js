;(function(window) {'use strict';var Runners = {};var Workers = {};/**
The MIT License

Copyright (c) 2013 Matt Crinklaw-Vogt.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

function identity(a) { return a; }

function remove(arr, item) {
	var idx = arr.indexOf(item);
	if (idx >= 0)
		arr.splice(idx, 1);
}

function combineArgs(array, args) {
	for (var i = 0; i < args.length; ++i) {
		var arg = args[i];
		if (Array.isArray(arg)) {
			array = array.concat(arg);
		} else {
			array.push(arg);
		}
	}

	return array;
}

function combine(array, maybeArray) {
	if (Array.isArray(maybeArray)) {
		array = this._doneCbs.concat(maybeArray);
	} else if (maybeArray != null) {
		array.push(maybeArray);
	}

	return array;
}

function createPublicInterface(object) {
	var iface = {};
	for (var key in object) {
		var val = object[key];
		if (typeof val === 'function' && key[0] !== '_') {
			iface[key] = val.bind(object);
		}
	}

	return iface;
}

function extend(dest, src) {
	for (var k in src) {
		if (dest[k] === undefined)
			dest[k] = src[k];
	}

	return dest;
}

var optsDefaults = {
	promise: true,
	async: false,
	interleave: false
};

function normalizeArgs(args, context, fn, opts) {
	if (typeof args === 'function') {
		fn = args;
		opts = context;
		context = null;
		args = null;
	} else if (!Array.isArray(args) && typeof args === 'object') {
		opts = fn;
		fn = context;
		context = args;
		args = null;
	} else if (Array.isArray(args) && typeof context === 'function') {
		opts = fn;
		fn = context;
		context = null;
	}

	opts = opts || {};

	extend(opts, optsDefaults);

	return {
		args: args,
		context: context,
		fn: fn,
		opts: opts
	};
}
var Promise = (function() {
	function Promise(interruptListener) {
		this._progressCbs = [];
		this._doneCbs = [];
		this._failCbs = [];
		this._interruptCbs = [];

		if (interruptListener)
			this._interruptCbs.push(interruptListener);

		this._doneFilter = identity;
		this._failFilter = identity;

		this._state = 'pending';
	}

	Promise.prototype = {
		then: function(doneBacks, failBacks, progressBacks) {
			this._doneCbs = combine(this._doneCbs, doneBacks);
			this._failCbs = combine(this._failCbs, failBacks);
			this._progressCbs = combine(this._progressCbs, progressBacks);

			return this;
		},

		done: function() {
			if (this._state === 'resolved') {
				this._callLateArrivals(arguments);
			} else if (this._state === 'pending') {
				this._doneCbs = combineArgs(this._doneCbs, arguments);
			}

			return this;
		},

		fail: function() {
			if (this._state === 'rejected') {
				this._callLateArrivals(arguments);
			} else if (this._state === 'pending') {
				this._failCbs = combineArgs(this._failCbs, arguments);
			}

			return this;
		},

		always: function() {
			this.done.apply(this, arguments);
			this.fail.apply(this, arguments);

			return this;
		},

		progress: function() {
			if (this._state === 'pending') {
				this._progressCbs = combineArgs(this._progressCbs, arguments);
			}

			return this;
		},

		pipe: function(doneFilter, failFilter) {
			this._doneFilter = doneFilter || identity;
			this._failFilter = failFilter || identity;

			switch (this._state) {
				case 'rejected':
					this._result = this._failFilter(this._result);
				break;
				case 'resolved':
					this._result = this._doneFilter(this._result);
				break;
			}

			return this;
		},

		interrupt: function(cb) {
			if (!cb) {
				this._interruptCbs.forEach(function(cb) {
					try {
						cb();
					} catch (e) {
						console.log(e);
						console.log(e.stack);
					}
				});
			} else {
				this._interruptCbs = combineArgs(this._interruptCbs, arguments);
			}

			return this;
		},

		state: function() {
			return this._state;
		},

		_callLateArrivals: function(args) {
			for (var i = 0; i < args.length; ++i) {
				var arg = args[i];
				if (Array.isArray(arg)) {
					arg.forEach(function(f) {
						f(this._result);
					}, this)
				} else {
					arg(this._result);
				}
			}
		},

		_setState: function(state, result) {
			if (this._state !== 'pending')
				throw 'Illegal state transition';

			this._state = state;
			switch (state) {
				case 'rejected':
					this._result = this._failFilter(result);
					this._callFailbacks();
				break;
				case 'resolved':
					this._result = this._doneFilter(result);
					this._callDonebacks();
				break;
				default:
					throw 'Illegal state transition';
			}

			this._failCbs = [];
			this._doneCbs = [];
			this._failFilter = this._doneFilter = identity;
		},

		_callFailbacks: function() {
			this._failCbs.forEach(function(fcb) {
				try {
					fcb(this._result);
				} catch (e) {
					console.log(e);
				}
			}, this);
		},

		_callDonebacks: function() {
			this._doneCbs.forEach(function(dcb) {
				try {
					dcb(this._result);
				} catch (e) {
					console.log(e);
				}
			}, this);
		},

		_progressMade: function(data) {
			this._progressCbs.forEach(function(pcb) {
				try {
					pcb(data);
				} catch (e) {
					console.log(e);
				}
			}, this);
		}
	};

	return Promise;
})();
var LinkedList = (function() {
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

	return LinkedList;
})();
var Queue = (function() {
	function Queue(maxSize) {
		this._maxSize = (maxSize == null) ? -1 : maxSize;
		this._list = new LinkedList();
	}

	Queue.prototype = {
		add: function(value) {
			if (this.size() == this._maxSize)
				throw "Queue has reached its limit";
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

	return Queue;
})();
var workerFactory = {
	_cfg: {
		baseUrl: '.'
	},

	config: function(cfg) {
		for (var p in cfg) {
			if (cfg.hasOwnProperty(p))
				this._cfg[p] = cfg[p];
		}
	},

	newFixedRunnerPool: function(url, numWorkers, queueCap) {
		if (typeof url === 'number') {
			queueCap = numWorkers;
			numWorkers = url;
			url = undefined;
		}

		return new RunnerPool(url, new Queue(queueCap), numWorkers, numWorkers);
	},

	newRunner: function(url) {
		return new Runner(url);
	},

	// newCachedRunnerPool: function() {
	// 	throw 'Not yet implemented';
	// },

	// Don't really need this
	// We can accomplish the same things via:
	/*
	worker.submit(function() {
		w.async(true).interleaving(true);
		function task() {
			code...
			setTimeout(task, 50);
		}
		task();
	});
	*/
	// newScheduledWorkerPool: function(numWorkers) {
	// 	throw 'Not yet implemented';
	// },
};
// TODO: exception handling
// to catch failures in workers and remove their promises.
var Runner = 
(function() {
	var messageHandlers = {
		registration: function(e) {
			var fn = this.fns[e.data.name] = this._createInvoker(e.data);
			this.registrations[e.data.name] = e.data;
			this._notifyRegCbs(fn, e.data);
		},

		completed: function(e) {
			var promise = this._promises[e.data.id];
			delete this._promises[e.data.id];
			promise._setState('resolved', e.data.result);
		},

		failed: function(e) {
			var promise = this._promises[e.data.id];
			delete this._promises[e.data.id];
			promise._setState('rejected', e.data.result);
		},

		ready: function(e) {
			this._ready(e.data.err);
		},

		progress: function(e) {
			var promise = this._promises[e.data.id];
			promise._progressMade(e.data.data);
		}
	};

	function Runner(url) {
		url = workerFactory._cfg.baseUrl + '/webworkers/runnerWebWorker.js' + ((url) ? '#' + url : '');
		this._worker = new Worker(url);
		var channel = new MessageChannel();

		this._worker.postMessage('internalComs', [channel.port2]);

		channel.port1.onmessage = this._messageReceived.bind(this);
		this._channel = channel;
		this._invokeId = 0;
		this._promises = {};
		this._readyCbs = [];
		this.fns = {};
		this.registrations = {};

		this._regCbs = [];

		this.submit = this.submit.bind(this);

		return this;
	}

	Runner.prototype = {
		terminate: function() {
			this._promises = {};
			this._readyCbs = [];
			this._fns = {};
			this.registrations = {};
			this._regCbs = [];
			this._worker.terminate();
		},

		_messageReceived: function(e) {
			messageHandlers[e.data.type].call(this, e);
		},

		_createInvoker: function(registration) {
			var self = this;

			return function() {
				var msg = {
						type: 'invoke',
						fn: registration.name,
						args: Array.prototype.slice.call(arguments, 0)
					};

				var promise = self._submit(msg, this.__promise, registration.promise);

				return (promise) ? createPublicInterface(promise) : undefined;
			};
		},

		submit: function(args, context, fn, opts) {
			var msg = normalizeArgs(args, context, fn, opts);
			msg.type = 'pass_invoke';
			return this._submit(msg);
		},

		_submit: function(msg, promise, makePromise) {
			msg.id = (this._invokeId += 1);
			if (typeof msg.fn === 'function')
				msg.fn = msg.fn.toString();

			if (makePromise || (msg.opts && msg.opts.promise)) {
				if (promise == null) {
					promise = this._promises[msg.id] = new Promise();
				} else {
					this._promises[msg.id] = promise;
				}
			}

			if (promise) {
				var self = this;
				promise.interrupt(function() {
					self._channel.port1.postMessage({
						type: 'interrupt',
						id: msg.id
					});
				});
			}

			this._channel.port1.postMessage(msg);
			return promise;
		},

		// Just bring in your EventEmitter?
		on: function(event, cb) {
			switch (event) {
				case 'registration':
					this._regCbs.push(cb);
				break;
				case 'ready':
					this.ready(cb);
				break;
			}
		},

		off: function(event, cb) {
			switch (event) {
				case 'registration':
					remove(this._regCbs, cb);
				break;
				case 'ready':
					remove(this._readyCbs, cb);
				break;
			}
		},

		ready: function(cb) {
			if (this._isReady) {
				cb(this, this._err);
			} else {
				this._readyCbs.push(cb);
			}
		},

		_notifyRegCbs: function(fn, registration) {
			this._regCbs.forEach(function(cb) {
				cb(fn, registration);
			});
		},

		_ready: function(err) {
			this._readyCbs.forEach(function(cb) {
				cb(this, err);
			}, this);
			this._isReady = true;
			this._err = err;
			this._readyCbs = [];
		}
	};

	return Runner;
})();
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
				console.log(this._url + ": Error adding worker.")
				console.log(err);
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
				if (task.opts.interleave)
					this._idleWorkers.add(worker);
				result = promise;
			} else if (this.numWorkers() + this._pendingCreations < this._maxWorkers) {
				var promise = new Promise();
				var self = this;

				this._queue.add(task);

				this._createWorker(this._workerCreated);
				result = promise;
			} else {
				result = task.promise = new Promise();
				this._queue.add(task);
			}

			var self = this;
			result.always(function() {
				self._workerCompleted(worker, task.opts);
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
					this._idleWorkers.add(worker);
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
			try {
				if (task.type === 'pass_invoke') {
					var promise = task.promise;
					delete task.promise;
					return worker._submit(task, promise);
				} else {
					var promise = task.fn.apply({
						__promise: task.promise
					}, task.args);

					return promise;
				}
			} catch (e) {
				console.log(e.stack);
				this._workerCompleted(worker);
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

	return RunnerPool;
})();
if (typeof define !== 'undefined') {
	define(function() {
		return workerFactory;
	});
} else if (typeof exports !== 'undefined') {
	exports = workerFactory;
} else {
	window.Runners = workerFactory;	
}}(this));