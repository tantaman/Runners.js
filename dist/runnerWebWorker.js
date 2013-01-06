;(function(window) {'use strict';var Runners = {};var Workers = {};/**
The MIT License

Copyright (c) 2013 Matt Crinklaw-Vogt.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

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
		if (typeof self.runnables === 'object') {
			for (var key in self.runnables) {
				if (self.runnables.hasOwnProperty(key)) {
					self.workerContext.register(key, self.runnables[key]);
				}
			}
		}
		self.workerContext.ready();
	} catch(e) {
		self.workerContext.ready(e.message);
	}
}}(this));