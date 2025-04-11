<?php

//---------------------------------------------------------------------------------------
// Singleton: Db
// Description: Utility singleton for all database-related functionality. This includes
//              prepared statements. Made for use with InnoDB tables. 
// Dependencies: Bootstrap
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// Notes:	Remember that for transactions and foreign keys, there are two default settings
//			that you'll want to know about with InnoDB and MySQL.
//
//			Transactions:
//				The "transaction isolation level" dictates how a transaction sees the
//				database. The default for InnoDB ("select @@global.tx_isolation" in command
//				prompt to check) is "REPEATABLE_READ". This means that if a transaction
//				performs a given SELECT twice, it gets the same result each time (even if
//				other transactions have changed or inserted rows in the meantime EVEN IF THEY
//				HAVE BEEN COMMITTED).
//
//				However, don't understand this as it taking a snapshot of the db when 
//				the transaction starts, because it doesn't. It literally means that once a
//				SELECT is *actually performed*, if it's then performed again, it will
//				return the same results. So, if the transaction starts and while you sleep(20)
//				some other connection removes all the rows of the SELECT you are about to do
//				in your transaction, it will show EMPTY after sleep is done. However, if you
//				sleep AFTER the SELECT, then even though the other connection has removed all
//				the rows during the sleep, if you do the SELECT again you will get the same,
//				non-empty result.
//
//				It appears that if you have DELETEd a given row within a transaction, but
//				have not yet submitted it, other connections are blocked from even SELECTing
//				that row until the first transaction is submitted. However there is no blocking
//				done on UPDATE. If transaction 1 calls UPDATE on a row and then sleep(20),
//				another connection can change it while it's sleeping. When transaction 1 submits
//				itself, it sets that row to whatever it had in its UPDATE.
//
//			Foreign Keys: (use example of: parent table=categories; child table=products)
//				Remember that these are simply rules that are applied to existing tables, so
//				you can put them on, take them off, without changing anything in code. The
//				setting that matters here is applied when you create the foreign key 
//				rule/relationship initially. The question is what happens to all the child
//				table rows whose `category_id` was equal to X when the parent table row for
//				that category gets deleted. By default we have ON DELETE RESTRICT (and 
//				ON UPDATE RESTRICT) so if, for instance, you update a parent row to go from
//				`category_id=12` to `category_id=13`, and there are child rows with the old
//				`category_id=12` value, the update will fail.
//
//
// Note2: 	Unique composites are when a combination of values must be unique. For example, you can
// 			have duplicates of field `subject_id` and duplicates of field `code` but each combination
//			of `subject_id` and `code` must be unique.
//			source: http://stackoverflow.com/questions/2219786/best-way-to-avoid-duplicate-entry-into-mysql-database
//---------------------------------------------------------------------------------------

define( "TYPES_IDX", "0" ); // idx into our `$params` for the types string in `prepared_query()`

class Db {

	//
	// Static Member Data
	//

	private static $_instance;

	//
	// Private Member Data
	//
    
    private $host; // server addr
    private $name; // name of db
    private $user;
    private $passwd;

    private $mysqli; // MySQLi object

    //
    // Public interface
    //

    /////////////////////////////////////////////////////////////////////////////////////
    // Based upon the settings found in the Bootstrap, we can check to see if the
    // Db settings are present, meaning that our Db should be able to be loaded. If they
    // aren't there, then obviously the page doesn't expect to be using a Db. Of course,
    // this doesn't tell us if it's going to WORK or not, just whether the page thinks
    // it should be available.
    //
    // If you want to test whether or not the db *is* available, you could do this:
    //
    //  try { Db::get_instance(); } catch ( Exception $e ) { echo "Not available."; }
    //
    /////////////////////////////////////////////////////////////////////////////////////

    public static function should_be_available() {

    	$avail = Bootstrap::has_setting("db_host");
    	$avail = $avail && Bootstrap::has_setting("db_name");
    	$avail = $avail && Bootstrap::has_setting("db_user");
    	$avail = $avail && Bootstrap::has_setting("db_passwd");

    	return $avail;
    }

