<?php

//---------------------------------------------------------------------------------------
// File: classes-backbone.php
// Description: This receives all of the Backbone.js calls for dealing with classes
//				that the user has enrolled in. This includes adding, editing, deleting.
//---------------------------------------------------------------------------------------

// all of the settings we pull from the db.

$classes_yearsBefore = null;
$classes_yearsAfter = null;

// the logged-in user
$LIU = null;

///////////////////////////////////////////////////////////////////////////////
// This validates an enrollment record, before we allow it to be added/updated
// to the database. Any errors encountered trigger an exception. If there is no
// trouble then we return the record that has been updated with extra information.
//
//	@rec - enrollment record from form.
//	@return - 	updated enrollment record on success (semester_order_id, semester_id)
//				exception on failure.
///////////////////////////////////////////////////////////////////////////////

function validateEnrollment($rec) {

	global $classes_yearsBefore;
	global $classes_yearsAfter;

	// make all of the required values present (although perhaps not valid).

	$subject_code = Leftovers::_safeval($rec,"subject_code");
	$rec['subject_code'] = gettype($subject_code) !== "string" ? "" : trim($subject_code);
	
	$class_code = Leftovers::_safeval($rec,"class_code");
	$rec['class_code'] = gettype($class_code) !== "string" ? "" : trim($class_code);
	
	$semester = Leftovers::_safeval($rec,"semester");
	$rec['semester'] = gettype($semester) !== "string" ? "" : trim($semester);
	
	$year = Leftovers::_safeval($rec,"year");
	$rec['year'] = gettype($year) !== "integer" ? 0 : $year;

	$class_name = Leftovers::_safeval($rec,"class_name");
	$rec['class_name'] = gettype($class_name) !== "string" ? null : ( !strlen($class_name) ? null : trim($class_name) );

	$lecturer_name = Leftovers::_safeval($rec,"lecturer_name");
	$rec['lecturer_name'] = gettype($lecturer_name) !== "string" ? null : ( !strlen($lecturer_name) ? null : trim($lecturer_name) );

	$textbook_url = Leftovers::_safeval($rec,"textbook_url");
	$rec['textbook_url'] = gettype($textbook_url) !== "string" ? null : ( !strlen($textbook_url) ? null : trim($textbook_url) );
	
	$completed = Leftovers::_safeval($rec,"completed");
	$rec['completed'] = gettype($completed) !== "integer" ? -1 : (int)!!$completed;

	// (1) subject and class code

	$pattern = "/^[A-Z]{3,6}$/";
	if ( preg_match($pattern,$rec['subject_code']) !== 1 ) {
		throw new Exception("Validation failed (subject code). Rec: ".print_r($rec,true));
	}

	$pattern = "/^[-A-Z0-9.]{3,12}$/";        
	if ( preg_match($pattern,$rec['class_code']) !== 1 ) {
    	throw new Exception("Validation failed (class code). Rec: ".print_r($rec,true));
	}

	// (2) semester

	$query = "SELECT id, order_id FROM ".makeTableName("semesters")." WHERE name = ?;";
	$result = Db::get_instance()->prepared_query($query,array($rec['semester']));

	if ( $result->num_rows !== 1 ) {
		throw new Exception("Validation failed (semester). Rec: ".print_r($rec,true));
	}

	$rec['semester_id'] = $result->rows[0]->id;
	$rec['semester_order_id'] = $result->rows[0]->order_id;

	// (3) year

	date_default_timezone_set('America/Los_Angeles');
	$current_year = (int)date("Y");

	if ( ( $rec['year'] < $current_year-$classes_yearsBefore ) || ( $rec['year'] > $current_year+$classes_yearsAfter ) ) {
		throw new Exception("Validation failed (year). Rec: ".print_r($rec,true));
	}

	// (4) class name

	$rec['class_name'] = Leftovers::simple_name_case($rec['class_name']);
	if ( !empty($rec['class_name']) ) {
		$pattern = "/^[-,+ A-z0-9()']{4,64}$/";
    	if ( preg_match($pattern,$rec['class_name']) !== 1 ) {
        	throw new Exception("Validation failed (class name). Rec: ".print_r($rec,true));
    	}
    }

	// (5) lecturer name

    $rec['lecturer_name'] = Leftovers::name_case($rec['lecturer_name']);
	if ( !empty($rec['lecturer_name']) ) {
		$pattern = "/^[-. A-Za-z0-9()]{4,64}$/";
    	if ( preg_match($pattern,$rec['lecturer_name']) !== 1 ) {
        	throw new Exception("Validation failed (lecturer name). Rec: ".print_r($rec,true));
    	}
    }

	// (6) textbook URL

    $rec['textbook_url'] = Leftovers::crop_url_parms($rec['textbook_url']);
    if ( ( strpos($rec['textbook_url'],"http://") !== 0 ) && ( strpos($rec['textbook_url'],"https://") ) ) {
    	$rec['textbook_url'] = "http://" + $rec['textbook_url'];
    }
	if ( !empty($rec['textbook_url']) ) {
    	// source: http://php.net/manual/en/function.filter-var.php
    	// source: http://ca1.php.net/manual/en/filter.filters.validate.php
    	if ( filter_var($rec['textbook_url'], FILTER_VALIDATE_URL, FILTER_FLAG_PATH_REQUIRED) === false ) {
        	throw new Exception("Validation failed (textbook). Rec: ".print_r($rec,true));
    	}
    }

    // (7) completed

    if ( ( $rec['completed'] < 0 ) || ( $rec['completed'] > 1 ) ) {
    	throw new Exception("Validation failed (completed). Rec: ".print_r($rec,true));
    }
    
	// okay, we have succeeded. return the record
	return $rec;
}

