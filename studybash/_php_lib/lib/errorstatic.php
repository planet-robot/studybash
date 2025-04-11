<?php

//---------------------------------------------------------------------------------------
// Static Class: ErrorStatic (Error is now a reserved word)
// Description:	Utility singleton for exception and error-related functionality.
//				Our callback functions are instantiated for errors/warnings,
//				uncaught exceptions, and shutdown.
//
//				If an error/warning is triggered, that can't be captured through return
//				values, then we capture it in our callback and throw an exception
//				that the calling code should deal with.
//
//				If an uncaught exception is encountered, we will simply log the issue
//				before the script is shutdown (nothing we can do about that).
//
//				If an error is found upon shutdown, again, we simply log the issue
//				before everything shutsdown.
//
//				If a user-defined error has occurred, we log the issue, in the
//				understanding that the caller will deal with killing the script.
//
// Dependencies: None
//
//	Notes: For `add_to_db()` to work (optional), it expects:
//			(1) You to call `ErrorStatic::set_table_name()`... THEN...
//			(2) The table has fields: user_id, agent, message, trace (required)
//			(3) The user_id is available in $_SESSION['user']->full_name and $_SESSION['user']->id (optional)
//			(4) The institution_id is available in $_SESSION['user']->institution_id (optional)
//---------------------------------------------------------------------------------------

//FIXME:
// - so if a fatal error is created in run-time (e.g., trying to access a private/protected
// member in an exception), then the `check_for_fatal_error()` method is reached with that
// fatal error still waiting there (as is expected). however, that information is then
// output as text into the final page, so the user receives it, and i can't seem to
// fix that. of course, if you set display_errors to 0, then it just creates a 500 internal
// server error and shoots that information back to the user.

class ErrorStatic {

	//
	// Private Member Data
	//

	private static $_ready = false;
	private static $_last_error = null; // from error_get_last()
	private static $_table_name = null; // to save in db
	private static $_max_records = 500;

	//
	// Public Interface
	//

	//////////////////////////////////////////////////////////////////////////////////
	// Register all of the callbacks for error/warning, exception, shutdown processing.
	// We also give the user the option to set whether or not we're operating in
	// "release_mode" or not.
	//
	// Source: http://us.php.net/manual/en/function.set-error-handler.php#112291
	//////////////////////////////////////////////////////////////////////////////////

	public static function register() {

		if ( !self::$_ready ) {

			// setup the basic error handling routine.

			$success = @set_error_handler(array("ErrorStatic","error_handler")); // returns NULL if just replacing default
			if ( !$success ) {
				$err = error_get_last();
				if ( $err ) {
					self::set_last_error($err);
					self::error_handler($err['type'],$err['message'],$err['file'],$err['line'],$err['context']);
				}
			}

			// now that we've registered our error handler, it's okay to turn off `display_errors` as
			// we know all of them will be re-directed to our handler. now we setup shutdown and then
			// exceptions.

			error_reporting(E_ALL);
			
			// fixme: still not quite clear what this does. perhaps it just suppresses text from
			// being displayed? cause it doesn't suppress the error_handler function being called
			// when, for example, the `register_shutdown_function()` call below fails (if sending
			// a non-existent method name). so it IS NOT the same as putting @ in front of every
			// function call.
			//
			// reference: http://www.php.net/manual/en/errorfunc.configuration.php#ini.display-errors
			//ini_set("display_errors",0);

			// if either of these fail, a warning will be generated that will reach our
			// error_handler callback.

			register_shutdown_function(array("ErrorStatic","check_for_fatal_error"));		
			set_exception_handler(array("ErrorStatic","exception_handler"));
		}

		return self::$_ready;
	}

	///////////////////////////////////////////////////////////////////////////
	// Simple `set` function. This identifies which db table to update when an
	// error occurs (optional).
	///////////////////////////////////////////////////////////////////////////

	public static function set_table_name($table_name) {
		self::$_table_name = $table_name;
	}
	
