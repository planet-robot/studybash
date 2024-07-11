/*

	http://learn.jquery.com/plugins/basic-plugin-creation/
	http://marijnhaverbeke.nl/uglifyjs
	
	"get_always_params" jQuery plugin - Version 1.0 (Aug, 2013)

	Simple plugin to give you a standardized set of parameters in the jQuery AJAX .always() promise.

	Disclaimer: I'm new to creating jQuery plugins, so don't expect too much.

	Dependencies:
	-------------

	* http://jquery.com/ - duh

	Usage:
	------

		var parms = $.get_always_params(a,b,c);

	Returns:
	--------

		Object:

		- .textStatus
		- .jqXHR
		- .data (may be undefined)
		- .errorThrown (may be undefined)

	Example:
	--------

        generic_always = function Ajax__generic_always(a,b,c) {
            
            // get the real params
            var params = $.get_always_params(a,b,c);

        	if ( params.textStatus !== "abort" ) {
        		remove_ajax_request(params.jqXHR);
        	}

        	if ( ( params.textStatus === "success" ) && ( params.data ) && ( !params.errorThrown ) ) {
        		process_objs_that_were_waiting_for_this_ajax_call();
        	}
        }
*/

(function($) {

	$.get_always_params = function(a,b,c) {		

		// very straightforward. if the AJAX call
		// was a success, then `data` should be
		// filled. if not, then `errorThrown` should
		// be filled. also, which param represents
		// `jqXHR` differs based upon whether or not
		// there was an error.

		var jqXHR = null;
        var data = undefined;
        var errorThrown = undefined;
            
        if ( b === "success" ) {
            data = a;
            jqXHR = c;
        }
        else {
            jqXHR = a;
            errorThrown = c;
        }            

        return {
            textStatus : b,
            jqXHR : jqXHR,
            data : data,
            errorThrown : errorThrown
        };
	
	}; // end of "get_always_params = function"

}(jQuery))