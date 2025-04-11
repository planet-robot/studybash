<?php

//---------------------------------------------------------------------------------------
// Singleton: Leftovers
// Description: Collection of useful functions
// Dependencies: None
//---------------------------------------------------------------------------------------

class Leftovers {

	//
	// Static Member Data
	//

	private static $_instance;

	//
	// Private Member Data
	//
    
    //
    // Public interface
    //

    public static function get_instance() {

		if ( !(self::$_instance instanceof self) ) {
			self::$_instance = new self();
		}

		return self::$_instance;
	}
	
	///////////////////////////////////////////////////////////////////////////////////
    // Searches a flat/associative array of objects (or associative arrays) for the
	// FIRST one that matches the passed in function. This is better for PHP than making
	// a function that returns the object directly, as it's a pain to make that return
	// value a reference, so it can be altered.
	//
	//	@return - the key (integer for flat array) of the matched object. null for not found.
	//
	//	EXAMPLE:
	//
	//		$idx = Leftovers::indexOfObj($cards,function($o) use ($row) {
	//			return $o->id === $row->id;
	//		});
	//
    ///////////////////////////////////////////////////////////////////////////////////
    
    public static function indexOfObj($ary,$func) {

        foreach ( $ary as $key => $value ) {
			$castValue = (object)$value;
			if ( $func($castValue) === TRUE ) {
				return $key;
			}
		}
		
		return null;
    }
	
	///////////////////////////////////////////////////////////////////////////////////
    // Goes through a flat/associative array of objects (or associative arrays) and creates
	// a (flat) array of the values from one particular field in those objects.
	//
	//	@return - array of field values.
    ///////////////////////////////////////////////////////////////////////////////////
    
    public static function pluck($ary,$fieldName) {
	
		$pluckedAry = array();

        foreach ( $ary as $obj ) {
			
			$castObj = (object)$obj;			
			if ( property_exists($castObj,$fieldName) ) {
				$pluckedAry[] = $castObj->{$fieldName};
			}
		}
		
		return $pluckedAry;
    }

    ///////////////////////////////////////////////////////////////////////////////////
    // Generates a random string of a given length.
    ///////////////////////////////////////////////////////////////////////////////////
    
