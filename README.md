## NOTE: This started as a joke and wasn't intended to actually be used. Please don't use it :)

# TripleWeave.js
A new encryption method known as _weaving_. Strings are broken up at evenly spaced intervals and encrypted seperately. Built for [qCrypt](https://getqcrypt.com/).

## Information
This library makes use of the [TripleSec.js library by Keybase.io](https://keybase.io/triplesec/).
FYI: This library is **_slow_**. It's probably suitable for production use, but I wouldn't.

Todo: Implement parallelism/web workers so new processes can be spawned for encryption and decryption cycles. This should speed things up greatly.

The ```tripleweave.combined.min.js``` contains a minified JavaScript file containing both Keybase's TripleSec and TripleWeave. This is what you should include for most purposes.

The progress hook on _tripleweave.encrypt()_ and _tripleweave.decrypt()_ defaults to console.log().

**I am an _amateur cryptographer_. This library is intended for educational purposes _ONLY_ and is _NOT_ intended for production use.**

## Installation
```html
<script src="src/tripleweave.combined.min.js"></script>
```

## Usage
```javascript
var options = {
	key_bitsize: 2048, // The size in bits of the key you want generated
	// This is the number of weaves the string should be broken into
	// The higher the number, the slower the number will be.
	// Unfortunately TripleSec is pretty slow...
	weaves: 3,
	data: "this is the string to be TripleWeaved"
};

tripleweave.encrypt(options, function (encrypted) {
	// `encrypted` is an object
	// {
	//		key: "YOUR_GENERATED_KEY", (this is important, save this)	
	// 		ciphertext: "MWM5NGQ3ZGUwMDAwMDA…NmM2I2ODA0Yzg=" (your encrypted TripleWeave cipher)
	// }

	options = {
		key: encrypted.key,
		weaves: options.weaves,
		ciphertext: encrypted.ciphertext
	}

	tripleweave.decrypt(options, function (data) {
		// `data` is a string with the unwoven original data
		// `data` should === options.data

		alert(data);
	});
}, function (data) {
	// This callback is optional and is just a progress hook for encryption/decryption cycles
});
```

Method List
===========
### Initiation
- [construct ( *callback* )]()
- [require ( *filename* )]()

### Weaving
- [weaveString ( *string*, *weaves* )]()
- [unweaveArray ( *array*, *weaves* )]()
- [stringToWovenArray ( *array*, *weaves* )]()
- [chunkString ( *string*, *pieces* )]()

### Crypto
- [encrypt ( *options*, *callback*, *progress_hook* )]()
- [decrypt ( *options*, *callback*, *progress_hook* )]()
