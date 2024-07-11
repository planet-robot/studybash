<!-- <h1>Activity</h1> -->

<!-- Static navbar -->
<div class="navbar navbar-default">
	
	<div class="navbar-header">
		<button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
		</button>
		<a class="navbar-brand" href="<?php echo Bootstrap::get_setting('php_root');?>">Studybash</a>
	</div>

	<div class="navbar-collapse collapse">
		
		<ul class="nav navbar-nav">			
			<li><a href="<?php echo Bootstrap::get_setting('php_root');?>sysop/errors/">Errors</a></li>
			<li class="active"><a href="<?php echo Bootstrap::get_setting('php_root');?>sysop/activity/">Activity</a></li>
			<li><a href="<?php echo Bootstrap::get_setting('php_root');?>sysop/flags/">Flags</a></li>
			<li><a href="<?php echo Bootstrap::get_setting('php_root');?>sysop/report/">Report</a></li>
		</ul>
	
	</div><!--/.nav-collapse -->

</div>