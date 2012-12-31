console.log('Hello from a worker');

self.onmessage = function(e) {
	var func = (new Function('return ' + e.data.func))();
	func();
	self.postMessage({type: 'completed'});
};