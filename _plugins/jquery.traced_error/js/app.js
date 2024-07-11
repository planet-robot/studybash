var app = app || {};

app.init = function app__init() {	

	$.tracedError.settings.url = "yerma";
	//$.tracedError.settings.cleanup = function() {};
	//$.tracedError.settings.html = function() {};

	$.tracedError.createTracedError("You fucked up");
}