///////////////////////////////////////////////////////////////////////////////
// The information in our enrollment record has already been validated. We will
// now attempt to add it into the database.
//
//	@rec - the attributes of the enrollment record. updated with .id on success.
//	@userRecord - the user in question
//	@return - exception (one of two types) on failure. nothing on success.
///////////////////////////////////////////////////////////////////////////////

function addEnrollment(&$rec,$userRecord) {

	//	We have been sent a new enrollment record for the logged in user.
	//	Before adding the enrollment record, we will check many things:
	//	1) Does the subject exist?
	//	2) Does the class exist?
	//	3) Does the module exist?
	//	4) Does the enrollment exist?
	//
	//	We create whatever answers 'no' to those questions. If there is
	//	nothing to create then we're already enrolled. Obviously we will
	//	do this as part of a transaction, so it's all cancelled if a problem
	//	occurs.

	$db = Db::get_instance();
	$db->begin_transaction();

	try {

		// lock the tables that we're going to be working with (no choice here, if we work with a table when under lockdown, we have to lock it ourselves). this will freeze any
	    // users on other connections that are trying to use any of the tables. the reason we do this here is that the records we're working with are "shared" by everyone, in
	    // other words, any user can add/delete these records (indirectly, by adding/removing a class). and so we want to be sure that this user is given full control.

	    $query = "LOCK TABLES ".makeTableName("subjects")." WRITE, ".makeTableName("subjects")." AS subjects WRITE, ".makeTableName("classes")." WRITE, ".makeTableName("classes")." AS classes WRITE, ".makeTableName("modules")." WRITE, ".makeTableName("modules")." AS modules WRITE, ".makeTableName("enrollment")." WRITE;";
	    $result = $db->query($query); // this returns 0 affected rows on success

	    // how many records (e.g., new subject code) we've had to add in order to
	    // create the enrollment record in the db.	    
		$added = 0;

		// (1) subjects -> id

		$subject_id = null;

		$query = "SELECT id FROM ".makeTableName("subjects")." WHERE code = ?;";
		$result = $db->prepared_query($query,array($rec['subject_code']));

		if ( !$result->num_rows ) {

			$query = "INSERT IGNORE INTO ".makeTableName("subjects")." (code) VALUES (?);\n";
			$result = $db->prepared_query($query,array($rec['subject_code']));

			if ( $result->affected_rows ) {
				$added++;
				$subject_id = $result->insert_id;
			}
			else {
				throw new Exception("Failed to create `subject_id`. Rec: ".print_r($rec,true));
			}
		}
		else {
			$subject_id = $result->rows[0]->id;
		}

		// (2) classes -> id

		$class_id = null;

		$query = "SELECT id FROM ".makeTableName("classes")." WHERE subject_id = ? AND code = ?;";
		$result = $db->prepared_query($query,array($subject_id,$rec['class_code']));

		if ( !$result->num_rows ) {

			// source for unique composites: http://stackoverflow.com/questions/2219786/best-way-to-avoid-duplicate-entry-into-mysql-database
			$query = 	"INSERT IGNORE INTO ".makeTableName("classes")." (subject_id,code) \n";
			$query .=	"SELECT subjects.id, ? FROM ".makeTableName("subjects")." AS subjects \n";
			$query .=	"WHERE subjects.id = ?;";
			$result = $db->prepared_query($query,array($rec['class_code'],$subject_id));

			if ( $result->affected_rows ) {
				$added++;
				$class_id = $result->insert_id;
			}
			else {
				throw new Exception("Failed to create `class_id`. Rec: ".print_r($rec,true));
			}			
		}
		else {
			$class_id = $result->rows[0]->id;
		}		

		// (3) modules -> id

		$module_id = null;

		$query = "SELECT id FROM ".makeTableName("modules")." WHERE class_id = ? AND semester_id = ? AND year = ?;";
		$result = $db->prepared_query($query,array($class_id,$rec['semester_id'],$rec['year']));
		if ( !$result->num_rows ) {

			$query = 	"INSERT IGNORE INTO ".makeTableName("modules")." (class_id,semester_id,year) \n";
			$query .=	"SELECT classes.id, ?, ? FROM ".makeTableName("classes")." AS classes \n";
			$query .=	"WHERE classes.id = ?;";
			$result = $db->prepared_query($query,array($rec['semester_id'],$rec['year'],$class_id));

			if ( $result->affected_rows ) {
				$added++;
				$module_id = $result->insert_id;
			}
			else {			
				throw new Exception("Failed to create `module_id`. Rec: ".print_r($rec,true));
			}			
		}
		else {
			$module_id = $result->rows[0]->id;
		}

		// (4) enrollment

		$enrollment_id = null;

		$query =	"INSERT IGNORE INTO ".makeTableName("enrollment")." (user_id,module_id,class_name,lecturer_name,textbook_url,completed) \n";
		$query .=	"SELECT ?, modules.id, ?, ?, ?, ? FROM ".makeTableName("modules")." AS modules \n";
		$query .=	"WHERE modules.id = ?;";
		$result = $db->prepared_query($query,array($userRecord->id,$rec['class_name'],$rec['lecturer_name'],$rec['textbook_url'],$rec['completed'],$module_id));

		if ( !$result->affected_rows ) {
			// the client needs to be able to differentiate this error
			throw new ServerClientException(
				"Failed to create `enrollment_id`.\nRec: ".print_r($rec,true)."\nUser:".print_r($userRecord,true),
				createParsedErrorString("enrollment",null)
			);
		}

		$rec['id'] = $result->insert_id;

		// (5) Completed.
		// Okay, we have completed our enrollment. we can now commit our changes. We then have to unlock our tables.

		$db->commit();

		$query = "UNLOCK TABLES;";
        try { $result = $db->query($query); } // returns 0 rows on success
        catch ( Exception $e2 ) {}

		$db->end_transaction();
	}
	catch ( Exception $e ) {
		
		$db->rollback(); // no effect if nothing to rollback

		// unlock our tables. this has no effect if the tables weren't
        // able to be locked in the first place.

        $query = "UNLOCK TABLES;";
        try { $result = $db->query($query); } // no effect if nothing to unlock
        catch ( Exception $e2 ) {}
		
		try { $db->end_transaction(); }
		catch ( Exception $e3 ) {}

		throw $e;
	}
}

