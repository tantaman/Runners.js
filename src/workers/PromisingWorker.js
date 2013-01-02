;function PromisingWorker(url) {
	var w = new Worker(workerFactory._cfg.baseUrl + '/webworkers/promisingWorker.js#' + url);
	var channel = new MessageChannel();

	w.postMessage('internalComs', [channel.port2]);

	channel.port1.onmessage = this._messageReceived.bind(this);
	this._channel = channel;
	this._invokeId = 0;
	this._promises = {};
	this._readyCbs = [];
	this.fns = {};

	return this;
}

PromisingWorker.prototype = {
	_messageReceived: function(e) {
		// invokeId -> promise
		switch (e.data.type) {
			case 'registration':
				this.fns[e.data.name] = this._createInvoker(e.data);
			break;
			case 'completed':
				var promise = this._promises[e.data.id];
				delete this._promises[e.data.id];
				promise._setState('resolved', e.data.result);
			break;
			case 'failed':
				var promise = this._promises[e.data.id];
				delete this._promises[e.data.id];
				promise._setState('rejected', e.data.result);
			break;
			case 'ready':
				this._ready();
			break;
		}
	},

	_createInvoker: function(registration) {
		var self = this;

		return function() {
			var msg = {
					type: 'invoke',
					func: registration.name,
					id: ++self._invokeId,
					args: Array.prototype.slice.call(arguments, 0)
				};
			var promise;
			if (registration.promise) {
				promise = self._promises[msg.id] = new Promise();
			}

			self._channel.port1.postMessage(msg);
			return promise;
		};
	},

	ready: function(cb) {
		if (this._isReady) {
			cb();
		} else {
			this._readyCbs.push(cb);
		}
	},

	_ready: function() {
		this._readyCbs.forEach(function(cb) {
			cb();
		});
		this._isReady = true;
		this._readyCbs = [];
	},

	invoke: function(fname, args, context) {

	}
};