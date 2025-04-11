<?php

//---------------------------------------------------------------------------------------
// Class: HeadModel
// Description: A simple extension of the ViewModel class, enabling us to have a specific
//				class for templating the <head> section (ending before <body>) of a page.
// Dependencies: ViewModel
//---------------------------------------------------------------------------------------

class HeadModel extends ViewModel {

	//
	// Private Members
	//

	//
	// Public Methods
	//

	///////////////////////////////////////////////////////////////////////////////////
	// We have three special functions here that enable us to quickly add values to
	// our `$data` member, which have a pre-defined format, so templates aren't needed.
	// However, by doing it this way, they can still be used as part of the templating
	// system (i.e., `ViewModel`). We're simply adding external .js and .css refs
	// here, as well as an including a .js file inline for the main <script> section
	// of the page.
	//
	// Note: 	The three fields you should be using, in the template itself, are:
	//			$data->scripts, $data->styles, $data->inline_script
	//
	///////////////////////////////////////////////////////////////////////////////////

	public function assign_scripts($script_src_ary) {

		$scripts_str = "";

		if ( gettype($script_src_ary) == "array" ) {

			foreach ( $script_src_ary as $script_src ) {
				$scripts_str .= "\t<script src='".$script_src."'></script>\n";
			}
		}

		$this->assign("scripts",$scripts_str);
	}

	public function assign_styles($link_href_ary) {

		$styles_str = "";

		if ( gettype($link_href_ary) == "array" ) {

			foreach ( $link_href_ary as $link_href ) {
				$styles_str .= "\t<link href='".$link_href."' rel='stylesheet'>\n";
			}
		}

		$this->assign("styles",$styles_str);
	}

	public function assign_inline_script($js_filename) {

		$inline_script = "";

		if ( is_readable($js_filename) ) {
			ob_start();
			include($js_filename);
			$inline_script = ob_get_clean();
		}

		$this->assign("inline_script",$inline_script);
	}
}