<?php

//---------------------------------------------------------------------------------------
// Include: studying.inc.php
// Description: This file includes any function that is used by more than one .php file in
//				the "studying" super-section of the site (e.g., "Flashcards" and "Tests" 
//				sections).
//---------------------------------------------------------------------------------------

///////////////////////////////////////////////////////////////////////////////
// Determine if the logged-in user is allowed to flag a piece of content or not.
//
//	@targetUserID - the ID of the user whose content is trying to be flagged.
///////////////////////////////////////////////////////////////////////////////

function canFlag($targetUserID) {

	// a user is allowed to flag if they meet these criteria:
	//
	// (1) The logged-in user has status beyond "normal" [OR]
	// (2) The logged-in user is of status "normal" and they do not already have N number of flags, where N = user.reputation * c [constant from settings]

	global $LIU;

	// grab all of the settings we require from the db.

	$userStatusNormal = (int)DbSettings::get_instance()->get_setting("user_status_normal");
	$flagReputationMultiplier = (int)DbSettings::get_instance()->get_setting("flagReputationMultiplier");

	// we will grab the target user's record from the db.

	$query = "SELECT status, reputation FROM ".makeTableName("users")." WHERE id = ?;";
	$result = Db::get_instance()->prepared_query($query,array($targetUserID));

	if ( $result->num_rows !== 1 ) {
		throw new Exception("Failed to retrieve target user. \nTargetID: ".print_r($targetUserID,true)."\nResult: ".print_r($result,true));
	}

	$targetUser = $result->rows[0];

	// (1) 

	if ( $LIU->status > $userStatusNormal ) {
		return true;
	}

	// (2)

	if ( $LIU->status < $userStatusNormal ) {
		return false;
	}

	$query =	"SELECT 'sets' AS type, COUNT(id) AS count FROM ".makeTableName("flagged_sets")." WHERE flagged_by_id = ? \n";
	$query .=	"UNION \n";
	$query .=	"SELECT 'cards' AS type, COUNT(id) AS count FROM ".makeTableName("flagged_flashcards")." WHERE flagged_by_id = ? \n";
	$query .=	"UNION \n";
	$query .=	"SELECT 'tests' AS type, COUNT(id) AS count FROM ".makeTableName("flagged_tests")." WHERE flagged_by_id = ?;";
	$result = Db::get_instance()->prepared_query($query,array($LIU->id,$LIU->id,$LIU->id));

	$total_flags = $result->rows[0]->count + $result->rows[1]->count + $result->rows[2]->count;

	return ( $LIU->reputation*$flagReputationMultiplier > $total_flags );
}

///////////////////////////////////////////////////////////////////////////////
// Retrieve an array of full set records. We are adding fields onto what
// MySQL gives us: created_by, created_by_id, and num_filtered_cards. In terms of
// access, we are ensuring that the sent accessorID either owns the sets or has 
// access to them.
//
//	@options:
//
//		.moduleID - the module that contains the set(s) [null for specific]
//		.ownerID - the userID that owns the set(s) [null for specific sets]
//		.accessorID - the user that wants to access the set(s)
//		.setIDs - array of one or more setIDs [null for all]
//		.keywords - array of keywords that cards must match
//		.tags - array of tagIDs that cards must match
//
//	@returns: an array containing sets (exception on error). empty is possible.
//
///////////////////////////////////////////////////////////////////////////////

