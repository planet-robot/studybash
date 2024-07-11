/*

	http://learn.jquery.com/plugins/basic-plugin-creation/
	http://marijnhaverbeke.nl/uglifyjs
	
	"parsestr" jQuery plugin - Version 1.0 (Aug, 2013)

	Simple plugin that adds some helpful functions to deal with parsing strings.

	Disclaimer: I'm new to creating jQuery plugins, so don't expect too much.

	Dependencies:
	-------------

	* http://jquery.com/ - duh
    * http://eleventyone.github.io/gettype/ - detailed typeinfo for objects.

	Functions:
	------

		$.parsestr.make_html_safe - escape a string of html entities (and reverse_)
		$.parsestr.html_newlines - turn \n into <br> (and reverse_)
        $.parsestr.crop_string - shorten a string
        $.parsestr.validate_string - validate a string using certain criteria
        $.parsestr.print_r - like PHP's `print_r($obj,true)` method
		
	Examples:
	--------

        -- javascript:

        var s = "If you can't see the text after the colon, you're in trouble: <scr"+"ipt>alert(\"You're screwed!\");</scr"+"ipt>";
        s = $.parsestr.make_html_safe(s);            
        $("#one").html($.parsestr.reverse_make_html_safe(s));
        $("#two").html(s);

        s = "Hi there. This is some text... \n on a new line!";            
        s = $.parsestr.html_newlines(s);            
        $("#three").html($.parsestr.reverse_html_newlines(s));
        $("#four").html(s);

        s = "Exam 01 - Chapter 01 - Introduction and History";
        $("#five").html(s);
        $("#six").html($.parsestr.crop_string(s,30));

        $("#validate").on("click",function(){
            
            var str = $("#str").val();
            var min = $("#min_length").val();
            var max = $("#max_length").val();
            var charset = $("#charset").val();
            var type = $("#type").val();

            var parms = {};

            parms.str = str;
            parms.field = "special_string";
            if ( min.length ) {parms.min_length=min;}
            if ( max.length ) {parms.max_length=max;}
            if ( charset.length ) {parms.match_charset=charset;}
            if ( type !== "none" ) {parms.match_type=type;}

            var ret = $.parsestr.validate_string(parms);
            $("#eight").html("<pre>"+$.parsestr.print_r(ret,1)+"</pre>");
        });

        -- html:

        <div id='one'>
        </div>

        <div id='two'>
        </div>

        <div id='three'>
        </div>

        <div id='four'>
        </div>

        <div id='five'>
        </div>

        <div id='six'>
        </div>

        <div id='seven'>
            Special String: <input type='text' id='str'>
            Min length: <input type='text' id='min_length'>
            Max length: <input type='text' id='max_length'>
            Charset to match: <input type='text' id='charset'>
            Type to match:
            <select id='type'>
                <option>none</option>
                <option>email</option>
                <option>url</option>
            </select>
            <button id='validate'>Validate</button>
            <div id='eight'>
            </div>
        </div>
        
*/

