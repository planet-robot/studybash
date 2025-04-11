<?php

//---------------------------------------------------------------------------------------
// Singleton: SessionToken
// Description: Utility singleton that adds an extra layer of security against CSRF/XSRF
//              attacks. Does not actually deal with $_SESSION data at all, hence no
//              dependency on Session. For this to be useful, however, everytime data
//              is sent to the server, the `session_token` must be sent along with it.
//              So you'll want to check the cookie against the Db-stored token everytime you
//              `continue_session()` as well as checking something in $_POST/$_GET against
//              the Db-stored token as well, making sure that they've sent it along with
//              every form/piece of data (this is what ACTUALLY blocks the CSRF attack).
// Dependencies: Db
//
// References:
//	http://www.codinghorror.com/blog/2008/10/preventing-csrf-and-xsrf-attacks.html
//	http://jaspan.com/improved_persistent_login_cookie_best_practice
//
//	Notes: For this to work, it requires:
//			(1) You to call `SessionToken::set_table_name()`... THEN...
//			(2) The table has fields: session_user_id, session_user_agent, session_token, issued_on
//			(3) You to call `SessionToken::set_user_id()`
//---------------------------------------------------------------------------------------

class SessionToken {

    //
    // Static Member Data
    //

    private static $_instance = null;
	private static $_table_name = null;
    private static $_user_id = null;
	private static $_user_agent = null;
    
    //
    // Private Member Data
    //
    
    private $session_token = null;
        
    //
    // Public interface
    //
	
	///////////////////////////////////////////////////////////////////////////
	// Simple `set` function. This identifies which db table to use when
	// creating/checking tokens.
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

            $remote_addr = "";
            if ( isset($_SERVER['HTTP_CF_CONNECTING_IP']) ) {
                $remote_addr = $_SERVER['HTTP_CF_CONNECTING_IP'];
            }
            else {
                $remote_addr = $_SERVER['REMOTE_ADDR'];
            }

			self::$_user_agent = Db::get_instance()->escape(md5($remote_addr . $_SERVER['HTTP_USER_AGENT']));
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
    // This assumes that the correct session token has been put into the
	// HTTP headers. see: http://stackoverflow.com/questions/541430/how-do-i-read-any-request-header-in-php
	// The token is retrieved from those headers and then verified against:
    // (a) the cookie the user should have
    // (b) the value in the db.
    //
    // If verification fails, an exception is thrown.
    ///////////////////////////////////////////////////////////////////////////

    public function verify_current_token() {
	
		if ( !array_key_exists("HTTP_SESSIONTOKEN",$_SERVER) ) {
			throw new Exception("HTTP_SESSIONTOKEN does not exist in `_SERVER`.");
		}
		
		$user_token = $_SERVER['HTTP_SESSIONTOKEN'];

        // check the cookie first.

        $cookie_match = false;

		$vals = null;
        if ( array_key_exists("sessiontoken_php_session_cookie",$_COOKIE) ) {
            $vals = $this->extract($_COOKIE['sessiontoken_php_session_cookie']);
            if ( ( $vals[0] === self::$_user_id ) && ( $vals[1] === self::$_user_agent ) && ( $vals[2] === $user_token ) ) {
                $cookie_match = true;
            }
        }

        if ( !$cookie_match ) {
            throw new Exception("Failed HTTP_SESSIONTOKEN verification (cookie). `user_token`: ".$user_token." cookie: ".print_r($vals,true));
        }

        // now check the DB.

        $query = "SELECT session_token FROM ".self::$_table_name." WHERE session_user_id = ? AND session_user_agent = ?;";
        $result_obj = Db::get_instance()->prepared_query($query,array(self::$_user_id,self::$_user_agent));

        if ( ( !$result_obj ) || ( $result_obj->num_rows !== 1 ) ) {
            throw new Exception("Failed HTTP_SESSIONTOKEN verification (db-select).");
        }

        $token_to_match = $result_obj->rows[0]->session_token;
        if ( $user_token !== $token_to_match ) {
			throw new Exception("Failed HTTP_SESSIONTOKEN verification (db-match). `user_token`: ".$user_token);
		}
    }
	
	///////////////////////////////////////////////////////////////////////////
    // Removes any existing tokens in the db for the user. This is not done
	// within a transaction by default, that's left up to the caller.
	//
	//	@return - number of tokens removed.
    ///////////////////////////////////////////////////////////////////////////

