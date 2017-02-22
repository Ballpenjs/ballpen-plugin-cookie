class Converter {
	static init(converter = {}) {
		this.converter = converter;

		return Converter;
	};

	static set(key, value, attributes = {}) {
		BallpenPluginCookie.core(this.converter, key, value, attributes);
	};

	static get(key) {
		BallpenPluginCookie.core.call(BallpenPluginCookie.core, this.converter, key);
	};

	static remove(key, attributes = {}) {
		BallpenPluginCookie.core(this.converter, key, 'null', BallpenPluginCookie.extend(attributes, {
			expires: -1
		}));
	};
}

class BallpenPluginCookie {
	static extend() {
		var i = 0;
		var result = {};
		for (; i < arguments.length; i++) {
			var attributes = arguments[ i ];
			for (var key in attributes) {
				result[key] = attributes[key];
			}
		}
		return result;
	}

	static withConverter(converter) {
		return Converter.init(converter);
	};

	static core(converter = false, key, value, attributes) {
		var result;
		var optoString = Object.prototype.toString;

		if (typeof document === 'undefined') {
			return;
		}

		// Write
		if (value) {
			// Merge attributes
			attributes = BallpenPluginCookie.extend({
				path: '/'
			}, attributes);

			if (typeof attributes.expires === 'number') {
				var expires = new Date();
				// By seconds
				expires.setMilliseconds(expires.getMilliseconds() + (attributes.expires / (60 * 60 * 24))  * 864e+5);
				attributes.expires = expires;
			}

			// We're using "expires" because "max-age" is not supported by IE
			attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

			try {
				if (optoString.call(value) === "[object Object]" || optoString.call(value) === "[object Array]") {
					value = JSON.stringify(value);
				}
			} catch (e) {}
			
			if (!converter && !converter.write) {
				value = encodeURIComponent(String(value))
					.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
			} else if(!converter.write) {
				value = converter(value, key);
			} else {
				value = converter.write(value, key);
			}

			key = encodeURIComponent(String(key));
			key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
			key = key.replace(/[()]/g, escape);

			var stringifiedAttributes = '';

			for (var attributeName in attributes) {
				if (!attributes[attributeName]) {
					continue;
				}
				stringifiedAttributes += '; ' + attributeName;
				if (attributes[attributeName] === true) {
					continue;
				}
				stringifiedAttributes += '=' + attributes[attributeName];
			}
			
			return (document.cookie = (key + '=' + value + stringifiedAttributes));
		}

		// Read
		if (!key) {
			result = {};
		}

		// To prevent the for loop in the first place assign an empty array
		// in case there are no cookies at all. Also prevents odd result when
		// calling "get()"
		var cookies = document.cookie ? document.cookie.split('; ') : [];
		var rdecode = /(%[0-9A-Z]{2})+/g;
		var i = 0;

		for (; i < cookies.length; i++) {
			var parts = cookies[i].split('=');
			var cookie = parts.slice(1).join('=');

			if (cookie.charAt(0) === '"') {
				cookie = cookie.slice(1, -1);
			}

			try {
				var name = parts[0].replace(rdecode, decodeURIComponent);

				if (converter) {
					if (converter.read) {
						cookie = converter.read(cookie, name);
					} else {
						cookie = converter(cookie, name);	
					}
				} else {
					cookie = cookie.replace(rdecode, decodeURIComponent);
				}
					
				try {
					cookie = JSON.parse(cookie);
				} catch (e) {}
		
				if (key === name) {
					result = cookie;
					break;
				}

				if (!key) {
					result[name] = cookie;
				}
			} catch (e) {}
		}

		return result;
	};

	static set(key, value, attributes = {}) {
		BallpenPluginCookie.core(false, key, value, attributes);
	};

	static get(key) {
		return BallpenPluginCookie.core.call(this, false, key);
	};

	static remove(key, attributes = {}) {
		BallpenPluginCookie.core(false, key, 'null', BallpenPluginCookie.extend(attributes, {
			expires: -1
		}));
	};
}

export default BallpenPluginCookie;
