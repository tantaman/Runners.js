(function() {
	var w = {
		_async: false,
		// Interleaving is currently unsupported for runners.
		_interleave: false,

		progress: function(data) {
			self.postMessage({type: 'progress', data: data});
			return this;
		},

		done: function(result, err) {
			if (!this._async)
				throw "Can't call done for a synchronous task";

			if (err !== undefined) {
				self.postMessage({type: 'failed', result: err});
			} else {
				self.postMessage({type: 'completed', result: result});
			}
		},
		interrupted: false
	};

	var workerContext = {
		invocation: function(context) {
			if (context) {
				this._invocation = context;
			} else {
				return this._invocation;
			}
		}
	};

	// TODO: what about support for interleaving of a-sync tasks?
	// We'll need task-ids.
	function receiveNewTask(e) {
		var fn = 
			(new Function('ic', 'workerContext', 'return ' + e.data.fn))(w, workerContext);

		e.data.opts = e.data.opts || {};

		var result;
		var ex = false;
		try {
			// TODO: make a smarter way to reset to defaults
			// TODO: will need to be per-task
			w._async = e.data.opts.async;
			w._interleave = e.data.opts.interleave;
			workerContext.invocation(w);
			result = fn.apply(e.data.context, e.data.args);
		} catch (e) {
			result = e;
			ex = true;
		} finally {
			if (ex) {
				self.postMessage({type: 'failed', result: result});
			} else {
				if (!w._async)
					self.postMessage({type: 'completed', result: result});
				// else if (w._interleave)
					// self.postMessage({type: 'interleave'});
			}
		}
	}

	self.onmessage = function(e) {
		switch (e.data.type) {
			case 'task':
				w.interrupted = false;
				receiveNewTask(e.data);
			break;
			case 'interrupt':
				w.interrupted = true;
			break;
		};
	};
})(this);