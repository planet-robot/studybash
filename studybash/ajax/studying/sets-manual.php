<?php

//---------------------------------------------------------------------------------------
// File: sets-manual.php
// Description: All of the manual AJAX calls related to sets arrive here. This will
//				include: FETCH, PASTE, and DELETE (1+ sets). All of these requests
//				are made through the POST method.
//---------------------------------------------------------------------------------------

// the logged-in user.
$LIU = null;

///////////////////////////////////////////////////////////////////////////////
// Copy a number of sets from a particular enrollment to a different
// enrollment (represented here by a combination of module_id and user_id). 
// Note that a transaction is NOT created here, as we leave that up to the
// caller to organize.
//
//	@options:
//
//		.setIDs - array of set ids to be copied
//		.srcModuleID - the moduleID of existing sets
//		.dstModuleID - the destination moduleID for new sets
//		.userID - the user that is enrolled in the aforementioned modules
//
//	@returns: an array containing the new sets (exception on error)
//
///////////////////////////////////////////////////////////////////////////////

function copySets($options) {

	if ( 
			!array_key_exists("setIDs",$options) ||
			!array_key_exists("srcModuleID",$options) ||
			!array_key_exists("dstModuleID",$options) ||
			!array_key_exists("userID",$options)
		)
	{
		throw new Exception("Missing option value(s): ".print_r($options,true));
	}

	if ( !count($options['setIDs']) ) {
		throw new Exception("setIDs was empty. Options: ".print_r($options,true));
	}

	// ensure that the set IDs are sorted in ascending order. this is necessary as
	// we'll be mapping the old IDs to the new IDs.
	sort($options['setIDs']);

	// (1) insert copies of all of the sets.

	$queryStr = "";
	$queryAry = array();

	foreach ( $options['setIDs'] as $id ) {
		if ( strlen($queryStr) ) {
			$queryStr .= ",";
		}
		$queryStr .= "?";
		$queryAry[] = $id;
	}

	array_unshift($queryAry,$options['srcModuleID'],$options['userID'],$options['dstModuleID']);

	// notice that we are ensuring that the sets are inserted in a deterministic order by saying `ORDER BY`
	// on the select command. we are sorting by setid because we already have a sorted array of setIDs, so
	// we know that our orders will match (i.e., insert order is same as $options['setIDs'] order).

	$query = 	"INSERT INTO ".makeTableName("sets")." (enrollment_id,set_name,description,sharing,has_auto_test) \n";
	$query .=	"SELECT sets2.enrollment_id_dst AS enrollment_id, sets2.set_name, sets2.description, sets2.sharing, sets2.has_auto_test FROM ( \n";
	$query .=	"	SELECT sets.*, enroll2.id AS enrollment_id_dst FROM ".makeTableName("sets")." AS sets \n";
	$query .=	"	INNER JOIN ".makeTableName("enrollment")." AS enroll1 ON enroll1.id = sets.enrollment_id AND enroll1.module_id = ? AND enroll1.user_id = ? \n"; // sets are in srcModule and owned by user
	$query .=	"	INNER JOIN ".makeTableName("enrollment")." AS enroll2 ON enroll2.module_id = ? AND enroll2.user_id = enroll1.user_id \n"; // user is in dst class
	$query .=	") AS sets2 \n";
	$query .=	"WHERE sets2.id IN (".$queryStr.") \n";
	$query .=	"ORDER BY sets2.id ASC;";
	$result = Db::get_instance()->prepared_query($query,$queryAry);

	// ensure we copied the right amount.
	if ( count($options['setIDs']) !== $result->affected_rows ) {
		throw new Exception("Mismatch count after copy. Expected=".count($options['setIDs'])." Result=".$result->affected_rows." Query: ".$query);
	}

	// (2) 	match the new set IDs to the original sets. we have the first id given out to the copied set(s), in `insert_id`. and
	// 		we know that there will be `result->affected_rows` new sets. so the last id will be insert_id+affected_rows-1.

	$firstID = $result->insert_id;
	$mapIDs = array();

	$currID = $firstID;
	foreach ( $options['setIDs'] as $srcID ) {
		$mapIDs[$srcID] = $currID++;
	}	

	// (3) copy all of the cards that are in the original sets into the new sets

	foreach ( $options['setIDs'] as $srcID ) {
		copyCards(array(
			"cardIDs"=>null,
			"srcSetID"=>$srcID,
			"dstSetID"=>$mapIDs[$srcID],
			"srcModuleID"=>$options['srcModuleID'],
			"dstModuleID"=>$options['dstModuleID'],
			"userID"=>$options['userID']
		));
	}

	// (4) pull out all the new sets and return them to the caller.

	$setIDs = array();
	foreach ( $mapIDs as $srcID => $dstID ) {
		$setIDs[] = $dstID;
	}

	$sets = getSets(array(
		"moduleID"=>null,
		"ownerID"=>null,
		"accessorID"=>$options['userID'],
		"setIDs"=>$setIDs,
		"keywords"=>array(),
		"tags"=>array()
	));

	// return what we got
	return $sets;
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

	$request_method = $_SERVER['REQUEST_METHOD'];
	$rdata = Leftovers::get_RESTful_data();
	$parms = Leftovers::explode_path_info();
	$num_parms = count($parms);

	$LIU = verifySessionAndUserStatus();

	// SECTION: fetch.
	//
	// Get all of the sets that belong to a particular moduleID and userID combo (i.e., enrollmentID).
	// This is a manual call because we might be interested in the filter information that the client has sent us.

	if ( ( $request_method === "POST" ) && ( $num_parms === 4 ) && ( $parms[0] === "fetch" ) ) {

		$moduleID = (int)$parms[1];
		$groupID = $parms[2];
		$ownerID = (int)$parms[3];
		$isUser = (int)($ownerID === $LIU->id);

		// grab and validate filter information

		$filter = Leftovers::_safeval($rdata,"filter");
		$filter = gettype($filter) !== "array" ? array() : $filter;

		if ( !array_key_exists("keywords",$filter) ) {
			$filter['keywords'] = array();
		}

		if ( !array_key_exists("tags",$filter) ) {
			$filter['tags'] = array();
		}

		// since MySQL does a case-insensitive sort, we aren't going to bother
		// sorting the sets here because we want them to sort on string values.
		// we'll just leave it for the js collection to do so, as their sorting
		// result would differ from MySQLs.

		$ret = null;
		$ret['sets'] = getSets(
			array(
				"moduleID"=>$moduleID,
				"ownerID"=>$ownerID,
				"accessorID"=>$LIU->id,
				"setIDs"=>null,
				"keywords"=>$filter['keywords'],
				"tags"=>$filter['tags']
			)
		);
		$ret['breadcrumb'] = buildBreadcrumb(array(
			"moduleID"=>$moduleID,
			"groupID"=>$groupID,
			"userID"=>$ownerID,
			"typeID"=>"cards"
		));
		Quit::get_instance()->json_exit($ret);
	}

	// SECTION: pasting.
	//
	// We are copying one or more sets into a given enrollment (identified by moduleID and userID combo). We have been sent an array of
	// setIDs which will all belong to the same enrollmentID (again identified by moduleID and userID combo). The source and
	// destination enrollments cannot be the same.

	else if ( ( $request_method === "POST" ) && ( $num_parms === 3 ) && ( $parms[0] === "paste" ) ) {

		$dstModuleID = (int)$parms[1];
		$userID = (int)$parms[2];

		// ensure that the userID sent matches that of the logged-in user.
		if ( $userID !== $LIU->id ) {
			throw new Exception("Mismatch between user_id on parm (".$userID.") and session (".print_r($LIU,true).")");
		}

		// grab the specific values we need from the data.

		$isCut = Leftovers::_safeval($rdata,"isCut");
		$isCut = gettype($isCut) !== "integer" ? 0 : !!$isCut;

		$srcModuleID = Leftovers::_safeval($rdata,"srcModuleID");
		$srcModuleID = gettype($srcModuleID) !== "integer" ? -1 : $srcModuleID;

		$setIDs = Leftovers::_safeval($rdata,"setIDs");
		$setIDs = gettype($rdata) !== "array" ? array() : $setIDs;

		if ( $srcModuleID === $dstModuleID ) {
			throw new Exception("Source and destination modules are the same. Parms: ".print_r($parms,true)." Data: ".print_r($rdata,true)." User: ".print_r($LIU,true));
		}

		// we don't want only part of this to succeed.
		Db::get_instance()->begin_transaction();

		try {

			$newSets = copySets(array(
				"srcModuleID"=>$srcModuleID,
				"dstModuleID"=>$dstModuleID,
				"setIDs"=>$setIDs,
				"userID"=>$userID
			));

			if ( $isCut ) {
				deleteSets(array(
					"setIDs"=>$setIDs,
					"moduleID"=>$srcModuleID,
					"userID"=>$userID
				));
			}

			Db::get_instance()->commit();
			Db::get_instance()->end_transaction();

			$ret = null;
			$ret['newSets'] = $newSets;

			Activity::add_to_db("paste.sets","isCut: ".$isCut." srcModuleID: ".$srcModuleID." dstModuleID: ".$dstModuleID." setIDs: ".print_r($setIDs,true)."\nUser: ".print_r($LIU,true),"high");
			Quit::get_instance()->json_exit($ret);
		}

		catch ( Exception $e ) {

			Db::get_instance()->rollback(); // no effect if nothing to rollback
			try { Db::get_instance()->end_transaction(); }
			catch ( Exception $e2 ) {}
			throw $e;
		}				
	}

	// SECTION: deleting.
	//
	// We are deleting a number of sets. They will all be from the same enrollmentID (seen here as a combo
	// of moduleID and userID).

	else if ( ( $request_method === "POST" ) && ( $num_parms === 3 ) && ( $parms[0] === "delete" ) ) {

		$moduleID = (int)$parms[1];
		$userID = (int)$parms[2];

		// ensure that the userID sent matches that of the logged-in user.
		if ( $userID !== $LIU->id ) {
			throw new Exception("Mismatch between user_id on parm (".$userID.") and session (".print_r($LIU,true).")");
		}

		// the array of set ids to delete is in data.
		$setIDs = gettype($rdata) === "array" ? $rdata : array();

		// we don't want only part of this to succeed.
		Db::get_instance()->begin_transaction();

		try {

			deleteSets(array(
				"setIDs"=>$setIDs,
				"moduleID"=>$moduleID,
				"userID"=>$userID
			));

			Db::get_instance()->commit();
			Db::get_instance()->end_transaction();

			// send back an array of all the setIDs that we deleted.
			$ret = null;
			$ret['setIDs'] = $setIDs;

			Activity::add_to_db("delete.sets","User: ".print_r($LIU,true)."\nSetIDs: ".print_r($setIDs,true),"high");
			Quit::get_instance()->json_exit($ret);
		}

		catch ( Exception $e ) {

			Db::get_instance()->rollback(); // no effect if nothing to rollback
			try { Db::get_instance()->end_transaction(); }
			catch ( Exception $e2 ) {}
			throw $e;
		}
	}

	// INVALID SECTION

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