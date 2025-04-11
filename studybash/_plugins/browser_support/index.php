<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>browser_support - plugin test</title>

    <link href='_css/reset.css' rel='stylesheet'>
    <link href='_css/main.css' rel='stylesheet'>

    <!--[if lt IE 9]>
            <script src="http://code.jquery.com/jquery-1.10.1.js"></script>
            <script src="jquery.ie_conditional_failed.js"></script>
        <![endif]-->
        <!--[if gte IE 9]><!-->
            <script src="http://code.jquery.com/jquery-2.0.2.js"></script>
    <!--<![endif]-->

    <script src='http://underscorejs.org/underscore.js'></script>    
    <script src='http://cloud.github.com/downloads/eriwen/javascript-stacktrace/stacktrace-0.4.js'></script>

    <script src='jquery.browser_support.js'></script>
    <script src='_js/mycode.js'></script>

    
    <script>

        $(document).ready(function() {

            var support = $.browser_support();

            if ( support.passed ) {
                $("<div></div>")
                .html("Welcome to my website!")
                .appendTo("#content");
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
        </div>

    </div>
</body>
</html>