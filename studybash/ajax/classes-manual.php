<?php

//---------------------------------------------------------------------------------------
// File: classes-manual.php
// Description: This receives all of the non-backbone related calls for dealing with classes.
//				At the moment, that is only GETting.
//---------------------------------------------------------------------------------------

// all the settings we pull out of the db

$enrollment_minStudents = null;
$enrollment_numSuggestions = null;
$classes_yearsBefore = null;
$classes_yearsAfter = null;

// the logged-in user
$LIU = null;

///////////////////////////////////////////////////////////////////////////////
// Here we get all of the subject/class combos that anyone has enrolled in.
// We also grab the number of students that are enrolled in total as well as
// breaking it down by year and semester (for a given year). The data structure
// returned is substantially large. Check code for comments.
//
//	@return - dictionary. KEY = subj/class combo. VALUE = object [see below]
//
///////////////////////////////////////////////////////////////////////////////

function getEnrollmentNumbersForAllClasses() {

	global $enrollment_minStudents;
	global $classes_yearsBefore;
	global $classes_yearsAfter;

	// we have to do this in three stages, because we do not want users that are enrolled in the
	// same class multiple times to be counted at the higher stages.

	// (1) total students enrolled in a class - ignoring year/semester

	$query =	"SELECT subject_code, class_code, COUNT(*) AS num_enrolled, SUM(has_admin) AS has_admin \n";
	$query .=	"FROM ( \n";

	// this pulls out a list of all the classes that users are enrolled in. as we group by subject/class/user, there will
	// only be one row per class per user (e.g., if user X enrolled in PSYC 300 twice, they only return 1 row here).

	$query .=	"	SELECT subjects.code AS subject_code, classes.code AS class_code, user_id, user_id = 1 AS has_admin FROM ".makeTableName("enrollment")." AS enroll \n";
	$query .=	"	INNER JOIN ".makeTableName("modules")." AS modules ON modules.id = enroll.module_id \n";
	$query .=	"	INNER JOIN ".makeTableName("classes")." AS classes ON classes.id = modules.class_id \n";
	$query .=	"	INNER JOIN ".makeTableName("subjects")." AS subjects ON subjects.id = classes.subject_id \n";
	$query .=	"	GROUP BY subject_code, class_code, user_id \n";
	$query .=	") AS unique_enroll \n";
	$query .=	"GROUP BY subject_code, class_code \n";
	$query .=	"ORDER BY subject_code, class_code;";	
	$result = Db::get_instance()->prepared_query($query,array());	

	// we are constructing a big data structure here:
	//
	// (1) dictionary. KEY = subj/class combo. VALUE = object.
	// (2) object. COUNT = total for class. HAS_ADMIN = admin enrolled in class? YEARS = dictionary.
	// (3) dictionary. KEY = year. VALUE = object.
	// (4) object. COUNT = total for year. SEMESTERS = dictionary.
	// (5) dictionary. KEY = semester name. VALUE = total for semester, in that year.

	// this is step #1 and #2.

	$enrollment = array();
	foreach ( $result->rows as $row ) {

		$code = $row->subject_code . " " . $row->class_code;

		$enrollment[$code] = new stdClass();
		$enrollment[$code]->count = $row->num_enrolled;
		$enrollment[$code]->has_admin = $row->has_admin;
		$enrollment[$code]->years = array();
	}

	// (2) students enrolled in a class for a given year - ignoring semester
	
	// first we build up query for all of the years that the user can choose from. this will
	// be used in the next two steps.

	date_default_timezone_set('America/Los_Angeles');
	$current_year = (int)date("Y");

	$queryYearStr = "";
	$queryYearAry = array();
	
	for ( $year=$current_year-$classes_yearsBefore; $year <= $current_year+$classes_yearsAfter; $year++ ) {
		if ( strlen($queryYearStr) ) {
			$queryYearStr .= ",";
		}
		$queryYearStr .= "?";
		$queryYearAry[] = $year;
	}

	if ( !count($queryYearAry) ) {
		throw new Exception("No years found for enrollment list building.");
	}

	$query =	"SELECT subject_code, class_code, year, COUNT(*) AS num_enrolled \n";
	$query .=	"FROM ( \n";

	// this pulls out a list of all the classes that users are enrolled in for each year. as we group by subject/class/year/user, there will
	// only be one row per class per year per user (e.g., if user X enrolled in PSYC 300 twice in 2013, they only return 1 row here).

	$query .=	"	SELECT subjects.code AS subject_code, classes.code AS class_code, modules.year, user_id FROM ".makeTableName("enrollment")." AS enroll \n";
	$query .=	"	INNER JOIN ".makeTableName("modules")." AS modules ON modules.id = enroll.module_id \n";
	$query .=	"	INNER JOIN ".makeTableName("classes")." AS classes ON classes.id = modules.class_id \n";
	$query .=	"	INNER JOIN ".makeTableName("subjects")." AS subjects ON subjects.id = classes.subject_id \n";
	$query .=	"	WHERE modules.year IN (".$queryYearStr.") \n";
	$query .=	"	GROUP BY subject_code, class_code, year, user_id \n";
	$query .=	") AS unique_enroll \n";

	// now group them just by year, so we get a total number for the year.
	$query .=	"GROUP BY subject_code, class_code, year \n";
	$query .=	"ORDER BY subject_code, class_code, year;";	
	$result = Db::get_instance()->prepared_query($query,$queryYearAry);

	// this is step #3 and #4 for our big data structure (see above).

	foreach ( $result->rows as $row ) {

		$code = $row->subject_code . " " . $row->class_code;
		$class = $enrollment[$code];

		$year = $row->year;
		$class->years[$year] = new stdClass();
		$class->years[$year]->count = $row->num_enrolled;
		$class->years[$year]->semesters = array();
	}

	// (3) students enrolled in a class for a given semester, in a particular year

	$query =	"SELECT subject_code, class_code, year, semester, COUNT(*) AS num_enrolled \n";
	$query .=	"FROM ( \n";

	// this pulls out a list of all the classes that users are enrolled in for a given semester, in a given year. as we group by subject/class/year/semester/user, there will
	// only be one row per class per year per semester per user. of course, there can't be the same user twice in a given class in a given semester anyway, so
	// grouping isn't needed here, but we'll do it anyway.

	$query .=	"	SELECT subjects.code AS subject_code, classes.code AS class_code, modules.year, semesters.name AS semester, user_id FROM ".makeTableName("enrollment")." AS enroll \n";
	$query .=	"	INNER JOIN ".makeTableName("modules")." AS modules ON modules.id = enroll.module_id \n";
	$query .=	"	INNER JOIN ".makeTableName("semesters")." AS semesters ON semesters.id = modules.semester_id \n";
	$query .=	"	INNER JOIN ".makeTableName("classes")." AS classes ON classes.id = modules.class_id \n";
	$query .=	"	INNER JOIN ".makeTableName("subjects")." AS subjects ON subjects.id = classes.subject_id \n";
	$query .=	"	WHERE modules.year IN (".$queryYearStr.") \n";
	$query .=	"	GROUP BY subject_code, class_code, year, semester, user_id \n";
	$query .=	") AS unique_enroll \n";

	// now group them by semester, so we get a total number for the semester
	$query .=	"GROUP BY subject_code, class_code, year, semester \n";
	$query .=	"ORDER BY subject_code, class_code, year, semester;";	
	$result = Db::get_instance()->prepared_query($query,$queryYearAry);

	// this is step #5 for our big data structure (see above).

	foreach ( $result->rows as $row ) {

		$code = $row->subject_code . " " . $row->class_code;
		$class = $enrollment[$code];

		$year = $row->year;
		$class_year = $class->years[$year];

		$semester = $row->semester;
		$class_year->semesters[$semester] = $row->num_enrolled;
	}	

	// (4) now, if any class does not meet the minimum requirements, we will remove it from our list.
	
	$failed = array();
	foreach ( $enrollment as $code => $class ) {
		if ( ( $class->count < $enrollment_minStudents ) && ( !$class->has_admin ) ) {
			$failed[] = $code;
		}
	}

	foreach ( $failed as $code ) {
		unset($enrollment[$code]);
	}

	return $enrollment;
}

