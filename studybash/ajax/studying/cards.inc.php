<?php

//---------------------------------------------------------------------------------------
// Include: cards.inc.php
// Description: This file includes any function that is used by more than one .php file in
//				the "studying" super-section of the site (e.g., "Flashcards" and "Tests" 
//				sections).
//---------------------------------------------------------------------------------------

///////////////////////////////////////////////////////////////////////////////
// This validates a card before it can be added or updated into the db. Any
// problems trigger an exception, as everything should have been caught on
// the client.
//
//	@rec - the card attributes, submitted from client.
//	@return - a verified card record, with all string fields trimmed.
//
///////////////////////////////////////////////////////////////////////////////

function validateCard(&$rec) {

	// ensure all of the required values present (although perhaps not valid).

	$order_id = Leftovers::_safeval($rec,"order_id");
	$rec['order_id'] = gettype($order_id) !== "integer" ? -1 : (int)$order_id;

	$question_text = Leftovers::_safeval($rec,"question_text");
	$rec['question_text'] = gettype($question_text) !== "string" ? "" : trim($question_text);
	
	$answer_text = Leftovers::_safeval($rec,"answer_text");
	$rec['answer_text'] = gettype($answer_text) !== "string" ? null : ( !strlen($answer_text) ? null : trim($answer_text) );

	$tags = Leftovers::_safeval($rec,"tags");	
	$rec['tags'] = gettype($tags) !== "array" ? array() : $tags;

	// (1) order_id. only checked if updating (i.e., it has an id already)

	if ( array_key_exists("id",$rec) ) {

		if ( $rec['order_id'] < 0 ) {		
			throw new Exception("Validation failed (order_id). Rec: ".print_r($rec,true));
		}
	}

	// (2) question_text

	$len = strlen($rec['question_text']);
	if ( !$len || ( $len > 14336 ) ) {
		throw new ServerClientException("Validation failed (question_text). Rec: ".print_r($rec,true),
		createParsedErrorString("question_text",null));
	}

	// (3) answer_text (optional)

	if ( !empty($rec['answer_text']) ) {
		
		$len = strlen($rec['question_text']);
		if ( $len > 4096 ) {
			throw new ServerClientException("Validation failed (answer_text). Rec: ".print_r($rec,true),
			createParsedErrorString("answer_text",null));
		}
	}

	// (4) 	tags. simply ensure that all of the tags present actually correspond to tags
	//		in the db and that there are no duplicates on the card's tag membership.

	if ( count($rec['tags']) ) {

		$tagIDs = array();
		$tagIDsString = "";

		foreach ( $rec['tags'] as $tag ) {

			if ( in_array($tag['id'],$tagIDs) ) {
				throw new ServerClientException("Validation failed (tags:duplicate). Rec: ".print_r($rec,true),
				createParsedErrorString("tags:duplicate",null));
			}

			$tagIDs[] = $tag['id'];

			if ( strlen($tagIDsString) ) {
				$tagIDsString .= ",";
			}
			$tagIDsString .= Db::get_instance()->escape($tag['id']);
		}

		$query = "SELECT id FROM sb_tags WHERE id IN (".$tagIDsString.");";
		$result = Db::get_instance()->prepared_query($query,array());

		if ( $result->num_rows !== count($tagIDs) ) {
			throw new ServerClientException("Validation failed (tags:not found). Rec: ".print_r($rec,true),
			createParsedErrorString("tags:not found",null));
		}
	}

	return $rec;
}

///////////////////////////////////////////////////////////////////////////////
// Create one or more cards for a particular set. Note that we are not creating
// a transaction here, as we may be apart of a chain of calls. It's the caller's
// responsibility to do this.
//
//	@options:
//
//		.moduleID - the module ID that contains the setID
//		.creatorID - the userID that owns the set
//		.setID - the set ID that the card(s) are going into
//		.cards - array of one or more card objects
//
//	@returns: an array of cards created (with updated `id` and `order_id` fields).
//
///////////////////////////////////////////////////////////////////////////////

