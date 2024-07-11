var app = app || {};
app.view = null;

app.init = function app__init() {	

	$.includejs.settings.ROOT = "";
	$.includejs.settings.cache = false;

	$.includejs.include({
		tpl : ["happiness"],
		js : ["view.happiness"],
		waiting : function() {
			$("#buttonLoad").html("Loading...");
		},
		success : function() {

			$("#divLoad").remove();
            var parent = $("#divContent");
            app.view = new HappinessView({parent:parent});            
        	app.view.render();
		},
		error : function(options,jqXHR,textStatus,errorThrown) {

			$("#buttonLoad").html("Failed.");
			
			console.log(options);
			console.log(jqXHR);
			console.log(textStatus);
			console.log(errorThrown);
		}
	});

	$.includejs.include({
		tpl : ["happiness"],
		js : ["view.happiness"],
		waiting : function() {
			console.log("waiting for 2nd run - this could be called if the first hasn't loaded yet");
		},
		success : function() {

			console.log("success on 2nd run - no more files should have been loaded");
		},
		error : function(options,jqXHR,textStatus,errorThrown) {

			console.error("Failed on second .include()");
			
			console.log(options);
			console.log(jqXHR);
			console.log(textStatus);
			console.log(errorThrown);
		}
	});
}