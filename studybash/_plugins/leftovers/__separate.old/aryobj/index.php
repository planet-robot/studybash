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

    <script src='jquery.aryobj.js'></script> <!-- update this -->
    <script>

        $(document).ready(function() {

            var x =[1,2,3];
            var r = $.aryobj.get_idxs(x,function(elem){
                return elem > 1;
            });
            console.log(r);

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