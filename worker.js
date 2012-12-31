console.log('Hello from a worker');

self.onmessage = function(e) {
	var func = (new Function('return ' + e.data.func))();

	var result;
	var ex = false;
	try {
		result = func();
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