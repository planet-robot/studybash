<?php

//---------------------------------------------------------------------------------------
// Include: tests.inc.php
// Description: This file includes any function that is used by more than one .php file in
//				the "Tests" section of the site (i.e., browse tests and take test).
//---------------------------------------------------------------------------------------

///////////////////////////////////////////////////////////////////////////////
// This validates a test before we allow it to be added/updated to the db.
// Any errors encountered trigger an exception, as everything should have been
// caught by the client.
//
//	@rec - test attributes, from a form.
//	@return - verified test attributes (trimmed, etc.)
///////////////////////////////////////////////////////////////////////////////

function validateTest(&$rec) {

	global $sharing_types;

	// ensure all of the required values present (although perhaps not valid).

	$test_name = Leftovers::_safeval($rec,"test_name");
	$rec['test_name'] = gettype($test_name) !== "string" ? "" : trim($test_name);
	
	$description = Leftovers::_safeval($rec,"description");
	$rec['description'] = gettype($description) !== "string" ? null : ( !strlen($description) ? null : trim($description) );
	
	$sharing = Leftovers::_safeval($rec,"sharing");
	$rec['sharing'] = gettype($sharing) !== "string" ? "" : trim($sharing);
	
	$keywords = Leftovers::_safeval($rec,"keywords");
	$rec['keywords'] = gettype($keywords) !== "array" ? array() : $keywords;

	$tags = Leftovers::_safeval($rec,"tags");
	$rec['tags'] = gettype($tags) !== "array" ? array() : $tags;

	$setIDs = Leftovers::_safeval($rec,"setIDs");
	$rec['setIDs'] = gettype($setIDs) !== "array" ? array() : $setIDs;

	// (1) name

	$pattern = "/^[-!.,& A-z0-9'\"()\\[\\]]{1,32}$/";
	if ( preg_match($pattern,$rec['test_name']) !== 1 ) {
		throw new Exception("Validation failed (test_name). Rec: ".print_r($rec,true));
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

    // (4) tags - ensure they are valid tags and there are no duplicates.

    if ( count($rec['tags']) ) {

	    $queryStr = "";
	    $queryAry = array();

	    foreach ( $rec['tags'] as $tag ) {

	    	if ( strlen($queryStr) ) {
	    		$queryStr .= ",";
	    	}

	    	$queryStr .= "?";
	    	$queryAry[] = $tag;
	    }    

	    $query = "SELECT id FROM sb_tags WHERE id IN (".$queryStr.") GROUP BY id;";
	    $result = Db::get_instance()->prepared_query($query,$queryAry);

	    if ( $result->num_rows !== count($rec['tags']) ) {
	    	throw new Exception("Validation failed (invalid tag(s) or duplicates). Rec: ".print_r($rec,true));
	    }
	}

	// (5) keywords - ensure no duplicates

    if ( count($rec['keywords']) ) {

	    $duplicates = array();
	    foreach ( $rec['keywords'] as $keyword ) {

	    	if ( array_key_exists($keyword,$duplicates) ) {
	    		throw new Exception("Validation failed (keyword duplicate). Rec: ".print_r($rec,true));
	    	}

	    	$duplicates[$keyword] = true;
	    }
	}

    // (6)	setIDs - ensure there is at least one and that there are no duplicates.
    //		notice that we aren't going to ensure that the user has access to the sets
    //		involved. this is because this check is done everytime they view/take the test
    //		and so it's pointless to do it here. also, we don't want to prevent someone
    //		from saving a test that might, only temporarily, include sets that were made
    //		private (etc.)

    if ( !count($setIDs) ) {
    	throw new Exception("Validation failed (setIDs empty). Rec: ".print_r($rec,true));
    }

    $duplicates = array();
    foreach ( $setIDs as $setID ) {

    	if ( array_key_exists($setID,$duplicates) ) {
    		throw new Exception("Validation failed (setIDs duplicate(s)). Rec: ".print_r($rec,true));
    	}

    	$duplicates[$setID] = true;
    }

	// okay, we have succeeded. return the record
	return $rec;
}

///////////////////////////////////////////////////////////////////////////////
// Compress all of the array fields into strings. No error checking is done
// at this point because it has already been done earlier, except for ensuring
// that there aren't any spaces in any of the compressed string fields.
//
//	@return - updated test attributes (i.e., zipped)
///////////////////////////////////////////////////////////////////////////////

function zipFields($rec) {
	
	$keywords = implode("|",$rec['keywords']);
	$tags = implode("|",$rec['tags']);
	$setIDs = implode("|",$rec['setIDs']);

	// ensure there are no spaces in any of the strings. this would happen if,
	// for instance, "hi there" was saved as a keyword, which should not be
	// allowed.

    if ( ( strpos($keywords," ") !== FALSE ) || ( strpos($tags," ") !== FALSE ) || ( strpos($setIDs," ") !== FALSE ) ) {
    	throw new Exception("zip failed (keywords/tags/setIDs have space(s)). Rec: ".print_r($rec,true));
    }

    // update the record

    $rec['keywords'] = $keywords;
    $rec['tags'] = $tags;
    $rec['setIDs'] = $setIDs;

    return $rec;
}

///////////////////////////////////////////////////////////////////////////////
// De-compress all of the string fields in our test attributes into arrays. No
// error checking is done at this point, at that was performed before the
// original (uncompressed fields) were saved.
//
//	@return - the test record. updated to have arrays rather than compressed strings.
///////////////////////////////////////////////////////////////////////////////

function unZipFields($rec) {

	$keywords = is_null($rec->keywords) ? "" : $rec->keywords;
	$tags = is_null($rec->tags) ? "" : $rec->tags;
	$setIDs = is_null($rec->setIDs) ? "" : $rec->setIDs;
	
	$keywords = strlen($keywords) ? explode("|",$keywords) : array();
	$tags = strlen($tags) ? explode("|",$tags) : array();
	$setIDs = strlen($setIDs) ? explode("|",$setIDs) : array();

	// convert setIDs to integers.

	foreach ( $setIDs as &$id ) {
		$id = (int)$id;
	}
	unset($id);

	// we leave the tag field as a simple array of integers (tag_id). we don't
	// require the rest of the information relating to their records (e.g.,
	// text and is_auto).

	foreach ( $tags as &$tag ) {
		$tag = (int)$tag;
	}
	unset($tag);

    // update the record

    $rec->keywords = $keywords;
    $rec->tags = $tags;
    $rec->setIDs = $setIDs;

    return $rec;
}

///////////////////////////////////////////////////////////////////////////////
// Retrieve an array of full test records. We are adding two fields to each
// record returned: created_by and setsInfo.
//
// Notice that we don't bother ordering (i.e., sorting) them at any point here.
// That is because they are sorted based upon string values (in part) and MySQL
// makes that a serious pain, so we'll have to do it manually in javascript.
//
//	@options:
//
//		.moduleID - the module that the tests/(auto)sets belong to [null for specific]
//		.ownerID - the userID that owns the tests [null for finding specific test(s)]
//		.accessorID - the userID that is trying to access the test(s)
//		.testIDs - array of testIDs that we want [null for all]
//		.autoSetIDs - array of setIDs that have `is_auto_test=1` to include [null for all]
//		.manual - object containing: [null for ignore]
//					.setIDs
//					.keywords
//					.tags
//
//	@returns: an array containing sets (exception on error). empty is possible.
//
///////////////////////////////////////////////////////////////////////////////

function getTests($options) {

	global $LIU;

	if ( 
			!array_key_exists("moduleID",$options) ||
			!array_key_exists("ownerID",$options) ||
			!array_key_exists("accessorID",$options) ||
			!array_key_exists("testIDs",$options) ||
			!array_key_exists("autoSetIDs",$options) ||
			!array_key_exists("manual",$options)
		)
	{
		throw new Exception("Missing option value(s): ".print_r($options,true));
	}

	// we must be in one of three scenarios:
	//
	// (1) finding all the tests (and all or zero autoSets) for a given user (owner) in a given module
	// (2) finding specific tests (and/or autoSets) where we know the IDs (and ignore the module/owner)
	// (3) given a `manual` object that requests specific sets with or without filter information (ignore everything else)

	if (
			!(
				/* (1) */
				(
					( $options['moduleID'] !== null ) &&
					( $options['ownerID'] !== null ) &&
					( $options['testIDs'] === null ) &&
					( $options['manual'] === null ) &&
					(
						( $options['autoSetIDs'] === null ) ||
						( !count($options['autoSetIDs']) )
					)
				) ||
				
				/* (2) */
				( ( $options['moduleID'] === null ) && ( $options['ownerID'] === null ) && ( $options['manual'] === null ) && ( count($options['testIDs']) + count($options['autoSetIDs']) > 0 ) ) ||
				
				/* (3) */
				(
					( ( $options['moduleID'] === null ) && ( $options['ownerID'] === null ) && ( count($options['testIDs']) + count($options['autoSetIDs']) === 0 ) ) &&
					( !empty($options['manual']) && array_key_exists("setIDs",$options['manual']) && array_key_exists("keywords",$options['manual']) && array_key_exists("tags",$options['manual']) )
				)
			)
		)
	{
		throw new Exception("Incorrect combination of option value(s): ".print_r($options,true));
	}

	// (1) build up some query values based upon the options sent.

	// moduleID

	$moduleQueryStr = "";
	$moduleQueryAry = array();

	if ( $options['moduleID'] === null ) {
		$moduleQueryStr = "(?)";
		$moduleQueryAry[] = 1;
	}
	else {
		$moduleQueryStr = "(ownerEnroll.module_id = ?)";
		$moduleQueryAry[] = $options['moduleID'];
	}

	// ownerID. notice that we do not apply this to the sets. because it
	// is feasible that user A is taking test from user B which includes 
	// sets from user C. As long as the end user has access to 
	// everything, it's fine.

	$ownerQueryStr = "";
	$ownerQueryAry = array();

	if ( $options['ownerID'] === null ) {
		$ownerQueryStr = "(?)";
		$ownerQueryAry[] = 1;
	}
	else {
		$ownerQueryStr = "(ownerEnroll.user_id = ?)";
		$ownerQueryAry[] = $options['ownerID'];
	}

	// actual tests

	$testsQueryStr = "";
	$testsQueryAry = array();

	if ( $options['testIDs'] === null ) {
		$testsQueryStr = "(?)";
		$testsQueryAry[] = 1;
	}
	else {		
		foreach ( $options['testIDs'] as $testID ) {
			if ( strlen($testsQueryStr) ) {
				$testsQueryStr .= ",";
			}
			$testsQueryStr .= "?";
			$testsQueryAry[] = $testID;
		}
		$testsQueryStr = "(tests.id IN (" . $testsQueryStr . "))";
	}

	// sets that are auto tests

	$autoSetsQueryStr = "";
	$autoSetsQueryAry = array();

	if ( $options['autoSetIDs'] === null ) {
		$autoSetsQueryStr = "(?)";
		$autoSetsQueryAry[] = 1;
	}
	else {		
		foreach ( $options['autoSetIDs'] as $autoSetID ) {
			if ( strlen($autoSetsQueryStr) ) {
				$autoSetsQueryStr .= ",";
			}
			$autoSetsQueryStr .= "?";
			$autoSetsQueryAry[] = $autoSetID;
		}
		$autoSetsQueryStr = "(sets.id IN (" . $autoSetsQueryStr . "))";
	}

	// (2) error checking. ensure there is something we want to get.

	if ( !count($testsQueryAry) && !count($autoSetsQueryAry) && ( !array_key_exists("setIDs",$options['manual']) || !count($options['manual']['setIDs']) ) ) {
		throw new Exception("No tests or sets to get! \nOptions: ".print_r($options,true));
	}

	$userTests = array();
	$autoTests = array();
	$manualTests = array(); // either empty or 1 element

	// (3) pull out the actual (i.e., non-auto) test records

	if ( count($testsQueryAry) ) {

		$queryAry = array_merge($moduleQueryAry,$ownerQueryAry,array($options['accessorID']),$testsQueryAry);

		$query = 	"SELECT tests.*, ownerEnroll.id = accessorEnroll.id AS is_owner, ownerEnroll.module_id, ownerUser.id AS created_by_id, ownerUser.full_name AS created_by, 0 as is_auto_test, \n";
		$query .=	"	COUNT(ownerGroups.id) AS num_owner_groups, COUNT(accessorGroups.id) AS num_accessor_groups FROM ".makeTableName("tests")." AS tests \n";
		$query .= 	"INNER JOIN ".makeTableName("enrollment")." AS ownerEnroll ON ownerEnroll.id = tests.enrollment_id AND " . $moduleQueryStr . " AND " . $ownerQueryStr ." \n";
		$query .= 	"INNER JOIN ".makeTableName("users")." AS ownerUser ON ownerUser.id = ownerEnroll.user_id \n";
		$query .= 	"INNER JOIN ".makeTableName("enrollment")." AS accessorEnroll ON accessorEnroll.module_id = ownerEnroll.module_id AND accessorEnroll.user_id = ? \n";

		// get all of the groups that the owner of the sets is enrolled in that belong to the module of the set
		$query .=	"LEFT JOIN ( \n";
		$query .=	"	SELECT groupsworking.id, groupEnroll.module_id, members.user_id FROM ".makeTableName("groups")." AS groupsworking \n";
		$query .=	"	INNER JOIN ".makeTableName("enrollment")." AS groupEnroll ON groupEnroll.id = groupsworking.enrollment_id ";
		$query .=	"	INNER JOIN ( \n";
		$query .=	"		SELECT * FROM ".makeTableName("group_membership")." \n";
		$query .=	"	) AS members ON members.group_id = groupsworking.id \n";
		$query .=	") AS ownerGroups ON ownerGroups.user_id = ownerEnroll.user_id AND ownerGroups.module_id = ownerEnroll.module_id \n";

		// get all of the groups that the accessor is enrolled in, that has the same module of the set
		$query .=	"LEFT JOIN ( \n";
		$query .=	"	SELECT groupsworking.id, groupEnroll.module_id, members.user_id FROM ".makeTableName("groups")." AS groupsworking \n";
		$query .=	"	INNER JOIN ".makeTableName("enrollment")." AS groupEnroll ON groupEnroll.id = groupsworking.enrollment_id ";
		$query .=	"	LEFT JOIN ( \n";
		$query .=	"		SELECT * FROM ".makeTableName("group_membership")." \n";
		$query .=	"	) AS members ON members.group_id = groupsworking.id \n";
		$query .=	") AS accessorGroups ON accessorGroups.user_id = accessorEnroll.user_id AND accessorGroups.module_id = ownerEnroll.module_id \n";

		$query .=	"WHERE " . $testsQueryStr . " AND ( ownerEnroll.user_id = accessorEnroll.user_id OR tests.sharing != 'none' ) \n";
		$query .=	"GROUP BY tests.id \n";
		$query .=	"HAVING (\n";
		$query .=	"	is_owner OR \n";
		$query .=	"	tests.sharing != 'studygroup' OR \n";
		$query .=	"	( tests.sharing = 'studygroup' AND num_owner_groups > 0 AND num_accessor_groups > 0 ) \n";
		$query .=	");";

		$result = Db::get_instance()->prepared_query($query,$queryAry);

		$userTests = $result->rows;
	}

	// (4) extract all the sets that have auto_test

	if ( count($autoSetsQueryAry) ) {

		// we are just going to grab all of the setIDs that are marked as auto_test and pass our module/owner comparisons.
		// then we send those IDs to `getSets` to get the information that we need about them. notice that we don't bother
		// doing the complex "accessible" comparisons here, as those are done in `getSets`.

		$queryAry = array_merge($moduleQueryAry,$ownerQueryAry,array($options['accessorID']),$autoSetsQueryAry);

		$query = 	"SELECT sets.id FROM ".makeTableName("sets")." AS sets \n";
		$query .= 	"INNER JOIN ".makeTableName("enrollment")." AS ownerEnroll ON ownerEnroll.id = sets.enrollment_id AND " . $moduleQueryStr . " AND " . $ownerQueryStr . " \n";
		$query .= 	"INNER JOIN ".makeTableName("users")." AS ownerUser ON ownerUser.id = ownerEnroll.user_id \n";
		$query .= 	"INNER JOIN ".makeTableName("enrollment")." AS accessorEnroll ON accessorEnroll.module_id = ownerEnroll.module_id AND accessorEnroll.user_id = ? \n";
		$query .=	"WHERE sets.has_auto_test = 1 AND " . $autoSetsQueryStr . ";";
		$result = Db::get_instance()->prepared_query($query,$queryAry);

		$autoSetIDs = Leftovers::pluck($result->rows,"id");

		// now that we have our IDs, we are going to pull out all of the sets that they belong to, getting full information on each.

		$autoTests = array();
		if ( count($autoSetIDs) ) {

			$autoTests = getSets(array(
				"moduleID"=>null,
				"ownerID"=>null,
				"accessorID"=>$options['accessorID'],
				"setIDs"=>$autoSetIDs,
				"keywords"=>array(),
				"tags"=>array()
			));

			// finally, we have to convert these sets into tests. to do that, we have to do the following transformations:
			//
			// (1) setIDs = id [this is treated as a string and converted to array in `unZipFields` later on]
			// (2) is_auto_test = 1
			// (3) set_name => test_name
			// (4) keywords = NULL
			// (5) tags = NULL

			foreach ( $autoTests as &$test ) {
				$test->setIDs = $test->id;
				$test->is_auto_test = 1;
				$test->test_name = $test->set_name;
				unset($test->set_name);
				$test->keywords = null;
				$test->tags = null;
			}
			unset($test);
		}
	}

	// (5) create a test from the `manual` data sent

	if ( !empty($options['manual']) ) {

		// let's validate the information that we have been sent, ensuring that it's a viable test. we'll have to setup a few
		// dummy fields first. we also call `zipFields` to mimick this being a test pulled out of the db.

		$manualTest = $options['manual'];
		$manualTest['id'] = "manual";
		$manualTest['sharing'] = "none";
		$manualTest['test_name'] = "Manual Test";
		$manualTest['description'] = null;
		$manualTest['is_auto_test'] = 0;
		$manualTest['created_by_id'] = $LIU->id;
		$manualTest['created_by'] = $LIU->full_name;

		$manualTest = validateTest($manualTest);
		$manualTest = zipFields($manualTest);
		
		// okay, we know the "test" has passed validation. let's add it to the array that gets processed.
		$manualTests[] = (object)$manualTest;
	}

	// combine all the tests into one MONSTER array

	$allTests = array_merge($userTests,$autoTests,$manualTests);

	// (5)	for all tests (even autos) we will build detailed information under a new field called `setsInfo` that we can use to
	//		inform users what set(s) are included in the test. for auto tests, this will obviously just contain the one set which
	//		has the same name/description has the test itself.

	foreach ( $allTests as &$test ) {

		$test = unZipFields($test);

		$test->setsInfo = getSets(array(
			"moduleID"=>null,
			"ownerID"=>null,
			"accessorID"=>$options['accessorID'],
			"setIDs"=>$test->setIDs,
			"keywords"=>$test->keywords,
			"tags"=>$test->tags
		));

		// now go through all of those setinfos and add up all the cards that are apart of the test.

		$count = 0;
		foreach ( $test->setsInfo as $setInfo ) {
			$count += $setInfo->num_filtered_cards;
		}
		$test->num_filtered_cards = $count;

	}
	unset($test);

	// (6) done. return the monster array.

	return $allTests;
}