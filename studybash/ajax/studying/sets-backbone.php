<?php

//---------------------------------------------------------------------------------------
// File: sets-backbone.php
// Description: All of the backbone calls relating to sets arrive here. This will only
//				be from the models themselves, never from the collection. The calls
//				we receive are: POST, PUT, PATCH, DELETE
//---------------------------------------------------------------------------------------

$LIU = null; // the logged-in user.
$sharing_types = null; // the sharing categories of fc sets

///////////////////////////////////////////////////////////////////////////////
// This validates a set before it can be added or updated into the db. Any
// problems trigger an exception, as everything should have been caught on
// the client.
//
//	@rec - the set attributes, submitted from client.
//	@return - a verified set record, with all string fields trimmed.
//
///////////////////////////////////////////////////////////////////////////////

function validateSet(&$rec) {

	global $sharing_types;

	// ensure all of the required values present (although perhaps not valid).

	$set_name = Leftovers::_safeval($rec,"set_name");
	$rec['set_name'] = gettype($set_name) !== "string" ? "" : trim($set_name);
	
	$description = Leftovers::_safeval($rec,"description");
	$rec['description'] = gettype($description) !== "string" ? null : ( !strlen($description) ? null : trim($description) );
	
	$sharing = Leftovers::_safeval($rec,"sharing");
	$rec['sharing'] = gettype($sharing) !== "string" ? "" : trim($sharing);
	
	$has_auto_test = Leftovers::_safeval($rec,"has_auto_test");
	$rec['has_auto_test'] = gettype($has_auto_test) !== "integer" ? -1 : (int)!!$has_auto_test;

	// (1) name

	$pattern = "/^[-!.,& A-z0-9'\"()\\[\\]]{1,32}$/";
	if ( preg_match($pattern,$rec['set_name']) !== 1 ) {
		throw new Exception("Validation failed (set_name). Rec: ".print_r($rec,true));
	}

	// (2) description

	if ( !empty($rec['description']) ) {
		
		$pattern = "/^[-!.,& A-z0-9'\"()\\[\\]]{1,64}$/";
		if ( preg_match($pattern,$rec['description']) !== 1 ) {
			throw new Exception("Validation failed (description). Rec: ".print_r($rec,true));
		}
	}

	// (3) sharing

	if ( !in_array($rec['sharing'],$sharing_types) ) {
		throw new Exception("Validation failed (sharing). Rec: ".print_r($rec,true));
	}

    // (4) has_auto_test

    if ( ( $rec['has_auto_test'] < 0 ) || ( $rec['has_auto_test'] > 1 ) ) {
    	throw new Exception("Validation failed (has_auto_test). Rec: ".print_r($rec,true));
    }
    
	// okay, we have succeeded. return the record
	return $rec;
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
require_once( Bootstrap::get_php_root() . "ajax/studying/studying.inc.php" );	

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
	// We are creating a new set, which belongs to a particular enrollment (moduleID and userID combo).

	if ( ( $request_method === "POST" ) && ( $num_parms === 2 ) ) {

		// the user must have a status above probation for this.
		$userStatusProbation = (int)DbSettings::get_instance()->get_setting("user_status_probation");
		if ( $LIU->status <= $userStatusProbation ) {
			throw new Exception("Probation user trying to create a set. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		}

		$moduleID = (int)$parms[0];
		$userID = (int)$parms[1];

		if ( $userID !== $LIU->id ) {
			throw new Exception("Mismatch between user_id on parm (".$userID.") and session (".print_r($LIU,true).")");
		}
		
		$setAttrs = validateSet($rdata);		

		$query = 	"INSERT INTO ".makeTableName("sets")." (enrollment_id,set_name,description,sharing,has_auto_test) \n";
		$query .=	"SELECT enroll.id, ?, ?, ?, ? FROM ".makeTableName("enrollment")." AS enroll WHERE enroll.module_id = ? AND enroll.user_id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($setAttrs['set_name'],$setAttrs['description'],$setAttrs['sharing'],$setAttrs['has_auto_test'],$moduleID,$LIU->id));

		if ( $result->affected_rows !== 1 ) {
			throw new Exception("Failed to insert new set. \nParms: ".print_r($parms,true)." \nData: ".print_r($setAttrs,true)." \nUser: ".print_r($LIU,true));
		}

		// the insertion has succeeded. let's setup its id (to send back) as well as its created_on field.
		
		$setAttrs['id'] = $result->insert_id;
		
		$query = "SELECT created_on FROM ".makeTableName("sets")." WHERE id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($setAttrs['id']));
		if ( $result->num_rows != 1 ) {
			throw new Exception("Retrieve failed on new set. Result: ".print_r($result,true)." Rec: ".print_r($setAttrs,true));
		}
		
		$setAttrs['created_on'] = $result->rows[0]->created_on;

		// Done. send the completed record back to the client.

		Activity::add_to_db("add.set","User: ".print_r($LIU,true)."\nData: ".print_r($setAttrs,true),"low");		
		Quit::get_instance()->json_exit($setAttrs);
	}

	// DELETE
	//
	// We are deleting a single set.

	else if ( ( $request_method === "DELETE" ) && ( $num_parms === 3 ) ) {

		$moduleID = (int)$parms[0];
		$userID = (int)$parms[1];
		$setID = (int)$parms[2];

		if ( $userID !== $LIU->id ) {
			throw new Exception("Mismatch between user_id on parm (".$userID.") and session (".print_r($LIU,true).")");
		}

		// we don't want only part of this to succeed.
		Db::get_instance()->begin_transaction();

		try {

			deleteSets(array(
				"setIDs"=>array($setID),
				"moduleID"=>$moduleID,
				"userID"=>$userID
			));

			Db::get_instance()->commit();
			Db::get_instance()->end_transaction();
			
			Activity::add_to_db("delete.set","User: ".print_r($LIU,true)."\nSetID: ".$setID,"low");		
			Quit::get_instance()->json_exit(null);
		}

		catch ( Exception $e ) {

			Db::get_instance()->rollback(); // no effect if nothing to rollback

			try { Db::get_instance()->end_transaction(); }
			catch ( Exception $e2 ) {}

			throw $e;
		}
	}

	// PUT
	//
	// Updating the values for a single set.

	else if ( ( $request_method === "PUT" ) && ( $num_parms === 3 ) ) {

		$moduleID = (int)$parms[0];
		$userID = (int)$parms[1];
		$setID = (int)$parms[2];

		if ( $userID !== $LIU->id ) {
			throw new Exception("Mismatch between user_id on parm (".$userID.") and session (".print_r($LIU,true).")");
		}

		$setAttrs = validateSet($rdata);		

		if ( $setID !== $setAttrs['id'] ) {
			throw new Exception("Mismatch on parms ID (".$setID.") and record: ".print_r($setAttrs,true));
		}

		$query = 	"UPDATE ".makeTableName("sets")." AS sets \n";				
		$query .= 	"INNER JOIN ".makeTableName("enrollment")." AS enroll ON enroll.id = sets.enrollment_id AND enroll.module_id = ? AND enroll.user_id = ? \n";
		$query .=	"SET sets.set_name = ?, sets.description = ?, sets.sharing = ?, sets.has_auto_test = ? \n";
		$query .=	"WHERE sets.id = ?;";
		
		$result = Db::get_instance()->prepared_query($query,array($moduleID,$LIU->id,$setAttrs['set_name'],$setAttrs['description'],$setAttrs['sharing'],$setAttrs['has_auto_test'],$setID));

		if ( $result->affected_rows !== 1 ) {
			throw new Exception("Failed to update set. \nParms: ".print_r($parms,true)." \nRec: ".print_r($setAttrs,true));
		}
		
		Activity::add_to_db("update.set","User: ".print_r($LIU,true)."\nData: ".print_r($setAttrs,true),"low");		
		Quit::get_instance()->json_exit(null);
	}

	// PATCH
	//
	// Flagging a set

	else if ( ( $request_method === "PATCH" ) && ( $num_parms === 3 ) ) {

		$moduleID = (int)$parms[0];
		$userID = (int)$parms[1]; // whose content are we flagging?
		$setID = (int)$parms[2];

		// a user CANNOT flag their own stuff.
		if ( $userID === $LIU->id ) {
			throw new Exception("User trying to flag their own set. \nUser: ".print_r($LIU,true) . "\nSetID: ".$setID);
		}

		$is_flagged = Leftovers::_safeval($rdata,"is_flagged");
		if ( $is_flagged !== true ) {
			throw new Exception("Unexpected value for `is_flagged`: ".print_r($is_flagged,true));
		}

		// now, we are only allowed to flag if certain conditions are met.

		if ( !canFlag($userID) ) {
			throw new ServerClientException(
				"Trying to flag when they are unable to. \nUser: ".print_r($LIU,true)."\nSetID: ".$setID,
				createParsedErrorString("flag-reputation",null)
			);
		}
		else {

			// add to the 'flags' table. notice that we don't have to worry about doing INSERT-SELECT, as we are now using foreign keys.
			// if the insert failed, they've probably already flagged it.

			$query = 	"INSERT IGNORE INTO ".makeTableName("flagged_sets")." (flagged_by_id,set_id) VALUES (?,?);";
			$result = Db::get_instance()->prepared_query($query,array($LIU->id,$setID));

			if ( !$result->affected_rows ) {
				throw new ServerClientException(
					"Failed to flag a set. Duplicate? \nUser: ".print_r($LIU,true)."\nSetID: ".$setID,
					createParsedErrorString("flag-duplicate",null)
				);
			}

			Activity::add_to_db("flag.set","User: ".print_r($LIU,true)."\nSetID: ".$setID." \nTargetUserID: ".$userID,"very high");
			Quit::get_instance()->json_exit(null);
		}
	}

	// INVALID

	else {
		throw new Exception("Unrecognized parameters. Method: ".$request_method." \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
	}
}

catch ( Exception $e ) {

	ErrorStatic::from_user($e);
	if ( !is_a($e,"ServerClientException") ) {
		$e = "Timeout (high traffic volume)";
	}
	Quit::get_instance()->http_die($e);
}