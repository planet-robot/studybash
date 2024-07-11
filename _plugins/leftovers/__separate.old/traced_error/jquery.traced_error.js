/*

	http://learn.jquery.com/plugins/basic-plugin-creation/
    http://learn.jquery.com/plugins/advanced-plugin-concepts/
	http://marijnhaverbeke.nl/uglifyjs
	
	"traced_error" jQuery plugin - Version 1.0 (Aug, 2013)

	Simple plugin that provides an Error-derived class that includes a stack trace from where it was created.

	Dependencies:
	-------------

	* http://jquery.com/ - duh
    * http://plasticthoughts.com/plugins/gettype/jquery.gettype.js - detailed typeinfo for objects.
    * http://cloud.github.com/downloads/eriwen/javascript-stacktrace/stacktrace-0.4.js - for printStackTrace()

	Usage:
	------

        function cleanup() {
            abort_pending_ajax_requests();
        }

        $.CreateTracedError.options.send_errors_url = "http://mywebsite.com/receive_errors.php";
        $.CreateTracedError.options.cleanup_func = cleanup;

        if ( failed_conditions ) {
            $.CreateTracedError("The conditions failed!");
        }

    Notes:
    ------

    If all went well, when you die on a TracedError, in the FireBug console, you will see the message of the
    TracedError, and the code: `this.undef()` from stacktrace.js. This is because if you do not send
    printStackTrace the exception that's created (not supported in IE9), it creates it's own to trace from.
    Chrome will actually include this in the stack.
        
*/

(function($) {    

    ///////////////////////////////////////////////////////////////////////////
    // Call this method when you intend to kill the page's execution. Four
    // things (at most) are done here, based on $.CreateTracedError.options
    //
    // (1) If .send_errors_url has a value, we notify that page via AJAX
    // (2) If .cleanup_func has a value, we call it
    // (3) If .error_html_func is a func, we call it with `message` and `trace`
    // (4) No matter what, a $.TracedError is thrown at the end (with `message`)
    //
    // If there is no func inside .error_html_func, then we execute our
    // inline one, which removes the HTML from <body> and then outputs
    // the basic info from here: `message` and `trace`.
    ///////////////////////////////////////////////////////////////////////////

    $.CreateTracedError = function CreateTracedError(message) {

        // get rid of everything in the stack AT AND BEYOND the call to 
        // $.CreateTracedError.
        var parse_trace = function CreateTracedError__parse_trace(trace) {
            
            var new_trace = [];
            var found = false;

            if ( ( !$.gettype ) || ( $.gettype(trace).base !== "array" ) ) {
                return trace;
            }

            for ( var x=0; x < trace.length; x++ ) {

                if ( $.gettype(trace[x]).base !== "string" ) {
                    continue;
                }
                else if ( found ) {
                    new_trace.push(trace[x]);
                }                
                else if ( ( !found ) && ( trace[x].toLowerCase().indexOf("createtracederror") !== -1 ) ) {
                    found = true;
                }
            }

            return new_trace;
        }

        // placeholder function to create an error page, which should be displayed
        // just before the page it killed with a `throw`.
        var error_html_func = function CreateTracedError__error_html_func(message,trace) {
            
            $("body").html("");
            
            $("<div></div>")
            .attr("id","TracedError")
            .appendTo("body");

            $("<p></p>")
            .addClass("TracedError-blurb")
            .html("Critical Error!")
            .appendTo("#TracedError");

            $("<p></p>")
            .addClass("TracedError-message")
            .html(message)
            .appendTo("#TracedError");

            var html_text = "";
            if ( ( $.gettype ) && ( $.gettype(trace).base === "array" ) ) {
                for ( var x=0; x < trace.length; x++ ) {
                    html_text += "<p class='TracedError-trace-line'>" + trace[x] + "</p>\n";                    
                }
            }
            else {
                html_text = "<p class='TracedError-trace-line'>" + trace + "</p>";
            }

            $("<div></div>")
            .addClass("TracedError-trace")
            .html(html_text)
            .appendTo("#TracedError");
        
        } // end of error_html_func = function

        if ( $.gettype ) {

            var trace = ( printStackTrace ? parse_trace(printStackTrace()) : ["printStackTrace is undefined"] );

            // if we have been told where to send information about the errors
            // created, send it now. notice that no promises are attached to
            // the AJAX call, as we are not concerned with whether or not it
            // arrived and/or how it was processed.

            if ( $.CreateTracedError.options.send_errors_url ) {
                $.ajax({
                    url : $.CreateTracedError.options.send_errors_url,
                    data : { 'message' : message, 'trace' : trace },
                    dataType : 'json', // ignored, as we don't receive anything back
                    type : 'POST',
                    timeout : 10000
                });
            }

            // if we have a cleanup function, execute it now
            if ( $.gettype($.CreateTracedError.options.cleanup_func).base === "function" ) {
                $.CreateTracedError.options.cleanup_func();
            }

            // if we have a function to redo the HTML of the page, signifying the
            // error, execute it now. if not, we'll execute our own.
            if ( $.gettype($.CreateTracedError.options.error_html_func).base === "function" ) {
                $.CreateTracedError.options.error_html_func(message,trace);
            }
            else {
                error_html_func(message,trace);
            }
        }

        else {
            message += " \n[Warning: `$.gettype()` undefined in `$.CreateTracedError()`";
        }

        // throw an error, to (hopefully) kill the page's execution.
        throw new $.TracedError(message);
    
    } // end of $.CreateTracedError = function

    ///////////////////////////////////////////////////////////////////////////
    // These options dictate the behaviour of $.CreateTracedError
    ///////////////////////////////////////////////////////////////////////////

    $.CreateTracedError.options = {
        send_errors_url : null,
        cleanup_func : null,
        error_html_func : null
    };

    ///////////////////////////////////////////////////////////////////////////
    // Bare-bones proprietary Exception class. Inherits from Error and the
    // only new thing is `.__class_types`.
    ///////////////////////////////////////////////////////////////////////////

	$.TracedError = function TracedError__construct(message) {

        if ( !( this instanceof $.TracedError ) ) {
            return;
        }

        this.message = message;        
        this.__class_types = ["TracedError"];
	};

    $.TracedError.prototype = new Error();    

}(jQuery))