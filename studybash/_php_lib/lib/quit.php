<?php

//---------------------------------------------------------------------------------------
// Singleton: Quit
// Description: Collection of functions to use for a PHP script exiting/dying.
// Dependencies: None
//---------------------------------------------------------------------------------------

class Quit {

	//
	// Static Member Data
	//

	private static $_instance;

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
    // Exit, successfully, outputting an object encoding into JSON on our
    // way out.
    ///////////////////////////////////////////////////////////////////////////

    public function json_exit($obj) {
        echo json_encode($obj);
        exit();
    }

    ///////////////////////////////////////////////////////////////////////////
    // Die, unsuccessfully, giving an HTTP response code as our error, followed
    // by an error message.
    //
    //  @e - The exception that represents the error experienced, OR
    //       a string to output.
    ///////////////////////////////////////////////////////////////////////////

    public function http_die($e) {        
        
        $this->http_response_code(400); // 400 : Bad Request ==> The request cannot be fulfilled due to bad syntax
        
        if ( is_a($e,"ServerClientException") ) {
            echo $e->getClientMessage();
        }
        else if ( gettype($e) == "string" ) {
            echo $e;
        }
        else {
            ErrorStatic::from_user(new Exception("Received unknown param (".print_r($e,true).")"));
            echo "Timeout (high traffic volume)";
        }
        
        die();
    }

    //
    // Private Methods
    //

    ///////////////////////////////////////////////////////////////////////////
    // Output a header giving an error in HTTP response code.
    ///////////////////////////////////////////////////////////////////////////

    // sources: http://stackoverflow.com/questions/3258634/php-how-to-send-http-response-code/12018482#12018482
    // sources: http://en.wikipedia.org/wiki/List_of_HTTP_status_codes

    public function http_response_code($code) {
        header("X-PHP-Response-Code: ".$code,true,$code);
    }

    ///////////////////////////////////////////////////////////////////////////
	// Upon construction, we expect four settings to be present in Bootstrap:
	// db_host, db_name, db_user, db_passwd.
	///////////////////////////////////////////////////////////////////////////

    private function __construct() {}
    private function __clone() {}
}