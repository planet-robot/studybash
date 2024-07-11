//---------------------------------------------------------------------------------------
// Collection: UsersCollection
// Description: Holds all of the EnrollmentModel instances, both active and completed.
//              This keeps them sorted, with most recent, 'active' first.
//---------------------------------------------------------------------------------------

var UsersCollection = Backbone.Collection.extend({

    model : function(attrs,options) {
        return new UserModel(attrs,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup the backbone-related events that we're interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // when loading the collection, this is the url we contact
        this.url = app.JS_ROOT + "ajax/user.php";

    	this.listenTo(this,"all",function(){
            //console.log("CEnrollment.onAll ==> " + arguments[0]);
        });

        // we have three possible sort criteria: "name", "cards", "tests"
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

        var aIsUser = a.get("id") === app.store.get("user").id;
        var bIsUser = b.get("id") === app.store.get("user").id;

        // sorting by cards or tests (sort by name when equal)

        if ( ( this.sortCriteria === "cards" ) || ( this.sortCriteria === "tests" ) ) {

            var fieldName = ( this.sortCriteria === "cards" ? "num_filtered_cards" : "num_tests" );

            // first look for 'a' coming first. this code was written
            // with an ascending sort being the default.

            var a_first = (
                ( a.get(fieldName) < b.get(fieldName) ) ||
                ( ( a.get(fieldName) === b.get(fieldName) ) && ( a.get("last_name") < b.get("last_name") ) ) ||
                ( ( a.get(fieldName) === b.get(fieldName) ) && ( a.get("last_name") === b.get("last_name") ) && ( a.get("first_name") < b.get("first_name") ) )
            );

            if ( a_first ) {
                return -1 * [-1,1][+!!this.isAscending];
            }

            // now check for equality. if not, b comes first.

            var equal  = (
                ( a.get(fieldName) === b.get(fieldName) ) &&
                ( a.get("last_name") === b.get("last_name") ) &&
                ( a.get("first_name") === b.get("first_name") )
            );

            return equal ? 0 : ( +1*[-1,1][+!!this.isAscending] );
        }

        // by name is default.

        else {

            // first look for 'a' coming first. this code was written
            // with an ascending sort being the default.

        	var a_first = (
                ( aIsUser > bIsUser ) ||
                ( ( aIsUser === bIsUser ) && ( a.get("last_name") < b.get("last_name") ) ) ||
                ( ( aIsUser === bIsUser ) && ( a.get("last_name") === b.get("last_name") ) && ( a.get("first_name") < b.get("first_name") ) )
            );

            if ( a_first ) {
                return -1 * [-1,1][+!!this.isAscending];
            }

            // now check for equality. if not, b comes first.

            var equal  = (
                ( aIsUser === bIsUser ) &&
                ( a.get("last_name") == b.get("last_name") ) &&
                ( a.get("first_name") == b.get("first_name") )
            );

            return equal ? 0 : ( +1*[-1,1][+!!this.isAscending] );
        }        
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is called when the collection of models is returned from the
    // server. If you want to manipulate the data before backbone gets ahold
    // of it, this is the place.
    ///////////////////////////////////////////////////////////////////////////

    parse : function(response,options) {
        
        // no-op: just pass it along.
    	return response;
    }
});