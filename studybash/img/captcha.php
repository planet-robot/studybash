<?php

//---------------------------------------------------------------------------------------
// File: Captcha
// Description: Creates a captcha image, creates a session, sets $_SESSION['captcha'],
//				and returns it as content.
// Dependencies: Bootstrap, Session, DImage, Leftovers, Error
//---------------------------------------------------------------------------------------

require_once( $_SERVER['DOCUMENT_ROOT'] . "/require.php" );	
require_once( get_bootstrap_path() . "/bootstrap.php" );

if ( !Bootstrap::init("studybash") ) {
	die("Bootstrap failure.");
}

try {

	// destroy the existing session (if there is one) and then
	// create a new session. nothing happens if there isn't an
	// existing session already.
	Session::get_instance()->destroy_session();
	Session::get_instance()->create_session();
	
	// setup all the data we'll need
	$captcha = Leftovers::generate_random_string(5,false,true);
	$captcha = strtoupper($captcha);
	$_SESSION['captcha'] = $captcha;
	$width = 200;
	$height = 60;
	
	// create the image
	DImage::set_fonts(array( get_bootstrap_path() . "/_php_lib/fonts/verdanab.ttf"));
	DImage::create(200,60);
	DImage::captcha();
	DImage::staggered_text($captcha);
	DImage::send();

}
catch ( Exception $e ) {
	ErrorStatic::from_user($e);
	die();
}