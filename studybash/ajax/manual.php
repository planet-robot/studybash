<?php

//---------------------------------------------------------------------------------------
// File: manual.php
// Description: This receives all of the AJAX calls that do not go through Backbone and
//				do not belong to a large grouping of calls (i.e., the stragglers).
//				It will receive GET and POST requests. However, those
//				requests are made in the same fashion as Backbone, with the format of:
//				manual.php/SECTION/ for POST and GET
// Dependencies: Bootstrap, Db, DbSettings, ErrorStatic, Leftovers, Quit
//---------------------------------------------------------------------------------------

// the logged-in user (if there is one)
$LIU = null;

///////////////////////////////////////////////////////////////////////////////
// This returns an array of objects. Each object represents an institution.
// The fields we send back are simply the institution name, id, and email
// suffix (e.g., domain.com).
///////////////////////////////////////////////////////////////////////////////

function get_institutions() {

	$query = "SELECT id, name, email_suffix FROM sb_institutions ORDER BY name ASC;";
	$result = Db::get_instance()->prepared_query($query,array());

	if ( !$result->num_rows ) {
		throw new Exception("No institutions found");
	}

	return $result->rows;
}

///////////////////////////////////////////////////////////////////////////////
// Grabbing all of the system messages that have not been read by this user.
// We update the session userRecord object, as well as the db, if the info
// sent in `attrs` is more recent than the session.
//
//	@attrs - the user attributes sent from the client (not from session)
//	@userRecord - the userRecord object in the session [UPDATED]
//
//	@return - the number of messages returned.
///////////////////////////////////////////////////////////////////////////////

function getMessages($attrs,&$userRecord) {

	$attrs['last_system_msg_read'] = (int)$attrs['last_system_msg_read'];

	// if the client has seen a message that hasn't been recorded in the
	// session data yet (i.e., they are just providing verification of receipt now)
	// then we will update their rec in the db as well as the session obj.
	// Note: remember that just because we sent the client (e.g.,) an ID of 12 doesn't
	// mean they actually received it. so we wait for them to tell us the last ID they
	// received before we update their record in db/session.

	if ( $userRecord->last_system_msg_read < $attrs['last_system_msg_read'] ) {
	
		$query = "UPDATE ".makeTableName("users")." SET last_system_msg_read = ? WHERE id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($attrs['last_system_msg_read'],$attrs['id']));

		if ( $result->affected_rows != 1 ) {
			throw new Exception("Failed to update user `last_system_msg_read`. attrs: ".print_r($attrs,true)." session.user: ".print_r($userRecord,true));
		}

		$userRecord->last_system_msg_read = $attrs['last_system_msg_read'];
	}

	// grab all the messages that are newer than what they've already read.

	$query = "SELECT * FROM sb_system_msgs WHERE id > ? ORDER BY id DESC";
	$result = Db::get_instance()->prepared_query($query,array($attrs['last_system_msg_read']));

	return $result->rows;
}

///////////////////////////////////////////////////////////////////////////////
// Using the 'contact' form to send an email to the admin, from the help section.
//
//	@attrs - user attributes
//	@data - the form that was submitted
//	@return - nothing. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function sendHelpEmail($attrs,$data) {

	sendEmail(
		"hello@plasticthoughts.ca",
		"Plastic Thoughts",
		//$attrs->email,
		//fixme:
		Bootstrap::get_setting("email_contact_form_from"),
		$attrs->full_name . " [" . $attrs->id . "]",
		"Help Contact Form: " . $data['subject'],
		$data['message']
	);
}

///////////////////////////////////////////////////////////////////////////////
// We have been sent an error manually by our JS client. Let's try to add
// it to the db.
//
//	@data - dictionary containing the values we're interested in.
//	@return - boolean
///////////////////////////////////////////////////////////////////////////////

