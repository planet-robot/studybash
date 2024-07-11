<?php

//---------------------------------------------------------------------------------------
// Class: Model
// Description: `Model` class for the VIEW section.
//---------------------------------------------------------------------------------------

class Model {

	//
	// Public Interface
	//

	// typically, the model doesn't ask view/controller for anything	

	public function __construct() {}

	/////////////////////////////////////////////////////////////////////////////////////
	// Get all of the errors from the server.
	/////////////////////////////////////////////////////////////////////////////////////

	public function get_activity($filter) {

		$req = new stdClass;
		$req->executed = null;
		$req->success = null;
		$req->rows = null;

		// pull out all of the errors

		$params = array();
		$query = "SELECT * FROM sb_debug_activity ";
		if ( $filter ) {
			$query .= "WHERE interest_level = ? ";
			$params[] = $filter;
		}
		$query .= "ORDER BY id DESC;";
		
		$result = Db::get_instance()->prepared_query($query,$params);

		$req->executed = (boolean)$result;
		$req->success = $req->executed; // 0 rows is perfectly acceptable.
		$req->rows = ( $result->num_rows ? $result->rows : array() );

		return $req;
	}

	/////////////////////////////////////////////////////////////////////////////////////
	// Delete all of the errors.
	/////////////////////////////////////////////////////////////////////////////////////

	public function delete_activity($filter) {

		$req = new stdClass;
		$req->executed = null;
		$req->num_rows = null;

		$params = array();
		$query = "DELETE FROM sb_debug_activity ";
		if ( $filter ) {
			$query .= "WHERE interest_level = ?;";
			$params[] = $filter;
		}
		else {
			$query .= ";";
		}
		$result = Db::get_instance()->prepared_query($query,$params);

		$req->executed = (boolean)$result;
		$req->num_rows = $result->affected_rows;

		return $req;
	}
}