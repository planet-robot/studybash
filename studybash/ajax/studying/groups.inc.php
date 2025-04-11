<?php

//---------------------------------------------------------------------------------------
// Include: groups.inc.php
// Description: This file includes any function that is used by more than one .php file in
//				the "groups" section.
//---------------------------------------------------------------------------------------

///////////////////////////////////////////////////////////////////////////////
// This validates a group before it can be added or updated into the db. Any
// problems trigger an exception, as everything should have been caught on
// the client.
//
//	@rec - the group attributes, submitted from client.
//	@return - a verified group record, with all string fields trimmed.
//
///////////////////////////////////////////////////////////////////////////////

function validateGroup($rec) {

	// ensure all of the required values present (although perhaps not valid).

	$code = Leftovers::_safeval($rec,"code");
	$rec['code'] = gettype($code) !== "string" ? "" : trim($code);

	// (1) code

	$pattern = "/^[A-z0-9]{6}$/";
	if ( preg_match($pattern,$rec['code']) !== 1 ) {
		throw new Exception("Validation failed (code). Rec: ".print_r($rec,true));
	}
    
	// okay, we have succeeded. return the record
	return $rec;
}