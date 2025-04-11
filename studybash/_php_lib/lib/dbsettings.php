<?php

//---------------------------------------------------------------------------------------
// Singleton: DbSettings
// Description: Utility singleton that allows you to get key-value setting pairs from
//				a database. Similar in theme to Cfg, except a singleton and with a db.
// Dependencies: Db
//
//	Notes: For this to work, it requires:
//			(1) You to call `DbSettings::set_table_name()`... THEN...
//			(2) The table has fields: setting_key, setting_value
//---------------------------------------------------------------------------------------

class DbSettings {

    //
    // Static Member Data
    //

    private static $_instance = null;
	private static $_table_name = null;
    
    //
    // Public interface
    //
	
	///////////////////////////////////////////////////////////////////////////
	// Simple `set` function. This identifies which db table to use when
	// retrieving settings.
	///////////////////////////////////////////////////////////////////////////

	public static function set_table_name($table_name) {
		self::$_table_name = Db::get_instance()->escape($table_name);
	}

    public static function get_instance() {
	
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
    // Checks to see whether a particular key-value pair is present in the
	// settings.
	//
	//	@return - boolean.
    ///////////////////////////////////////////////////////////////////////////

    public function has_setting($key) {

        $query = "SELECT setting_value FROM ".self::$_table_name." WHERE setting_key = ?;";
        $result = Db::get_instance()->prepared_query($query,array($key));

        return $result->num_rows > 0;
    }
	
	///////////////////////////////////////////////////////////////////////////
    // Returns the value for a particular key. If that key does not exist, an
	// exception is thrown.
    ///////////////////////////////////////////////////////////////////////////

    public function get_setting($key) {

        $query = "SELECT setting_value FROM ".self::$_table_name." WHERE setting_key = ?;";
        $result = Db::get_instance()->prepared_query($query,array($key));

        if ( $result->num_rows != 1 ) {
			throw new Exception("Failed to retrieve value for key (".$key.")");
		}
		else if ( $result->num_rows > 1 ) {
			throw new Exception("Multiple values returned for key (".$key."): ".print_r($result->rows,true));
		}
		else {
			return $result->rows[0]->setting_value;
		}
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