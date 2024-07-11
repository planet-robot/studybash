//---------------------------------------------------------------------------------------
// View: VWidgetAccountResetForm
// Description: Displays the form the user can use to reset their password.
//---------------------------------------------------------------------------------------

var VWidgetAccountResetForm = VBaseWidgetForm.extend({

    /* overload and/or extend */
    id : "widget-account-reset-form",
    templateID : "tpl-widget-account-reset-form",
    formName : "reset",
    
    successAlertText : function() {
        return "An email has been sent to you with a verification code. Go get it and then <a href='"+app.JS_ROOT+"#setpwd/' class='navigate'>set a new password.";
    },

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-account-reset-form";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
            "click img[name=captcha]" : "onClickCaptchaImage",
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on the captcha image. Let's give them a new one.
    // The PHP file re-generates the image and sets the session data
    // appropriately.
    ///////////////////////////////////////////////////////////////////////////

    onClickCaptchaImage : function RegisterView__onClickCaptchaImage(event) {

        var randStr = $.leftovers.parse.generate_random_string(10,true,true,true);
        this.jqo_img_captcha.attr("src",this.img_captcha_src+"?"+randStr);

        event.preventDefault();
    },

    ///////////////////////////////////////////////////////////////////////////
    // After the form has been successfully submitted, we lock everything.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overloaded */

        this.$("input").prop("disabled",true);
        this.$("button").prop("disabled",true);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Nothing to do here except grab a few references.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */
        
        this.jqo_captcha = this.jqoForm.find("input[name=captcha]");
        
        // we'll keep a record of the unmodified captcha URL, so we can generate new ones.
        this.jqo_img_captcha = this.jqoForm.find("img[name=captcha]");
        this.img_captcha_src = this.jqo_img_captcha.attr("src");
    },

    ///////////////////////////////////////////////////////////////////////////
    // If we require some attributes to be present on the form upon display
    // then this function should return them. We setup the random string for
    // our captcha (so it's reloaded) and the appropriate titles.
    ///////////////////////////////////////////////////////////////////////////

    getDefaultAttrsForTemplate : function() { /* overload (as required) */
        
        var attrs = {
            randomStr : $.leftovers.parse.generate_random_string(10,true,true,true),
            email:null,
            form_title:"Reset Your Password",
            button_title:"Reset"
        };
        
        if ( this.options && this.options.email ) {
            attrs.email = this.options.email;
        }
        if ( this.options && this.options.sbSendCode ) {
            attrs.form_title = "Send New Code";
            attrs.button_title = "Send";
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
        attrs.email = $.trim(attrs.email);
        attrs.captcha = $.trim(attrs.captcha);

        // convert captcha to uppercase
        attrs.captcha = attrs.captcha.toUpperCase();

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the email and password sent in.
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function VWidgetAccountResetForm__validateAttrs(attrs) { /* overloaded */

        // (1) email
        
        if ( !attrs.email.length ) {
            return {
                msg : "<strong>Email</strong>: Please enter your registered email address",
                field : "email"
            }
        }

        // (2) captcha. ensure they entered something.
        
        if ( !attrs.captcha.length ) {
            return {
                msg : "<strong>Captcha</strong>: Please enter the captcha characters (click on the image for a new one)",
                field : "captcha"
            }
        }

        // okay, we are now going to try to validate these on the server, by
        // actually resetting the user.

        Spinner.get().show({msg:"Resetting...",opacity:0});

        $.ajax({
            url : app.JS_ROOT + "ajax/account.php/reset",
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
                                field:"email",
                                msg:"<strong>Email</strong>: Unrecognized email. Do you need to <a href='"+app.JS_ROOT+"#register/' class='navigate'>register</a> an account?"
                            });
                            break;
                        case "captcha":
                            this.onAttrsInvalid({
                                field:"captcha",
                                msg:"<strong>Captcha</strong>: Please enter the captcha characters."
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