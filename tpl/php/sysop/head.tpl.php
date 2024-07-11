<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset="utf-8">
	<title><?php echo $data->title;?></title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">    

	<!-- CSS
	================= -->
	<link href='<?php echo Bootstrap::get_setting("js_root_full");?>_lib/bootstrap/css/bootstrap.min.css' rel='stylesheet' media='screen'>
<?php echo $data->styles;?>

	<!-- Javascript
	============================= -->

	<!-- dependencies (ordered) -->

	<script src="<?php echo Bootstrap::get_setting("js_root_full");?>_lib/jquery/jquery-2.0.2.min.js"></script>
	<script src='<?php echo Bootstrap::get_setting("js_root_full");?>_lib/bootstrap/js/bootstrap.min.js'></script>

	<!-- application code -->	
<?php echo $data->scripts;?>

    <script>        
        $(function() {
<?php echo $data->inline_script;?>
        }); // end ready

    </script>
</head>