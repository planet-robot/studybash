<?php

//---------------------------------------------------------------------------------------
// File: cards-backbone.php
// Description: All of the backbone calls relating to cards arrive here. This will only
//				be from the models themselves, never from the collection. The calls
//				we receive are: POST, PUT, PATCH, DELETE
//---------------------------------------------------------------------------------------

$LIU = null; // the logged-in user.

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
require_once( Bootstrap::get_php_root() . "ajax/studying/cards.inc.php" );

try {	

	// tell our helper classes what tables we're using, pull in the
	// data from the connection, and verify that the user belongs here.

	setupTableNames();

	$request_method = $_SERVER['REQUEST_METHOD'];
	$rdata = Leftovers::get_RESTful_data();
	$parms = Leftovers::explode_path_info();
	$num_parms = count($parms);

	$LIU = verifySessionAndUserStatus();

	// SECTION: POST
	//
	// We are creating a new card, which belongs to a particular set, which belongs to a particular enrollment (moduleID and userID combo).

	if ( ( $request_method === "POST" ) && ( $num_parms === 3 ) ) {

		// the user must have a status above probation for this.
		$userStatusProbation = (int)DbSettings::get_instance()->get_setting("user_status_probation");
		if ( $LIU->status <= $userStatusProbation ) {
			throw new Exception("Probation user trying to create a card. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true));
		}

		Db::get_instance()->begin_transaction();

		try {

			// we are calling a function expects to create 1+ cards, but we are only creating 1.

			$newCards = createCards(array(
				"moduleID"=>(int)$parms[0],
				"creatorID"=>(int)$parms[1],
				"setID"=>(int)$parms[2],
				"cards"=>array($rdata)
			));

			if ( count($newCards) !== 1 ) {
				throw new Exception("Failed to retrieve single card from `createCards`. \nParms: ".print_r($parms,true)." \nData: ".print_r($rdata,true)." \nReturn: ".print_r($cards,true));
			}

			Db::get_instance()->commit();
			Db::get_instance()->end_transaction();

			// Done. Send it back.
		
			Activity::add_to_db("add.card","\nUser: ".print_r($LIU,true)."\nData: ".print_r($rdata,true),"low");
			Quit::get_instance()->json_exit($newCards[0]);
		}

		catch ( Exception $e ) {

			Db::get_instance()->rollback(); // no effect if nothing to rollback

			try { Db::get_instance()->end_transaction(); }
			catch ( Exception $e2 ) {}

			throw $e;
		}
	}

	// DELETE
	//
	// We are deleting a single card.

	else if ( ( $request_method === "DELETE" ) && ( $num_parms === 4 ) ) {

		$moduleID = (int)$parms[0];
		$accessorID = (int)$parms[1];
		$setID = (int)$parms[2];
		$cardID = (int)$parms[3];

		if ( $accessorID !== $LIU->id ) {
			throw new Exception("Mismatch between user_id on parm (".$accessorID.") and session (".print_r($LIU,true).")");
		}

		Db::get_instance()->begin_transaction();

		try {

			deleteCards(array(
				"cardIDs"=>array($cardID),
				"setID"=>$setID,
				"moduleID"=>$moduleID,
				"userID"=>$accessorID
			));

			Db::get_instance()->commit();
			Db::get_instance()->end_transaction();

			// Done. No response necessary.
			
			Activity::add_to_db("delete.card","\nUser: ".print_r($LIU,true)."\nParms: ".print_r($parms,true),"medium");
			Quit::get_instance()->json_exit(null);
		}

		catch ( Exception $e ) {

			Db::get_instance()->rollback(); // no effect if nothing to rollback

			try { Db::get_instance()->end_transaction(); }
			catch ( Exception $e2 ) {}

			throw $e;
		}
	}

	// PUT
	//
	// Updating the values for a particular card.

	else if ( ( $request_method === "PUT" ) && ( $num_parms === 4 ) ) {

		$moduleID = (int)$parms[0];
		$accessorID = (int)$parms[1];
		$setID = (int)$parms[2];
		$cardID = (int)$parms[3];

		if ( $accessorID !== $LIU->id ) {
			throw new Exception("Mismatch between user_id on parm (".$accessorID.") and session (".print_r($LIU,true).")");
		}

		$cardAttrs = validateCard($rdata);

		if ( ( $setID !== $cardAttrs['set_id'] ) || ( $cardID !== $cardAttrs['id'] ) ) {
			throw new Exception("Mismatch on parms IDs (".print_r($parms,true).") and record: ".print_r($cardAttrs,true));
		}

		// we don't want only part of this to succeed.
		Db::get_instance()->begin_transaction();

		try {

			// pull out the existing card.

			$existingCard = getCards(array(
				"accessorID"=>$accessorID,
				"setIDs"=>array($setID),
				"cardIDs"=>array($cardID),
				"keywords"=>array(),
				"tags"=>array()
			));

			if ( count($existingCard) !== 1 ) {
				throw new Exception("Failed to retrieve card on update. \nParms: ".print_r($parms,true)." \nAttrs: ".print_r($cardAttrs,true). " \nCard(s) Returned: ".print_r($existingCard,true));
			}

			$existingCard = $existingCard[0];

			// ensure that the accessor has access to this card

			if ( $existingCard->created_by_id !== $accessorID ) {
				throw new Exception("User trying to edit a card they don't own. \nParms: ".print_r($parms,true)." \nAttrs: ".print_r($cardAttrs,true));
			}

			// figure out if the card's tags have been updated. if so, record the ones
			// that were removed and the ones that were added.

			$tagsChanged = ( count($existingCard->tags) !== count($cardAttrs['tags']) );
			
			$removingStr = "";
			$removingIDs = array();
			$removingQueryAry = array();

			$addingStr = "";
			$addingIDs = array();
			$addingQueryAry = array();

			if ( ( $tagsChanged ) || ( count($cardAttrs['tags']) ) ) {

				// duplicates were checked for already, in validation above.

				foreach ( $existingCard->tags as $tag ) {

					$idx = Leftovers::indexOfObj($cardAttrs['tags'],function($o) use ($tag) {
						return ( $o->id === $tag->id );
					});

					if ( $idx === null ) {
						$tagsChanged = true;
						$removingStr .= ( strlen($removingStr) ? ",?" : "?" );
						$removingIDs[] = $tag->id;
						$removingQueryAry[] = $tag->id;
					}
				}

				foreach ( $cardAttrs['tags'] as $tag ) {

					$idx = Leftovers::indexOfObj($existingCard->tags,function($o) use ($tag) {
						return ( $o->id === $tag['id'] );
					});

					// no need to set `tagsChanged` as it will already have been
					// set in the above foreach.

					if ( $idx === null ) {
						$addingStr .= ( strlen($addingStr) ? ",(?,?)" : "(?,?)" );
						$addingIDs[] = $tag['id'];
						array_push($addingQueryAry,$cardID,$tag['id']);
					}
				}
			}

			$query = 	"UPDATE ".makeTableName("flashcards")." AS flashcards \n";				
			$query .= 	"INNER JOIN ".makeTableName("sets")." AS sets ON sets.id = flashcards.set_id AND sets.id = ? \n";
			$query .= 	"INNER JOIN ".makeTableName("enrollment")." AS ownerEnroll ON ownerEnroll.id = sets.enrollment_id AND ownerEnroll.module_id = ? AND ownerEnroll.user_id = ? \n";
			$query .=	"SET flashcards.order_id = ?, flashcards.question_text = ?, flashcards.answer_text = ? \n";
			$query .=	"WHERE flashcards.id = ?;";
			
			$result = Db::get_instance()->prepared_query($query,array($setID,$moduleID,$accessorID,$cardAttrs['order_id'],$cardAttrs['question_text'],$cardAttrs['answer_text'],$cardID));

			if ( ( $result->affected_rows !== 1 ) && ( !$tagsChanged ) ) {
				throw new Exception("Failed to update flashcard. \nParms: ".print_r($parms,true)." \nRec: ".print_r($cardAttrs,true));
			}

			if ( $tagsChanged ) {

				// remove the tag memberships that are gone and add in the new ones.

				if ( count($removingIDs) ) {

					array_unshift($removingQueryAry,$cardID);

					$query = "DELETE tags FROM ".makeTableName("flashcard_tags")." AS tags WHERE tags.flashcard_id = ? AND tags.tag_id IN (".$removingStr.");";					
					$result = Db::get_instance()->prepared_query($query,$removingQueryAry);

					if ( $result->affected_rows !== count($removingIDs) ) {
						throw new Exception("Failed to delete all the tags. Expected=".count($removingIDs)." Result=".$result->affected_rows." \nOriginal card: ".print_r($existingCard,true)." \nNew card: ".print_r($cardAttrs,true));
					}
				}

				if ( count($addingIDs) ) {

					$query =	"INSERT INTO ".makeTableName("flashcard_tags")." (flashcard_id,tag_id) VALUES ".$addingStr.";";
					$result = Db::get_instance()->prepared_query($query,$addingQueryAry);

					if ( $result->affected_rows !== count($addingIDs) ) {
						throw new Exception("Failed to insert all the new tag memberships. Expected=".count($addingIDs)." Result=".$result->affected_rows." \nOriginal card: ".print_r($existingCard,true)." \nNew card: ".print_r($cardAttrs,true));
					}
				}
			}

			Db::get_instance()->commit();
			Db::get_instance()->end_transaction();

			// Done. No content need be returned on success.			
			Activity::add_to_db("update.card","\nUser: ".print_r($LIU,true)."\nData: ".print_r($cardAttrs,true),"low");
			Quit::get_instance()->json_exit(null);
		}

		catch ( Exception $e ) {

			Db::get_instance()->rollback(); // no effect if nothing to rollback

			try { Db::get_instance()->end_transaction(); }
			catch ( Exception $e3 ) {}

			throw $e;
		}
	}

	// PATCH
	//
	// Flagging a card

	else if ( ( $request_method === "PATCH" ) && ( $num_parms === 4 ) ) {

		$moduleID = (int)$parms[0];
		$targetUserID = (int)$parms[1]; // whose content are we flagging?
		$setID = (int)$parms[2];
		$cardID = (int)$parms[3];

		// a user CANNOT flag their own stuff.
		if ( $targetUserID === $LIU->id ) {
			throw new Exception("User trying to flag their own card. \nUser: ".print_r($LIU,true));
		}

		$is_flagged = Leftovers::_safeval($rdata,"is_flagged");
		if ( $is_flagged !== true ) {
			throw new Exception("Unexpected value for `is_flagged`: ".print_r($is_flagged,true));
		}

		// now, we are only allowed to flag if certain conditions are met.

		if ( !canFlag($targetUserID) ) {
			throw new ServerClientException(
				"Trying to flag when they are unable to. \nUser: ".print_r($LIU,true)."\nCardID: ".$setID,
				createParsedErrorString("flag-reputation",null)
			);
		}
		else {

			// add to the 'flags' table.

			$query = 	"INSERT IGNORE INTO ".makeTableName("flagged_flashcards")." (flashcard_id,flagged_by_id) VALUES (?,?);";
			$result = Db::get_instance()->prepared_query($query,array($cardID,$LIU->id));

			if ( !$result->affected_rows ) {
				throw new ServerClientException(
					"Failed to flag a card. Duplicate? \nUser: ".print_r($LIU,true)."\nCardID: ".$cardID,
					createParsedErrorString("flag-duplicate",null)
				);
			}

			Activity::add_to_db("flag.card","User: ".print_r($LIU,true)."\nCardID: ".$cardID." \nTargetUserID: ".$targetUserID,"very high");
			Quit::get_instance()->json_exit(null);
		}
	}

	// INVALID

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