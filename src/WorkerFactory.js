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
	},

	newCachedRunnerPool: function() {
		throw 'Not yet implemented';
	},

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

	newSingleRunnerPool: function() {
		var queue = new Queue();
		return new RunnerPool(queue, 1);
	},

	newWorker: function(url) {
		// Make a worker whose postMessage methods return promises?
		// it is the user's worker...
		// so we'll need to modify onMessage somehow so it returns
		// something that can set the state of the promise.

		// Maybe instead of overriding postMessage provide a new method:
		// promiseMessage since promises are going to have to be cached
		// and looked up by some id.  So if the other side never fulfills
		// the promise it'll leak.

		// Allow promiseMessage(msg, timeout)?
		// to expire the promises?
		return new PromisingWorker(url);
	},

	// newFixedWorkerPool: function() {

	// }

	// TODO: PWorker pool?
	// It would make sense to have one...
	// load up the same script in multiple workers and farm out calls
	// to available workers...
};