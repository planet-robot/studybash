<?php

	require_once( $_SERVER['DOCUMENT_ROOT'] . "/require.php" );
	require_once( get_bootstrap_path() . "/bootstrap.php" );

	if ( !Bootstrap::init("studybash") ) {
		die("Bootstrap failure!");
	}

	if ( defined("SECURE_MODE") ) {
		if ( !Bootstrap::is_secure() ) {
			header( "Location: " . Bootstrap::get_setting("js_root_full") );
			exit();
		}
	}

	$userRecord = null;
	$domainRoot = Bootstrap::get_setting("domain_root");

	try {
		
		$jsRoot = Bootstrap::get_setting("js_root_full");		

		// if the user has already logged in, we'll grab their information from
		// the session object and pass it along to JS

		if ( Session::get_instance()->continue_session() ) {
			if ( array_key_exists("user",$_SESSION) ) {								
				$userRecord = clone $_SESSION['user'];
				//Activity::set_table_name("sb_debug_activity");
				//Activity::add_to_db("session.continue",$userRecord->full_name." (".$userRecord->id.")","very low");
			}
		}
	}
	catch ( Exception $e ) {
		ErrorStatic::from_user($e);
		if ( !is_a($e,"ServerClientException") ) {
			$e = "Timeout (high traffic volume)";
		}
		else {
			$e = $e->get_client_message();
		}
		die($e);
	}
?>

<!DOCTYPE html>
<html lang="en">

<head>

	<meta charset="utf-8">
	<title>Studybash</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

	<!-- CSS
	================= -->

	<!-- fonts -->

	<link href='https://fonts.googleapis.com/css?family=Paytone+One' rel='stylesheet' type='text/css'>

	<!-- plugins -->
	
	<link href='<?php echo $jsRoot;?>_lib/bootstrap/css/bootstrap.min.css' rel='stylesheet' media='screen'>
	<link href='<?php echo $jsRoot;?>_lib/select2/css/select2.css' rel='stylesheet'>
	<link href='<?php echo $jsRoot;?>_lib/select2/css/select2-bootstrap-3.css' rel='stylesheet'>
	<link href='<?php echo $jsRoot;?>_lib/colorbox/css/colorbox.css' rel='stylesheet'>
	<link href='<?php echo $jsRoot;?>_plugins/browser_support/jquery.browser_support.css' rel='stylesheet'>
	<link href='<?php echo $jsRoot;?>_plugins/colorbox.spinner/colorbox.spinner.css' rel='stylesheet'>
	<link href='<?php echo $jsRoot;?>_plugins/colorbox.dialog/colorbox.dialog.css' rel='stylesheet'>

	<!-- application -->
	
	<link href='<?php echo $jsRoot;?>_inc/css/studybash.main.css' rel='stylesheet'>

</head>

