<?php

//---------------------------------------------------------------------------------------
// Include: classes.inc.php
// Description: Standalone functions that relate to enrollment queries and will be required
//				by multiple files.
//---------------------------------------------------------------------------------------

///////////////////////////////////////////////////////////////////////////////
// Get all of the enrollment records for a given user. They are sorted
// by completed, year, semester, subject code, class code
//
//	@includeCompleted - if not TRUE, we ignore any class that is marked as
//						`completed`.
//
//	@return - array of records
///////////////////////////////////////////////////////////////////////////////

function getEnrollmentForUser($userID,$includeCompleted) {

	$completedQueryStr = "1";
	if ( !$includeCompleted ) {
		$completedQueryStr = "enrollment.completed = 0";
	}

	$query = 	"SELECT enrollment.id AS id, enrollment.module_id AS module_id, subjects.code AS subject_code, classes.code AS class_code, semesters.name AS semester, semesters.order_id AS semester_order_id, semesters.description AS semester_description, \n";
	$query .=	"	modules.year, enrollment.class_name, enrollment.lecturer_name, enrollment.textbook_url, enrollment.completed \n";
	$query .=	"FROM ".makeTableName("enrollment")." AS enrollment \n";
	$query .=	"INNER JOIN ".makeTableName("modules")." AS modules ON enrollment.module_id = modules.id \n";
	$query .=	"INNER JOIN ".makeTableName("semesters")." AS semesters ON modules.semester_id = semesters.id \n";
	$query .=	"INNER JOIN ".makeTableName("classes")." AS classes ON modules.class_id = classes.id \n";
	$query .=	"INNER JOIN ".makeTableName("subjects")." AS subjects ON classes.subject_id = subjects.id \n";
	$query .=	"WHERE enrollment.user_id = ? AND (" . $completedQueryStr . ") \n";;
	$query .=	"ORDER BY enrollment.completed ASC, modules.year DESC, semesters.order_id DESC, subjects.code ASC, classes.code ASC;";

	$result = Db::get_instance()->prepared_query($query,array($userID));
	return $result->rows;
}