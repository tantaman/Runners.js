;function RunnerPool(taskQueue, numWorkers) {
	AbstractRunnerPool.call(this, taskQueue, numWorkers, numWorkers);
};

var proto = RunnerPool.prototype = Object.create(AbstractRunnerPool.prototype);
proto._createActualWorker = function() {
	return new Worker(workerFactory._cfg.baseUrl + '/webworkers/runner.js');
};