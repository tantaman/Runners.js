console.log('Hello from a worker');

onmessage = function(e) {
	console.log(e);
};