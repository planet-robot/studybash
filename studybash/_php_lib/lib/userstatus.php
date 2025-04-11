<?php

//---------------------------------------------------------------------------------------
// Singleton: UserStatus
// Description: Utility singleton that allows you to get the current status of a given
//				user in the db. Tiny amount of functionality, but used so often that it was
//				centralized here.
// Dependencies: Db
//
//	Notes: For this to work, it requires:
//			(1) You to call `UserStatus::set_table_name()`
//			(2) That table has fields: id, status
//			(3) You to call `UserStatus::set_user_id()`
//---------------------------------------------------------------------------------------

class UserStatus {

    //
    // Static Member Data
    //

    private static $_instance = null;
	private static $_table_name = null;
    private static $_user_id = null;
	
    //
    // Private Member Data
    //
        
    //
    // Public interface
    //
	
	///////////////////////////////////////////////////////////////////////////
	// Simple `set` functions
	///////////////////////////////////////////////////////////////////////////

	public static function set_table_name($table_name) {
		self::$_table_name = Db::get_instance()->escape($table_name);
	}
	
    public static function set_user_id($user_id) {

        if ( !self::$_user_id ) {

            self::$_user_id = null;

            if ( !strlen(strval($user_id)) ) {
                throw new Exception("`user_id` must have a value");
            }

            self::$_user_id = Db::get_instance()->escape($user_id);
        }
    }

    public static function get_instance() {

        if ( !self::$_user_id ) {
            throw new Exception( __METHOD__ . "(): `user_id` must have a value");
        }
		
		if ( !self::$_table_name ) {
			throw new Exception( __METHOD__ . "(): `table_name` is not set." );
		}

		try {
			Db::get_instance();
		}
		catch ( Exception $e ) {
			throw new Exception("`Db` is not available");
		}

        if ( !(self::$_instance instanceof self) ) {
            self::$_instance = new self();
        }

        return self::$_instance;
    }

    ///////////////////////////////////////////////////////////////////////////
    // This simply pulls out and returns the status of the currently setup user.
	//
	//	@return - int. errors are thrown as exceptions.
    ///////////////////////////////////////////////////////////////////////////

    public function get_status() {

        $query = "SELECT status FROM ".self::$_table_name." WHERE id = ?;";
        $result = Db::get_instance()->prepared_query($query,array(self::$_user_id));

        if ( ( !$result ) || ( $result->num_rows !== 1 ) ) {
            throw new Exception("Failed to retrieve user from db. id: ".self::$_user_id);
        }
		
		return $result->rows[0]->status;
    }
	
    //
    // Private methods
    //

    ///////////////////////////////////////////////////////////////////////////
    // Nothing to do here.
    ///////////////////////////////////////////////////////////////////////////

    private function __construct() {}
    private function __clone() {}    
}