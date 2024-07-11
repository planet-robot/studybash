/*

	"ie_conditional_failed" jQuery plugin - Version 1.0 (Aug, 2013)

	Include this if you want to tell the `leftovers` jQuery plugin that
	"conditional comment trick" (http://blog.jquery.com/2013/03/01/jquery-2-0-beta-2-released/)
	failed, signifying that we have an old and unsupported version of IE.

	<!--[if lt IE 9]>
	        <script src="http://code.jquery.com/jquery-1.10.1.js"></script>
	        <script src="jquery.leftovers.ie_conditional_failed.js"></script>
	    <![endif]-->
	    <!--[if gte IE 9]><!-->
	        <script src="http://code.jquery.com/jquery-2.0.2.js"></script>
	<!--<![endif]-->
*/

(function($) {

	$.ie_conditional_failed = function() {
		return true;	
	};

}(jQuery));