function receivedClientError($data) {
	
	if ( array_key_exists("message",$data) && array_key_exists("trace",$data) && ( gettype($data['trace']) === "array" ) ) {

		// modify the stacktrace component so it looks like it does from a PHP exception

		for ( $x=0; $x < count($data['trace']); $x++ ) {
			$traceLine = &$data['trace'][$x];
			$traceLine = "#".$x." ".$traceLine;
			unset($traceLine); // so can be re-used
		}

		$data['trace'] = implode("\n",$data['trace']);

		// add it to the database and then return
		// success.
		
		ErrorStatic::add_to_db($data);
		error_log( __METHOD__ . "(): Error received from javascript (" .$data['message'] . "). See db for trace." );
		return true;
	}

	// did not receive the fields we expected.
	else {
		return false;
	}
}

///////////////////////////////////////////////////////////////////////////////
// We have been sent some activity from the JS client. Let's try to add it
// to the db.
//
//	@data - has the fields that we need.
//	@return - boolean
///////////////////////////////////////////////////////////////////////////////

function receivedClientActivity($data) {

	if ( array_key_exists("activity_key",$data) && array_key_exists("activity_value",$data) && array_key_exists("interest_level",$data) ) {
		Activity::add_to_db($data['activity_key'],$data['activity_value'],$data['interest_level']);
		return true;
	}

	return false;
}

///////////////////////////////////////////////////////////////////////////////
// main()
///////////////////////////////////////////////////////////////////////////////

require_once( $_SERVER['DOCUMENT_ROOT'] . "/require.php" );	
require_once( get_bootstrap_path() . "/bootstrap.php" );
if ( !Bootstrap::init("studybash") ) {
	die("Bootstrap failure.");
}

require_once( Bootstrap::get_php_root() . "ajax/general.inc.php" );	

