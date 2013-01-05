var log = (function() {
	var log = {};
	if ('console' in self && 'error' in console) {
		log.error = function (error) {
			console.error(error);
		};
	} else {
		log.error = function(error) {
			alert(error);
		};
	}

	if ('console' in self && 'log' in console) {
		log.log = function(s) {
			console.log(s);
		};
	} else {
		log.log = function(s) {
			alert(s);
		};
	}

	return log;
})();

function identity(a) { return a; }

function remove(arr, item) {
	var idx = arr.indexOf(item);
	if (idx >= 0)
		arr.splice(idx, 1);
}

function combineArgs(array, args) {
	for (var i = 0; i < args.length; ++i) {
		var arg = args[i];
		if (Array.isArray(arg)) {
			array = array.concat(arg);
		} else {
			array.push(arg);
		}
	}

	return array;
}

function combine(array, maybeArray) {
	if (Array.isArray(maybeArray)) {
		array = this._doneCbs.concat(maybeArray);
	} else if (maybeArray != null) {
		array.push(maybeArray);
	}

	return array;
}

function createPublicInterface(object) {
	var iface = {};
	for (var key in object) {
		var val = object[key];
		if (typeof val === 'function' && key[0] !== '_') {
			iface[key] = val.bind(object);
		}
	}

	return iface;
}

function extend(dest, src) {
	for (var k in src) {
		if (dest[k] === undefined)
			dest[k] = src[k];
	}

	return dest;
}

var optsDefaults = {
	promise: true,
	async: false,
	interleave: false
};

function normalizeArgs(args, context, fn, opts) {
	if (typeof args === 'function') {
		fn = args;
		opts = context;
		context = null;
		args = null;
	} else if (!Array.isArray(args) && typeof args === 'object') {
		opts = fn;
		fn = context;
		context = args;
		args = null;
	} else if (Array.isArray(args) && typeof context === 'function') {
		opts = fn;
		fn = context;
		context = null;
	}

	opts = opts || {};

	extend(opts, optsDefaults);

	return {
		args: args,
		context: context,
		fn: fn,
		opts: opts
	};
}