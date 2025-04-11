//---------------------------------------------------------------------------------------
// Model: GroupModel
// Description: Represents a "studygroup". This will include the user's personal
//              content, the public studygroup, and all private studygroups.
//---------------------------------------------------------------------------------------

var GroupModel = Backbone.Model.extend({

    defaults : {
        id : undefined, // "self", "pub", or integer (for private)        
        num_members : undefined,
        owner_first_name : undefined, // undefined for public studygroup vv
        owner_last_name : undefined,
        owner_id : undefined,
        created_on : undefined,
        code : undefined,
        is_user_member : undefined, // added by PHP
        is_user_owner : undefined // added by PHP
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup all the backbone-related events that we are interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {
        // the url we use to save a single model - when working with more
        // than one (i.e., loading) we use the collection. note that
        // this will be added to in order to specify the enrollment, 
        // user, and set ID as appropriate.
        this.urlRoot = app.JS_ROOT + "ajax/studying/groups-backbone.php";
        this.baseUrlRoot = this.urlRoot;

        this.listenTo(this,"all",function(){
            //console.log("MSets.onAll ==> " + arguments[0]);
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
    // model and ensure that they are valid.
    // @return - object containing .msg and .field on error, nothing on success
    ///////////////////////////////////////////////////////////////////////////

    validate : function(attrs,options) {

        // (1) the code

        if ( !attrs.code ) {
            return {
                msg : "<strong>Code</strong>: Please set a search code for the group",
                field : "code"
            };
        }
           
        var re = new RegExp("^[A-z0-9]{6}$");
        if ( !re.test(attrs.code) ) {
            return {
                msg : "<strong>Code</strong>: 6 chars long, charset: [<em>A-z</em>, <em>0-9</em>]",
                field : "code"
            };
        }

        // if it passed we are not supposed to return anything.
    }

});