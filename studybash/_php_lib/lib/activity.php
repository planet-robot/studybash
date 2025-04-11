<?php

//---------------------------------------------------------------------------------------
// Static Class: Activity
// Description: Utility singleton for exception and error-related functionality.
// Dependencies: Db, Leftovers (optional?)
//
//	Notes: For `add_to_db()` to work (optional), it expects:
//			(1) You to call `Activity::set_table_name()`... THEN...
//			(2) The table has fields: user_id, institution_id, activity_key, activity_value, interest_level[enum] (req)
//			(3) The user_id is available in $_SESSION['user'] ->full_name and ->id (optional)
//			(4) The institution_id is available in $_SESSION['user']->institution_id (optional)
//			(5) You can call `Activity::set_max_records()` (optional)
//
// Here are the expectations for the interest_level value:
//	(1) very high = requires immediate attention
//	(2) high = potential for abuse
//	(3) medium = of interest
//	(4) low = common
//	(5) very low = of no intrinsic interest. maybe part of investigation.
//---------------------------------------------------------------------------------------

class Activity {

	//
	// Private Member Data
	//

	private static $_instance = null;
	private static $_table_name = null;
	private static $_max_records = 500;

	//
	// Public Interface
	//

	///////////////////////////////////////////////////////////////////////////
	// Simple `set` functions.
	///////////////////////////////////////////////////////////////////////////

	public static function set_table_name($table_name) {
		self::$_table_name = Db::get_instance()->escape($table_name);
	}
	
	public static function set_max_records($max_records) {
		self::$_max_records = (int)$max_records;
	}

	///////////////////////////////////////////////////////////////////////////
	// Add an activity to a db. We require the table name to be set in
	// member data, and for the db module to be available.
	//
	//	Notes: Expects these things:
	//		(1) The table has columns: user_id, institution_id, activity_key, activity_value, interest_level[enum] (req)
	//		(1.5) interest_level must be in ("very low","low","medium","high","very high")
	//		(2) The user_id is available in $_SESSION['user'] ->full_name and ->id (optional)
	//		(3) The institution_id is available in $_SESSION['user']->institution_id (optional)
	///////////////////////////////////////////////////////////////////////////

	public static function add_to_db( $key, $value, $interest_level ) {

		if ( !self::$_table_name ) {
			error_log( __METHOD__."(): `table_name` is not set" );
			return;
		}

		// ensure that the db is available, before moving ahead

		try {
			Db::get_instance();
		}
		catch ( Exception $e ) {
			error_log( __METHOD__ . "(): `Db` is not available" );
			return;
		}
		
		// we will not add more than X records, to prevent outside abuse.
		$query = "SELECT count(*) AS num_activity FROM ".self::$_table_name.";";
		
		try {			
			$result = Db::get_instance()->prepared_query($query,array());
			if ( $result->num_rows !== 1 ) {
				throw new Exception("`num_rows` was: ".$result->num_rows);
			}
			if ( $result->rows[0]->num_activity > self::$_max_records ) {
				throw new Exception("`max_records` reached");
			}
		}
		catch ( Exception $e ) {
			error_log( __METHOD__ . "(): INSERT failed on query: " . $query . " error*: " . $e->getMessage() );
			return;
		}
		
		// would rather have SOME of the strings that nothing (due to exception when too long)
		$key = Leftovers::get_instance()->crop_string($key,128);
		$value = Leftovers::get_instance()->crop_string($value,1024);

		$user_id = null;
		$institution_id = null;
		
		// look for the user ID and institution ID
		
		if ( isset($_SESSION) && array_key_exists("user",$_SESSION) ) {
			
			if ( is_a($_SESSION['user'],"stdClass") ) {
			
				if ( property_exists($_SESSION['user'],"full_name") ) {
					$user_id = $_SESSION['user']->full_name;
				}

				if ( property_exists($_SESSION['user'],"id") ) {
					if ( empty($user_id) ) {
						$user_id = "";
					}
					$user_id .= " (" . $_SESSION['user']->id . ")";
				}

				if ( property_exists($_SESSION['user'],"institution_id") ) {
					$institution_id = $_SESSION['user']->institution_id;
				}
			}
		}
		
		// insert, with a prepared statement

		$query = "INSERT INTO " . self::$_table_name . " (user_id, institution_id, activity_key, activity_value, interest_level) VALUES (?, ?, ?, ?, ?);";

		$affected_rows = null;
		try {
			$result = Db::get_instance()->prepared_query($query,array($user_id,$institution_id,$key,$value,$interest_level));
			$affected_rows = $result->affected_rows;
			if ( $affected_rows !== 1 ) {
				throw new Exception("`affected_rows` was (".$affected_rows.")");
			}
		}
		catch ( Exception $e ) {			
			error_log( __METHOD__ . "(): INSERT failed on query: " . $query . " error*: " . $e->getMessage() );
			return;
		}
	}

	//
	// Private Methods
	//
}