///////////////////////////////////////////////////////////////////////////////
// This updates an enrollment record, based upon the values sent. Notice that
// the values sent are not checked for types or validated in any way, so do
// that before calling.
//
//	@return - nothing. exception on failure
///////////////////////////////////////////////////////////////////////////////

function updateEnrollment($rec,$userRecord) {

	// the most common way for this to fail is if the values have not changed. if that's
	// the case then the request should never have been sent. if it was, then that's
	// a problem.

	$query =	"UPDATE ".makeTableName("enrollment")." SET class_name = ?, lecturer_name = ?, textbook_url = ?, completed = ? \n";
	$query .=	"WHERE id = ? AND user_id = ?;";
	$result = Db::get_instance()->prepared_query($query,array($rec['class_name'],$rec['lecturer_name'],$rec['textbook_url'],$rec['completed'],$rec['id'],$userRecord->id));

	if ( $result->affected_rows !== 1 ) {
		throw new Exception("Failed to update enrollment. \nRec: ".print_r($rec,true)." \nUser: ".print_r($userRecord,true));
	}
}

///////////////////////////////////////////////////////////////////////////////
// This removes an enrollment record. However, we may also remove:
//
//	- Module (if not used in other enrollments)
//	- Class (if not used in other modules)
//	- Subject (if not used in other classes)
//
//	However, we cannot remove the enrollment if the user has ANY material
//	stored in the db that references that enrollment - e.g., sets. Or if
//	they are in a studygroup for that class.
//
//	@enrollment_id - the id of the enrollment record we are removing
//	@userRecord - the user in question
//	@return - nothing. throws exception on failure
///////////////////////////////////////////////////////////////////////////////