function getSets($options) {

	if ( 
			!array_key_exists("moduleID",$options) ||
			!array_key_exists("ownerID",$options) ||
			!array_key_exists("accessorID",$options) ||
			!array_key_exists("setIDs",$options) ||
			!array_key_exists("keywords",$options) ||
			!array_key_exists("tags",$options)
		)
	{
		throw new Exception("Missing option value(s): ".print_r($options,true));
	}

	// we must be in one of two scenarios:
	//
	// (1) finding all the sets for a given module made by a given user
	// (2) finding one or more sets where we know the IDs (and ignore the module/owner)

	if (
			!(
				/* (1) */ ( ( $options['moduleID'] !== null ) && ( $options['ownerID'] !== null ) && ( $options['setIDs'] === null ) ) ||
				/* (2) */ ( ( $options['moduleID'] === null ) && ( $options['ownerID'] === null ) && ( count($options['setIDs']) ) )
			)
		)
	{
		throw new Exception("Incorrect combination of option value(s): ".print_r($options,true));
	}

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

	// ownerID.

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

	// setIDs

	$setsQueryStr = "";
	$setsQueryAry = array();

	if ( $options['setIDs'] === null ) {
		$setsQueryStr = "(?)";
		$setsQueryAry[] = 1;
	}
	else {		
		foreach ( $options['setIDs'] as $setID ) {
			if ( strlen($setsQueryStr) ) {
				$setsQueryStr .= ",";
			}
			$setsQueryStr .= "?";
			$setsQueryAry[] = $setID;
		}
		$setsQueryStr = "(sets.id IN (" . $setsQueryStr . "))";
	}

	// (2)	build up the SQL statements relating to the filter. none of these require variables
	//		put into the queryAry.

	// build a keywords string for the SQL statement. this will look something like
	// WHERE (...) AND (cards.question_text LIKE %keyword1% OR cards.answer_text LIKE %keyword1%)

	$keywordQueryStr = "1";
	foreach ( $options['keywords'] as $keyword ) {

		// make it MySQL safe first.
		$keyword = Db::get_instance()->escape($keyword);

		// add whitespace manually in between each comparison.
		if ( strlen($keywordQueryStr) ) {
			$keywordQueryStr .= " ";
		}

		// since we're adding this onto an existing WHERE statement, we'll need a first AND
		// as well as one after every comparison.
		$keywordQueryStr .= "AND (cards.question_text LIKE '%".$keyword."%' OR cards.answer_text LIKE '%".$keyword."%')";
	}

	// build a tags string for the SQL statement.
	$tagQueryStr = "";
	foreach ( $options['tags'] as $tag ) {

		// make it MySQL safe first.
		$tag = Db::get_instance()->escape($tag);

		if ( strlen($tagQueryStr) ) {
			$tagQueryStr .= " OR ";
		}

		$tagQueryStr .= "tagcheck.tag_id = ".$tag;
	}

	$queryAry = array_merge($moduleQueryAry,$ownerQueryAry,array($options['accessorID']),$setsQueryAry);

	// adding in extra vars: module_id, created_by, created_by_id, and num_filtered_cards.

	$query = 	"SELECT sets.*, ownerEnroll.id = accessorEnroll.id AS is_owner, ownerEnroll.module_id, ownerUser.full_name AS created_by, ownerUser.id AS created_by_id, COUNT(j2.set_id) AS num_filtered_cards, \n";
	$query .=	"	COUNT(ownerGroups.id) AS num_owner_groups, COUNT(accessorGroups.id) AS num_accessor_groups FROM ".makeTableName("sets")." AS sets \n";
	$query .= 	"INNER JOIN ".makeTableName("enrollment")." AS ownerEnroll ON ownerEnroll.id = sets.enrollment_id AND " . $moduleQueryStr . " AND " . $ownerQueryStr . " \n";
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

	// now, if appropriate, we have to verify that the tags we are looking for appear on this card too. the way we
	// do this is by counting the number of tags that the card has out of our list of required tags. if they have the
	// correct number, then it passes.

	// note: source for unique composites (http://stackoverflow.com/questions/2219786/best-way-to-avoid-duplicate-entry-into-mysql-database)
	// which i had to use to ensure that there is never a duplicate entry where a card has the same tag
	// twice.

	$query .=	"LEFT JOIN ( \n";
	$query .=	"SELECT * FROM ".makeTableName("flashcards")." AS cards \n";

	if ( count($options['tags']) ) {
		$query .=	"	INNER JOIN ( \n";
		$query .=	"		SELECT flashcard_id, count(flashcard_id) AS number_tags_matched FROM ".makeTableName("flashcard_tags")." AS tagcheck \n";
		$query .=	"		WHERE ( ".$tagQueryStr." ) \n";
		$query .=	"		GROUP BY tagcheck.flashcard_id \n";
		$query .=	"	) AS j1 ON j1.flashcard_id = cards.id AND j1.number_tags_matched = ".count($options['tags'])." \n";
	}

	$query .=	"	WHERE " . $keywordQueryStr . "\n";
	$query .=	") AS j2 ON j2.set_id = sets.id \n";

	$query .=	"WHERE " . $setsQueryStr . " AND ( ownerEnroll.user_id = accessorEnroll.user_id OR sets.sharing != 'none' ) \n";
	$query .=	"GROUP BY sets.id \n";
	$query .=	"HAVING (\n";
	$query .=	"	is_owner OR \n";
	$query .=	"	sets.sharing != 'studygroup' OR \n";
	$query .=	"	( sets.sharing = 'studygroup' AND num_owner_groups > 0 AND num_accessor_groups > 0 ) \n";
	$query .=	");";

	$result = Db::get_instance()->prepared_query($query,$queryAry);

    return $result->rows;
}

///////////////////////////////////////////////////////////////////////////////
// Retrieve an array of full card records. You can request ALL the cards that
// belong to one or more sets, or you can request a specific group of cards 
// from one particular set. The cards are returned with full information regarding
// their tags (that's a big chunk of the work here). We also add the `created_by_id`
// field to the card.
//
//	@options:
//
//		.accessorID - the user that is trying to get access to the cards
//		.setIDs - array of one or more setIDs
//		.cardIDs - array of one or more cardIDs (null for all)
//		.keywords - array of strings
//		.tags - array of integers (tag_id instances)
//
//	@returns: an array containing cards (exception on error). empty is possible.
//
///////////////////////////////////////////////////////////////////////////////

