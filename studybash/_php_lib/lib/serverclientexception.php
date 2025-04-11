<?php

//---------------------------------------------------------------------------------------
// Class: ServerClientException
// Description: Inheriting from Exception and providing two messages: for server, for client.
// Dependencies: None
//---------------------------------------------------------------------------------------

class ServerClientException extends Exception {

	//
	// Private Member Data
	//

	protected $client_message = null;

	//
	// Public Interface
	//

	public function __construct( $message, $client_message = null, $code = 0, Exception $previous = null ) {
		parent::__construct($message,$code,$previous);
		$this->client_message = $client_message ? $client_message : $message;
	}

	public function getClientMessage() {
		return $this->client_message;
	}
}