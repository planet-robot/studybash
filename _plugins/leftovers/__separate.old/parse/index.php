<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>practice</title>

    <link href='_css/reset.css' rel='stylesheet'>
    <link href='_css/main.css' rel='stylesheet'>

    <script src='http://code.jquery.com/jquery-1.10.1.js'></script>
    <script src='http://plasticthoughts.com/plugins/gettype/jquery.gettype.js'></script>
    <script src='_js/mycode.js'></script>

    <script src='jquery.parsestr.js'></script> <!-- update this -->
    <script>

        $(document).ready(function() {

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

        }); // end ready

    </script>
</head>

<body>
<div class='wrapperBody'>

    <div class='wrapperContent'>    

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
</body>
</html>