function getCards($options) {

	if ( 
			!array_key_exists("accessorID",$options) ||
			!array_key_exists("setIDs",$options) ||
			!array_key_exists("cardIDs",$options) ||
			!array_key_exists("keywords",$options) ||
			!array_key_exists("tags",$options)
		)
	{
		throw new Exception("Missing option value(s): ".print_r($options,true));
	}

	// we must receive a list of setIDs

	if ( !count($options['setIDs']) ) {
		throw new Exception("No setIDs in options: ".print_r($options,true));
	}

	// (1) build up some query values based upon the options sent.

	// setIDs

	$setsQueryStr = "";
	$setsQueryAry = array();

	foreach ( $options['setIDs'] as $setID ) {
		if ( strlen($setsQueryStr) ) {
			$setsQueryStr .= ",";
		}
		$setsQueryStr .= "?";
		$setsQueryAry[] = $setID;
	}
	$setsQueryStr = "(sets.id IN (" . $setsQueryStr . "))";

	// cardIDs

	$cardsQueryStr = "";
	$cardsQueryAry = array();

	if ( $options['cardIDs'] === null ) {
		$cardsQueryStr = "(?)";
		$cardsQueryAry[] = 1;
	}
	else {		
		foreach ( $options['cardIDs'] as $cardID ) {
			if ( strlen($cardsQueryStr) ) {
				$cardsQueryStr .= ",";
			}
			$cardsQueryStr .= "?";
			$cardsQueryAry[] = $cardID;
		}
		$cardsQueryStr = "(cards.id IN (" . $cardsQueryStr . "))";
	}	

	// (2)	build up the SQL statements relating to the filter. none of these require variables
	//		put into the queryAry.

	// build a keywords string for the SQL statement. this will look something like
	// WHERE (...) AND (cards.question_text LIKE %keyword1% OR cards.answer_text LIKE %keyword1%)

	$keywordQueryStr = "";
	foreach ( $options['keywords'] as $keyword ) {

		// make it MySQL safe first.
		$keyword = Db::get_instance()->escape($keyword);

		// add whitespace manually in between each comparison.
		if ( strlen($keywordQueryStr) ) {
			$keywordQueryStr .= " ";
		}

		// since we're adding this onto an existing WHERE statement, we'll need a first AND
		// as well as one after every comparison.
		$keywordQueryStr .= "AND (cards.question_text LIKE '%".$keyword."%' OR cards.answer_text LIKE '%".$keyword."%')";
	}

	// build a tags string for the SQL statement.
	$tagQueryStr = "";
	foreach ( $options['tags'] as $tag ) {

		// make it MySQL safe first.
		$tag = Db::get_instance()->escape($tag);

		if ( strlen($tagQueryStr) ) {
			$tagQueryStr .= " OR ";
		}

		$tagQueryStr .= "tagcheck.tag_id = ".$tag;
	}

	$queryAry = array_merge($setsQueryAry,array($options['accessorID']),$cardsQueryAry);

	// extract all the cards. we can sort them here because we're using .order_id and .tag_text, the
	// first of which is a number and the second of which doesn't matter if it's done in a case-insensitive
	// fashion (as MySQL does by default).

	$query = 	"SELECT cards.*, ownerEnroll.id = accessorEnroll.id AS is_owner, ownerEnroll.user_id AS created_by_id, sets.sharing, tags.id AS tag_id, tags.tag_text, tags.is_auto, \n";
	$query .=	"	COUNT(ownerGroups.id) AS num_owner_groups, COUNT(accessorGroups.id) AS num_accessor_groups FROM ".makeTableName("flashcards")." AS cards \n";
	$query .= 	"INNER JOIN ".makeTableName("sets")." AS sets ON " . $setsQueryStr . " AND sets.id = cards.set_id \n";
	
	$query .= 	"INNER JOIN ".makeTableName("enrollment")." AS ownerEnroll ON ownerEnroll.id = sets.enrollment_id \n";
	$query .= 	"INNER JOIN ".makeTableName("enrollment")." AS accessorEnroll ON accessorEnroll.module_id = ownerEnroll.module_id AND accessorEnroll.user_id = ? \n";

	// get all of the groups that the owner of the set is enrolled in that belong to the module of the set
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
	$query .=	") AS accessorGroups ON accessorGroups.user_id = ownerEnroll.user_id AND accessorGroups.module_id = ownerEnroll.module_id \n";

	// now, if appropriate, we have to verify that the tags we are looking for appear on this card too. the way we
	// do this is by counting the number of tags that the card has out of our list of required tags. if they have the
	// correct number, then it passes.

	// note: source for unique composites (http://stackoverflow.com/questions/2219786/best-way-to-avoid-duplicate-entry-into-mysql-database)
	// which i had to use to ensure that there is never a duplicate entry where a card has the same tag
	// twice.

	if ( count($options['tags']) ) {
		$query .=	"INNER JOIN ( \n";
		$query .=	"	SELECT flashcard_id, count(flashcard_id) AS number_tags_matched FROM ".makeTableName("flashcard_tags")." AS tagcheck \n";
		$query .=	"	WHERE ( ".$tagQueryStr." ) \n";
		$query .=	"	GROUP BY tagcheck.flashcard_id \n";
		$query .=	") AS j1 ON j1.flashcard_id = cards.id AND j1.number_tags_matched = ".count($options['tags'])." \n";
	}

	$query .=	"LEFT JOIN ".makeTableName("flashcard_tags")." AS member ON cards.id = member.flashcard_id \n";
	$query .=	"LEFT JOIN sb_tags AS tags ON tags.id = member.tag_id \n";

	$query .=	"WHERE " . $cardsQueryStr . $keywordQueryStr . " AND ( ownerEnroll.user_id = accessorEnroll.user_id OR sets.sharing != 'none' ) \n";
	//$query .=	"GROUP BY cards.id \n";
	$query .=	"GROUP BY cards.id, tags.id \n";
	$query .=	"HAVING (\n";
	$query .=	"	is_owner OR \n";
	$query .=	"	sharing != 'studygroup' OR \n";
	$query .=	"	( sharing = 'studygroup' AND num_owner_groups > 0 AND num_accessor_groups > 0 ) \n";
	$query .=	")\n";
	$query .=	"ORDER BY cards.set_id ASC, cards.order_id DESC, cards.id DESC, tags.tag_text;";
	$result = Db::get_instance()->prepared_query($query,$queryAry);

	if ( !$result->num_rows ) {
		return array();
	}

	// now we have to parse the rows and build up an array of flashcards. if a card has more 
	// than one tag then it will appear more than once in the result set, so we need to
	// simply add the extra tags to their existing record in the array, rather than adding
	// them 2+ times.

	$cards = array();
	foreach ( $result->rows as $row ) {

		// we can drop the 'sharing' field. that was just used for our query.
		unset($row->sharing);

		// let's see if we've already added the flashcard. if so, we're adding an extra tag.

		$idx = Leftovers::indexOfObj($cards,function($o) use ($row) {
			return $o->id === $row->id;
		});

		if ( $idx !== null ) {
			$cards[$idx]->tags[] = (object)array("id"=>$row->tag_id,"tag_text"=>$row->tag_text,"is_auto"=>$row->is_auto);
		}

		// a brand new flashcard.

		else {

			$newCard = $row;
			$newCard->tags = array();

			if ( $row->tag_id !== null ) {
				$newCard->tags[] = (object)array("id"=>$row->tag_id,"tag_text"=>$row->tag_text,"is_auto"=>$row->is_auto);
			}
			
			unset($newCard->tag_id);
			unset($newCard->tag_text);
			unset($newCard->is_auto);

			$cards[] = $newCard;
		}
	}

	return $cards;
}

