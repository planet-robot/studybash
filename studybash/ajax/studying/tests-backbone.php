<?php

//---------------------------------------------------------------------------------------
// File: sets-backbone.php
// Description: All of the backbone calls relating to sets arrive here. This will only
//				be from the models themselves, never from the collection. The calls
//				we receive are: POST, PUT, DELETE
//---------------------------------------------------------------------------------------

$LIU = null; // the logged-in user.
$sharing_types = null; // the sharing categories of sets/tests

///////////////////////////////////////////////////////////////////////////////
// main()
///////////////////////////////////////////////////////////////////////////////

require_once( $_SERVER['DOCUMENT_ROOT'] . "/require.php" );	
require_once( get_bootstrap_path() . "/bootstrap.php" );
if ( !Bootstrap::init("studybash") ) {
	die("Bootstrap failure.");
}

require_once( Bootstrap::get_php_root() . "ajax/general.inc.php" );	
require_once( Bootstrap::get_php_root() . "ajax/studying/studying.inc.php" );
require_once( Bootstrap::get_php_root() . "ajax/studying/tests.inc.php" );

try {	

	// tell our helper classes what tables we're using, pull in the
	// data from the connection, and verify that the user belongs here.

	setupTableNames();
	$sharing_types = explode("|",DbSettings::get_instance()->get_setting("enum_studying_sharing_types"));

	$request_method = $_SERVER['REQUEST_METHOD'];
	$rdata = Leftovers::get_RESTful_data();
	$parms = Leftovers::explode_path_info();
	$num_parms = count($parms);

	$LIU = verifySessionAndUserStatus();

	// SECTION: POST
	//
	// We are creating a new test, which belongs to a particular enrollment (moduleID and userID combo).

	if ( ( $request_method === "POST" ) && ( $num_parms === 2 ) ) {

		$moduleID = (int)$parms[0];

		// this represents the user's sets/cards that the logged-in user was browsing. however, we aren't
		// going to verify that the logged-in user (LIU) has access to these sets, we're only going to
		// verify that the userID sent and the LIU id are both enrolled in the `moduleID` sent.
		$userID = (int)$parms[1];

		$testAttrs = validateTest($rdata);
		$testAttrs = zipFields($testAttrs);

		$query = 	"INSERT INTO ".makeTableName("tests")." (enrollment_id,test_name,description,sharing,setIDs,keywords,tags) \n";
		$query .=	"SELECT enroll.id, ?, ?, ?, ?, ?, ? FROM ".makeTableName("enrollment")." AS enroll \n";
		$query .=	"INNER JOIN ".makeTableName("enrollment")." AS ownerEnroll ON ownerEnroll.module_id = enroll.module_id AND ownerEnroll.user_id = ? \n";
		$query .=	"WHERE enroll.module_id = ? AND enroll.user_id = ?;";

		$result = Db::get_instance()->prepared_query(
			$query,
			array($testAttrs['test_name'],$testAttrs['description'],$testAttrs['sharing'],$testAttrs['setIDs'],$testAttrs['keywords'],$testAttrs['tags'],$userID,$moduleID,$LIU->id)
		);

		if ( $result->affected_rows !== 1 ) {
			throw new Exception("Failed to insert new test. Data: ".print_r($testAttrs,true)." User: ".print_r($LIU,true));
		}

		// the insertion has succeeded. let's setup its id (to send back). even though it won't be used (cuz done in "Flashcards" section, not "Tests" section).
		
		$testAttrs['id'] = $result->insert_id;
		
		// Done. send the completed record back to the client.
		
		Activity::add_to_db("add.test","User: ".print_r($LIU,true)."\nData: ".print_r($testAttrs,true),"low");
		Quit::get_instance()->json_exit($testAttrs);
	}

	// DELETE
	//
	// We are deleting a single test.

	else if ( ( $request_method === "DELETE" ) && ( $num_parms === 3 ) ) {

		$moduleID = (int)$parms[0];
		$userID = (int)$parms[1];
		$testID = (int)$parms[2];

		if ( $userID !== $LIU->id ) {
			throw new Exception("Mismatch between user_id on parm (".$userID.") and session (".print_r($LIU,true).")");
		}

		$query =	"DELETE tests FROM ".makeTableName("tests")." AS tests \n";
		$query .=	"INNER JOIN ".makeTableName("enrollment")." AS enroll ON enroll.id = tests.enrollment_id AND enroll.module_id = ? AND enroll.user_id = ? \n";
		$query .=	"WHERE tests.id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($moduleID,$userID,$testID));

		if ( $result->affected_rows !== 1 ) {
			throw new Exception("Failed to delete test. Parms: ".print_r($parms,true)." Result: ".print_r($result,true));
		}
			
		Activity::add_to_db("delete.test","User: ".print_r($LIU,true)."\nTestID: ".$testID,"low");
		Quit::get_instance()->json_exit(null);
	}

	// PUT
	//
	// Updating the values for a single test. Notice that this CANNOT be an auto_test, as they are updated through "sets" code.

	else if ( ( $request_method === "PUT" ) && ( $num_parms === 3 ) ) {

		$moduleID = (int)$parms[0];
		$userID = (int)$parms[1];
		$testID = (int)$parms[2];

		if ( $userID !== $LIU->id ) {
			throw new Exception("Mismatch between user_id on parm (".$userID.") and session (".print_r($LIU,true).")");
		}

		$testAttrs = validateTest($rdata);

		if ( $testID !== $testAttrs['id'] ) {
			throw new Exception("Mismatch on parms ID (".$testID.") and record: ".print_r($testAttrs,true));
		}

		$query = 	"UPDATE ".makeTableName("tests")." AS tests \n";				
		$query .= 	"INNER JOIN ".makeTableName("enrollment")." AS enroll ON enroll.id = tests.enrollment_id AND enroll.module_id = ? AND enroll.user_id = ? \n";
		$query .=	"SET tests.test_name = ?, tests.description = ?, tests.sharing = ? \n";
		$query .=	"WHERE tests.id = ?;";
		
		$result = Db::get_instance()->prepared_query($query,array($moduleID,$userID,$testAttrs['test_name'],$testAttrs['description'],$testAttrs['sharing'],$testAttrs['id']));

		if ( $result->affected_rows !== 1 ) {
			throw new Exception("Failed to update fc set. Rec: ".print_r($testAttrs,true));
		}
		
		Activity::add_to_db("update.test","User: ".print_r($LIU,true)."\nData: ".print_r($testAttrs,true),"low");
		Quit::get_instance()->json_exit(null);
	}

	// PATCH
	//
	// Flagging a test

	else if ( ( $request_method === "PATCH" ) && ( $num_parms === 3 ) ) {

		$moduleID = (int)$parms[0];
		$targetUserID = (int)$parms[1]; // whose test are we flagging?
		$testID = (int)$parms[2];

		// a user CANNOT flag their own stuff.
		if ( $targetUserID === $LIU->id ) {
			throw new Exception("User trying to flag their own content. \nUser: ".print_r($LIU,true));
		}

		$is_flagged = Leftovers::_safeval($rdata,"is_flagged");
		if ( $is_flagged !== true ) {
			throw new Exception("Unexpected value for `is_flagged`: ".print_r($is_flagged,true));
		}

		// now, we are only allowed to flag if certain conditions are met.

		if ( !canFlag($targetUserID) ) {
			throw new ServerClientException(
				"Trying to flag when they are unable to. \nUser: ".print_r($LIU,true)."\nTestID: ".$testID,
				createParsedErrorString("flag-reputation",null)
			);
		}
		else {

			// add to the 'flags' table. notice that we don't have to worry about doing INSERT-SELECT, as we are now using foreign keys.

			$query = 	"INSERT IGNORE INTO ".makeTableName("flagged_tests")." (test_id,flagged_by_id) VALUES (?,?);";
			$result = Db::get_instance()->prepared_query($query,array($testID,$LIU->id));

			if ( !$result->affected_rows ) {
				throw new ServerClientException(
					"Failed to flag a test. Duplicate? \nUser: ".print_r($LIU,true)."\nTestID: ".$testID,
					createParsedErrorString("flag-duplicate",null)
				);
			}

			Activity::add_to_db("flag.test","User: ".print_r($LIU,true)."\nTestID: ".$testID." \nTargetUserID: ".$targetUserID,"very high");
			Quit::get_instance()->json_exit(null);
		}
	}

	// INVALID parameters.

	else {
		throw new Exception("Unrecognized parameters. Method: ".$request_method." Parms: ".print_r($parms,true)." Data: ".print_r($rdata,true));
	}
}

catch ( Exception $e ) {

	ErrorStatic::from_user($e);
	if ( !is_a($e,"ServerClientException") ) {
		$e = "Timeout (high traffic volume)";
	}
	Quit::get_instance()->http_die($e);
}