try {

	setupTableNames();
	ErrorStatic::set_max_records(300); // this could be abused by outsiders
	Activity::set_max_records(300);

	// note: to deal with server.php/123/456 calls, look here:
	// http://stackoverflow.com/questions/18618784/url-of-server-php-123-still-received-by-server-php

	$request_method = $_SERVER['REQUEST_METHOD'];
	$rdata = Leftovers::get_RESTful_data();
	$gdata = isset($_GET) ? $_GET : array();
	$parms = Leftovers::explode_path_info();
	$num_parms = count($parms);

	// if the site is locked, we do not process anything.

	$isLocked = DbSettings::get_instance()->get_setting("site_locked");
	if ( !empty($isLocked) ) {
		throw new ServerClientException("Activity during lockdown. Method: ".$request_method." Parms: ".print_r($parms,true)." RData: ".print_r($rdata,true)." GData: ".print_r($gdata,true),"Studybash is currently offline for maintenance. Please try again later");
	}

	if ( ( $request_method === "GET" ) && ( $num_parms ) ) {		

		// SECTION: data-LIU
		//
		// The site is being loaded up, for an LIU, and we require a number of settings and values that apply globaly - i.e., not institution-specific - as
		// we as information that is institution-specific.

		if ( $parms[0] === "data-LIU" ) {

			$LIU = verifySessionAndUserStatus();

			// (1) system messages interval

			$systemMessageInterval = (int)DbSettings::get_instance()->get_setting("system_message_interval");			

			// (2) all tags available to cards

			$query = "SELECT * FROM sb_tags ORDER BY tag_text ASC;";
			$result = Db::get_instance()->prepared_query($query,array());

			if ( !$result->num_rows ) {
				throw new Exception("No card tags found");
			}

			$cardTags = array();
			foreach ( $result->rows as $tagObj ) {
				$cardTags[] = $tagObj;
			}

			// (3) sharing types available to sets and tests

			$sharing_types = DbSettings::get_instance()->get_setting("enum_studying_sharing_types");
			$sharing_types = explode("|",$sharing_types);

			// (4) list of the institutions supported by the site.

			$institutions = get_institutions();

			// (5) The semesters available
		
			$query = "SELECT name, description FROM ".makeTableName("semesters")." ORDER BY order_id ASC";
			$result = Db::get_instance()->prepared_query($query,array());

			if ( !$result->num_rows ) {
				throw new Exception("No semesters found");
			}

			$semesters = $result->rows;

			// (6) The relative years available for enrollment.

			$classes_yearsBefore = (int)DbSettings::get_instance()->get_setting("classes_yearsBefore");
			$classes_yearsAfter = (int)DbSettings::get_instance()->get_setting("classes_yearsAfter");

			// All done. package it all up.

			$ret = null;
			
			$ret['store'] = new stdClass();
			$ret['store']->system_message_interval = $systemMessageInterval;
			$ret['store']->sharingTypes = $sharing_types;
			$ret['store']->cardTags = $cardTags;
			$ret['store']->institutions = $institutions;
			$ret['store']->semesters = $semesters;
			$ret['store']->classes_yearsBefore = $classes_yearsBefore;
			$ret['store']->classes_yearsAfter = $classes_yearsAfter;

			Quit::get_instance()->json_exit($ret);
		}

		// INVALID SECTION

		else {
			throw new Exception("Unrecognized parameters. \nMethod: ".$request_method." \nParms: ".print_r($parms,true)." \nRData: ".print_r($rdata,true)." \nGData: ".print_r($gdata,true));
		}
	}

	if ( ( $request_method == "POST" ) && ( $num_parms ) ) {

		// SECTION: help
		//
		// They are sending a message to the admin (through contact form).

		if ( $parms[0] === "help" ) {

			$LIU = verifySessionAndUserStatus();
			sendHelpEmail($LIU,$rdata);
			Activity::add_to_db("help.contact","User: ".print_r($LIU,true)."\nData: ".print_r($rdata,true),"very high");

			// All done. package it all up.

			Quit::get_instance()->json_exit(null);
		}

		// SECTION: error
		//
		// simply add the error to the db. our response
		// is ignored by the caller anyway, so we can
		// send back nothing.

		else if ( $parms[0] === "error" ) {

			if ( receivedClientError($rdata) ) {
				Quit::get_instance()->json_exit(null);
			}
			else {
				throw new Exception("Received manual error from JS, but data could not be parsed: ".print_r($rdata,true));
			}
		}

		// SECTION: activity
		//
		// simply add the activity to the db. our response
		// is ignored by the caller anyway, so we can
		// send back nothing.

		else if ( $parms[0] === "activity" ) {

			if ( receivedClientActivity($rdata) ) {
				Quit::get_instance()->json_exit(null);
			}
			else {
				throw new Exception("Received manual activity from JS, but data could not be parsed: ".print_r($rdata,true));
			}			
		}

		// SECTION: system
		//
		//	The user is asking for the latest system messages.

		else if ( $parms[0] === "system" ) {

			$LIU = verifySessionAndUserStatus();

			// (1) Grab the messages

			$msgs = getMessages($rdata,$LIU);

			// (2) figure out the highest ID present

			$highest_id = -1;
			foreach ( $msgs as $msg ) {
				if ( $msg->id > $highest_id ) {
					$highest_id = $msg->id;
				}
			}

			// All done. package it all up.

			$ret = null;
			$ret['msgs'] = $msgs;
			$ret['id'] = $highest_id;
			Quit::get_instance()->json_exit($ret);
		}

		// INVALID SECTION

		else {
			throw new Exception("Unrecognized parameters. \nMethod: ".$request_method." \nParms: ".print_r($parms,true)." \nRData: ".print_r($rdata,true)." \nGData: ".print_r($gdata,true));
		}
	}

	// INVALID SECTION

	else {
		throw new Exception("Unrecognized parameters. \nMethod: ".$request_method." \nParms: ".print_r($parms,true)." \nRData: ".print_r($rdata,true)." \nGData: ".print_r($gdata,true));
	}
}

catch ( Exception $e ) {
	ErrorStatic::from_user($e);
	if ( !is_a($e,"ServerClientException") ) {
		$e = "Timeout (high traffic volume)";
	}
	Quit::get_instance()->http_die($e);
}