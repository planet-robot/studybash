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

	public function get_errors() {

		$req = new stdClass;
		$req->executed = null;
		$req->success = null;
		$req->rows = null;

		// pull out all of the errors

		$query = "SELECT * FROM sb_debug_errors ORDER BY id DESC;";
		$result = Db::get_instance()->prepared_query($query,array());

		$req->executed = (boolean)$result;
		$req->success = $req->executed; // 0 rows is perfectly acceptable.
		$req->rows = ( $result->num_rows ? $result->rows : array() );

		return $req;
	}

	/////////////////////////////////////////////////////////////////////////////////////
	// Delete all of the errors.
	/////////////////////////////////////////////////////////////////////////////////////

	public function delete_errors() {

		$req = new stdClass;
		$req->executed = null;
		$req->num_rows = null;

		$query = "DELETE FROM sb_debug_errors;";
		$result = Db::get_instance()->prepared_query($query,array());

		$req->executed = (boolean)$result;
		$req->num_rows = $result->affected_rows;

		return $req;
	}
}