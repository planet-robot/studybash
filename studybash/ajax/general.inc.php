<?php
require_once( $_SERVER['DOCUMENT_ROOT'] . "/require.php" );

//---------------------------------------------------------------------------------------
// Include: misc.inc.php
// Description: Standalone, miscellaneous functions that are required by multiple files.
// Dependencies: Session
//---------------------------------------------------------------------------------------

///////////////////////////////////////////////////////////////////////////////
// Several of our classes need to know what table name they should be using.
///////////////////////////////////////////////////////////////////////////////

function setupTableNames() {

	ErrorStatic::set_table_name("sb_debug_errors");
	Activity::set_table_name("sb_debug_activity");
	DbSettings::set_table_name("sb_settings");
	SessionToken::set_table_name("sb_1_session_tokens");
	UserStatus::set_table_name("sb_1_users");
}

///////////////////////////////////////////////////////////////////////////////
// Simply send an email, using PHPMailer. Notice that we DO NOT allow any
// HTML to go through.
///////////////////////////////////////////////////////////////////////////////

function sendEmail($to_email,$to_name,$from_email,$from_name,$subject,$body) {

	$to_email = htmlspecialchars($to_email);
	$to_name = htmlspecialchars($to_name);
	$from_email = htmlspecialchars($from_email);
	$from_name = htmlspecialchars($from_name);
	$subject = htmlspecialchars($subject);
	$body = htmlspecialchars($body);

	date_default_timezone_set('America/Los_Angeles');
	require_once( get_bootstrap_path() . "/_php_lib/external/phpmailer/class.phpmailer.php" );

	// setup the PHPMailer instance

	$mail = new PHPMailer;
    $mail->SMTPDebug = 0;//1;

	$mail->Host = Bootstrap::get_setting("email_host");
	$mail->Port = (int)Bootstrap::get_setting("email_port");

	// smtp
	if ( Bootstrap::get_setting("email_smtp") === "true" ) {
		
		$mail->SMTPAuth = true;
		$mail->Username = Bootstrap::get_setting("email_user");
		$mail->Password = Bootstrap::get_setting("email_password");
		$mail->SMTPSecure = Bootstrap::get_setting("email_smtp_secure");

		$mail->IsSMTP();
	}

	// regular PHP mail function
	else {		
		$mail->IsMail();
	}

	// add the information to the mail itself

	$mail->AddAddress($to_email,$to_name);
	$mail->From = $from_email;
	$mail->FromName = $from_name;
	$mail->Subject = $subject;
	$mail->Body = $body;

	// try to send the mail.

	if ( !$mail->Send() ) {
		throw new Exception($mail->ErrorInfo);
	}
}

///////////////////////////////////////////////////////////////////////////////
// Called when we need to be sure that the session and user is valid. The
// session token may not match what's been sent across to the server, and the
// user may not have valid status. We do two things here:
//
//	(1) Verify the session token. Protecting against XSRF attacks.
//	(2) Verify that the user's status allows them to be logged in.
//
// For some of the failures experienced here we will shutdown the session, if it
// exists.
//
//	@return - reference to $_SESSION['user']. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function verifySessionAndUserStatus() {

	// (1) grab all of the settings we require from the db.

	$userStatusProbation = (int)DbSettings::get_instance()->get_setting("user_status_probation");
	$userStatusAdmin = (int)DbSettings::get_instance()->get_setting("user_status_admin");

	// (2) we must have a session and user information in that session.

	if ( !Session::get_instance()->continue_session() ) {
		throw new ServerClientException("No Session.",createParsedErrorString("no_session",null));
	}

	if ( !array_Key_exists("user",$_SESSION) ) {
		Session::get_instance()->destroy_session();
		throw new ServerClientException("No `user` object in session",createParsedErrorString("no_session",null));
	}

	// grab the session information of the user
	$userRecord = $_SESSION['user'];

	// (3) 	update that information with the dynamic values from our db. since these can change
	// 		after the user has already been logged in.

	$query = "SELECT logged_in, status, reputation FROM ".makeTableName("users",$userRecord->institution_id)." WHERE id = ?;";
	$result = Db::get_instance()->prepared_query($query,array($userRecord->id));

	if ( $result->num_rows !== 1 ) {
		Session::get_instance()->destroy_session();
		throw new ServerClientException("Failed to retrieve status/reputation for logged-in user. \nUser: ".print_r($userRecord,true),createParsedErrorString("no_session",null));
	}

	if ( $result->rows[0]->logged_in !== 1 ) {
		Session::get_instance()->destroy_session();
		throw new ServerClientException("User is not logged in in db. \nUser: ".print_r($userRecord,true),createParsedErrorString("not_loggedin",null));
	}

	$userRecord->status = $result->rows[0]->status;
	$userRecord->reputation = $result->rows[0]->reputation;

	// (4) if the site is locked, we do not process anything, unless it's the admin.

	$isLocked = DbSettings::get_instance()->get_setting("site_locked");
	if ( ( !empty($isLocked) ) && ( $userRecord->status !== $userStatusAdmin ) ) {
		throw new ServerClientException("Activity during lockdown. User: ".print_r($userRecord,true),"Studybash is currently offline for maintenance. Please try again later");
	}

	// (5) 	check that the tokens (cookie and direct) sent from the client match what we have in db.
	//		if they do not, we will tell the user and alert ourselves to the activity.

	SessionToken::set_user_id($userRecord->id);
	try{
		SessionToken::get_instance()->verify_current_token();
	}
	catch ( Exception $e ) {
		Session::get_instance()->destroy_session();
		Activity::add_to_db("session.token.failure",$e->getMessage()." \nUser: ".print_r($userRecord,true),"high");
		throw new ServerClientException($e->getMessage()." \nUser: ".print_r($userRecord,true),createParsedErrorString("session_token",null));
	}

	// (6) check that their status is acceptable

	UserStatus::set_user_id($userRecord->id);
	$status = UserStatus::get_instance()->get_status();
	if ( $status < $userStatusProbation ) {
		Session::get_instance()->destroy_session();
		throw new Exception("User without proper status is trying to access the site: \nUser: ".print_r($userRecord,true));
	}

	return $userRecord;
}

///////////////////////////////////////////////////////////////////////////////
// We are creating a string of a particular format so that the calling javascript
// code can be sure that the jqXHR.responseText they received was from us, and
// not from PHP generally (e.g., some sort of runtime error). The idea is that
// this will be examined in $.ajax.fail, to see if the error was expected or
// not.
//
//	@return: A string of the following format:
//		userError:(TYPE)[MSG]
//
///////////////////////////////////////////////////////////////////////////////

function createParsedErrorString($type,$msg) {
	return "userError:(".$type.")[".$msg."]";
}

///////////////////////////////////////////////////////////////////////////////
// Based upon a table suffix and the the LIU's institution id, construct the full 
// (escaped) table name.
//
//	@suffix - e.g., "flashcards" -> "sb_1_flashcards" (for institution_id=1)
//	@institution_id - if we don't have a global $LIU, send this in.
///////////////////////////////////////////////////////////////////////////////

function makeTableName($suffix,$institution_id=null) {

	if ( $institution_id === null ) {

		global $LIU;

		if ( empty($LIU) ) {
			throw new Exception("No `LIU` value.");
		}

		$institution_id = $LIU->institution_id;
	}	

	return "sb_" . Db::get_instance()->escape($institution_id) . "_" . $suffix;
}