var tripleweave = {
	require: function (src, success, failure) {
	    !function(source, success_cb, failure_cb) {
	        var script = document.createElement('script');
	        script.async = true; script.type = 'text/javascript'; script.src = source;
	        script.onload = success_cb || function(e){};
	        script.onerror = failure_cb || function(e){};
	        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
	    }(src, success, failure);
	},

	generateKey: function (bits) {
    	var key = new Uint32Array(bits / 8);
    	window.crypto.getRandomValues(key);

		return key.reduce(function(memo, i) {
		    return memo + i.toString(16);
		}, "");
	}, 

	construct: function (callback) {
    	// Check if triplesec has been included already
    	if (typeof triplesec === "undefined" || !triplesec) {
    		var key = this.generateKey;
    		var weaveString = this.weaveString;
    		var require = this.require;

    		require("./triplesec.min.js", function () {
    			console.log("TripleSec included...");
    			// require("./parallel.js", function () {
    				// console.log("Parallel.js included...");
    				callback(triplesec, weaveString, key);
    			// }, function () {
    				// console.error("Error including Parallel.js");
    				// callback(false);
    			// });
    		}, function () {
    			console.error("Error including TripleSec");
    			callback(false);
    		});
    	} else {
    		callback(triplesec, this.weaveString, this.generateKey);
    	}
	},

	weaveString: function (string, weaves) {
		var results = [];
		for (i = 0; i < weaves; i++) {
			var this_weave = [];
			for (chars = i; chars < string.length; chars = chars + weaves) {
				this_weave.push(string.charAt(chars));
			}
			results.push(this_weave);
		}

		return results;
	},

	unweaveArray: function (woven, weaves) {
		var results = [];
		for (var weave in woven) {
			var this_weave = woven[weave];
			var starting_index = weave;

			for (var char in this_weave) {
				var this_char = (parseInt(starting_index) + parseInt(char * weaves));
				results[this_char] = this_weave[char];
			}
		}

		return results.join("");
	},

	stringToWovenArray: function (string) {
		return string.match("/.{1," + weaves + "}/g");
	},

	encrypt: function (options, callback, progress_hook = function (progress) { console.log(progress) }) {
		var bits   = options.key_bitsize;
		var weaves = options.weaves;
		var data   = options.data;

		this.construct(function (triplesec, weaveString, key) {
			if (triplesec && weaveString && key) {
				key = key(bits);

				// Okay, we have triplesec
				// Now take the data and split it into pieces
				if (weaves === 1) {
					triplesec.encrypt({
					    data:          new triplesec.Buffer("1/" + data),
					    key:           new triplesec.Buffer(key),
					    progress_hook: progress_hook
					}, function(err, buff) {
					    if (!err) {
					        var ciphertext = buff.toString("hex");

					        callback({
					        	key: key,
					        	ciphertext: btoa(ciphertext)
					        });
					    } else {
					    	console.log(err, buff);
					    	callback(false);
					    }
					});
				} else {
					if (weaves > 1) {
						var woven = weaveString(data, weaves);
						
						var encrypted = [];
						for (var weave in woven) {
							var this_weave = weave + "/" + woven[weave].join("");

							triplesec.encrypt({
							    data:          new triplesec.Buffer(this_weave),
							    key:           new triplesec.Buffer(key),
							    progress_hook: progress_hook
							}, function(err, buff) {
							    if (!err) {
							        var ciphertext = buff.toString("hex");

							        encrypted.push(ciphertext);

							        if (encrypted.length === weaves) {
							        	callback({
							        		key: key,
							        		ciphertext: btoa(encrypted.join("/"))
							        	});
							        } 
							    } else {
							    	console.log(err, buff);
							    	callback(false);
							    }
							});
						}		
					} else {
						callback(false);
					}
				}
			} else {
				console.log(triplesec, key);
				callback(false);
			}
		});
	},

	decrypt: function (options, callback, progress_hook = function (progress) { console.log(progress) }) {
		var key    	  = options.key;
		var weaves    = options.weaves;
		var encrypted = options.ciphertext;
		
		var decoded = atob(encrypted);
		var encrypted_weaves = decoded.split("/");
		var results = [];

		var unweaveArray = this.unweaveArray;

		for (var weave in encrypted_weaves) {
			var weave_data = encrypted_weaves[weave];
			triplesec.decrypt ({
			    data:          new triplesec.Buffer(weave_data, "hex"),
			    key:           new triplesec.Buffer(key),
			    progress_hook: progress_hook
			}, function (err, buff) {
			    if (!err) {
			        results[parseInt(buff.toString().substr(0, 1))] = buff.toString().substr(2);

			        if (results.length === options.weaves) {
			        	callback(unweaveArray(results, weaves));
			        }
			    } else {
			    	console.log(results.length, weaves);
			    	console.error(err);
			    	callback(false, err);
			    }
			});
		}
	},

	chunkString: function (str, length) {
	  return str.match(new RegExp('.{1,' + length + '}', 'g'));
	}
}