<body>

	<div id='wrapper-body'>

		<div id='content' class='container'>

			<div id='content-loading' class='well well-lg'>
			</div>

			<noscript>

				<div id='section-page-noscript' class='container'>
			
					<img src='<?php echo $jsRoot;?>img/rage_javascript.jpg' alt='Y U NO ENABLE JAVASCRIPT?' class='img-thumbnail'>			
					<p>Unfortunately, this site will not work without javascript. Please enable javascript and then reload the page.</p>

					<div class='sb-footer'>

						<div class='copyright'>
							<p>&copy; 2013-2014 Studybash</p>
						</div>

					</div> <!-- sb-footer -->

				</div>

			</noscript>

		</div> <!-- /content -->

		<div class='imagePreload'>
			<img src='<?php echo $jsRoot;?>_lib/colorbox/css/images/border.png'>
			<img src='<?php echo $jsRoot;?>_lib/colorbox/css/images/controls.png'>
			<img src='<?php echo $jsRoot;?>_lib/colorbox/css/images/loading.gif'>
			<img src='<?php echo $jsRoot;?>_lib/colorbox/css/images/loading_background.png'>
			<img src='<?php echo $jsRoot;?>_lib/colorbox/css/images/overlay.png'>
		</div>

	</div> <!-- /container -->

	<!-- Templates
	============================= -->	

	<!-- SECTION-PAGE-BROWSERFAIL -->

	<script type="text/template" id="tpl-section-page-browserfail">

		<div class="header-welcome">
			
			<div class='site-name'>
				<h1>studybash</h1>
				<h2>flashcards for everyone!</h2>				
			</div>

		</div>

		<div class='page-content container'>
			
			<img src='<%= ROOT %>img/rage_features.jpg' alt='Y U NO UPDATE BROWSER?' class='img-thumbnail'>			
			<p>Unfortunately, this site requires that you have a relatively up-to-date browser (i.e., only a few years old). We recommend <a href="http://www.mozilla.org/en-US/firefox/">Firefox</a> or <a href="https://www.google.com/intl/en/chrome/browser/">Chrome</a>. They're both free!</p>

			<div class='sb-footer'>

				<div class='copyright'>
					<p>&copy; 2013-2014 Studybash</p>
				</div>

			</div> <!-- sb-footer -->

		</div>		

	</script>

	<!-- Javascript
	============================= -->

	<script>
		// before we start to load all of our JS files (including jQuery), update the DOM
		// with a basic loading message, through plain ol' javascript
		document.getElementById("content-loading").innerHTML = "Loading, please wait...";
	</script>

	<!-- dependencies (ordered) -->

	<!--[if lt IE 9]>
		<script src="<?php echo $jsRoot;?>_lib/jquery/jquery-1.10.1.min.js"></script>
		<script src="<?php echo $jsRoot;?>_plugins/browser_support/jquery.ie_conditional_failed.min.js"></script>
	<![endif]-->
	<!--[if gte IE 9]><!-->
		<script src="<?php echo $jsRoot;?>_lib/jquery/jquery-2.0.2.min.js"></script>
	<!--<![endif]-->

	<script src='<?php echo $jsRoot;?>_lib/underscore/underscore.min.js'></script>
	<script src='<?php echo $jsRoot;?>_lib/backbone/backbone.min.js'></script>
	<script src='<?php echo $jsRoot;?>_lib/bootstrap/js/bootstrap.min.js'></script>	
	<script src='<?php echo $jsRoot;?>_lib/select2/js/select2.min.js'></script>
	<script src='<?php echo $jsRoot;?>_lib/colorbox/js/jquery.colorbox.min.js'></script>
	<script src='<?php echo $jsRoot;?>_lib/pagedown/Markdown.Converter.min.js'></script>
	<script src='<?php echo $jsRoot;?>_lib/pagedown/Markdown.Sanitizer.min.js'></script>
	<script src='<?php echo $jsRoot;?>_lib/stacktrace/stacktrace.min.js'></script>
	<script src='<?php echo $jsRoot;?>_lib/timer/jquery.timer.min.js'></script>
	<script src='<?php echo $jsRoot;?>_lib/waitforimages/jquery.waitforimages.min.js'></script>

	<script src='<?php echo $jsRoot;?>_plugins/jquery.types/jquery.types.js'></script>
	<script src='<?php echo $jsRoot;?>_plugins/jquery.includejs/jquery.includejs.js'></script>	
	<script src='<?php echo $jsRoot;?>_plugins/browser_support/jquery.browser_support.js'></script>
	<script src='<?php echo $jsRoot;?>_plugins/jquery.storage/jquery.storage.js'></script>
	<script src='<?php echo $jsRoot;?>_plugins/serialize_object/jquery.serialize_object.js'></script>	
	<script src='<?php echo $jsRoot;?>_plugins/jquery.traced_error/jquery.traced_error.js'></script>
	<script src='<?php echo $jsRoot;?>_plugins/leftovers/jquery.leftovers.js'></script>

	<script src='<?php echo $jsRoot;?>_plugins/colorbox.spinner/colorbox.spinner.min.js'></script>
	<script src='<?php echo $jsRoot;?>_plugins/colorbox.dialog/colorbox.dialog.min.js'></script>
	<script src='<?php echo $jsRoot;?>_plugins/bootstrap.dialog/bootstrap.dialog.min.js'></script>
	<script src='<?php echo $jsRoot;?>_plugins/bootstrap.systemMsgs/bootstrap.systemMsgs.min.js'></script>
	<script src='<?php echo $jsRoot;?>_plugins/wselect2/wrapper.select2.min.js'></script>	
	
	<!-- application -->

	<script src='<?php echo $jsRoot;?>_inc/js/studybash.base.js'></script>
	<script src='<?php echo $jsRoot;?>_inc/js/studybash.main.js'></script>
	
	<script>
		$(function(){

			$("#content").html("");
			$("#content").removeClass("container");

			app.init({
				JS_ROOT : "<?php echo $jsRoot;?>",
				DOMAIN_ROOT : "<?php echo $domainRoot;?>",
				user : <?php echo json_encode($userRecord); ?>
			});

		});
	</script>

</body>

</html>