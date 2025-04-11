//---------------------------------------------------------------------------------------
// Collection: EnrollmentCollection
// Description: Holds all of the EnrollmentModel instances, both active and completed.
//              This keeps them sorted, with most recent, 'active' first.
//---------------------------------------------------------------------------------------

var EnrollmentCollection = Backbone.Collection.extend({

    // each element is an EnrollmentModel    
    model : function(attrs,options) {
        return new EnrollmentModel(attrs,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup the backbone-related events that we're interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // when loading the collection, this is the url we contact
        this.url = app.JS_ROOT + "ajax/classes-backbone.php";

    	this.listenTo(this,"all",function(){
            //console.log("CEnrollment.onAll ==> " + arguments[0]);
        });
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
    		jqxhr.setRequestHeader("SESSIONTOKEN",app.store.get("user").token);
    	};

    	return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // `comparator` is used by the sort function on our collection in order
    // to know how to properly order the models.
    // @returns: -1 for 'a' comes first, +1 for 'b' comes first, 0 for equal
    ///////////////////////////////////////////////////////////////////////////

    comparator : function(a,b) {

        // first look for 'a' coming first.

    	var a_first = (
            ( a.get("completed") < b.get("completed") ) ||
            ( ( a.get("completed") == b.get("completed") ) && ( a.get("year") > b.get("year") ) ) ||
            ( ( a.get("completed") == b.get("completed") ) && ( a.get("year") == b.get("year") ) && ( a.get("semester_order_id") > b.get("semester_order_id") ) ) ||
            ( ( a.get("completed") == b.get("completed") ) && ( a.get("year") == b.get("year") ) && ( a.get("semester_order_id") == b.get("semester_order_id") ) && ( a.get("subject_code") < b.get("subject_code") ) ) ||
            ( ( a.get("completed") == b.get("completed") ) && ( a.get("year") == b.get("year") ) && ( a.get("semester_order_id") == b.get("semester_order_id") ) && ( a.get("subject_code") == b.get("subject_code") ) && ( a.get("class_code") < b.get("class_code") ) )
        );

        if ( a_first ) {
        	return -1;
        }

        // now check for equality. if not, b comes first.

        var equal  = (
            ( a.get("completed") == b.get("completed") ) && 
            ( a.get("year") == b.get("year") ) && 
            ( a.get("semester_order_id") == b.get("semester_order_id") ) && 
            ( a.get("subject_code") == b.get("subject_code") ) && 
            ( a.get("class_code") == b.get("class_code") )
        );

        return equal ? 0 : +1;
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