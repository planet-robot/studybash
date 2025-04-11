<?php
ini_set('error_log', $_SERVER['DOCUMENT_ROOT'] . '/error_log2.txt');	

//---------------------------------------------------------------------------------------
// File: account.php
// Description: This receives all of the AJAX calls that do not go through Backbone
//				that relate to accounts - i.e., login, register, verify, etc.
//				It will receive POST requests only. However, those
//				requests are made in the same fashion as Backbone, with the format of:
//				manual.php/SECTION/SUB-SECTION
// Dependencies: Bootstrap, Db, Error, Leftovers, Quit
//---------------------------------------------------------------------------------------

// all of the settings we get from db

$userStatusBlocked = null;
$userStatusWaiting = null;
$userStatusVerified = null;
$userStatusAdmin = null;
$maxUsers = null;

// the LIU (if there is one).
$LIU = null;

///////////////////////////////////////////////////////////////////////////////
// A captcha value must be matched. We are sent the captcha entered on the client
// and will test against our value in the session.
//
// @return - nothing. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function checkCaptcha($clientCaptcha) {

	if ( !Session::get_instance()->continue_session() ) {
		throw new Exception("No Session.");
	}
	
    $serverCaptcha = Leftovers::_safeval($_SESSION,"captcha");
    if ( empty($serverCaptcha) ) {
    	throw new Exception("No server captcha to test.");
    }

    if ( $clientCaptcha !== $serverCaptcha ) {
    	throw new ServerClientException(
    		"Validation failed (captcha): Entered [".$clientCaptcha."] Expected [".$serverCaptcha."]",
    		createParsedErrorString("captcha",null)
    	);
    }
}

///////////////////////////////////////////////////////////////////////////////
// We are sending the verification code to the user.
//
//	@attrs - user attributes
//	@isReset - are we resetting the password?
//	@return - nothing. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function emailCodeTouser($attrs,$isReset) {

	error_log("Verification Code: ");
	error_log($attrs['verification_code']);

	return;

	//fixme
	/*
	$tail = $isReset ? "Visit https://studybash.com/#setpwd/ to set your new password." : "Visit https://studybash.com/#verify/ to verify your account.";

	sendEmail(
		$attrs['email'],
		$attrs['full_name'],
		"help@studybash.com",
		"Studybash",
		"Verification Code",
		"Hi " . $attrs['first_name'] . ",\n\nHere is your verification code: " . $attrs['verification_code'] . "\n\n" . $tail . "\n\nCheers,\nStudybash.com"
	);
	*/
}

///////////////////////////////////////////////////////////////////////////////
// A user is trying to login. Validate the data they sent (for types, not content).
//
//	@attrs - an associative array which contains the keys we need for verification
//	@return - updated attributes on success. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function validateLoginData($attrs) {

	// grab the information that we'll need
	$email = array_key_exists("email",$attrs) ? $attrs['email'] : null;
	$password = array_key_exists("password",$attrs) ? $attrs['password'] : null;
	$keep_loggedin = array_key_exists("keep",$attrs) ? $attrs['keep'] : null;

	if ( empty($email) || empty($password) || ( $keep_loggedin === null ) ) {
		throw new Exception("Validation failed. Attrs: ".print_r($attrs,true));
	}
	
	return $attrs;
}

///////////////////////////////////////////////////////////////////////////////
// Based upon an email address, get the institution ID that matches the
// email's suffix.
//
//	@return - int on success, NULL on failure.
///////////////////////////////////////////////////////////////////////////////

function getInstitutionID($email) {
	
    // verify that its suffix is in our institution list. to do this, we have to
    // query the db. we'll grab all of the institutions that are supported, so we can
    // tell the user about them if it fails.

    $email = explode("@",$email);
    if ( count($email) !== 2 ) {
    	return null;
    }
    $emailSuffix = $email[1];

    $query = "SELECT * FROM sb_institutions WHERE email_suffix = ?;";
    $result = Db::get_instance()->prepared_query($query,array($emailSuffix));

    if ( !$result->num_rows ) {
    	return null;
    }

    return $result->rows[0]->id;
}

