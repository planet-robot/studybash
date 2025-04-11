function do_ajax() {

    $.ajax({        
        url : "ajax.php",
        data : {
            'doesnt' : 'matter'
        },
        dataType : 'json',
        type : 'POST',
        timeout : 10000
    })
    .done(function(data,textStatus,jqXHR) {                    

        console.log("AJAX.done()");
    })
    .fail(function(jqXHR,textStatus,errorThrown) {

        console.log("Fail: " + textStatus + " (" + errorThrown + ")");
    })
    .always(function(a,b,c){                    
        //get-always-param
        var parms = $.leftovers.get_always_params(a,b,c);
        console.log("AJAX.always()");
        console.log(parms);
    });

}

//CreateTracedError
function cleanup() {
    console.log("cleaning up...");
}

//parse
function parse_test() {

    $("#parse_test").show();

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
}