///////////////////////////////////////////////////////////////////////////////
// Copy a number of cards from an enrollment/set pair to a new
// enrollment/set pair. A transaction is NOT created here, but the assumption
// is that one will be created by the parent that calls this method.
//
//	@options:
//		.cardIDs - array of card ids to work on (null for all)
//		.srcSetID - the setID we are copying from
//		.dstSetID - the setID we are pasting to
//		.srcModuleID - the moduleID of source set
//		.dstModuleID - the moduleID of dest set
//		.userID - the userID that is enrolled in the aforementioned modules
//
//	@returns: an array containing the new cards (exception on error)
//
///////////////////////////////////////////////////////////////////////////////

function copyCards($options) {

	if ( 
			!array_key_exists("cardIDs",$options) ||
			!array_key_exists("srcSetID",$options) ||
			!array_key_exists("dstSetID",$options) ||			
			!array_key_exists("srcModuleID",$options) ||
			!array_key_exists("dstModuleID",$options) ||
			!array_key_exists("userID",$options)
		)
	{
		throw new Exception("Missing option value(s): ".print_r($options,true));
	}

	if ( $options['srcSetID'] == $options['dstSetID'] ) {
		throw new Exception("Src/dest setIDs are the same. Options: ".print_r($options,true));
	}

	// (1) we need to read in all of the flashcards and their tags.

	$cards = getCards(array(
		"accessorID"=>$options['userID'],
		"setIDs"=>array($options['srcSetID']),
		"cardIDs"=>$options['cardIDs'],
		"keywords"=>array(),
		"tags"=>array()
	));

	// nothing to copy?
	if ( !count($cards) ) {	
		return null;
	}

	// (2) ensure that the user owns both the source and destination sets.

	$query = 	"SELECT sets.id FROM ".makeTableName("sets")." AS sets \n";
	$query .=	"INNER JOIN ".makeTableName("enrollment")." AS enroll ON enroll.id = sets.enrollment_id AND enroll.user_id = ? AND enroll.module_id IN (?,?)\n";
	$query .=	"WHERE sets.id IN (?,?);";
	$result = Db::get_instance()->prepared_query($query,array($options['userID'],$options['srcModuleID'],$options['dstModuleID'],$options['srcSetID'],$options['dstSetID']));

	if ( $result->num_rows !== 2 ) {
		throw new Exception("Permission failure on src/dest set.\n Options: ".print_r($options,true));
	}

	// (3) we need to insert the flashcards into their destination set.	

	// note: it's IMPERATIVE that the cards are inserted in a deterministic order. because we are going to
	// match their new IDs with the old IDs. So, we need to know the order in which they were inserted, to do
	// the matching. if we can't know the order they were inserted in, this will not work. as we are going
	// through the cards in order, then the order will be whatever order is returned by `getCards`. it doesn't
	// matter what exactly that is, as we are simply iterating through the same list twice (once on insertion
	// and once on retrieval). so we know our order is preserved.

	// notice that we are SELECTing the set.id on every insert. this ensures that the set still exists as we
	// are doing the insert. if it doesn't, NULL is returned, and `set_id` is not allowed to be NULL in the
	// table, so the insert will fail.

	$queryStr = "";
	$queryAry = array();

	foreach ( $cards as $card ) {
		//fixme: error check this
		//error_log("Original Order: ".$card->id);
		if ( strlen($queryStr) ) {
			$queryStr .= ",";
		}
		$queryStr .= "("."(SELECT sets.id FROM ".makeTableName("sets")." AS sets WHERE sets.id=".Db::get_instance()->escape($options['dstSetID']).")".",?,?,?)";
		array_push($queryAry,$card->order_id,$card->question_text,$card->answer_text);
	}

	$query = 	"INSERT INTO ".makeTableName("flashcards")." (set_id, order_id, question_text, answer_text) \n";
	$query .=	"VALUES ".$queryStr;
	$result = Db::get_instance()->prepared_query($query,$queryAry);

	if ( $result->affected_rows !== count($cards) ) {
		throw new Exception("Failed to copy all of the cards. Expected=".count($cards)." Result=".$result->affected_rows);
	}

	// (3) 	go through all of the original cards that were copied and update their record with the id of the 
	// 		NEW card that they were just copeid to. this will allow us to copy over their tag memberships.
	//		we are told the first id that was given (`insert_id`) and we know it gave out N more after that
	//		IN ORDER. So if 12 was the first, and 20 rows were inserted, then 12+20-1 is the last ID given.
	//		again, remember that we need to know that the cards were inserted in a deterministic order for
	//		this to work.

	$firstID = $result->insert_id;
	$numIDs = $result->affected_rows;

	$currID = $firstID;
	foreach ( $cards as &$card ) {
		//fixme: error check this.
		//error_log("Copied order: ".$card->id);
		$card->new_id = $currID++;
	}
	unset($card);

	// (4) 	copy over the tag memberships from old cards to new cards (if there are
	// 		any to copy over).

	$queryStr = "";
	$queryAry = array();

	foreach ( $cards as $card ) {
		foreach ( $card->tags as $tag ) {
			if ( strlen($queryStr) ) {
				$queryStr .= ",";
			}
			$queryStr .= "(?,?)";
			array_push($queryAry,$card->new_id,$tag->id);
		}
	}

	$numTags = count($queryAry) / 2; // 2 elements per tag (card_id,tag_id)

	if ( $numTags ) {

		// we needn't worry about the cards not existing at this point, as we
		// are positive that everything was copied over (and they can't be
		// deleted before submission, which hasn't happened yet).

		$query = 	"INSERT INTO ".makeTableName("flashcard_tags")." (flashcard_id,tag_id) \n";
		$query .=	"VALUES ".$queryStr;
		$result = Db::get_instance()->prepared_query($query,$queryAry);

		if ( $result->affected_rows !== $numTags ) {
			throw new Exception("Failed to copy all of the tags. Expected=".$numTags." Result=".$result->affected_rows);
		}
	}

	// (5) 	now that everything has been copied over, we are going to pull out the new cards that we just generated
	// 		so they can be returned to the caller. we could probably just piece this together from the old cards and
	//		their new_id fields, but it's safer to do it manually.

	$newCards = getCards(array(
		"accessorID"=>$options['userID'],
		"setIDs"=>array($options['dstSetID']),
		"cardIDs"=>Leftovers::pluck($cards,"new_id"),
		"keywords"=>array(),
		"tags"=>array()
	));

	if ( count($newCards) !== count($cards) ) {
		throw new Exception("Failed to retrieve all of the cards. Expected=".count($cards)." Result=".count($newCards)."\n Cards: ".print_r($cards,true)."\n newCards: ".print_r($newCards,true));
	}

	// return our result
	return $newCards;
}

