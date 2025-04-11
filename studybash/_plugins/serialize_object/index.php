<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>practice</title>

    <link href='_css/reset.css' rel='stylesheet'>
    <link href='_css/main.css' rel='stylesheet'>    
    
    <script src='http://code.jquery.com/jquery-2.0.3.js'></script>
	<script src='http://underscorejs.org/underscore.js'></script>
    <script src='_js/app.js'></script>

    <script src='jquery.serialize_object.js'></script> <!-- update this -->
    <script>

        $(document).ready(function() {
            $("form").on("submit",function(e){
                $("<div></div>")
                .html(JSON.stringify($(this).serialize_object()))
                .appendTo("body");
                return false;
            });
        }); // end ready

    </script>
</head>

<body>
    <div id='wrapper-body'>

        <div id='content'>

            <form>
                <input type='text' name='firstname'>
                <input type='text' name='lastname'>
                <input type='hidden' name='id' value='1'>
                <button type='submit'>Submit</button>
            </form>

        </div>

    </div>
</body>
</html>