///////////////////////////////////////////////////////////////////////////////
// We are given a module_id and we want to return the top N number of choices
// for class_name, lecturer_name, and textbook_url.
//
//	@class_info: 	object with .subject_code, .class_code, .year, .semester.
//
//	@return - 	dictionary with keys "class_name", "lecturer_name", and 
//				"textbook_url". each value is an array of objects. fields are
//				.text and .num_used.
//
///////////////////////////////////////////////////////////////////////////////

function getEnrollmentSuggestions($class_info) {

	global $enrollment_numSuggestions;
	global $enrollment_suggestions_minStudents;

	if ( 
			!array_key_exists("subject_code",$class_info) ||
			!array_key_exists("class_code",$class_info) ||
			!array_key_exists("semester",$class_info) ||
			!array_key_exists("year",$class_info)
		)
	{
		throw new Exception("Missing `class_info` value(s): ".print_r($class_info,true));
	}

	$suggestions = array();
	$suggestions["class_name"] = array();
	$suggestions["lecturer_name"] = array();
	$suggestions["textbook_url"] = array();

	// pull out the `module_id` for this particular class info.

	$query = 	"SELECT modules.id FROM ".makeTableName("modules")." AS modules \n";
	$query .= 	"INNER JOIN ".makeTableName("semesters")." AS semesters ON semesters.name = ? AND semesters.id = modules.semester_id \n";
	$query .= 	"INNER JOIN ".makeTableName("classes")." AS classes ON classes.code = ? AND classes.id = modules.class_id \n";
	$query .= 	"INNER JOIN ".makeTableName("subjects")." AS subjects ON subjects.code = ? AND subjects.id = classes.subject_id \n";
	$query .=	"WHERE modules.year = ?;";
	$result = Db::get_instance()->prepared_query($query,array($class_info['semester'],$class_info['class_code'],$class_info['subject_code'],$class_info['year']));

	// if there is no module that matches that class_info, then our suggestions are empty.
	if ( $result->num_rows !== 1 ) {
		return $suggestions;
	}

	$module_id = $result->rows[0]->id;

	// class_name

	$query =	"SELECT class_name AS text, SUM(user_id = 1) AS admin_suggestion, COUNT(*) AS num_used FROM ".makeTableName("enrollment")." AS enroll \n";
	$query .=	"WHERE enroll.module_id = ? AND enroll.class_name IS NOT NULL \n";
	$query .=	"GROUP BY text \n";	
	$query .=	"HAVING admin_suggestion OR num_used >= ? \n";
	$query .=	"ORDER BY num_used DESC, text;";
	$result = Db::get_instance()->prepared_query($query,array($module_id,$enrollment_suggestions_minStudents));

	$used = 0;	
	foreach ( $result->rows as $row ) {
		if ( $used === $enrollment_numSuggestions ) {
			break;
		}
		unset($row->admin_suggestion);
		$suggestions["class_name"][] = $row;
	}

	// lecturer_name

	$query =	"SELECT lecturer_name AS text, SUM(user_id = 1) AS admin_suggestion, COUNT(*) AS num_used FROM ".makeTableName("enrollment")." AS enroll \n";
	$query .=	"WHERE enroll.module_id = ? AND enroll.lecturer_name IS NOT NULL \n";
	$query .=	"GROUP BY text \n";	
	$query .=	"HAVING admin_suggestion OR num_used >= ? \n";
	$query .=	"ORDER BY num_used DESC, text;";
	$result = Db::get_instance()->prepared_query($query,array($module_id,$enrollment_suggestions_minStudents));

	$used = 0;	
	foreach ( $result->rows as $row ) {
		if ( $used === $enrollment_numSuggestions ) {
			break;
		}
		$suggestions["lecturer_name"][] = $row;
	}

	// textbook_url

	$query =	"SELECT textbook_url AS text, SUM(user_id = 1) AS admin_suggestion, COUNT(*) AS num_used FROM ".makeTableName("enrollment")." AS enroll \n";
	$query .=	"WHERE enroll.module_id = ? AND enroll.textbook_url IS NOT NULL \n";
	$query .=	"GROUP BY text \n";
	$query .=	"HAVING admin_suggestion OR num_used >= ? \n";
	$query .=	"ORDER BY num_used DESC, text;";	
	$result = Db::get_instance()->prepared_query($query,array($module_id,$enrollment_suggestions_minStudents));

	$used = 0;	
	foreach ( $result->rows as $row ) {
		if ( $used === $enrollment_numSuggestions ) {
			break;
		}
		$suggestions["textbook_url"][] = $row;
	}

	return $suggestions;
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

try {	

	setupTableNames();
	
	$enrollment_minStudents = (int)DbSettings::get_instance()->get_setting("enrollment_minStudents");
	$classes_yearsBefore = (int)DbSettings::get_instance()->get_setting("classes_yearsBefore");
	$classes_yearsAfter = (int)DbSettings::get_instance()->get_setting("classes_yearsAfter");
	$enrollment_numSuggestions = (int)DbSettings::get_instance()->get_setting("enrollment_numSuggestions");;
	$enrollment_suggestions_minStudents = (int)DbSettings::get_instance()->get_setting("enrollment_suggestions_minStudents");;

	$request_method = $_SERVER['REQUEST_METHOD'];
	$rdata = Leftovers::get_RESTful_data();
	$parms = Leftovers::explode_path_info();
	$num_parms = count($parms);

	$LIU = verifySessionAndUserStatus();

	// SECTION: foruser
	//
	//	Getting all of the enrollment records for a given user.
	//

	if ( ( $request_method === "GET" ) && ( $num_parms === 2 ) && ( $parms[0] === "foruser" ) ) {

		$id = (int)$parms[0];
		if ( $LIU->id !== $id ) {
			throw new Exception("Mismatch between sent userID and session. \nSent: ".$parms[0]." \nSession: ".print_r($LIU,true));
		}		

		$ret = getEnrollmentForUser($id);		
		Quit::get_instance()->json_exit($ret);
	}

	// SECTION: init
	//
	//	Getting several things, when entering the "classes" section.
	//
	//	(1) A list of all the classes that our user is enrolled in
	//	(2) A list of classes that ANYONE is enrolled in (and how many - by class, year, semester).
	//

	else if ( ( $request_method === "POST" ) && ( $num_parms === 1 ) && ( $parms[0] === "init" ) ) {

		$id = (int)$rdata;
		if ( $LIU->id !== $id ) {
			throw new Exception("Mismatch between sent userID and session. \nSent: ".$parms[0]." \nSession: ".print_r($LIU,true));
		}

		$ret = null;
		$ret['userEnrollment'] = getEnrollmentForUser($id,true);
		$ret['generalEnrollment'] = getEnrollmentNumbersForAllClasses();
		Quit::get_instance()->json_exit($ret);
	}		

	// SECTION: Getting suggestions for class_name, lecturer_name, textbook_url for a given module.
	//

	else if ( ( $request_method === "POST" ) && ( $num_parms === 1 ) && ( $parms[0] === "suggestions" ) ) {		

		$ret = getEnrollmentSuggestions($rdata);
		Quit::get_instance()->json_exit($ret);
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