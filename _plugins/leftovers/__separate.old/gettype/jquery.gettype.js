/*

	http://learn.jquery.com/plugins/basic-plugin-creation/
	http://marijnhaverbeke.nl/uglifyjs
	
	"gettype" jQuery plugin - Version 1.0 (Aug, 2013)

	Simple plugin to give you more detailed information about a variable. Source of original code: http://stackoverflow.com/questions/7390426/better-way-to-get-type-of-a-javascript-variable/7390612#7390612

	Disclaimer: I'm new to creating jQuery plugins, so don't expect too much.

	Dependencies:
	-------------

	* http://jquery.com/ - duh

	Usage:
	------

		$.gettype(obj);
		$.checktypes(obj_ary);
		
	Returns:
	--------

		Object
		- `.base` is the basic Javascript type ("array","Date","object","NaN","null","number","string","undefined")
		- `.extended` supports user-defined class types, through the `.__class_types[]` array.

		Object
		- `.success`
		- `.err` is a string describing the error. this is undefined if `success` = true.

	Example:
	--------

		var c = new MyClass({name:"EleventyOne",age:99,blob:null});
		console.log($.gettype(c));
		console.log($.gettype(c.name));
		console.log($.gettype(c.age));
		console.log($.gettype(c.blob));
		console.log($.gettype(c.superhero));

		var r = $.checktypes([
			{n:"c.name",v:c.name,t:["string"]},
			{n:"c.age",v:c.age,t:["number"]},
			{n:"c.blob",v:c.blob,t:["object","null"]},
			{n:"c.superhero",v:c.superhero,t:["object","null"]}
		]);

		if ( r.err ) {
			console.log(r);
		}
		
		// prints:
		//
		// Object { base : "object", extended: "MyClass" }
		// string
		// number
		// null
		// undefined
		// 
		// Object { success : false, err : "var `c.superhero` had type undefined, not (object,null)" }

*/

(function($) {

	$.gettype = function(obj) {		

		function base(obj) {
			return Object.prototype.toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
		}

		var r = {};
		var b = base(obj);

		// this returns "number" for NaN, so let's double check that
		// right here.

		if ( b === "number" ) {
			b = ( isNaN(obj) ? "NaN" : "number" );
		}

		// look for extended info in `.__class_types`.

		if ( ( b === "object" ) && ( base(obj.__class_types) === "array" ) && ( obj.__class_types.length ) ) {
			r.extended = obj.__class_types[obj.__class_types.length-1];
		}

		r.base = b;
		return r;
	
	}; // end of "gettype = function"

	$.checktypes = function(objs_ary) {

		var r = {};
		r.success = false;

		if ( $.gettype(objs_ary).base !== "array" ) {
			r.err = "`objs_ary` was not an array";
			return r;
		}

		for ( var x=0; x < objs_ary.length; x++ ) {

			var obj = objs_ary[x];
			if ( $.gettype(obj).base !== "object" ) {
				r.err = "`objs_ary["+x+"]` was a "+$.gettype(obj).base+", not an object";
				return r;
			}

			var name = obj.n;
			var val = obj.v;
			var types = obj.t;

			if ( $.gettype(name).base !== "string" ) {
				r.err = "`n` for `objs_ary["+x+"] was a "+$.gettype(name).base+", not a string";
				return r;
			}

			if ( $.gettype(types).base !== "array" ) {
				r.err = "`t` for var name `"+obj.n+"` was a "+$.gettype(types).base+", not an array";
				return r;
			}

			var t = $.gettype(val);
			var type_to_match = ( t.extended ? t.extended : t.base );

			if ( $.inArray(type_to_match,types) === -1 ) {
				r.err = "var `"+obj.n+"` had type "+type_to_match+", not ("+types.join(", ")+")";
				return r;
			}
		}
		
		r.success = true;
		return r;
	
	}; // end of "checktypes = function"

}(jQuery))