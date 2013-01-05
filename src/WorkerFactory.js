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

	newFixedRunnerPool: function(numWorkers, queueCap) {
		var queue = new Queue(queueCap);
		return new RunnerPool(queue, numWorkers);
		// return this.newFixedPWorkerPool(numWorkers, queueCap);
	},

	newSingleRunnerPool: function() {
		var queue = new Queue();
		return new RunnerPool(queue, 1);
	},

	newPWorker: function(url) {
		// promiseMessage?
		return new PromisingWorker(url);
	},

	newFixedPWorkerPool: function(url, numWorkers, queueCap) {
		if (typeof url === 'number') {
			queueCap = numWorkers;
			numWorkers = url;
			url = undefined;
		}

		return new PromisingWorkerPool(url, new Queue(queueCap), numWorkers, numWorkers);
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