	///////////////////////////////////////////////////////////////////////////
	// Simple `set` function. This limits the number of records that can be
	// added, to prevent outside abuse. (optional).
	///////////////////////////////////////////////////////////////////////////
	
	public static function set_max_records($max_records) {
		self::$_max_records = (int)$max_records;
	}
	
	/////////////////////////////////////////////////////////////////////////////////////
	// Simple `set` function. A call to error_get_last() has been executed, and a value
	// has been retrieved. Accordingly, if it is called again, and the same error is
	// returned, we can know that it's already been dealt with.
	//
	//	@ary - An array, returned from error_get_last()
	/////////////////////////////////////////////////////////////////////////////////////

	public static function set_last_error($ary) {
		self::$_last_error = $ary;
	}

	/////////////////////////////////////////////////////////////////////////////////////
	// The user has generated an exception or error, which will be documented. Any further
	// action is the responsibility of the caller.
	/////////////////////////////////////////////////////////////////////////////////////

	public static function from_user($e) {

		if ( $e instanceof Exception ) {
			self::document($e->getMessage(),$e->getCode(),$e->getFile(),$e->getLine(),$e->getTraceAsString());
		}
		else {
			self::document( __METHOD__ . "(): Unknown param received: ".print_r($e,true),"Unknown","Unknown","Unknown",print_r(debug_backtrace(),true));
		}
	}

	//////////////////////////////////////////////////////////////////////////////////
	// Deal with all errors/warnings sent by PHP. This is responsible for calling
	// `die()` if appropriate, which we don't do if we consider the issue a 'warning'.
	//
	// `errno` values: http://php.net/manual/en/errorfunc.constants.php
	//////////////////////////////////////////////////////////////////////////////////	

	public static function error_handler($errno,$errstr,$errfile,$errline,$errcontext = array()) {

		if ( error_reporting() === 0 ) { return false; } // the error that triggered us was prepended by '@'
		
		// at this stage, we treat warnings as if they were errors. so this value is ignored.
		// an alternative would be to simply document the warnings and NOT generate an
		// exception.
		$warning = ( ( $errno === 2 ) || ( $errno === 8 ) );

		// all we do here is throw the exception, telling the caller that there was
		// a problem. everything else is their responsibility.
		throw new Exception( $errstr, $errno );
	}

	//////////////////////////////////////////////////////////////////////////////////
	// Deal with UNCAUGHT exceptions. Execution stops after this is called, there's no
	// way of preventing that.
	//////////////////////////////////////////////////////////////////////////////////	

	public static function exception_handler($e) {
		self::document("(uncaught exception) ".$e->getMessage(),$e->getCode(),$e->getFile(),$e->getLine(),$e->getTraceAsString());
	}

	//////////////////////////////////////////////////////////////////////////////////
	// Fatal errors do not get sent to `error_handler`, they simply shut down the
	// page. so this must be registered as a shutdown function, in order for those
	// errors to be processed by `error_handler`.
	//////////////////////////////////////////////////////////////////////////////////	

	public static function check_for_fatal_error() {

		// error_get_last() leaves the error there once you've read it. so if we had
		// to suppress an error and grab it with error_get_last(), when the script
		// ends, that same error will be pulled up here again. so we double check
		// that it's not the same error we pulled out last time.

		$err = error_get_last();		
		if ( ( !empty($err) ) && ( $err != self::$_last_error ) ) {

			// debug_backtrace() wouldn't give us meaningful values from here, as the error
			// was generated elsewhere. also, $err['context'] doesn't exist here, and
			// `get_defined_vars()` would use this context, not that of the original error.
			self::document("(uncaught fatal) ".$err['message'],$err['type'],$err['file'],$err['line'],"`check_for_fatal_error()`",null);
		}		
	}

