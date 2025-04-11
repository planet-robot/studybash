<?php

//---------------------------------------------------------------------------------------
// Static Class: Bootstrap.
// Description: Main index point for a site. This should be the only include file that
// 				a site needs, everything else can be done through the provided __autoload.
// Dependencies: Error, Cfg
//---------------------------------------------------------------------------------------

require_once( $_SERVER['DOCUMENT_ROOT'] . "/require.php" );
class Bootstrap {

	// change these settings for your project.

	//fixme: do we need this?
	public static $_release_mode = false;

	// internal settings, do not modify these.

	private static $_settings = NULL;
	private static $_ready = false;

	//
	// Public Interface
	//

	/////////////////////////////////////////////////////////////////////////////////////////
	// This initializes the bootstrap, by loading the settings for the project. This must be
	// called before *any* classes can be autoloaded.
	//
	//	@return - bool - success/failure
	/////////////////////////////////////////////////////////////////////////////////////////

	public static function init($settings_file) {

		// try to setup our __autoload. if that is successful, try to setup the Error
		// class and an instance of the Cfg class (loading them both through __autoload).

		$exception = null; // in case one is generated during init

		self::$_ready = spl_autoload_register(array("Bootstrap","class_loader"));
		try {
			if ( self::$_ready ) {
				ErrorStatic::register(self::$_release_mode);
				if ( $settings_file ) {
					self::$_settings = new Cfg($settings_file);
				}
			}
		}
		catch ( Exception $e ) {
			$exception = $e;
			self::$_settings = null;
			self::$_ready = false;
		}

		// if anything has gone wrong, unregister our __autoload and, if possible,
		// tell the Error class our troubles. otherwise, just generate exception.

		if ( !self::$_ready ) {

			spl_autoload_unregister(array("Bootstrap","class_loader"));

			if ( class_exists("ErrorStatic") && method_exists("ErrorStatic","from_user") ) {
				if ( $exception ) {
					ErrorStatic::from_user($exception);
				}
				else {
					ErrorStatic::from_user(new Exception("Failed to init `Bootstrap`"));
				}
			}
			else {
				if ( $exception ) {
					error_log(__METHOD__."(): Failure. Exception: ".print_r($e,true));
				}
				else {
					error_log(__METHOD__."(): Failure.");
				}
			}
		}

		return self::$_ready;
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////
	// Shortcut to getting the `php_root` value. Whereas projects must manually pull out
	// `js_root` themselves with `get_setting`, we provide a shortcut for `php_root` because
	// it's a combination of DOCUMENT_ROOT and a setting that will be in the .cfg file for the 
	// project (i.e., "php_root").
	/////////////////////////////////////////////////////////////////////////////////////////	

	public static function get_php_root() {

		if ( !self::$_settings ) {
			return null;
		}
		
		return $_SERVER['DOCUMENT_ROOT'] . self::$_settings->get_setting("php_root");
	}
	
	///////////////////////////////////////////////////////////////////////////
	// Tell us if we are on a secure HTTP connection or not.
	///////////////////////////////////////////////////////////////////////////
	
	public static function is_secure() {
		$is_https = (
    		(!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
    		(!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
    		(!empty($_SERVER['HTTP_CF_VISITOR']) && strpos($_SERVER['HTTP_CF_VISITOR'], 'https') !== false)
		);
		return $is_https;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	// We also contain an instance of the Cfg class here. These accessors relate to it.
	/////////////////////////////////////////////////////////////////////////////////////////	

	public static function get_setting($key) {

		if ( !self::$_settings ) {
			return null;
		}

		return self::$_settings->get_setting($key); // throws Exception on failure.
	}

	public static function has_setting($key) {
		try {
			return (boolean)self::get_setting($key);
		}
		catch ( Exception $e ) {
			return false;
		}
	}

	//
	// Private Methods
	//

	/////////////////////////////////////////////////////////////////////////////////////////
	// Any class that utilizes other classes that are loaded through __autoload should also
	// be loaded this way. If you have a completely independent class (e.g., for a specific
	// page), that does not make use of ANY other classes in the main tree, then feel free
	// to not use this method and just include it directly (e.g., for HTML templates).
	/////////////////////////////////////////////////////////////////////////////////////////

	private static function class_loader($class_name) {

		if ( self::$_ready ) {

			// we will try a couple of different paths, with the path of the calling file as
			// the final one.

			$paths = array(
				get_bootstrap_path() . "/_php_lib/lib/",
				substr($_SERVER['SCRIPT_FILENAME'],0,strrpos($_SERVER['SCRIPT_FILENAME'],"/")+1)
			);

			$found = false;
			foreach ( $paths as $path ) {

				$file_path = $path . strtolower($class_name) . ".php";

				if ( is_readable($file_path) ) {
					require_once($file_path);
					$found = true;
					break;
				}
			}

			// if anything goes wrong, exceptions are thrown. accordingly, if you are unsure
			// about using an undeclared class type, wrap the `x = new Y()` statement in a
			// try/catch block (as we did above, in `Bootstrap::init()`).

			if ( !$found ) {
				throw new Exception($file_path . " not found");
			}
		}

		else {
			throw new Exception("Trying to load ".$class_name." when `_ready` is false");
		}
	}
}