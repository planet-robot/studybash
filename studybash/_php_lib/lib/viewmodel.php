<?php

//---------------------------------------------------------------------------------------
// Class: ViewModel
// Description: Very basic PHP view template system.
// Dependencies: Bootstrap
//---------------------------------------------------------------------------------------

class ViewModel {

	//
	// Protected Members
	//

	protected $data = NULL; // this is the data that's used by .tpl.php file
	protected $tpl_filename = NULL; // the .tpl.php file that we're using


	//
	// Public Methods
	//

	///////////////////////////////////////////////////////////////////////////////////
	// We construct on a given template filename. We will ensure that the file exists
	// and, if so, we init all our members.
	//
	// Example:
	//
	//			$tpl_filename = "Login_Main.tpl"
	//			$tpl_filename becomes: /myrootdir/tpl/php/login/main.tpl.php
	//
	///////////////////////////////////////////////////////////////////////////////////

	public function __construct($tpl_filename) {

		$root_dir = Bootstrap::get_setting("php_root");

		if ( $root_dir !== NULL ) {

			$root_dir = $_SERVER['DOCUMENT_ROOT'] . $root_dir;
			$tpl_filename = $root_dir . "tpl/php/" . strtolower(str_replace('_','/',$tpl_filename)) . ".php";

			if ( is_readable($tpl_filename) ) {

				$this->tpl_filename = $tpl_filename;
				$this->data = new stdClass();
			}

			else {
				throw new Exception("$tpl_filename does not exist");
			}
		}
	}

	///////////////////////////////////////////////////////////////////////////////////
	// Add a property to our data class, which will be available to the PHP view template file
	// when it's finally loaded.
	///////////////////////////////////////////////////////////////////////////////////

	public function assign($property,$value) {

		if ( $this->data === NULL ) {
			throw new Exception("`data` not set");
		}

		$this->data->{$property} = $value;
		return true;
	}

	///////////////////////////////////////////////////////////////////////////////////
	// Render the .tpl.php file, using our `$data` member for its store. If you are
	// combining multiple ViewModels, then you'll want to set `$DOM` to false, so it's
	// simply returned as a string which can be included in another ViewModel's data.
	//
	// Example:
	// 				$page = new ViewModel('main.tpl');
	//				$header = new ViewModel('header.tpl');
	//				$footer = new ViewModel('footer.tpl');
	//
	//				$page->assign('header',$header->render(false));
	//				$page->assign('footer',$footer->render(false));
	//				$page->render();
	//
	///////////////////////////////////////////////////////////////////////////////////

	public function render($DOM = true) {

		if ( !$this->tpl_filename ) {
			throw new Exception("`tpl_filename` is not set");
		}

		if ( !$DOM ) {
			ob_start();
		}

		$data = $this->data; // tpl looks for vals in `$data`
		include($this->tpl_filename);

		return ( !$DOM ? ob_get_clean() : true );
	}
}