<?php

//---------------------------------------------------------------------------------------
// Class: View
// Description: `View` class for the VIEW section. Just draw all of the errors
//---------------------------------------------------------------------------------------

class View {

	//
	// Private Members
	//

	// typically, the view makes requests of the the model and the controller.
	
	// note: consider not having the View talk to the model at all, just the
	// controller. see here: http://book.cakephp.org/2.0/en/cakephp-overview/understanding-model-view-controller.html
	// where the model and controller go back and forth, then the controller and the view go back and forth.

	private $model = null;
	private $controller = null;

	// the parent `ViewModel` class that actually represents the page's HTML
	private $html_page = null;

	//
	// Public Methods
	//

	// copy over what we need

	public function __construct($model,$controller) {
		$this->model = $model;
		$this->controller = $controller;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	// Build up the HTML page ViewModel used by this section.
	/////////////////////////////////////////////////////////////////////////////////////////

	public function build() {

		// shouldn't be calling this twice.

		if ( !$this->html_page ) {

			// head of the page: title, includes, inline javascript body.

			$head = new HeadModel("Sysop_Head.tpl");
			$head->assign("title","Studybash");
			$head->assign_inline_script("js/inline.js");
			$head->assign_scripts( array( Bootstrap::get_setting("js_root_full")."sysop/activity/js/app.js" ) );
			$head->assign_styles( array( Bootstrap::get_setting("js_root_full")."sysop/activity/css/sysop.css" ) );

			// header/footer of content. no assignments here.
			
			$header = new ViewModel("Sysop_Activity_Header.tpl");
			$footer = new ViewModel("Sysop_Activity_Footer.tpl");

			// main content of the page. for this, we require all of the errors from the db.
			// that's the only assignment here, a collection of lines of errors.
			
			$activity_html = "";
			$req = $this->model->get_activity($this->controller->get_filter($_GET));

			if ( $req->success ) {

				// reference for PHP regex:
				// http://www.php.net/manual/en/pcre.pattern.php
				// http://www.php.net/manual/en/regexp.reference.escape.php
				// http://www.php.net/manual/en/regexp.reference.meta.php
				
				foreach ( $req->rows as $activity ) {
					
					$av = new ViewModel("Sysop_Activity_Activity.tpl");					
					$av->assign("activity",$activity);
					$activity_html .= ( $av->render(false)."\n" );
				}
			}

			$content = new ViewModel("Sysop_Activity_Content.tpl");		
			$content->assign("activity",$activity_html);
			$content->assign("num",($req->rows ? count($req->rows) : 0));

			// create the parent HTML of the page now, using our main ViewModel instance.

			$this->html_page = new ViewModel("Sysop_Main.tpl");
			$this->html_page->assign("head",$head->render(false));
			$this->html_page->assign("header",$header->render(false));
			$this->html_page->assign("content",$content->render(false));
			$this->html_page->assign("footer",$footer->render(false));
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////
	// Actually build the HTML for the page, through creating a number of chld `ViewModel`
	// instances and then rendering them in our parent, which is then rendered here to
	// the page.
	/////////////////////////////////////////////////////////////////////////////////////

	public function render() {
		$this->build();
		$this->html_page->render();
	}
}