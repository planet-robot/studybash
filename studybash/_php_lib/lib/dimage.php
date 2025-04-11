<?php

//---------------------------------------------------------------------------------------
// Static Class: DImage
// Description: Utility singleton for creating dynamic images of text, with or without
//				captcha disruption (e.g., lines and dots on the image)
// Dependencies: None
//---------------------------------------------------------------------------------------

class DImage {

	//
	// Static Member Data
	//

	private static $_img = null;
	private static $_fonts = null;
	private static $_width = null;
	private static $_height = null;

	//
	// Public Interface
	//
	
	//////////////////////////////////////////////////////////////////////////////////
	// Set the font(s) used by the singleton. When it comes time to draw the text
	// a random font will be selected.
	//	@fonts - array of paths to .ttf files.
	//////////////////////////////////////////////////////////////////////////////////
	
	public static function set_fonts($fonts) {
		
		for ( $x=0; $x < count($fonts); $x++ ) {
			if ( !file_exists($fonts[$x]) ) {
				throw new Exception(__METHOD__ . "(): Font (".$fonts[$x].") was not found on disk" );
			}
		}
		
		self::$_fonts = $fonts;
	}

	//////////////////////////////////////////////////////////////////////////////////
	// Create a dynamic image, empty of any content.
	//	@return - an image resource identifier, from `imagecreatetrucolor`
	//////////////////////////////////////////////////////////////////////////////////

	public static function create($width,$height) {		

		/*
			Construct the canvas for the image
		*/

		// source: http://us2.php.net/manual/en/function.imagecreatetruecolor.php
		self::$_img = imagecreatetruecolor($width,$height);
		//$bg = imagecolorallocate(self::$_img, rand(210,255), rand(210,255), rand(210,255));
		$bg = imagecolorallocate(self::$_img, 255,255,255);
		imagefilledrectangle(self::$_img, 0, 0, $width, $height, $bg);

		self::$_width = $width;
		self::$_height = $height;
	}
	
	///////////////////////////////////////////////////////////////////////////
	// Add staggered text to a dynamic image (i.e., for a captcha)
	//	@return - nothing. exception on failure.
	///////////////////////////////////////////////////////////////////////////
	
	public static function staggered_text($text) {
	
		if ( empty(self::$_fonts) ) {
			throw new Exception(__METHOD__ . "(): `fonts` is empty");
		}
		
		self::check_image();

		/*
			Draw each character of the text
		*/

		$size = intval(self::$_height / 3);
		$left_padding = 10;
		$right_padding = 10;
		$spacing_x = intval(((self::$_width-$left_padding-$right_padding) / strlen($text)) - $size); // i.e., max = 60 per char - actual_size = X between them
		$x = $left_padding;

		for ( $c=0; $c < strlen($text); $c++ ) {

			$letter = $text[$c];    
			$rotation = intval(rand(-10,10));
			$y = self::$_height - $size + rand(-intval((self::$_height-$size)/3),intval((self::$_height-$size)/3)); // i.e., centered +/- a fraction of space on top/bottom
			$font = self::$_fonts[array_rand(self::$_fonts)];

			$col = imagecolorallocate(self::$_img,0,0,0);

			imagettftext(self::$_img, $size, $rotation, $x, $y, $col, $font, $letter);

			$x += ($size + $spacing_x);
		}
	}
	
	///////////////////////////////////////////////////////////////////////////
	// Add text to a dynamic image.
	//	@return - nothing. exception on failure.
	///////////////////////////////////////////////////////////////////////////
	
	public static function text($text) {
	
		if ( empty(self::$_fonts) ) {
			throw new Exception(__METHOD__ . "(): `fonts` is empty");
		}
		
		self::check_image();

		/*
			Draw each character of the text
		*/

		$size = self::$_height / 3;
		$left_padding = 10;
		$right_padding = 10;
		$spacing_x = ((self::$_width-$left_padding-$right_padding) / strlen($text)) - $size; // i.e., max = 60 per char - actual_size = X between them
		$x = $left_padding;

		for ( $c=0; $c < strlen($text); $c++ ) {

			$letter = $text[$c];    
			$rotation = rand(-10,10);
			$y = self::$_height - $size;
			$font = self::$_fonts[array_rand(self::$_fonts)];

			$col = imagecolorallocate(self::$_img,0,0,0);

			imagettftext(self::$_img, $size, $rotation, $x, $y, $col, $font, $letter);

			$x += ($size + $spacing_x);
		}
	}
	
	//////////////////////////////////////////////////////////////////////////////////
	// Captcha a dynamic image by adding lines and dots to it.
	//	@return - nothing. exception on failure.
	//////////////////////////////////////////////////////////////////////////////////

	public static function captcha() {
	
		self::check_image();
	
		/*
			Initialize the options for the script.
		*/

		$num_dots = 1600;
		$num_lines = 10;
	
		/*
			Create a bunch of black dots all over the background.
		*/

		for ( $d=0; $d < $num_dots; $d++ ) {
			
			$x = rand(0,self::$_width-1);
			$y = rand(0,self::$_height-1);
			$col = imagecolorallocate(self::$_img, 0,0,0);

			imagesetpixel(self::$_img,$x,$y,$col);
		}

		/*
			Create a bunch of horizontal, grey lines all over the background.
		*/

		for ( $line=0; $line < $num_lines; $line++ ) {
			
			$y1 = rand(0,self::$_height);
			$y2 = rand(0,self::$_height);
			$col = imagecolorallocate(self::$_img, 128,128,128);

			imageline(self::$_img,0,$y1,self::$_width-1,$y2,$col);
		}

		/*
			Create a bunch of vertical, grey lines all over the background.
		*/

		for ( $line=0; $line < $num_lines; $line++ ) {
			
			$x1 = rand(0,self::$_width);
			$x2 = rand(0,self::$_width);
			$col = imagecolorallocate(self::$_img, 128,128,128);

			imageline(self::$_img,$x1,0,$x2,self::$_height-1,$col);
		}
	}
	
	///////////////////////////////////////////////////////////////////////////
	// Send the dynamic image as content.
	///////////////////////////////////////////////////////////////////////////
	
	public static function send() {
	
		self::check_image();
		
		// Image header
		header("Content-type: image/jpeg");
		// Invalidate cache. 
		header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
		header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past

		/*
			Send the image and free the memory.
		*/

		imagejpeg(self::$_img);
		imagedestroy(self::$_img);
		self::$_img = null;
	}
	
	///////////////////////////////////////////////////////////////////////////
	// Ensure that we have a valid image resource identifier
	///////////////////////////////////////////////////////////////////////////
	
	private static function check_image() {
		if ( empty(self::$_img) ) {
			throw new Exception(__METHOD__."(): `img` is empty");
		}
	}
}