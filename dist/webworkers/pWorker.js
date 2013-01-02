'use strict';

self.onmessage = function(e) {
	if (e.data === 'internalComs') {
		self._internal = {
			_port: e.ports[0],
			funcs: {}
		};
	}

	self.onmessage = null;

	self.w = {
		register: function(name, func, promise, async) {
			if (promise !== false)
				promise = true;

			self._internal.funcs[name] = {
				func: func,
				promise: promise,
				async: async || false
			};

			self._internal._port.postMessage({
				type: 'registration',
				name: name,
				promise: promise
			});
		},

		ready: function() {
			self._internal._port.postMessage({
					type: 'ready'
			});
		}
	};

	var ws = {};

	function invoke(msg) {
		var registration = self._internal.funcs[msg.func];

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
			interrupted: false
		};

		ws[msg.id] = w;			

		var args;
		if (registration.async) {
			args = msg.args.concat(msg.args, w);
		} else {
			args = msg.args;
		}

		var ex = false;
		var result;
		try {
			result = registration.func.apply(msg.context, args);
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
			case 'interrupt':
				ws[e.data.id].interrupted = true;
			break;
		}
	};

	var url = location.hash.substring(1);
	importScripts(url);

	if (typeof self.exports === 'object') {
		for (var key in self.exports) {
			if (self.exports.hasOwnProperty(key)) {
				self.w.register(key, self.exports[key]);
			}
		}
	}

	self.w.ready();
}