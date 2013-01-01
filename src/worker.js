var w = {
	progress: function(data) {
		self.postMessage({type: 'progress', data: data});
	},
	interrupted: false
};

self.onmessage = function(e) {
	var func = (new Function('w', 'return ' + e.data.func))(w);

	var result;
	var ex = false;
	try {
		// e.data.context.__w__ = w;
		result = func.apply(e.data.context, e.data.args);
	} catch (e) {
		result = e;
		ex = true;
	} finally {
		if (ex) {
			self.postMessage({type: 'failed', result: result});
		} else {
			self.postMessage({type: 'completed', result: result});
		}
	}
};