function removeEnrollment($enrollment_id,$userRecord) {

	$db = Db::get_instance();

	// before we will try to delete the enrollment-related rows, let's first ensure
	// that the user does not reference that enrollment in any of their material in
	// the db.

	$query = "SELECT id FROM ".makeTableName("sets")." WHERE enrollment_id = ?;";
	$result = $db->prepared_query($query,array($enrollment_id));
	if ( $result->num_rows ) {
		throw new ServerClientException(
			"User trying to remove enrollment (".$enrollment_id.") when sets are still present. \nUser: ".print_r($userRecord,true),
			createParsedErrorString("set",$result->num_rows)
		);
	}

	$query = "SELECT id FROM ".makeTableName("tests")." WHERE enrollment_id = ?;";
	$result = $db->prepared_query($query,array($enrollment_id));
	if ( $result->num_rows ) {
		throw new ServerClientException(
			"User trying to remove enrollment (".$enrollment_id.") when tests are still present. \nUser: ".print_r($userRecord,true),
			createParsedErrorString("test",$result->num_rows)
		);
	}

	// ensure the user is not in a group for that class

	$query = 	"SELECT groupsworking.id FROM ".makeTableName("groups")." AS groupsworking \n";
	$query .=	"INNER JOIN ".makeTableName("enrollment")." AS ownerEnroll ON ownerEnroll.id = groupsworking.enrollment_id \n";
	$query .=	"INNER JOIN ".makeTableName("enrollment")." AS removerEnroll ON removerEnroll.id = ? AND removerEnroll.module_id = ownerEnroll.module_id \n";
	$query .=	"INNER JOIN ".makeTableName("group_membership")." AS member ON member.group_id = groupsworking.id AND member.user_id = removerEnroll.user_id;";
	$result = $db->prepared_query($query,array($enrollment_id));
	if ( $result->num_rows ) {
		throw new ServerClientException(
			"User trying to remove enrollment (".$enrollment_id.") when still in a group. \nUser: ".print_r($userRecord,true),
			createParsedErrorString("group",$result->num_rows)
		);
	}

	$db->begin_transaction();

	try {

		// lock the tables that we're going to be working with (no choice here, if we work with a table when under lockdown, we have to lock it ourselves). this will freeze any
	    // users on other connections that are trying to use any of the tables. the reason we do this here is that the records we're working with are "shared" by everyone, in
	    // other words, any user can add/delete these records (indirectly, by adding/removing a class). and so we want to be sure that this user is given full control.

	    $query = "LOCK TABLES ".makeTableName("subjects")." WRITE, ".makeTableName("subjects")." AS subjects WRITE, ".makeTableName("classes")." WRITE, ".makeTableName("classes")." AS classes WRITE, ".makeTableName("modules")." WRITE, ".makeTableName("modules")." AS modules WRITE, ".makeTableName("enrollment")." WRITE, ".makeTableName("enrollment")." AS enrollment WRITE;";
	    $result = $db->query($query); // this returns 0 affected rows on success

	    // (1) get the module_id, class_id, and subject_id that relate to the enrollment record before deleting it

	    $query = 	"SELECT subjects.id AS subject_id, classes.id AS class_id, modules.id AS module_id FROM ".makeTableName("enrollment")." AS enrollment \n";
	    $query .=	"INNER JOIN ".makeTableName("modules")." AS modules ON enrollment.module_id = modules.id \n";
	    $query .=	"INNER JOIN ".makeTableName("classes")." AS classes ON modules.class_id = classes.id \n";
	    $query .=	"INNER JOIN ".makeTableName("subjects")." AS subjects ON classes.subject_id = subjects.id \n";
	    $query .=	"WHERE enrollment.id = ? AND enrollment.user_id = ?;";

	    $result = $db->prepared_query($query,array($enrollment_id,$userRecord->id));
	    if ( $result->num_rows != 1 ) {
	    	throw new Exception("Enrollment lookup failed. ID: ".$enrollment_id." User: ".print_r($userRecord,true));
	    }

	    $module_id = $result->rows[0]->module_id;
	    $class_id = $result->rows[0]->class_id;
	    $subject_id = $result->rows[0]->subject_id;

		// (2) remove the enrollment record

		$query = "DELETE FROM ".makeTableName("enrollment")." WHERE id = ?;";
		$result = $db->prepared_query($query,array($enrollment_id));

		if ( $result->affected_rows != 1 ) {
			throw new Exception("Failed to delete enrollment_id (".$enrollment_id.")");
		}

		// (3) let's see if we need to remove the module too. if so, then we'll check for class. if that too, we'll check for subject.
		// notice that we're still assuming that the "to delete" enrollment record is present, as since we're in a transaction the
		// record will not be deleted until the transaction is committed.

		$query = 	"DELETE modules FROM ".makeTableName("modules")." AS modules \n";
		$query .=	"LEFT JOIN ".makeTableName("enrollment")." AS enrollment ON modules.id = enrollment.module_id AND enrollment.id != ? \n";
		$query .=	"WHERE modules.id = ? AND enrollment.module_id IS NULL;";
		$result = $db->prepared_query($query,array($enrollment_id,$module_id));

		if ( $result->affected_rows ) {

			$query = 	"DELETE classes FROM ".makeTableName("classes")." AS classes \n";
			$query .=	"LEFT JOIN ".makeTableName("modules")." AS modules ON classes.id = modules.class_id AND modules.id != ? \n";
			$query .=	"WHERE classes.id = ? AND modules.class_id IS NULL;";
			$result = $db->prepared_query($query,array($module_id,$class_id));

			if ( $result->affected_rows ) {

				$query = 	"DELETE subjects FROM ".makeTableName("subjects")." AS subjects \n";
				$query .=	"LEFT JOIN ".makeTableName("classes")." AS classes ON subjects.id = classes.subject_id AND classes.id != ? \n";
				$query .=	"WHERE subjects.id = ? AND classes.subject_id IS NULL;";
				$result = $db->prepared_query($query,array($class_id,$subject_id));
			}
		}
		
		// (5) Completed.
		// Okay, we have completed our enrollment. we can now commit our changes. We then have to unlock our tables.

		$db->commit();

		$query = "UNLOCK TABLES;";
        try { $result = $db->query($query); } // returns 0 rows on success
        catch ( Exception $e2 ) {}

		$db->end_transaction();
	}
	catch ( Exception $e ) {
		
		$db->rollback(); // no effect if nothing to rollback

		// unlock our tables. this has no effect if the tables weren't
        // able to be locked in the first place.

        $query = "UNLOCK TABLES;";
        try { $result = $db->query($query); } // no effect if nothing to unlock
        catch ( Exception $e2 ) {}
		
		try { $db->end_transaction(); }
		catch ( Exception $e3 ) {}

		throw $e;
	}
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

try {	

	setupTableNames();

	$classes_yearsBefore = (int)DbSettings::get_instance()->get_setting("classes_yearsBefore");
	$classes_yearsAfter = (int)DbSettings::get_instance()->get_setting("classes_yearsAfter");

	$request_method = $_SERVER['REQUEST_METHOD'];
	$rdata = Leftovers::get_RESTful_data();
	$parms = Leftovers::explode_path_info();
	$num_parms = count($parms);

	$LIU = verifySessionAndUserStatus();

	// SECTION: Adding a new enrollment
	//

	if ( $request_method === "POST" ) {

		// the user must have a status above probation for this.
		$userStatusProbation = (int)DbSettings::get_instance()->get_setting("user_status_probation");
		if ( $LIU->status <= $userStatusProbation ) {
			throw new Exception("Probation user trying to add a class. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		}

		// there is no justifyable user error that
		// can be made here. the fields should have
		// been validated on the client. if they get
		// through in an invalid form, something is wrong.
		$rdata = validateEnrollment($rdata);

		// if they are trying to enroll in a class for the
		// second time, this can fail.
		addEnrollment($rdata,$LIU);

		// if we're here, we've been successful. let's send back
		// the attributes of the enrollment, which has been
		// updated with some good stuff in here.
		
		$ret = null;				
		$ret = $rdata;

		Activity::add_to_db("add.enrollment","User: ".print_r($LIU,true)."\nData: ".print_r($rdata,true),"high");
		Quit::get_instance()->json_exit($ret);
	}

	// SECTION: Updating an enrollment in full
	//
	// e.g., enrollment.php/51

	else if ( $request_method === "PUT" ) {

		if ( $num_parms !== 1 ) {
			throw new Exception("Did not receive ID for PUT. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		}
		
		$rdata = validateEnrollment($rdata);
		$id = (int)$parms[0];

		if ( $rdata['id'] !== $id ) {
			throw new Exception("ID did not match record sent for PUT. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		}

		updateEnrollment($rdata,$LIU);
		Activity::add_to_db("update.enrollment","User: ".print_r($LIU,true)."\nData: ".print_r($rdata,true),"very low");
		Quit::get_instance()->json_exit(null);
	}

	// SECTION: Deleting an enrollment record
	//

	else if ( $request_method === "DELETE" ) {

		if ( $num_parms !== 1 ) {
			// note: $rdata should be empty
			throw new Exception("Did not receive ID for DELETE. Parms: ".print_r($parms,true)." Data: ".print_r($rdata,true));
		}

		$id = $parms[0];
		removeEnrollment($id,$LIU);

		Activity::add_to_db("remove.enrollment","User: ".print_r($LIU,true)."\nData: ".print_r($rdata,true),"high");
		Quit::get_instance()->json_exit(null);
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