    public static function get_instance() {

		if ( !(self::$_instance instanceof self) ) {
			self::$_instance = new self();
		}

		return self::$_instance;
	}	

    ///////////////////////////////////////////////////////////////////////////
	// Begin, commit, rollback, and end a transaction in MySQLi
	///////////////////////////////////////////////////////////////////////////
	
	public function begin_transaction() {

		if ( !$this->mysqli ) {
    		return false;
    	}

    	$success = $this->mysqli->autocommit(false);
    	$this->process_error();

    	return $success;
	}

	public function commit() {

		if ( !$this->mysqli ) {
    		return false;
    	}

    	$success = $this->mysqli->commit();
    	$this->process_error();

    	return $success;
	}
	
	public function rollback() {

		if ( !$this->mysqli ) {
    		return false;
    	}

    	$success = $this->mysqli->rollback();
    	$this->process_error();

    	return $success;
	}
	
	public function end_transaction() {

		if ( !$this->mysqli ) {
    		return false;
    	}

    	$success = $this->mysqli->autocommit(true);
    	$this->process_error();

    	return $success;
	}
	
	///////////////////////////////////////////////////////////////////////////
	// Retrieve the last id assigned to an insert. Note: This returns
	// 0 if no previous query or if there wasn't an auto_increment involved
	// in the insert.
	///////////////////////////////////////////////////////////////////////////

	public function get_insert_id() {

		if ( !$this->mysqli ) {
    		return 0;
    	}

		return $this->mysqli->insert_id;
	}

	///////////////////////////////////////////////////////////////////////////
	// Retrieve the number of rows that were affected by the latest 
	// query (e.g., UPDATE, DELETE, INSERT).
	///////////////////////////////////////////////////////////////////////////
	
	public function get_affected_rows() {

		if ( !$this->mysqli ) {
    		return 0;
    	}

		return $this->mysqli->affected_rows;
	}

	///////////////////////////////////////////////////////////////////////////
	// Makes a string safe for insertion into an MySQL table, by escaping
	// all dangerous characters.
    //
    // Note: Not required for `prepared_query()`, if passing through ? parms.
	///////////////////////////////////////////////////////////////////////////

	public function escape( $string ) {

		if ( !$this->mysqli ) {
    		return $string;
    	}

		// prevent MySQL injection attacks: add escape char in front of dangerous chars
        //fixme
        
        /*
        if ( get_magic_quotes_gpc() )
            $string = stripslashes($string);
        */

        return $this->mysqli->real_escape_string($string);
    }

    ///////////////////////////////////////////////////////////////////////////
    // Perform a query on the DB. Return the result, checking first for
    // a failure of the query.
    ///////////////////////////////////////////////////////////////////////////

    public function query( $query, $suppress_exception = false ) {

        if ( !$this->mysqli ) {
            return false;
        }

        $result = $this->mysqli->query($query);

        if ( ( $result === false ) && ( !$suppress_exception ) ) {
            throw new Exception( $this->mysqli->error . " query*: " . print_r($query,true) );
        }

        return $result;
    }

    ///////////////////////////////////////////////////////////////////////////
    // Perform a PREPARED query on the db. This does everything, from start to
    // finish. Right from `mysqli->prepare()` to `stmt->fetch()` and `stmt->close()`.
    //
    //  Params: $query -    the SQL query itself, in PREPARED STATEMENT format
    //          $params -   an array of parameters to send in the query, if
    //                      appropriate.
    //
    //  Return: object  -   With the following fields:
    //                      .rows (array of objects)
    //                      .num_rows (int)
    //                      .affected_rows (int)
    //                      .insert_id (int)
    //
    //                      Or NULL on failure.
    //
    //  Notes: What data is found in the return object will depend on the
    //  operation(s) being performed.
    ///////////////////////////////////////////////////////////////////////////

