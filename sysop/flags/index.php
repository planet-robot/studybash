<?php

///////////////////////////////////////////////////////////////////////////////
// Verify that the user is allowed to be here.
//
//	@return - nothing. exception on failure.
///////////////////////////////////////////////////////////////////////////////

function verifySessionAndUserStatus($userStatusAdmin) {

	// we must have a session to do this.
	if ( !Session::get_instance()->continue_session() ) {
		throw new Exception("No Session.");
	}

	// grab the session information of the user
	$userRecord = clone $_SESSION['user'];

	// check that their status is acceptable

	UserStatus::set_table_name("sb_1_users");
	UserStatus::set_user_id($userRecord->id);
	$status = UserStatus::get_instance()->get_status();

	if ( $status !== $userStatusAdmin ) {
		throw new Exception("Non-admin trying to access `sysop` section. rec: ".print_r($userRecord,true));
	}
}

///////////////////////////////////////////////////////////////////////////////
// Grab all of the flagged cards.
///////////////////////////////////////////////////////////////////////////////

function grabCards() {

	$query =	"SELECT ownerUser.full_name AS owned_by, ownerUser.id AS owned_by_id, flaggerUser.full_name AS flagged_by, flaggerUser.id AS flagged_by_id, \n";
	$query .=	"	cards.id AS card_id, COUNT(tags.id) AS num_tags FROM sb_1_flagged_flashcards AS fcards \n";
	$query .=	"INNER JOIN sb_1_flashcards AS cards ON cards.id = fcards.flashcard_id \n";
	$query .=	"INNER JOIN sb_1_sets AS sets ON sets.id = cards.set_id \n";
	$query .=	"INNER JOIN sb_1_enrollment AS ownerEnroll ON ownerEnroll.id = sets.enrollment_id \n";
	$query .=	"INNER JOIN sb_1_users AS ownerUser ON ownerUser.id = ownerEnroll.user_id \n";
	$query .=	"INNER JOIN sb_1_users AS flaggerUser ON flaggerUser.id = fcards.flagged_by_id \n";
	$query .=	"LEFT JOIN sb_1_flashcard_tags AS tags ON tags.flashcard_id = cards.id \n";
	$query .=	"GROUP BY cards.id;";

	$result = Db::get_instance()->prepared_query($query,array());
	return $result->rows;
}

///////////////////////////////////////////////////////////////////////////////
// Grab all of the flagged sets.
///////////////////////////////////////////////////////////////////////////////

function grabSets() {

	$query =	"SELECT ownerUser.full_name AS owned_by, ownerUser.id AS owned_by_id, flaggerUser.full_name AS flagged_by, flaggerUser.id AS flagged_by_id, \n";
	$query .=	"	sets.id AS set_id, COUNT(cards.id) AS num_cards FROM sb_1_flagged_sets AS fsets \n";
	$query .=	"INNER JOIN sb_1_sets AS sets ON sets.id = fsets.set_id \n";
	$query .=	"INNER JOIN sb_1_enrollment AS ownerEnroll ON ownerEnroll.id = sets.enrollment_id \n";
	$query .=	"INNER JOIN sb_1_users AS ownerUser ON ownerUser.id = ownerEnroll.user_id \n";
	$query .=	"INNER JOIN sb_1_users AS flaggerUser ON flaggerUser.id = fsets.flagged_by_id \n";
	$query .=	"LEFT JOIN sb_1_flashcards AS cards ON cards.set_id = sets.id \n";
	$query .=	"GROUP BY sets.id;";

	$result = Db::get_instance()->prepared_query($query,array());
	return $result->rows;
}

///////////////////////////////////////////////////////////////////////////////
// Grab all of the flagged tests.
///////////////////////////////////////////////////////////////////////////////

