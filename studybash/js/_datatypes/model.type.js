//---------------------------------------------------------------------------------------
// Model: TypeModel
// Description: Represents a "type" of content, along with the amount of that content
//              that a given user has.
//---------------------------------------------------------------------------------------

var TypeModel = Backbone.Model.extend({

    defaults : {
        id : undefined, // "cards" or "tests"
        type_name : undefined, // for display purposes
        count : undefined
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup all the backbone-related events that we are interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {
        
        // setup the URL, `JS_ROOT` isn't setup until the inline js on index.php
        this.urlRoot = app.JS_ROOT + "_ajax/user.php";

        this.listenTo(this,"all",function(){
            //console.log("TypeModel.onAll ==> " + arguments[0]);
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
            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
        };

        return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the model. Here we go through all of the attributes of the
    // model and ensure that they are valid. Of course this is never done through
    // a form, so the field/msg values are meaningful only for debug.
    //
    // @return - object containing .msg and .field on error, nothing on success
    ///////////////////////////////////////////////////////////////////////////

    validate : function(attrs,options) {

        // (1) id

        if ( ( attrs.id !== "cards" ) && ( attrs.id !== "tests" ) ) {            
            return {
                msg : "<strong>ID</strong>: Please set a valid ID",
                field : "id"
            };
        }

        // (2) count

        if ( $.gettype(attrs.count).base !== "number" ) {
            return {
                msg : "<strong>Count</strong>: Please provide a count value",
                field : "count"
            };
        }

        // if it passed we are not supposed to return anything.
    }

});