(function($) {

	$.parsestr = (function() {

		// source: http://ivaynberg.github.io/select2/        
        make_html_safe = function ParseStr__make_html_safe(str) {

            var replace_map = {
                '\\': '&#92;',
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
                "/": '&#47;'
            };

            return String(str).replace(/[&<>"'\/\\]/g, function (match) {
                return replace_map[match];
            });
        }

        reverse_make_html_safe = function ParseStr__reverse_make_html_safe(str) {

            var replace_map = {
                '&#92;' : '\\',
                '&amp;' : '&',
                '&lt;' : '<',
                '&gt;' : '>',
                '&quot;' : '"',
                '&#39;' : "'",
                '&#47;' : "/"
            };

            return String(str).replace(/&#92;|&amp;|&lt;|&gt;|&quot;|&#39;|&#47;/g, function (match) {
                return replace_map[match];
            });
        }

        /////////////////////////////////////////////////////////////////////////////
        // Replace all the newlines with HTML newlines.
        /////////////////////////////////////////////////////////////////////////////

        html_newlines = function ParseStr__html_newlines(str) {

            // replacing with regex allows for global replace. regular replace (with just strings) only
            // replaces the first one: http://jsfiddle.net/yPSEZ/7/

            str = str.replace(/\r\n/g,"\n"); // Windows => Unix
            str = str.replace(/\r/g,"\n"); // Mac => Unix
            str = str.replace(/\n/g,"<br>");

            return str;
        }

        /////////////////////////////////////////////////////////////////////////////
        // Replaces all <br> instances with newlines.
        /////////////////////////////////////////////////////////////////////////////

        reverse_html_newlines = function ParseStr__reverse_html_newlines(str) {

            var re = new RegExp("\\<br\\>","gi");
            str = str.replace(re,"\n");

            return str;
        }

        /////////////////////////////////////////////////////////////////////////////
        // Ensure that a given string is no longer than `max` (min of 5). If the string
        // is over the maximum, we take as many chars as we can from it and then add
        // " ..." to the end.
        /////////////////////////////////////////////////////////////////////////////

        crop_string = function ParseStr__crop_string(str,max) {

            if ( ( typeof str !== "string" ) || ( +max < 5 ) )
            {
                return str;
            }

            if ( str.length > max ) {

                var num_chars_to_keep = max - 4;

                str = str.substring(0,num_chars_to_keep);
                str += " ...";
            }

            return str;
        }

        /////////////////////////////////////////////////////////////////////////////
        // Validate a string based upon a number of specifyable criteria.
        //
        //  Params:
        //      options (object):
        //
        //          .str - the string to validate
        //          .field - a name to give the string on message creation (e.g., "Phone Number")
        //          .min_length, .max_length - boundaries for length
        //          .match_charset - character set (to go inside ^[]$ regex) to match
        //          .match_type - validate a particular type (needn't send .match_charset then)
        //
        //  Returns:
        //      object:
        //
        //          .passed
        //          .message - status of failure (undefined on success or func failure)
        /////////////////////////////////////////////////////////////////////////////

        validate_string = function ParseStr__validate_string(options) {

            var ret = {
                passed : true
            }

            var match_types = ["email","url"]; // the only specific types that we have pre-built reg-exs for

            // note: we DO allow people to send NO validation params. however, if they DO send any
            // params, then we ensure that they're the right type

            if (
                    ( !options ) ||
                    ( typeof options.str !== "string") ||
                    ( options.min_length && ( isNaN(+options.min_length) ) ) ||
                    ( options.max_length && ( isNaN(+options.max_length) ) ) ||
                    ( options.match_charset && ( typeof options.match_charset !== "string" ) ) ||
                    ( options.match_type && ( $.inArray(options.match_type,match_types) === -1 ) )
                )
            {
                ret.passed = false;
            }

            var field_name = "<span class='field'>`" + ( typeof options.field === "string" ? options.field : "the field" ) + "`</span>";

            if ( options.min_length ) {
                
                options.min_length = +options.min_length;
                if ( options.str.length < options.min_length ) {
                    ret.passed = false;
                    if ( !isNaN(+options.max_length) ) {
                        ret.message = "Please make "+field_name+" between " + options.min_length + " and " + options.max_length + " characters long";
                    }
                    else {
                        ret.message = "Please make "+field_name+" at least " + options.min_length + " characters long";
                    }
                }
            }

            if ( ret.passed && options.max_length ) {

                options.max_length = +options.max_length;
                if ( options.str.length > options.max_length ) {
                    ret.passed = false;
                    if ( !isNaN(+options.min_length) ) {
                        ret.message = "Please make "+field_name+" between " + options.min_length + " and " + options.max_length + " characters long";
                    }
                    else {
                        ret.message = "Please make "+field_name+" no more than " + options.max_length + " characters long";
                    }
                }
            }

            if ( ret.passed && options.match_charset ) {

                // it's possible for the user to consider '[' and ']' to be valid, so we have to escape them.

                var escaped_match_charset = options.match_charset.replace(/\[/g,"\\[");
                escaped_match_charset = escaped_match_charset.replace(/\]/g,"\\]");

                var re = new RegExp( "^["+escaped_match_charset+"]+$","g");
                ret.passed = re.test(options.str);

                if ( !ret.passed ) {
                    ret.message = "The available characters for "+field_name+" are: " + options.match_charset;
                }
            }

            if ( ret.passed && options.match_type ) {

                // more complete answer: http://www.ex-parrot.com/~pdw/Mail-RFC822-Address.html
                // source: http://www.regular-expressions.info/email.html
                if ( options.match_type === "email" ) {

                    // fixme: this first one, although very straightforward, doesn't match on .co.uk addresses.                    
                    //var re = new RegExp("\\b[A-z0-9._%+-]+@[A-z0-9.-]+\\.[A-z]{2,4}\\b");

                    var re = new RegExp("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+(?:[A-Z]{2}|ca|com|co\\.uk|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\\b");
                    ret.passed = re.test(options.str);
                    if ( !ret.passed ) {
                        ret.message = "Please enter a valid "+field_name+"";
                    }
                }

                // source: http://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
                else if ( options.match_type === "url" ) {

                    var re = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|(www\\.)?){1}([0-9A-Za-z-\\.@:%_\‌​+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");
                    ret.passed = re.test(options.str);
                    if ( !ret.passed ) {
                        ret.message = "Please enter a valid "+field_name+"";
                    }
                }
            }

            return ret;
        }

        /////////////////////////////////////////////////////////////////////////////////////
        // Mimics the PHP function `print_r($obj,true)`. Recursive loops are prevented, and 
        // functions are ignored. To ensure that the tree doesn't get too big, you can send 
        // `max_branches`. If, for example, we send as `obj`:
        //
        //  { id: 10, data : {name:"EleventyOne"} }
        //
        //  .id would be branch of 1
        //  .data would be branch of 1
        //  .data.name would be branch of 2
        //
        //  A string is returned, consisting of `\t` and `\n` codes, for formatting.
        //      
        /////////////////////////////////////////////////////////////////////////////////////

        print_r = function ParseStr__print_r(obj,max_branches) {

            // can't do it without extended object type information

            if ( !$.gettype ) {
                return obj;
            }

            var objs = []; // this tracks all of the objects that we go INTO. prevents recursion.

            if ( ( !max_branches ) || ( max_branches < 0 ) ) {
                max_branches = 2;
            }

            // our main function. we separate it like this because we recursively
            // call it everytime we find a new object property or array index to
            // go into.

            var inspect = function inspect(obj,tabs_to_start,num_branches) {

                add_tabs = function add_tabs(num) {

                    var s = "";
                    for ( var x=0; x < num; x++ ) {
                        s += "\t";
                    }

                    return s;
                }

                var str = ""; // this is added to along the way
                if ( !tabs_to_start ) {
                    tabs_to_start = 0;
                }

                var type = $.gettype(obj).base;
                var prop_type = $.gettype(obj).extended;

                // (1) iterate through an object's properties

                if ( type === "object" ) {

                    var type_to_add = ( prop_type ? prop_type : type );

                    str += type_to_add + "\n" + add_tabs(tabs_to_start) + "{\n";

                    if ( num_branches >= max_branches ) {
                        str += add_tabs(tabs_to_start+1) + "(branch limit)\n";
                    }

                    else if ( $.inArray(obj,objs) === -1 ) {

                        objs.push(obj);
                        for ( var prop in obj ) {

                            var t = $.gettype(obj[prop]).base;
                            if ( t !== "function" ) {

                                str += add_tabs(tabs_to_start+1) + "["+prop+"] => ";
                                str += inspect(obj[prop],tabs_to_start+2,num_branches+1); // recursion
                            }
                        }
                    }

                    else {                        
                        str += add_tabs(tabs_to_start+1) + "(circular)\n";
                    }

                    str += add_tabs(tabs_to_start) + "}\n";

                }

                // (2) iterate through an array

                else if ( type === "array" ) {

                    str += type + "\n" + add_tabs(tabs_to_start) + "{\n";

                    if ( num_branches >= max_branches ) {
                        str += add_tabs(tabs_to_start+1) + "(branch limit)\n";
                    }

                    else if ( $.inArray(obj,objs) === -1 ) {

                        objs.push(obj);
                        for ( var x=0; x < obj.length; x++ ) {

                            var t = $.gettype(obj[x]).base;
                            if ( t !== "function" ) {

                                str += add_tabs(tabs_to_start+1) + "["+x+"] => ";
                                str += inspect(obj[x],tabs_to_start+2,num_branches+1); // recursion
                            }
                        }
                    }

                    else {
                        str += add_tabs(tabs_to_start+1) + "(circular)\n";
                    }

                    str += add_tabs(tabs_to_start) + "}\n";
                }

                // (3) a single variable.

                else {

                    var to_add = "";

                    if ( ( type !== "function" ) && ( type !== "null" ) && ( type !== "undefined" ) && ( obj.toString ) ) {
                        to_add = obj.toString();
                    }
                    else {
                        to_add = type;
                    }

                    str += to_add + "\n";
                }

                // (4) done. we've built up our string, we can return what
                // we have.

                return str;
            }

            return inspect(obj,0,0);
        }

		return {
            make_html_safe : make_html_safe,
            reverse_make_html_safe : reverse_make_html_safe,
            html_newlines : html_newlines,
            reverse_html_newlines : reverse_html_newlines,
            crop_string : crop_string,
            validate_string : validate_string,
            print_r : print_r
		}

	})(); // end of "parsestr = function"

}(jQuery))