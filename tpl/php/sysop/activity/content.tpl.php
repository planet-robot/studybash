<div class='panel panel-default'>

	<div class='panel-heading'>
		<span>Count:</span> <?php echo $data->num;?>
	</div>
	
	<div class='panel-body'>		
		<button type='button' class='btn btn-danger delete'>Delete</button>
		<div class='btn-group'>
			<button type='button' class='btn btn-default filter-verylow'>Very Low</button>
			<button type='button' class='btn btn-default filter-low'>Low</button>
			<button type='button' class='btn btn-default filter-medium'>Medium</button>
			<button type='button' class='btn btn-default filter-high'>High</button>
			<button type='button' class='btn btn-default filter-veryhigh'>Very High</button>
			<button type='button' class='btn btn-success filter-all'>All</button>
		</div>
	</div>

</div>

<?php echo $data->activity;?>