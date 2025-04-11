/*
    http://learn.jquery.com/plugins/basic-plugin-creation/
    http://learn.jquery.com/plugins/advanced-plugin-concepts/
    http://marijnhaverbeke.nl/uglifyjs

    "leftovers" jQuery plugin - Version 1.0 (Aug, 2013)

    Collection of functions to aid in jQuery development.

    Dependencies:
    -------------

    * http://jquery.com/ - duh
    * http://plasticthoughts.com/plugins/jquery.types/jquery.types.js - for gettype
    * http://cloud.github.com/downloads/eriwen/javascript-stacktrace/stacktrace-0.4.js - for `CreateTracedError`

    Usage:
    ------

        <script src='http://plasticthoughts.com/plugins/leftovers/jquery.leftovers.js'></script>

        // code goes here.

    Methods:
    --------

    $.leftovers.aryobj.get_idxs(ary,match_func)
    $.leftovers.aryobj.sort_by(field,reverse,primer_func)
    $.leftovers.aryobj.make_field_ary(ary,field)
    $.leftovers.aryobj.get_insert_idx(ary,new_elem,is_asc,cmp_func)

    $.leftovers.get_always_params(a,b,c)

    $.leftovers.rand(min,max)

    $.leftovers.preloadImages(filenames)

    $.leftovers.parse.make_html_safe(str)
    $.leftovers.parse.html_newlines(str)
    $.leftovers.parse.crop_string(str)
    $.leftovers.parse.cropUrlParms(str)
    $.leftovers.parse.simple_name_case(str)
    $.leftovers.parse.name_case(str)
    $.leftovers.parse.validate_string(options_obj)
    $.leftovers.parse.print_r(obj,num_branches)
    $.leftovers.parse.generate_random_string(length,include_upper,include_lower,include_num)

    Examples:
    --------

        See the included sample project source files, as well as specific information
        provided for each component of $.leftovers.

*/

/*

    aryobj - Collection of helpful functions to deal with a arrays of objects.
        
    Example:
    --------

        var a = [{id:0,text:"Zero"},{id:1,text:"One"},{id:2,text:"Two"},{id:11,text:"Eleven"},{id:14,text:"Fourteen"}];
        var r = {};

        // (1) $.leftovers.aryobj.get_idxs

        // r will be: [ {idx:11,text:"Eleven"},{idx:14,text:"Fourteen"} ]
        r = $.leftovers.aryobj.get_idxs(a,function(elem){
            return elem.id > 10;
        });

        for ( var x=r.length-1; x>=0; x-- ) {
            a.splice(r[x].idx,1); // doc: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
        }

        // (2) $.leftovers.aryobj.sort_by

        // a will now be: [{id:1,text:"One"},{id:2,text:"Two"},{id:0,text:"Zero"}]
        a.sort($.leftovers.aryobj.sort_by('text',false,function(field){
            return field.toLowerCase();
        }));

        // (3) $.leftovers.aryobj.make_field_ary

        // a2 will be: ["One","Two","Zero"];
        var a2 = $.leftovers.aryobj.make_field_ary(a,'text');        

        // (4) $.leftovers.aryobj.get_insert_idx

        var new_elem = {id:32,text:"Thirty-Two"};
        // ret would be: {idx:0,elem:{id:1,text:"One"}}
        var ret = $.leftovers.aryobj.get_insert_idx(a,new_elem,true,function(new_elem,existing_elem){
            var A = new_elem.text.toLowerCase();
            var B = existing_elem.text.toLowerCase();
            return ((A < B) ? -1 : (A > B) ? +1 : 0);
        });

        // a will now be: [{id:1,text:"One"},{id:32,text:"Thirty-Two"},{id:2,text:"Two"},{id:0,text:"Zero"}]
        a.splice(ret.idx+1,0,new_elem);
*/

