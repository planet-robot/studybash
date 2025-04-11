/*
    "TracedError" jQuery plugin - Version 1.0 (Nov, 2013)

    This is a straightforward plug-in that provides a function to deal with fatal errors
    occurring in a script.

    Dependencies:
    -------------

    * http://jquery.com/ - duh
    * http://cloud.github.com/downloads/eriwen/javascript-stacktrace/stacktrace-0.4.js - for printStackTrace()
    * http://plasticthoughts.com/plugins/jquery.types/jquery.types.js - for gettype()
    * http://getbootstrap.com/dist/css/bootstrap.css - for default layout of HTML markup

    Example:
    --------

        function cleanup() {
            abort_pending_ajax_requests();
        }

        // this .php file will receive a POST request with the following
        // data object fields: .message (string), and .trace (array of strings)
        $.tracedError.settings.url = "http://mywebsite.com/receive_errors.php";

        // this means that the HTML isn't touched after the failure. set to
        // `null` (or leave undefined) to use the default.
        $.tracedError.settings.html = function() {};

        $.tracedError.settings.cleanup = cleanup;

        if ( failed_conditions ) {
            $.tracedError.createTracedError("The conditions failed!");
        }

        // NOTE: Easy way to use printStackTrace() alone:

        var str = printStackTrace().join("<br>");
        $("body").append("<hr>");
        $("body").append(str);

    Notes:
    ------

        If all went well, when you die on a TracedError, in the FireBug console, you will see the message of the
        TracedError, and the code: `this.undef()` from stacktrace.js. This is because if you do not send
        printStackTrace the exception that's created (not supported in IE9), it creates it's own to trace from.
        Chrome will actually include this in the stack.        
*/

