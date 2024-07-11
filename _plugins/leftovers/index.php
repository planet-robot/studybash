<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>leftovers - plugin test</title>

    <link href='_css/reset.css' rel='stylesheet'>
    <link href='_css/main.css' rel='stylesheet'>

    <!--[if lt IE 9]>
            <script src="http://code.jquery.com/jquery-1.10.1.js"></script>
            <script src="http://plasticthoughts.com/plugins/browser_support/jquery.ie_conditional_failed.js"></script>
        <![endif]-->
        <!--[if gte IE 9]><!-->
            <script src="http://code.jquery.com/jquery-2.0.2.js"></script>
    <!--<![endif]-->

    <script src='http://plasticthoughts.com/plugins/browser_support/jquery.browser_support.js'></script>
    <script src='http://plasticthoughts.com/plugins/jquery.types/jquery.types.js'></script>
    <script src='http://cloud.github.com/downloads/eriwen/javascript-stacktrace/stacktrace-0.4.js'></script>

    <script src='jquery.leftovers.js'></script>
    <script src='_js/mycode.js'></script>

    
    <script>

        $(document).ready(function() {

            var support = $.browser_support();

            if ( support.passed ) {

                /* aryobj-start */

                var a = [{id:0,text:"Zero"},{id:1,text:"One"},{id:2,text:"Two"},{id:11,text:"Eleven"},{id:14,text:"Fourteen"}];
                var r = {};

                console.log("Just the 'text' fields from `a`:");
                console.log($.leftovers.aryobj.make_field_ary(a,'text'));

                console.log("`a` before aryobj funcs");
                console.log(a);

                r = $.leftovers.aryobj.get_idxs(a,function(elem){
                    return elem.id > 10;
                });

                for ( var x=r.length-1; x>=0; x-- ) {
                    a.splice(r[x].idx,1);
                }

                a.sort($.leftovers.aryobj.sort_by('text',false,function(field){
                    return field.toLowerCase();
                }));

                var a2 = $.leftovers.aryobj.make_field_ary(a,'text');

                var new_elem = {id:32,text:"Thirty-Two"};
                var ret = $.leftovers.aryobj.get_insert_idx(a,new_elem,true,function(new_elem,existing_elem){
                    var A = new_elem.text.toLowerCase();
                    var B = existing_elem.text.toLowerCase();
                    return ((A < B) ? -1 : (A > B) ? +1 : 0);
                });

                a.splice(ret.idx+1,0,new_elem);

                console.log("`a` after aryobjs funcs");
                console.log(a);

                /* aryobj-end */

                // get_always_param
                do_ajax();

                /* gettype, checktypes - start */

                var a = {};
                var r = $.checktypes([
                    {n:"a string",v:"Me",t:["string"]},
                    {n:"a number",v:12,t:["number"]},
                    {n:"an object",v:a,t:["null"]}
                ]);

                console.log("return from `checktypes()`");
                console.log(r);

                /* gettype, checktypes - end */

                // parse-test
                parse_test();

                /* CreateTracedError - start */                

                $.leftovers.CreateTracedError.options.send_errors_url = "ajax.php";
                $.leftovers.CreateTracedError.options.cleanup_func = cleanup;

                //fixme: set to true to test CreateTracedError
                if ( false ) {
                    $.leftovers.CreateTracedError("Demo is all done!");
                }

                /* CreateTracedError - end */
            }

            else {
                $("<div></div>")
                .html("I'm sorry, but your browser is not supported. Failure was ("+support.component_failed+")")
                .appendTo("#content");
            }

        }); // end ready

    </script>
</head>

<body>
    <div id='wrapper-body'>

        <div id='content'>

            <div id='parse_test'>

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

            </div>

        </div>

    </div>
</body>
</html>