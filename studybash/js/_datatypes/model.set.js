//---------------------------------------------------------------------------------------
// Model: SetModel
// Description: Holds a single fc set record.
//---------------------------------------------------------------------------------------

var SetModel = Backbone.Model.extend({

    defaults : {
        set_name : undefined,
        description : null, // optional
        sharing : undefined,
        has_auto_test : undefined,
        created_on : undefined,
        created_by : undefined, // manual
        num_filtered_cards : undefined, // manual
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
        this.urlRoot = app.JS_ROOT + "ajax/studying/sets-backbone.php";
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

        // (1) name

        var re = new RegExp("^[-!.,& A-z0-9'\"()\\[\\]]{1,32}$");
        if ( !re.test(attrs.set_name) ) {
            return {
                msg : "<strong>Name</strong>: 1-32 chars long, charset: [<em>A-Z</em>, <em>0-9</em>, <em>-! .,&()[]'\"</em>]",
                field : "set_name"
            };
        }

        // (2) description (optional)

        if ( attrs.description && attrs.description.length ) {
        
            re = new RegExp("^[-!.,& A-z0-9'\"()\\[\\]]{1,64}$");
            if ( !re.test(attrs.description) ) {
                return {
                    msg : "<strong>Description</strong>: 0-64 chars long, charset: [<em>A-Z</em>, <em>0-9</em>, <em>-! .,&()[]'\"</em>]",
                    field : "description"
                };
            }
        }

        // (3) sharing

        if ( !attrs.sharing ) {
            return {
                msg : "<strong>Sharing</strong>: Please pick a value",
                field : "sharing"
            };
        }

        // (4) has auto test. cannot be invalid on the client.

        // if it passed we are not supposed to return anything.
    }

});