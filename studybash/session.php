<?php

//---------------------------------------------------------------------------------------
// File: session.php
// Description: This is a dummy, placeholder file that receives a POST upon logging in.
//				However the data goes nowhere, as we have already been verified through
//				AJAX before this is called.
//
// Note: YES, THIS IS ALL JUST FOR CHROME TO REMEMBER OUR PASSWORD.
//---------------------------------------------------------------------------------------

	require_once( $_SERVER['DOCUMENT_ROOT'] . "/require.php" );
	require_once( get_bootstrap_path() . "/bootstrap.php" );

	if ( !Bootstrap::init("studybash") ) {		
		echo "Bootstrap failure.";
		throw new Exception("Bootstrap failed to init.");
	}

	header("Location: ".Bootstrap::get_setting("js_root_full"));
?>