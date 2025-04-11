<?php

//---------------------------------------------------------------------------------------
// File: tests-manual.php
// Description: All of the manual AJAX calls related to tests arrive here. This will
//				include: FETCH and DELETE (1+ tests). All of these requests
//				are made through the POST method.
//---------------------------------------------------------------------------------------

// the logged-in user.
$LIU = null;
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

	// SECTION: fetch
	//
	// Getting all of the tests that belong to a particular user for
	// a particular module (i.e., enrollment combo). Ensuring that the ones returned
	// are accessible by the currently logged-in user. If requested to do so, we also
	// grab the auto-tests from sets.

	if ( ( $request_method === "POST" ) && ( $num_parms === 4 ) && ( $parms[0] === "fetch" ) ) {

		$moduleID = (int)$parms[1];
		$groupID = $parms[2];
		$ownerID = (int)$parms[3];
		$includeAuto = (int)$rdata['includeAuto'];

		// grab all of the real tests and, if asked for, auto tests. this retrieves
		// detailed information on all of them, and adds setsInfo, created_by, and num_cards
		// to each record.

		$allTests = getTests(array(
			"moduleID"=>$moduleID,
			"ownerID"=>$ownerID,
			"accessorID"=>$LIU->id,
			"testIDs"=>null,
			"autoSetIDs"=> ( $includeAuto ? null : array() ),
			"manual"=>null
		));

		// done. compile everything we have and send it back to client.

		$ret = null;
		$ret['tests'] = $allTests;

		$ret['breadcrumb'] = buildBreadcrumb(array(
			"moduleID"=>$moduleID,
			"groupID"=>$groupID,
			"userID"=>$ownerID,
			"typeID"=>"tests"
		));
		Quit::get_instance()->json_exit($ret);
	}

	// SECTION: take
	//
	// A user is taking a test. We need to retrieve all the information about the test as well as all
	// of the cards that are in the test. Note that we can receive three types of request here:
	//
	//	(1) a regular test
	//	(2) an auto set
	//	(3) a manual test request, including: .setIDs, .keywords, .tags

	else if ( ( $request_method === "POST" ) && ( $num_parms === 1 ) && ( $parms[0] === "take" ) ) {		

		$testIDs = array();
		$autoSetIDs = array();
		$manualTest = null;

		$type = $rdata['type'];
		if ( $type === "regular" ) {
			$testIDs[] = (int)$rdata['id'];
		}
		else if ( $type === "auto" ) {
			$autoSetIDs[] = (int)$rdata['id'];
		}
		else if ( $type === "manual" ) {
			$manualTest = $rdata['manualTest'];
		}
		else {
			throw new Exception("Unexpected `type` parameter. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		}

		// (1) grab the test. this retrieves detailed information which includes
		// setsInfo, and created_by. however, it returns an array
		// of tests, so we'll have to grab the first (and only) one.

		$tests = getTests(array(
			"moduleID"=>null,
			"ownerID"=>null,
			"accessorID"=>$LIU->id,
			"testIDs"=>$testIDs,
			"autoSetIDs"=>$autoSetIDs,
			"manual"=>$manualTest
		));

		$test = null;

		// note that if a test isn't found, we will allow that to go through
		// to the client as `null`. They will deal with telling the user.

		if ( !count($tests ) ) {
			ErrorStatic::from_user(new Exception("Failed to find a test. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true)." \nUser: ".print_r($LIU,true)));
		}
		else if ( count($tests) > 1 ) {
			throw new Exception("Returned multiple tests. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true)." \nUser: ".print_r($LIU,true)." \nTests: ".print_r($tests,true));
		}
		else {
			$test = $tests[0];
		}

		// (2) grab the cards for these sets and create the new property `num_cards` on our test object.

		if ( $test ) {

			$test->cards = getCards(array(
				"accessorID"=>$LIU->id,
				"setIDs"=>$test->setIDs,
				"cardIDs"=>null,
				"keywords"=>$test->keywords,
				"tags"=>$test->tags
			));

			$test->num_cards = count($test->cards);
		}

		// done. compile everything we have and send it back to client.

		$ret = null;
		$ret['test'] = $test;

		if ( $test ) {
			Activity::add_to_db("take.test","User: ".print_r($LIU,true)."\nTestID: ".$test->id,"low");
		}
		Quit::get_instance()->json_exit($ret);
	}

	// SECTION: delete
	//
	// Deleting one or more tests. Note that they CANNOT be auto-tests, must be genuine tests.

	else if ( ( $request_method === "POST" ) && ( $num_parms === 3 ) && ( $parms[0] === "delete" ) ) {

		$moduleID = (int)$parms[1];
		$userID = (int)$parms[2];

		// they should not have been able to request this of anyone but themselves.
		if ( $userID !== $LIU->id ) {
			throw new Exception("Mismatch between user_id on parm (".$userID.") and session (".print_r($LIU,true).")");
		}

		$testIDs = $rdata;

		// build up our (?,?,?) and array(var,vary,var)

		$queryStr = "";
		$queryAry = array();

		foreach ( $testIDs as $id ) {
			if ( strlen($queryStr) ) {
				$queryStr .= ",";
			}
			$queryStr .= "?";
			$queryAry[] = $id;
		}

		array_unshift($queryAry,$moduleID,$userID);

		Db::get_instance()->begin_transaction();

		try {

			$query = 	"DELETE tests FROM ".makeTableName("tests")." AS tests \n";
			$query .=	"INNER JOIN ".makeTableName("enrollment")." AS enroll ON enroll.id = tests.enrollment_id AND enroll.module_id = ? AND enroll.user_id = ? \n";
			$query .=	"WHERE tests.id IN (".$queryStr.");";
			$result = Db::get_instance()->prepared_query($query,$queryAry);

			if ( $result->affected_rows !== count($testIDs) ) {
				throw new Exception("Failed to delete tests (ids:".print_r($testIDs,true)."). User: ".print_r($LIU,true));
			}

			Db::get_instance()->commit();
			Db::get_instance()->end_transaction();

			// send back an array of all the setIDs that we deleted.
			$ret = null;
			$ret['testIDs'] = $testIDs;
			Activity::add_to_db("delete.test","User: ".print_r($LIU,true)."\nTestIDs: ".print_r($testIDs,true),"very high");
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