///////////////////////////////////////////////////////////////////////////////
// A user is trying to register. We will validate all of the information that
// was sent, including their email institution and captcha. We add their institution_id
// to the record, as well as combining their first and last names into `full_name`.
//
// @return - updated attributes on success. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function validateRegisterData($attrs) {

	// (1) first names

	$first_name = Leftovers::_safeval($attrs,"first_name");
	$attrs['first_name'] = gettype($first_name) !== "string" ? "" : trim($first_name);

    $pattern = "/^[- A-Za-z']{2,32}$/";
	if ( preg_match($pattern,$attrs['first_name']) !== 1 ) {
		throw new Exception("Validation failed (first_name). Attrs: ".print_r($attrs,true));
	}

	// (2) last name

	$last_name = Leftovers::_safeval($attrs,"last_name");
	$attrs['last_name'] = gettype($last_name) !== "string" ? "" : trim($last_name);

	$pattern = "/^[- A-Za-z']{2,32}$/";
	if ( preg_match($pattern,$attrs['last_name']) !== 1 ) {
		throw new Exception("Validation failed (last_name). Attrs: ".print_r($attrs,true));
	}

	// (2.5) combine into full_name
	$attrs['full_name'] = $attrs['first_name'] . " " . $attrs['last_name'];

	// (3) email
	
	$email = Leftovers::_safeval($attrs,"email");
	$attrs['email'] = gettype($email) !== "string" ? "" : trim($email);
	
    $email = filter_var($attrs['email'],FILTER_VALIDATE_EMAIL); // naive
    if ( !$email ) {
    	throw new Exception("Validation failed (email). Attrs: ".print_r($attrs,true));
    }

    // verify that its suffix is in our institution list. to do this, we have to
    // query the db. we'll grab all of the institutions that are supported, so we can
    // tell the user about them if it fails.

    $institution_id = getInstitutionID($email);

    if ( $institution_id !== null ) {
    	$attrs['institution_id'] = $institution_id;
    }
    else {

    	$query = "SELECT * FROM sb_institutions ORDER BY name;";
    	$result = Db::get_instance()->prepared_query($query,array());

    	if ( !$result->num_rows ) {
    		throw new Exception("No institutions found");
    	}

	    $instituteStr = "";
	    foreach ( $result->rows as $institute ) {
	    	if ( strlen($instituteStr) ) {
	    		$instituteStr .= ", ";
	    	}
	    	$instituteStr .= $institute->name;
	    }    

	    throw new ServerClientException(
    		"Validation failed (institution). Attrs: ".print_r($attrs,true),
    		createParsedErrorString("institution",$instituteStr)
    	);
    }

    // (4) captcha. 

    $clientCaptcha = Leftovers::_safeval($attrs,"captcha");
    if ( empty($clientCaptcha) ) {
    	throw new Exception("Validation failed (captcha). Attrs: ".print_r($attrs,true));
    }

    checkCaptcha($clientCaptcha);

    // done.
    return $attrs;
}

///////////////////////////////////////////////////////////////////////////////
// A user is trying to verify themselves. Ensure that the information needed
// is present. On success, the attributes will have been altered so that the
// password is a single field and is encrypted.
//
//	@return - attributes on success. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function validateVerifyData($attrs) {

    $password1 = Leftovers::_safeval($attrs,"password1");
	$password1 = gettype($password1) !== "string" ? "" : trim($password1);		

	$password2 = Leftovers::_safeval($attrs,"password2");
	$password2 = gettype($password2) !== "string" ? "" : trim($password2);	

    // (1) password

    if ( ( strlen($password1) < 6 ) || ( strlen($password1) > 32 ) ) {
    	throw new Exception("Validation failed (password:length). Attrs: ".print_r($attrs,true));
    }

    if ( $password1 != $password2 ) {
    	throw new Exception("Validation failed (password:match). Attrs: ".print_r($attrs,true));
    }

    $encrypted_pwd = sha1("a1!" . $password1 . "z0)");
	$attrs['password'] = $encrypted_pwd;
	unset($attrs['password1']);
	unset($attrs['password2']);

	$code = Leftovers::_safeval($attrs,"code");
	$attrs['code'] = gettype($code) !== "string" ? "" : trim($code);

	// (2) verification code: nothing to check at this point.
	return $attrs;
}

