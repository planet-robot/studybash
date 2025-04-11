<?php

//---------------------------------------------------------------------------------------
// Class: Cfg
// Description: Utility class for loading configuration files.
// Dependencies: None
//---------------------------------------------------------------------------------------

require_once( $_SERVER['DOCUMENT_ROOT'] . "/require.php" );
class Cfg {

	//
	// Private Member Data
	//
    
    private $settings_dict;
    private $ready;

    //
    // Public methods
    //

    ///////////////////////////////////////////////////////////////////////////
	// $filename should not include a path. the path(s) that are searched will
    // have been specified ahead of time. in the file, we expect to find one
    // setting per line, like so:
    //
    //  setting_name,setting_value
    //
    // Empty lines and lines with '//'-style comments are ignored.
	///////////////////////////////////////////////////////////////////////////

    function __construct( $filename ) {

        $this->ready = false;

        $cfg_path = get_bootstrap_path() . "/_php_lib/cfg/";
        $file_path = $cfg_path . strtolower($filename) . ".cfg";

    	// our dictionary of settings.

    	$this->settings_dict = null;

        if ( !file_exists($file_path) ) {
        	throw new Exception( ".cfg file: " . $file_path . " not found");
        }

        else {

        	// read in all the lines of the file into a temp array

        	$lines = file($file_path);

        	if ( !$lines ) {
        		throw new Exception( ".cfg file: " . $file_path . " could not be read from");
        	}

        	for ( $x = 0; $x < count($lines); $x++ ) {

                // ignore comments and blank lines

                $trim_line = trim($lines[$x]);
                if ( ( !strlen($trim_line) ) || ( ( strlen($trim_line) >= 2 ) && ( substr($trim_line,0,2) === "//" ) ) ) {
                    continue;
                }

        		// split on a comma
        		$line_tokens = explode(",", $lines[$x]);
        		if ( count($line_tokens) !== 2 ) {        			
                    error_log("`Cfg::__construct(): .cfg file (" . $file_path . ") line #".($x+1)." could not be parsed (".print_r($lines[$x],true).")", 0);
                    continue;            
        		}
				
				$line_tokens[0] = trim($line_tokens[0]);
				$line_tokens[1] = trim($line_tokens[1]);

        		// add the setting
        		$this->settings_dict[$line_tokens[0]] = $line_tokens[1];
        	}

            $this->ready = true;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////
	// Get a setting. Returns the value, or NULL if does not exist (since that's not
    // possible to retrieve from a file).
	///////////////////////////////////////////////////////////////////////////////////
	
	public function get_setting( $setting_key ) {

        if ( ( !$this->ready ) || ( !isset($this->settings_dict[$setting_key]) ) ) {            
            throw new Exception("Key : " . $setting_key." not found");
    	}

    	return $this->settings_dict[$setting_key];
	}

    ///////////////////////////////////////////////////////////////////////////////////
    // Find out whether or not a given setting exists.
    ///////////////////////////////////////////////////////////////////////////////////
    
    public function has_setting( $setting_key ) {

        if ( ( !$this->ready ) || ( !isset($this->settings_dict[$setting_key]) ) ) {            
            return false;
        }

        return true;
    }
}