    public static function generate_random_string( $length, $include_upper = true, $include_num = true ) {

        if ( $length < 1 ) {
            return "";
        }
    
        $characters = "abcdefghijklmnopqrstuvwxyz" . ( $include_upper ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "" ) . ( $include_num ? "0123456789" : "" );
        $randomString = "";
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, strlen($characters) - 1)];
        }
        
        return $randomString;
    }
	
	///////////////////////////////////////////////////////////////////////////
	// Given a URL, remove all of the params from it. For instance:
	//
	//  site.com/12/?parm1=apple&parm2=orange [becomes] site.com/12/
	//
	///////////////////////////////////////////////////////////////////////////
	
	public static function crop_url_parms($url) {

		if ( is_null($url) ) {
			return $url;
		}
		
		$pos = strpos($url,"?");
		$posE = strpos($url,"=");
		$posA = strpos($url,"&");
		
		if ( ( $pos === FALSE ) || ( ( $posE < $pos ) && ( $posE !== FALSE ) ) ) {
			$pos = $posE;
		}
		if ( ( $pos === FALSE ) || ( ( $posA < $pos ) && ( $posA !== FALSE ) ) ) {
			$pos = $posA;
		}

		if ( $pos !== FALSE ) {
			$url = substr($url,0,$pos);
		}

		return $url;
	}
	
	/////////////////////////////////////////////////////////////////////////////
	// Parse a string and ensure that it follows a particular format for names in
	// general. The rules are:
	//
	//  (1) All lowercase, except:
	//      (a) First letter
	//      (b) First letter encountered after space encountered
	//		(c) After a - char
	//
	//  (2) Only one space in between letters
	//  (3) Trimmed at front + back
	//
	/////////////////////////////////////////////////////////////////////////////

	public static function simple_name_case($str) {

		if ( is_null($str) ) {
			return $str;
		}

		// (1+3)
		$name = trim($str);
		$name = strtolower($name);

		$spaceEncountered = false;
		for ( $x=0; $x < strlen($name); $x++ ) {			
			
			$lastchar = ( $x ? $name[$x-1] : null );
			$c = $name[$x];			

			// 1(a)
			if ( !$x ) {
				$name[$x] = strtoupper($c);
			}

			// 1(b)
			else if ( $spaceEncountered && ( ctype_alpha($c) ) ) {
				$name[$x] = strtoupper($c);
				$spaceEncountered = false;
			}
			
			// 1(c)
			else if ( ( $lastchar && $lastchar === "-" ) && ( ctype_alpha($c) ) ) {
				$name[$x] = strtoupper($c);
			}

			// 2
			if ( $spaceEncountered && ( $c === " " ) ) {
				$name = substr($name,0,$x) . substr($name,$x+1);
				$x--; // move back one, so for loop moves to new char that was shifted down one
			}
			
			else if ( $c === " " ) {
				$spaceEncountered = true;
			}
		}

		return $name;
	}
	
	/////////////////////////////////////////////////////////////////////////////
	// Parse a string and ensure that it follows a particular format for people's
	// names. The rules are:
	//
	//  (1) All lowercase, except:
	//      (a) First letter
	//      (b) First letter after a space
	//      (c) After a ' char
	//      (d) After a - char
	//
	//  (2) Only one space in between letters
	//  (3) Trimmed at front + back
	//
	/////////////////////////////////////////////////////////////////////////////

	public static function name_case($str) {

		if ( is_null($str) ) {
			return $str;
		}

		// (1+3)
		$name = trim($str);
		$name = strtolower($name);

		for ( $x=0; $x < strlen($name); $x++ ) {
			
			$lastchar = ( $x ? $name[$x-1] : null );
			$c = $name[$x];			

			// 1(a)
			if ( !$x ) {
				$name[$x] = strtoupper($c);
			}

			// 1(b)
			else if ( ( $lastchar ) && ( $lastchar === " " ) && ( ctype_alpha($c) ) ) {
				$name[$x] = strtoupper($c);
			}

			// 1(c)
			else if ( ( $lastchar ) && ( $lastchar === "'" ) && ( ctype_alpha($c) ) ) {
				$name[$x] = strtoupper($c);
			}

			// 1(d)
			else if ( ( $lastchar ) && ( $lastchar === "-" ) && ( ctype_alpha($c) ) ) {
				$name[$x] = strtoupper($c);
			}

			// 2
			if ( ( $lastchar ) && ( $lastchar === " " ) && ( $c === " " ) ) {
				$name = substr($name,0,$x) . substr($name,$x+1);
				$x--; // move back one, so for loop moves to new char that was shifted down one
			}
		}

		return $name;
	}

    ///////////////////////////////////////////////////////////////////////////////////
    // Ensures that a given string isn't more than N characters long. If it is, and
    // it requires cropping, we replace the last few characters with an ellipses.
    ///////////////////////////////////////////////////////////////////////////////////
    
    public static function crop_string( $string, $max ) {

        if ( ( gettype($string) != "string" ) || ( (int)$max < 5 ) ) {
            return $string;
        }

        if ( strlen($string) > $max ) {
            $keep = $max-4;
            $string = substr($string,0,$keep);
            $string .= " ...";
        }

        return $string;
    }

    ///////////////////////////////////////////////////////////////////////////////////
    // To save the caller having to check if a given array key exists before checking
    // it's value.
    ///////////////////////////////////////////////////////////////////////////////////

    public static function _safeval($ary,$key) {
        if ( array_key_exists($key,$ary) ) {
            return $ary[$key];
        }
        else {
            return null;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////
    // Some AJAX calls will be sent to the following URL format:
    //
    //      - ajax.php/parm1/parm2/parm3/parm_n
    //
    //  This method extracts the 'parm' values, so in the above example, it would return
    //  an array: ["parm1","parm2","parm3","parm_n"]
    ///////////////////////////////////////////////////////////////////////////////////

    public static function explode_path_info() {
        
        $parms = array_key_exists("PATH_INFO",$_SERVER) ? explode('/',$_SERVER['PATH_INFO']) : array();

        // if we have something, remove the first entry, as it will be an empty string. this
        // is because (from above ex.) $parms would have only "/parm1/parm2/parm3/parm_n" in it.
        if ( count($parms) && !strlen($parms[0]) ) {
            array_splice($parms,0,1);
        }

        return $parms;
    }

    ///////////////////////////////////////////////////////////////////////////////////
    // Backbone does not send data through $_GET and $_POST, as it is using a RESTful API.
    // Accordingly, to get at the data we have to do some extra legwork here.
    //
    //  @return - an associative array of key-value pairs.
    ///////////////////////////////////////////////////////////////////////////////////

    // source for PUT/DELETE/PATCH: http://stackoverflow.com/questions/12162132/index-php-is-not-receiving-the-json-sent-by-the-backbone-post

    public static function get_RESTful_data() {
        return json_decode(file_get_contents("php://input"),true); // associative array made
    }

    //
    // Private Methods
    //

    ///////////////////////////////////////////////////////////////////////////
	// Upon construction, we expect four settings to be present in Bootstrap:
	// db_host, db_name, db_user, db_passwd.
	///////////////////////////////////////////////////////////////////////////

    private function __construct() {}
    private function __clone() {}
}