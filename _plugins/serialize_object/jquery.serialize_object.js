/*
	Source: http://backbonetutorials.com/
	Note: Look here for an alternative, and more advanced, idea: https://github.com/danheberden/jquery-serializeForm

	Example:

	    <script>

	        $(function() {
                $("<div></div>")
                .html(JSON.stringify($("form").serialize_object()))
                .appendTo("body");
	        });

	    </script>

		<body>
	        <form>
	            <input type='text' name='firstname' value='Eleventy'>
	            <input type='text' name='lastname' value='One'>
	            <input type='hidden' name='id' value='1'>
	            <button type='submit'>Submit</button>
	        </form>
		</body>

		-- This would add html of {"firstname":"Eleventy","lastname":"One","id":"1"}
*/
(function( $ ){

	$.fn.serialize_object = function() {
		
		var o = {};		
		var a = this.serializeArray(); // ref: http://api.jquery.com/serializeArray/

		// at this stage, `a` is an array of objects, with each having .name and .value.

		$.each(a,function(){

			// if we already have an entry for this name, we're going to
			// be converting the existing value into an array, and then
			// adding to it.

			if ( o[this.name] !== undefined ) {
				
				// if it hasn't already been converted into an array, do
				// so now.

				if ( !o[this.name].push ) {
					o[this.name] = [o[this.name]];
				}

				o[this.name].push(this.value || '');
			}

			// if there is no entry for this name already, then just copy
			// over the value.

			else {
				o[this.name] = this.value || '';
			}
		});

		return o;
	};

}( jQuery ));