///////////////////////////////////////////////////////////////////////////////
// A user is trying to reset their password. Verify that they sent the data we require.
//
//	@return - nothing. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function validateResetData($attrs) {

	// grab the information that we'll need
	$email = array_key_exists("email",$attrs) ? $attrs['email'] : null;
	$captcha = array_key_exists("captcha",$attrs) ? $attrs['captcha'] : null;

	if ( empty($email) || empty($captcha) ) {
		throw new Exception("Validation failed. Attrs: ".print_r($attrs,true));
	}

	checkCaptcha($captcha);

	return $attrs;
}

///////////////////////////////////////////////////////////////////////////////
// Based upon the attributes sent, let's see if there is a user that matches
// the email/pwd combo. If so, we return the user record. They must also have
// the appropriate status level.
//
//	@return - An object representing the user on success. exception on failure.
//
///////////////////////////////////////////////////////////////////////////////

function getUserRecordFromLogin($attrs) {

	global $userStatusBlocked;
	global $userStatusWaiting;
	global $userStatusVerified;
	global $userStatusAdmin;

	$db = Db::get_instance();
	$encrypted_pwd = sha1("a1!" . $attrs['password'] . "z0)");

	// in order to see if the user info is valid, we have to first figure out what institution they are from, so we know
	// what table to query. if we can't get an institution, we know that the username is invalid.

	$institution_id = getInstitutionID($attrs['email']);

	if ( $institution_id === null ) {
		throw new ServerClientException(
			"Failed password on login. \nAttrs: ".print_r($attrs,true),
			createParsedErrorString("register",null)
		);
	}

	$tableName = "sb_" . Db::get_instance()->escape($institution_id) . "_users";
	
	$query = "SELECT id, email, full_name, first_name, last_name, last_system_msg_read, institution_id, status, reputation, num_logins, last_login, password = ? AS correct_pwd FROM ".$tableName." WHERE email = ?;";
	$result = $db->prepared_query($query,array($encrypted_pwd,$attrs['email']));

	if ( $result->num_rows == 1 ) {

		$userRecord = clone $result->rows[0];

		// waiting to verify?
		if ( $userRecord->status === $userStatusWaiting ) {
			throw new ServerClientException(
				"Un-verified user tried to login. \nAttrs: ".print_r($attrs,true),
				createParsedErrorString("verify",null)
			);
		}

		// blocked?
		else if ( $userRecord->status === $userStatusBlocked ) {
			throw new Exception("Blocked user trying to login. \nAttrs: ".print_r($attrs,true));
		}

		// ensure the password is correct
		else if ( !$userRecord->correct_pwd ) {
			throw new ServerClientException(
				"Failed password on login. \nAttrs: ".print_r($attrs,true),
				createParsedErrorString("register",null)
			);
		}

		// okay.
		else {
			unset($userRecord->correct_pwd);
			return $userRecord;
		}
	}

	// we've got a problem.
	else if ( $result->num_rows > 1 ) {
		throw new Exception("Returned multiple users (".$result->num_rows.") on login. Attrs: ".print_r($attrs,true));
	}

	// no match found.
	else {
		throw new ServerClientException(
			"Unknown user trying to login. \nAttrs: ".print_r($attrs,true),
			createParsedErrorString("register",null)
		);
	}
}

///////////////////////////////////////////////////////////////////////////////
// Logs a user in (i.e., establish the session). Return value has updated values for
// num_logins.
//
//	@userRecord - an object containing the properties of the user's db entry
//	@return: updated attributes on success. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function loginUser($userRecord) {

	// we want the userRecord we send to the client to have the updated number of
	// logins, but we want to be able to tell them the PREVIOUS time they logged in
	// (security check), so don't update the record with that info... just the db.
	// of course, if this is their first login, then none of this applies.

	$userRecord->num_logins += 1;	
	$last_login = date("Y-m-d H:i:s");
	if ( $userRecord->num_logins === 1 ) {
		$userRecord->last_login = $last_login;
	}

	$db = Db::get_instance();	
	$query = "UPDATE ".makeTableName("users",$userRecord->institution_id)." SET logged_in = 1, last_login = ?, num_logins = ? WHERE id = ?;";
	$result = $db->prepared_query($query,array($last_login,$userRecord->num_logins,$userRecord->id));

	if ( $result->affected_rows !== 1 ) {
		throw new Exception("Failed to update user upon logging in. rec: ".print_r($userRecord,true));
	}

	// destroy any existing session and then create a new one
	Session::get_instance()->destroy_session();
	Session::get_instance()->create_session($userRecord->keep_loggedin*(60*60*24*30));	

	// the user has been successfully logged in. let's create a session
	// token for them right now. this will be used to verify that all
	// the information sent to AJAX calls is actually *from* the user.

	SessionToken::set_user_id($userRecord->id);
	$userRecord->token = SessionToken::get_instance()->create_new_token($userRecord->keep_loggedin*(60*60*24*30));

	// add all of the user information into the session.
	$_SESSION['user'] = clone $userRecord;

	return $userRecord;
}