///////////////////////////////////////////////////////////////////////////////
// Delete one or more sets from a particular enrollment, for a particular user.
// Notice that we DO NOT create a transaction here. The assumption is that the
// caller will take care of that because you ABSOLUTELY WANT THIS TO BE A
// TRANSACTION (i.e., so we don't delete the cards but not the sets).
//
//	@options:
//
//		.setIDs - array of set ids to delete (cannot send null for all)
//		.moduleID - the module that the sets are in
//		.userID - the userID that is enrolled in the module
//
//	@return - nothing on success. exception on failure.
//
///////////////////////////////////////////////////////////////////////////////

function deleteSets($options) {

	if ( 
			!array_key_exists("setIDs",$options) ||
			!array_key_exists("moduleID",$options) ||
			!array_key_exists("userID",$options)
		)
	{
		throw new Exception("Missing option value(s): ".print_r($options,true));
	}	

	// (1) remove cards within those sets first.

	foreach ( $options['setIDs'] as $setID ) {
		deleteCards(array(
			"cardIDs"=>null, // i.e., all of them
			"setID"=>$setID,
			"moduleID"=>$options['moduleID'],
			"userID"=>$options['userID']
		));
	}

	// (2) remove all of the sets now.

	$queryStr = "";
	$queryAry = array();

	foreach ( $options['setIDs'] as $id ) {
		if ( strlen($queryStr) ) {
			$queryStr .= ",";
		}
		$queryStr .= "?";
		$queryAry[] = $id;
	}

	array_unshift($queryAry,$options['moduleID'],$options['userID']);

	$query = 	"DELETE sets FROM ".makeTableName("sets")." AS sets \n";
	$query .=	"INNER JOIN ".makeTableName("enrollment")." AS enroll ON enroll.id = sets.enrollment_id AND enroll.module_id = ? AND enroll.user_id = ? \n";
	$query .=	"WHERE sets.id IN (".$queryStr.");";
	$result = Db::get_instance()->prepared_query($query,$queryAry);

	if ( $result->affected_rows !== count($options['setIDs']) ) {
		throw new Exception("Failed to delete sets (ids:".print_r($options['setIDs'],true)."). User: ".print_r($options['userID'],true));
	}
}

