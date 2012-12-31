console.log('Hello from a worker');

onmessage = function(e) {
	console.log('got msg');
	console.log(e.data);

	var func = (new Function('return ' + e.data.func))();
	func();
};