///////////////////////////////////////////////////////////////////////////////
// This adds a new user record, based upon the values sent. Validation was
// already performed. We return an updated attributes hash with id and
// verification_code.
//
//	@return - updated attributes on success. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function registerUser($attrs) {

	global $maxUsers;
	$iid = $attrs['institution_id'];

	// We have been sent a new user record. Before adding it we have
	// to ensure that it doesn't already exist. If so, we throw an
	// exception.

	$db = Db::get_instance();
	$db->begin_transaction();

	try {

		// lock the tables that we're going to be working with (no choice here, if we work with a table when under lockdown, we have to lock it ourselves). this will freeze any
	    // users on other connections that are trying to use any of the tables. the reason we do this here is that we want to ensure nobody else is trying to register while
	    // we're checking if there's room for this user on the site.

	    $query = "LOCK TABLES ".makeTableName("users",$iid)." WRITE, sb_institutions READ;";
	    $result = $db->query($query); // this returns 0 affected rows on success

		// first we have to double check that we have room for this user.

		$query = "SELECT count(id) AS num_users FROM ".makeTableName("users",$iid).";";
		$result = $db->prepared_query($query,array());

		if ( $result->rows[0]->num_users >= $maxUsers ) {
			throw new ServerClientException(
				"User tried to register when we were full. \nMax: ".$maxUsers."\nUser: ".print_r($attrs,true),
				createParsedErrorString("full",null)
			);
		}

		// try to add the user.

		$verification_code = Leftovers::generate_random_string(16);

		$query =	"INSERT IGNORE INTO ".makeTableName("users",$iid)." (institution_id, email, first_name, last_name, full_name, verification_code) \n";
		$query .= 	"SELECT sb_institutions.id, ?, ?, ?, ?, ? FROM sb_institutions WHERE sb_institutions.id = ?;";
		$result = $db->prepared_query($query,array($attrs['email'],$attrs['first_name'],$attrs['last_name'],$attrs['full_name'],$verification_code,$attrs['institution_id']));

		if ( $result->affected_rows !== 1 ) {			
			throw new ServerClientException(
				"Failed to add user: ".print_r($attrs,true),
				createParsedErrorString("login",null)
			);
		}

		$attrs['id'] = $result->insert_id;
		$attrs['verification_code'] = $verification_code;

		$db->commit();

		$query = "UNLOCK TABLES;";
        try { $result = $db->query($query); } // returns 0 rows on success
        catch ( Exception $e2 ) {}

		$db->end_transaction();

		return $attrs;
	}
	catch ( Exception $e ) {
		
		$db->rollback(); // no effect if nothing to rollback

		$query = "UNLOCK TABLES;";
        try { $result = $db->query($query); } // no effect if nothing to unlock
        catch ( Exception $e2 ) {}

		try { $db->end_transaction(); }
		catch ( Exception $e2 ) {}

		throw $e;
	}
}

///////////////////////////////////////////////////////////////////////////////
// This verifies a user, based upon the verification code sent. On success,
// we will add the `id` and `status` fields to the attributes associative array.
//
//	@return - updated attributes on success. exception on error.
///////////////////////////////////////////////////////////////////////////////

