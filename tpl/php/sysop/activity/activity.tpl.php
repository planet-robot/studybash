<div class='panel panel-info activity' id='activity-<?php echo $data->activity->id;?>'>
	
	<div class='panel-heading activity-key'>
		<?php echo htmlspecialchars($data->activity->activity_key);?>
	</div>

	<div class='panel-body activity-value'>
		<?php echo htmlspecialchars($data->activity->activity_value);?>
	</div>
	
	<div class='panel-footer activity-misc'>
		<p class='interest'><?php echo $data->activity->interest_level;?></p>
		<p class='time'><?php echo $data->activity->created_on;?></p>		
		<p class='user'><span>User:</span><?php echo $data->activity->user_id;?></p>
        <p class='institution'><span>Institution:</span><?php echo $data->activity->institution_id;?></p>                
	</div>

</div>