<?php

//---------------------------------------------------------------------------------------
// Class: UploadFile
// Description: Manages the uploading of a single file.
// Dependencies: None
//
//  Notes:  Exceptions are thrown here, but caught internally. If you want to act on them
//          you'll have to call UploadFile->get_error(), which returns the Exception 
//          instance.
//---------------------------------------------------------------------------------------

class UploadFile {

    //
    // Private Members
    //

    private $max_size = 65536; // bytes
    private $allowed_types = array( "text/plain" );

    private $destination = null;
    private $file_info = null;
    private $file_contents = null;
    private $moved_filename = null;

    private $exception = null;

    //
    // Pubic Interface
    //

    ///////////////////////////////////////////////////////////////////////////////
    // Initialize the class by pulling in all of the session data needed.
    ///////////////////////////////////////////////////////////////////////////////

    public function __construct( $path_to_move_to = null, $new_filename = null ) {

        try {

            // if we do not have a path_to_move_to, then we will only be returning the uploaded
            // file's contents as a string. otherwise, make sure we can move
            // the uploaded file to it.

            if ( ( $path_to_move_to ) && ( !is_dir($path_to_move_to) || !is_writable($path_to_move_to) ) ) {
                throw new Exception("Destination path was not a writable directory");
            }

            $this->destination = $path_to_move_to;
            if ( $this->destination && !$new_filename ) {
                throw new Exception("Destionation path provided without a new filename");
            }

            // we are expecting to deal with a single file uploaded here. if the $_FILES
            // array has a value, we'll pull it out, ensure it only contains one file
            // and then validate that file's info.

            $key = array_keys($_FILES);
            if ( count($key) === 1 ) {
                $key = $key[0];
            }

            else {
                $key = null;
            }

            if ( $key ) {

                $this->file_info = $_FILES[$key];
                $this->file_info['new_filename'] = $new_filename; // keep for temporary storage

                // can't deal with multiple!

                if ( gettype($this->file_info['name']) !== "string" ) {
                    $this->file_info = null;
                }

                else {
                    $this->validate_file_info();
                }
            }
        }

        catch ( Exception $e ) {
            $this->exception = $e;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Check if we have an error; or return the error that we do have.
    ///////////////////////////////////////////////////////////////////////////////

    public function has_error() {
        return ( $this->exception !== null );
    }

    public function get_error() {
        return $this->exception;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Check that we have a file ready to process
    ///////////////////////////////////////////////////////////////////////////////

    public function has_file() {
        return ( $this->file_info !== null );
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Process the file. This will either consist of reading the file as it is and
    // placing its contents into our member data, or moving it to a new location and
    // recording it's new filename in our member data.
    ///////////////////////////////////////////////////////////////////////////////

    public function process_file() {

        try {

            if ( !$this->has_file() ) {
                throw new Exception("No file_info to process!");
            }

            // if we don't have a destination, that means we are just supposed to
            // read in the file's contents and return it as an array of strings
            
            if ( !$this->destination ) {

                if ( !is_readable($this->file_info['tmp_name']) ) {
                    throw new Exception("Failed is_readable (fileinfo: ".print_r($this->file_info,true).")");
                }

                $this->file_contents = file($this->file_info['tmp_name']);

                if ( $this->file_contents === FALSE ) {
                    throw new Exception("Failed on file() (fileinfo: ".print_r($this->file_info,true).")");
                }
            }

            // okay, we're moving the file to a new location.

            else {

                if ( !move_uploaded_file( $this->file_info['tmp_name'], $this->destination . $this->file_info['new_filename'] ) ) {
                    throw new Exception("Failed to move file (".$this->file_info['tmp_name'].") to new location (".$this->destination.$this->file_info['new_filename'].")");
                }

                else {
                    $this->moved_filename = $this->destination . $this->file_info['new_filename'];
                }
            }
        }

        catch ( Exception $e ) {
            $this->exception = $e;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Return the contents of the file, as an array of strings.
    ///////////////////////////////////////////////////////////////////////////////

    public function get_file_contents() {
        return $this->file_contents;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Return our new filename, assuming the uploaded file was moved.
    ///////////////////////////////////////////////////////////////////////////////

    public function get_moved_filename() {
        return $this->moved_filename;
    }

    //
    // Private Methods
    //

    ///////////////////////////////////////////////////////////////////////////////
    // Inspect the file_info member to see if the file we have is valid.
    ///////////////////////////////////////////////////////////////////////////////

    private function validate_file_info() {

        $upload_errors = array(
            0 => "success",
            1 => "size > php.ini__upload_max_filesize",
            2 => "size > MAX_FILE_SIZE",
            3 => "file only partially uploaded",
            4 => "no file specified",
            6 => "no temporary folder",
            7 => "cannot write file to disk",
            8 => "upload stopped by unspecified PHP extension"
        );

        try {

            if ( !$this->file_info ) {
                throw new Exception("No file_info to validate");
            }

            if ( $this->file_info['error']) {
                throw new Exception("Error (".$upload_errors[$file_info['error']].") fileinfo object: (".print_r($file_info,true).")");
            }

            if ( !in_array($this->file_info['type'],$this->allowed_types) ) {
                throw new Exception("Incorrect file type. Fileinfo: (".print_r($file_info,true).")");
            }

            if ( $this->file_info['size'] > $this->max_size ) {
                throw new Exception("Size was over the limit. Fileinfo: (".print_r($file_info,true));
            }

            if ( !is_uploaded_file($this->file_info['tmp_name']) ) {
                throw new Exception("Danger: File was not uploaded via HTTP POST - possible file upload attack. Fileinfo: ".print_r($file_info,true));
            }

            return ( $this->file_info !== null );
        }

        catch ( Exception $e ) {
            $this->file_info = null;
            $this->exception = $e;
        }
    }
}
?>