///////////////////////////////////////////////////////////////////////////////
// Delete one or more flashcards from a particular card set, which belongs to
// a particular enrollment, which belongs to a particular user. Notice that
// we DO NOT create a transaction here, as that's left up to the caller.
//
//	@options:
//
//		.cardIDs - array of card ids to delete (null for all)
//		.setID - the setID we are deleting from
//		.moduleID - the module that the set belongs to in
//		.userID - the user that is enrolled in the module
//
//	@return - nothing on success. exception on failure.
//
///////////////////////////////////////////////////////////////////////////////

function deleteCards($options) {

	if ( 
			!array_key_exists("cardIDs",$options) ||
			!array_key_exists("setID",$options) ||
			!array_key_exists("moduleID",$options) ||
			!array_key_exists("userID",$options)
		)
	{
		throw new Exception("Missing option value(s): ".print_r($options,true));
	}

	// (1) if we were sent null for `cardIDs` that means that we have to delete
	// all the cards in this particular set. if needed, we'll build that list
	// up now. we require this explicit list (can't just do DELETE WHERE sets.id=?)
	// because we have to delete the tag memberships associated with these cards
	// in particular.

	if ( $options['cardIDs'] === null ) {

		$query = "SELECT id FROM ".makeTableName("flashcards")." AS cards WHERE cards.set_id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($options['setID']));

		$options['cardIDs'] = array();
		foreach ( $result->rows as $row ) {
			$options['cardIDs'][] = $row->id;
		}
	}

	// nothing to delete?
	if ( !count($options['cardIDs']) ) {
		return;
	}

	// (2) 	remove the tag memberships first. notice that we aren't bothering to see
	// 		how many there are first and then double checking that we removed them
	//		all. that seemed like overkill.

	$queryStr = "";
	$queryAry = array();

	foreach ( $options['cardIDs'] as $id ) {
		if ( strlen($queryStr) ) {
			$queryStr .= ",";
		}
		$queryStr .= "?";
		$queryAry[] = $id;
	}

	$query = "DELETE tags FROM ".makeTableName("flashcard_tags")." AS tags WHERE tags.flashcard_id IN (".$queryStr.");";
	$result = Db::get_instance()->prepared_query($query,$queryAry);

	// (3)	remove all of the cards now.

	array_unshift($queryAry,$options['setID'],$options['moduleID'],$options['userID']);

	$query = 	"DELETE cards FROM ".makeTableName("flashcards")." AS cards \n";
	$query .=	"INNER JOIN ".makeTableName("sets")." AS sets ON sets.id = cards.set_id AND sets.id = ? \n";
	$query .=	"INNER JOIN ".makeTableName("enrollment")." AS enroll ON enroll.id = sets.enrollment_id AND enroll.module_id = ? AND enroll.user_id = ? \n";
	$query .=	"WHERE cards.id IN (".$queryStr.");";
	$result = Db::get_instance()->prepared_query($query,$queryAry);

	if ( $result->affected_rows !== count($options['cardIDs']) ) {
		throw new Exception("Failed to delete all the flashcards. NumDeleted=".$result->affected_rows." Options: ".print_r($options,true));
	}
}

///////////////////////////////////////////////////////////////////////////////
// This will add breadcrumb information for any of the following:
//
// 		moduleID, userID, groupID, typeID, setID, cardID, testID, autoSetID.
//
//	Pass in an object (associative array) for `options` and if any of the
//	aforementioned keys are found, then we will add a crumb of information
//	(i.e., enough information that a crumb could be constructed from what's
//	sent) to an array that is returned. You cannot be sure what order the
//	array will be in, so you must parse it on your end. But each element of
//	the array will be an object, and it will have a field called
//	`crumbName`, which will be 'moduleID', 'userID', etc. Of course, if moduleID
//	is received then we look for an enrollment with that id for the logged-in
//	user.
//
//	@options:
//
//		Associative array holding (optionally):
//
//			.moduleID, .userID, .setID, .cardID, .testID, .autoSetID
//
//	@return:
//
//		array of objects.
//
///////////////////////////////////////////////////////////////////////////////