function verifyUser($attrs) {

	global $userStatusWaiting;
	global $userStatusVerified;
	$iid = getInstitutionID($attrs['email']);

	$query = "SELECT id, status FROM ".makeTableName("users",$iid)." WHERE email = ? AND verification_code = ?;";
	$result = Db::get_instance()->prepared_query($query,array($attrs['email'],$attrs['code']));

	if ( !$result->num_rows ) {
		throw new ServerClientException(
			"Failed to verify user. \nAttrs: ".print_r($attrs,true),
			createParsedErrorString("register",null)
		);
	}

	else if ( $result->num_rows > 1 ) {
		throw new Exception("Multiple users returned on verification. Attrs: ".print_r($attrs,true));		
	}

	if ( $result->rows[0]->status !== $userStatusWaiting ) {
		throw new ServerClientException(
			"Non-waiting user trying to re-verify. \nAttrs: ".print_r($attrs,true),
			createParsedErrorString("login",null)
		);
	}

	$attrs['id'] = $result->rows[0]->id;
	$attrs['status'] = $userStatusVerified;

	// update the actual db, as we've now been verified.

	$query =	"UPDATE ".makeTableName("users",$iid)." SET password = ?, status = ? \n";
	$query .=	"WHERE id = ?;";
	$result = Db::get_instance()->prepared_query($query,array($attrs['password'],$attrs['status'],$attrs['id']));

	if ( $result->affected_rows !== 1 ) {
		throw new Exception("Failed to update status/password of user: ".print_r($attrs,true));
	}

	return $attrs;
}

///////////////////////////////////////////////////////////////////////////////
// This resets a user, based upon the email sent. On success, we will add
// the `id`, `full_name`, and `verification_code` fields in the attributes 
// associative array.
//
//	@return - updated attributes on success. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function resetUser($attrs) {

	global $userStatusWaiting;
	$iid = getInstitutionID($attrs['email']);

	$query = "SELECT id, full_name, first_name, last_name FROM ".makeTableName("users",$iid)." WHERE email = ?;";
	$result = Db::get_instance()->prepared_query($query,array($attrs['email']));

	if ( $result->num_rows > 1 ) {
		throw new Exception("Multiple users returned on reset attempt. \nAttrs: ".print_r($attrs,true));
	}

	else if ( $result->num_rows !== 1 ) {
		throw new ServerClientException(
			"Unrecognized email trying to reset. Attrs: ".print_r($attrs,true),
			createParsedErrorString("register",null)
		);
	}

	$attrs['id'] = $result->rows[0]->id;
	$attrs['full_name'] = $result->rows[0]->full_name;
	$attrs['first_name'] = $result->rows[0]->first_name;
	$attrs['last_name'] = $result->rows[0]->last_name;
	$attrs['status'] = $userStatusWaiting;
	$attrs['verification_code'] = Leftovers::generate_random_string(16);

	$query =	"UPDATE ".makeTableName("users",$iid)." SET verification_code = ?, status = ? \n";
	$query .=	"WHERE id = ?;";
	$result = Db::get_instance()->prepared_query($query,array($attrs['verification_code'],$attrs['status'],$attrs['id']));

	if ( $result->affected_rows !== 1 ) {
		throw new Exception("Failed to update code/status user. \nAttrs: ".print_r($attrs,true));
	}

	return $attrs;
}

///////////////////////////////////////////////////////////////////////////////
// Logs out the current user. This updates their record in the db briefly.
//
//	@return - nothing. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function logoutUser() {

	global $LIU;

	try {

		// try to grab the user's information from the session. There
		// could be many reasons that this fails (e.g., user already
		// logged out on another machine). Whether or not it fails,
		// we want to ensure that the session is destroyed, so we put
		// that in this block and the `catch` block (`finally` is only
		// in PHP 5.5+). if the `logged_in` value doesn't get set to 0
		// it's not the end of the world, as their session will be destroyed
		// and so they'll have to re-login.
		
		$LIU = verifySessionAndUserStatus();

		$query = "UPDATE ".makeTableName("users")." SET logged_in = 0 WHERE id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($LIU->id));

		if ( $result->affected_rows !== 1 ) {
			throw new Exception("Failed to update user upon logging out. \nUser: ".print_r($LIU,true));
		}

		Session::get_instance()->destroy_session();
		SessionToken::set_user_id($LIU->id);
		SessionToken::get_instance()->remove_token();
	}
	catch ( Exception $e ) {
		Session::get_instance()->destroy_session();
		throw $e;
	}
}