	///////////////////////////////////////////////////////////////////////////
	// Add the information from an error into a db. We require the table
	// name to be set in static member data, and for the db module to be
	// available.
	//
	//	@e -	Can either be an Exception instance, an array with "message" and 
	//			"trace" keys, or an object with "message" and "trace" properties
	//
	//	Notes: Expects two things:
	//		(1) The table has columns: user_id, institution_id, agent, message, trace (req)
	//		(2) The user_id is available in $SESSION['user']->full_name and $_SESSION['user']->id (optional)
	//		(3) The institution_id is available in $_SESSION['user']->institution_id (optional)
	///////////////////////////////////////////////////////////////////////////

	public static function add_to_db( $e ) {

		$create_error = false;
		$message = null;
		$trace = null;

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
		$query = "SELECT count(*) AS num_errors FROM ".self::$_table_name.";";
		
		try {			
			$result = Db::get_instance()->prepared_query($query,array());
			if ( $result->num_rows !== 1 ) {
				throw new Exception("`num_rows` was: ".$result->num_rows);
			}
			if ( $result->rows[0]->num_errors > self::$_max_records ) {
				throw new Exception("`max_records` reached");
			}
		}
		catch ( Exception $e ) {
			error_log( __METHOD__ . "(): INSERT failed on query: " . $query . " error*: " . $e->getMessage() );
			return;
		}

		if ( $e instanceof Exception ) {
	
			$message = $e->getMessage();
			$trace = $e->getFile() . "(" . $e->getLine() . ") " . $e->getTraceAsString();			
			$create_error = true;
		}
		
		else if ( gettype($e) === "array" ) {

			if ( array_key_exists("message",$e) && array_key_exists("trace",$e) ) {
				$message = $e['message'];
				$trace = $e['trace'];
				$create_error = true;
			}
		}

		else if ( gettype($e) === "object" ) {

			if ( property_exists($e,"message") && property_exists($e,"trace") ) {
				$message = $e->message;
				$trace = $e->trace;
				$create_error = true;
			}
		}

		if ( $create_error ) {
		
			// better to get SOME of the info (when too long) than nothing due
			// to an exception from MySQL.
			$message = Leftovers::get_instance()->crop_string($message,2048);
			$trace = Leftovers::get_instance()->crop_string($trace,4096);
		
			$user_id = null;
			$institution_id = null;
			
			// look for the user ID and institution ID. note that $_SESSION
			// does not appear to be accessible if there was a critical error in
			// PHP.
			
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
			
			// look for the agent string

			$agent = "Unknown";
			if ( array_key_exists("HTTP_USER_AGENT",$_SERVER) ) {
				$agent = $_SERVER['HTTP_USER_AGENT'];
			}

			// insert, with a prepared statement

			$query = "INSERT INTO " . self::$_table_name . " (user_id, institution_id, agent, message, trace) VALUES (?, ?, ?, ?, ?);";

			$affected_rows = null;
			try {
				$result = Db::get_instance()->prepared_query($query,array($user_id,$institution_id,$agent,$message,$trace));
				$affected_rows = $result->affected_rows;
				if ( $affected_rows !== 1 ) {
					throw new Exception("`affected_rows` was (".$affected_rows.")");
				}
			}
			catch ( Exception $e ) {			
				error_log( __METHOD__ . "(): INSERT failed with error: " . $e->getMessage() . "; on query: " . $query );
				return;
			}
		}
		
		else {
			error_log( __METHOD__ . "(): Did not know how to process param: " . print_r($e,true) );
			return;
		}
	}

	//
	// Private Methods
	//

	/////////////////////////////////////////////////////////////////////////////////////
	// Time to document the issue. We will record it in the error_log and attempt to add
	// it to the db.
	/////////////////////////////////////////////////////////////////////////////////////

	private static function document( $msg, $type, $file, $line, $trace, $context = null ) {

		self::add_to_db(array("message" => $msg, "trace" => $trace)); // no harm, no foul if we can't do it

		$msg = $file . " line #" . $line . ": " . $msg . " \n==> Trace: \n" . $trace;
		error_log($msg);
	}
}