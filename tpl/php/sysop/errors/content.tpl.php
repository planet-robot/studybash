<div class='panel panel-default'>

	<div class='panel-heading'>
		<span>Count:</span> <?php echo $data->num;?>
	</div>
	
	<div class='panel-body'>		
		<a href='<?php echo Bootstrap::get_setting("php_root");?>sysop/errors/?delete=true'><button type='button' class='btn btn-danger'>Delete</button></a>
	</div>

</div>

<?php echo $data->errors;?>