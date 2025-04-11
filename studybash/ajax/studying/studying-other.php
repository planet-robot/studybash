<?php

//---------------------------------------------------------------------------------------
// File: studying-other.php
// Description: This receives all of the general, manual calls from the "Studying" 
//				super-section of the site (i.e., "Flashcards" and "Tests" section). This
//				will include anything not directly related to sets, cards, or tests.
//---------------------------------------------------------------------------------------

// the logged-in user.
$LIU = null;

///////////////////////////////////////////////////////////////////////////////
// Based upon the LIU's accesses, let's get the number of tests and cards that
// a particular user has for a given module.
//
//	@options:
//
//		.ownerAttrs - the basic information regarding the user
//		.moduleID - the module in question
//		.accessorID - the id of the LIU
//		.keywords - any keyword filter applied to cards
//		.tags - any tag filter applied to cards
//		.includeAuto - should we include auto in our test query?
//
//	@returns: the updated user record object (exception on error)
//
///////////////////////////////////////////////////////////////////////////////

function getUserContentStats($options) {

	if ( 
			!array_key_exists("ownerAttrs",$options) ||
			!array_key_exists("moduleID",$options) ||
			!array_key_exists("accessorID",$options) ||			
			!array_key_exists("keywords",$options) ||
			!array_key_exists("tags",$options) ||
			!array_key_exists("includeAuto",$options)
		)
	{
		throw new Exception("Missing option value(s): ".print_r($options,true));
	}

	// (1) cards

	$sets = getSets(array(
		"moduleID"=>$options['moduleID'],
		"ownerID"=>$options['ownerAttrs']->id,
		"accessorID"=>$options['accessorID'],
		"setIDs"=>null,
		"keywords"=>$options['keywords'],
		"tags"=>$options['tags']
	));

	// go through all of the sets and add up our total
	$count = 0;
	foreach ( $sets as $set ) {
		$count += $set->num_filtered_cards;
	}
	
	$options['ownerAttrs']->num_filtered_cards = $count;

	// (2) tests

	$tests = getTests(array(
		"moduleID"=>$options['moduleID'],
		"ownerID"=>$options['ownerAttrs']->id,
		"accessorID"=>$options['accessorID'],
		"testIDs"=>null,
		"autoSetIDs"=> ( $options['includeAuto'] ? null : array() ),
		"manual"=>null
	));

	$options['ownerAttrs']->num_tests = count($tests);

	return $options['ownerAttrs'];
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
require_once( Bootstrap::get_php_root() . "ajax/classes.inc.php" );
require_once( Bootstrap::get_php_root() . "ajax/studying/studying.inc.php" );
require_once( Bootstrap::get_php_root() . "ajax/studying/tests.inc.php" );

try {

	// many of the static classes require us to tell them what
	// table names they are working with.
	setupTableNames();

	// pull all of the data-related information.

	$request_method = $_SERVER['REQUEST_METHOD'];
	$rdata = Leftovers::get_RESTful_data();
	$parms = Leftovers::explode_path_info();
	$num_parms = count($parms);	

	// continue the session, ensure that the user can access the site (i.e., fully registered),
	// and that the site isn't (temporarily) locked. although admin(s) can get in whenever they
	// want.
	$LIU = verifySessionAndUserStatus();	

	/*
		These two requests are made in order to fill the `user` or `classes` listgroups
		within the studying super-section (i.e., flashcards or tests sections). Accordingly,
		we have to send back a full breadcrumb that will be displayed as part of the content
		on the client.
	*/

	// SECTION: enrollment
	//
	// (1)	A detailed list of the classes that the logged-in user is enrolled in.
	//		In the format of (e.g.,) PSYC 101, Fall, 2013, "Introduction to Psychology", etc...
	// (2)	A breadcrumb of the root crumb only.

	if ( ( $request_method === "POST" ) && ( $num_parms === 1 ) && ( $parms[0] === "enrollment" ) ) {

		$includeCompleted = $rdata['includeCompleted'];
		
		$ret = null;
		$ret['enrollment'] = getEnrollmentForUser($LIU->id,$includeCompleted);
		$ret['breadcrumb'] = buildBreadcrumb(array());
		Quit::get_instance()->json_exit($ret);
	}

	// SECTION: users (plural)
	//
	// (1)	A list of all the users that are enrolled in a particular module, within a particular group
	//		for that module (set groupID = "pub" for all users in the module). we also want to know
	///		how many (filtered) cards they have and how many tests they have. we do NOT get the logged-in 
	// 		user though.
	// (2)	A breadcrumb up to the enrollment involved.

	else if ( ( $request_method === "POST" ) && ( $num_parms === 3 ) && ( $parms[0] === "users" ) ) {

		$moduleID = (int)$parms[1];
		$groupID = $parms[2];
		if ( ( $groupID !== "pub" ) && ( (int)$groupID != $groupID ) ) {
			throw new Exception("Unrecognized type/value of groupID: ".print_r($groupID,true));
		}

		// (1) setup the data sent

		// grab and validate filter information

		$filter = Leftovers::_safeval($rdata,"filter");
		$filter = gettype($filter) !== "array" ? array() : $filter;

		if ( !array_key_exists("keywords",$filter) ) {
			$filter['keywords'] = array();
		}

		if ( !array_key_exists("tags",$filter) ) {
			$filter['tags'] = array();
		}

		$includeAuto = !!(int)Leftovers::_safeval($rdata,"includeAuto");

		// (2) 	grab all of the users that are enrolled in the given module, within that particular group.
		//		note that we won't bother sorting them here, as we'll do that in js on the client.

		// groupID

		$groupQueryStr = "";
		$groupQueryAry = array();

		if ( $groupID === "pub" ) {
			$groupQueryStr = "(?)";
			$groupQueryAry[] = 1;
		}
		else {
			$groupQueryStr = "(members.group_id IS NOT NULL)";
			$groupQueryAry[] = $groupID;
		}

		$queryAry = array_merge(array($moduleID),$groupQueryAry,array($LIU->id));

		$query = 	"SELECT users.id, users.email, users.full_name, users.first_name, users.last_name, users.registered_on, users.last_login, users.num_logins FROM ".makeTableName("users")." AS users \n";
		$query .=	"INNER JOIN ".makeTableName("enrollment")." AS enroll ON enroll.user_id = users.id AND enroll.module_id = ? \n";

		if ( $groupID !== "pub" ) {
			$query .=	"LEFT JOIN ".makeTableName("group_membership")." AS members ON members.user_id = users.id AND members.group_id = ? \n";
		}
		
		$query .=	"WHERE ".$groupQueryStr." AND users.id != ?;";
		$result = Db::get_instance()->prepared_query($query,$queryAry);

		$users = $result->rows;

		// (3) okay, we have our array of users now. let's get their content information.

		foreach ( $users as &$user ) {

			$user = getUserContentStats(array(
				"moduleID"=>$moduleID,
				"ownerAttrs"=>$user,
				"accessorID"=>$LIU->id,
				"keywords"=>$filter['keywords'],
				"tags"=>$filter['tags'],
				"includeAuto"=>$includeAuto
			));

		}
		unset($user);

		// (4) now, we are going to remove all of the users that have a 0 for both
		// cards and tests.

		do {
			$idx = Leftovers::indexOfObj($users,function($o) {
				return ( $o->num_filtered_cards + $o->num_tests === 0 );
			});
			if ( $idx !== null ) {
				array_splice($users,$idx,1);
			}
		}
		while ( $idx !== null );

		$ret = null;
		$ret['users'] = $users;
		$ret['breadcrumb'] = buildBreadcrumb(array("moduleID"=>$moduleID,"groupID"=>$groupID));
		Quit::get_instance()->json_exit($ret);
	}

	// SECTION: user (singular)
	//
	// (1)	get all of the content stats for a single user for a given module.
	// (2)	A breadcrumb up to the enrollment involved.

	else if ( ( $request_method === "POST" ) && ( $num_parms === 4 ) && ( $parms[0] === "user" ) ) {

		$moduleID = (int)$parms[1];		
		$groupID = $parms[2];
		if ( ( $groupID !== "pub" ) && ( $groupID !== "self" ) && ( (int)$groupID != $groupID ) ) {
			throw new Exception("Unrecognized type/value of groupID: ".print_r($groupID,true));
		}
		$userID = (int)$parms[3];

		// (1) setup the data sent

		// grab and validate filter information

		$filter = Leftovers::_safeval($rdata,"filter");
		$filter = gettype($filter) !== "array" ? array() : $filter;

		if ( !array_key_exists("keywords",$filter) ) {
			$filter['keywords'] = array();
		}

		if ( !array_key_exists("tags",$filter) ) {
			$filter['tags'] = array();
		}

		$includeAuto = !!(int)Leftovers::_safeval($rdata,"includeAuto");

		// (2) 	grab the basic user's information.

		$query = 	"SELECT users.id, users.email, users.full_name, users.registered_on, users.last_login, users.num_logins FROM ".makeTableName("users")." AS users \n";
		$query .=	"INNER JOIN ".makeTableName("enrollment")." AS enroll ON enroll.user_id = users.id AND enroll.module_id = ? \n";
		$query .=	"WHERE users.id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($moduleID,$userID));

		if ( $result->num_rows !== 1 ) {
			throw new Exception("Failed to extract single user. \nData: ".print_r($rdata,true)." \nParms: ".print_r($parms,true)." \nResult: ".print_r($result,true));
		}

		$user = $result->rows[0];
		$user = getUserContentStats(array(
			"moduleID"=>$moduleID,
			"ownerAttrs"=>$user,
			"accessorID"=>$LIU->id,
			"keywords"=>$filter['keywords'],
			"tags"=>$filter['tags'],
			"includeAuto"=>$includeAuto
		));

		$ret = null;
		$ret['user'] = $user;
		$ret['breadcrumb'] = buildBreadcrumb(array("moduleID"=>$moduleID,"groupID"=>$groupID,"userID"=>$userID));
		Quit::get_instance()->json_exit($ret);
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