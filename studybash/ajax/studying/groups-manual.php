<?php

//---------------------------------------------------------------------------------------
// File: groups-manual.php
// Description: All of the manual AJAX calls related to groups arrive here. This will
//				include: FETCH.
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

	// SECTION: fetch.
	//
	// Get all of the groups that exist for a particular moduleID that either match: (a) the search code provided, or
	// (b) that the LIU (logged-in user) is already a member of.

	if ( ( $request_method === "POST" ) && ( $num_parms === 2 ) && ( $parms[0] === "fetch" ) ) {

		$moduleID = (int)$parms[1];
		$code = $rdata['code'];

		$groups = getGroups(array(
			"moduleID"=>$moduleID,
			"groupIDs"=>null,
			"accessorID"=>$LIU->id,
			"searchCode"=>$code,
			"includePublic"=>true
		));

		$ret = null;
		$ret['groups'] = $groups;
		$ret['breadcrumb'] = buildBreadcrumb(array("moduleID"=>$moduleID));
		Quit::get_instance()->json_exit($ret);
	}

	// SECTION: create
	//
	// We are creating a new group, which belongs to a particular enrollment (moduleID and userID combo).

	if ( ( $request_method === "POST" ) && ( $num_parms === 2 ) && ( $parms[0] === "create" ) ) {

		// the user must have a status above probation for this.
		$userStatusProbation = (int)DbSettings::get_instance()->get_setting("user_status_probation");
		if ( $LIU->status <= $userStatusProbation ) {
			throw new Exception("Probation user trying to create a group. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		}

		$moduleID = (int)$parms[1];		
		$groupAttrs = validateGroup($rdata);

		// we don't want only part of this to succeed.
		Db::get_instance()->begin_transaction();

		try {

			// ensure that this user does not already own a group for this module.

			$query =	"SELECT * FROM ".makeTableName("groups")." AS groupsworking \n";
			$query .=	"INNER JOIN ".makeTableName("enrollment")." AS ownerEnroll ON ownerEnroll.module_id = ? AND ownerEnroll.id = groupsworking.enrollment_id \n";
			$query .=	"WHERE ownerEnroll.user_id = ?;";
			$result = Db::get_instance()->prepared_query($query,array($moduleID,$LIU->id));

			if ( $result->num_rows ) {
				throw new ServerClientException(
					"User trying to create a studygroup when they are already owner of one. \nUser: ".print_r($LIU,true)." \nModuleID: ".$moduleID,
					createParsedErrorString("owner",null)
				);
			}

			// create the record for the group

			$query = 	"INSERT INTO ".makeTableName("groups")." (enrollment_id,code) \n";
			$query .=	"SELECT enroll.id, ? FROM ".makeTableName("enrollment")." AS enroll WHERE enroll.module_id = ? AND enroll.user_id = ?;";
			$result = Db::get_instance()->prepared_query($query,array($groupAttrs['code'],$moduleID,$LIU->id));

			if ( $result->affected_rows !== 1 ) {
				throw new Exception("Failed to insert new group. \nParms: ".print_r($parms,true)." \nData: ".print_r($groupAttrs,true)." \nUser: ".print_r($LIU,true));
			}

			// the insertion has succeeded. let's grab its id.
			
			$groupAttrs['id'] = $result->insert_id;			
			
			// now add the creator to its list of user memberships, ensuring they're in the module the group is being
			// created for.

			$query = 	"INSERT INTO ".makeTableName("group_membership")." (group_id,user_id) \n";
			$query .=	"SELECT groupsworking.id, users.id FROM ".makeTableName("groups")." AS groupsworking \n";			
			$query .=	"INNER JOIN ".makeTableName("users")." AS users ON users.id = ? \n";
			$query .=	"INNER JOIN ".makeTableName("enrollment")." AS groupEnroll ON groupEnroll.id = groupsworking.enrollment_id AND groupEnroll.module_id = ? \n";
			$query .=	"INNER JOIN ".makeTableName("enrollment")." AS accessorEnroll ON accessorEnroll.user_id = users.id AND accessorEnroll.module_id = groupEnroll.module_id \n";
			$query .=	"WHERE groupsworking.id = ?;";
			$result = Db::get_instance()->prepared_query($query,array($LIU->id,$moduleID,$groupAttrs['id']));

			if ( $result->affected_rows !== 1 ) {
				throw new Exception("Failed to insert new group membership. \nParms: ".print_r($parms,true)." \nData: ".print_r($groupAttrs,true)." \nUser: ".print_r($LIU,true));
			}

			// we're all done. pull out the full record so we can send it back.

			$groups = getGroups(array(
				"moduleID"=>$moduleID,
				"groupIDs"=>array($groupAttrs['id']),
				"accessorID"=>$LIU->id,
				"searchCode"=>$groupAttrs['code'],
				"includePublic"=>false
			));
			
			if ( !count($groups) ) {
				throw new Exception("Retrieve failed on new group. \nResult: ".print_r($groups,true)." \nAttrs: ".print_r($groupAttrs,true)." \nUser: ".print_r($LIU,true));
			}

			Db::get_instance()->commit();
			Db::get_instance()->end_transaction();

			Activity::add_to_db("add.group","User: ".print_r($LIU,true)."\nData: ".print_r($groups[0],true),"medium");		
			Quit::get_instance()->json_exit($groups[0]);
		}
		catch ( Exception $e ) {

			Db::get_instance()->rollback(); // no effect if nothing to rollback

			try { Db::get_instance()->end_transaction(); }
			catch ( Exception $e2 ) {}

			throw $e;
		}
	}	

	// SECTION: join.
	//
	// The LIU is requesting to join a particular group.

	else if ( ( $request_method === "POST" ) && ( $num_parms === 3 ) && ( $parms[0] === "join" ) ) {

		$moduleID = (int)$parms[1];
		$groupID = (int)$parms[2];
		$code = $rdata['code'];

		// grab the group.
		$groups = getGroups(array(
			"moduleID"=>$moduleID,
			"groupIDs"=>array($groupID),
			"accessorID"=>$LIU->id,
			"searchCode"=>$code,
			"includePublic"=>false
		));

		if ( count($groups) !== 1 ) {
			throw new Exception("Failed to retrieve group on join. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true)." \nReturn: ".print_r($groups,true));
		}

		$group = $groups[0];

		// if the user is already a member of the group, they cannot join again.

		if ( $group->is_user_member ) {
			throw new Exception("Trying to join a group for the second time. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		}

		// simply add the membership of our LIU

		$query = 	"INSERT INTO ".makeTableName("group_membership")." (group_id,user_id) \n";
		$query .=	"SELECT groupsworking.id, users.id FROM ".makeTableName("groups")." AS groupsworking \n";			
		$query .=	"INNER JOIN ".makeTableName("users")." AS users ON users.id = ? \n";
		$query .=	"INNER JOIN ".makeTableName("enrollment")." AS groupEnroll ON groupEnroll.id = groupsworking.enrollment_id AND groupEnroll.module_id = ? \n";
		$query .=	"INNER JOIN ".makeTableName("enrollment")." AS accessorEnroll ON accessorEnroll.user_id = users.id AND accessorEnroll.module_id = groupEnroll.module_id \n";
		$query .=	"WHERE groupsworking.id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($LIU->id,$moduleID,$group->id));

		if ( $result->affected_rows !== 1 ) {
			throw new Exception("Failed to insert new group membership. \nParms: ".print_r($parms,true)." \nGroup: ".print_r($group,true)." \nUser: ".print_r($LIU,true));
		}

		Activity::add_to_db("join.group","User: ".print_r($LIU,true)."\nGroupID: ".$groupID,"medium");
		Quit::get_instance()->json_exit(null);
	}

	// SECTION: leave
	//
	// We are removing a user from a group. This user may be the owner of the group, or just a member. If it's the *LAST* member, we are deleting
	// the entire group.

	else if ( ( $request_method === "POST" ) && ( $num_parms === 3 ) && ( $parms[0] === "leave" ) ) {

		$moduleID = (int)$parms[1];
		$groupID = (int)$parms[2];
		$code = $rdata['code'];

		$groupAttrs = null; // in case we leave it and we were the owner, so client knows new owner

		// we don't want only part of this to succeed.
		Db::get_instance()->begin_transaction();

		try {

			// lock the tables that we're going to be working with (no choice here, if we work with a table when under lockdown, we have to lock it ourselves). this will freeze any
		    // users on other connections that are trying to use any of the tables. the reason we do this here is that the records we're working with are "shared" by everyone, in
		    // other words, any user can add/delete these records (by adding/leaving a group). and so we want to be sure that this user is given full control.

		    $query = 	"LOCK TABLES ".makeTableName("groups")." AS groupsworking WRITE, ".makeTableName("group_membership")." AS members WRITE, \n";
		    $query .=	makeTableName("enrollment")." AS groupEnroll READ, ".makeTableName("enrollment")." AS ownerEnroll READ;";
		    $result = Db::get_instance()->query($query); // this returns 0 affected rows on success

		    // how many users are in the group? is the LIU the owner? notice that we aren't calling our `getGroups`, as because we've locked the tables, we don't want
		    // to have to worry about what tables/aliases they're using. we keep everything to a minimum here.

		    $query =	"SELECT groupsworking.*, groupEnroll.user_id = ? AS is_user_owner, COUNT(members.id) AS num_members FROM ".makeTableName("groups")." AS groupsworking \n";
		    $query .=	"INNER JOIN ".makeTableName("enrollment")." AS groupEnroll ON groupEnroll.id = groupsworking.enrollment_id AND groupEnroll.module_id = ? \n";
		    $query .=	"LEFT JOIN ".makeTableName("group_membership")." AS members ON members.group_id = groupsworking.id \n";		    
		    $query .=	"WHERE groupsworking.id = ? AND groupsworking.code = ? \n";
		    $query .=	"GROUP BY groupsworking.id;";
		    $result = Db::get_instance()->prepared_query($query,array($LIU->id,$moduleID,$groupID,$code));

		    if ( $result->num_rows !== 1 ) {
		    	throw new Exception("Failed to inquire about group on delete. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		    }

		    $is_user_owner = $result->rows[0]->is_user_owner;
		    $num_members = $result->rows[0]->num_members;

		    // no matter what, we want to remove this user from the membership.

		    $query =	"DELETE members FROM ".makeTableName("group_membership")." AS members \n";
		    $query .=	"INNER JOIN ".makeTableName("groups")." AS groupsworking ON groupsworking.id = members.group_id AND groupsworking.id = ? \n";
		    $query .=	"WHERE members.user_id = ?;";
		    $result = Db::get_instance()->prepared_query($query,array($groupID,$LIU->id));

		    if ( $result->affected_rows !== 1 ) {
		    	throw new Exception("Failed to delete group membership. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		    }

		    // if there was only one person in the group, we are removing the group itself too.

		    if ( $num_members === 1 ) {

		    	$query =	"DELETE groups FROM ".makeTableName("groups")." AS groupsworking \n";
		    	$query .=	"LEFT JOIN ".makeTableName("group_membership")." AS members ON members.group_id = groupsworking.id \n";
			    $query .=	"WHERE groupsworking.id = ? AND members.group_id IS NULL;";
			    $result = Db::get_instance()->prepared_query($query,array($groupID));

			    if ( $result->affected_rows !== 1 ) {
			    	throw new Exception("Failed to delete group. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
			    }
		    }

		    // okay, so the group remains. if the user that just left was the owner, we have to assign a new owner.
		    // we'll do this simply by picking the lowest ID of a user that's still in the group.

		    else if ( $is_user_owner ) {

		    	$query = 	"SELECT * FROM ".makeTableName("group_membership")." AS members \n";
		    	$query .= 	"WHERE group_id = ? \n";
		    	$query .= 	"ORDER BY user_id ASC LIMIT 1;";
		    	$result = Db::get_instance()->prepared_query($query,array($groupID));

		    	if ( $result->num_rows !== 1 ) {
		    		throw new Exception("Failed to find replacement owner. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		    	}

		    	$ownerID = $result->rows[0]->user_id;

		    	// we got our new owner. now grab their enrollmentID that is tied to the group and set them up as the new owner.

		    	$query = 	"UPDATE ".makeTableName("groups")." AS groupsworking \n";				
				$query .= 	"INNER JOIN ".makeTableName("enrollment")." AS ownerEnroll ON ownerEnroll.user_id = ? AND ownerEnroll.module_id = ? \n";
				$query .= 	"INNER JOIN ".makeTableName("group_membership")." AS members ON members.group_id = groupsworking.id AND members.user_id = ownerEnroll.user_id \n";
				$query .=	"SET groupsworking.enrollment_id = ownerEnroll.id \n";
				$query .=	"WHERE groupsworking.id = ?;";
				$result = Db::get_instance()->prepared_query($query,array($ownerID,$moduleID,$groupID));

				if ( $result->affected_rows !== 1 ) {
		    		throw new Exception("Failed to update group with new owner. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		    	}		    	
		    }

			Db::get_instance()->commit();

			$query = "UNLOCK TABLES;";
        	try { $result = Db::get_instance()->query($query); } // returns 0 rows on success
        	catch ( Exception $e2 ) {}

			Db::get_instance()->end_transaction();

			// if the owner was updated, let's grab the group information again, so we can send back info of the new owner. note that we needn't
			// worry about this being outside the transaction (it's outside cuz tables were locked, so we wanted to keep all MySQL commands
			// local) because we had insane error checking during the transaction.

			if ( $num_members > 1 ) {

		    	$groups = getGroups(array(
		    		"moduleID"=>$moduleID,
		    		"groupIDs"=>array($groupID),
		    		"accessorID"=>$LIU->id,
		    		"searchCode"=>$code,
		    		"includePublic"=>false
		    	));

		    	if ( count($groups) !== 1 ) {
		    		throw new Exception("Failed to retrieve updated group with new owner. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true)." \nReturn: ".print_r($groups,true));
		    	}

		    	$groupAttrs = $groups[0];
		    }
			
			Activity::add_to_db("leave.group","User: ".print_r($LIU,true)."\nGroupID: ".$groupID,"medium");
			Quit::get_instance()->json_exit($groupAttrs);
		}

		catch ( Exception $e ) {

			Db::get_instance()->rollback(); // no effect if nothing to rollback

			// unlock our tables. this has no effect if the tables weren't
        	// able to be locked in the first place.

        	$query = "UNLOCK TABLES;";
        	try { $result = Db::get_instance()->query($query); } // no effect if nothing to unlock
        	catch ( Exception $e2 ) {}

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