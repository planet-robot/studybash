<?php

///////////////////////////////////////////////////////////////////////////////
// Verify that the user is allowed to be here.
//
//	@return - nothing. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function verifySessionAndUserStatus($userStatusAdmin) {

	// we must have a session to do this.
	if ( !Session::get_instance()->continue_session() ) {
		throw new Exception("No Session.");
	}

	// grab the session information of the user
	$userRecord = clone $_SESSION['user'];

	// check that their status is acceptable

	UserStatus::set_table_name("sb_1_users");
	UserStatus::set_user_id($userRecord->id);
	$status = UserStatus::get_instance()->get_status();

	if ( $status !== $userStatusAdmin ) {
		throw new Exception("Non-admin trying to access `sysop` section. rec: ".print_r($userRecord,true));
	}
}

///////////////////////////////////////////////////////////////////////////////
// main()
///////////////////////////////////////////////////////////////////////////////

// initialize our bootstrap with the configuration file for our project.
date_default_timezone_set('America/Los_Angeles');
require_once( $_SERVER['DOCUMENT_ROOT'] . "/require.php" );	
require_once( get_bootstrap_path() . "/bootstrap.php" );
if ( !Bootstrap::init("studybash") ) {
	die("Bootstrap failure.");
}

try {	

	Error::set_table_name("sb_debug_errors");
	DbSettings::set_table_name("sb_settings");

	$userStatusAdmin = (int)DbSettings::get_instance()->get_setting("user_status_admin");
	verifySessionAndUserStatus($userStatusAdmin);

	// get number of users

	$numusers = 0;
	$query = "SELECT id FROM sb_1_users;";
	$result = Db::get_instance()->prepared_query($query,array());
	$numusers = $result->num_rows;

	// get number of flags

	$numflags = 0;
	
	$query = "SELECT id FROM sb_1_flagged_tests;";
	$result = Db::get_instance()->prepared_query($query,array());
	$numflags += $result->num_rows;

	$query = "SELECT id FROM sb_1_flagged_sets;";
	$result = Db::get_instance()->prepared_query($query,array());
	$numflags += $result->num_rows;

	$query = "SELECT id FROM sb_1_flagged_flashcards;";
	$result = Db::get_instance()->prepared_query($query,array());
	$numflags += $result->num_rows;

	// get number of errors

	$numerrors = 0;
	$query = "SELECT id FROM sb_debug_errors;";
	$result = Db::get_instance()->prepared_query($query,array());
	$numerrors += $result->num_rows;

	// get number of activity

	$numactivity = 0;
	$query = "SELECT id FROM sb_debug_activity;";
	$result = Db::get_instance()->prepared_query($query,array());
	$numactivity += $result->num_rows;


}

catch ( Exception $e ) {
	Error::from_user($e);
	die("Timeout (high traffic volume)");
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

</head>

<body>

	<div id='wrapper-body'>

		<div id='content' class='container'>

<?php

	echo "<ul>\n";
	echo "<li><a href='" . Bootstrap::get_setting('php_root') . "sysop/errors/'>Errors</a></li>";
	echo "<li><a href='" . Bootstrap::get_setting('php_root') . "sysop/activity/'>Activity</a></li>";
	echo "<li><a href='" . Bootstrap::get_setting('php_root') . "sysop/flags/'>Flags</a></li>";
	echo "<li><a href='" . Bootstrap::get_setting('php_root') . "sysop/report/'>Report</a></li>";
	echo "</ul>\n";

	echo "<h1>Users:</h1>\n";
	echo "<p>" . $numusers . "</p>";

	echo "<h1>Flags:</h1>\n";
	echo "<p>" . $numflags . "</p>";

	echo "<h1>Errors:</h1>\n";
	echo "<p>" . $numerrors . "</p>";

	echo "<h1>Activity:</h1>\n";
	echo "<p>" . $numactivity . "</p>";

?>

		</div> <!-- /content -->

	</div>

	<!-- Templates
	============================= -->	

	<!-- Javascript
	============================= -->

	<!-- dependencies (ordered) -->

	<script src="http://code.jquery.com/jquery-2.1.0.js"></script>
	<script src="http://underscorejs.org/underscore.js"></script>
	<script src="http://backbonejs.org/backbone.js"></script>
	
	<!-- application -->

	<script>
		$(function(){
		});
	</script>

</body>

</html>