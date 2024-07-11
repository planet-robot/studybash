gettype
=======

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

Note to self about how to format this readme.md file:

* http://github.github.com/github-flavored-markdown/sample_content.html
* https://github.com/mojombo/github-flavored-markdown/issues/1

And for minifying JS code:

* http://marijnhaverbeke.nl/uglifyjs