function createCards($options) {

	global $LIU;

	if ( 
			!array_key_exists("moduleID",$options) ||
			!array_key_exists("creatorID",$options) ||
			!array_key_exists("setID",$options) ||
			!array_key_exists("cards",$options)
		)
	{
		throw new Exception("Missing option value(s): ".print_r($options,true));
	}

	if ( $options['creatorID'] !== $LIU->id ) {
		throw new Exception("Mismatch between user_id on parm (".$options['creatorID'].") and session (".print_r($LIU,true).")");
	}

	// (1)	we have to manually assign the `order_id` values here. so grab the highest one and then increase it for each new card.

	$query = "SELECT MAX(order_id) AS max_order_id FROM ".makeTableName("flashcards")." AS cards WHERE cards.set_id = ?;";
	$result = Db::get_instance()->prepared_query($query,array($options['setID']));

	if ( $result->num_rows !== 1 ) {
		throw new Exception("Unable to retrieve highest order_id for set (".$options['setID']."). Result: ".print_r($result,true));
	}

	$order_id = $result->rows[0]->max_order_id;
	$order_id = ( $order_id === null ? 1 : $order_id+1 );

	// (2) go through all of the cards and validate their data, adding the `order_id` field in as we go.

	foreach ( $options['cards'] as &$card ) {
		$card = validateCard($card);
		$card['order_id'] = $order_id++;
	}
	unset($card);

	// (3) create the new cards in the db, along with new entries for all their tag memberships.

	foreach ( $options['cards'] as &$card ) {

		$query = 	"INSERT INTO ".makeTableName("flashcards")." (set_id,order_id,question_text,answer_text) \n";
		$query .=	"SELECT sets2.id, ?, ?, ? FROM ( \n";
		$query .=	"	SELECT sets.* FROM ".makeTableName("sets")." AS sets \n";
		$query .=	"	INNER JOIN ".makeTableName("enrollment")." AS enroll ON enroll.user_id = ? AND enroll.module_id = ? \n";
		$query .=	"	WHERE sets.enrollment_id = enroll.id \n";
		$query .=	") AS sets2 \n";
		$query .=	"WHERE sets2.id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($card['order_id'],$card['question_text'],$card['answer_text'],$options['creatorID'],$options['moduleID'],$options['setID']));

		if ( $result->affected_rows !== 1 ) {
			throw new Exception("Failed to insert new flashcard. \nParms: ".print_r($parms,true)." \nData: ".print_r($card,true)." \nUser: ".print_r($LIU,true));
		}

		// the insertion has succeeded. let's setup its id (to send back) as well as its created_on and set_id field.
		
		$card['id'] = $result->insert_id;
		$card['set_id'] = $options['setID'];
		
		$query = "SELECT created_on FROM ".makeTableName("flashcards")." WHERE id = ?;";
		$result = Db::get_instance()->prepared_query($query,array($card['id']));

		if ( $result->num_rows != 1 ) {
			throw new Exception("Retrieve failed on new card. Result: ".print_r($result,true)." Data: ".print_r($card,true));
		}
		
		$card['created_on'] = $result->rows[0]->created_on;

		// now we have to add the tags for the card to the db. for this we link the id of the
		// card we just created with a number of tag_ids in the membership table.

		if ( count($card['tags']) ) {

			$queryStr = "";
			$queryAry = array();

			foreach ( $card['tags'] as $tag ) {

				if ( strlen($queryStr) ) {
					$queryStr .= ", ";
				}
				$queryStr .= "(?,?)";

				array_push($queryAry,$card['id'],$tag['id']);
			}

			$query =	"INSERT INTO ".makeTableName("flashcard_tags")." (flashcard_id,tag_id) VALUES ".$queryStr.";";
			$result = Db::get_instance()->prepared_query($query,$queryAry);

			if ( $result->affected_rows !== count($card['tags']) ) {
				throw new Exception("Failed to insert tags along with card. \nParms: ".print_r($parms,true)." \nData: ".print_r($card,true));
			}
		}
	}			
	unset($card);

	return $options['cards'];
}