var workerFactory = {
	_cfg: {
		path: './'
	},

	config: function(cfg) {
		for (var p in cfg) {
			if (cfg.hasOwnProperty(p))
				this._cfg[p] = cfg[p];
		}

		if (this._cfg.production) {
			log.log = function() {};
			log.error = function() {};
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

	Runner: Runner,
	RunnerPool: RunnerPool,
	Queue: Queue,
	LinkedList: LinkedList

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