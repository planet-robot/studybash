$("button.delete").on("click",function(){	
	if ( window.location.href.indexOf("filter") != -1 ) {
		window.location.href += "&delete=true";
	}
	else {
		window.location.href = "<?php echo Bootstrap::get_setting('php_root');?>sysop/activity/?delete=true";
	}
});

$("button.filter-verylow").on("click",function(){
	window.location.href = "<?php echo Bootstrap::get_setting('php_root');?>sysop/activity/?filter=very low";
});

$("button.filter-low").on("click",function(){
	window.location.href = "<?php echo Bootstrap::get_setting('php_root');?>sysop/activity/?filter=low";
});

$("button.filter-medium").on("click",function(){
	window.location.href = "<?php echo Bootstrap::get_setting('php_root');?>sysop/activity/?filter=medium";
});

$("button.filter-high").on("click",function(){
	window.location.href = "<?php echo Bootstrap::get_setting('php_root');?>sysop/activity/?filter=high";
});

$("button.filter-veryhigh").on("click",function(){
	window.location.href = "<?php echo Bootstrap::get_setting('php_root');?>sysop/activity/?filter=very high";
});

$("button.filter-all").on("click",function(){
	window.location.href = "<?php echo Bootstrap::get_setting('php_root');?>sysop/activity/";
});