///////////////////////////////////////////////////////////////////////////////
// main()
///////////////////////////////////////////////////////////////////////////////

date_default_timezone_set('America/Los_Angeles');
require_once( $_SERVER['DOCUMENT_ROOT'] . "/require.php" );	
require_once( get_bootstrap_path() . "/bootstrap.php" );
if ( !Bootstrap::init("studybash") ) {
	die("Bootstrap failure.");
}

require_once( Bootstrap::get_php_root() . "ajax/general.inc.php" );

try {

	setupTableNames();

	$userStatusBlocked = (int)DbSettings::get_instance()->get_setting("user_status_blocked");
	$userStatusWaiting = (int)DbSettings::get_instance()->get_setting("user_status_not_verified");
	$userStatusVerified = (int)DbSettings::get_instance()->get_setting("user_status_normal");
	$userStatusAdmin = (int)DbSettings::get_instance()->get_setting("user_status_admin");
	$maxUsers = (int)DbSettings::get_instance()->get_setting("max_users");

	// note: to deal with server.php/123/456 calls, look here:
	// http://stackoverflow.com/questions/18618784/url-of-server-php-123-still-received-by-server-php

	$request_method = $_SERVER['REQUEST_METHOD'];
	$rdata = Leftovers::get_RESTful_data();
	$parms = Leftovers::explode_path_info();
	$num_parms = count($parms);

	// if the site is locked, we do not process anything.

	$isLocked = DbSettings::get_instance()->get_setting("site_locked");
	if ( !empty($isLocked) ) {
		throw new ServerClientException("Activity during lockdown. Method: ".$request_method." Parms: ".print_r($parms,true)." Data: ".print_r($rdata,true),"Studybash is currently offline for maintenance. Please try again later");
	}

	if ( ( $request_method == "POST" ) && ( $num_parms ) ) {

		sleep(2);

		// SECTION: login
		//

		if ( $parms[0] === "login" ) {

			// pull out the user record, if it exists. then log them in.

			$rdata = validateLoginData($rdata);			
			$userRecord = getUserRecordFromLogin($rdata);
			$userRecord->keep_loggedin = $rdata['keep'];
			$LIU = loginUser($userRecord);

			Activity::add_to_db("login.user",print_r($userRecord,true),"low");
			Quit::get_instance()->json_exit($userRecord);
		}

		// SECTION: logout
		//
		//

		else if ( $parms[0] === "logout" ) {

			logoutUser();
			
			Activity::add_to_db("logout.user",print_r($rdata,true),"low");
			Quit::get_instance()->json_exit(null);
		}

		// SECTION: register
		//

		else if ( $parms[0] === "register" ) {
			
			$rdata = validateRegisterData($rdata);
			$rdata = registerUser($rdata);			
			emailCodeTouser($rdata,false);

			Activity::add_to_db("add.user",print_r($rdata,true),"high");
			Quit::get_instance()->json_exit(null);
		}

		// SECTION: verify
		//

		else if ( $parms[0] === "verify" ) {

			$rdata = validateVerifyData($rdata);
			$rdata = verifyUser($rdata);

			Activity::add_to_db("verify.user",print_r($rdata,true),"medium");
			Quit::get_instance()->json_exit(null);
		}

		// SECTION: reset
		//

		else if ( $parms[0] === "reset" ) {

			$rdata = validateResetData($rdata);
			$rdata = resetUser($rdata);
			emailCodeTouser($rdata,true);
			
			Activity::add_to_db("reset.user",print_r($rdata,true),"high");
			Quit::get_instance()->json_exit(null);
		}

		// INVALID SECTION

		else {
			throw new Exception("Unrecognized parameters. \nMethod: ".$request_method." \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		}
	}

	// INVALID SECTION

	else {
		throw new Exception("Unrecognized parameters. \nMethod: ".$request_method." \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
	}
}

catch ( Exception $e ) {
	ErrorStatic::from_user($e);
	if ( !is_a($e,"ServerClientException") ) {
		$e = "Timeout (high traffic volume)";
	}
	Quit::get_instance()->http_die($e);
}