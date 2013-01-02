var w = {
	_async: false,
	_interleave: false,
	progress: function(data) {
		self.postMessage({type: 'progress', data: data});
		return this;
	},
	async: function(async) { this._async = async; return this; },
	interleave: function(interleave) {
		if (interleave)
			throw 'Interleaving multiple a-sync tasks on a single worker is not yet supported'; 
		this._interleave = interleave;
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

// TODO: what about support for interleaving of a-sync tasks?
// We'll need task-ids.
// We also need a message type so we can take interrupt messages.
function receiveNewTask(e) {
	var func = (new Function('w', 'return ' + e.data.func))(w);

	var result;
	var ex = false;
	try {
		// TODO: make a smarter way to reset to defaults
		// TODO: will need to be per-task
		w._async = false;
		w._interleave = false;
		result = func.apply(e.data.context, e.data.args);
	} catch (e) {
		result = e;
		ex = true;
	} finally {
		if (ex) {
			self.postMessage({type: 'failed', result: result});
		} else {
			if (!w._async)
				self.postMessage({type: 'completed', result: result});
			else if (w._interleave)
				self.postMessage({type: 'interleave'});
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