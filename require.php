<?php
	ini_set('error_log', $_SERVER['DOCUMENT_ROOT'] . '/error_log.txt');	
	define( "SECURE_MODE", "" );
	define( "BOOTSTRAP_PATH", "/home/www/plasticthoughts.ca/studybash" );
	function get_bootstrap_path() {	
		return defined("BOOTSTRAP_PATH") ? BOOTSTRAP_PATH : $_SERVER['DOCUMENT_ROOT'];
	}	
?>