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

	// MVC creation

	$model = new Model();
	$controller = new Controller($model);
	$view = new View($model,$controller);

	// if there is a query string - i.e., params - send it to our controller.

	if ( count($_GET) ) {
		$controller->act_on_query($_GET);
	}

	// finally, render the View and we're done.

	$view->render();
}

catch ( Exception $e ) {
	Error::from_user($e);
	die("Timeout (high traffic volume)");
}