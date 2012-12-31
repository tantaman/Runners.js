(function() {
	'use strict';

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
			this._tail = this._tail.prev;
			this._tail.next = null;
			return this._tail;
		},

		popFront: function() {
			--this._size;
			this._head = this._head.next;
			this._head.prev = null;
			return this._head;
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

		size: function() { return this._size; }
	};


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

		full: function() {
			if (this._maxSize < 0) return false;

			return this._list.size() >= this._maxSize;
		}
	};

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

		newFixedWorkerPool: function(numWorkers, queueCap) {
			var queue = new Queue(queueCap);
			return new FixedWorkerPool(queue, numWorkers);
		},

		newCachedWorkerPool: function() {

		},

		newScheduledWorkerPool: function() {

		}
	};

	function normalizeArgs(args, context, func, id) {
		if (typeof args === 'function') {
			func = args;
			id = context;
			context = null;
			args = null;
		} else if (!Array.isArray(args) && typeof args === 'object') {
			context = args;
			func = context;
			id = func;
			args = null;
		}

		return {
			args: args,
			context: context,
			func: func,
			id: id
		};
	}

	function WorkerWrapper(worker) {
		this.worker = worker;
	}

	WorkerWrapper.prototype = {
		postMessage: function(m) {
			this.worker.postMessage(m);
		},

		_reset: function() {
			// create a new promise
		},

		_workCompleted: function() {
			// complete the promise
		}
	};

	function AbstractWorkerPool(taskQueue, minWorkers, maxWorkers) {
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

	AbstractWorkerPool.prototype = {
		execute: function(args, context, func, id) {
			var normalizedArgs = normalizeArgs(args, context, func, id);

			if (this._idleWorkers.size() > 0) {
				var worker = this._idleWorkers.remove().value;
				this._dispatchToWorker(worker, normalizedArgs);
			} else if (this._runningWorkers.size() < this._maxWorkers) {
				var worker = this._createWorker();
				this._dispatchToWorker(worker, normalizedArgs);
			} else {
				if (this._queue.full()) {
					throw 'Task queue has reached its limit';
				}

				this._queue.add(normalizedArgs);
			}
		},

		_dispatchToWorker: function(worker, task) {
			// TODO: check function cache
			var promise = worker._reset();
			task.func = task.func.toString();

			worker.runningNode = this._runningWorkers.add(worker);
			worker.postMessage(task);

			return promise;
		},

		_createWorker: function() {
			var worker = new WorkerWrapper(this._createActualWorker());
			var self = this;
			worker.onmessage = function(e) {
				self._receiveWorkerMessage(worker, e);
			}

			return worker;
		},

		_receiveWorkerMessage: function(worker, e) {
			switch (e.data.type) {
				case 'completed':
					try {
						worker._workCompleted();
					} catch (e) {
						console.log(e);
					}

					if (this._queue.size() > 0) {
						this._dispatchToWorker(worker, this._queue.remove());
					} else {
						this._runningWorkers.removeWithNode(worker.runningNode);
						worker.runningNode = null;
						this._idleWorkers.add(worker);
					}
				break;
			}
		}
	};

	function FixedWorkerPool(taskQueue, numWorkers) {
		AbstractWorkerPool.call(this, taskQueue, numWorkers, numWorkers);
	};

	var proto = FixedWorkerPool.prototype = Object.create(AbstractWorkerPool.prototype);
	proto._createActualWorker = function() {
		return new Worker(workerFactory._cfg.baseUrl + '/worker.js');
	};
	

	function CachedWorkerPool() {
		AbstractWorkerPool.apply(this, arguments);
	};

	proto = CachedWorkerPool.prototype = Object.create(AbstractWorkerPool.prototype);
	proto._createActualWorker = function() {
		return new Worker(workerFactory._cfg.baseUrl + '/scheduledWorker.js');
	};


	window.Workers = workerFactory;
})();