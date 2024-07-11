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

	public function get_filter($query_assoc) {
		if ( array_key_exists("filter",$query_assoc) ) {			
			return $query_assoc['filter'];
		}
		else {
			return null;
		}
	}

	public function act_on_query($query_assoc) {

		if ( array_key_exists("delete",$query_assoc) ) {			
			$this->model->delete_activity($this->get_filter($query_assoc));
			header("Location: ".Bootstrap::get_setting("php_root")."sysop/activity/");
		}
	}
}