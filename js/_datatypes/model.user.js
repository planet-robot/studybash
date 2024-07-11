//---------------------------------------------------------------------------------------
// Model: User
// Description: Holds a single `user` record (e.g., email, full_name, institution_id, ...)
//---------------------------------------------------------------------------------------

var UserModel = Backbone.Model.extend({

    defaults : {
        institution_id : undefined,
        email : undefined,
        password : undefined,
        status : undefined,
        full_name : undefined,
        registered_on : undefined,
        last_login : undefined,
        num_logins : undefined,
        verification_code : undefined
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup all the backbone-related events that we are interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // setup the URL, `JS_ROOT` isn't setup until the inline js on index.php
        this.urlRoot = app.JS_ROOT + "_ajax/user.php";

        this.listenTo(this,"all",function(){
            //console.log("UserModel.onAll ==> " + arguments[0]);
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
    // Validate the model. Here we go through all of the attributes of the
    // model and ensure that they are valid.
    //
    //  @options - object containing:
    //      .func - "register", "verify", "update"
    //      .institutions - array of objects with .email_suffix and .name
    //  @return - object containing .msg and .field
    ///////////////////////////////////////////////////////////////////////////

    validate : function(attrs,options) {

        // (A) "REGISTERING"

        if ( options.func === "register" ) {

            // (1) check the full_name. ensure it's between 2 and 3 words.

            attrs.full_name = $.trim(attrs.full_name);
            var name = attrs.full_name.split(" ");
            if ( ( name.length < 2 ) || ( name.length > 3 ) ) {
                return {
                    msg : "<strong>Name</strong>: Please enter your full name",
                    field : "full_name"
                }
            }

            // also check that it's got safe characters

            re = new RegExp("^[- A-Za-z']{5,64}$");
            if ( !re.test(attrs.full_name) ) {
                return {
                    msg : "<strong>Name</strong>: 5-64 chars long, charset: <em>A-z</em>, <em>-'</em>",
                    field : "full_name"
                };
            }

            // (2) email. ensure it's an appropriate format (naive).

            attrs.email = $.trim(attrs.email);
            var result = $.leftovers.parse.validate_string({
                str : attrs.email ? attrs.email : "",
                field : "Email",
                match_type : "email"
            });

            if ( !result.passed ) {
                return {
                    msg : "<strong>Email</strong>: Please enter a valid email address",
                    field : "email"
                }
            }

            // look for it in our institution list.

            var email = attrs.email ? attrs.email.split("@") : ["",""];
            var result = _.find(options.institutions,function(elem){
                return elem.email_suffix = email[1];
            });
            if ( !result ) {
                msg = "<strong>Email</strong>: I'm sorry but we only support the following institutions at the moment: ";
                var len = msg.length;
                $.each(options.institutions_email_suffixes,function(idx,elem) {
                    if ( msg.length !== len ) {
                        msg += ", ";
                    }
                    msg += elem;
                });
                return {
                    msg : msg,
                    field : "email"
                }
            }
        }

        // (B) "VERIFYING"/"UPDATING"

        if ( ( options.func == "verify" ) || ( options.func == "update" ) ) {

            // (1) password

            attrs.password = $.trim(attrs.password);
            if ( ( attrs.password.length < 6 ) || ( attrs.password.length > 64 ) ) {
                return {
                    msg : "<strong>Password</strong>: 6-64 chars long",
                    field : "password"
                };
            }
        }

        // if it passed we are not supposed to return anything.
    }

});