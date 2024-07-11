/*

	http://learn.jquery.com/plugins/basic-plugin-creation/
	http://marijnhaverbeke.nl/uglifyjs
	
	"objary" jQuery plugin - Version 1.0 (Aug, 2013)

	Simple plugin that adds some helpful functions to deal with arrays of objects.

	Disclaimer: I'm new to creating jQuery plugins, so don't expect too much.

	Dependencies:
	-------------

	* http://jquery.com/ - duh
    * http://eleventyone.github.io/gettype/ - detailed typeinfo for objects.

	Functions:
	------

		$.aryobj.get_idxs - return an array of elements/idxs that match
		$.aryobj.sort_by - return a function to sort the elements
        $.aryobj.make_field_ary - make a new array of a single field
        $.aryobj.get_insert_idx - return the idx to insert new element
		
	Examples:
	--------

        var a = [{id:0,text:"Zero"},{id:1,text:"One"},{id:2,text:"Two"},{id:11,text:"Eleven"},{id:14,text:"Fourteen"}];
        var r = {};

        // (1) $.aryobj.get_idxs

        // r will be: [ {idx:11,text:"Eleven"},{idx:14,text:"Fourteen"} ]
        r = $.aryobj.get_idxs(a,function(elem){
            return elem.id > 10;
        });

        for ( var x=r.length; x>=0; x-- ) {
            a.splice(r[x].idx,1); // doc: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
        }

        // (2) $.aryobj.sort_by

        // a will now be: [{id:1,text:"One"},{id:2,text:"Two"},{id:0,text:"Zero"}]
        a.sort($.aryobj.sort_by('text',false,function(field){
            return field.toLowerCase();
        }));

        // (3) $.aryobj.make_field_ary

        // a2 will be: ["One","Two","Zero"];
        var a2 = $.aryobj.make_field_ary(a,'text');        

        // (4) $.aryobj.get_insert_idx

        var new_elem = {id:32,text:"Thirty-Two"};
        // ret would be: {idx:0,elem:{id:1,text:"One"}}
        var ret = $.aryobj.get_insert_idx(a,new_elem,true,function(new_elem,existing_elem){
            var A = new_elem.text.toLowerCase();
            var B = existing_elem.text.toLowerCase();
            return ((A < B) ? -1 : (A > B) ? +1 : 0);
        });

        // a will now be: [{id:1,text:"One"},{id:32,text:"Thirty-Two"},{id:2,text:"Two"},{id:0,text:"Zero"}]
        a.splice(ret.idx+1,0,new_elem);
*/

(function($) {

	$.aryobj = (function() {

		/////////////////////////////////////////////////////////////////////////////////
        // Search an array of objects, matching based upon the function sent. Returns
        // an array of objects (.idx,.elem) that is sorted ASC based upon .idx.
        //
        //  Usage:
        //      var r = get_idxs(myary,function(elem){
        //                  return elem.age > 25;
        //              });
        //
        //  @return - empty array on no matches.
        /////////////////////////////////////////////////////////////////////////////////

        get_idxs = function AryObj__get_idxs(ary,match_func) {

            var ret = [];

            if ( $.gettype && ( $.gettype(ary).base === "array" ) ) {

                // we can be guaranteed that this goes through them in order, 
                // as it's just a regular array and not an object.

                $.each(ary,function(idx,elem){

                    if ( $.gettype(match_func).base === "function" ) {
                        
                        if ( match_func(elem) === true ) {
                            ret.push({
                                idx : idx,
                                elem : elem
                            });
                        }
                    }
                    
                });
            }            

            return ret;
        }

        /////////////////////////////////////////////////////////////////////////////////
        // Provide a flexible function to be used in sorting an array of objects.
        // Usage would be:
        //
        //  my_flat_ary_of_objs.sort($.aryobj.sort_by('name',false,function(field){
        //      return field.toUpperCase();
        //  }));
        //
        //  @field - string - the name of the field (in each obj) to use as the sorting key
        //  @reverse - bool - are we doing a reverse sort?
        //  @primerFunc - function - called on the field before comparison
        //
        //  Note: Notice that the javascript array `.sort()` method expects -1 when
        //  A < B and +1 when A > B.
        /////////////////////////////////////////////////////////////////////////////////

        // source: http://stackoverflow.com/questions/979256/sorting-an-array-of-javascript-objects/979325#979325
        sort_by = function AryObj__sort_by(field,reverse,primerFunc) {

            // figure out the key for sorting, based on 'field'. if primerFunc was sent
            // then apply that first to the field.            
            var key = function (obj) {return primerFunc ? primerFunc(obj[field]) : obj[field]};

            // this is the function that will actually do the sorting. if reverse is true
            // then we multiply the result by -1, otherwise it remains.
            return function (a,b) {
               var A = key(a);
               var B = key(b);
               return ((A < B) ? -1 : (A > B) ? +1 : 0) * [-1,1][+!reverse];
           }
        }

        /////////////////////////////////////////////////////////////////////////////
        // Given an array of objects, return an array consisting of values that
        // represent a single field from those objects.
        //
        // Returns an empty array if there were any problems.
        /////////////////////////////////////////////////////////////////////////////

        make_field_ary = function AryObj__make_field_ary(ary,field) {

            var ret = [];
            if ( $.gettype && ( $.gettype(ary).base === "array" ) ) {

                for ( var x=0; x < ary.length; x++ ) {
                    if ( $.gettype(ary[x][field]).base !== "undefined" ) {
                        ret.push(ary[x][field]);
                    }
                }
            }

            return ret;
        }

        /////////////////////////////////////////////////////////////////////////////////
        // Get the index that an object should be inserted at within an array of objects
        // that is currently sorted (either ASC or DESC).
        //
        //  cmp_func(new_elem,existing_elem) returns:
        //      - (-1) for new_elem < existing
        //      - (+1) for new_elem > existing
        //      - (0) for new_elem == existing
        //
        //  Returns an object (.idx, .elem). This represents the index that the
        //  new element should be inserted AFTER. If the front of the array is
        //  where it should go, it returns .idx==-1, .elem==null.
        /////////////////////////////////////////////////////////////////////////////////

        get_insert_idx = function AryObj__get_insert_idx(ary,new_elem,is_asc,cmp_func) {

            var ret = {
                idx : -1,
                elem : null
            }

            if ( $.gettype && ( $.gettype(ary).base === "array" ) ) {

                $.each(ary,function(idx,elem){

                    // if the new_elem should be placed BEFORE the current
                    // element, then we're done comparing. if `is_asc` is true,
                    // then if our new_elem is less than our current elem, we're
                    // done. otherwise, if the new_elem is greater than our current
                    // elem (`is_asc` == false), then we're done.

                    if ( cmp_func(new_elem,elem) !== 1 * [-1,1][+is_asc] ) {
                        return false; // breaks out of $.each, but not the whole func
                    }
                    else {

                        // our current element does not go before the current elem.
                        // but perhaps it will go AFTER it.
                        ret.idx = idx;
                        ret.elem = elem;
                    }                    
                });
            }

            return ret;
        }        

		return {
			get_idxs : get_idxs,
            sort_by : sort_by,
            make_field_ary : make_field_ary,
            get_insert_idx : get_insert_idx
		}

	})(); // end of "aryobj = function"

}(jQuery))