(function($) {

    $.leftovers = (function(leftovers) {

        leftovers.aryobj = (function(){

            /////////////////////////////////////////////////////////////////////////////////
            // Search an array of objects, matching based upon the function sent. Returns
            // an array of objects (.idx,.elem) that is sorted ASC based upon .idx.
            //
            //  Usage:
            //      var r = get_idxs(myary,function(elem){
            //                  return elem.age > 25;
            //              });
            //
            //  @return - empty array on no matches.
            /////////////////////////////////////////////////////////////////////////////////

            get_idxs = function AryObj__get_idxs(ary,match_func) {

                var ret = [];

                if ( $.gettype && ( $.gettype(ary).base === "array" ) ) {

                    // we can be guaranteed that this goes through them in order, 
                    // as it's just a regular array and not an object.

                    $.each(ary,function(idx,elem){

                        if ( $.gettype(match_func).base === "function" ) {
                            
                            if ( match_func(elem) === true ) {
                                ret.push({
                                    idx : idx,
                                    elem : elem
                                });
                            }
                        }
                        
                    });
                }            

                return ret;
            }

            /////////////////////////////////////////////////////////////////////////////////
            // Provide a flexible function to be used in sorting an array of objects.
            // Usage would be:
            //
            //  my_flat_ary_of_objs.sort($.aryobj.sort_by('name',false,function(field){
            //      return field.toUpperCase();
            //  }));
            //
            //  @field - string - the name of the field (in each obj) to use as the sorting key
            //  @reverse - bool - are we doing a reverse sort?
            //  @primerFunc - function - called on the field before comparison
            //
            //  Note: Notice that the javascript array `.sort()` method expects -1 when
            //  A < B and +1 when A > B.
            /////////////////////////////////////////////////////////////////////////////////

            // source: http://stackoverflow.com/questions/979256/sorting-an-array-of-javascript-objects/979325#979325
            sort_by = function AryObj__sort_by(field,reverse,primerFunc) {

                // figure out the key for sorting, based on 'field'. if primerFunc was sent
                // then apply that first to the field.            
                var key = function (obj) {return primerFunc ? primerFunc(obj[field]) : obj[field]};

                // this is the function that will actually do the sorting. if reverse is true
                // then we multiply the result by -1, otherwise it remains.
                return function (a,b) {
                   var A = key(a);
                   var B = key(b);
                   return ((A < B) ? -1 : (A > B) ? +1 : 0) * [-1,1][+!reverse];
               }
            }

            /////////////////////////////////////////////////////////////////////////////
            // Given an array of objects, return an array consisting of values that
            // represent a single field from those objects.
            //
            // Returns an empty array if there were any problems.
            /////////////////////////////////////////////////////////////////////////////

            make_field_ary = function AryObj__make_field_ary(ary,field) {

                var ret = [];
                if ( $.gettype && ( $.gettype(ary).base === "array" ) ) {

                    for ( var x=0; x < ary.length; x++ ) {
                        if ( $.gettype(ary[x][field]).base !== "undefined" ) {
                            ret.push(ary[x][field]);
                        }
                    }
                }

                return ret;
            }

            /////////////////////////////////////////////////////////////////////////////////
            // Get the index that an object should be inserted at within an array of objects
            // that is currently sorted (either ASC or DESC).
            //
            //  cmp_func(new_elem,existing_elem) returns:
            //      - (-1) for new_elem < existing
            //      - (+1) for new_elem > existing
            //      - (0) for new_elem == existing
            //
            //  Returns an object (.idx, .elem). This represents the index that the
            //  new element should be inserted AFTER. If the front of the array is
            //  where it should go, it returns .idx==-1, .elem==null.
            /////////////////////////////////////////////////////////////////////////////////

            get_insert_idx = function AryObj__get_insert_idx(ary,new_elem,is_asc,cmp_func) {

                var ret = {
                    idx : -1,
                    elem : null
                }

                if ( $.gettype && ( $.gettype(ary).base === "array" ) ) {

                    $.each(ary,function(idx,elem){

                        // if the new_elem should be placed BEFORE the current
                        // element, then we're done comparing. if `is_asc` is true,
                        // then if our new_elem is less than our current elem, we're
                        // done. otherwise, if the new_elem is greater than our current
                        // elem (`is_asc` == false), then we're done.

                        if ( cmp_func(new_elem,elem) !== 1 * [-1,1][+is_asc] ) {
                            return false; // breaks out of $.each, but not the whole func
                        }
                        else {

                            // our current element does not go before the current elem.
                            // but perhaps it will go AFTER it.
                            ret.idx = idx;
                            ret.elem = elem;
                        }                    
                    });
                }

                return ret;
            }

            return {
                get_idxs : get_idxs,
                sort_by : sort_by,
                make_field_ary : make_field_ary,
                get_insert_idx : get_insert_idx
            }

        })(); // end of leftovers.aryobj = (function(){...

        return leftovers;

    })($.leftovers || {}); // end of "$.leftovers = (function(){..."

}(jQuery));

