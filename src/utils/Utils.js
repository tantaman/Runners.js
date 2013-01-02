function identity(a) { return a; }

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