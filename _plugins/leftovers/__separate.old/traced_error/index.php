<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>practice</title>

    <link href='_css/reset.css' rel='stylesheet'>
    <link href='_css/main.css' rel='stylesheet'>

    <script src='http://code.jquery.com/jquery-1.10.1.js'></script>
    <script src='http://plasticthoughts.com/plugins/gettype/jquery.gettype.js'></script>
    <script src='http://cloud.github.com/downloads/eriwen/javascript-stacktrace/stacktrace-0.4.js'></script>
    <script src='_js/mycode.js'></script>

    <script src='jquery.traced_error.js'></script> <!-- update this -->
    <script>

        $(document).ready(function() {

            var x = 1;
            if ( x < 10 ) {
                $.CreateTracedError("x is invalid");
            }

        }); // end ready

    </script>
</head>

<body>
<div class='wrapperBody'>

    <div class='wrapperContent'>    

        <div id='one'>
        </div>

    </div>

</div>
</body>
</html>