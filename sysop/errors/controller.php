<?php

//---------------------------------------------------------------------------------------
// Class: Controller
// Description: `Controller` class for the VIEW section.
//---------------------------------------------------------------------------------------

class Controller {

	//
	// Private Members
	//

	// typically the controller only ever asks the Model for anything

	private $model = null;

	//
	// Public Interface
	//
	
	public function __construct($model) {
		$this->model = $model;
	}

	public function act_on_query($query_assoc) {

		if ( array_key_exists("delete",$query_assoc) ) {			
			$this->model->delete_errors();
			header("Location: ".Bootstrap::get_setting("php_root")."sysop/errors/");
		}
	}
}