<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>practice</title>

    <link href='_css/reset.css' rel='stylesheet'>
    <link href='_css/main.css' rel='stylesheet'>

    <script src='http://code.jquery.com/jquery-1.10.1.js'></script>
    <script src='_js/mycode.js'></script>

    <script src='jquery.gettype.js'></script> <!-- update this -->
    <script>

        $(document).ready(function() {

            console.log($.gettype("hello"));
            console.log($.gettype(0));
            console.log($.gettype(3.10));
            console.log($.gettype(+"hello"));
            console.log($.gettype(true));

            var a = "12";
            var b = new Date();
            var c = "hello kitty";

            console.log($.checktypes([
                {n:"a",v:a,t:["number"]}
            ]));


        }); // end ready

    </script>
</head>

<body>
<div class='wrapperBody'>

    <div class='wrapperContent'>    

        <div>
        </div>

    </div>

</div>
</body>
</html>