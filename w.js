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
		},

		popBack: function() {
			--this._size;
			this._tail = this._tail.prev;
			this._tail.next = null;
		},

		popFront: function() {
			--this._size;
			this._head = this._head.next;
			this._head.prev = null;
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
		},

		add: function(value) {
			this.pushFront(value);
		},

		remove: function() {
			this.popBack();
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
			this._list.popBack();
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
				var worker = this._idleWorkers.remove();
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
			task.func = task.func.toString();

			worker.runningNode = this._runningWorkers.add(worker);
			worker.postMessage(task);
		},

		_createWorker: function() {
			var worker = new WorkerWrapper(this._createActualWorker());
			var self = this;
			worker.onmessage = function(e) {
				self._receiveWorkerMessage(worker, e);
			}
		},

		_receiveWorkerMessage: function(worker, e) {
			switch (e.data.type) {
				case 'completed':
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