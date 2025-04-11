//---------------------------------------------------------------------------------------
// View: VWidgetAccountRegisterForm
// Description: Displays the user's profile information.
//---------------------------------------------------------------------------------------

var VWidgetAccountRegisterForm = VBaseWidgetForm.extend({

    /* overload and/or extend */
    id : "widget-account-register-form",
    templateID : "tpl-widget-account-register-form",
    formName : "register",
    
    successAlertText : function() {
        return "An email has been sent to you with a verification code. Go get it and then <a href='"+app.JS_ROOT+"#verify/' class='navigate'>verify your account</a>.";
    },

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-account-register-form";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
            "click img[name=captcha]" : "onClickCaptchaImage",
            "click a[name=terms]" : "onClickTerms"
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // If we require some attributes to be present on the form upon display
    // then this function should return them. We need to make a random string
    // so the captcha is unique to this page display (i.e., if they get the
    // default captcha image on one page but refreshed it on a previous page
    // then the session is still working with that old one and the browser
    // won't refresh the default one if it's already been shown).
    ///////////////////////////////////////////////////////////////////////////

    getDefaultAttrsForTemplate : function() { /* overload (as required) */
        return {
            randomStr : $.leftovers.parse.generate_random_string(10,true,true,true)
        };
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
    // The user is asking to see the terms and conditions. Show them and give
    // them just an "ok" option.
    ///////////////////////////////////////////////////////////////////////////

    onClickTerms : function RegisterView__onClickTerms(event) {        

        var msg = $.includejs.getTemplate("tpl-widget-account-register-form-terms",{});

        bsDialog.create({
            title : "Terms and Conditions",
            msg : msg,
            ok : function() {
                this.jqo_agree.prop("disabled",false);
                this.jqo_agree.prop("checked",false);
            }.bind(this)
        });
        
        event.preventDefault();
    },

    ///////////////////////////////////////////////////////////////////////////
    // After the form has been successfully submitted, we will lock everything.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overloaded */

        this.$("input").prop("disabled",true);
        this.$("button").prop("disabled",true);

        // completely remove the checkbox of terms/conditions
        this.$("input[type=checkbox]").remove();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Nothing to do here except grab a few references.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */
        
        this.jqo_captcha = this.jqoForm.find("input[name=captcha]");
        this.jqo_agree = this.jqoForm.find("input[name=agree]");
        
        // we'll keep a record of the unmodified captcha URL, so we can generate new ones.
        this.jqo_img_captcha = this.jqoForm.find("img[name=captcha]");
        this.img_captcha_src = this.jqo_img_captcha.attr("src");
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields from our select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        var attrs = this.jqoForm.serialize_object();
        
        // trim all the strings
        attrs.email = $.trim(attrs.email);
        attrs.password = $.trim(attrs.password);
        attrs.full_name = $.trim(attrs.full_name);
        attrs.captcha = $.trim(attrs.captcha);

        // convert captcha to uppercase
        attrs.captcha = attrs.captcha.toUpperCase();

        // convert boolean to 1/0
        attrs.agree = attrs.agree ? 1 : 0;

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the email and password sent in.
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function VWidgetAccountRegisterForm__validateAttrs(attrs) { /* overloaded */        

        // (1) email. ensure it's an appropriate format (naive).

        var result = $.leftovers.parse.validate_string({
            str : attrs.email,
            field : "Email",
            match_type : "email"
        });

        if ( !result.passed ) {
            return {
                msg : "<strong>Email</strong>: Please enter a valid email address",
                field : "email"
            }
        }

        // (2) check first_name.

        re = new RegExp("^[- A-Za-z']{2,32}$");
        if ( !re.test(attrs.first_name) ) {
            return {
                msg : "<strong>First Name(s)</strong>: 2-32 chars long, charset: <em>A-z</em>, <em>-'</em>",
                field : "first_name"
            };
        }

        // (3) check last_name.

        re = new RegExp("^[- A-Za-z']{2,32}$");
        if ( !re.test(attrs.last_name) ) {
            return {
                msg : "<strong>Last Name</strong>: 2-32 chars long, charset: <em>A-z</em>, <em>-'</em>",
                field : "last_name"
            };
        }

        // convert both the name fields into the accepted format used here.
        attrs.first_name = $.leftovers.parse.name_case(attrs.first_name);
        attrs.last_name = $.leftovers.parse.name_case(attrs.last_name);

        // (4) captcha. ensure they entered something.

        if ( !attrs.captcha.length ) {
            return {
                msg : "<strong>Captcha</strong>: Please enter the captcha characters",
                field : "captcha"
            }
        }

        // (5) agreement to terms.

        if ( !attrs.agree ) {
            return {
                msg : "Please read and accept the terms and conditions.",
                field:"agree"
            };
        }

        // okay, we are now going to try to validate these on the server, by
        // actually registering the user.

        Spinner.get().show({msg:"Registering...",opacity:0});

        $.ajax({
            url : app.JS_ROOT+"ajax/account.php/register",
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
                        case "institution":
                            this.onAttrsInvalid({
                                field:"email",
                                msg:"<strong>Email</strong>: I'm sorry but we only support the following institutions at the moment: <em>" + userError.msg + "</em>. Please <a href='mailto:hello@plasticthoughts.ca'>email us</a> if you want your institution added to our list."
                            });
                            break;
                        case "full":
                            this.onAttrsInvalid({field:null,msg:"<strong>Full</strong: Sorry but we aren't accepting new users at the moment. Please try again in a day or so."});
                            break;
                        case "login":
                            this.onAttrsInvalid({field:"email",msg:"<strong>Email</strong>: That email address has already been registered."});
                            break;
                        case "captcha":
                            this.onAttrsInvalid({field:"captcha",msg:"<strong>Captcha</strong>: Please enter the correct captcha characters."});
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