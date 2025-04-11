<?php

//---------------------------------------------------------------------------------------
// File: groups-backbone.php
// Description: All of the backbone calls relating to groups arrive here. This will only
//				be from the models themselves, never from the collection. The calls
//				we receive are: PATCH
//---------------------------------------------------------------------------------------

$LIU = null; // the logged-in user (LIU).

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
require_once( Bootstrap::get_php_root() . "ajax/studying/groups.inc.php" );

try {	

	// tell our helper classes what tables we're using, pull in the
	// data from the connection, and verify that the user belongs here.

	setupTableNames();

	$request_method = $_SERVER['REQUEST_METHOD'];
	$rdata = Leftovers::get_RESTful_data();
	$parms = Leftovers::explode_path_info();
	$num_parms = count($parms);

	$LIU = verifySessionAndUserStatus();

	// PUT
	//
	// Changing the code of a group.

	if ( ( $request_method === "PUT" ) && ( $num_parms === 2 ) ) {

		$moduleID = (int)$parms[0];
		$groupID = (int)$parms[1];
		$code = $rdata['code'];

		$groupAttrs = validateGroup($rdata);

		$query = 	"UPDATE ".makeTableName("groups")." AS groupsworking \n";				
		$query .= 	"INNER JOIN ".makeTableName("enrollment")." AS ownerEnroll ON ownerEnroll.user_id = ? AND ownerEnroll.module_id = ? \n";
		$query .= 	"INNER JOIN ".makeTableName("group_membership")." AS members ON members.group_id = groupsworking.id AND members.user_id = ownerEnroll.user_id \n";
		$query .=	"SET groupsworking.code = ? \n";
		$query .=	"WHERE groupsworking.id = ? AND groupsworking.enrollment_id = ownerEnroll.id;";
		$result = Db::get_instance()->prepared_query($query,array($LIU->id,$moduleID,$code,$groupID));

		if ( $result->affected_rows !== 1 ) {
    		throw new Exception("Failed to update group with new code. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
    	}

    	Activity::add_to_db("update.group","User: ".print_r($LIU,true)."\nGroupID: ".$groupID,"medium");
		Quit::get_instance()->json_exit(null);
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