    public function remove_token() {

        if ( !self::$_instance ) {
            return false;
        }

		//$query = "DELETE FROM ".self::$_table_name." WHERE session_user_id = ? AND session_user_agent = ?;";
		$query = "DELETE FROM ".self::$_table_name." WHERE session_user_id = ?;";
		//$result_obj = Db::get_instance()->prepared_query($query,array(self::$_user_id,self::$_user_agent));
		$result = Db::get_instance()->prepared_query($query,array(self::$_user_id));

        if ( !$result ) {
			throw new Exception("DELETE previous token(s) failed to execute.");
        }
		
		return $result->affected_rows;
	}

    ///////////////////////////////////////////////////////////////////////////
    // This method creates a new `token` for the session. It removes any existing
    // tokens in the db for the user, inserts the newly created one, and sets the cookie.
	//
	//	@cookie_lifetime - how many seconds to live for (0=browser close)
	//	@return - the token. exception on failure.
    ///////////////////////////////////////////////////////////////////////////

    public function create_new_token($cookie_lifetime = 0) {

        if ( !self::$_instance ) {
            return false;
        }

		$this->session_token = $this->generate_token();
		
		// since we aren't using `session_set_cookie_params`, we have to manually
		// add the time() here, as we are manually specifying the TIME that it DIES
		// as an absolute, not a relative amount of seconds from now.
		if ( $cookie_lifetime ) {
			$cookie_lifetime += time();
		}

        // within a transaction, we will delete the old token(s) and create a new one. if anything goes wrong, nothing
        // will change.

        $db = Db::get_instance();

        try {

            $db->begin_transaction();

            // remove the old Db entry, and create a new one. we're not too worried if there isn't an old one in there, as this may indeed be
            // the first one ever.

            $this->remove_token();

            $query = "INSERT INTO ".self::$_table_name." (session_user_id,session_user_agent,session_token) VALUES (?,?,?);";
            $result_obj = Db::get_instance()->prepared_query($query,array(self::$_user_id,self::$_user_agent,$this->session_token));

            if ( ( !$result_obj ) || ( $result_obj->affected_rows !== 1 ) ) {
                throw new Exception("Failed to create a new record in `session_tokens` table");
            }

            // success.

            $db->commit();
            $db->end_transaction();
        }
        catch ( Exception $e ) {

            $db->rollback();
            
            try { $db->end_transaction(); }
            catch ( Exception $e2 ) {}

            throw $e;
        }

        // the db entry has been created. now create the cookie.
        
        $params = session_get_cookie_params(); // this pulls info from php.ini
        if ( !setcookie("sessiontoken_php_session_cookie",$this->combine(self::$_user_id,self::$_user_agent,$this->session_token),$cookie_lifetime,$params["path"],$params["domain"],$params["secure"],$params["httponly"]) ) {
            throw new Exception("Failed to create cookie for the session_token");
        }

        return $this->session_token;
    }

    //
    // Private methods
    //

    ///////////////////////////////////////////////////////////////////////////
    // Explodes the stored string into user_id and session_token strings.
    //
    //  @return: empty array on error, otherwise array of count 2 (id,token)
    ///////////////////////////////////////////////////////////////////////////

    private function extract($stored_string) {

        if ( gettype($stored_string) !== "string" ) {
            return array();
        }
    
        $vals = explode("|",$stored_string);
        if ( count($vals) !== 3 ) {
            $vals = array();
        }

        return $vals;
    }

    ///////////////////////////////////////////////////////////////////////////
    // Implodes the user_id and session_token into a single string.
    //
    //  @return - the combined string
    ///////////////////////////////////////////////////////////////////////////

    private function combine($user_id,$user_agent,$session_token) {
        return implode("|",array($user_id,$user_agent,$session_token));
    }

    ///////////////////////////////////////////////////////////////////////////
    // Simply generate a random string of length N.
    ///////////////////////////////////////////////////////////////////////////

    private function generate_token( $length = 32 ) {
    
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $token = '';
        for ($i = 0; $i < $length; $i++) {
            $token .= $characters[rand(0, strlen($characters) - 1)];
        }
        return $token;
    }

    ///////////////////////////////////////////////////////////////////////////
    // Nothing to do here.
    ///////////////////////////////////////////////////////////////////////////

    private function __construct() {}
    private function __clone() {}    
}