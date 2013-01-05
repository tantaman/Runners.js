'use strict';

self.onmessage = function(e) {
	if (e.data === 'internalComs') {
		self._internal = {
			_port: e.ports[0],
			fns: {}
		};
	}

	self.onmessage = null;

	self.workerContext = {
		register: function(name, fn, promise, async, interleave) {
			if (promise !== false)
				promise = true;

			self._internal.fns[name] = {
				fn: fn,
				promise: promise,
				async: async || false
			};

			self._internal._port.postMessage({
				type: 'registration',
				name: name,
				promise: promise
			});
		},

		ready: function(err) {
			self._internal._port.postMessage({
					type: 'ready',
					err: err
			});
		},

		invocation: function(context) {
			if (context) {
				this._invocation = context;
			} else {
				return this._invocation;
			}
		}
	};

	var ws = {};
	self.__wsdbg = ws;
	var registrationDefaults = {
		async: false,
		promise: true,
		interleave: false
	};

	function compileFunction(fn, ic) {
		return (new Function('ic', 'return ' + fn))(ic);
	}

	function extend(dest, src) {
		for (var k in src) {
			if (dest[k] === undefined)
				dest[k] = src[k];
			}

		return dest;
	}

	function invoke(msg, compile) {
		var registration = msg.opts || self._internal.fns[msg.fn];
		extend(registration, registrationDefaults);

		var w = {
			done: function (result, err) {
				delete ws[msg.id];
				if (err !== undefined) {
					var type = 'failed';
					result = err;
				} else {
					var type = 'completed';
				}

				if (!registration.promise)
					return;

				self._internal._port.postMessage({
					type: type,
					result: result,
					id: msg.id
				});
			},

			progress: function(data) {
				self._internal._port.postMessage({
					type: 'progress',
					data: data,
					id: msg.id
				});
			},

			interrupted: false
		};

		ws[msg.id] = w;

		var ex = false;
		var result;
		try {
			workerContext.invocation(w);
			if (compile) {
				registration.fn = compileFunction(msg.fn, w);
			}
			result = registration.fn.apply(msg.context, msg.args);
		} catch (e) {
			result = e;
			ex = true;
		} finally {
			if (ex) {
				w.done(null, result);
			} else if (!registration.async) {
				w.done(result);
			}
		}
	}

	self._internal._port.onmessage = function(e) {
		switch (e.data.type) {
			case 'invoke':
				invoke(e.data);
			break;
			case 'pass_invoke':
				invoke(e.data, true);
			break;
			case 'interrupt':
				ws[e.data.id].interrupted = true;
			break;
		}
	};

	var url = location.hash.substring(1);

	try {
		importScripts(url);
		if (typeof self.exports === 'object') {
			for (var key in self.exports) {
				if (self.exports.hasOwnProperty(key)) {
					self.workerContext.register(key, self.exports[key]);
				}
			}
		}
		self.workerContext.ready();
	} catch(e) {
		self.workerContext.ready(e.message);
	}
}