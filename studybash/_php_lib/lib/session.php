<?php

//---------------------------------------------------------------------------------------
// Singleton: Session
// Description: Utility singleton for all session-related functionality.
// Dependencies: Bootstrap
//---------------------------------------------------------------------------------------

//fixme: ini_set('session.save_path') should be set to a directory that is not web-visible, and not on a shared account.

class Session {

	//
	// Static Member Data
	//

	private static $_instance;
	
	//
	// Private Member Data
	//
    
    private $session_root_key;
    private $session_id_match;

    private $is_session;
    public $is_broken_session; // set in continue_session()
        
    //
    // Public interface
    //

	public static function get_instance() {

		if ( !(self::$_instance instanceof self) ) {
			self::$_instance = new self();
		}

		return self::$_instance;
	}

	///////////////////////////////////////////////////////////////////////////
    // Here we try to continue an existing session. There must be a number
    // of steps met for that to succeed. Detailed result of success/failure will
    // be reflected in private member vars.
	//
	//	@return - boolean
    ///////////////////////////////////////////////////////////////////////////

    public function continue_session($regenerate_id = false) {

        $this->is_session = false;
        $this->is_broken_session = null;

        if ( !$this->session_root_key ) {
        	throw new Exception("`session_root_key` is invalid");
        }

        // do we already have a session at all? if session_start() had
        // already been called, then session_id() would contain
        // a value. if not, we'll call it.

        if ( session_id() === "" ) {

            if ( !session_start() ) {
        		throw new Exception("`session_start()` failed");
            }
        }

        // a session exists. if it's a session created by us, then
        // a particular key will exist in $_SESSION.

        if ( !array_key_exists($this->session_root_key,$_SESSION) ) {
            
            $this->destroy_session();
            return false;
        }

        // okay, we have a session created by us, so we're good
        // to go. however, let's double check that it's the same
        // user agent that's trying to continue it.

        $this->is_session = true;

        if ( ( !array_key_exists("id",$_SESSION) ) || ( $_SESSION['id'] !== $this->session_id_match ) ) {            
            $this->destroy_session();
            $this->is_broken_session = true;
            return false;
        }

        if ( $regenerate_id ) {
        	session_regenerate_id(true);
        }

        return true;
    }

    ///////////////////////////////////////////////////////////////////////////
    // Create a brand new session. The only param represents the cookie lifetime
    // or, in other words, how many seconds to keep the session open for. 0 = when
    // browser closes, 86400 = 24 hours.
	//
	//	@cookie_lifetime - how many seconds to live for (0=browser close)
	//	@return - nothing. throws an exception on any failure.
    ///////////////////////////////////////////////////////////////////////////

    public function create_session( $cookie_lifetime = 0 ) {

        $this->is_session = false;
        $this->is_broken_session = null;

        if ( !$this->session_root_key ) {
        	throw new Exception("`session_root_key` is invalid");
        }

        // if session_start() has already been called, then session_id() will
        // have a value in it.

        if ( session_id() === "" ) {

        	// this must be called before session_start.
        	session_set_cookie_params($cookie_lifetime);

            if ( !session_start() ) {
            	throw new Exception("`session_start()` failed");
            }
        }

        // setup the data that identifies the session as belonging to
        // this site and this user agent.

		session_regenerate_id(true);
        $_SESSION = array();
        $_SESSION[$this->session_root_key] = true;
        $_SESSION['id'] = $this->session_id_match;
    }

    ///////////////////////////////////////////////////////////////////////////
    // We only have a valid session if both of our internal results demonstrate
    // success.
    ///////////////////////////////////////////////////////////////////////////

    public function get_is_valid_session() {
        return ( ( $this->is_session === true ) && ( $this->is_broken_session === false ) );
    }
	
	///////////////////////////////////////////////////////////////////////////
    // Destroys all data relating to the current session, and then ends the
    // session.
    ///////////////////////////////////////////////////////////////////////////

    public function destroy_session() {
	
		// if there is no session, we need not do anything.
        if ( session_id() === "" ) {
            return;
        }
        
        // remove cookie (if used). this works by resetting the cookie to
        // expire sometime in the past.

        if ( ini_get("session.use.cookies") )
        {
            $params = session_get_cookie_params(); // this pulls info from php.ini
            setcookie(session_name(),'',time()-86400,$params["path"],$params["domain"],$params["secure"],$params["httponly"]);
        }

        // destroy what's left, and then reset our member var(s)

        $_SESSION = array();
        session_destroy();
        $this->is_session = false;
        $this->is_broken_session = null;
    }

    //
    // Private methods
    //

    ///////////////////////////////////////////////////////////////////////////
    // Simply initialization.
    ///////////////////////////////////////////////////////////////////////////

    private function __construct() {

        $remote_addr = "";
        if ( isset($_SERVER['HTTP_CF_CONNECTING_IP']) ) {
            $remote_addr = $_SERVER['HTTP_CF_CONNECTING_IP'];
        }
        else {
            $remote_addr = $_SERVER['REMOTE_ADDR'];
        }

        $this->is_session = null;
        $this->is_broken_session = null;

        $this->session_id_match = md5($remote_addr . $_SERVER['HTTP_USER_AGENT']);
		
		// if we don't have our `session_root_key` field, from our bootstrap settings,
        // then there's nothing to do here.
        
        $root_key = Bootstrap::get_setting("session_root_key");
        if ( $root_key ) {
        	$this->session_root_key = $root_key;
        }
        else {
        	throw new Exception("`session_root_key` not retrieved from `Bootstrap`");
        }
    }

    private function __clone() {}    
}