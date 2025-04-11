<?php

//---------------------------------------------------------------------------------------
// Singleton: Email
// Description: Utility singleton for email-related functionality.
// Dependencies: PHPMailer
//---------------------------------------------------------------------------------------

define( "PHPMAILER_PATH", "/_php_lib/external/phpmailer/" ); // this is concatenated onto $_SERVER['DOCUMENT_ROOT']

class Email {

	//
	// Static Member Data
	//

	private static $_instance = null;
	private static $_mail = null;

	//
	// Public Interface
	//

	public static function get_instance() {

		if ( !(self::$_instance instanceof self) ) {
			self::$_instance = new self();
		}

		return self::$_instance;
	}

	//////////////////////////////////////////////////////////////////////////////////
	// Send an email. $options is an object, containing:
	//
	//	->to - array of associative arrays ("email","name")
	//	->from - string
	//	->from_name - string
	//	->subject - string
	//	->body ->string
	//
	//	Return - true - throws exception on failure.
	//////////////////////////////////////////////////////////////////////////////////

	public function send($options) {

		if ( self::$_mail ) {

			if ( !property_exists($options,"to") || !property_exists($options,"from") || !property_exists($options,"from_name") || !property_exists($options,"subject") || !property_exists($options,"body") ) {
				throw new Exception("`options` was missing some fields");
			}

			if ( !is_array($options->to) ) {
				throw new Exception("`options->to` was not an array");
			}

			self::$_mail->ClearAddresses(); // in case this isn't the first email
			for ( $x=0; $x < count($options->to); $x++ ) {
				$addr = $options->to[$x];
				self::$_mail->AddAddress($addr["email"],$addr["name"]);
			}
			self::$_mail->From = $options->from;
			self::$_mail->FromName = $options->from_name;
			self::$_mail->Subject = $options->subject;
			self::$_mail->Body = $options->body;

			if ( self::$_mail->Send() ) {
				return true;
			}
			else {
				throw new Exception(self::$_mail->ErrorInfo);
			}
		}

		else {
			throw new Exception("`self::$_mail` was invalid");
		}
	}

	//
	// Private Methods
	//

    private function __construct() {

    	date_default_timezone_set('America/Los_Angeles'); // PHPMailer uses date() without initializing this
    	include_once($_SERVER['DOCUMENT_ROOT'].PHPMAILER_PATH."class.phpmailer.php");
        self::$_mail = new PHPMailer;

		/*
		//fixme: might want to move some of this stuff into studybash.cfg.
		// i didn't set it up for `testlab` and that seems to have worked... so i dunno.
		// yes, i've moved this.
		$mail->isSMTP();                                      // Set mailer to use SMTP
		$mail->Host = 'smtp1.example.com;smtp2.example.com';  // Specify main and backup server
		$mail->SMTPAuth = true;                               // Enable SMTP authentication
		$mail->Username = 'jswan';                            // SMTP username
		$mail->Password = 'secret';                           // SMTP password
		$mail->SMTPSecure = 'tls';                            // Enable encryption, 'ssl' also accepted
		*/
    }

    private function __clone() {}
}