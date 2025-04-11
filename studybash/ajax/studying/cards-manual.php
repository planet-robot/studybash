<?php

//---------------------------------------------------------------------------------------
// File: cards-manual.php
// Description: All of the manual AJAX calls related to cards arrive here. This will
//				include: FETCH, PASTE, and DELETE (1+ cards). All of these requests
//				are made through the POST method.
//---------------------------------------------------------------------------------------

// the logged-in user.
$LIU = null;

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
require_once( Bootstrap::get_php_root() . "ajax/studying/cards.inc.php" );

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
	// Get all of the cards that belong to a particular set, which belongs to a particular
	// enrollment (signified here by a moduleID and userID combo). This is a manual call 
	// because we might be interested in the filter information that the client has sent us.

	if ( ( $request_method === "POST" ) && ( $num_parms === 5 ) && ( $parms[0] === "fetch" ) ) {

		$moduleID = (int)$parms[1];
		$groupID = $parms[2];
		$userID = (int)$parms[3];
		$setID = (int)$parms[4];
		$isUser = (int)($userID === $LIU->id);

		// grab the filter information from the data.

		$filter = Leftovers::_safeval($rdata,"filter");
		$filter = gettype($filter) !== "array" ? array() : $filter;

		if ( !array_key_exists("keywords",$filter) ) {
			$filter['keywords'] = array();
		}

		if ( !array_key_exists("tags",$filter) ) {
			$filter['tags'] = array();
		}

		// grab the cards from the db.

		$cards = getCards(array(
			"accessorID"=>$userID,
			"setIDs"=>array($setID),
			"cardIDs"=>null,
			"keywords"=>$filter['keywords'],
			"tags"=>$filter['tags']
		));

		// Done. Return what we found.

		$ret = null;
		$ret['cards'] = $cards;
		$ret['breadcrumb'] = buildBreadcrumb(array(
			"moduleID"=>$moduleID,
			"groupID"=>$groupID,
			"userID"=>$userID,
			"typeID"=>"cards",
			"setID"=>$setID
		));
		Quit::get_instance()->json_exit($ret);
	}

	// SECTION: create (batch).
	//
	// We are creating one or more cards to be placed into a given set.

	else if ( ( $request_method === "POST" ) && ( $num_parms === 4 ) && ( $parms[0] === "create_batch" ) ) {

		Db::get_instance()->begin_transaction();

		try {

			$newCards = createCards(array(
				"moduleID"=>(int)$parms[1],
				"creatorID"=>(int)$parms[2],
				"setID"=>(int)$parms[3],
				"cards"=>$rdata
			));

			if ( !count($newCards) ) {
				throw new Exception("Failed to create anything. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true)." \nUser: ".print_r($LIU,true));
			}

			Db::get_instance()->commit();
			Db::get_instance()->end_transaction();

			$ret = null;
			$ret['newCards'] = $newCards;

			Activity::add_to_db("create.batch.cards","User: ".print_r($LIU,true)."\nCount: ".count($newCards),"high");
			Quit::get_instance()->json_exit($ret);
		}

		catch ( Exception $e ) {

			Db::get_instance()->rollback(); // no effect if nothing to rollback
			try { Db::get_instance()->end_transaction(); }
			catch ( Exception $e2 ) {}
			throw $e;
		}				
	}

	// SECTION: pasting.
	//
	// We are copying one or more cards into a given set. All of the source cards are coming from the same set and that
	// must be different from the destination set. The source and destination sets do not need to be apart of the
	// same enrollmentID (seen here as a combo of moduleID and userID).

	else if ( ( $request_method === "POST" ) && ( $num_parms === 4 ) && ( $parms[0] === "paste" ) ) {

		$dstModuleID = (int)$parms[1];
		$userID = (int)$parms[2];
		$dstSetID = (int)$parms[3];

		// ensure that the userID sent matches that of the logged-in user.
		if ( $userID !== $LIU->id ) {
			throw new Exception("Mismatch between user_id on parm (".$userID.") and session (".print_r($LIU,true).")");
		}

		// grab the specific values we need from the data.

		$isCut = Leftovers::_safeval($rdata,"isCut");
		$isCut = gettype($isCut) !== "integer" ? 0 : !!$isCut;

		$srcModuleID = Leftovers::_safeval($rdata,"srcModuleID");
		$srcModuleID = gettype($srcModuleID) !== "integer" ? -1 : $srcModuleID;

		$srcSetID = Leftovers::_safeval($rdata,"srcSetID");
		$srcSetID = gettype($srcSetID) !== "integer" ? -1 : $srcSetID;

		$cardIDs = Leftovers::_safeval($rdata,"cardIDs");
		$cardIDs = gettype($rdata) !== "array" ? array() : $cardIDs;

		if ( $srcSetID === $dstSetID ) {
			throw new Exception("Source and destination sets are the same. Parms: ".print_r($parms,true)." Data: ".print_r($rdata,true)." User: ".print_r($LIU,true));
		}

		Db::get_instance()->begin_transaction();

		try {

			$newCards = copyCards(array(
				"srcSetID"=>$srcSetID,
				"dstSetID"=>$dstSetID,
				"cardIDs"=>$cardIDs,
				"srcModuleID"=>$srcModuleID,
				"dstModuleID"=>$dstModuleID,
				"userID"=>$userID						
			));

			if ( !count($newCards) ) {
				throw new Exception("Failed to cut/copy anything. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true)." \nUser: ".print_r($LIU,true));
			}

			if ( $isCut ) {
				deleteCards(array(
					"cardIDs"=>$cardIDs,
					"setID"=>$srcSetID,
					"moduleID"=>$srcModuleID,
					"userID"=>$userID
				));
			}

			Db::get_instance()->commit();
			Db::get_instance()->end_transaction();

			$ret = null;
			$ret['newCards'] = $newCards;

			Activity::add_to_db("paste.cards","isCut: ".$isCut." srcModuleID: ".$srcModuleID." dstModuleID: ".$dstModuleID." srcSetID: ".$srcSetID." dstSetID: ".$dstSetID." cardIDs: ".print_r($cardIDs,true)."\nUser: ".print_r($LIU,true),"high");
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
	// We are deleting a number of cards. They will all belong to the same set.

	else if ( ( $request_method === "POST" ) && ( $num_parms === 4 ) && ( $parms[0] === "delete" ) ) {

		$moduleID = (int)$parms[1];
		$userID = (int)$parms[2];
		$setID = (int)$parms[3];

		if ( $userID !== $LIU->id ) {
			throw new Exception("Mismatch between user_id on parm (".$userID.") and session (".print_r($LIU,true).")");
		}

		// the array of flashcard ids to delete is in data.
		$cardIDs = gettype($rdata) === "array" ? $rdata : array();

		// we don't want only part of this to succeed.
		Db::get_instance()->begin_transaction();

		try {

			// delete them.
			deleteCards(array(
				"cardIDs"=>$cardIDs,
				"moduleID"=>$moduleID,
				"userID"=>$userID,
				"setID"=>$setID
			));

			Db::get_instance()->commit();
			Db::get_instance()->end_transaction();

			// send back an array of all the cardIDs that we deleted.
			$ret = null;
			$ret['cardIDs'] = $cardIDs;

			Activity::add_to_db("delete.cards","\nUser: ".print_r($LIU,true)."\nCardIDs: ".print_r($cardIDs,true),"high");
			Quit::get_instance()->json_exit($ret);
		}

		catch ( Exception $e ) {

			Db::get_instance()->rollback(); // no effect if nothing to rollback
			try { Db::get_instance()->end_transaction(); }
			catch ( Exception $e2 ) {}
			throw $e;
		}
	}

	// INVALID SUB-SUB-SECTION

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