function grabTests() {

	$query =	"SELECT ownerUser.full_name AS owned_by, ownerUser.id AS owned_by_id, flaggerUser.full_name AS flagged_by, flaggerUser.id AS flagged_by_id, \n";
	$query .=	"	tests.id AS test_id FROM sb_1_flagged_tests AS ftests \n";
	$query .=	"INNER JOIN sb_1_tests AS tests ON tests.id = ftests.test_id \n";
	$query .=	"INNER JOIN sb_1_enrollment AS ownerEnroll ON ownerEnroll.id = tests.enrollment_id \n";
	$query .=	"INNER JOIN sb_1_users AS ownerUser ON ownerUser.id = ownerEnroll.user_id \n";
	$query .=	"INNER JOIN sb_1_users AS flaggerUser ON flaggerUser.id = ftests.flagged_by_id \n";

	$result = Db::get_instance()->prepared_query($query,array());
	return $result->rows;
}

///////////////////////////////////////////////////////////////////////////////
// main()
///////////////////////////////////////////////////////////////////////////////

// initialize our bootstrap with the configuration file for our project.
date_default_timezone_set('America/Los_Angeles');
require_once( $_SERVER['DOCUMENT_ROOT'] . "/require.php" );	
require_once( get_bootstrap_path() . "/bootstrap.php" );
if ( !Bootstrap::init("studybash") ) {
	die("Bootstrap failure.");
}

try {	

	Error::set_table_name("sb_debug_errors");
	DbSettings::set_table_name("sb_settings");

	$userStatusAdmin = (int)DbSettings::get_instance()->get_setting("user_status_admin");
	verifySessionAndUserStatus($userStatusAdmin);

	// grab all of the flags: cards, sets, tests.
	
	$cards = grabCards();
	$sets = grabSets();
	$tests = grabTests();
}

catch ( Exception $e ) {
	Error::from_user($e);
	die("Timeout (high traffic volume)");
}

?>

<!DOCTYPE html>
<html lang="en">

<head>

	<meta charset="utf-8">
	<title>Studybash</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

	<!-- CSS
	================= -->

</head>

<body>

	<div id='wrapper-body'>

		<div id='content' class='container'>

<?php

	echo "<ul>\n";
	echo "<li><a href='" . Bootstrap::get_setting('php_root') . "sysop/errors/'>Errors</a></li>";
	echo "<li><a href='" . Bootstrap::get_setting('php_root') . "sysop/activity/'>Activity</a></li>";
	echo "<li><a href='" . Bootstrap::get_setting('php_root') . "sysop/flags/'>Flags</a></li>";
	echo "<li><a href='" . Bootstrap::get_setting('php_root') . "sysop/report/'>Report</a></li>";
	echo "</ul>\n";

	echo "<h1>Cards:</h1>\n";
	foreach ( $cards as $card ) {
		echo "<p>Owner: <em>" . htmlspecialchars($card->owned_by) . "</em> (" . $card->owned_by_id . "). Flagger: <strong>" . htmlspecialchars($card->flagged_by) . "</strong> (" . $card->flagged_by_id . "). CardID: " . $card->card_id . ". Tags: " . $card->num_tags ."</p>\n";
	}

	echo "<h1>Sets:</h1>\n";
	foreach ( $sets as $set ) {
		echo "<p>Owner: <em>" . htmlspecialchars($set->owned_by) . "</em> (" . $set->owned_by_id . "). Flagger: <strong>" . htmlspecialchars($set->flagged_by) . "</strong> (" . $set->flagged_by_id . "). SetID: " . $set->set_id . ". Cards: " . $set->num_cards . "</p>\n";
	}

	echo "<h1>Tests:</h1>\n";
	foreach ( $tests as $test ) {
		echo "<p>Owner: <em>" . htmlspecialchars($test->owned_by) . "</em> (" . $test->owned_by_id . "). Flagger: <strong>" . htmlspecialchars($test->flagged_by) . "</strong> (" . $test->flagged_by_id . "). TestID: " . $test->test_id . "</p>\n";
	}

?>


		</div> <!-- /content -->

	</div>

	<!-- Templates
	============================= -->	

	<!-- Javascript
	============================= -->

	<!-- dependencies (ordered) -->

	<script src="http://code.jquery.com/jquery-2.1.0.js"></script>
	<script src="http://underscorejs.org/underscore.js"></script>
	<script src="http://backbonejs.org/backbone.js"></script>
	
	<!-- application -->

	<script>
		$(function(){
		});
	</script>

</body>

</html>