<div class='panel panel-danger error' id='error-<?php echo $data->error->id;?>'>
	
	<div class='panel-heading error-message'>
		<?php echo htmlspecialchars($data->error->message);?>
	</div>

	<div class='panel-body error-trace'>
		<?php echo $data->trace;?>
	</div>
	
	<div class='panel-footer error-misc'>
		<p class='time'><?php echo $data->error->created_on;?></p>
		<p class='agent'><?php echo htmlspecialchars($data->error->agent);?></p>
		<p class='user'><span>User:</span><?php echo $data->error->user_id;?></p>
        <p class='institution'><span>Institution:</span><?php echo $data->error->institution_id;?></p>                
	</div>

</div>