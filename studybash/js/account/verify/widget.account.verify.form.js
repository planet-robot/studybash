//---------------------------------------------------------------------------------------
// View: VWidgetAccountVerifyForm
// Description: Displays the form the user can use to verify themselves.
//---------------------------------------------------------------------------------------

var app = app || {}; // required as we use this directly in our member hash.

var VWidgetAccountVerifyForm = VBaseWidgetForm.extend({

    /* overload and/or extend */
    id : "widget-account-verify-form",
    templateID : "tpl-widget-account-verify-form",
    formName : "verify",

    successAlertText : function() {
        return "You may now <a href='"+app.JS_ROOT+"#login/' class='navigate'>login</a>.";
    },

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-account-verify-form";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // After the form has been successfully submitted, we lock everything.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overloaded */
        this.$("input").prop("disabled",true);
        this.$("button").prop("disabled",true);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Nothing to do here.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // We will set our form's title here as well as the email address that's
    // in there by default.
    ///////////////////////////////////////////////////////////////////////////

    getDefaultAttrsForTemplate : function() { /* overload (as required) */
        
        var attrs = {email:null,form_title:"Verify Your Account",button_title:"Verify"};

        if ( this.options && this.options.email ) {
            attrs.email = this.options.email;
        }
        if ( this.options && this.options.sbSetPwd ) {
            attrs.form_title = "Set Your Password";
            attrs.button_title = "Set";
        }

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields from our select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form.
        var attrs = this.jqoForm.serialize_object();

        // trim all the strings
        attrs.password1 = $.trim(attrs.password1);
        attrs.password2 = $.trim(attrs.password2);
        attrs.email = $.trim(attrs.email);
        attrs.code = $.trim(attrs.code);

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the email and password sent in.
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function VWidgetAccountVerifyForm__validateAttrs(attrs) { /* overloaded */

        // (1) email
        
        if ( !attrs.email.length ) {
            return {
                msg : "<strong>Email</strong>: Please enter your registered email address",
                field : "email"
            }
        }

        // (2) code
        
        if ( !attrs.code.length ) {
            return {
                msg : "<strong>Code</strong>: Please enter your verification code",
                field : "code"
            }
        }

        // (3) password format
        
        if ( ( attrs.password1.length < 6 ) || ( attrs.password1.length > 32 ) ) {
            return {
                msg : "<strong>Password</strong>: Must be between 6-32 chars long",
                field : "password1"
            };
        }

        // (4) matching passwords
        
        if ( attrs.password2 !== attrs.password1 ) {
            return {
                msg : "<strong>Password</strong>: Must match",
                field : "password2"
            };
        }        

        // okay, we are now going to try to validate these on the server, by
        // actually registering the user.

        Spinner.get().show({msg:"Verifying...",opacity:0});

        $.ajax({
            url : app.JS_ROOT + "ajax/account.php/verify",
            type : "POST",
            dataType : "json",
            contentType : "application/json",
            data : JSON.stringify(attrs),
            processData : false,
            context : this
        })
        .done(function(data,textStatus,jqXHR) {
            this.onAttrsValid(data);
            Spinner.get().hide();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {

            Spinner.get().hide(function(){
            
                // if we have a specific error from the server, we will parse it and
                // give the user an appropriate "failed" message on the form.
                
                var userError = app.getAjaxUserError(jqXHR);
                if ( userError ) {
                    switch ( userError.type ) {
                        case "register":
                            this.onAttrsInvalid({
                                field:null,
                                msg:"<strong>Account</strong>: Unrecognized email/code combination. Do you need us to <a href='"+app.JS_ROOT+"#sendcode/' class='navigate'>send</a> you a new verification code?"
                            });
                            break;
                        case "login":
                            this.onAttrsInvalid({
                                field:null,
                                msg:"<strong>Account</strong>: You have already verified this account. Please <a href='"+app.JS_ROOT+"#login/' class='navigate'>login</a>."
                            });
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