function buildBreadcrumb($options) {

	global $LIU;

	$breadcrumb = array();

	if ( array_key_exists("moduleID",$options) ) {

		$query = 	"SELECT 'moduleID' AS crumbName, subjects.code AS subject_code, classes.code AS class_code, modules.year, semesters.name AS semester_name, module_id FROM ".makeTableName("enrollment")." AS enroll \n";
		$query .= 	"INNER JOIN ".makeTableName("modules")." AS modules ON enroll.module_id = modules.id \n";
		$query .=	"INNER JOIN ".makeTableName("semesters")." AS semesters ON modules.semester_id = semesters.id \n";
		$query .=	"INNER JOIN ".makeTableName("classes")." AS classes ON modules.class_id = classes.id \n";
		$query .=	"INNER JOIN ".makeTableName("subjects")." AS subjects ON classes.subject_id = subjects.id \n";
		$query .=	"WHERE enroll.module_id = ? AND enroll.user_id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($options['moduleID'],$LIU->id));

		if ( $result->num_rows === 1 ) {
			$breadcrumb[] = $result->rows[0];
		}		
	}

	if ( array_key_exists("groupID",$options) ) {

		if ( ( $options['groupID'] === "self" ) || ( $options['groupID'] === "pub" ) ) {
			$breadcrumb[] = array(
				"crumbName" => "groupID",
				"id" => $options['groupID']
			);
		}

		else {

			$groupID = $options['groupID'];

			$query = 	"SELECT 'groupID' AS crumbName, groupsworking.id, ownerUser.full_name AS created_by_full_name, ownerUser.last_name AS created_by_last_name, ownerUser.first_name AS created_by_first_name, \n";
			$query .=	"ownerUser.id AS created_by_id FROM ".makeTableName("groups")." AS groupsworking \n";
			$query .=	"INNER JOIN ".makeTableName("enrollment")." AS ownerEnroll ON ownerEnroll.id = groupsworking.enrollment_id \n";
			$query .=	"INNER JOIN ".makeTableName("users")." AS ownerUser ON ownerUser.id = ownerEnroll.user_id \n";
			$query .=	"WHERE groupsworking.id = ?;";
			$result = Db::get_instance()->prepared_query($query,array($groupID));

			if ( $result->num_rows === 1 ) {
				$breadcrumb[] = $result->rows[0];
			}		
		}		
	}

	if ( array_key_exists("typeID",$options) ) {

		if ( ( $options['typeID'] === "cards" ) || ( $options['typeID'] === "tests" ) ) {
			$breadcrumb[] = array(
				"crumbName" => "typeID",
				"id" => $options['typeID']
			);
		}	
	}

	if ( array_key_exists("userID",$options) ) {

		$query = "SELECT 'userID' AS crumbName, users.full_name, users.id FROM ".makeTableName("users")." AS users WHERE id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($options['userID']));

		if ( $result->num_rows === 1 ) {
			$breadcrumb[] = $result->rows[0];
		}		
	}

	if ( array_key_exists("setID",$options) ) {

		$query = "SELECT 'setID' AS crumbName, sets.set_name, sets.description, sets.id FROM ".makeTableName("sets")." AS sets WHERE id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($options['setID']));

		if ( $result->num_rows === 1 ) {
			$breadcrumb[] = $result->rows[0];
		}		
	}

	if ( array_key_exists("cardID",$options) ) {

		$query = "SELECT 'cardID' AS crumbName, cards.id FROM ".makeTableName("flashcards")." AS cards WHERE id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($options['cardID']));

		if ( $result->num_rows === 1 ) {
			$breadcrumb[] = $result->rows[0];
		}		
	}

	if ( array_key_exists("testID",$options) ) {

		$query = "SELECT 'testID' AS crumbName, 0 AS is_auto_test, tests.test_name, tests.description, tests.id FROM ".makeTableName("tests")." AS tests WHERE id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($options['testID']));

		if ( $result->num_rows === 1 ) {
			$breadcrumb[] = $result->rows[0];
		}		
	}

	if ( array_key_exists("autoSetID",$options) ) {

		$query = "SELECT 'autoSetID' AS crumbName, 1 AS is_auto_test, sets.set_name AS test_name, sets.description, sets.id FROM ".makeTableName("sets")." AS sets WHERE id = ? AND is_auto_test = 1;";
		$result = Db::get_instance()->prepared_query($query,array($options['autoSetID']));

		if ( $result->num_rows === 1 ) {
			$breadcrumb[] = $result->rows[0];
		}		
	}

	return $breadcrumb;
}

