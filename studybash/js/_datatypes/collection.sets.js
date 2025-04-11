//---------------------------------------------------------------------------------------
// Collection: SetsCollection
// Description: A collection for fc set models. Sorted alphabetically by default, by name 
//              and then description.
//---------------------------------------------------------------------------------------

var SetsCollection = Backbone.Collection.extend({

    model : function(attrs,options) {
        return new SetModel(attrs,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup the backbone-related events that we're interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // when loading the collection, this is the url we contact. note
        // that fetch is the only operation on the collection that involves
        // the server - the rest are done on models directly.
        this.url = app.JS_ROOT + "ajax/studying/sets-backbone.php";

    	this.listenTo(this,"all",function(){
            //console.log("CSets.onAll ==> " + arguments[0]);
        });

        // we have two possible sort criteria: "name", "cards"
        this.sortCriteria = "name";

        // assume ascending sort.
        this.isAscending = true;
    },

    ///////////////////////////////////////////////////////////////////////////
    // `sync` is called every time a model is either read or saved from/to the
    // server. We use this to send our user token along, to prevent CSRF/XSRF
    // attacks.
    // @CSRF/XSRF: http://www.codinghorror.com/blog/2008/10/preventing-csrf-and-xsrf-attacks.html
    ///////////////////////////////////////////////////////////////////////////

    sync : function(method,model,options) {

        // .beforeSend is an option for $.ajax (http://api.jquery.com/jQuery.ajax/)
        // to get at headers: http://stackoverflow.com/questions/541430/how-do-i-read-any-request-header-in-php
    	options.beforeSend = function(jqxhr,options) {
    		jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
    	};

    	return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // `comparator` is used by the sort function on our collection in order
    // to know how to properly order the models.
    // @returns: -1 for 'a' comes first, +1 for 'b' comes first, 0 for equal
    ///////////////////////////////////////////////////////////////////////////

    comparator : function(a,b) {

        // sorting by cards (sort by name when equal)

        if ( this.sortCriteria === "cards" ) {

            var fieldName = "num_filtered_cards";

            // first look for 'a' coming first. this code was written
            // with an ascending sort being the default.

            var a_first = (
                ( a.get(fieldName) < b.get(fieldName) ) ||
                ( ( a.get(fieldName) === b.get(fieldName) ) && ( a.get("set_name") < b.get("set_name") ) ) ||
                ( ( a.get(fieldName) === b.get(fieldName) ) && ( a.get("set_name") === b.get("set_name") ) && ( a.get("description") < b.get("description") ) )
            );

            if ( a_first ) {
                return -1 * [-1,1][+!!this.isAscending];
            }

            // now check for equality. if not, b comes first.

            var equal  = (
                ( a.get(fieldName) === b.get(fieldName) ) &&
                ( a.get("set_name") === b.get("set_name") ) &&
                ( a.get("description") === b.get("description") )
            );

            return equal ? 0 : ( +1*[-1,1][+!!this.isAscending] );
        }

        // by name is default.

        else {

            // first look for 'a' coming first. this code was written
            // with an ascending sort being the default.

            var a_first = (
                ( a.get("set_name") < b.get("set_name") ) ||
                ( ( a.get("set_name") === b.get("set_name") ) && ( a.get("description") < b.get("description") ) )
            );

            if ( a_first ) {
                return -1 * [-1,1][+!!this.isAscending];
            }

            // now check for equality. if not, b comes first.

            var equal  = (
                ( a.get("set_name") == b.get("set_name") ) &&
                ( a.get("description") == b.get("description") )
            );

            return equal ? 0 : ( +1*[-1,1][+!!this.isAscending] );
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is called when the collection of models is returned from the
    // server. If you want to manipulate the data before backbone gets ahold
    // of it, this is the place.
    //
    //  @response - this is the `data` returned from the AJAX call. Backbone
    //              expects it to be an array of objects after this function
    //              is through. so if you return an object with other info
    //              inside it, then you need extract that here, put it somewhere
    //              else, and then set `response` to the array of objects that
    //              backbone is expecting.
    //
    ///////////////////////////////////////////////////////////////////////////

    parse : function(response,options) {

        // no-op: just send through whatever we received.
        return response;
    }
    
});