    // More:    Used reflection API, instead of call_user_func_array. Source: 
    //              http://www.php.net/manual/en/mysqli-stmt.bind-param.php#106402.
    //          Alternative, with call_user_func_array:
    //              http://www.php.net/manual/en/mysqli-stmt.bind-param.php#100879

    public function prepared_query( $query, $params = null, $suppress_exception = false ) {

        if ( !$this->mysqli ) {
            throw new Exception("`mysqli` is invalid");
        }

        if ( gettype($params) !== "array" ) {
            $params = array();
        }

        // send MySQL the PREPARED STATEMENT.

        $stmt = $this->mysqli->prepare($query);

        if ( $stmt === FALSE ) {
            throw new Exception( $this->mysqli->error . " query*: " . print_r($query,true) );
        }

        // we have an array of params, but we have to tell MySQL what type they are. let's go
        // through them all and create a string that says what type each is. that string is
        // inserted at the front of the `params` array.

        if ( count($params) ) {

            $allowed_types = array( "integer" => "i", "double" => "d", "string" => "s", "NULL" => "s" );            
            array_splice($params,TYPES_IDX,0,"");        

            // go through all of our params and build up the "types" info of them all.
            // we also convert any parameters that need it.

            for ( $x=count($params)-1; $x >= 1; $x-- ) {

                $arg = $params[$x];
                $arg_type = gettype($arg);

                $found_type = in_array($arg_type,array_keys($allowed_types));

                if ( $found_type || is_numeric($arg) ) {
                    
                    $params[TYPES_IDX] = ( $found_type ? $allowed_types[$arg_type] : $allowed_types["integer"] ) . $params[TYPES_IDX];
                    $params[$x] = ( $found_type ? $arg : intval($arg) );
                }
                else {
                    array_splice($params,$x,1);
                }
            }

            // have to convert our array of parameters to references
            $params = $this->make_ref_ary($params);

            // we will use reflection here to call our `mysqli_stmt->bind_parm` method. seems similar to
            // call_user_func_array, just more up-to-date.

            // note: if an error occurs in mysqli_stmt::bind_parm, it generates a warning which is
            // caught by our error handler - it doesn't generate an error string in mysqli ($this->has_error()) like
            // all of the other methods do. our error handler will throw an exception to represent
            // the error. it will be caught here like any other exception.
            //
            // history: http://stackoverflow.com/questions/18409051/capturing-warning-message-from-mysqli-bind-params/18409903

            $method = new ReflectionMethod("mysqli_stmt","bind_param");
            $method->invokeArgs($stmt,$params);
        }

        // EXECUTE

        $success = $stmt->execute(); // does not set an error on failure
        if ( !$success ) {
            $this->process_error();
        }

        // BIND_RESULT

        // get the METAdata from the query. this will give us the fields
        // that are returned in each row.

        $meta = $stmt->result_metadata(); // fixme: does this ever return an error, or just false?
        
        if ( ( !$meta ) && ( $this->has_error() ) ) {
            $this->process_error();
        }

        $result = new stdClass();

        // okay, there has not been an error yet. however, we may not have
        // anything in `$meta`. this means that we did not get a result set
        // back from MySQL (e.g., on INSERT).

        if ( !$meta ) {

            // grab the data that's relevant

            $result->affected_rows = $stmt->affected_rows;
            $result->insert_id = $stmt->insert_id; // the *first one* (affected_rows-1 more after)
            
            $result->num_rows = 0; // behave like mysqli->num_rows
            $result->rows = array(); // empty
        }

        else {

            // get the result set
            $stmt->store_result();

            if ( $this->has_error() ) {
                $this->process_error();
            }

            // okay, we will build up an associative array in `$row`, representing
            // a single row of data returned. to do this, we have to go through all
            // of the fields that will be returned and do two things:
            //
            // (1) create an entry for that field in the associative array.
            // (2) create a reference for that entry in a flat array

            $params = array();
            $row = array();

            while ( $field = $meta->fetch_field() ) {
                $params[] = &$row[$field->name];
            }

            // done with the METAdata. now we will bind our results to the
            // `$row` associative array, through the references in `params` (ugh).

            $meta->close();

            try {
                $method = new ReflectionMethod("mysqli_stmt","bind_result");
                $method->invokeArgs($stmt,$params);
            }

            catch ( ReflectionException $r ) {
                throw new Exception( $r->getMessage() );
            }

            // okay, now we'll go through all of the `$row` data we got from from
            // MySQL. for each row, create an object in our `$result->rows` array.

            $result->rows = array();
            $result->num_rows = $stmt->num_rows;
            
            $result->affected_rows = $stmt->num_rows; // behave like mysqli->affected_rows
            $result->insert_id = 0; // behave like mysqli->insert_id

            while ( $stmt->fetch() ) {

                // for anonymous objects (like javascript-kinda). you can use
                // property_exists($obj,"full_name") to see if the field you want
                // exists (rather than array_key_exists($assoc_ary,"full_name")).

                $obj = new stdClass();

                // after each `stmt->fetch()` call, `$row` will have a single
                // row of data in it. go through all of its key/values and
                // create a new object for the row. then we add that our the
                // array of rows we're returning.

                foreach ( $row as $key => $val ) {
                    $obj->{$key} = $val;
                }

                $result->rows[] = $obj;
            }

            // done with the result
            $stmt->free_result();
        }

        // done with the statement.
        $stmt->close();

        return $result;
    }

