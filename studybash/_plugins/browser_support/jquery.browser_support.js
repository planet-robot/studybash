 /*

    "browser_support" - function to deduce if the browser is modern enough to support your website.

    Returns:
    --------

        .passed - boolean
        .component_failed - string

    Example:
    --------

        <!-- begin note: this check isn't strictly needed. feature detection should work, but this is extra layer of checking -->

        <!--[if lt IE 9]>
            <script src="http://code.jquery.com/jquery-1.10.1.js"></script>
            <script src="http://plasticthoughts.com/plugins/browser_support/jquery.ie_conditional_failed.js"></script>
        <![endif]-->
        <!--[if gte IE 9]><!-->
            <script src="http://code.jquery.com/jquery-2.0.2.js"></script>
        <!--<![endif]-->

        <!-- end note -->
        
        <script src='http://plasticthoughts.com/plugins/browser_support/jquery.browser_support.js'></script>

        <script>

            $(document).ready(function() {

                var support = $.browser_support();
                var msg = support.passed ? "Welcome to the website." : "Please download a new browser! (Failed On: "+support.component_failed+")";
                $("<div></div>")
                .html(msg)
                .appendTo("body");

            }); // end ready

        </script>

    Notes:
    ------

        Take a look at http://modernizr.com/, if you want a more in-depth evaluation [not added yet]
*/

(function($) {

    // some useful information: http://kangax.github.io/es5-compat-table/
    // and modernizr for HTML5/CSS detection: http://modernizr.com/

    $.browser_support = function browser_support() {

        var ret = {
            passed : false
        }

        // if we've already been marked, we're done.

        if ( $.ie_conditional_failed ) {
            ret.component_failed = "IE_conditional";
            return ret;
        }

        // old versions of IE, VERY old versions of other browsers

        if  (
                ( !Array.prototype.indexOf ) ||
                ( !Array.prototype.forEach ) ||
                ( !String.prototype.indexOf ) ||
                ( !String.prototype.trim ) ||                
                ( !Function.prototype.bind ) ||
                ( !Object.keys ) ||
                ( !Object.create ) ||
                ( !JSON ) ||
                ( !JSON.parse ) ||
                ( !JSON.stringify ) ||
                ( !JSON.stringify.length ) ||
                ( JSON.stringify.length < 3 )
            )
        {
            ret.component_failed = "methods";
            return ret;
        }

        // now, look for specific features that may be used
        // in more demanding websites.

        // # AJAX uploads

        if ( !window.FormData || !window.FileReader ) {
            ret.component_failed = "ajax_upload";
            return ret;
        }

        // # local storage support
        // source: http://diveintohtml5.info/storage.html

        try {
            var local_storage_support = ( 'localStorage' in window && window['localStorage'] !== null );
            if ( !local_storage_support ) {
                throw new Error("local_storage_support: failed");
            }
        }
        catch ( e ) {
            ret.component_failed = "storage";
            return ret;
        }

        // # HTML data elements

        var body = $("body");
        body.data("browser_support_test",42);
        if ( body.data("browser_support_test") !== 42 ) {
            ret.component_failed = "data";
            return ret;
        }
        else {
            body.removeData("browser_support_test");
        }

        // # rgba CSS property

        $("<div></div>")
        .attr("id","browser_support_test")
        .css("visibility","hidden")
        .css("background-color","rgba(255,255,255,0.1)")
        .appendTo("body");

        var bst = $("#browser_support_test");
        var bst_css = bst.css("background-color");
        bst.remove();
        if ( bst_css.indexOf("rgba") === -1 ) {
            ret.component_failed = "rgba";
            return ret;
        }

        // # box model

        $("<div>browser_support_test</div>")        
        .attr("id","browser_support_test")
        .css("visibility","hidden")
        .css("-moz-box-sizing","border-box")
        .css("-webkit-box-sizing","border-box")
        .css("box-sizing","border-box")
        .css("border","1px solid black")
        .css("padding","2px")
        .css("width","200px")
        .appendTo("body");

        bst = $("#browser_support_test");
        var bst_width = bst.outerWidth();
        bst.remove();

        if ( bst_width !== 200 ) {
            ret.component_failed = "box";
            return ret;
        }

        ret.passed = true;
        return ret;

    }; // end of "browser_support = function"

}(jQuery));