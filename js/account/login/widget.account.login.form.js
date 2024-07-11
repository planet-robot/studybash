//---------------------------------------------------------------------------------------
// View: VWidgetAccountLoginForm
// Description: Displays the user's profile information.
//---------------------------------------------------------------------------------------

var VWidgetAccountLoginForm = VBaseWidgetForm.extend({

    /* overload and/or extend */
    id : "widget-account-login-form",
    templateID : "tpl-widget-account-login-form",
    formName : "login",
    allowDefaultSubmit : true,
    successAlertText : undefined, // not used

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-account-login-form";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We will always leave the values up there.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Nothing to do here.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields from our select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form.
        var attrs = this.jqoForm.serialize_object();

        // trim all the strings
        attrs.email = $.trim(attrs.email);
        attrs.password = $.trim(attrs.password);        

        // convert boolean to 1/0
        attrs.keep = attrs.keep ? 1 : 0;

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the email and password sent in.
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function VWidgetAccountLoginForm__validateAttrs(attrs) { /* overloaded */

        // (1) email

        if ( !attrs.email.length ) {
            return {
                msg : "<strong>Email</strong>: Please enter your email address",
                field : "email"
            };
        }

        // (2) password

        if ( !attrs.password.length ) {
            return {
                msg : "<strong>Password</strong>: Please enter your password",
                field : "password"
            };
        }

        Spinner.get().show({msg:"Logging in...",opacity:0});

        $.ajax({
            url : app.JS_ROOT+"ajax/account.php/login",
            type : "POST",
            dataType : "json",
            contentType : "application/json",
            data : JSON.stringify(attrs),
            processData : false,
            context : this
        })
        .done(function(data,textStatus,jqXHR) {
            Spinner.get().hide(function(){
                this.onAttrsValid(data);            
            }.bind(this));
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            
            Spinner.get().hide(function(){
            
                // if we have a specific error from the server, we will parse it and
                // give the user an appropriate "failed" message on the form.
                
                var userError = app.getAjaxUserError(jqXHR);
                if ( userError ) {
                    switch ( userError.type ) {
                        case "verify":
                            this.onAttrsInvalid({field:null,msg:"<strong>Account</strong>: Please <a href='"+app.JS_ROOT+"#verify/' class='navigate'>verify</a> your account. Do you need us to <a href='"+app.JS_ROOT+"#sendcode/' class='navigate'>send</a> you a new verification code?"});
                            break;
                        case "register":
                            this.onAttrsInvalid({field:null,msg:"<strong>Account</strong>: Unrecognized email/password combination. Do you need to <a href='"+app.JS_ROOT+"#register/' class='navigate'>register</a> an account?"});
                            break;
                        default:
                            app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                            break;
                    }
                }
                else {
                    app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                }

            }.bind(this));
        });

        // we're going to validate the rest on the server. take no action
        // in our base widget.
        return null;
    }
});