    //
    // Private Methods
    //

    ///////////////////////////////////////////////////////////////////////////
	// Upon construction, we expect four settings to be present in Bootstrap:
	// db_host, db_name, db_user, db_passwd.
	///////////////////////////////////////////////////////////////////////////

    private function __construct() {

    	$this->mysqli = NULL;

        try {
        	$this->host = Bootstrap::get_setting("db_host");
        	$this->name = Bootstrap::get_setting("db_name");
        	$this->user = Bootstrap::get_setting("db_user");
        	$this->passwd = Bootstrap::get_setting("db_passwd");
        }
        catch ( Exception $e ) {
            throw new Exception("Failed to load necessary `settings` (".$e->getMessage().")");
        }

        $this->create_mysqli();
    }

    private function __clone() {}

    ///////////////////////////////////////////////////////////////////////////
    // Look for an error on the MySQLi connection.
    ///////////////////////////////////////////////////////////////////////////
    
    private function has_error() {

        if ( !$this->mysqli ) {
            return false;
        }

        return (boolean)strlen($this->mysqli->error);
    }

    ///////////////////////////////////////////////////////////////////////////
    // Look for an error on the MySQLi connection. if present, we'll deal with
    // it.
    ///////////////////////////////////////////////////////////////////////////
    
    private function process_error() {

        if ( $this->has_error() ) {
            throw new Exception( $this->mysqli->error );
        }
    }

    ///////////////////////////////////////////////////////////////////////////
	// Creates a new MySQLi connection.
	///////////////////////////////////////////////////////////////////////////
    
    private function create_mysqli() {

        $mysqli = new mysqli($this->host,$this->user,$this->passwd,$this->name);

        if ( $mysqli->connect_errno ) {
            throw new Exception( $mysql->connect_error, $mysqli->connect_errno );
        }

        else {
            $this->mysqli = $mysqli;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // Using `mysqli->stmt->bind_params` requires that the parameters sent are 
    // references, not values. Accordingly, this function takes in an array and
    // returns a new array whose values are references to the original one.
    //
    // Note: Required only for PREPARED STATEMENTS.
    ///////////////////////////////////////////////////////////////////////////
    
    private function make_ref_ary($val_ary) {

        $ref_ary = array();
        
        foreach ( array_keys($val_ary) as $key ) {
            $ref_ary[$key] = &$val_ary[$key];
        }

        return $ref_ary;
    }
}