<?php

$ret = "HEYOOOOO!";
if ( isset($_POST['message']) ) {
	error_log("Received AJAX notification of a CreateTracedError() call, as expected!");
}
echo json_encode($ret);

die();

?>