/*

    "get_always_params" - simple function to give you a standardized set of parameters in the jQuery AJAX .always() promise.

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
            var params = $.leftovers.get_always_params(a,b,c);

            if ( params.textStatus !== "abort" ) {
                remove_ajax_request(params.jqXHR);
            }

            if ( ( params.textStatus === "success" ) && ( params.data ) && ( !params.errorThrown ) ) {
                process_objs_that_were_waiting_for_this_ajax_call();
            }
        }
*/

(function($) {

    $.leftovers = (function(leftovers){

        leftovers.get_always_params = function Leftovers__get_always_params(a,b,c) {     

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

        return leftovers;

    })($.leftovers || {});

}(jQuery));

/*

    "rand" - gives a random integer from min to max-1.

    Example:
    --------

        var str = "Hey there! How's it going?";
        var c = $.leftovers.rand(0,str.length);
        console.log("Random character in string is: " + str[c]);
*/

(function($) {

    $.leftovers = (function(leftovers){

        leftovers.rand = function Leftovers__rand(min,max) {

            var dist = max-min;
            return min + Math.floor(Math.random() * dist);        

        }; // end of "rand = function"

        return leftovers;

    })($.leftovers || {});

}(jQuery));

/*

    "preloadImages" -   loads a number of images into memory. This enables you to
                        avoid having to wait for them to load later on, when you
                        actually want to use them.

    Note: If notification is required, check out: https://github.com/alexanderdickson/waitForImages

    Example:
    --------

        var images = {};
        $.leftovers.preloadImages(["image1.gif","image2.gif"],images);
        $("body").append(images["image2.gif"]);
*/

(function($) {

    $.leftovers = (function(leftovers){

        ///////////////////////////////////////////////////////////////////////////
        // Preload the images.
        // source: http://stackoverflow.com/questions/476679/preloading-images-with-jquery
        ///////////////////////////////////////////////////////////////////////////

        leftovers.preloadImages = function Leftovers__preloadImages(arrayOfImages,storage) {

            $(arrayOfImages).each(function(){
                            
                if ( storage ) {
                    storage[this] = $("<img/>")
                    .attr("src",this);
                }
                else {
                    $("<img/>")
                    .attr("src",this);
                }
            });
        }

        return leftovers;

    })($.leftovers || {});

}(jQuery));

/*

    "parse" - simple set of functions that help to deal with parsing strings.
        
    Examples:
    --------

        -- javascript:

        var s = "If you can't see the text after the colon, you're in trouble: <scr"+"ipt>alert(\"You're screwed!\");</scr"+"ipt>";
        s = $.leftovers.parse.make_html_safe(s);            
        $("#one").html($.leftovers.parse.reverse_make_html_safe(s));
        $("#two").html(s);

        s = "Hi there. This is some text... \n on a new line!";            
        s = $.leftovers.parse.html_newlines(s);            
        $("#three").html($.leftovers.parse.reverse_html_newlines(s));
        $("#four").html(s);

        s = "Exam 01 - Chapter 01 - Introduction and History";
        $("#five").html(s);
        $("#six").html($.leftovers.parse.crop_string(s,30));

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

            var ret = $.leftovers.parse.validate_string(parms);
            $("#eight").html("<pre>"+$.leftovers.parse.print_r(ret,1)+"</pre>");
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

    $.leftovers = (function(leftovers) {

        leftovers.parse = (function() {

            // source: http://ivaynberg.github.io/select2/        
            make_html_safe = function Parse__make_html_safe(str) {

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

            reverse_make_html_safe = function Parse__reverse_make_html_safe(str) {

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

            html_newlines = function Parse__html_newlines(str) {

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

            reverse_html_newlines = function Parse__reverse_html_newlines(str) {

                var re = new RegExp("\\<br\\>","gi");
                str = str.replace(re,"\n");

                return str;
            }

            /////////////////////////////////////////////////////////////////////////////
            // Ensure that a given string is no longer than `max` (min of 5). If the string
            // is over the maximum, we take as many chars as we can from it and then add
            // " ..." to the end.
            /////////////////////////////////////////////////////////////////////////////

            crop_string = function Parse__crop_string(str,max) {

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

            ///////////////////////////////////////////////////////////////////////////
            // Given a URL, remove all of the params from it. For instance:
            //
            //  site.com/12/?parm1=apple&parm2=orange [becomes] site.com/12/
            //
            ///////////////////////////////////////////////////////////////////////////

            cropUrlParms = function Parse__cropUrlParms(url) {

                if ( !url ) {
                    return url;
                }
                
                var pos = url.indexOf("?");
                var posE = url.indexOf("=");
                var posA = url.indexOf("&");

                if ( ( pos === -1 ) || ( ( posE < pos ) && ( posE !== -1 ) ) ) {
                    pos = posE;
                }
                if ( ( pos === -1 ) || ( ( posA < pos ) && ( posA !== -1 ) ) ) {
                    pos = posA;
                }

                if ( pos !== -1 ) {
                    url = url.slice(0,pos);
                }

                return url;
            }

            /////////////////////////////////////////////////////////////////////////////
            // Parse a string and ensure that it follows a particular format for names in
            // general. The rules are:
            //
            //  (1) All lowercase, except:
            //      (a) First letter
            //      (b) First letter encountered after space encountered
            //      (c) After a - char
            //
            //  (2) Only one space in between letters
            //  (3) Trimmed at front + back
            //
            /////////////////////////////////////////////////////////////////////////////

            simple_name_case = function Parse__name_case(str) {

                var is_alpha = function is_alpha(c) {
                    return /^[A-z]{1}$/.test(c);
                }

                // (1+3)
                var name = $.trim(str);
                name = name.toLowerCase();

                var spaceEncountered = false;
                for ( var x=0; x < name.length; x++ ) {
                    
                    var lastchar = ( x ? name.charAt(x-1) : null );
                    var c = name.charAt(x);

                    // 1(a)
                    if ( !x ) {
                        name = c.toUpperCase() + name.slice(1);
                    }

                    // 1(b)
                    else if ( spaceEncountered && ( is_alpha(c) ) ) {
                        name = name.slice(0,x) + c.toUpperCase() + name.slice(x+1);
                        spaceEncountered = false;
                    }

                    // 1(c)
                    else if ( ( lastchar && lastchar === "-" ) && ( is_alpha(c) ) ) {
                        name = name.slice(0,x) + c.toUpperCase() + name.slice(x+1);
                    }

                    // 2
                    if ( spaceEncountered && ( c === ' ' ) ) {
                        name = name.slice(0,x) + name.slice(x+1);
                        x--; // move back one, so for loop moves to new char that was shifted down one
                    }

                    else if ( c === ' ' ) {
                        spaceEncountered = true;
                    }
                }

                return name;
            }

            /////////////////////////////////////////////////////////////////////////////
            // Parse a string and ensure that it follows a particular format for peoples'
            // names. The rules are:
            //
            //  (1) All lowercase, except:
            //      (a) First letter
            //      (b) First letter after a space
            //      (c) After a ' char
            //      (d) After a - char
            //
            //  (2) Only one space in between letters
            //  (3) Trimmed at front + back
            //
            /////////////////////////////////////////////////////////////////////////////

            name_case = function Parse__name_case(str) {

                var is_alpha = function is_alpha(c) {
                    return /^[A-z]{1}$/.test(c);
                }                

                // (1+3)
                var name = $.trim(str);
                name = name.toLowerCase();

                for ( var x=0; x < name.length; x++ ) {
                    
                    var lastchar = ( x ? name.charAt(x-1) : null );
                    var c = name.charAt(x);

                    // 1(a)
                    if ( !x ) {
                        name = c.toUpperCase() + name.slice(1);
                    }

                    // 1(b)
                    else if ( ( lastchar ) && ( lastchar === ' ' ) && ( is_alpha(c) ) ) {
                        name = name.slice(0,x) + c.toUpperCase() + name.slice(x+1);
                    }

                    // 1(c)
                    else if ( ( lastchar ) && ( lastchar === "'" ) && ( is_alpha(c) ) ) {
                        name = name.slice(0,x) + c.toUpperCase() + name.slice(x+1);
                    }

                    // 1(d)
                    else if ( ( lastchar ) && ( lastchar === "-" ) && ( is_alpha(c) ) ) {
                        name = name.slice(0,x) + c.toUpperCase() + name.slice(x+1);
                    }

                    // 2
                    if ( ( lastchar ) && ( lastchar === ' ' ) && ( c === ' ' ) ) {
                        name = name.slice(0,x) + name.slice(x+1);
                        x--; // move back one, so for loop moves to new char that was shifted down one
                    }
                }

                return name;
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

            validate_string = function Parse__validate_string(options) {

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
                        if ( options.max_length && !isNaN(+options.max_length) ) {
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
                        if ( options.min_length && !isNaN(+options.min_length) ) {
                            ret.message = "Please make "+field_name+" between " + options.min_length + " and " + options.max_length + " characters long";
                        }
                        else {
                            ret.message = "Please make "+field_name+" no more than " + options.max_length + " characters long";
                        }
                    }
                }

                if ( ret.passed && options.str.length && options.match_charset ) {

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
            //  Note: JSON.stringify can do this, but without the `max_branches` setting.
            //          source: https://developer.mozilla.org/en-US/docs/Using_native_JSON
            //          source: http://stackoverflow.com/questions/9382167/serializing-object-that-contains-cyclic-object-value
            /////////////////////////////////////////////////////////////////////////////////////

            print_r = function Parse__print_r(obj,max_branches) {

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

            // for ParseStr__generate_random_string() only.
            var random_strings = [];            

            /////////////////////////////////////////////////////////////////////////////
            // Generates a random string of length X, consisting only of alphanumeric
            // characters, making sure that it hasn't generated the same one before.
            /////////////////////////////////////////////////////////////////////////////

            generate_random_string = function Parse__generate_random_string(length,include_upper,include_lower,include_num) {

                function makeit(length) {
                    
                    var text = "";
                    if ( !( include_upper || include_lower || include_num ) ) {
                        include_upper = true;
                    }
                    var possible = ( include_upper ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "" ) + ( include_lower ? "abcdefghijklmnopqrstuvwxyz" : "" ) + ( include_num ? "0123456789" : "" );

                    for( var i=0; i < length; i++ ) {
                        text += possible.charAt(Math.floor(Math.random() * possible.length));
                    }

                    return text;
                }

                var rand_str = "";
                var found = false;

                do {
                    rand_str = makeit(length);                
                }
                while ( $.inArray(rand_str,random_strings) !== -1 );

                random_strings.push(rand_str);
                return rand_str;
            }
            
            return {
                make_html_safe : make_html_safe,
                reverse_make_html_safe : reverse_make_html_safe,
                html_newlines : html_newlines,
                reverse_html_newlines : reverse_html_newlines,
                crop_string : crop_string,
                cropUrlParms : cropUrlParms,
                simple_name_case : simple_name_case,
                name_case : name_case,
                validate_string : validate_string,
                print_r : print_r,
                generate_random_string : generate_random_string
            }

        })(); // end of leftovers.parse = (function(){...

        return leftovers;

    })($.leftovers || {}); // end of "$.leftovers = (function(){..."

}(jQuery));