///////////////////////////////////////////////////////////////////////////////
// Retrieve an array of full groups records for a moduleID. We are adding fields 
// onto what MySQL gives us: owner_first_name, owner_last_name, owner_id,
// is_user_member, is_user_owner, num_members. We are including the public studygroup,
// if asked, as well as all the groups the user belongs to and any that match the code sent.
//
//	@options:
//
//		.moduleID - the module that contains the groups
//		.groupIDs - array of specific ids to match [null for all groups for a moduleID]
//		.accessorID - the user that wants to access the group(s)
//		.searchCode - the secret code being used to match group(s)
//		.includePublic - are we adding information for the public group as well?
//
//	@returns: an array containing groups (exception on error). empty is possible.
//
///////////////////////////////////////////////////////////////////////////////

function getGroups($options) {

	if ( 
			!array_key_exists("moduleID",$options) ||
			!array_key_exists("groupIDs",$options) ||
			!array_key_exists("accessorID",$options) ||
			!array_key_exists("searchCode",$options) ||
			!array_key_exists("includePublic",$options)
		)
	{
		throw new Exception("Missing option value(s): ".print_r($options,true));
	}

	// groupIDs

	$groupsQueryStr = "";
	$groupsQueryAry = array();

	if ( $options['groupIDs'] === null ) {
		$groupsQueryStr = "(?)";
		$groupsQueryAry[] = 1;
	}
	else {		
		foreach ( $options['groupIDs'] as $setID ) {
			if ( strlen($groupsQueryStr) ) {
				$groupsQueryStr .= ",";
			}
			$groupsQueryStr .= "?";
			$groupsQueryAry[] = $setID;
		}
		$groupsQueryStr = "(groupsworking.id IN (" . $groupsQueryStr . "))";
	}

	// our array of groups to return.
	$groups = array();

	// if we are interested in the public studygroup, grab its info now.

	if ( $options['includePublic'] ) {
		
		$pub = new stdClass();
		$pub->id = "pub";

		$query = 	"SELECT users.full_name FROM ".makeTableName("enrollment")." AS enroll \n";
		$query .=	"INNER JOIN ".makeTableName("users")." AS users ON users.id = enroll.user_id \n";
		$query .=	"WHERE enroll.module_id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($options['moduleID']));

		$pub->num_members = $result->num_rows;
		$pub->members = $result->rows;
		$groups[] = $pub;
	}

	// note that we aren't going to sort here, as it's a text-based sort and MySQL is no good at that.
	// however, we are adding:
	// 	num_members, is_user_member, owner_last_name, owner_first_name, owner_id, is_user_owner, members

	$queryAry = array($options['moduleID'],$options['accessorID']);
	$queryAry = array_merge($queryAry,$groupsQueryAry,array($options['searchCode']));

	$query = 	"SELECT groupsworking.*, COUNT(members.id) AS num_members, SUM(accessorMember.id) IS NOT NULL AS is_user_member, \n";
	$query .=	"	ownerUser.last_name AS owner_last_name, ownerUser.first_name AS owner_first_name, ownerUser.id AS owner_id, ownerUser.id = accessorEnroll.user_id AS is_user_owner \n";
	$query .=	"	FROM ".makeTableName("groups")." AS groupsworking \n";
	$query .=	"INNER JOIN ".makeTableName("enrollment")." AS groupEnroll ON groupEnroll.id = groupsworking.enrollment_id AND groupEnroll.module_id = ? \n";
	$query .=	"INNER JOIN ".makeTableName("users")." AS ownerUser ON ownerUser.id = groupEnroll.user_id \n";
	$query .=	"INNER JOIN ".makeTableName("enrollment")." AS accessorEnroll ON accessorEnroll.module_id = groupEnroll.module_id AND accessorEnroll.user_id = ? \n";
	$query .=	"INNER JOIN ".makeTableName("group_membership")." AS members ON members.group_id = groupsworking.id \n";
	$query .=	"LEFT JOIN ".makeTableName("group_membership")." AS accessorMember ON accessorMember.group_id = members.group_id AND accessorMember.user_id = members.user_id AND accessorMember.user_id = accessorEnroll.user_id \n";
	$query .=	"WHERE ".$groupsQueryStr." \n";
	$query .=	"GROUP BY groupsworking.id \n";
	$query .=	"HAVING (is_user_member = 1 OR groupsworking.code = ?);";

	$result = Db::get_instance()->prepared_query($query,$queryAry);

	if ( $result->num_rows ) {

		// go through all of the groups and add their `members`.
		
		foreach ( $result->rows as $group ) {

			$query =	"SELECT users.full_name FROM ".makeTableName("group_membership")." AS members \n";
			$query .=	"INNER JOIN ".makeTableName("users")." AS users ON users.id = members.user_id \n";
			$query .=	"WHERE members.group_id = ?;";
			$result2 = Db::get_instance()->prepared_query($query,array($group->id));

			$group->members = array();
			foreach ( $result2->rows as $member ) {
				$group->members[] = $member;
			}

			$groups[] = $group;
		}
	}

    return $groups;
}