(function($) {

    $.tracedError = (function(){

        //
        // Public Data
        //

        ///////////////////////////////////////////////////////////////////////////
        // These options dictate the behaviour of $.CreateTracedError
        ///////////////////////////////////////////////////////////////////////////

        var settings = {
            url : null, // send a POST here
            cleanup : null, // callback for 'cleaning up'
            html : null // callback to alter HTML of page, reflecting error
        };

        //
        // Private Methods
        //

        ///////////////////////////////////////////////////////////////////////////
        // Get rid of everything in the stack AT AND AFTER the call to 
        // `$.tracedError.createTracedError()` - as it's always the same and not
        // useful.
        //
        //  @trace - array from printStackTrace()
        //  @return - array with the superfluous entries removed
        //
        ///////////////////////////////////////////////////////////////////////////
        
        var parseTrace = function tracedError__parseTrace(trace) {

            var new_trace = [];
            var passedIt = false; // have we gone past the 'createdtracederror' string?

            if ( ( !$.gettype ) || ( $.gettype(trace).base !== "array" ) ) {
                return trace;
            }

            for ( var x=0; x < trace.length; x++ ) {

                if ( $.gettype(trace[x]).base !== "string" ) {
                    continue;
                }
                else if ( passedIt ) {
                    new_trace.push(trace[x]);
                }                
                else if ( ( !passedIt ) && ( trace[x].toLowerCase().indexOf("createtracederror") !== -1 ) ) {
                    passedIt = true;
                }
            }

            return new_trace;
        }

        ///////////////////////////////////////////////////////////////////////////
        // Placeholder function to create an error page, which should be displayed
        // just before the page is killed with a `throw`.
        ///////////////////////////////////////////////////////////////////////////
        
        var errorHTMLFunc = function tracedError__errorHTMLFunc(message,trace) {

            // clear all the HTML            
            $("body").html("");

            // add the main container

            $("<div></div>")
            .attr("id","tracedError")
            .addClass("container")
            .appendTo("body");

            // page header

            $("<p></p>")
            .addClass("tracedError-header")
            .addClass("page-header")
            .html("<h1>Critical Error!</h1>")
            .appendTo("#tracedError");

            // add the panel for this error

            $("<div></div>")
            .attr("id","tracedError-error")
            .addClass("panel panel-danger")
            .appendTo("#tracedError");

            // panel heading - message

            $("<p></p>")
            .addClass("tracedError-heading")
            .addClass("panel-heading")
            .html("<h3 class='panel-title'>"+message+"</h3>")
            .appendTo("#tracedError-error");

            // output the trace: first build up the HTML for it

            var html_text = "";
            if ( ( $.gettype ) && ( $.gettype(trace).base === "array" ) ) {
                for ( var x=0; x < trace.length; x++ ) {
                    html_text += "<p class='tracedError-trace-line'>" + "#"+(trace.length-x-1)+" " + trace[x] + "</p>\n";
                }
            }
            else {
                html_text = "<p class='tracedError-trace-line'>" + trace + "</p>\n";
            }

            // output the trace: render to DOM

            $("<div></div>")
            .addClass("tracedError-trace")
            .addClass("panel-body")
            .html(html_text)
            .appendTo("#tracedError-error");        
        }

        ///////////////////////////////////////////////////////////////////////////
        // After we have sent our AJAX request, informing the server of the error,
        // and that has completed, we can now actually create the exception.
        ///////////////////////////////////////////////////////////////////////////

        var finalizeTracedError = function tracedError__finalizeTracedError(message,trace) {

            if ( $.gettype ) {

                // if we have a cleanup function, execute it now
                if ( $.gettype(settings.cleanup).base === "function" ) {
                    settings.cleanup();
                }

                // if we have a function to redo the HTML of the page, signifying the
                // error, execute it now. if not, we'll execute our own.

                if ( $.gettype(settings.html).base === "function" ) {
                    settings.html(message,trace);
                }
                else {
                    errorHTMLFunc(message,trace);
                }
            }

            // throw an error, to (hopefully) kill the page's execution.
            throw new TracedError(message);
        }

        ///////////////////////////////////////////////////////////////////////////
        // Bare-bones proprietary Exception class. Inherits from Error and the
        // only new thing is `.__class_types`.
        ///////////////////////////////////////////////////////////////////////////

        var TracedError = function TracedError__construct(message) {

            if ( !( this instanceof TracedError ) ) {
                console.error("`TracedError()` must be called with 'new'");
                return null;
            }

            this.message = message;        
            this.__class_types = ["TracedError"];
        };

        TracedError.prototype = new Error();

        //
        // Public Methods
        //

        ///////////////////////////////////////////////////////////////////////////
        // Call this method when you intend to kill the page's execution. Four
        // things (at most) are done here, based on `settings`
        //
        // (1) If .url has a value, we notify that page via AJAX
        // (2) If .cleanup is a func, we call it
        // (3) If .html is a func, we call it with `message` and `trace`
        // (4) No matter what, a `TracedError` is thrown at the end (with `message`)
        //
        // If there is no func inside .html, then we execute our
        // inline one, which removes the HTML from <body> and then outputs
        // the basic info from here: `message` and `trace`.
        ///////////////////////////////////////////////////////////////////////////

        var createTracedError = function tracedError__createTracedError(message) {            

            var trace = ( (typeof printStackTrace !== "undefined") ? parseTrace(printStackTrace()) : ["printStackTrace is undefined"] );

            if ( !$.gettype ) {
                message += " \n[Warning: `$.gettype()` undefined in `$.tracedError`";
            }

            // if we have been told where to send information about the errors
            // created, send it now. we will not take further action until the
            // call is complete (but we don't care if it was successful or not).

            if ( settings.url ) {
                $.ajax({
                    url : settings.url,
                    type : "POST",
                    timeout : 10000,
                    dataType : "json",
                    contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
                    data : JSON.stringify({ 'message' : message, 'trace' : trace }),
                    processData : false,
                    context : this
                })
                .always(function(a,textStatus,c){
                    finalizeTracedError(message,trace);
                });
            }
            else {
                finalizeTracedError(message,trace);
            }        
        }        

        //
        // Public interface
        //

        return {

            // data
            settings : settings,

            // methods
            createTracedError : createTracedError
        };

    })();

}(jQuery));