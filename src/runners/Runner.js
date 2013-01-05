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
		url = workerFactory._cfg.baseUrl + '/webworkers/pWorker.js' + ((url) ? '#' + url : '');
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