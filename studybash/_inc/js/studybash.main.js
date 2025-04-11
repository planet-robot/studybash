//---------------------------------------------------------------------------------------
// View: VSectionAccount
// Description: This section deals with logging in, registering, verifying, and resetting.
//              With a page being devoted to each.
//---------------------------------------------------------------------------------------

var VSectionAccount = VBaseSection.extend({

    /* overloaded */
    id : "section-account",
    sectionTemplateID : "tpl-section-welcome",
    headerTemplateID : "tpl-section-header-welcome",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : undefined, // not used

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-account";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseSection.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The page is changing within the section. We have to construct a URL
    // based upon the `settings` given. Note that the URL constructed is simply
    // copied into the address bar, there is no routing involved.
    //
    //  @options:   Any flags that are going to be passed along to the page
    //              construction. They was created for `setPage`.
    //
    //  @return
    //
    //      If `null` is sent back, that means that we don't have to
    //      change the URL at all. `false` is returned for an error (404), and
    //      a string is returned on success.
    //
    ///////////////////////////////////////////////////////////////////////////

    setURL : function(settings,options) { /* overloaded */

        // if we were sent here by the router, then we have nothing to do.
        if ( options.sbFromRouter ) {
            return null;
        }

        // we will have been given a string in `settings` called `pageName`.
        // we'll just use that to dictate the URL.

        if (
                ( settings.pageName === "login" ) ||
                ( settings.pageName === "register" ) ||
                ( settings.pageName === "verify" ) ||
                ( settings.pageName === "reset" )
            )
        {
            return settings.pageName + "/";
        }

        // 404.

        else {
            return false;
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // The page is changing within the section. We have to figure out which
    // page should be displayed, based upon our member var `settings`. Nothing
    // is done here except for actually creating the pageView itself.
    //
    //  @options:   Any flags to be passed along to the page being constructed.
    //              They were created for `setPage`.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {

        var newPageView = null;

        switch ( settings.pageName ) {

            case "login":
                newPageView = new VPageAccountLogin(settings,options);
                break;

            case "register":
                newPageView = new VPageAccountRegister(settings,options);
                break;

            case "verify":
                newPageView = new VPageAccountVerify(settings,options);
                break;

            case "reset":
                newPageView = new VPageAccountReset(settings,options);
                break;
        }

        return newPageView;
    }

});

//---------------------------------------------------------------------------------------
// View: VPageAccountLogin
// Description: The content of this page is simply a panel widget that displays the user's
//              profile.
//---------------------------------------------------------------------------------------

var VPageAccountLogin = VBasePage.extend({

    /* overloaded */
    id : "page-login",
    pageTemplateID : "tpl-page",
    contentTemplateID : undefined, // leave undefined to not template this element.
    footerTemplateID : "tpl-page-footer-welcome",
    contentElement : "div.page-content",
    footerElement : "div.page-footer",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-login";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally created for `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        this.formView = new VWidgetAccountLoginForm();
        this.formView.listenTo(this,"cleanup",this.formView.remove);
        this.listenTo(this.formView,"onFormSave",this.onFormSave);

        VBasePage.prototype.initialize.call(this,settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        this.stopListening(this.formView);
        this.formView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // breadcrumb, toolbar, and list views. Finally, we setup the default buttons
    // that are enabled in our toolbar.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);
        this.$(this.contentElement).html(this.formView.render().$el);

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // We have been successfully logged in. Do nothing here, just let it pass
    // through, as we are submitting the form the default way.
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) { /* overloaded */
        // no-op.
    }    

});

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

//---------------------------------------------------------------------------------------
// View: VPageAccountRegister
// Description: The only widget here is a form used for registration.
//---------------------------------------------------------------------------------------

var VPageAccountRegister = VBasePage.extend({

    /* overloaded */
    id : "page-register",
    pageTemplateID : "tpl-page",
    contentTemplateID : undefined, // leave undefined to not template this element.
    footerTemplateID : "tpl-page-footer-welcome",
    contentElement : "div.page-content",
    footerElement : "div.page-footer",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-register";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally created for `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        this.formView = new VWidgetAccountRegisterForm();
        this.formView.listenTo(this,"cleanup",this.formView.remove);
        this.listenTo(this.formView,"onFormSave",this.onFormSave);

        VBasePage.prototype.initialize.call(this,settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        this.stopListening(this.formView);
        this.formView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // breadcrumb, toolbar, and list views. Finally, we setup the default buttons
    // that are enabled in our toolbar.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);
        this.$(this.contentElement).html(this.formView.render().$el);

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our registration form has been successfully "saved" (i.e., validated). So
    // the user is now registered.
    //
    //  @formName:  The `formName` property of the VBaseWidgetForm-derived view
    //              that was submitted.
    //
    //  @formData:  The data serialized from the form. The structure of this
    //              may change significantly depending on the type of formView
    //              we're working with.
    //
    //  @options:   Any flags that were set along our chain of function calls
    //              that got us here. They will relate directly to the action
    //              of "saving". They may include our own options ("sb...") and
    //              backbone-related options.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) {
        // nothing to do here. we are just waiting for the user to decide
        // what to click on.
    }    

});

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
        return "An email has been sent to you with a verification code. Go get it and then <a href='"+app.JS_ROOT+"#verify/' class='navigate'>verify your account.";
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

//---------------------------------------------------------------------------------------
// View: VPageAccountReset
// Description: This page allows the user to reset their password. Has a single widget,
//              which is a form.
//---------------------------------------------------------------------------------------

var VPageAccountReset = VBasePage.extend({

    /* overloaded */
    id : "page-reset",
    pageTemplateID : "tpl-page",
    contentTemplateID : undefined, // leave undefined to not template this element.
    footerTemplateID : "tpl-page-footer-welcome",
    contentElement : "div.page-content",
    footerElement : "div.page-footer",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-reset";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally created for `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        this.formView = new VWidgetAccountResetForm({},options);
        this.formView.listenTo(this,"cleanup",this.formView.remove);
        this.listenTo(this.formView,"onFormSave",this.onFormSave);

        VBasePage.prototype.initialize.call(this,settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        this.stopListening(this.formView);
        this.formView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // breadcrumb, toolbar, and list views. Finally, we setup the default buttons
    // that are enabled in our toolbar.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);
        this.$(this.contentElement).html(this.formView.render().$el);

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our verification form has been successfully "saved". That means that
    // the user was verified by the server. Now we just wait for them to click
    // 'login'.
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) {
    }

});

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

//---------------------------------------------------------------------------------------
// View: VPageAccountVerify
// Description: The only widget here is a form used for registration.
//---------------------------------------------------------------------------------------

var VPageAccountVerify = VBasePage.extend({

    /* overloaded */
    id : "page-verify",
    pageTemplateID : "tpl-page",
    contentTemplateID : undefined, // leave undefined to not template this element.
    footerTemplateID : "tpl-page-footer-welcome",
    contentElement : "div.page-content",
    footerElement : "div.page-footer",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-verify";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally created for `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        this.formView = new VWidgetAccountVerifyForm({},options);
        this.formView.listenTo(this,"cleanup",this.formView.remove);
        this.listenTo(this.formView,"onFormSave",this.onFormSave);

        VBasePage.prototype.initialize.call(this,settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        this.stopListening(this.formView);
        this.formView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // breadcrumb, toolbar, and list views. Finally, we setup the default buttons
    // that are enabled in our toolbar.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);
        this.$(this.contentElement).html(this.formView.render().$el);

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our verification form has been successfully "saved". That means that
    // the user was verified by the server. Now we just wait for them to click
    // 'login'.
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) {
    }    

});

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

//---------------------------------------------------------------------------------------
// View: VPageDashProfile
// Description: The content of this page is simply a panel widget that displays the user's
//              profile.
//---------------------------------------------------------------------------------------

var VPageDashProfile = VBasePage.extend({

    /* overloaded */
    id : "page-dash",
    pageTemplateID : "tpl-page",
    contentTemplateID : "tpl-page-dash", // leave undefined to not template this element.
    footerTemplateID : "tpl-page-footer-user",
    contentElement : "div.page-content",
    footerElement : "div.page-footer",

    panelElement : "div.page-content > div.content > div.content-panel",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-dash-profile";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally created for `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */
        
        this.profileView = new VWidgetDashProfilePanel({
            templateAttrs:app.store.get("user")
        });

        VBasePage.prototype.initialize.call(this,settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        this.stopListening(this.profileView);
        this.profileView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // breadcrumb, toolbar, and list views. Finally, we setup the default buttons
    // that are enabled in our toolbar.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);
        this.$(this.panelElement).html(this.profileView.render().$el);

        return this;
    }

});

//---------------------------------------------------------------------------------------
// View: VSectionDash
// Description: The 'dashboard' section.
//---------------------------------------------------------------------------------------

var VSectionDash = VBaseSection.extend({

    /* overloaded */
    id : "section-dash",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : "dash",

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-dash";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseSection.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We never change the URL here. Sending `null` tells our caller that.
    ///////////////////////////////////////////////////////////////////////////

    setURL : function(settings,options) { /* overloaded */
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // We only have one page here.
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {
        return new VPageDashProfile(settings,options);
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetDashProfilePanel
// Description: Displays the user's profile information.
//---------------------------------------------------------------------------------------

var VWidgetDashProfilePanel = VBaseWidgetPanel.extend({

    /* overloaded */
    className : undefined,
    templateID : "tpl-dash-profile",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-panel-dash-profile";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VPageClasses
// Description: The user can browse a list of the classes that they are currently enrolled in,
//              or add a new class to their enrollment list.
//
//              There are three widgets here: toolbar, form, and list.
//---------------------------------------------------------------------------------------

var VPageClasses = VBasePage.extend({

    /* overloaded */
    id : "page-classes",
    pageTemplateID : "tpl-page",
    contentTemplateID : "tpl-page-classes", // leave undefined to not template this element.
    footerTemplateID : "tpl-page-footer-user",
    contentElement : "div.page-content",
    footerElement : "div.page-footer",

    /* overload */
    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-classes";
    },

    toolbarElement : "div.page-content > div.content > div.content-toolbar",
    formElement : "div.page-content > div.content > div.content-form",
    listElement : "div.page-content > div.content > div.content-list",

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally sent to `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        this.toolbarView = null;
        this.formView = null;
        this.listView = null;

        VBasePage.prototype.initialize.call(this,settings,options); // copies over parms.
    },

    ///////////////////////////////////////////////////////////////////////////
    // We will load the general enrollment data here. This will tell us how many
    // students have enrolled in each class (and in which years/semesters).
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageClasses__loadData() { /* overloaded */

        // this will contain all of the user's enrollment records. a simple array of objects.
        this.userEnrollment = null;

        // we are loading a big data structure here:
        //
        // (1) dictionary. KEY = subj/class combo. VALUE = object.
        // (2) object. COUNT = total for class. HAS_ADMIN = admin enrolled in class? YEARS = dictionary.
        // (3) dictionary. KEY = year. VALUE = object.
        // (4) object. COUNT = total for year. SEMESTERS = dictionary.
        // (5) dictionary. KEY = semester name. VALUE = total for semester, in that year.
        
        this.generalEnrollment = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading data...",opacity:0});
        
        var jqXHR = $.ajax({
            url : app.JS_ROOT + "ajax/classes-manual.php/init",
            type : "POST",
            dataType : "json",
            data : JSON.stringify(app.store.get("user").id),
            contentType : "application/json",
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {            
            this.userEnrollment = data.userEnrollment;
            this.generalEnrollment = data.generalEnrollment;
            data = null;
            this.ready();
            Spinner.get().hide();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // All of the data has been loaded that the page requires. We will
    // construct our subviews and then trigger an event notifying whoever is
    // listening that we're ready to render. Notice that we are not
    // dealing with the formView here, as that is manually constructed/removed
    // everytime it's needed.
    ///////////////////////////////////////////////////////////////////////////

    ready : function() { /* overloaded */

        this.toolbarView = new VWidgetClassesToolbar();        
        this.toolbarView.listenTo(this,"cleanup",this.toolbarView.remove);
        this.listenTo(this.toolbarView,"onClickToolbar",this.onClickToolbar);

        this.listView = new VWidgetClassesList({
            listData : this.userEnrollment
        });
        this.listView.listenTo(this,"cleanup",this.listView.remove);        

        this.trigger("onPageReady",this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Cleanup ourselves and all subviews.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* overloaded */

        // empty references
        this.stopListening(this.toolbarView);
        this.stopListening(this.listView);
        this.stopListening(this.formView);        
        this.toolbarView = null;        
        this.listView = null;
        this.formView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // toolbar and list views.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);

        // update the help link in the footer
        var href = this.$("div.sb-footer div.help a").prop("href");
        this.$("div.sb-footer div.help a").prop("href",href+"classes/");

        this.$(this.toolbarElement).html(this.toolbarView.render().$el);
        this.toolbarView.setEnabled({add:true});

        this.$(this.listElement).html(this.listView.render().$el);

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, as well as the event that started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,event) {

        // ADD

        if ( buttonName === "add" ) {
            this.displayAddForm();
        }
    },    

    ///////////////////////////////////////////////////////////////////////////
    // We are opening the `add` form.
    ///////////////////////////////////////////////////////////////////////////

    displayAddForm : function() {

        // this should never happen.
        if ( this.formView ) {
            this.stopListening(this.formView);
            this.formView = null;
        }

        this.formView = new VWidgetClassesFormAdd({
            generalEnrollment:this.generalEnrollment
        });
        this.listenTo(this.formView,"onFormSubmit",this.onFormSubmit);
        this.listenTo(this.formView,"onFormCancel",this.onFormCancel);
        this.formView.listenTo(this,"cleanup",this.formView.remove);

        // since only one form should be open at a time in the browse
        // page, we will ask to disable all the form-related buttons
        // on our toolbar, while it's open.

        this.$(this.formElement).html(this.formView.render().$el);
        this.toolbarView.setEnabled({});
    },

    ///////////////////////////////////////////////////////////////////////////
    // Remove the formView from our element.
    ///////////////////////////////////////////////////////////////////////////

    closeForm : function() {
        
        this.stopListening(this.formView);
        this.formView.remove();
        this.formView = null;

        // we can now re-enable all the form-related buttons on the toolbar
        this.toolbarView.setEnabled({add:true});
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our 'add' form has successfully been submitted. That means that the
    // model was successfully created on the server and sent back. We will
    // now add it to our listView.
    //
    //  @formName:  The `formName` property of the VBaseWidgetForm-derived view
    //              that was submitted.
    //
    //  @formData:  The data serialized from the form. The structure of this
    //              may change significantly depending on the type of formView
    //              we're working with.
    //
    //  @options:   Any flags that were set along our chain of function calls
    //              that got us here. They will relate directly to the action
    //              of "saving". They may include our own options ("sb...") and
    //              backbone-related options.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) { /* overload (as required) */

        this.listView.trigger("onExternalAdd",formData,options);
        this.closeForm();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The formView has been canceled. Remove it from our element.
    ///////////////////////////////////////////////////////////////////////////

    onFormCancel : function() {
        this.closeForm();
    }

});

//---------------------------------------------------------------------------------------
// View: VSectionClasses
// Description: The 'classes' section.
//---------------------------------------------------------------------------------------

var VSectionClasses = VBaseSection.extend({

    /* overloaded */
    id : "section-classes",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : "classes",

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-classes";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseSection.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We never change the URL here. Sending `null` tells our caller that.
    ///////////////////////////////////////////////////////////////////////////

    setURL : function(settings,options) { /* overloaded */
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // We only have one page here.
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {
        return new VPageClasses(settings,options);
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetClassesFormAdd
// Description: This form is used by the user to create a new enrollment. They select
//              the class they want (or enter a new one) and then pick the year and semesters.
//              All of those fields have the number of users enrolled in that particular
//              class/year/semester combo listed.
//
//              Once they've chosen those three things, we offer suggestions to them
//              in the "class_name", "lecturer_name", and "textbook_url" fields. All of which
//              can be ignored by the user.
//
//              We are working with an EnrollmentModel here. Two events are created:
//              "onFormSave" and "onFormCancel". These are triggered when the form
//              has actually been saved (i.e., model pushed to server), or when the
//              user clicks cancel.
//
//              We are capturing the events of our select2 instances, as when they are
//              changed we need to change the values in some of the other instances.
//              
//---------------------------------------------------------------------------------------

var VWidgetClassesFormAdd = VBaseWidgetFormCreate.extend({

    /* overloaded */
    id : "widget-classes-form-add",
    templateID : "tpl-widget-classes-form-add",
    successAlertText : undefined,
    requestText : "Adding...",
    formName : "add",

    className : function() {
        return _.result(VBaseWidgetFormCreate.prototype,'className') + " widget-classes-form-add";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetFormCreate.prototype,'events'),{
            "change input[name=codes]" : "onChangeCodes",
            "change input[name=year]" : "onChangeYear",
            "change input[name=semester]" : "onChangeSemester"
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is the data type that we will be creating through our form.
    ///////////////////////////////////////////////////////////////////////////

    instantiateModel : function() { /* overloaded */
        var model = new EnrollmentModel();
        return model;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls. We will store some references to our select2 controls
    // and prepare the "codes" control. The other ones will be setup with
    // empty values and be disabled.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // grab references to all of the select2 controls in the form
        
        this.jqoCodes = this.jqoForm.find("input[name=codes]");
        this.jqoYear = this.jqoForm.find("input[name=year]");
        this.jqoSemester = this.jqoForm.find("input[name=semester]");
        this.jqoClassName = this.jqoForm.find("input[name=class_name]");
        this.jqoLecturerName = this.jqoForm.find("input[name=lecturer_name]");
        this.jqoTextbookURL = this.jqoForm.find("input[name=textbook_url]");
        this.jqoCompleted = this.jqoForm.find("input[name=completed]");

        // (1) subject/class codes.
        // the classes that have previously been enrolled in were loaded in `loadData`
        // and can be found in `this.settings.generalEnrollment`. that's a dictionary
        // with each "SUBJECT_CODE CLASS_CODE" as a key. the value is an object
        // which tells us how many users are in the class (in any year/semester).
        // we'll pull out just the codes here for now.

        this.enrolledCodes = [];
        var generalEnrollment = this.settings.generalEnrollment;
        for ( var code in generalEnrollment ) {
            if ( generalEnrollment.hasOwnProperty(code) ) {
                this.enrolledCodes.push(code);
            }
        }

        // create the select2.

        this.ws_codes = new WSelect2({
            elem : this.jqoCodes,
            makeElement : null,
            filterSelection : function(choice) {
                return choice.id.toUpperCase();
            }
        });

        // .text is displayed to user. we are going to use the code string
        // with (#) appended on the end.

        this.ws_codes.init({
            data : _.map(
                this.enrolledCodes,
                function(code){
                    var r = {};
                    r.id = code;
                    r.text = r.id + " (" + generalEnrollment[code].count + ")";
                    return r;
                }
            ),
            preventNew : false,
            placeholder : "e.g., PSYC 101"
        });

        // now, the year and semester select2s are disabled until we have chosen a value for
        // the select2 above them in the form. class_name, lecturer_name, and textbook_url are
        // disabled until we have selected a code, year, and semester.

        // (2) year.

        this.ws_year = new WSelect2({
            elem : this.jqoYear,
            makeElement : null,
            filterSelection : function(choice) {
                return choice.id;
            }
        });

        this.ws_year.init({
            data : [],
            preventNew : true,
            placeholder : "e.g., " + new Date().getFullYear()
        });

        this.ws_year.disable();

        // (3) semester.

        this.ws_semester = new WSelect2({
            elem : this.jqoSemester,
            makeElement : null,
            filterSelection : function(choice) {
                return choice.id;
            }
        });

        this.ws_semester.init({
            data : [],
            preventNew : true,
            placeholder : "e.g., Fall"
        });

        this.ws_semester.disable();

        // (4) class_name.

        this.ws_class_name = new WSelect2({
            elem : this.jqoClassName,
            makeElement : null,
            filterSelection : function(choice) {
                return $.leftovers.parse.simple_name_case(choice.id);
            }
        });

        this.ws_class_name.init({
            data : [],
            preventNew : true,
            placeholder : "e.g., Biological Psychology"
        });

        this.ws_class_name.disable();

        // (5) lecturer_name.

        this.ws_lecturer_name = new WSelect2({
            elem : this.jqoLecturerName,
            makeElement : null,
            filterSelection : function(choice) {
                return $.leftovers.parse.name_case(choice.id);
            }
        });

        this.ws_lecturer_name.init({
            data : [],
            preventNew : true,
            placeholder : "e.g., Victor Frankenstein"
        });

        this.ws_lecturer_name.disable();

        // (6) textbook_url

        this.ws_textbook_url = new WSelect2({
            elem : this.jqoTextbookURL,
            makeElement : null,
            filterSelection : function(choice) {
                choice.id = $.trim(choice.id);
                if ( ( choice.id.indexOf("http://") !== 0 ) && ( choice.id.indexOf("https://") !== 0 ) ) {
                    choice.id = "http://" + choice.id;
                }
                return $.leftovers.parse.cropUrlParms(choice.id);
            }
        });

        this.ws_textbook_url.init({
            data : [],
            preventNew : true,
            placeholder : "e.g., http://amazon.com/Creation-Life-How-Make-It/dp/0674011139/"
        });

        this.ws_textbook_url.disable();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Removing ourself from the DOM.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        // empty references
        
        this.jqoCodes = null;
        this.jqoYear = null;
        this.jqoSemester = null;
        this.jqoClassName = null;
        this.jqoLecturerName = null;
        this.jqoTextbookURL = null;
        this.jqoCompleted = null;

        this.enrolledCodes = null;
        this.ws_codes = null;
        this.ws_year = null;
        this.ws_semester = null;
        this.ws_class_name = null;
        this.ws_lecturer_name = null;
        this.ws_textbook_url = null;

        return VBaseWidgetFormCreate.prototype.remove.call(this);
    },

    /*
        Utility Functions
    */

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the respective values from the first three select2 controls:
    // codes, year, semester.
    ///////////////////////////////////////////////////////////////////////////

    getSelectedCodes : function() {
        
        var sel = this.ws_codes.getSelection();
        if ( sel && sel.length ) {
            sel = sel[0].id.split(" ");
            sel = { subject_code : sel[0], class_code : sel[1], isNew : sel[0].isNew };
        }
        else {
            sel = {};
        }

        return sel;
    },

    getSelectedYear : function() {

        var sel = this.ws_year.getSelection();
        if ( sel && sel.length ) {
            sel = +sel[0].id;
        }
        else {
            sel = null;
        }

        return sel;
    },

    getSelectedSemester : function() {

        var sel = this.ws_semester.getSelection();
        if ( sel && sel.length ) {
            sel = sel[0].id;
            sel = _.find(
                app.store.get("semesters"),
                function(o){
                    return o.name === sel;
                }
            );
        }
        else {
            sel = {};
        }

        return sel;
    },

    /*
        UI Events
    */

    ///////////////////////////////////////////////////////////////////////////
    // User has chosen a subject/class code in the select2. we are now going
    // to enable only the year select2. but first we have to grab the enrollment
    // data for the class code and fill in our options for `year`.
    ///////////////////////////////////////////////////////////////////////////

    onChangeCodes : function(event) {

        // disable everything but `year`.

        this.ws_semester.disable();
        this.ws_class_name.disable();
        this.ws_lecturer_name.disable();
        this.ws_textbook_url.disable();

        if ( !event.added ) {
            this.ws_year.disable();
            return;
        }

        var selectedClass = event.added.id.toUpperCase();

        // now we have to setup the values that will be in the
        // year select2 instance. this is all the years that
        // are available to the user, along with the number
        // of users that are enrolled in this class in that year.

        var yearsAfter = app.store.get("classes.years.after");
        var yearsBefore = app.store.get("classes.years.before");

        var classEnrollment = event.added.isNew ? null : this.settings.generalEnrollment[selectedClass];
        var data = [];

        // go through all of the years that are available to the user.
        // if we have some enrollment information for this class
        // in that year, then we'll add it to the option.

        var currentYear = new Date().getFullYear();
        for ( var year = currentYear+yearsAfter; year >= currentYear-yearsBefore; year-- ) {
            
            var text = year.toString();

            if ( classEnrollment && classEnrollment.years.hasOwnProperty(year) ) {
                text += " (" + (+classEnrollment.years[year].count) + ")";
            }
            else if ( classEnrollment ) {
                text += " (0)";
            }

            // add that as an option for the select2. remember that
            // `text` is shown to user, and `id` is returned.

            data.push({
                id : year.toString(),
                text : text
            });
        }

        // re-init the `year` control. enable it.

        this.ws_year.init({
            data : data,
            preventNew : true,
            placeholder : "e.g., " + currentYear
        });

        this.ws_year.enable();
    },

    ///////////////////////////////////////////////////////////////////////////
    // User has chosen a year from the appropriate select2 control. We can
    // now enable the `semester` control and populate it with enrollment info
    // if there is any for this class/year combo.
    ///////////////////////////////////////////////////////////////////////////

    onChangeYear : function(event) {

        // disable everything below `semester`.

        this.ws_class_name.disable();
        this.ws_lecturer_name.disable();
        this.ws_textbook_url.disable();

        if ( !event.added ) {
            this.ws_semester.disable();
            return;
        }

        // now we have to setup the values to appear in the
        // `semester` control. to do this, we need to know what
        // class code we're working with, as well as the year.

        var year = +event.added.id;
        var classCode = this.getSelectedCodes();
        classCode = classCode.isNew ? null : ( classCode.subject_code + " " + classCode.class_code );

        // we are going to go through the semester names that we've been
        // storing in `app.store`. if there is enrollment information
        // to add to it then we will.

        var data = [];
        var semesters = app.store.get("semesters");
        var semesterEnroll = this.settings.generalEnrollment[classCode];
        semesterEnroll = semesterEnroll ? semesterEnroll.years[year] : null;

        for ( var semester=0; semester < semesters.length; semester++ ) {

            var text = semesters[semester].name + " [" + semesters[semester].description + "]";

            if ( semesterEnroll && semesterEnroll.semesters.hasOwnProperty(semesters[semester].name) ) {
                text += " (" + semesterEnroll.semesters[semesters[semester].name] + ")";
            }
            else if ( semesterEnroll ) {
                text += " (0)";
            }

            // remember that `text` is displayed to the user, and `id` is returned to us.
            data.push({
                id : semesters[semester].name,
                text : text
            });
        }

        // now re-init our semester control, with the data we just generated for it.

        this.ws_semester.init({
            data : data,
            preventNew : true,
            placeholder : "e.g., Fall"
        });

        this.ws_semester.enable();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has chosen a semester. This means that we can now get the
    // suggestions from the server regarding the "class_name", "lecturer_name",
    // and "textbook_url" fields.
    ///////////////////////////////////////////////////////////////////////////

    onChangeSemester : function VWidgetClassesFormAdd__onChangeSemester(event) {

        // disable everything below `semester`.

        this.ws_class_name.disable();
        this.ws_lecturer_name.disable();
        this.ws_textbook_url.disable();

        if ( !event.added ) {
            return;
        }

        // we will have a dictionary with keys of "class_name", "lecturer_name", and "textbook_url". each value is an array
        // of objects, fields are .text and .num_used.
        this.suggestions = null;

        // grab the information from codes and year controls. we have to tell
        // the server what module we are looking up. if the class codes are new, then
        // we won't bother looking up anything. NOTE: we do not want the server
        // to return an error if it can't find the module in question (which is possible
        // if no one has enrolled in the specific year/semester combo). these are just
        // suggestions, and it's possible that someone removed themselves from a year/semester
        // module after the user first visited the page, so no need to crash if they request
        // info for a module that doesn't exist. they just get empty response.

        var codes = this.getSelectedCodes();
        var year = this.getSelectedYear();
        var semester = event.added.id;

        if ( codes.isNew ) {
            this.suggestions = [];
            this.displaySuggestions();
        }

        // they are picking an existing class that others have enrolled in. let's ask the server
        // for the most popular suggestions regarding class_name, lecturer_name, textbook_url.

        else {

            Spinner.get().show({msg:"Loading suggestions...",opacity:0});
            
            var jqXHR = $.ajax({
                url : app.JS_ROOT + "ajax/classes-manual.php/suggestions",
                type : "POST",
                dataType : "json",
                data : JSON.stringify({
                    subject_code : codes.subject_code,
                    class_code : codes.class_code,
                    year : year,
                    semester : semester
                }),
                contentType : "application/json",
                context : this,
                beforeSend : function(jqxhr,options) {
                    jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                },
            })
            .done(function(data,textStatus,jqXHR) {            
                this.suggestions = data;
                data = null;
                this.displaySuggestions();
                Spinner.get().hide();
            })
            .fail(function(jqXHR,textStatus,errorThrown) {
                Spinner.get().hide(function(){
                    app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                });
            });
        }        
    },

    ///////////////////////////////////////////////////////////////////////////
    // We have received some suggestions from the server regarding the
    // final three fields. Of course, those suggestions might be empty (array).
    // Nevertheless, we will re-init and enable our final three select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    displaySuggestions : function() {

        // (1) class_name

        this.ws_class_name.init({
            data : _.map(
                this.suggestions["class_name"],
                function(o){
                    return {
                        id : o.text,
                        text : o.text + " (" + o.num_used + ")"
                    };
                }
            ),
            allowClear : true,
            preventNew : false,
            placeholder : "e.g., Biological Psychology"
        });

        this.ws_class_name.enable();

        // (2) lecturer_name

        this.ws_lecturer_name.init({
            data : _.map(
                this.suggestions["lecturer_name"],
                function(o){
                    return {
                        id : o.text,
                        text : o.text + " (" + o.num_used + ")"
                    };
                }
            ),
            allowClear : true,
            preventNew : false,
            placeholder : "e.g., Victor Frankenstein"
        });

        this.ws_lecturer_name.enable();        

        // (3) textbook_url

        this.ws_textbook_url.init({
            data : _.map(
                this.suggestions["textbook_url"],
                function(o){
                    return {
                        id : o.text,
                        text : o.text + " (" + o.num_used + ")"
                    };
                }
            ),
            allowClear : true,
            preventNew : false,
            placeholder : "e.g., http://amazon.com/Creation-Life-How-Make-It/dp/0674011139/"
        });

        this.ws_textbook_url.enable();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form. note that we have
        // to do the select2 instance separately.

        var attrs = this.jqoForm.serialize_object();

        // (1) codes
        
        var codes = this.getSelectedCodes();
        attrs.subject_code = $.trim(codes.subject_code).toUpperCase();
        attrs.class_code = $.trim(codes.class_code).toUpperCase();

        // (2) year

        attrs.year = +this.getSelectedYear();

        // (3) semester

        attrs.semester = $.trim(this.getSelectedSemester().name);

        // (4) class_name

        attrs.class_name = this.ws_class_name.getSelection();
        attrs.class_name = attrs.class_name.length ? $.leftovers.parse.simple_name_case($.trim(attrs.class_name[0].id)) : null;        

        // (5) lecturer_name

        attrs.lecturer_name = this.ws_lecturer_name.getSelection();
        attrs.lecturer_name = attrs.lecturer_name.length ? $.leftovers.parse.name_case($.trim(attrs.lecturer_name[0].id)) : null;

        // (6) textbook_url

        attrs.textbook_url = this.ws_textbook_url.getSelection();
        if ( attrs.textbook_url.length ) {
            attrs.textbook_url = $.leftovers.parse.cropUrlParms($.trim(attrs.textbook_url[0].id));
            if ( ( attrs.textbook_url.indexOf("http://") !== 0 ) && ( attrs.textbook_url.indexOf("https://") !== 0 ) ) {
                attrs.textbook_url = "http://" + attrs.textbook_url;
            }
        }
        else {
            attrs.textbook_url = null;
        }

        // (7) completed

        attrs.completed = attrs.completed ? 1 : 0;

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to be saved to the server, as there was an error.
    // Display that error now.
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VWidgetClassesFormAdd__onModelError(model,xhr,options) { /* overloaded */
        
        Spinner.get().hide(function(){

            var userError = app.getAjaxUserError(xhr);

            if ( ( xhr.status === 400 ) && ( userError ) && ( userError.type === "enrollment" ) ) {

                bsDialog.create({
                    title : "Error!",
                    msg : "<p>Failed to enroll. Are you already enrolled in that class?</p>",
                    ok : function() {}
                });
            }
            else {
                app.dealWithAjaxFail(xhr,null,null);
            }

        });
    }    

});

//---------------------------------------------------------------------------------------
// View: VWidgetClassesList
// Description: The list widget for the "classes" page.
//---------------------------------------------------------------------------------------

var VWidgetClassesList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-classes-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-classes-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        return new EnrollmentCollection();
    },

    instantiateModel : function() { /* overloaded */
        return new EnrollmentModel();
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Simple factory function. The settings and options have been built up
    // already by our base class. Add anything else we need.
    //
    //      settings:
    //
    //          .model
    //          .listSettings
    //
    //      options:
    //
    //          .listOptions
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateWidgetRecordEditable : function(settings,options) { /* overloaded */
        return new VWidgetClassesRecordEditable(settings,options);
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetClassesRecordEditableDisplay
// Description: One of two possible subViews to a VWidgetClassesRecordEditable. This
//              particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetClassesRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-classes-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-classes-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetClassesRecordEditableEdit
// Description: One of two possible subViews to a VWidgetClassesRecordEditable. This
//              particular view presents a form for editing the model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetClassesRecordEditableEdit = VBaseWidgetRecordEditableEdit.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-classes-record-editable-edit",

    className : function() {
        return _.result(VBaseWidgetRecordEditableEdit.prototype,'className') + " widget-classes-record-editable-edit";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableEdit.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our editing form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls. We also have to ask the server for suggestions for the
    // class_name, lecturer_name, and textbook_url fields.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function VWidgetClassesRecordEditableEdit__prepareForm() { /* overloaded */

        // setup some references.

        this.jqoClassName = this.jqoForm.find("input[name=class_name]");
        this.jqoLecturerName = this.jqoForm.find("input[name=lecturer_name]");
        this.jqoTextbookURL = this.jqoForm.find("input[name=textbook_url]");
        this.jqoCompleted = this.jqoForm.find("input[name=completed]");

        // we will have a dictionary with keys of "class_name", "lecturer_name", and "textbook_url". each value is an array
        // of objects, fields are .text and .num_used.
        this.suggestions = null;

        Spinner.get().show({msg:"Loading suggestions...",opacity:0});
            
        var jqXHR = $.ajax({
            url : app.JS_ROOT + "ajax/classes-manual.php/suggestions",
            type : "POST",
            dataType : "json",
            data : JSON.stringify({
                subject_code : this.settings.recordSettings.model.get("subject_code"),
                class_code : this.settings.recordSettings.model.get("class_code"),
                year : this.settings.recordSettings.model.get("year"),
                semester : this.settings.recordSettings.model.get("semester")
            }),
            contentType : "application/json",
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {
            this.suggestions = data;
            data = null;
            this.displaySuggestions();
            Spinner.get().hide();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We have received some suggestions from the server regarding the
    // final three fields. Of course, those suggestions might be empty (array).
    // Nevertheless, we will re-init and enable our final three select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    displaySuggestions : function() {

        // (1) class_name

        this.ws_class_name = new WSelect2({
            elem : this.jqoClassName,
            makeElement : null,
            filterSelection : function(choice) {
                return $.leftovers.parse.simple_name_case(choice.id);
            }
        });

        this.ws_class_name.init({
            data : _.map(
                this.suggestions["class_name"],
                function(o){
                    return {
                        id : o.text,
                        text : o.text + " (" + o.num_used + ")"
                    };
                }
            ),
            allowClear : true,
            preventNew : false,
            placeholder : "e.g., Biological Psychology"
        });

        var v = this.settings.recordSettings.model.get("class_name");
        if ( v ) {
            this.ws_class_name.setData({id:v,text:v});
        }

        // (2) lecturer_name

        this.ws_lecturer_name = new WSelect2({
            elem : this.jqoLecturerName,
            makeElement : null,
            filterSelection : function(choice) {
                return $.leftovers.parse.name_case(choice.id);
            }
        });

        this.ws_lecturer_name.init({
            data : _.map(
                this.suggestions["lecturer_name"],
                function(o){
                    return {
                        id : o.text,
                        text : o.text + " (" + o.num_used + ")"
                    };
                }
            ),
            allowClear : true,
            preventNew : false,
            placeholder : "e.g., Victor Frankenstein"
        });

        var v = this.settings.recordSettings.model.get("lecturer_name");
        if ( v ) {
            this.ws_lecturer_name.setData({id:v,text:v});
        }

        // (3) textbook_url

        this.ws_textbook_url = new WSelect2({
            elem : this.jqoTextbookURL,
            makeElement : null,
            filterSelection : function(choice) {
                choice.id = $.trim(choice.id);                
                if ( ( choice.id.indexOf("http://") !== 0 ) && ( choice.id.indexOf("https://") !== 0 ) ) {
                    choice.id = "http://" + choice.id;
                }
                return $.leftovers.parse.cropUrlParms(choice.id);
            }
        });

        this.ws_textbook_url.init({
            data : _.map(
                this.suggestions["textbook_url"],
                function(o){
                    return {
                        id : o.text,
                        text : o.text + " (" + o.num_used + ")"
                    };
                }
            ),
            allowClear : true,
            preventNew : false,
            placeholder : "e.g., amazon.com/Creation-Life-How-Make-It/dp/0674011139/"
        });

        var v = this.settings.recordSettings.model.get("textbook_url");
        if ( v ) {
            this.ws_textbook_url.setData({id:v,text:v});
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form. note that we have
        // to do the select2 instance separately.

        var attrs = this.jqoForm.serialize_object();

        // (1) class_name

        attrs.class_name = this.ws_class_name.getSelection();
        attrs.class_name = attrs.class_name.length ? $.leftovers.parse.simple_name_case($.trim(attrs.class_name[0].id)) : null;        

        // (2) lecturer_name

        attrs.lecturer_name = this.ws_lecturer_name.getSelection();
        attrs.lecturer_name = attrs.lecturer_name.length ? $.leftovers.parse.name_case($.trim(attrs.lecturer_name[0].id)) : null;

        // (3) textbook_url

        attrs.textbook_url = this.ws_textbook_url.getSelection();
        if ( attrs.textbook_url.length ) {
            attrs.textbook_url = $.leftovers.parse.cropUrlParms($.trim(attrs.textbook_url[0].id));
            if ( ( attrs.textbook_url.indexOf("http://") !== 0 ) && ( attrs.textbook_url.indexOf("https://") !== 0 ) ) {
                attrs.textbook_url = "http://" + attrs.textbook_url;
            }
        }
        else {
            attrs.textbook_url = null;
        }

        // (4) completed

        attrs.completed = attrs.completed ? 1 : 0;

        return attrs;
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetClassesRecordEditable
// Description: This shows an enrollment record and allows it to be edited.
//              We trigger events here: onRecordSave, onRecordDestroy.
//---------------------------------------------------------------------------------------

var VWidgetClassesRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-classes-record-editable",
    deleteDialogTitle : "Remove Class",
    deleteDialogMsg : "<p>Are you sure you want to remove this class?</p>",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-classes-record-editable" + ( this.model.get("completed") ? " widget-classes-record-editable-completed" : " widget-classes-record-editable-not-completed" );
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },    

    ///////////////////////////////////////////////////////////////////////////
    // As the user might be able to edit/delete models here, we need to update
    // the model's urlRoot variable so we know how to contact the server.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        // no-op.        
    },

    instantiateToolbarView : function() { /* overloaded */
        return new VWidgetClassesRecordEditableToolbar();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Specify the VBaseWidgetRecordEditableDisplay- and
    // VBaseWidgetRecordEditableDisplay-derived views we will use here.
    //
    // The settings and options have already been started by our base view.
    // They will include `recordSettings` (which contains `model`) and 
    // `recordOptions`, respectively. Add whatever we need that's unique here.
    ///////////////////////////////////////////////////////////////////////////    

    instantiateDisplayView : function(settings,options) { /* overloaded */
        return new VWidgetClassesRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return new VWidgetClassesRecordEditableEdit(settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to either be saved or destroyed on the server. Display
    // the error to the user. We only get a `userError` on delete, as they
    // may be trying to delete a class that still has stuff in it. Any errors
    // on saving should have been caught on the client.
    //
    //  @options: All backbone.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VWidgetClassesRecordEditable__onModelError(model,xhr,options) { /* overloaded */

        Spinner.get().hide(function(){

            var userError = app.getAjaxUserError(xhr);

            if ( ( xhr.status === 400 ) && ( userError ) ) {
                
                var count = +userError.msg;
                var type = userError.type + ( count > 1 ? "s" : "" );

                bsDialog.create({
                    title : "Error!",
                    msg : "<p>You cannot remove that class. You still have " + count + " " + type + " for it.</p>",
                    ok : function() {}
                });
            }
            else {
                app.dealWithAjaxFail(xhr,null,null);
            }

        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetClassesRecordEditableToolbar
// Description: The toolbar for a VWidgetClassesRecordEditable.
//---------------------------------------------------------------------------------------

var VWidgetClassesRecordEditableToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-classes-record-editable-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-classes-record-editable-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetClassesToolbar
// Description: The toolbar for the "classes" page.
//---------------------------------------------------------------------------------------

var VWidgetClassesToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-classes-toolbar",
    templateID : "tpl-widget-classes-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-classes-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VBasePageHelp
// Description: Simply deals with our tabs, and sets up a few key vars.
//---------------------------------------------------------------------------------------

var VBasePageHelp = VBasePage.extend({

    /* overload */    
    id : undefined,
    tabActiveName : undefined,

    pageTemplateID : "tpl-page",
    contentTemplateID : "tpl-page-help",
    footerTemplateID : "tpl-page-footer-user",
    contentElement : "div.page-content",
    footerElement : "div.page-footer",

    tabElement : "div.sb-tabs", // not a separate view
    panelElement : "div.content > div.content-panel",
    formElement : "div.content > div.content-form",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally created for `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */
        
        this.panelView = this.instantiatePanel(settings,options);
        this.formView = this.instantiateForm(settings,options);

        if ( this.panelView ) {
            this.panelView.listenTo(this,"cleanup",this.panelView.remove);
        }
        if ( this.formView ) {
            this.formView.listenTo(this,"cleanup",this.formView.remove);
        }

        VBasePage.prototype.initialize.call(this,settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Create the panel and form views used by the page. Defaults to no-ops.
    ///////////////////////////////////////////////////////////////////////////    

    instantiatePanel : function(settings,options) {
        //no-op
        return null;
    },

    instantiateForm : function(settings,options) {
        //no-op
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* overloaded */

        this.stopListening();
        this.panelView = null;
        this.formView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // breadcrumb, toolbar, and list views. Finally, we setup the default buttons
    // that are enabled in our toolbar.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);

        // if `tabActiveName` is defined then we assume we have to identify the
        // active tab.
        
        if ( this.tabActiveName ) {
            
            this.$(this.tabElement).find("ul.hidden-xs li").removeClass("sb-tab-active");
            this.$(this.tabElement).find("ul.hidden-xs li[name="+this.tabActiveName+"]").addClass("sb-tab-active");

            this.$(this.tabElement).find("ul.dropdown-menu li").removeClass("disabled");
            this.$(this.tabElement).find("ul.dropdown-menu li[name="+this.tabActiveName+"]").addClass("disabled");
        }

        // if we have a panelView, and/or formView, output them now.

        if ( this.panelView ) {
            this.$(this.panelElement).html(this.panelView.render().$el);
        }
        if ( this.formView ) {
            this.$(this.formElement).html(this.formView.render().$el);
        }

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our help form has been "saved".
    //
    //  @settings:
    //
    //      .formName:  The `formName` property of the VBaseWidgetForm-derived view
    //                  that was submitted.
    //
    //      .formData:  The data serialized from the form. The structure of this
    //                  may change significantly depending on the type of formView
    //                  we're working with.
    //
    //  @options:   No backbone involvement, just us.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSave : function(settings,options) {
        // no-op.
    }

});

//---------------------------------------------------------------------------------------
// View: VPageHelpClasses
// Description: Main help page.
//---------------------------------------------------------------------------------------

var VPageHelpClasses = VBasePageHelp.extend({

    /* overloaded */
    id : "page-help-classes",
    tabActiveName : "classes",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help-classes";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Create the view(s) for this page.
    ///////////////////////////////////////////////////////////////////////////
    
    instantiatePanel : function(settings,options) { /* overloaded */        
        return new VWidgetHelpClassesPanel({
            templateAttrs:{}
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VPageHelpContact
// Description: The "contact us" page.
//---------------------------------------------------------------------------------------

var VPageHelpContact = VBasePageHelp.extend({

    /* overloaded */
    id : "page-help-general",
    tabActiveName : "contact",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help-contact";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Create the view(s) for this page.
    ///////////////////////////////////////////////////////////////////////////
    
    instantiateForm : function(settings,options) { /* overloaded */        
        return new VWidgetHelpFormContact({
            pageSettings:settings
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VPageHelpFlashcards
// Description: Main help page.
//---------------------------------------------------------------------------------------

var VPageHelpFlashcards = VBasePageHelp.extend({

    /* overloaded */
    id : "page-help-flashcards",
    tabActiveName : "flashcards",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help-flashcards";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Create the view(s) for this page.
    ///////////////////////////////////////////////////////////////////////////
    
    instantiatePanel : function(settings,options) { /* overloaded */        
        return new VWidgetHelpFlashcardsPanel({
            templateAttrs:{}
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VPageHelpGeneral
// Description: Main help page.
//---------------------------------------------------------------------------------------

var VPageHelpGeneral = VBasePageHelp.extend({

    /* overloaded */
    id : "page-help-general",
    tabActiveName : "general",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help-general";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Create the view(s) for this page.
    ///////////////////////////////////////////////////////////////////////////
    
    instantiatePanel : function(settings,options) { /* overloaded */        
        return new VWidgetHelpGeneralPanel({
            templateAttrs:{}
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VPageHelpGroups
// Description: Main help page.
//---------------------------------------------------------------------------------------

var VPageHelpGroups = VBasePageHelp.extend({

    /* overloaded */
    id : "page-help-groups",
    tabActiveName : "groups",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help-groups";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Create the view(s) for this page.
    ///////////////////////////////////////////////////////////////////////////
    
    instantiatePanel : function(settings,options) { /* overloaded */        
        return new VWidgetHelpGroupsPanel({
            templateAttrs:{}
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VPageHelpStudying
// Description: Main help page.
//---------------------------------------------------------------------------------------

var VPageHelpStudying = VBasePageHelp.extend({

    /* overloaded */
    id : "page-help-studying",
    tabActiveName : "studying",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help-studying";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Create the view(s) for this page.
    ///////////////////////////////////////////////////////////////////////////
    
    instantiatePanel : function(settings,options) { /* overloaded */        
        return new VWidgetHelpStudyingPanel({
            templateAttrs:{}
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VPageHelpTests
// Description: Main help page.
//---------------------------------------------------------------------------------------

var VPageHelpTests = VBasePageHelp.extend({

    /* overloaded */
    id : "page-help-tests",
    tabActiveName : "tests",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help-tests";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Create the view(s) for this page.
    ///////////////////////////////////////////////////////////////////////////
    
    instantiatePanel : function(settings,options) { /* overloaded */        
        return new VWidgetHelpTestsPanel({
            templateAttrs:{}
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VSectionHelp
// Description: The 'help' section.
//---------------------------------------------------------------------------------------

var VSectionHelp = VBaseSection.extend({

    /* overloaded */
    id : "section-help",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : "help",

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-help";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseSection.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We never change the URL here. Sending `null` tells our caller that.
    ///////////////////////////////////////////////////////////////////////////

    setURL : function(settings,options) { /* overloaded */
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The page is changing within the section. We have to figure out which
    // page should be displayed, based upon our member var `settings`. Nothing
    // is done here except for actually creating the pageView itself.
    //
    //  @options:   Any flags to be passed along to the page being constructed.
    //              They were created for `setPage`.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {

        var newPageView = null;

        switch ( settings.pageName ) {

            case "general":
                newPageView = new VPageHelpGeneral(settings,options);
                break;

            case "classes":
                newPageView = new VPageHelpClasses(settings,options);
                break;

            case "studying":
                newPageView = new VPageHelpStudying(settings,options);
                break;

            case "groups":
                newPageView = new VPageHelpGroups(settings,options);
                break;

            case "flashcards":
                newPageView = new VPageHelpFlashcards(settings,options);
                break;

            case "tests":
                newPageView = new VPageHelpTests(settings,options);
                break;            

            case "contact":
                newPageView = new VPageHelpContact(settings,options);
                break;            
        }

        return newPageView;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetHelpGeneralPanel
// Description: The panel of information for this page.
//---------------------------------------------------------------------------------------

var VWidgetHelpGeneralPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    id : "widget-help-general-panel",
    templateID : "tpl-widget-help-general-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-help-general-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetHelpClassesPanel
// Description: The panel of information for this page.
//---------------------------------------------------------------------------------------

var VWidgetHelpClassesPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    id : "widget-help-classes-panel",
    templateID : "tpl-widget-help-classes-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-help-classes-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetHelpStudyingPanel
// Description: The panel of information for this page.
//---------------------------------------------------------------------------------------

var VWidgetHelpStudyingPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    id : "widget-help-studying-panel",
    templateID : "tpl-widget-help-studying-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-help-studying-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetHelpGroupsPanel
// Description: The panel of information for this page.
//---------------------------------------------------------------------------------------

var VWidgetHelpGroupsPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    id : "widget-help-groups-panel",
    templateID : "tpl-widget-help-groups-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-help-groups-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetHelpFlashcardsPanel
// Description: The panel of information for this page.
//---------------------------------------------------------------------------------------

var VWidgetHelpFlashcardsPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    id : "widget-help-flashcards-panel",
    templateID : "tpl-widget-help-flashcards-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-help-flashcards-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetHelpTestsPanel
// Description: The panel of information for this page.
//---------------------------------------------------------------------------------------

var VWidgetHelpTestsPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    id : "widget-help-tests-panel",
    templateID : "tpl-widget-help-tests-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-help-tests-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetHelpForm
// Description: Displays the 'contact us' form.
//---------------------------------------------------------------------------------------

var VWidgetHelpFormContact = VBaseWidgetForm.extend({

    /* overload and/or extend */
    id : "widget-help-form-contact",
    templateID : "tpl-widget-help-form-contact",
    formName : "register",
    
    successAlertText : function() {
        return "Your email has been sent. Thank you for the feedback!";
    },

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-help-form-contact";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
        });
    },
    
    ///////////////////////////////////////////////////////////////////////////
    // After the form has been successfully submitted, we will lock everything.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overloaded */

        this.$("textarea").prop("disabled",true);
        this.$("select").prop("disabled",true);
        this.$("button").prop("disabled",true);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Nothing to do here.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */
        //no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields from our select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        var attrs = this.jqoForm.serialize_object();
        
        // trim all the strings
        attrs.subject = $.trim(attrs.subject);
        attrs.message = $.trim(attrs.message);

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the message's text. Then we'll try to send it, and if that
    // is successful, then it's truely been "validated".
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function VWidgetHelpFormContact__validateAttrs(attrs) { /* overloaded */        

        // (1) message. must be more than 10 chars.

        if ( !attrs.message || ( attrs.message.length < 10 ) ) {
            return {
                msg : "<strong>Message</strong>: Please enter a message",
                field : "message"
            };
        }

        // attempt to send the message.

        Spinner.get().show({msg:"Sending message...",opacity:0});

        $.ajax({
            url : app.JS_ROOT+"ajax/manual.php/help/message",
            type : "POST",
            dataType : "json",
            contentType : "application/json",
            data : JSON.stringify(attrs),
            processData : false,
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN",app.store.get("user").token);
            }
        })
        .done(function(data,textStatus,jqXHR) {
            this.onAttrsValid(data);
            Spinner.get().hide();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });

        // we're going to validate the rest on the server. take no action
        // in our base widget.
        return null;
    }

});

//---------------------------------------------------------------------------------------
// View: VPageLogout
// Description: We simply log the user out and say goodbye.
//---------------------------------------------------------------------------------------

var VPageLogout = VBasePage.extend({

    /* overloaded */
    id : "page-logout",
    pageTemplateID : "tpl-page",
    contentTemplateID : "tpl-page-logout",
    footerTemplateID : "tpl-page-footer-welcome",
    contentElement : "div.page-content",
    footerElement : "div.page-footer",

    panelElement : "div.page-content > div.content > div.content-panel",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-logout";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally created for `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */
        
        this.profileView = new VWidgetLogoutPanel({
            templateAttrs:app.store.get("user")
        });
        this.timer = null;

        VBasePage.prototype.initialize.call(this,settings,options);        
    },

    ///////////////////////////////////////////////////////////////////////////
    // Log the user out. When we are finished, we will call `ready` which 
    // prepares us for rendering and eventually triggers the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageLogout__loadData() { /* overloaded */

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Logging out...",opacity:0});

        $.ajax({
            url : app.JS_ROOT+"ajax/account.php/logout",
            type : "POST",
            dataType : "json",
            contentType : "application/json",
            data : JSON.stringify(app.store.get("user")),
            processData : false,
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            }
        })
        .done(function(data,textStatus,jqXHR) {            

            Spinner.get().hide(function(){
                
                this.ready();

                // after ten seconds, we'll go back to the "login" page.
                this.timer = $.timer(function(){
                    this.timer.stop();
                    app.router.navigate("login/",{trigger:true});
                }.bind(this));
                this.timer.set({time:10000,autostart:true});

            }.bind(this));
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){            
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        })
        .always(function(a,textStatus,c){
            // keep the URL as is... we're changing it with our timer
            app.cleanupSession(true);
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        if ( this.timer ) {
            this.timer.stop();        
        }
        this.stopListening(this.profileView);
        this.timer = null;
        this.profileView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // breadcrumb, toolbar, and list views. Finally, we setup the default buttons
    // that are enabled in our toolbar.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);
        this.$(this.panelElement).html(this.profileView.render().$el);

        return this;
    }

});

//---------------------------------------------------------------------------------------
// View: VSectionLogout
// Description: This section deals with logging out only. One page alone.
//---------------------------------------------------------------------------------------

var VSectionLogout = VBaseSection.extend({

    /* overloaded */
    id : "section-logout",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : "logout",

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-logout";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseSection.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We never change the URL here. Sending `null` tells our caller that.
    ///////////////////////////////////////////////////////////////////////////

    setURL : function(settings,options) { /* overloaded */
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // We only have one page here.
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {
        return new VPageLogout(settings,options);
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetLogoutPanel
// Description: Displays a goodbye message for the user.
//---------------------------------------------------------------------------------------

var VWidgetLogoutPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    className : undefined,
    templateID : "tpl-widget-logout-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-logout-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VSectionBrowserfail
// Description: This is a one-off section that is designed to provide the interface expected
//              by the app (i.e., like all other sections) but to work with a single template
//              for its display. So there are no pages here, just the section, which renders
//              a lone template.
//
//              The reason it's like this is because we cannot be assured that $.includejs 
//              will work, so we're left with the minimum functionality possible - i.e., do
//              everything ourselves.
//---------------------------------------------------------------------------------------

var VSectionBrowserfail = Backbone.View.extend({

    // creating new DOM element
    tagName : "div",
    id : "section-page-browserfail",
    className : "section section-page-browserfail",

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // We execute the callback immediately. As we are ready to render from the
    // beginning.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,callback,options) {
        callback(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // We simply render our template. Nothing else to do.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        var templateAttrs = {};
        var html = _.template(
            $("#tpl-section-page-browserfail").html(),
            _.extend({},templateAttrs,{ROOT:app.JS_ROOT})
        );
        this.$el.html(html);

        return this;
    }

});

//---------------------------------------------------------------------------------------
// View: VPageNotfound
// Description: The content of this page is simply a panel widget that displays the 404
//              "page not found" template.
//---------------------------------------------------------------------------------------

var VPageNotfound = VBasePage.extend({

    /* overloaded */
    id : "page-notfound",
    pageTemplateID : "tpl-page",
    contentTemplateID : undefined, // leave undefined to not template this element.
    footerTemplateID : "tpl-page-footer-user",
    contentElement : "div.page-content",
    footerElement : "div.page-footer",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-notfound";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally created for `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */
        
        this.panelView = new VWidgetNotfoundPanel({
            templateAttrs:{}
        });

        VBasePage.prototype.initialize.call(this,settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        this.stopListening(this.panelView);
        this.panelView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // breadcrumb, toolbar, and list views. Finally, we setup the default buttons
    // that are enabled in our toolbar.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);
        this.$(this.contentElement).html(this.panelView.render().$el);

        return this;
    }

});

//---------------------------------------------------------------------------------------
// Section: VSectionNotfound
// Description: We display only one page here.
//---------------------------------------------------------------------------------------

var VSectionNotfound = VBaseSection.extend({

    /* overloaded */
    id : "section-notfound",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : undefined,

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-error";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseSection.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We never change the URL here. Sending `null` tells our caller that.
    ///////////////////////////////////////////////////////////////////////////

    setURL : function(settings,options) { /* overloaded */
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // We have only one page here.
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {        
        return new VPageNotfound(settings,options);
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetNotfoundPanel
// Description: Displays the 404 "page not found" template
//---------------------------------------------------------------------------------------

var VWidgetNotfoundPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    templateID : "tpl-widget-notfound-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-notfound-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View:        VBasePageBrowse2
// Description: This is the base view for a page that enables the user to browse a list
//              of records. The page contains a breadcrumb, toolbar, form, and 
//              "list" of records. Each of these are represented by a subView.
//
//              Several events are captured here: onClickRecord, onClickBreadcrumb,
//              onClickToolbar, and onFormSubmit/onFormCancel - all of which are 
//              generated by their respective subViews.
//
//              When our data has been successfully loaded, an "onPageReady" event is
//              triggered, for any parent who cares, identifying us as being ready to
//              render. If we fail, we trigger "onPageFailed".
//---------------------------------------------------------------------------------------

var VBasePageBrowse = VBasePage.extend({

    /* overload from VBasePage */
    id : undefined,
    pageTemplateID : "tpl-page",
    contentTemplateID : "tpl-page-browse-content",
    footerTemplateID : "tpl-page-footer-user",
    contentElement : "div.page-content",
    footerElement : "div.page-footer",

    /* overload */
    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-browse";
    },
    
    breadcrumbElement : "div.page-content > div.content-breadcrumb",
    toolbarElement : "div.page-content > div.content-toolbar",
    formElement : "div.page-content > div.content-form",
    listElement : "div.page-content > div.content-list",

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally sent to `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        this.breadcrumbView = null;
        this.toolbarView = null;
        this.formView = null;
        this.listView = null;

        // this is useful for if we ever have to grab the current state of the
        // toolbar buttons, in order to temporarily disable some of them, before
        // resetting their state to what it was originally.        
        this.savedToolbarButtonState = null;

        VBasePage.prototype.initialize.call(this,settings,options); // copies over parms.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    //
    // If we want to show a spinner at this point we'll have to do so ourselves.
    //
    //  Note:   The data for the listView must be stored into `this.listData`; and
    //          the data for the breadcrumbView must be stored into 
    //          `this.breadcrumb`.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function() { /* overload */
        // no-op.
        this.ready();
    },

    ///////////////////////////////////////////////////////////////////////////
    // When the `content` element is rendered, using the `content` template,
    // this function provides the attributes hash to be sent to that template.
    ///////////////////////////////////////////////////////////////////////////

    getContentAttributes : function() { /* overload */
        return {
            heading : undefined
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // All of the data has been loaded that the page requires. We will
    // construct our subviews and then trigger an event notifying whoever is
    // listening that we're ready to render. Notice that we do not render
    // the formView here, as that must be called explicitly (since we assume
    // forms are not present by default).
    ///////////////////////////////////////////////////////////////////////////

    ready : function() { /* overloaded */

        this.breadcrumbView = this.instantiateBreadcrumbView();
        if ( this.breadcrumbView ) {

            // this can fail if the information provided in the URL refers to
            // something that doesn't exist in the db (but not based upon access
            // levels) - i.e., a setID that doesn't exist would trigger this.

            if ( !this.breadcrumbView.hasValidCrumbs() ) {
                this.trigger("onPageFailed",this);
                return;
            }

            this.breadcrumbView.listenTo(this,"cleanup",this.breadcrumbView.remove);
            this.listenTo(this.breadcrumbView,"onClickCrumb",this.onClickBreadcrumb);
        }

        this.toolbarView = this.instantiateToolbarView();
        if ( this.toolbarView ) {
            this.toolbarView.listenTo(this,"cleanup",this.toolbarView.remove);
            this.listenTo(this.toolbarView,"onClickToolbar",this.onClickToolbar);
        }
        
        this.listView = this.instantiateListView();        
        this.listView.listenTo(this,"cleanup",this.listView.remove);
        this.listenTo(this.listView,"onClickRecord",this.onClickRecord);

        this.trigger("onPageReady",this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // No-ops. Overload these as required.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() {
        return null;
    },

    instantiateToolbarView : function() {
        return null;
    },

    setDefaultToolbarEnabled : function() {
    },

    ///////////////////////////////////////////////////////////////////////////
    // Cleanup ourselves and all subviews.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* overloaded */

        // empty references
        this.stopListening();
        this.savedToolbarButtonState = null;
        this.breadcrumbView = null;
        this.toolbarView = null;        
        this.listView = null;
        this.formView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // breadcrumb, toolbar, and list views. Finally, we setup the default buttons
    // that are enabled in our toolbar.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);

        if ( this.breadcrumbView ) {
            this.$(this.breadcrumbElement).html(this.breadcrumbView.render().$el);
        }
        if ( this.toolbarView ) {
            this.$(this.toolbarElement).html(this.toolbarView.render().$el);        
            this.setDefaultToolbarEnabled();
        }

        this.$(this.listElement).html(this.listView.render().$el);        

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // We want to refresh the page. Trigger the event for our section to hear
    // and send it the information it needs to refresh us.
    ///////////////////////////////////////////////////////////////////////////

    refresh : function(options) {
        this.trigger(
            "setPage",
            {
                urlIDs : this.settings.urlIDs
            },
            null,
            options
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // One of the formViews we have needs to be opened, giving the user to fill in some
    // information and then submit it back here for processing. The form could
    // be of different types, so the name of the form is sent to us as a parameter.
    // Note that this method is never is never called from here, only in
    // derived-views (e.g., from onClickToolbar).
    //
    //  @formName:  The form to construct.
    //
    //  @settings:  Data object of required values. None dictated here.
    //
    //  @options:   Any flags that might dictate behaviour changes in the form.
    //              They were created specifically for this function.
    //
    ///////////////////////////////////////////////////////////////////////////

    displayForm : function(formName,settings,options) {

        // this should never happen.
        if ( this.formView ) {
            this.stopListening(this.formView);
            this.formView = null;
        }

        this.formView = this.instantiateFormView(formName,settings,options); /* overload */
        this.listenTo(this.formView,"onFormSubmit",this.onFormSubmit);
        this.listenTo(this.formView,"onFormCancel",this.onFormCancel);
        this.formView.listenTo(this,"cleanup",this.formView.remove);

        // since only one form should be open at a time in the browse
        // page, we will ask to disable all the form-related buttons
        // on our toolbar, while it's open.

        this.$(this.formElement).html(this.formView.render().$el);
        this.disableToolbarFormButtons(); /* overload */
    },

    ///////////////////////////////////////////////////////////////////////////
    // Remove the formView from our element.
    ///////////////////////////////////////////////////////////////////////////

    closeForm : function() {
        
        this.stopListening(this.formView);
        this.formView.remove();
        this.formView = null;

        // we can now re-enable all the form-related buttons on the toolbar
        this.reEnableToolbarFormButtons(); /* overload */
    },

    ///////////////////////////////////////////////////////////////////////////
    // The formView that was opened has successfully "submitted" whatever the user
    // entered. Depending on the formView that was instantiated, highlighted
    // by the `formName` param, our actions will differ.
    //
    //  @formName:  The `formName` property of the VBaseWidgetForm-derived view
    //              that was submitted.
    //
    //  @formData:  The data serialized from the form. The structure of this
    //              may change significantly depending on the type of formView
    //              we're working with.
    //
    //  @options:   Any flags that were set along our chain of function calls
    //              that got us here. They will relate directly to the action
    //              of "submitting". They may include our own options ("sb...") and
    //              backbone-related options.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) { /* overload (as required) */

        // by default, just close the form.
        this.closeForm();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The formView has been canceled. Remove it from our element.
    ///////////////////////////////////////////////////////////////////////////

    onFormCancel : function() {
        this.closeForm();
    }

});

//---------------------------------------------------------------------------------------
// View:        VBaseWidgetBrowseFormFilter2
// Description: This view houses a form that is filled out and submitted to create a new
//              filter which is applied to users, types, sets, cards. There is no server communication
//              here, just validation.
//---------------------------------------------------------------------------------------

var VBaseWidgetBrowseFormFilter = VBaseWidgetForm.extend({

    /* overload */
    id : undefined,

    templateID : "tpl-widget-browse-form-filter",
    successAlertText : undefined, // not used
    formName : "filter",

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-browse-form-filter";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Remove all references
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.ws_keywords = null;
        this.ws_tags = null;
        return VBaseWidgetForm.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Setup the select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // (1) build the keywords select2 instance.

        this.ws_keywords = new WSelect2({
            elem : this.jqoForm.find("input[name=keywords]"),
            makeElement : null,
            filterSelection : function(obj) {
                return $.trim(obj.text).toLowerCase();
            }
        });

        this.ws_keywords.init({
            tags : [],
            defaultTags : ( app.store.has("card.filter.keywords") ? app.store.get("card.filter.keywords") : [] ),
            preventNew : false,
            tokenSeparators : [","," "]
        });

        // (2) build the tags select2 instance.

        this.ws_tags = new WSelect2({
            elem : this.jqoForm.find("input[name=tags]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_tags.init({
            tags : _.map(
                app.store.get("card.tags"),
                function(o){
                    return {
                        id : o.id,
                        text : o.tag_text
                    }
                }
            ),
            defaultTags : [],
            preventNew : true
        });

        // if we've previously set some, display them again. we
        // do this through `set`, rather than `defaultTags`, because
        // this preserves the id/text separation on the defaults. if
        // we did `defaultTags` the id/text would be both equal to
        // the string displayed, which is not what we want.

        if ( app.store.has("card.filter.tags") ) {
            this.ws_tags.set(app.store.get("card.filter.tags"));
        }

    },

    ///////////////////////////////////////////////////////////////////////////
    // We never want to do this here, as it's always a sort of editing-style
    // form (values persist until cleared elsewhere).
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields from our select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        var attrs = {};

        // pull out all of the keywords
        attrs.keywords = _.pluck(
            this.ws_keywords.getSelection(),
            'text'
        );
        
        // pull out all the tags. notice that we do not care about
        // their text, we simply grab the id of the tag, as that is
        // how they are stored in the db. they are also sorted
        // alphabetically, by their text (before being reduced to their
        // id).

        attrs.tags = _.map(
            _.sortBy(
                this.ws_tags.getSelection(),
                function(o){
                    return o.text;
                }
            ),
            function(o){
                return o.id;
            }
        );

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the filter information.
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function(attrs) { /* overloaded */

        // (1) keywords - no duplicates

        if ( attrs.keywords && attrs.keywords.length ) {

            var uniqKeywords = _.uniq(attrs.keywords);
            if ( uniqKeywords.length !== attrs.keywords.length ) {
                return {
                    msg : "<strong>Keywords</strong>: No duplicates",
                    field : "keywords"
                };
            }
        }

        // (2) tags - no duplicates

        if ( attrs.tags && attrs.tags.length ) {

            var uniqTags = _.uniq(attrs.tags);
            if ( uniqTags.length !== attrs.tags.length ) {
                return {
                    msg : "<strong>Tags</strong>: No duplicates",
                    field : "tags"
                };
            }
        }

        // return nothing on success
    }
});

//---------------------------------------------------------------------------------------
// View:        VSectionStudyingBrowse
// Description: This is the section, or parent, view for the entire "Studying" section, which
//              includes browsing classes, groups, users, sets, cards, and tests.
//---------------------------------------------------------------------------------------

var VSectionStudyingBrowse = VBaseSection.extend({

    /* overloaded */
    id : "section-studying",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : "studying",

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-studying";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseSection.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The page is changing within the section. We have to construct a URL
    // based upon the `settings` given. Note that the URL constructed is simply
    // copied into the address bar, there is no routing involved.
    //
    //  @options:   Any flags that are going to be passed along to the page
    //              construction. They was created for `setPage`.
    //
    //  @return
    //
    //      If `null` is sent back, that means that we don't have to
    //      change the URL at all. `false` is returned for an error (404), and
    //      a string is returned on success.
    //
    ///////////////////////////////////////////////////////////////////////////

    setURL : function(settings,options) { /* overloaded */

        // base of:
        // #studying/browse/moduleID/groupID/userID/cards/setID/ [OR]
        // #studying/browse/moduleID/groupID/userID/tests/
        var url = "studying/browse/";

        // we may have been given a number of urlIDs, most of which must
        // be integers, but some will be strings of particular values. go
        // through all of our urlIDs and ensure that they are valid. notice
        // that we needn't receive any urlIDs at all either.

        var urlIDs = settings.urlIDs;

        for ( id in urlIDs ) {
            if ( $.gettype(urlIDs[id]).base !== "undefined" ) {

                // the two urlIDs that we might expect strings on are the 'type' and
                // the 'group'.

                // the 'type' MUST be a string, of a particular value.
                if ( id === "tID" ) {
                    if ( ( urlIDs[id] !== "cards" ) && ( urlIDs[id] !== "tests" ) ) {
                        return false;
                    }
                    else {
                        continue;
                    }
                }

                // the group can be a string or an integer.
                else if ( id === "gID" ) {
                    if ( ( urlIDs[id] === "self" ) || ( urlIDs[id] === "pub" ) ) {
                        continue;
                    }
                }

                urlIDs[id] = +urlIDs[id];
                if ( $.gettype(urlIDs[id]).base !== "number" ) {
                    return false;
                }
            }
        }        

        // now ensure that we weren't sent an incorrect number of ids. for ex.,
        // we can't have a uID without having an gID too.

        if (
                ( !urlIDs.mID && urlIDs.gID ) ||
                ( !urlIDs.gID && urlIDs.uID ) ||
                ( !urlIDs.uID && urlIDs.tID ) ||
                ( !urlIDs.tID && urlIDs.sID ) ||
                ( ( urlIDs.tID === "tests" ) && ( urlIDs.sID ) )
            )
        {
            return false;
        }

        // we'll do a quick check to see if someone has sent a url that
        // says "self" (i.e., their content) but without a userID. if that's
        // the case, we'll just set the userID ourselves now.

        if ( ( urlIDs.gID === "self" ) && ( urlIDs.uID !== app.store.get("user").id ) ) {
            urlIDs.uID = app.store.get("user").id;
        }

        // finally, construct the url.

        url += ( urlIDs.mID ? "m"+urlIDs.mID + "/" : "" );
        url += ( urlIDs.gID ? "g"+urlIDs.gID + "/" : "" );        
        url += ( urlIDs.uID ? "u"+urlIDs.uID + "/" : "" );
        url += ( urlIDs.tID ? urlIDs.tID + "/" : "" );
        url += ( urlIDs.sID ? "s"+urlIDs.sID + "/" : "" );

        return url;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The page is changing within the section. We have to figure out which
    // page should be displayed, based upon the member var `settings`. Nothing
    // is done here except for actually creating the pageView itself.
    //
    //  @options:   Any flags to be passed along to the page being constructed.
    //              They were created for `setPage`.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {

        // work our way backwards through the urlIDs that we have. the most specific
        // one we have dictates the type of page that will be displayed.

        var urlIDs = settings.urlIDs;
        var newPageView = null;

        // cards for a set for a user in a group in a class
        if ( urlIDs.sID ) {
            newPageView = new VPageStudyingBrowseCards(settings,options);
        }

        // sets or tests for a user in a group in a class
        else if ( urlIDs.tID ) {            
            if ( urlIDs.tID === "cards" ) {
                newPageView = new VPageStudyingBrowseSets(settings,options);
            }
            else if ( urlIDs.tID === "tests" ) {
                newPageView = new VPageStudyingBrowseTests(settings,options);
            }
        }

        // types of content for a user in a group in a class
        else if ( urlIDs.uID ) {            
            newPageView = new VPageStudyingBrowseTypes(settings,options);
        }

        // users in a group
        else if ( urlIDs.gID ) {
            newPageView = new VPageStudyingBrowseUsers(settings,options);
        }

        // groups in a class
        else if ( urlIDs.mID ) {
            newPageView = new VPageStudyingBrowseGroups(settings,options);
        }

        // modules that the LIU is enrolled in
        else {
            newPageView = new VPageStudyingBrowseModules(settings,options);
        }

        return newPageView;
    }

});

//---------------------------------------------------------------------------------------
// View:        VPageStudyingBrowseModules
// Description: This view represents the page where the user is able to browse all of the
//              modules that they are currently enrolled in. The page contains a
//              toolbar, and list of records; each represented by a subview.
//
//              Several events are captured here: onClickToolbar, and
//              onClickRecord. These are triggered by their respective subviews. When
//              our data has been loaded, we trigger an "onPageReady" event, letting
//              our parent know that we are ready to render.
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseModules = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-modules",
    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-studying-browse-modules";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePageBrowse.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty all our references
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.listData = null;
        return VBasePageBrowse.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Update the help link in the footer.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePageBrowse.prototype.render.call(this);

        var href = this.$("div.sb-footer div.help a").prop("href");
        this.$("div.sb-footer div.help a").prop("href",href+"classes/");

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageStudyingBrowseModules__loadData() { /* overloaded */

        // we will be storing an array of enrollment records
        this.listData = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading classes...",opacity:0});
        
        // ask the server for a list of all of the enrollments for the
        // logged in user.

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/studying-other.php/enrollment",
            type : "POST",
            dataType : "json",
            data : JSON.stringify({
                includeCompleted:app.store.has("modules.show_completed")
            }),
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            this.listData = data.enrollment;
            this.ready();            
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // When the `content` element is rendered, using the `content` template,
    // this function provides the attributes hash to be sent to that template.
    ///////////////////////////////////////////////////////////////////////////

    getContentAttributes : function() { /* overloaded */
        return {
            heading : "Pick a Class"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the toolbar, and list views for this particular
    // page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseModulesToolbar();
    },

    instantiateListView : function() { /* overloaded */
        return new VWidgetStudyingBrowseModulesList({
            listData : this.listData
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, when this view is shown, there may be some toolbar buttons
    // that are immediately available.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() {
        this.toolbarView.setEnabled({display:true});

        // set the text of "show/hide completed"

        var showCompleted = app.store.has("modules.show_completed");
        this.toolbarView.getButton("display_completed").html(showCompleted?"Hide Completed":"Show Completed");
    },

    /*
        Trigger events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, as well as the event that started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,button,event) {

        // DISPLAY

        if ( buttonName.indexOf("display") !== -1 ) {

            // SHOW COMPLETED (toggle)

            if ( buttonName === "display_completed" ) {

                var isShowing = app.store.has("modules.show_completed");
                if ( isShowing ) {
                    app.store.rem("modules.show_completed");
                }
                else {
                    app.store.set("modules.show_completed",true);
                }
                app.saveUserSettings();
                this.refresh();
            }
        }

    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the modules in our list. We are going
    // to trigger a page change, sending along the urlIDs that represent our
    // new position in the browsing hierarchy.
    ///////////////////////////////////////////////////////////////////////////

    onClickRecord : function(modelAttributes) {
        this.trigger("setPage",{
            urlIDs : _.extend({},this.settings.urlIDs,{
                mID:modelAttributes.module_id
            }),
            containerAttributes : modelAttributes
        });
    }    

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseModulesList
// Description: The list widget for the "browse modules" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseModulesList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-studying-browse-modules-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-studying-browse-modules-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        return new EnrollmentCollection();
    },

    instantiateModel : function() { /* overloaded */
        return new EnrollmentModel();
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Simple factory function. The settings and options have been built up
    // already by our base class. Add anything else we need.
    //
    //      settings:
    //
    //          .model
    //          .listSettings
    //
    //      options:
    //
    //          .listOptions
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateWidgetRecordEditable : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseModulesRecordEditable(settings,options);
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseModulesRecordEditableDisplay
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseModulesRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-studying-browse-modules-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-studying-browse-modules-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseModulesRecordEditable
// Description: This widget simply displays the record's attributes. Editing is not allowed.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseModulesRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-studying-browse-modules-record-editable",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-studying-browse-modules-record-editable";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We do not allow the user to edit/delete models here.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our toolbar is empty for this record, as we cannot manipulate it in
    // any way, except for clicking on it.
    ///////////////////////////////////////////////////////////////////////////

    instantiateToolbarView : function() { /* overloaded */
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Specify the VBaseWidgetRecordEditableDisplay- and
    // VBaseWidgetRecordEditableDisplay-derived views we will use here.
    //
    // The settings and options have already been started by our base view.
    // They will include `recordSettings` (which contains `model`) and 
    // `recordOptions`, respectively. Add whatever we need that's unique here.
    ///////////////////////////////////////////////////////////////////////////    

    instantiateDisplayView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseModulesRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return null;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseModulesToolbar
// Description: The toolbar for the "browse modules" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseModulesToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-modules-toolbar",
    templateID : "tpl-widget-studying-browse-modules-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-modules-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View:        VPageStudyingBrowseGroups
// Description: This view represents the page where the user is able to browse all of the
//              study groups that they belong to for a particular enrollment of theirs.
//              This includes: personal content, the public studygroup, and all private
//              studygroups that they have joined.
//
//              This page contains breadcrumb, toolbar, form, and list views.
//
//              Several events are captured here: onClickBreadcrumb, onClickToolbar, 
//              onClickRecord, onFormSubmit/onFormCancel.
//
//              The forms available here are "code"
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseGroups = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-groups",

    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-studying-browse-groups";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePageBrowse.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty all our references
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.listData = null;
        this.breadcrumb = null;
        return VBasePageBrowse.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Update the help link in the footer.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePageBrowse.prototype.render.call(this);

        var href = this.$("div.sb-footer div.help a").prop("href");
        this.$("div.sb-footer div.help a").prop("href",href+"studygroups/");

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageStudyingBrowseGroups__loadData() { /* overloaded */

        // we will be storing an array of groups as well as a breadcrumb
        this.listData = null;
        this.breadcrumb = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading groups...",opacity:0});

        // ask the server for a list of all of the private studygroups that
        // our user has joined.

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/groups-manual.php/fetch/"+this.settings.urlIDs.mID,
            type : "POST",            
            dataType : "json",
            data : JSON.stringify({
                code : app.store.has("groups.code") ? app.store.get("groups.code") : null
            }),
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            // construct the personal studygroup manually

            var gPersonalContent = {
                id:"self",
                num_members : 1,
                is_user_member : true,
                is_user_owner : true
            };
            
            this.listData = [gPersonalContent].concat(data.groups);
            this.breadcrumb = data.breadcrumb;
            this.ready();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {

            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // When the `content` element is rendered, using the `content` template,
    // this function provides the attributes hash to be sent to that template.
    ///////////////////////////////////////////////////////////////////////////

    getContentAttributes : function() { /* overloaded */
        return {
            heading : "Groups"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the breadcrumb, toolbar, and list views for this particular
    // page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() { /* overloaded */
        return new VWidgetStudyingBrowseGroupsBreadcrumb({
            data:this.breadcrumb
        });
    },

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseGroupsToolbar();
    },

    instantiateListView : function() { /* overloaded */
        return new VWidgetStudyingBrowseGroupsList(
            {
                listData:this.listData,
                urlIDs:this.settings.urlIDs
            },
            {}
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // `VBasePageBrowse.displayForm` has been called. We must instantiate a
    // given formView, based upon the `formName` sent.
    //
    //  @settings. Required values. Created for `displayForm`.
    //  @options. Any flags that might be useful. Created for `displayForm`.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateFormView : function(formName,settings,options) { /* overloaded */

        var formView = null;

        switch ( formName ) {

            case "code" :
                formView = new VWidgetStudyingBrowseGroupsFormCode(settings,options);
                break;
        }

        return formView;
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, when this view is shown, there may be some toolbar buttons
    // that are immediately available.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() {

        this.toolbarView.setEnabled({
            code:true,
            add:true
        });

        // code provided?

        var code = app.store.get("groups.code");

        if ( code ) {
            this.toolbarView.getButton("code").removeClass("btn-default").addClass("btn-info");
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // A form has been opened on the page. So we will temporarily disable all
    // of the buttons on the toolbar that allow another form to be opened, as
    // there is only one allowed to be shown at a time.
    ///////////////////////////////////////////////////////////////////////////

    disableToolbarFormButtons : function() { /* overloaded */

        this.savedToolbarButtonState = this.toolbarView.getEnabled();
        this.toolbarView.setEnabled({
            code:false,
            add:false
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The form that was displaying is now gone. Reset our toolbar buttons
    // to how they were before it was opened.
    ///////////////////////////////////////////////////////////////////////////

    reEnableToolbarFormButtons : function() { /* overloaded */
        this.toolbarView.setEnabled(this.savedToolbarButtonState);
        this.savedToolbarButtonState = null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked one of the crumbs in our breadcrumb. All of the
    // information we require can be found in the `crumb` object passed to us.
    // In particular, we want the `urlIDs` inside it, as they will tell us what
    // position in the browsing hierarchy we should go to after clicking this
    // crumb.
    //
    //  @crumb: the data object from the VBaseBreadcrumbCrumb view. contains
    //          `.urlIDs`.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickBreadcrumb : function(crumb) {
        this.trigger("setPage",{
            urlIDs : crumb.urlIDs
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the groups in our list. We are going
    // to trigger a page change, sending along the urlIDs that represent our
    // new position in the browsing hierarchy.
    //
    //  @modelAttributes:   Cloned attributes hash for the model whose view
    //                      was clicked on by the user in the listView.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickRecord : function(modelAttributes) {

        var urlIDs = _.extend({},this.settings.urlIDs,{
            gID:modelAttributes.id
        });

        // now, if we are going to our own content (i.e., group="self") then
        // we can set the gID *and* the uID right now.

        if ( urlIDs.gID === "self" ) {
            urlIDs.uID = app.store.get("user").id;
        }

        this.trigger("setPage",{
            urlIDs:urlIDs,
            containerAttributes:modelAttributes
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, as well as the event that started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function VPageStudyingBrowseGroups__onClickToolbar(buttonName,button,event) {

        // SET SEARCH CODE

        if ( buttonName === "code" ) {
            this.displayForm("code");
        }

        // CREATE NEW GROUP

        else if ( buttonName === "add" ) {

            bsDialog.create({                    
                title : "Create Studygroup",
                msg : "<p>Do you want to create a private studygroup for this class?</p>",
                ok : function() {

                    $.ajax({
                        url : app.JS_ROOT + "ajax/studying/groups-manual.php/create/"+this.settings.urlIDs.mID,
                        type : "POST",            
                        dataType : "json",
                        data : JSON.stringify({
                            code : $.leftovers.parse.generate_random_string(6,false,true,true)
                        }),
                        contentType : "application/json",
                        context : this,
                        beforeSend : function(jqxhr,options) {
                            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                        },
                    })
                    .done(function(data,textStatus,jqXHR) {
                        this.listView.trigger("onExternalAdd",data,{});                            
                    })
                    .fail(function(jqXHR,textStatus,errorThrown) {

                        Spinner.get().hide(function(){
                        
                            var userError = app.getAjaxUserError(jqXHR);
                            if ( ( jqXHR.status === 400 ) && ( userError ) && ( userError.type === "owner" ) ) {

                                bsDialog.create({
                                    title : "Error!",
                                    msg : "<p>You are already the owner of a studygroup for this class. To create another one you'll have to leave that group first.</p>",
                                    ok : function() {}
                                });
                            }
                            else {
                                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                            }
                        });
                    });

                }.bind(this),
                cancel : function() {}
            });
        }            
    },

    ///////////////////////////////////////////////////////////////////////////
    // The formView that was opened has successfully "submitted" whatever the user
    // entered. Depending on the formView that was instantiated, highlighted
    // by the `formName` param, our actions will differ.
    //
    //  @formName:  The `formName` property of the VBaseWidgetForm-derived view
    //              that was submitted.
    //
    //  @formData:  The data serialized from the form. The structure of this
    //              may change significantly depending on the type of formView
    //              we're working with.
    //
    //  @options:   Any flags that were set along our chain of function calls
    //              that got us here. They will relate directly to the action
    //              of "submitting". They may include our own options ("sb...") and
    //              backbone-related options.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) { /* overloaded */

        switch ( formName ) {

            // setting a new search code.
            case "code":

                // refresh the page, with the new search code.

                var hadCode = app.store.has("groups.code");
                app.store.rem("groups.code");

                if ( formData.code.length ) {

                    // set the code information in our store and refresh
                    // the page. the code information will be checked by
                    // the `setDefaultToolbarEnabled` method and the
                    // code button will be highlighted.
                    
                    app.store.set("groups.code",formData.code);
                    this.refresh();
                }

                // no code
                else {

                    // clearing what we had before.
                    if ( hadCode ) {
                        this.refresh();
                    }
                    // nothing to do.
                    else {
                        this.closeForm();
                    }
                }
                
                break;
        }
    }    

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseGroupsBreadcrumb
// Description: We inherit everything from VBaseWidgetBreadcrumb.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsBreadcrumb = VBaseWidgetBreadcrumb.extend({

    /* overloaded */
    id : "widget-studying-browse-groups-breadcrumb",
    templateID : "tpl-widget-studying-browse-groups-breadcrumb",

    className : function() {
        return _.result(VBaseWidgetBreadcrumb.prototype,'className') + " breadcrumb widget-studying-browse-groups-breadcrumb";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBreadcrumb.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Given an array of objects, each representing enough information to
    // build a single crumb, we will construct an ordered array of objects that
    // each contain the following fields: .display, .href, .data.
    //
    //  @data:    
    //
    //      array of objects. will have a `crumbName` field to tell
    //      us what information is in a particular object.
    //
    //  @return:
    //
    //      An ordered array of objects, containing the fields mentioned above.
    //      Return `null` for failure.
    //          
    ///////////////////////////////////////////////////////////////////////////

    generateCrumbs : function(data) { /* overloaded */

        // we are constructing only a single crumb here, containing the
        // class code/semester/year.

        var crumbInfo = null; // from sent data
        var breadcrumb = []; // returned ary
        var crumb = {}; // goes into ary

        // moduleID

        crumbInfo = _.find(data,function(o){
            return o.crumbName === "moduleID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        
        crumb.crumbDisplay = crumbInfo.subject_code + " " + crumbInfo.class_code + " (" + crumbInfo.semester_name + ", " + crumbInfo.year + ")";
        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/";
        crumb.crumbData = {urlIDs:{}};

        breadcrumb.push(crumb);
        return breadcrumb;
    }

});

//---------------------------------------------------------------------------------------
// View:        VWidgetStudyingBrowseGroupsFormCode
// Description: This form is to set a secret code to use when searching for studygroups.
//              There is no server communication here, just validation.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsFormCode = VBaseWidgetForm.extend({

    /* overloaded */
    id : "widget-studying-browse-groups-form-code",
    templateID : "tpl-widget-studying-browse-groups-form-code",
    successAlertText : undefined, // not used
    formName : "code",

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-studying-browse-groups-form-code";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
            "click button[name=button_clear]" : "onClickClear",
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // If we don't currently have a search code set, then we'll clear the
    // "clear" button.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() {
        if ( !app.store.has("groups.code") ) {
            this.jqoForm.find("button[name=button_clear]").prop("disabled",true);
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty out the code field and save the form.
    ///////////////////////////////////////////////////////////////////////////

    onClickClear : function(event) {
        this.jqoForm.find("input[name=code]").val("");
        this.onClickSave(null);
    },

    ///////////////////////////////////////////////////////////////////////////
    // If we require some attributes to be present on the form upon display
    // then this function should return them. We provide the current code
    // or empty if none yet.
    ///////////////////////////////////////////////////////////////////////////

    getDefaultAttrsForTemplate : function() { /* overloaded */
        return {
            code : app.store.get("groups.code")
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields from our select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        var attrs = {};
        attrs = this.jqoForm.serialize_object();

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the code information. We'll let anything through.
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function(attrs) { /* overloaded */
        // return nothing on success
    }
});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseGroupsList
// Description: The list widget for the "browse groups" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-studying-browse-groups-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-studying-browse-groups-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        return new GroupsCollection();
    },

    instantiateModel : function() { /* overloaded */
        return new GroupModel();
    },

    ///////////////////////////////////////////////////////////////////////////
    // We have extra events being generated by our recordView that we will listen
    // for here.
    ///////////////////////////////////////////////////////////////////////////

    onAddCollection : function(model,collection,options) { /* extended */
        var view = VBaseWidgetList.prototype.onAddCollection.call(this,model,collection,options);
        this.listenTo(view,"onRecordJoin",this.onRecordJoin);
        this.listenTo(view,"onRecordLeave",this.onRecordLeave);
    },

    /*
        Triggered Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The LIU is joining a group.
    ///////////////////////////////////////////////////////////////////////////

    onRecordJoin : function VWidgetStudyingBrowseGroupsList__onRecordJoin(recordView) {

        Spinner.get().show({msg:"Joining group...",opacity:0});
        $.ajax({
            url : app.JS_ROOT + "ajax/studying/groups-manual.php/join/"+this.settings.urlIDs.mID + "/" + recordView.model.get("id"),
            type : "POST",            
            dataType : "json",
            data : JSON.stringify({
                code : app.store.has("groups.code") ? app.store.get("groups.code") : null
            }),
            contentType : "application/json",
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            // update the information in the group, which gets it re-rendered
            recordView.model.set({
                num_members:recordView.model.get("num_members")+1,
                is_user_member:true
            });
            this.collection.sort({sbTargetModel:recordView.model,sbPrevIdx:-1});
            Spinner.get().hide();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {

            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });

    },

    ///////////////////////////////////////////////////////////////////////////
    // The LIU is leaving a group.
    ///////////////////////////////////////////////////////////////////////////

    onRecordLeave : function VWidgetStudyingBrowseGroupsList__onRecordLeave(recordView) {

        this.clearSelected();
        recordView.makeSelected();

        // all we do is verify that they want to do what they say they do, and then
        // we trigger the relevant event, for our parent listView.

        bsDialog.create({
            title : "Leave Group",
            msg : "<p>Are you sure you want to leave this group?</p>",
            ok : function() {

                // we will remove the record from the list if there are no more members or
                // if there are but the user has not entered the search code for the group.
                // if the record is going to remain, then we have to re-insert it into the
                // list as its num_members has changed and its owner information might
                // also have changed.

                Spinner.get().show({msg:"Leaving group...",opacity:0});
                $.ajax({
                    url : app.JS_ROOT + "ajax/studying/groups-manual.php/leave/"+this.settings.urlIDs.mID + "/" + recordView.model.get("id"),
                    type : "POST",            
                    dataType : "json",
                    data : JSON.stringify({
                        code : recordView.model.get("code")
                    }),
                    contentType : "application/json",
                    context : this,
                    beforeSend : function(jqxhr,options) {
                        jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                    },
                })
                .done(function(data,textStatus,jqXHR) {

                    // if `data` is null, the group is gone completely. otherwise, let's see if
                    // the code matches what the user has entered. if it does, then we'll keep
                    // it in the list, and re-sort just in case it needs to go somewhere else.

                    if ( ( !data ) || ( data.code !== app.store.get("groups.code") ) ) {
                        this.collection.remove(recordView.model);
                    }
                    else {
                        this.collection.sort({sbTargetModel:recordView.model,sbPrevIdx:-1});
                        recordView.removeSelected();
                    }

                    Spinner.get().hide();
                })
                .fail(function(jqXHR,textStatus,errorThrown) {

                    Spinner.get().hide(function(){
                        app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                    });
                });
                
            }.bind(this),
            cancel : function() {
                recordView.removeSelected();
            }.bind(this)
        });        

    },

    ///////////////////////////////////////////////////////////////////////////
    // Simple factory function. The settings and options have been built up
    // already by our base class. Add anything else we need.
    //
    //      settings:
    //
    //          .model
    //          .listSettings
    //
    //      options:
    //
    //          .listOptions
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateWidgetRecordEditable : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseGroupsRecordEditable(settings,options);
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseGroupsRecordEditableDisplay
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-studying-browse-groups-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-studying-browse-groups-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseGroupsRecordEditableEdit
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view presents a form for editing the model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsRecordEditableEdit = VBaseWidgetRecordEditableEdit.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-studying-browse-groups-record-editable-edit",

    className : function() {
        return _.result(VBaseWidgetRecordEditableEdit.prototype,'className') + " widget-studying-browse-groups-record-editable-edit";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableEdit.prototype,'events'),{
            "click button[name=button_generate]" : "onClickGenerate",
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Removing ourself from the DOM. Empty all references.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        this.ws_sharing = null;
        return VBaseWidgetRecordEditableEdit.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form. this will
    //      be used with `model.save` to try to update the model.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */        

        var attrs = this.jqoForm.serialize_object();

        // we have to grab the disabled control values manually.
        attrs.code = this.jqoForm.find("input[name=code]").val();

        return attrs;
    },

    /*
        UI events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on the "Generate New Code" button. We'll simply
    // generate a random string and place it in the text input control
    // (which is disabled).
    ///////////////////////////////////////////////////////////////////////////

    onClickGenerate : function(event) {

        var newCode = $.leftovers.parse.generate_random_string(6,false,true,true);
        this.jqoForm.find("input[name=code]").val(newCode);
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseGroupsRecordEditable
// Description: This widget simply displays the record's attributes. Editing is not allowed.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-studying-browse-groups-record-editable",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-groups-studying-groups-record-editable";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // As the user might be able to edit/delete models here, we need to update
    // the model's urlRoot variable so we know how to contact the server.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        this.settings.model.urlRoot = this.settings.model.baseUrlRoot + "/" + this.settings.listSettings.urlIDs.mID;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Based upon our current state, and the particular user that's looking,
    // we will figure out which toolbar buttons are enabled.
    ///////////////////////////////////////////////////////////////////////////

    setToolbarButtonsEnabled : function() { /* overloaded and extended */

        VBaseWidgetRecordEditable.prototype.setToolbarButtonsEnabled.call(this);

        // if we aren't editing, and this isn't a public studygroup, then whether or
        // not we can use certain buttons will depend on our relationship to the group

        if ( ( !this.isEditing ) && ( this.settings.model.get("id") === +this.settings.model.get("id") ) ) {
            this.toolbarView.setEnabled({
                edit : this.settings.model.get("owner_id") === app.store.get("user").id,
                join : !this.settings.model.get("is_user_member"),
                leave : this.settings.model.get("is_user_member"),
                members : true
            });
        }

        // otherwise, everything is disabled except 'members', if it's not our own stuff.
        else {
            this.toolbarView.setEnabled({
                members : ( this.settings.model.get("id") !== "self" )
            });
        }
    },

    instantiateToolbarView : function() { /* overloaded */
        return new VWidgetStudyingBrowseGroupsRecordEditableToolbar();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Specify the VBaseWidgetRecordEditableDisplay- and
    // VBaseWidgetRecordEditableDisplay-derived views we will use here.
    //
    // The settings and options have already been started by our base view.
    // They will include `recordSettings` (which contains `model`) and 
    // `recordOptions`, respectively. Add whatever we need that's unique here.
    ///////////////////////////////////////////////////////////////////////////    

    instantiateDisplayView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseGroupsRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseGroupsRecordEditableEdit(settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // One of the toolbar buttons that is associated directly with this record
    // has been clicked. The base view deals with some of the buttons, and we
    // deal with the leftovers.
    //
    //  @buttonName - the `name` field from the HTML of the buttton.
    //  @event - raw 'click' event data.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,button,event) { /* overloaded and extend */

        // our base view will deal with `edit`; we will deal with the unique ones
        // here.

        VBaseWidgetRecordEditable.prototype.onClickToolbar.call(this,buttonName,event);

        // JOIN

        if ( buttonName === "join" ) {            
            this.trigger("onRecordJoin",this);
        }

        // LEAVE

        else if ( buttonName === "leave" ) {
            this.trigger("onRecordLeave",this);
        }

        // MEMBERS

        else if ( buttonName === "members" ) {

            // fixme: this should be a template.
            var html = "<ul class='list-group'>";
            var members = this.settings.model.get("members");
            for ( var x=0; x < members.length; x++ ) {
                html += "<li class='list-group-item'>" + members[x].full_name + "</li>";
            }
            html += "</ul>";

            bsDialog.create({                    
                title : "Group Members",
                msg : html,
                ok : function() {}
            });
        }
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseGroupsRecordEditableToolbar
// Description: The toolbar for a VWidgetStudyingBrowseGroupsRecordEditable.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsRecordEditableToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-studying-browse-groups-record-editable-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-groups-record-editable-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseGroupsToolbar
// Description: The toolbar for the "browse groups" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-groups-toolbar",
    templateID : "tpl-widget-studying-browse-groups-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-groups-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VPageStudyingBrowseUsers
// Description: This view represents the page where the user is able to browse all of the
//              users that are enrolled in a given module. The page contains a
//              breadcrumb, toolbar, and list of records; each represented by a subview.
//              The formView portion of VBasePageBrowse is used only for filtering, as
//              there is no editing/adding of any kind performed.
//
//              Several events are captured here: onClickBreadcrumb, onClickToolbar, 
//              onClickRecord, and onFormSubmit/onFormCancel. These are triggered by their
//              respective subviews. When our data has been loaded, we trigger an 
//              "onPageReady" event, letting our parent know that we are ready to render.
//
//              The forms available here are "filter".
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseUsers = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-users",
    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-studying-browse-users";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePageBrowse.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty all our references
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.listData = null;
        this.breadcrumb = null;
        return VBasePageBrowse.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageStudyingBrowseUsers__loadData() { /* overloaded */

        // we will be storing an array of users, as well as a breadcrumb
        this.listData = null;
        this.breadcrumb = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading users...",opacity:0});

        // ask the server for a list of all of the students enrolled
        // in our given class.

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/studying-other.php/users/"+this.settings.urlIDs.mID+"/"+this.settings.urlIDs.gID,
            type : "POST",            
            dataType : "json",
            data : JSON.stringify({
                includeAuto:!app.store.has("tests.hide_auto"),
                filter:{                    
                    keywords : app.store.get("card.filter.keywords"),
                    tags : app.store.get("card.filter.tags")
                }
            }),
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            this.listData = data.users;
            this.breadcrumb = data.breadcrumb;
            this.ready();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {

            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // When the `content` element is rendered, using the `content` template,
    // this function provides the attributes hash to be sent to that template.
    ///////////////////////////////////////////////////////////////////////////

    getContentAttributes : function() { /* overloaded */
        return {
            heading : "Students"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the breadcrumb, toolbar, and list views for this particular
    // page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() { /* overloaded */
        return new VWidgetStudyingBrowseUsersBreadcrumb({
            data : this.breadcrumb
        });
    },

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseUsersToolbar();
    },

    instantiateListView : function() { /* overloaded */
        var options = {};
        if ( app.store.has("flashcards.users.isAscending") ) {
            options.sbIsAscending = app.store.get("flashcards.users.isAscending");
        }
        if ( app.store.has("flashcards.users.sortCriteria") ) {
            options.sbSortCriteria = app.store.get("flashcards.users.sortCriteria");
        }
        return new VWidgetStudyingBrowseUsersList(
            {
                listData:this.listData
            },
            options
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // `VBasePageBrowse.displayForm` has been called. We must instantiate a
    // given formView, based upon the `formName` sent.
    //
    //  @settings. Required values. Created for `displayForm`.
    //  @options. Any flags that might be useful. Created for `displayForm`.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateFormView : function(formName,settings,options) { /* overloaded */

        var formView = null;

        switch ( formName ) {

            case "filter" :
                formView = new VWidgetStudyingBrowseUsersFormFilter(settings,options);
                break;
        }

        return formView;
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, when this view is shown, there may be some toolbar buttons
    // that are immediately available.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() {

        // we will set the text of the sort order button. always assume ascending by default.
        this.toolbarView.getButton("display_sort_order").html(app.store.has("flashcards.users.isAscending") ? ( app.store.get("flashcards.users.isAscending") ? "Sort Descending" : "Sort Ascending" ) : "Sort Descending" );

        // we will set the text of the sort criteria button. always assume name by default.
        this.toolbarView.getButton("display_sort_criteria").html(app.store.has("flashcards.users.sortCriteria") ? ( app.store.get("flashcards.users.sortCriteria") === "name" ? "Sort By Num Cards" : "Sort By Name" ) : "Sort By Num Cards" );

        // enable/disable
        this.toolbarView.setEnabled({
            display:true,
            filter:true
        });

        // content in filter?

        var keywords = app.store.get("card.filter.keywords");
        var tags = app.store.get("card.filter.tags");

        if ( keywords || tags ) {
            this.toolbarView.getButton("filter").removeClass("btn-default").addClass("btn-info");
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // A form has been opened on the page. So we will temporarily disable all
    // of the buttons on the toolbar that allow another form to be opened, as
    // there is only one allowed to be shown at a time.
    ///////////////////////////////////////////////////////////////////////////

    disableToolbarFormButtons : function() { /* overloaded */

        this.savedToolbarButtonState = this.toolbarView.getEnabled();
        this.toolbarView.setEnabled({
            display:true,
            filter:false
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The form that was displaying is now gone. Reset our toolbar buttons
    // to how they were before it was opened.
    ///////////////////////////////////////////////////////////////////////////

    reEnableToolbarFormButtons : function() { /* overloaded */
        this.toolbarView.setEnabled(this.savedToolbarButtonState);
        this.savedToolbarButtonState = null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked one of the crumbs in our breadcrumb. All of the
    // information we require can be found in the `crumb` object passed to us.
    // In particular, we want the `urlIDs` inside it, as they will tell us what
    // position in the browsing hierarchy we should go to after clicking this
    // crumb.
    //
    //  @crumb: the data object from the VBaseBreadcrumbCrumb view. contains
    //          `.urlIDs`.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickBreadcrumb : function(crumb) {
        this.trigger("setPage",{
            urlIDs : crumb.urlIDs
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, as well as the event that started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,event) {

        // DISPLAY

        if ( buttonName.indexOf("display") !== -1 ) {

            // SORT CRITERIA

            if ( buttonName === "display_sort_criteria" ) {
                var sortCriteria = this.listView.collection.sortCriteria;
                sortCriteria = ( sortCriteria === "name" ? "cards" : "name" );
                app.store.set("flashcards.users.sortCriteria",sortCriteria);
                this.refresh();
            }

            // SORT ORDER

            else if ( buttonName === "display_sort_order" ) {
                var isAscending = this.listView.collection.isAscending;
                app.store.set("flashcards.users.isAscending",!isAscending);
                this.refresh();
            }
        }

        // FILTER SET

        else if ( buttonName === "filter_set" ) {
            this.displayForm("filter");
        }

        // FILTER CLEAR

        else if ( buttonName === "filter_clear" ) {
            var hadFilter = app.store.has("card.filter.tags") || app.store.has("card.filter.keywords");
            app.store.rem("card.filter",true);
            if ( hadFilter ) {
                this.refresh();
            }
        }

    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the users in our list. We are going
    // to trigger a page change, sending along the urlIDs that represent our
    // new position in the browsing hierarchy.
    //
    //  @modelAttributes:   Cloned attributes hash for the model whose view
    //                      was clicked on by the user in the listView.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickRecord : function(modelAttributes) {
        this.trigger("setPage",{
            urlIDs : _.extend({},this.settings.urlIDs,{
                uID:modelAttributes.id
            }),
            containerAttributes:modelAttributes
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The formView that was opened has successfully "saved" whatever the user
    // entered. Depending on the formView that was instantiated, highlighted
    // by the `formName` param, our actions will differ.
    //
    //  @formName:  The `formName` property of the VBaseWidgetForm-derived view
    //              that was submitted.
    //
    //  @formData:  The data serialized from the form. The structure of this
    //              may change significantly depending on the type of formView
    //              we're working with.
    //
    //  @options:   Any flags that were set along our chain of function calls
    //              that got us here. They will relate directly to the action
    //              of "saving". They may include our own options ("sb...") and
    //              backbone-related options.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) { /* overloaded */

        switch ( formName ) {
            
            // setting a new filter.
            case "filter":                

                // clear existing filter and create new one, if we
                // have any values from the form to do so.

                var hadFilter = app.store.has("card.filter.tags") || app.store.has("card.filter.keywords");
                app.store.rem("card.filter",true);

                if ( formData.keywords.length || formData.tags.length ) {

                    // set the filter information in our store and refresh
                    // the page. the filter information will be checked by
                    // the `setDefaultToolbarEnabled` method and the
                    // filter button will be highlighted.
                    
                    app.store.set("card.filter.keywords",formData.keywords);
                    app.store.set("card.filter.tags",formData.tags);
                    this.refresh();
                }

                // nothing is on the filter.                
                else {

                    // clearing what we had before.
                    if ( hadFilter ) {
                        this.onClickToolbar("filter_clear",null);                        
                    }
                    // nothing to do.
                    else {
                        this.closeForm();
                    }
                }
                
                break;
        }
    }    

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseUsersBreadcrumb
// Description: We inherit everything from VBaseWidgetBreadcrumb.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseUsersBreadcrumb = VBaseWidgetBreadcrumb.extend({

    /* overloaded */
    id : "widget-studying-browse-users-breadcrumb",
    templateID : "tpl-widget-studying-browse-users-breadcrumb",

    className : function() {
        return _.result(VBaseWidgetBreadcrumb.prototype,'className') + " breadcrumb widget-studying-browse-users-breadcrumb";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBreadcrumb.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Given an array of objects, each representing enough information to
    // build a single crumb, we will construct an ordered array of objects that
    // each contain the following fields: .display, .href, .data.
    //
    //  @data:    
    //
    //      array of objects. will have a `crumbName` field to tell
    //      us what information is in a particular object.
    //
    //  @return:
    //
    //      An ordered array of objects, containing the fields mentioned above.
    //      Return `null` for failure.
    //          
    ///////////////////////////////////////////////////////////////////////////

    generateCrumbs : function(data) { /* overloaded */

        var crumbInfo = null; // from sent data
        var breadcrumb = []; // returned ary
        var crumb = {}; // goes into ary

        // moduleID

        crumbInfo = _.find(data,function(o){
            return o.crumbName === "moduleID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        
        var moduleID = crumbInfo.module_id;
        crumb.crumbDisplay = crumbInfo.subject_code + " " + crumbInfo.class_code + " (" + crumbInfo.semester_name + ", " + crumbInfo.year + ")";
        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#flashcards/";
        crumb.crumbData = {urlIDs:{}};
        breadcrumb.push(crumb);

        // groupID.

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "groupID";
        });
        if ( !crumbInfo ) {
            return null;
        }

        if ( crumbInfo.id === "self" ) {
            crumb.crumbDisplay = "My Flashcards";            
        }
        else if ( crumbInfo.id === "pub" ) {
            crumb.crumbDisplay = "Public Studygroup";
        }
        else {
            crumb.crumbDisplay = "Studygroup (" + crumbInfo.created_by_first_name + ")";
        }

        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);

        var addedUrlIDs = {};
        if ( crumbInfo.id === "self" ) {
            addedUrlIDs.uID = app.store.get("user").id;
        }
        addedUrlIDs.gID = crumbInfo.id;

        crumb.crumbHref = app.JS_ROOT + "#flashcards/" + "m" + moduleID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID}};
        breadcrumb.push(crumb);
        
        return breadcrumb;
    }

});

//---------------------------------------------------------------------------------------
// View:        VWidgetStudyingBrowseUsersFormFilter
// Description: We inherit everything from VBaseWidgetBrowseFormFilter.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseUsersFormFilter = VBaseWidgetBrowseFormFilter.extend({

    /* overloaded */
    id : "widget-studying-browse-users-form-filter",

    className : function() {
        return _.result(VBaseWidgetBrowseFormFilter.prototype,'className') + " widget-studying-browse-users-form-filter";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBrowseFormFilter.prototype,'events'),{
        });
    }
});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseUsersList
// Description: The list widget for the "browse users" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseUsersList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-studying-browse-users-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-studying-browse-users-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        var collection = new UsersCollection();
        if ( $.gettype(this.options.sbIsAscending).base !== "undefined" ) {
            collection.isAscending = this.options.sbIsAscending;
        }
        if ( $.gettype(this.options.sbSortCriteria).base !== "undefined" ) {
            collection.sortCriteria = this.options.sbSortCriteria;
        }
        return collection;
    },

    instantiateModel : function() { /* overloaded */
        return new UserModel();
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Simple factory function. The settings and options have been built up
    // already by our base class. Add anything else we need.
    //
    //      settings:
    //
    //          .model
    //          .listSettings
    //
    //      options:
    //
    //          .listOptions
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateWidgetRecordEditable : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseUsersRecordEditable(settings,options);
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseUsersRecordEditableDisplay
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseUsersRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : "widget-studying-browse-users-record-editable-display",
    templateID : "tpl-widget-studying-browse-users-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-studying-browse-users-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseUsersRecordEditable
// Description: This widget simply displays the record's attributes. Editing is not allowed.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseUsersRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : "widget-studying-browse-users-record-editable",
    templateID : "tpl-widget-studying-browse-users-record-editable",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-studying-browse-users-record-editable";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We do not allow the user to edit/delete models here.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our toolbar is empty for this record, as we cannot manipulate it in
    // any way, except for clicking on it.
    ///////////////////////////////////////////////////////////////////////////

    instantiateToolbarView : function() { /* overloaded */
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Specify the VBaseWidgetRecordEditableDisplay- and
    // VBaseWidgetRecordEditableDisplay-derived views we will use here.
    //
    // The settings and options have already been started by our base view.
    // They will include `recordSettings` (which contains `model`) and 
    // `recordOptions`, respectively. Add whatever we need that's unique here.
    ///////////////////////////////////////////////////////////////////////////    

    instantiateDisplayView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseUsersRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return null;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseUsersToolbar
// Description: The toolbar for the "browse users" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseUsersToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-users-toolbar",
    templateID : "tpl-widget-studying-browse-users-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-users-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View:        VPageStudyingBrowseTypes
// Description: This simply lets the user pick between "cards" and "tests" for a particular
//              user. We show them the number of both that the user has.
//
//              Several events are captured here: onClickBreadcrumb, 
//              onFormSubmit/onFormCancel, onClickRecord. we trigger an "onPageReady" event,
//              letting our parent know that we are ready to render.
//
//              The forms available here are "filter".
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseTypes = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-types",
    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-flashcards-browse-types";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePageBrowse.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty all our references
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.listData = null;
        this.breadcrumb = null;
        return VBasePageBrowse.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageStudyingBrowseTypes__loadData() { /* overloaded */

        // we will be storing an array of users, as well as a breadcrumb
        this.listData = null;
        this.breadcrumb = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading user...",opacity:0});

        // ask the server for a list of all of the students enrolled
        // in our given class.

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/studying-other.php/user/"+this.settings.urlIDs.mID+"/"+this.settings.urlIDs.gID+"/"+this.settings.urlIDs.uID,
            type : "POST",            
            dataType : "json",
            data : JSON.stringify({
                includeAuto:!app.store.has("tests.hide_auto"),
                filter:{
                    keywords : app.store.get("card.filter.keywords"),
                    tags : app.store.get("card.filter.tags")
                }
            }),
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            // we have to construct our own listData here, as we are
            // just receiving a single user's info.

            var tCards = {
                id : "cards",
                type_name : "Flashcards",
                count : data.user.num_filtered_cards
            };

            var tTests = {
                id : "tests",
                type_name : "Tests",
                count : data.user.num_tests
            };
            
            this.listData = [tCards,tTests];
            this.breadcrumb = data.breadcrumb;

            data = null;
            this.ready();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {

            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // When the `content` element is rendered, using the `content` template,
    // this function provides the attributes hash to be sent to that template.
    ///////////////////////////////////////////////////////////////////////////

    getContentAttributes : function() { /* overloaded */
        return {
            heading : "Content"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the breadcrumb, toolbar, and list views for this particular
    // page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() { /* overloaded */
        return new VWidgetStudyingBrowseTypesBreadcrumb({
            data : this.breadcrumb
        });
    },

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseTypesToolbar();
    },

    instantiateListView : function() { /* overloaded */
        return new VWidgetStudyingBrowseTypesList(
            {
                listData:this.listData
            },
            {}
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // `VBasePageBrowse.displayForm` has been called. We must instantiate a
    // given formView, based upon the `formName` sent.
    //
    //  @settings. Required values. Created for `displayForm`.
    //  @options. Any flags that might be useful. Created for `displayForm`.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateFormView : function(formName,settings,options) { /* overloaded */

        var formView = null;

        switch ( formName ) {

            case "filter" :
                formView = new VWidgetStudyingBrowseTypesFormFilter(settings,options);
                break;
        }

        return formView;
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, when this view is shown, there may be some toolbar buttons
    // that are immediately available.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() {

        // enable/disable
        this.toolbarView.setEnabled({
            filter:true
        });

        // content in filter?

        var keywords = app.store.get("card.filter.keywords");
        var tags = app.store.get("card.filter.tags");

        if ( keywords || tags ) {
            this.toolbarView.getButton("filter").removeClass("btn-default").addClass("btn-info");
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // A form has been opened on the page. So we will temporarily disable all
    // of the buttons on the toolbar that allow another form to be opened, as
    // there is only one allowed to be shown at a time.
    ///////////////////////////////////////////////////////////////////////////

    disableToolbarFormButtons : function() { /* overloaded */

        this.savedToolbarButtonState = this.toolbarView.getEnabled();
        this.toolbarView.setEnabled({
            filter:false
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The form that was displaying is now gone. Reset our toolbar buttons
    // to how they were before it was opened.
    ///////////////////////////////////////////////////////////////////////////

    reEnableToolbarFormButtons : function() { /* overloaded */
        this.toolbarView.setEnabled(this.savedToolbarButtonState);
        this.savedToolbarButtonState = null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked one of the crumbs in our breadcrumb. All of the
    // information we require can be found in the `crumb` object passed to us.
    // In particular, we want the `urlIDs` inside it, as they will tell us what
    // position in the browsing hierarchy we should go to after clicking this
    // crumb.
    //
    //  @crumb: the data object from the VBaseBreadcrumbCrumb view. contains
    //          `.urlIDs`.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickBreadcrumb : function(crumb) {
        this.trigger("setPage",{
            urlIDs : crumb.urlIDs
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, as well as the event that started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,button,event) {

        // FILTER

        if ( buttonName.indexOf("filter") !== -1 ) {
        
            // FILTER SET

            if ( buttonName === "filter_set" ) {
                this.displayForm("filter");
            }

            // FILTER CLEAR

            else if ( buttonName === "filter_clear" ) {
                var hadFilter = app.store.has("card.filter.tags") || app.store.has("card.filter.keywords");
                app.store.rem("card.filter",true);
                if ( hadFilter ) {
                    this.refresh();
                }
            }
        }

    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the users in our list. We are going
    // to trigger a page change, sending along the urlIDs that represent our
    // new position in the browsing hierarchy.
    //
    //  @modelAttributes:   Cloned attributes hash for the model whose view
    //                      was clicked on by the user in the listView.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickRecord : function(modelAttributes) {
        this.trigger("setPage",{
            urlIDs : _.extend({},this.settings.urlIDs,{
                tID:modelAttributes.id
            }),
            containerAttributes:modelAttributes
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The formView that was opened has successfully "saved" whatever the user
    // entered. Depending on the formView that was instantiated, highlighted
    // by the `formName` param, our actions will differ.
    //
    //  @formName:  The `formName` property of the VBaseWidgetForm-derived view
    //              that was submitted.
    //
    //  @formData:  The data serialized from the form. The structure of this
    //              may change significantly depending on the type of formView
    //              we're working with.
    //
    //  @options:   Any flags that were set along our chain of function calls
    //              that got us here. They will relate directly to the action
    //              of "saving". They may include our own options ("sb...") and
    //              backbone-related options.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) { /* overloaded */

        switch ( formName ) {
            
            // setting a new filter.
            case "filter":                

                // clear existing filter and create new one, if we
                // have any values from the form to do so.

                var hadFilter = app.store.has("card.filter.tags") || app.store.has("card.filter.keywords");
                app.store.rem("card.filter",true);

                if ( formData.keywords.length || formData.tags.length ) {

                    // set the filter information in our store and refresh
                    // the page. the filter information will be checked by
                    // the `setDefaultToolbarEnabled` method and the
                    // filter button will be highlighted.
                    
                    app.store.set("card.filter.keywords",formData.keywords);
                    app.store.set("card.filter.tags",formData.tags);
                    this.refresh();
                }

                // nothing is on the filter.                
                else {

                    // clearing what we had before.
                    if ( hadFilter ) {
                        this.onClickToolbar("filter_clear",null);                        
                    }
                    // nothing to do.
                    else {
                        this.closeForm();
                    }
                }
                
                break;
        }
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTypesBreadcrumb
// Description: We inherit everything from VBaseWidgetBreadcrumb.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTypesBreadcrumb = VBaseWidgetBreadcrumb.extend({

    /* overloaded */
    id : "widget-studying-browse-types-breadcrumb",
    templateID : "tpl-widget-studying-browse-types-breadcrumb",

    className : function() {
        return _.result(VBaseWidgetBreadcrumb.prototype,'className') + " breadcrumb widget-studying-browse-types-breadcrumb";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBreadcrumb.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Given an array of objects, each representing enough information to
    // build a single crumb, we will construct an ordered array of objects that
    // each contain the following fields: .display, .href, .data.
    //
    //  @data:    
    //
    //      array of objects. will have a `crumbName` field to tell
    //      us what information is in a particular object.
    //
    //  @return:
    //
    //      An ordered array of objects, containing the fields mentioned above.
    //      Return `null` for failure.
    //          
    ///////////////////////////////////////////////////////////////////////////

    generateCrumbs : function(data) { /* overloaded */

        var crumbInfo = null; // from sent data
        var breadcrumb = []; // returned ary
        var crumb = {}; // goes into ary

        // moduleID

        crumbInfo = _.find(data,function(o){
            return o.crumbName === "moduleID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        
        var moduleID = crumbInfo.module_id;
        crumb.crumbDisplay = crumbInfo.subject_code + " " + crumbInfo.class_code + " (" + crumbInfo.semester_name + ", " + crumbInfo.year + ")";
        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/";
        crumb.crumbData = {urlIDs:{}};
        breadcrumb.push(crumb);

        // groupID.

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "groupID";
        });
        if ( !crumbInfo ) {
            return null;
        }

        var groupID = crumbInfo.id;
        if ( crumbInfo.id === "self" ) {
            crumb.crumbDisplay = "My Stuff";            
        }
        else if ( crumbInfo.id === "pub" ) {
            crumb.crumbDisplay = "Public Studygroup";
        }
        else {
            crumb.crumbDisplay = "Studygroup (" + crumbInfo.created_by_first_name + ")";
        }

        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);

        var addedUrlIDs = {};
        if ( crumbInfo.id === "self" ) {
            addedUrlIDs.uID = app.store.get("user").id;
        }
        addedUrlIDs.gID = crumbInfo.id;

        crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID}};
        breadcrumb.push(crumb);

        // userID
        // NOTE: we are only interested in doing 'userID' if we do not have a groupID of "self". let's check
        // the breadcrumbData.

        selfCrumb = _.find(data,function(o){
            return ( ( o.crumbName === "groupID" ) && ( o.id === "self" ) );
        });

        if ( !selfCrumb ) {

            var crumb = {};
            crumbInfo = _.find(data,function(o){
                return o.crumbName === "userID";
            });
            if ( !crumbInfo ) {
                return null;
            }
            crumb.crumbDisplay = crumbInfo.full_name;
            crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
            crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/" + "g" + groupID + "/";
            crumb.crumbData = {urlIDs:{mID:moduleID,gID:groupID}};
            breadcrumb.push(crumb);
        }
        
        return breadcrumb;
    }

});

//---------------------------------------------------------------------------------------
// View:        VWidgetStudyingBrowseTypesFormFilter
// Description: We inherit everything from VBaseWidgetBrowseFormFilter.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTypesFormFilter = VBaseWidgetBrowseFormFilter.extend({

    /* overloaded */
    id : "widget-studying-browse-types-form-filter",

    className : function() {
        return _.result(VBaseWidgetBrowseFormFilter.prototype,'className') + " widget-studying-browse-types-form-filter";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBrowseFormFilter.prototype,'events'),{
        });
    }
});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTypesList
// Description: The list widget for the "browse types" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTypesList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-studying-browse-types-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-studying-browse-types-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        var collection = new TypesCollection();
        return collection;
    },

    instantiateModel : function() { /* overloaded */
        return new TypeModel();
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Simple factory function. The settings and options have been built up
    // already by our base class. Add anything else we need.
    //
    //      settings:
    //
    //          .model
    //          .listSettings
    //
    //      options:
    //
    //          .listOptions
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateWidgetRecordEditable : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseTypesRecordEditable(settings,options);
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTypesRecordEditableDisplay
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTypesRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : "widget-studying-browse-types-record-editable-display",
    templateID : "tpl-widget-studying-browse-types-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-studying-browse-types-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTypesRecordEditable
// Description: This widget simply displays the record's attributes. Editing is not allowed.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTypesRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : "widget-studying-browse-types-record-editable",
    templateID : "tpl-widget-studying-browse-types-record-editable",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-studying-browse-types-record-editable";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We do not allow the user to edit/delete models here.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our toolbar is empty for this record, as we cannot manipulate it in
    // any way, except for clicking on it.
    ///////////////////////////////////////////////////////////////////////////

    instantiateToolbarView : function() { /* overloaded */
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Specify the VBaseWidgetRecordEditableDisplay- and
    // VBaseWidgetRecordEditableDisplay-derived views we will use here.
    //
    // The settings and options have already been started by our base view.
    // They will include `recordSettings` (which contains `model`) and 
    // `recordOptions`, respectively. Add whatever we need that's unique here.
    ///////////////////////////////////////////////////////////////////////////    

    instantiateDisplayView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseTypesRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return null;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTypesToolbar
// Description: The toolbar for the "browse types" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTypesToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-types-toolbar",
    templateID : "tpl-widget-studying-browse-types-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-types-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View:        VPageStudyingBrowseSets
// Description: This view represents the page where the user is able to browse all of the
//              sets that belong to a given user for a given module. The page contains a
//              breadcrumb, toolbar, form, and list of records; each represented by a subview.
//
//              Several events are captured here: onClickBreadcrumb, onClickToolbar,
//              onClickRecord, and onFormSave/onFormCancel. These are triggered by their 
//              respective subviews. When our data has been loaded, we trigger an "onPageReady"
//              event, letting our parent know that we are ready to render.
//
//              The forms available here are "create", "filter", and "saveTest".
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseSets = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-sets",
    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-studying-browse-sets";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePageBrowse.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty all our references
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.listData = null;
        this.breadcrumb = null;
        return VBasePageBrowse.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Update the help link in the footer.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePageBrowse.prototype.render.call(this);

        var href = this.$("div.sb-footer div.help a").prop("href");
        this.$("div.sb-footer div.help a").prop("href",href+"flashcards/");

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageStudyingBrowseSets__loadData() { /* overloaded */

        // we will be storing an array of sets, as well as a breadcrumb
        this.listData = null;
        this.breadcrumb = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading sets...",opacity:0});

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/sets-manual.php/fetch/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.gID + "/" + this.settings.urlIDs.uID,
            type : "POST",            
            data : JSON.stringify({
                filter:{
                    keywords : app.store.get("card.filter.keywords"),
                    tags : app.store.get("card.filter.tags")
                }
            }),
            dataType : "json",
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            this.listData = data.sets;
            this.breadcrumb = data.breadcrumb;

            this.ready();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {

            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // When the `content` element is rendered, using the `content` template,
    // this function provides the attributes hash to be sent to that template.
    ///////////////////////////////////////////////////////////////////////////

    getContentAttributes : function() { /* overloaded */
        return {
            heading : "Sets"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the breadcrumb, toolbar, and list views for this 
    // particular page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() { /* overloaded */
        return new VWidgetStudyingBrowseSetsBreadcrumb({
            data:this.breadcrumb
        });
    },

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseSetsToolbar();
    },

    instantiateListView : function() { /* overloaded */
        var options = {};
        if ( app.store.has("sets.isAscending") ) {
            options.sbIsAscending = app.store.get("sets.isAscending");
        }
        if ( app.store.has("sets.sortCriteria") ) {
            options.sbSortCriteria = app.store.get("sets.sortCriteria");
        }
        return new VWidgetStudyingBrowseSetsList(
            {
                listData:this.listData,
                urlIDs:this.settings.urlIDs
            },
            options
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // `VBasePageBrowse.displayForm` has been called. We must instantiate a
    // given formView, based upon the `formName` sent.
    //
    //  @settings. Required values. Created for `displayForm`.
    //  @options. Any flags that might be useful. Created for `displayForm`.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateFormView : function(formName,settings,options) { /* overloaded */

        var formView = null;

        switch ( formName ) {

            case "create" :
                formView = new VWidgetStudyingBrowseSetsFormCreate(settings,options);
                break;

            case "filter" :
                formView = new VWidgetStudyingBrowseSetsFormFilter(settings,options);
                break;

            case "saveTest" :
                formView = new VWidgetStudyingBrowseSetsFormSaveTest(settings,options);
                break;
        }

        return formView;
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, the user is always able to sort, filter, and saveTest.
    // The other ones are only available if the user owns the sets being
    // displayed. If a filter is present in our store, or if there is data
    // on the clipboard, we will highlight those respective buttons.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() { /* overloaded */

        var isUser = this.settings.urlIDs.uID === app.store.get("user").id;

        // we will set the text of the display/sort button. always assume ascending by default.
        this.toolbarView.getButton("display_sort_order").html(app.store.has("sets.isAscending") ? ( app.store.get("sets.isAscending") ? "Sort Descending" : "Sort Ascending" ) : "Sort Descending" );

        // we will set the text of the sort criteria button. always assume name by default.
        this.toolbarView.getButton("display_sort_criteria").html(app.store.has("sets.sortCriteria") ? ( app.store.get("sets.sortCriteria") === "name" ? "Sort By Num Cards" : "Sort By Name" ) : "Sort By Num Cards" );

        // enable/disable.
        this.toolbarView.setEnabled({
            display:true,
            clipboard:isUser,
            add:isUser,
            delete:isUser,
            filter:true,
            test:true
        });

        // records on clipboard?

        var clipboard = app.store.get("clipboard");
        if ( $.gettype(clipboard).base !== "undefined" ) {
            var isCut = clipboard.isCut;
            this.toolbarView.getButton("clipboard").removeClass("btn-default").addClass(( isCut ? "btn-danger" : "btn-warning" ));
        }

        // content in filter?

        var keywords = app.store.get("card.filter.keywords");
        var tags = app.store.get("card.filter.tags");

        if ( keywords || tags ) {
            this.toolbarView.getButton("filter").removeClass("btn-default").addClass("btn-info");
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // A form has been opened on the page. So we will temporarily disable all
    // of the buttons on the toolbar that allow another form to be opened, as
    // there is only one allowed to be shown at a time.
    ///////////////////////////////////////////////////////////////////////////

    disableToolbarFormButtons : function() { /* overloaded */

        this.savedToolbarButtonState = this.toolbarView.getEnabled();
        this.toolbarView.setEnabled({
            display:true,
            clipboard:this.savedToolbarButtonState.clipboard,
            add:false,
            delete:this.savedToolbarButtonState.delete,
            filter:false,
            test:false
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The form that was displaying is now gone. Reset our toolbar buttons
    // to how they were before it was opened.
    ///////////////////////////////////////////////////////////////////////////

    reEnableToolbarFormButtons : function() { /* overloaded */
        this.toolbarView.setEnabled(this.savedToolbarButtonState);
        this.savedToolbarButtonState = null;
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // All records that have been cut/copied to the clipboard are being released.
    // Empty the clipboard's data in the store and remove all of the CSS classes
    // that might have been applied to records in our listView, identifying them
    // as being cut/copied.
    ///////////////////////////////////////////////////////////////////////////

    clearClipboard : function() {
        app.store.rem("clipboard",true);
        this.listView.getFilteredRecordViews(".widget-record-editable-cut, .widget-record-editable-copy").removeClass("widget-record-editable-cut widget-record-editable-copy");
        this.toolbarView.getButton("clipboard").removeClass("btn-warning btn-danger").addClass("btn-default");
    },

    /*
        Trigger Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked one of the crumbs in our breadcrumb. All of the
    // information we require can be found in the `crumb` object passed to us.
    // In particular, we want the `urlIDs` inside it, as they will tell us what
    // position in the browsing hierarchy we should go to after clicking this
    // crumb.
    //
    //  @crumb: the data object from the VBaseBreadcrumbCrumb view. contains
    //          `.urlIDs`.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickBreadcrumb : function(crumb) {
        this.trigger("setPage",{
            urlIDs : crumb.urlIDs
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the modules in our list. We are going
    // to trigger a page change, sending along the urlIDs that represent our
    // new position in the browsing hierarchy.
    ///////////////////////////////////////////////////////////////////////////

    onClickRecord : function(modelAttributes) {
        this.trigger("setPage",{
            urlIDs : _.extend({},this.settings.urlIDs,{
                sID:modelAttributes.id
            }),
            containerAttributes:modelAttributes
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, the button itself, as well as the event that 
    // started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function VPageStudyingBrowseSets__onClickToolbar(buttonName,button,event) {

        // DISPLAY

        if ( buttonName.indexOf("display") !== -1 ) {

            // SORT CRITERIA

            if ( buttonName === "display_sort_criteria" ) {
                var sortCriteria = this.listView.collection.sortCriteria;
                app.store.set("sets.sortCriteria",( sortCriteria === "name" ? "cards" : "name" ));
                app.saveUserSettings();
                this.refresh();
            }

            // SORT ORDER

            else if ( buttonName === "display_sort_order" ) {
                var isAscending = this.listView.collection.isAscending;
                app.store.set("sets.isAscending",!isAscending);
                app.saveUserSettings();
                this.refresh();
            }

            // SELECT ALL

            else if ( buttonName === "display_select_all" ) {
                this.listView.getFilteredRecordViews(".widget-record-editable").addClass("widget-record-editable-selected");
            }

            // CLEAR SELECTED

            else if ( buttonName === "display_clear_selected" ) {
                this.listView.clearSelected();
            }
        }

        // CLIPBOARD

        else if ( buttonName.indexOf("clipboard") !== -1 ) {

            // CLEAR

            if ( buttonName ==="clipboard_clear" ) {
                this.clearClipboard();
            }

            // CUT/COPY

            else if ( ( buttonName === "clipboard_cut" ) || ( buttonName === "clipboard_copy" ) ) {

                var isCut = ( buttonName === "clipboard_cut" );

                // we must have some sets selected in our listView
                var setsSelected = this.listView.getSelected();
                if ( !setsSelected.length ) {
                    bsDialog.create({                    
                        title : "Cut/Copy Sets",
                        msg : "<p>You must select some sets first!</p>",
                        ok : function() {}
                    });
                }

                else {

                    // highlight them all as being cut or copied.
                    setsSelected.addClass("widget-record-editable-"+(isCut?"cut":"copy"));

                    // remove the 'selected' property
                    this.listView.clearSelected();

                    // grab all of the setIDs that they want to cut/copy.
                    var setIDs = [];
                    setsSelected.each(function(idx,jqo){
                        var attrs = $(jqo).data("modelAttributes");
                        setIDs.push(attrs.id);
                    });

                    // create an object that details this operation, so
                    // when we go to paste we know what we're doing.

                    var clipboardData = {};
                    clipboardData.isCut = isCut;
                    clipboardData.type = "sets";
                    clipboardData.ids = setIDs;
                    clipboardData.srcModuleID = this.settings.urlIDs.mID;
                    clipboardData.srcSetID = undefined;
                    
                    app.store.rem("clipboard",true);
                    app.store.set("clipboard",clipboardData);

                    bsDialog.create({                    
                        title : "Cut/Copy Sets",
                        msg : "<p>" + setIDs.length + " set(s) have been placed on the clipboard" + "</p>",
                        ok : function() {}
                    });

                    // highlight the "clipboard" toolbar button, as we now have something on the clipboard.
                    this.toolbarView.getButton("clipboard").removeClass("btn-default btn-warning btn-danger").addClass( isCut ? "btn-danger" : "btn-warning" );
                }
            }

            // PASTE

            else if ( buttonName === "clipboard_paste" ) {

                // check for the several errors that might occur first.

                var errorMsg = null;
                var clipboard = app.store.get("clipboard");
                
                // (1) we must have something on the clipboard.
                if ( $.gettype(clipboard).base === "undefined" ) {
                    errorMsg = "Clipboard is empty!";
                }

                // (2) they must have sets on the clipboard.
                else if ( clipboard.type !== "sets" ) {
                    errorMsg = "You can only paste sets here!";
                }

                // (3)  ensure that they aren't trying to paste sets into the same
                //      module that they cut/copied them from!
                else if ( clipboard.srcModuleID === this.settings.urlIDs.mID ) {
                    errorMsg = "Source/destination classes are the same!";
                }

                if ( errorMsg ) {
                    bsDialog.create({                
                        title : "Paste",
                        msg : "<p>" + errorMsg + "</p>",
                        ok : function(){}
                    });
                }

                // everything checked out. let's paste the sets here and then select them, so the
                // user knows what's been pasted.

                else {

                    // clear the current selections (if any)
                    this.listView.clearSelected();

                    Spinner.get().show({msg:"Pasting...",opacity:0});

                    $.ajax({
                        url : app.JS_ROOT + "ajax/studying/sets-manual.php/paste/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID,
                        type : "POST",            
                        data : JSON.stringify({
                            isCut:+(clipboard.isCut),
                            setIDs:clipboard.ids,
                            srcModuleID:clipboard.srcModuleID,
                            dstModuleID:this.settings.urlIDs.mID
                        }),
                        dataType : "json",
                        contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
                        context : this,
                        beforeSend : function(jqxhr,options) {
                            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                        },
                    })
                    .done(function(data,textStatus,jqXHR) {

                        // we have received an array of new sets from the server. we are going to add them
                        // to the listView. the parameters for "onExternalAdd" are: (attrObject, options)
                        // since backbone options can be sent to the function that is bound to this event,
                        // we are identifying our proprietary options with the `sb` prefix.

                        for ( var x=0; x < data.newSets.length; x++ ) {
                            this.listView.trigger("onExternalAdd",data.newSets[x],{sbMakeSelected:true});
                        }
                        Spinner.get().hide(function(){
                            bsDialog.create({                    
                                title : "Paste Sets",
                                msg : "<p>" + data.newSets.length + " set(s) pasted" + "</p>",
                                ok : function() {}
                            });
                        });
                    })
                    .fail(function(jqXHR,textStatus,errorThrown) {

                        Spinner.get().hide(function(){
                            app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                        });
                    })

                    // Whether we fail or succeed, the clipboard is now empty.
                    .always(function(a,textStatus,c){
                        this.clearClipboard();
                    });
                }
            }
        }

        // ADD SET

        else if ( buttonName === "add" ) {
            this.displayForm("create",{urlIDs:this.settings.urlIDs});
        }

        // DELETE

        else if ( buttonName === "delete" ) {

            // we must have some sets selected in our listView
            var setsSelected = this.listView.getSelected();            
            if ( !setsSelected.length ) {
                bsDialog.create({                    
                    title : "Delete Sets",
                    msg : "<p>You must select some sets first!</p>",
                    ok : function() {}
                });
            }

            else {

                // grab all of the setIDs that they want to delete.

                var setIDs = [];
                setsSelected.each(function(idx,jqo){
                    var attrs = $(jqo).data("modelAttributes");
                    setIDs.push(attrs.id);
                });

                // the user has selected some sets to delete. we will create the function to do so
                // and then attach it to the "OK" button of a bootstrap dialog (modal).            

                okayFunction = function() {

                    // prevents them from copying/cutting stuff onto the clipboard, deleting them, and then
                    // trying to paste them.
                    this.clearClipboard();

                    Spinner.get().show({msg:"Removing...",opacity:0});

                    $.ajax({
                        url : app.JS_ROOT + "ajax/studying/sets-manual.php/delete/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID,
                        type : "POST",            
                        data : JSON.stringify(setIDs),
                        dataType : "json",
                        contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
                        context : this,
                        beforeSend : function(jqxhr,options) {
                            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                        },
                    })
                    .done(function(data,textStatus,jqXHR) {

                        // upon success, we receive an array of all the setIDs that were deleted. if it doesn't
                        // match the list that we originally sent, the server would have generated an error.
                        
                        // note: for working and broken examples of using for loop values in closures, see
                        // http://jsfiddle.net/UWzcd/2/

                        // the function that receives the event for "onExternalRemove" expects the parameter
                        // to be a function that can be used as a matching function when iterating through
                        // the collection of models that make up the listView.

                        for ( var x=0; x < data.setIDs.length; x++ ) {
                            (function(setID){
                                this.listView.trigger("onExternalRemove",function(o){
                                    return (o.id === setID);
                                });
                            }.bind(this))(data.setIDs[x]);
                        }
                        Spinner.get().hide();
                    })
                    .fail(function(jqXHR,textStatus,errorThrown) {

                        Spinner.get().hide(function(){
                            app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                        });
                    });

                }.bind(this);

                // show the dialog to ensure that they really want this.

                bsDialog.create({                    
                    title : "Delete Sets",
                    msg : "<p>Are you sure you want to delete these sets? This will also delete any cards that are inside them. WARNING: THIS CANNOT BE UNDONE!</p>",
                    ok : okayFunction,
                    cancel : function(){}
                });
            }
        }

        // TEST

        else if ( buttonName.indexOf("test_") !== -1 ) {

            // TAKE

            if ( buttonName === "test_take" ) {

                // we must have some sets selected in our listView
                var setsSelected = this.listView.getSelected();            
                if ( !setsSelected.length ) {
                    bsDialog.create({                    
                        title : "Take Test",
                        msg : "<p>You must select some sets first!</p>",
                        ok : function() {}
                    });
                }

                // just grab all of the setIDs from our selected sets. we don't
                // require any more of the models' information than that.
                else {

                    var setIDs = [];        
                    setsSelected.each(function(idx,o){
                        var attrs = $(o).data("modelAttributes");
                        setIDs.push(attrs.id);
                    });

                    var keywords = app.store.get("card.filter.keywords") || [];
                    var tags = app.store.get("card.filter.tags") || [];

                    bsDialog.create({
                        title: "Take Test",
                        msg : "<p>Do you want to take a test comprised of the set(s) and filter information you have selected?</p>",
                        ok : function() {
                            app.store.rem("tests.manual");
                            app.store.set("tests.manual",{
                                module_id : this.settings.urlIDs.mID,
                                setIDs : setIDs,
                                keywords : keywords,
                                tags : tags
                            });
                            app.router.navigate(
                                "studying/taketest/manual/",
                                {trigger:true}
                            );
                        }.bind(this),
                        cancel : function() {}
                    })
                }
            }

            // SAVE AS

            else if ( buttonName === "test_save" ) {

                // we must have some sets selected in our listView
                var setsSelected = this.listView.getSelected();            
                if ( !setsSelected.length ) {
                    bsDialog.create({                    
                        title : "Save As Test",
                        msg : "<p>You must select some sets first!</p>",
                        ok : function() {}
                    });
                }

                // just grab all of the setIDs from our selected sets. we don't
                // require any more of the models' information than that. then
                // open the form so the user can fill out the rest of the test's
                // information.
                else {

                    var setIDs = [];        
                    setsSelected.each(function(idx,o){
                        var attrs = $(o).data("modelAttributes");
                        setIDs.push(attrs.id);
                    });
                    app.store.rem("test.save",true); // empty all
                    app.store.set("test.save.setIDs",setIDs);                
                    this.displayForm("saveTest",{urlIDs:this.settings.urlIDs});
                }
            }
        }

        // FILTER SET

        else if ( buttonName === "filter_set" ) {
            this.displayForm("filter");
        }

        // FILTER CLEAR

        else if ( buttonName === "filter_clear" ) {
            app.store.rem("card.filter",true);
            this.refresh();
        }

    },    

    ///////////////////////////////////////////////////////////////////////////
    // The formView that was opened has successfully "saved" whatever the user
    // entered. Depending on the formView that was instantiated, highlighted
    // by the `formName` param, our actions will differ.
    //
    //  @formName:  The `formName` property of the VBaseWidgetForm-derived view
    //              that was submitted.
    //
    //  @formData:  The data serialized from the form. The structure of this
    //              may change significantly depending on the type of formView
    //              we're working with.
    //
    //  @options:   Any flags that were set along our chain of function calls
    //              that got us here. They will relate directly to the action
    //              of "saving". They may include our own options ("sb...") and
    //              backbone-related options.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) { /* overloaded */

        switch ( formName ) {
            
            // new set has been created
            case "create":
                this.listView.trigger("onExternalAdd",formData,options);
                this.closeForm();
                break;

            // setting a new filter.
            case "filter":                

                // clear existing filter and create new one, if we
                // have any values from the form to do so.

                var hadFilter = app.store.has("card.filter.tags") || app.store.has("card.filter.keywords");
                app.store.rem("card.filter",true);

                if ( formData.keywords.length || formData.tags.length ) {

                    // set the filter information in our store and refresh
                    // the page. the filter information will be checked by
                    // the `setDefaultToolbarEnabled` method and the
                    // filter button will be highlighted.
                    
                    app.store.set("card.filter.keywords",formData.keywords);
                    app.store.set("card.filter.tags",formData.tags);
                    this.refresh();
                }

                // nothing is on the filter.                
                else {

                    // clearing what we had before.
                    if ( hadFilter ) {
                        this.onClickToolbar("filter_clear",null);                        
                    }
                    // nothing to do.
                    else {
                        this.closeForm();
                    }
                }
                
                break;

            // test has been saved
            case "saveTest":

                this.listView.clearSelected();
                app.store.rem("test.save",true);
                this.closeForm();
                break;
        }
    }    

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsBreadcrumb
// Description: We inherit everything from VBaseWidgetBreadcrumb.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsBreadcrumb = VBaseWidgetBreadcrumb.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-breadcrumb",
    templateID : "tpl-widget-studying-browse-sets-breadcrumb",

    className : function() {
        return _.result(VBaseWidgetBreadcrumb.prototype,'className') + " breadcrumb widget-studying-browse-sets-breadcrumb";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBreadcrumb.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Given an array of objects, each representing enough information to
    // build a single crumb, we will construct an ordered array of objects that
    // each contain the following fields: .display, .href, .data.
    //
    //  @data:    
    //
    //      array of objects. will have a `crumbName` field to tell
    //      us what information is in a particular object.
    //
    //  @return:
    //
    //      An ordered array of objects, containing the fields mentioned above.
    //      Return `null` for failure.
    //          
    ///////////////////////////////////////////////////////////////////////////

    generateCrumbs : function(data) { /* overloaded */

        var crumbInfo = null; // from sent data
        var breadcrumb = []; // returned ary
        var crumb = {}; // goes into ary

        // moduleID

        crumbInfo = _.find(data,function(o){
            return o.crumbName === "moduleID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        
        var moduleID = crumbInfo.module_id;
        crumb.crumbDisplay = crumbInfo.subject_code + " " + crumbInfo.class_code + " (" + crumbInfo.semester_name + ", " + crumbInfo.year + ")";
        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/";
        crumb.crumbData = {urlIDs:{}};
        breadcrumb.push(crumb);

        // groupID.

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "groupID";
        });
        if ( !crumbInfo ) {
            return null;
        }

        var groupID = crumbInfo.id;
        if ( crumbInfo.id === "self" ) {
            crumb.crumbDisplay = "My Stuff";            
        }
        else if ( crumbInfo.id === "pub" ) {
            crumb.crumbDisplay = "Public Studygroup";
        }
        else {
            crumb.crumbDisplay = "Studygroup (" + crumbInfo.created_by_first_name + ")";
        }

        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID}};
        breadcrumb.push(crumb);

        // userID
        // NOTE: we are only interested in doing 'userID' if we do not have a groupID of "self". let's check
        // the data.

        selfCrumb = _.find(data,function(o){
            return ( ( o.crumbName === "groupID" ) && ( o.id === "self" ) );
        });        

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "userID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        var userID = crumbInfo.id;
        if ( !selfCrumb ) {
            crumb.crumbDisplay = crumbInfo.full_name;
            crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
            crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/" +  "g" + groupID + "/";
            crumb.crumbData = {urlIDs:{mID:moduleID,gID:groupID}};
            breadcrumb.push(crumb);
        }

        // typeID.

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "typeID";
        });
        if ( !crumbInfo ) {
            return null;
        }

        var typeID = crumbInfo.id;
        if ( crumbInfo.id === "cards" ) {
            crumb.crumbDisplay = "Flashcards";            
        }
        else if ( crumbInfo.id === "tests" ) {
            crumb.crumbDisplay = "Tests";
        }

        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/" + "g" + groupID + "/" + "u" + userID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID,gID:groupID,uID:userID}};
        breadcrumb.push(crumb);
        
        return breadcrumb;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsFormCreate
// Description: This view houses a form that is filled out and submitted to create a new
//              model of a given type (defined by derived views). The request, invalid,
//              sync, and error events (from the model) are captured here and dealt with.
//              Alerts are displayed within the form as appropriate.
//
//              Methods dealing with the manipulation/presentation of the form itself
//              and parsing of the form data are overloaded; as is the method that
//              instantiates the model itself. Note that several models may be instantiated
//              over time, as multiple records may be created.
//
//              Two bootstrap events are created here: "onCreateSave" and
//              "onCreateCancel". These are triggered when that respective function
//              has completed (i.e., the model was successfuly saved), not just when
//              certain buttons are pushed. If you want to fiddle around with the model's
//              events directly, as a derived view, then you'll need to add your own hooks.
//
//              The errors returned from the model's validation need to be an object
//              with two fields (.msg and .field). `field` should match the name
//              of a given input field on the form, so it can be highlighted.
//              
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsFormCreate = VBaseWidgetFormCreate.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-form-create",
    templateID : "tpl-widget-studying-browse-sets-form-create",
    successAlertText : undefined, // not used
    requestText : "Saving...",
    formName : "create",

    className : function() {
        return _.result(VBaseWidgetFormCreate.prototype,'className') + " widget-studying-browse-sets-form-create";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetFormCreate.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty our references.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.ws_sharing = null;
        return VBaseWidgetFormCreate.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is the data type that we will be creating through our form.
    ///////////////////////////////////////////////////////////////////////////

    instantiateModel : function() { /* overloaded */
        var model = new SetModel();
        model.urlRoot = model.baseUrlRoot + "/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID;
        return model;
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Our creation form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // we need to build our select2 instance.

        this.ws_sharing = new WSelect2({
            elem : this.jqoForm.find("input[name=sharing]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_sharing.init({
            data : _.map(
                app.store.get("sharing.types"),
                function(o){
                    var r = {};
                    r.id = r.text = o;
                    return r;
                }
            ),
            preventNew : true,
            placeholder : "e.g., public"
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form. this will
    //      be used with `model.save` to try to update the model.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form. note that we have
        // to do the select2 instance separately.

        var attrs = this.jqoForm.serialize_object();
        attrs.sharing = this.ws_sharing.getSelection();
        if ( attrs.sharing.length ) {
            attrs.sharing = attrs.sharing[0].id;
        }
        else {
            attrs.sharing = null;
        }

        // trim all the strings
        attrs.set_name = $.trim(attrs.set_name);
        attrs.description = $.trim(attrs.description);        

        // replace "" with null and true/false with 1/0
        attrs.description = !attrs.description.length ? null : attrs.description;
        attrs.has_auto_test = attrs.has_auto_test ? 1 : 0;

        // it's empty at the moment
        attrs.num_filtered_cards = 0;

        return attrs;
    }

});

//---------------------------------------------------------------------------------------
// View:        VWidgetStudyingBrowseSetsFormFilter
// Description: We inherit everything from VBaseWidgetBrowseFormFilter.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsFormFilter = VBaseWidgetBrowseFormFilter.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-form-filter",

    className : function() {
        return _.result(VBaseWidgetBrowseFormFilter.prototype,'className') + " widget-studying-browse-sets-form-filter";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBrowseFormFilter.prototype,'events'),{
        });
    }
});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsFormSaveTest
// Description: This view houses a form that is filled out and submitted to create a new
//              model of a given type (defined by derived views). The request, invalid,
//              sync, and error events (from the model) are captured here and dealt with.
//              Alerts are displayed within the form as appropriate.
//
//              Methods dealing with the manipulation/presentation of the form itself
//              and parsing of the form data are overloaded; as is the method that
//              instantiates the model itself. Note that several models may be instantiated
//              over time, as multiple records may be created.
//
//              Two bootstrap events are created here: "onCreateSave" and
//              "onCreateCancel". These are triggered when that respective function
//              has completed (i.e., the model was successfuly saved), not just when
//              certain buttons are pushed. If you want to fiddle around with the model's
//              events directly, as a derived view, then you'll need to add your own hooks.
//
//              The errors returned from the model's validation need to be an object
//              with two fields (.msg and .field). `field` should match the name
//              of a given input field on the form, so it can be highlighted.
//              
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsFormSaveTest = VBaseWidgetFormCreate.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-form-save-test",
    templateID : "tpl-widget-studying-browse-sets-form-save-test",
    successAlertText : undefined, // not used
    requestText : "Saving...",
    formName : "saveTest",

    className : function() {
        return _.result(VBaseWidgetFormCreate.prototype,'className') + " widget-studying-browse-sets-form-save-test";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetFormCreate.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty our references.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.ws_sharing = null;
        return VBaseWidgetFormCreate.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is the data type that we will be creating through our form.
    ///////////////////////////////////////////////////////////////////////////

    instantiateModel : function() { /* overloaded */
        var model = new TestModel();
        model.urlRoot = model.baseUrlRoot + "/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID;
        return model;
    },

    ///////////////////////////////////////////////////////////////////////////
    // We require some data to be present on the form upon display. Prepare
    // that information now.
    ///////////////////////////////////////////////////////////////////////////

    getDefaultAttrsForTemplate : function() { /* overloaded */
        
        var attrs = {};        
        var keywords = app.store.get("card.filter.keywords");
        var tags = app.store.get("card.filter.tags");

        attrs.numSets = app.store.get("test.save.setIDs").length;
        attrs.numKeywords = keywords ? keywords.length : 0;
        attrs.numTags = tags ? tags.length : 0;

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our editing form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // we need to build our select2 instance.

        this.ws_sharing = new WSelect2({
            elem : this.jqoForm.find("input[name=sharing]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_sharing.init({
            data : _.map(
                app.store.get("sharing.types"),
                function(o){
                    var r = {};
                    r.id = r.text = o;
                    return r;
                }
            ),
            preventNew : true,
            placeholder : "e.g., public"
        });

        this.ws_sharing.set(this.attrs.get("sharing"));
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form. this will
    //      be used with `model.save` to try to update the model.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form. note that we have
        // to do the select2 instance separately.

        var attrs = this.jqoForm.serialize_object();
        attrs.sharing = this.ws_sharing.getSelection();
        if ( attrs.sharing.length ) {
            attrs.sharing = attrs.sharing[0].id;
        }
        else {
            attrs.sharing = null;
        }

        // trim all the strings
        attrs.test_name = $.trim(attrs.test_name);
        attrs.description = $.trim(attrs.description);        

        // replace "" with null and true/false
        attrs.description = !attrs.description.length ? null : attrs.description;

        // add in the information from our store regarding the sets and filter(s).

        var setIDs = app.store.get("test.save.setIDs");
        var keywords = app.store.get("card.filter.keywords");
        var tags = app.store.get("card.filter.tags");

        attrs.setIDs = setIDs;
        attrs.keywords = keywords ? keywords : [];
        attrs.tags = tags ? tags : [];

        return attrs;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsList
// Description: The list widget for the "browse sets" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-studying-browse-sets-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        var collection = new SetsCollection();
        if ( $.gettype(this.options.sbIsAscending).base !== "undefined" ) {
            collection.isAscending = this.options.sbIsAscending;
        }
        if ( $.gettype(this.options.sbSortCriteria).base !== "undefined" ) {
            collection.sortCriteria = this.options.sbSortCriteria;
        }
        return collection;
    },

    instantiateModel : function() { /* overloaded */
        return new SetModel();
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Simple factory function. The settings and options have been built up
    // already by our base class. Add anything else we need.
    //
    //      settings:
    //
    //          .model
    //          .listSettings
    //
    //      options:
    //
    //          .listOptions
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateWidgetRecordEditable : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseSetsRecordEditable(settings,options);
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsRecordEditableDisplay
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-record-editable-display",
    templateID : "tpl-widget-studying-browse-sets-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-studying-browse-sets-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsRecordEditableEdit
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view presents a form for editing the model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsRecordEditableEdit = VBaseWidgetRecordEditableEdit.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-record-editable-edit",
    templateID : "tpl-widget-studying-browse-sets-record-editable-edit",

    className : function() {
        return _.result(VBaseWidgetRecordEditableEdit.prototype,'className') + " widget-studying-browse-sets-record-editable-edit";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableEdit.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Removing ourself from the DOM. Empty all references.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        this.ws_sharing = null;
        return VBaseWidgetRecordEditableEdit.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our editing form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // we need to build our select2 instance.

        this.ws_sharing = new WSelect2({
            elem : this.jqoForm.find("input[name=sharing]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_sharing.init({
            data : _.map(
                app.store.get("sharing.types"),
                function(o){
                    var r = {};
                    r.id = r.text = o;
                    return r;
                }
            ),
            preventNew : true,
            placeholder : "e.g., public"
        });

        this.ws_sharing.set(this.settings.recordSettings.model.get("sharing"));
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form. this will
    //      be used with `model.save` to try to update the model.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form. note that we have
        // to do the select2 instance separately.

        var attrs = this.jqoForm.serialize_object();
        attrs.sharing = this.ws_sharing.getSelection();
        if ( attrs.sharing.length ) {
            attrs.sharing = attrs.sharing[0].id;
        }
        else {
            attrs.sharing = null;
        }

        // trim all the strings
        attrs.set_name = $.trim(attrs.set_name);
        attrs.description = $.trim(attrs.description);        

        // replace "" with null and true/false with 1/0
        attrs.description = !attrs.description.length ? null : attrs.description;
        attrs.has_auto_test = attrs.has_auto_test ? 1 : 0;

        return attrs;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsRecordEditable
// Description: This widget is used to display a model's attributes and give the user the
//              ability to edit them. We have a toolbar, for the buttons relating to the
//              record (e.g., select, edit). By default, we provide functionality for
//              select, edit, and delete buttons; although they do not need to exist in
//              the toolbar, as they'll just not be used then. Note that a toolbar
//              itself is not actually required, it can be null and then won't be
//              processed.
//
//              Beyond the toolbarView, we also have a recordView which either displays
//              the model's attributes or an edit form.
//
//              The 'Select' button simply add/removes a class to the element created here.
//              Delete attempts to `destroy` the contained model and 'Edit' changes the
//              recordView (contained here) to either a VBaseWidgetRecordEditableDisplay- or
//              VBaseWidgetRecordEditableEdit-derived view.
//
//              Notice that we do not add ourselves to any parent element here, we
//              simply render out our information and then our owner view will render
//              us in the appropriate position.
//
//              We trigger three events here: onEditSave, onEditCancel.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-record-editable",
    templateID : "tpl-widget-studying-browse-sets-record-editable",
    flagDialogTitle : "Flag Set",
    flagDialogMsg : "<p>Are you sure you want to flag this set as inappropriate?</p>",
    deleteDialogTitle : "Delete Set",
    deleteDialogMsg : "<p>Are you sure you want to delete this set? You will lose its cards as well! WARNING: THIS CANNOT BE UNDONE!</p>",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-studying-browse-sets-record-editable";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },    

    ///////////////////////////////////////////////////////////////////////////
    // As the user might be able to edit/delete models here, we need to update
    // the model's urlRoot variable so we know how to contact the server.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        this.settings.model.urlRoot = this.settings.model.baseUrlRoot + "/" + this.settings.listSettings.urlIDs.mID + "/" + this.settings.listSettings.urlIDs.uID;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Based upon our current state, and the particular user that's looking,
    // we will figure out which toolbar buttons are enabled.
    ///////////////////////////////////////////////////////////////////////////

    setToolbarButtonsEnabled : function() { /* overloaded and extended */

        VBaseWidgetRecordEditable.prototype.setToolbarButtonsEnabled.call(this);

        // if we aren't editing, then whether or not we can use certain
        // buttons will depend on whether this belongs to us

        var isUser = this.settings.listSettings.urlIDs.uID === app.store.get("user").id;

        if ( !this.isEditing ) {
            this.toolbarView.setEnabled({
                select : true,
                edit : isUser,
                flag : !isUser,
                delete : isUser
            });
        }
    },

    instantiateToolbarView : function() { /* overloaded */
        return new VWidgetStudyingBrowseSetsRecordEditableToolbar();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Specify the VBaseWidgetRecordEditableDisplay- and
    // VBaseWidgetRecordEditableDisplay-derived views we will use here.
    //
    // The settings and options have already been started by our base view.
    // They will include `recordSettings` (which contains `model`) and 
    // `recordOptions`, respectively. Add whatever we need that's unique here.
    ///////////////////////////////////////////////////////////////////////////    

    instantiateDisplayView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseSetsRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseSetsRecordEditableEdit(settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to either be saved or destroyed on the server. Display
    // the error to the user. We only get a `userError` on change:is_flagged, as 
    // they may be unsuccessful in applying their flag.
    //
    //  @options: All backbone.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VWidgetStudyingBrowseSetsRecordEditable__onModelError(model,xhr,options) { /* overloaded */

        Spinner.get().hide(function(){

            var userError = app.getAjaxUserError(xhr);

            if ( ( xhr.status === 400 ) && ( userError ) && ( ( userError.type === "flag-reputation" ) || ( userError.type === "flag-duplicate" ) ) ) {

                var msg = null;
                if ( userError.type === "flag-reputation" ) {
                    msg = "You are not able to flag any more content for the moment. Please give the administrators time to evaluate your previous flags.";
                }
                else {
                    msg = "You have already flagged that content. Please give the administrators time to evaluate your previous flag.";
                }
                
                bsDialog.create({
                    title : "Error!",
                    msg : "<p>" + msg + "</p>",
                    ok : function() {}
                });
            }
            else {
                app.dealWithAjaxFail(xhr,null,null);
            }

        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsRecordEditableToolbar
// Description: The toolbar for a VWidgetStudyingBrowseSetsRecordEditable.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsRecordEditableToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-record-editable-toolbar",
    templateID : "tpl-widget-studying-browse-sets-record-editable-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-sets-record-editable-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsToolbar
// Description: The toolbar for the "browse sets" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-toolbar",
    templateID : "tpl-widget-studying-browse-sets-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-sets-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VPageStudyingBrowseCards
// Description: This view represents the page where the user is able to browse all of the
//              cards that belong to a set for a given user for a given module. The page contains a
//              breadcrumb, toolbar, form, and list of records; each represented by a subview.
//
//              Several events are captured here: onClickBreadcrumb, onClickToolbar,
//              onClickRecord, and onFormSave/onFormCancel. These are triggered by their 
//              respective subviews. When our data has been loaded, we trigger an "onPageReady"
//              event, letting our parent know that we are ready to render.
//
//              The forms available here are "create", "filter", and "saveTest".
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseCards = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-cards",
    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-studying-browse-cards";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePageBrowse.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty all our references
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.listData = null;
        this.breadcrumb = null;
        return VBasePageBrowse.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Update the help link in the footer.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePageBrowse.prototype.render.call(this);

        var href = this.$("div.sb-footer div.help a").prop("href");
        this.$("div.sb-footer div.help a").prop("href",href+"flashcards/");

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageStudyingBrowseCards__loadData() { /* overloaded */

        // we will be storing an array of sets, as well as a breadcrumb
        this.listData = null;
        this.breadcrumb = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading cards...",opacity:0});

        // Load the models for this collection. note that we are not
        // using the collection.fetch method (along with 'reset' event)
        // because we need to make use of our `filter` info (if it
        // exists) and sending data on a `fetch` is a huge pain with
        // backbone.

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/cards-manual.php/fetch/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.gID + "/" + this.settings.urlIDs.uID + "/" + this.settings.urlIDs.sID,
            type : "POST",            
            data : JSON.stringify({
                filter:{
                    keywords : app.store.get("card.filter.keywords"),
                    tags : app.store.get("card.filter.tags")
                }
            }),
            dataType : "json",
            contentType : "application/json",
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            this.listData = data.cards;
            this.breadcrumb = data.breadcrumb;
            this.ready();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {

            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // When the `content` element is rendered, using the `content` template,
    // this function provides the attributes hash to be sent to that template.
    ///////////////////////////////////////////////////////////////////////////

    getContentAttributes : function() { /* overloaded */
        return {
            heading : "Cards"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the breadcrumb, toolbar, and list views for this 
    // particular page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() { /* overloaded */
        return new VWidgetStudyingBrowseCardsBreadcrumb({
            data:this.breadcrumb
        });
    },

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseCardsToolbar();
    },

    instantiateListView : function() { /* overloaded */
        var options = {};
        if ( app.store.has("cards.isAscending") ) {
            options.sbIsAscending = app.store.get("cards.isAscending");
        }
        return new VWidgetStudyingBrowseCardsList(
            {
                listData:this.listData,
                urlIDs:this.settings.urlIDs
            },
            options
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // `VBasePageBrowse.displayForm` has been called. We must instantiate a
    // given formView, based upon the `formName` sent.
    //
    //  @settings. Required values. Created for `displayForm`.
    //  @options. Any flags that might be useful. Created for `displayForm`.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateFormView : function(formName,settings,options) { /* overloaded */

        var formView = null;

        switch ( formName ) {

            case "create" :
                formView = new VWidgetStudyingBrowseCardsFormCreate(settings,options);
                break;

            case "batch" :
                formView = new VWidgetStudyingBrowseCardsFormBatch(settings,options);
                break;

            case "filter" :
                formView = new VWidgetStudyingBrowseCardsFormFilter(settings,options);
                break;

            case "saveTest" :
                formView = new VWidgetStudyingBrowseCardsFormSaveTest(settings,options);
                break;
        }

        return formView;
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, the user is always able to sort, filter, and saveTest.
    // The other ones are only available if the user owns the cards being
    // displayed. If a filter is present in our store, or if there is data
    // on the clipboard, we will highlight those respective buttons.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() { /* overloaded */

        var isUser = this.settings.urlIDs.uID === app.store.get("user").id;

        // we will set the text of the display/sort button. always assume ascending by default.
        this.toolbarView.getButton("display_sort").html(app.store.has("cards.isAscending") ? ( app.store.get("cards.isAscending") ? "Sort Descending" : "Sort Ascending" ) : "Sort Descending" );

        // enable/disable.
        this.toolbarView.setEnabled({
            display:true,
            clipboard:isUser,
            add:isUser,
            delete:isUser,
            filter:true,
            test:true
        });

        // records on clipboard?

        var clipboard = app.store.get("clipboard");
        if ( $.gettype(clipboard).base !== "undefined" ) {
            var isCut = clipboard.isCut;
            this.toolbarView.getButton("clipboard").removeClass("btn-default").addClass(isCut ? "btn-danger" : "btn-warning" );
        }

        // content in filter?

        var keywords = app.store.get("card.filter.keywords");
        var tags = app.store.get("card.filter.tags");

        if ( keywords || tags ) {
            this.toolbarView.getButton("filter").removeClass("btn-default").addClass("btn-info");
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // A form has been opened on the page. So we will temporarily disable all
    // of the buttons on the toolbar that allow another form to be opened, as
    // there is only one allowed to be shown at a time.
    ///////////////////////////////////////////////////////////////////////////

    disableToolbarFormButtons : function() { /* overloaded */

        this.savedToolbarButtonState = this.toolbarView.getEnabled();
        this.toolbarView.setEnabled({
            display:true,
            clipboard:this.savedToolbarButtonState.clipboard,
            add:false,
            delete:this.savedToolbarButtonState.delete,
            filter:false,
            test:false
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The form that was displaying is now gone. Reset our toolbar buttons
    // to how they were before it was opened.
    ///////////////////////////////////////////////////////////////////////////

    reEnableToolbarFormButtons : function() { /* overloaded */
        this.toolbarView.setEnabled(this.savedToolbarButtonState);
        this.savedToolbarButtonState = null;
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // All records that have been cut/copied to the clipboard are being released.
    // Empty the clipboard's data in the store and remove all of the CSS classes
    // that might have been applied to records in our listView, identifying them
    // as being cut/copied.
    ///////////////////////////////////////////////////////////////////////////

    clearClipboard : function() {
        app.store.rem("clipboard",true);
        this.listView.getFilteredRecordViews(".widget-record-editable-cut, .widget-record-editable-copy").removeClass("widget-record-editable-cut widget-record-editable-copy");
        this.toolbarView.getButton("clipboard").removeClass("btn-warning btn-danger").addClass("btn-default");
    },

    /*
        Trigger Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked one of the crumbs in our breadcrumb. All of the
    // information we require can be found in the `crumb` object passed to us.
    // In particular, we want the `urlIDs` inside it, as they will tell us what
    // position in the browsing hierarchy we should go to after clicking this
    // crumb.
    //
    //  @crumb: the data object from the VBaseBreadcrumbCrumb view. contains
    //          `.urlIDs`.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickBreadcrumb : function(crumb) {
        this.trigger("setPage",{
            urlIDs : crumb.urlIDs
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, as well as the event that started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function VPageStudyingBrowseCards__onClickToolbar(buttonName,event) {

        // DISPLAY

        if ( buttonName.indexOf("display") !== -1 ) {

            // SORT

            if ( buttonName === "display_sort" ) {
                var isAscending = !this.listView.collection.isAscending;
                app.store.set("cards.isAscending",isAscending);
                this.refresh();
            }
        }

        // CLIPBOARD

        else if ( buttonName.indexOf("clipboard") !== -1 ) {

            // CLEAR

            if ( buttonName ==="clipboard_clear" ) {
                this.clearClipboard();
            }

            // CUT/COPY

            else if ( ( buttonName === "clipboard_cut" ) || ( buttonName === "clipboard_copy" ) ) {

                var isCut = ( buttonName === "clipboard_cut" );

                // we must have some cards selected in our listView
                var cardsSelected = this.listView.getSelected();
                if ( !cardsSelected.length ) {
                    bsDialog.create({                    
                        title : "Cut/Copy Flashcards",
                        msg : "<p>You must select some cards first!</p>",
                        ok : function() {}
                    });
                }

                else {

                    // highlight them all as being cut or copied.
                    cardsSelected.addClass("widget-record-editable-"+(isCut?"cut":"copy"));

                    // remove the 'selected' property
                    this.listView.clearSelected();

                    // grab all of the ids that they want to cut/copy.
                    var cardIDs = [];
                    cardsSelected.each(function(idx,jqo){
                        var attrs = $(jqo).data("modelAttributes");
                        cardIDs.push(attrs.id);
                    });

                    // create an object that details this operation, so
                    // when we go to paste we know what we're doing.

                    var clipboardData = {};
                    clipboardData.isCut = isCut;
                    clipboardData.type = "cards";
                    clipboardData.ids = cardIDs;
                    clipboardData.srcModuleID = this.settings.urlIDs.mID;
                    clipboardData.srcSetID = this.settings.urlIDs.sID;
                    
                    app.store.rem("clipboard",true);
                    app.store.set("clipboard",clipboardData);

                    bsDialog.create({                    
                        title : "Cut/Copy Flashcards",
                        msg : "<p>" + cardIDs.length + " card(s) have been placed on the clipboard</p>",
                        ok : function() {}
                    });

                    // highlight the "clipboard" toolbar button, as we now have something on the clipboard.
                    this.toolbarView.getButton("clipboard").removeClass("btn-default btn-warning btn-danger").addClass(( isCut ? "btn-danger" : "btn-warning" ))
                }
            }

            // PASTE

            else if ( buttonName === "clipboard_paste" ) {

                // check for the several errors that might occur first.

                var errorMsg = null;
                var clipboard = app.store.get("clipboard");
                
                // (1) we must have something on the clipboard.
                if ( $.gettype(clipboard).base === "undefined" ) {
                    errorMsg = "Clipboard is empty!";
                }

                // (2) they must have cards on the clipboard.
                else if ( clipboard.type !== "cards" ) {
                    errorMsg = "You can only paste cards here!";
                }

                // (3)  ensure that they aren't trying to paste sets into the same
                //      set that they cut/copied them from!
                else if ( clipboard.srcSetID === this.settings.urlIDs.sID ) {
                    errorMsg = "Source/destination sets are the same!";
                }

                if ( errorMsg ) {
                    bsDialog.create({                
                        title : "Paste",
                        msg : "<p>" + errorMsg + "</p>",
                        ok : function(){}
                    });
                }

                // everything checked out. let's paste the cards here and then select them, so the
                // user knows what's been pasted. Notice that we are NOT applying the current filter
                // to the pasted cards, so even if the cards WOULD NOT pass the filter, they are still
                // displayed, in order to let the user know what was pasted. if they want to see the
                // current set, with the new pasted cards, *and* the filter, all the have to do is hit
                // 'refresh'.

                else {

                    // clear the current selections (if any)
                    this.listView.clearSelected();

                    Spinner.get().show({msg:"Pasting...",opacity:0});

                    $.ajax({
                        url : app.JS_ROOT + "ajax/studying/cards-manual.php/paste/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID + "/" + this.settings.urlIDs.sID,
                        type : "POST",
                        data : JSON.stringify({
                            isCut:+(clipboard.isCut),
                            cardIDs:clipboard.ids,
                            srcModuleID:clipboard.srcModuleID,
                            dstModuleID:this.settings.urlIDs.mID,
                            srcSetID:clipboard.srcSetID,
                            dstSetID:this.settings.urlIDs.sID
                        }),
                        dataType : "json",
                        contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
                        context : this,
                        beforeSend : function(jqxhr,options) {
                            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                        },
                    })
                    .done(function(data,textStatus,jqXHR) {

                        // we have received an array of new cards from the server. we are going to add them
                        // to the listView. the parameters for "onExternalAdd" are: (attrObject, options)
                        // since backbone options can be sent to the function that is bound to this event,
                        // we are identifying our proprietary options with the `sb` prefix.

                        for ( var x=0; x < data.newCards.length; x++ ) {
                            this.listView.trigger("onExternalAdd",data.newCards[x],{sbMakeSelected:true});
                        }
                        Spinner.get().hide(function(){
                            bsDialog.create({                    
                                title : "Paste Cards",
                                msg : "<p>" + data.newCards.length + " card(s) pasted</p>",
                                ok : function() {}
                            });
                        });
                    })
                    .fail(function(jqXHR,textStatus,errorThrown) {

                        Spinner.get().hide(function(){
                            app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                        });
                    })

                    // Whether we fail or succeed, the clipboard is now empty.
                    .always(function(a,textStatus,c){
                        this.clearClipboard();
                    });
                }
            }
        }

        // ADD

        else if ( buttonName.indexOf("add") !== -1 ) {

            // ADD SINGLE CARD

            if ( buttonName === "add_card" ) {
                this.displayForm("create",{urlIDs:this.settings.urlIDs});
            }

            // ADD CARD BATCH

            else if ( buttonName === "add_batch" ) {
                this.displayForm("batch",{urlIDs:this.settings.urlIDs});
            }
        }

        // DELETE

        else if ( buttonName === "delete" ) {

            // we must have some cards selected in our listView
            var cardsSelected = this.listView.getSelected();            
            if ( !cardsSelected.length ) {
                bsDialog.create({                    
                    title : "Delete Flashcards",
                    msg : "<p>You must select some cards first!</p>",
                    ok : function() {}
                });
            }

            else {

                // grab all of the cardIDs that they want to delete.

                var cardIDs = [];
                cardsSelected.each(function(idx,jqo){
                    var attrs = $(jqo).data("modelAttributes");
                    cardIDs.push(attrs.id);
                });

                // the user has selected some sets to delete. we will create the function to do so
                // and then attach it to the "OK" button of a bootstrap dialog (modal).            

                okayFunction = function() {

                    // prevents them from copying/cutting stuff onto the clipboard, deleting them, and then
                    // trying to paste them.
                    this.clearClipboard();

                    Spinner.get().show({msg:"Removing...",opacity:0});

                    $.ajax({
                        url : app.JS_ROOT + "ajax/studying/cards-manual.php/delete/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID + "/" + this.settings.urlIDs.sID,
                        type : "POST",            
                        data : JSON.stringify(cardIDs),
                        dataType : "json",
                        contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
                        context : this,
                        beforeSend : function(jqxhr,options) {
                            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                        },
                    })
                    .done(function(data,textStatus,jqXHR) {

                        // upon success, we receive an array of all the cardIDs that were deleted. if it doesn't
                        // match the list that we originally sent, the server would have generated an error.
                        
                        // note: for working and broken examples of using for loop values in closures, see
                        // http://jsfiddle.net/UWzcd/2/

                        // the function that receives the event for "onExternalRemove" expects the parameter
                        // to be a function that can be used as a matching function when iterating through
                        // the collection of models that make up the listView.

                        for ( var x=0; x < data.cardIDs.length; x++ ) {
                            (function(cardID){
                                this.listView.trigger("onExternalRemove",function(o){
                                    return (o.id === cardID);
                                });
                            }.bind(this))(data.cardIDs[x]);
                        }
                        Spinner.get().hide();
                    })
                    .fail(function(jqXHR,textStatus,errorThrown) {

                        Spinner.get().hide(function(){
                            app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                        });
                    });

                }.bind(this);

                // show the dialog to ensure that they really want this.

                bsDialog.create({                    
                    title : "Delete Flashcards",
                    msg : "<p>Are you sure you want to delete these cards? WARNING: THIS CANNOT BE UNDONE!</p>",
                    ok : okayFunction,
                    cancel : function(){}
                });
            }
        }

        // TEST

        else if ( buttonName.indexOf("test_") !== -1 ) {

            // TAKE

            if ( buttonName === "test_take" ) {

                var setIDs = [this.settings.urlIDs.sID];
                var keywords = app.store.get("card.filter.keywords") || [];
                var tags = app.store.get("card.filter.tags") || [];

                bsDialog.create({
                    title: "Take Test",
                    msg : "<p>Do you want to take a test comprised of this set and any filter information you have selected?</p>",
                    ok : function() {
                        app.store.rem("tests.manual");
                        app.store.set("tests.manual",{
                            module_id : this.settings.urlIDs.mID,
                            setIDs : setIDs,
                            keywords : keywords,
                            tags : tags
                        });
                        app.router.navigate(
                            "studying/taketest/manual/",
                            {trigger:true}
                        );
                    }.bind(this),
                    cancel : function() {}
                });
            }

            // SAVE AS

            else if ( buttonName === "test_save" ) {

                // we are operating only on the current set and we only require
                // its ID. open the form so the user can fill out the rest of the test's
                // information.

                app.store.rem("test.save",true); // empty all
                app.store.set("test.save.setIDs",[this.settings.urlIDs.sID]);
                this.displayForm("saveTest",{urlIDs:this.settings.urlIDs});
            }
        }

        // FILTER SET

        else if ( buttonName === "filter_set" ) {
            this.displayForm("filter");
        }

        // FILTER CLEAR

        else if ( buttonName === "filter_clear" ) {
            app.store.rem("card.filter",true);
            this.refresh();
        }
    },    

    ///////////////////////////////////////////////////////////////////////////
    // The formView that was opened has successfully "saved" whatever the user
    // entered. Depending on the formView that was instantiated, highlighted
    // by the `formName` param, our actions will differ.
    //
    //  @formName:  The `formName` property of the VBaseWidgetForm-derived view
    //              that was submitted.
    //
    //  @formData:  The data serialized from the form. The structure of this
    //              may change significantly depending on the type of formView
    //              we're working with.
    //
    //  @options:   Any flags that were set along our chain of function calls
    //              that got us here. They will relate directly to the action
    //              of "saving". They may include our own options ("sb...") and
    //              backbone-related options.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) { /* overloaded */

        switch ( formName ) {
            
            // new card has been created, we don't close the form (they can
            // keep adding).
            case "create":
                this.listView.trigger("onExternalAdd",formData,options);
                break;

            // we have received an array of new cards from the server. we are going to add them
            // to the listView. the parameters for "onExternalAdd" are: (attrObject, options)
            // since backbone options can be sent to the function that is bound to this event,
            // we are identifying our proprietary options with the `sb` prefix.
            case "batch":
                var newCards = formData;
                for ( var x=0; x < newCards.length; x++ ) {
                    this.listView.trigger("onExternalAdd",newCards[x],{sbMakeSelected:true});
                }
                this.closeForm();
                bsDialog.create({                    
                    title : "Create Multiple Flashcards",
                    msg : "<p>"+newCards.length + " card(s) created</p>",
                    ok : function() {}
                });
                break;

            // setting a new filter.
            case "filter":                

                // clear existing filter and create new one, if we
                // have any values from the form to do so.

                var hadFilter = app.store.has("card.filter.tags") || app.store.has("card.filter.keywords");
                app.store.rem("card.filter",true);

                if ( formData.keywords.length || formData.tags.length ) {

                    // set the filter information in our store and refresh
                    // the page. the filter information will be checked by
                    // the `setDefaultToolbarEnabled` method and the
                    // filter button will be highlighted.
                    
                    app.store.set("card.filter.keywords",formData.keywords);
                    app.store.set("card.filter.tags",formData.tags);
                    this.refresh();
                }

                // nothing is on the filter.                
                else {

                    // clearing what we had before.
                    if ( hadFilter ) {
                        this.onClickToolbar("filter_clear",null);                        
                    }
                    // nothing to do.
                    else {
                        this.closeForm();
                    }
                }
                
                break;

            // test has been saved
            case "saveTest":

                this.listView.clearSelected();
                app.store.rem("test.save",true);
                this.closeForm();
                break;
        }
    }    

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsBreadcrumb
// Description: We inherit everything from VBaseWidgetBreadcrumb.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsBreadcrumb = VBaseWidgetBreadcrumb.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-breadcrumb",
    templateID : "tpl-widget-studying-browse-cards-breadcrumb",

    className : function() {
        return _.result(VBaseWidgetBreadcrumb.prototype,'className') + " breadcrumb widget-studying-browse-cards-breadcrumb";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBreadcrumb.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Given an array of objects, each representing enough information to
    // build a single crumb, we will construct an ordered array of objects that
    // each contain the following fields: .display, .href, .data.
    //
    //  @data:    
    //
    //      array of objects. will have a `crumbName` field to tell
    //      us what information is in a particular object.
    //
    //  @return:
    //
    //      An ordered array of objects, containing the fields mentioned above.
    //      Return `null` for failure.
    //          
    ///////////////////////////////////////////////////////////////////////////

    generateCrumbs : function(data) { /* overloaded */

        var crumbInfo = null; // from sent data
        var breadcrumb = []; // returned ary
        var crumb = {}; // goes into ary

        // moduleID

        crumbInfo = _.find(data,function(o){
            return o.crumbName === "moduleID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        
        var moduleID = crumbInfo.module_id;
        crumb.crumbDisplay = crumbInfo.subject_code + " " + crumbInfo.class_code + " (" + crumbInfo.semester_name + ", " + crumbInfo.year + ")";
        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/";
        crumb.crumbData = {urlIDs:{}};
        breadcrumb.push(crumb);

        // groupID.

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "groupID";
        });
        if ( !crumbInfo ) {
            return null;
        }

        var groupID = crumbInfo.id;
        if ( crumbInfo.id === "self" ) {
            crumb.crumbDisplay = "My Stuff";            
        }
        else if ( crumbInfo.id === "pub" ) {
            crumb.crumbDisplay = "Public Studygroup";
        }
        else {
            crumb.crumbDisplay = "Studygroup (" + crumbInfo.created_by_first_name + ")";
        }

        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID}};
        breadcrumb.push(crumb);

        // userID
        // NOTE: we are only interested in doing 'userID' if we do not have a groupID of "self". let's check
        // the data.

        selfCrumb = _.find(data,function(o){
            return ( ( o.crumbName === "groupID" ) && ( o.id === "self" ) );
        });        

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "userID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        var userID = crumbInfo.id;
        if ( !selfCrumb ) {
            crumb.crumbDisplay = crumbInfo.full_name;
            crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
            crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/" +  "g" + groupID + "/";
            crumb.crumbData = {urlIDs:{mID:moduleID,gID:groupID}};
            breadcrumb.push(crumb);
        }

        // typeID.

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "typeID";
        });
        if ( !crumbInfo ) {
            return null;
        }

        var typeID = crumbInfo.id;
        if ( crumbInfo.id === "cards" ) {
            crumb.crumbDisplay = "Flashcards";            
        }
        else if ( crumbInfo.id === "tests" ) {
            crumb.crumbDisplay = "Tests";
        }

        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/" + "g" + groupID + "/" + "u" + userID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID,gID:groupID,uID:userID}};
        breadcrumb.push(crumb);

        // setID.

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "setID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        crumb.crumbDisplay = crumbInfo.set_name + ( crumbInfo.description ? " (" + crumbInfo.description + ")" : "" );
        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/" + "g" + groupID + "/" + "u" + userID + "/" + typeID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID,gID:groupID,uID:userID,tID:typeID}};
        breadcrumb.push(crumb);
        
        return breadcrumb;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsFormBatch
// Description: This form is used to grab a single field of text (which will be parsed
//              elsewhere) and zero or more card tags. There is no server communication
//              here, just validation.
//
//              Two bootstrap events are created here: "onCreateSave" and
//              "onCreateCancel". These are triggered when that respective function
//              has completed (i.e., the form was validated), not just when
//              certain buttons are pushed.
//
//              The errors returned from the form's validation need to be an object
//              with two fields (.msg and .field). `field` should match the name
//              of a given input field on the form, so it can be highlighted.
//              
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsFormBatch = VBaseWidgetForm.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-form-batch",
    templateID : "tpl-widget-studying-browse-cards-form-batch",
    successAlertText : undefined, // not used
    formName : "batch",

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-studying-browse-cards-form-batch";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
        });
    },

    // the tags used to deliminate questions and answers in the massive text field that
    // we have to parse.

    questionTag : "{{q}}",
    answerTag : "{{a}}",

    ///////////////////////////////////////////////////////////////////////////
    // Setup the select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // we need to build our select2 instance.

        this.ws_tags = new WSelect2({
            elem : this.jqoForm.find("input[name=tags]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_tags.init({
            tags : _.map(
                _.filter(app.store.get("card.tags"),function(o){return !o.is_auto;}),
                function(o){
                    return {
                        id : o.id,
                        text : o.tag_text
                    }
                }
            ),
            preventNew : true
        });

    },

    ///////////////////////////////////////////////////////////////////////////
    // We only clear the textarea when this is called, we will leave the
    // tags as they are.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overloaded */
        this.jqoForm.find("textarea").val("");
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields from our select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        var attrs = this.jqoForm.serialize_object();

        // notice that we are getting the FULL record information for
        // the tags applied here, and sorting them based upon their text.

        attrs.tags = this.ws_tags.getSelection();
        if ( attrs.tags.length ) {
            var tags = [];
            for ( var x=0; x < attrs.tags.length; x++ ) {
                tags.push({id:attrs.tags[x].id,tag_text:attrs.tags[x].text,is_auto:0});
            }
            attrs.tags = _.sortBy(
                tags,
                function(o){
                    return o.tag_text;
                }
            );
        }

        // trim our string
        attrs.parse_text = $.trim(attrs.parse_text);

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The attributes have been pulled (and parsed) from the form. We will
    // validate them through attempting to save the model to the server. If
    // validation fails, the server will never be contacted. Of course, by
    // doing this, we also may run into a server error, which will be caught
    // by our event listeners as well.
    //
    //  @attrs: attributes hash returned from the form (after our manipulation).
    //
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function(attrs) { /* overloaded */

        // (1) tags - no duplicates

        if ( attrs.tags && attrs.tags.length ) {

            var uniqTags = _.uniq(attrs.tags);
            if ( uniqTags.length !== attrs.tags.length ) {
                return {
                    msg : "<strong>Tags</strong>: No duplicates",
                    field : "tags"
                };
            }
        }

        // (2) parse_text. the rules for this are as follows:
        //
        // (a) it must start on QUESTION_TAG
        // (b) after every ANSWER_TAG there must eventually be EOS or QUESTION_TAG - i.e., can't have back-to-back ANSWER_TAGs

        if ( !attrs.parse_text.length ) {
            return {
                msg : "<strong>Text</strong>: Please enter some text",
                field : "parse_text"
            };
        }

        // (a)
        else if ( attrs.parse_text.indexOf(this.questionTag) !== 0 ) {
            return {
                msg : "<strong>Text</strong>: Must begin with "+this.questionTag,
                field : "parse_text"
            };
        }

        // (b)
        else {

            // just look for back to back ANSWER_TAGs. we can test this quickly with a regular expression.
            // source: http://stackoverflow.com/questions/20980654/javascript-regular-expression-unbroken-repetitions-of-a-pattern
            //
            // FIXME: this must change everytime you change the question or answer tags. it needs to
            // include them here.

            if ( attrs.parse_text.match(/{\{a}}((?!{\{q}}).)*{\{a}}/) ) {
                return {
                    msg : "<strong>Text</strong>: Cannot have two consecutive "+this.answerTag+" blocks",
                    field : "parse_text"
                }
            }
        }

        // we are now going to parse the text and create a bunch of card models. we
        // return `null` to tell our caller that validation will be delayed and
        // automated, so we will deal with calling the respective success/error
        // functions ourselves (through our backbone event bindings).
        
        this.parseCards(attrs);
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has submitted the "card batch" form and now we need to
    // parse their text input into a number of cards (which may or may not
    // be notes or have answers). If we are here then we know the text
    // text is valid (i.e., cannot fail parse), so we needn't worry about that
    // here. If we successfully create the cards on the server then we call
    // `this.onAttrsValid` ourself.
    //
    //  @formData:  The attributes hash returned from the form. Contains
    //              `parse_text` and `tags`.
    //
    ///////////////////////////////////////////////////////////////////////////

    parseCards : function VWidgetStudyingBrowseCardsFormBatch__parseCards(formData) {

        var cardObjs = [];

        // (1) we go through the text and create individual card data objects.

        var currentPos = 0; // we know the string starts on QUESTION_TAG
        var nextQPos = 0;
        var nextAPos = 0;

        do {            

            var cardObj = {};
            cardObj.tags = _.clone(formData.tags);

            // figure out where our question_text ends. it could be:
            // (a) the answer
            // (b) the next question
            // (c) EOS

            nextQPos = formData.parse_text.indexOf(this.questionTag,currentPos+1);
            nextAPos = formData.parse_text.indexOf(this.answerTag,currentPos+1);
            var endPos = null;

            // (c)

            if ( ( nextAPos === -1 ) && ( nextQPos === -1 ) ) {
                endPos = undefined;
            }

            // (b)

            else if (
                        ( nextQPos !== -1 ) &&
                        (
                            ( nextAPos === -1 ) ||
                            (
                                ( nextAPos !== -1 ) &&
                                ( nextQPos < nextAPos )
                            )
                        )
                    )
            {
                endPos = nextQPos;
            }

            // (a)

            else {
                endPos = nextAPos;
            }

            cardObj.question_text = $.trim(formData.parse_text.substring(currentPos+this.questionTag.length,endPos));
            cardObj.answer_text = null;

            // if we have an answer, let's add it.

            if (
                    ( nextAPos !== -1 ) &&
                    (
                        ( nextQPos === -1 ) ||
                        ( nextAPos < nextQPos )
                    )
                )
            {
                // figure out where our answer_text ends. it could be:
                // be:
                // (a) the next question
                // (b) EOs
                
                var endPos = null;

                // (b)

                if ( nextQPos === -1 ) {
                    endPos = undefined;
                }
                else {
                    endPos = nextQPos;
                }

                cardObj.answer_text = $.trim(formData.parse_text.substring(nextAPos+this.answerTag.length,endPos));
            }

            // add the card to our array. if there is no answer, it's a note.

            if ( !cardObj.answer_text ) {
                cardObj.tags.push(
                    _.filter(
                        app.store.get("card.tags"),
                        function(o){return o.tag_text === "note"}
                    )[0]
                );
            }
            cardObjs.push(cardObj);

            // grab the next question.
            currentPos = formData.parse_text.indexOf(this.questionTag,currentPos+1);
        }
        while ( currentPos !== -1 );

        // (2)  we create those cards for real on the db. the db sends us back
        //      the updated records, which we return as our form's attributes
        //      in "onFormSave"

        Spinner.get().show({msg:"Creating cards...",opacity:0});

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/cards-manual.php/create_batch/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID + "/" + this.settings.urlIDs.sID,
            type : "POST",
            data : JSON.stringify(cardObjs),
            dataType : "json",
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {
            // we have received an array of new cards from the server. that will be the return
            // result from our form.
            this.onAttrsValid(data.newCards);
            data = null;
            Spinner.get().hide();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });        
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsFormCreate
// Description: This view houses a form that is filled out and submitted to create a new
//              model of a given type (defined by derived views). The request, invalid,
//              sync, and error events (from the model) are captured here and dealt with.
//              Alerts are displayed within the form as appropriate.
//
//              Methods dealing with the manipulation/presentation of the form itself
//              and parsing of the form data are overloaded; as is the method that
//              instantiates the model itself. Note that several models may be instantiated
//              over time, as multiple records may be created.
//
//              Two bootstrap events are created here: "onCreateSave" and
//              "onCreateCancel". These are triggered when that respective function
//              has completed (i.e., the model was successfuly saved), not just when
//              certain buttons are pushed. If you want to fiddle around with the model's
//              events directly, as a derived view, then you'll need to add your own hooks.
//
//              The errors returned from the model's validation need to be an object
//              with two fields (.msg and .field). `field` should match the name
//              of a given input field on the form, so it can be highlighted.
//              
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsFormCreate = VBaseWidgetFormCreate.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-form-create",
    templateID : "tpl-widget-studying-browse-cards-form-create",
    successAlertText : "New Card Added!",
    requestText : "Saving...",
    formName : "create",

    className : function() {
        return _.result(VBaseWidgetFormCreate.prototype,'className') + " widget-studying-browse-cards-form-create";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetFormCreate.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty our references.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.ws_tags = null;
        return VBaseWidgetFormCreate.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is the data type that we will be creating through our form.
    ///////////////////////////////////////////////////////////////////////////

    instantiateModel : function() { /* overloaded */
        var model = new CardModel();
        model.urlRoot = model.baseUrlRoot + "/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID + "/" + this.settings.urlIDs.sID;
        return model;
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Our creation form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // we need to build our select2 instance.

        this.ws_tags = new WSelect2({
            elem : this.jqoForm.find("input[name=tags]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_tags.init({
            tags : _.map(
                _.filter(app.store.get("card.tags"),function(o){return !o.is_auto;}),
                function(o){
                    return {
                        id : o.id,
                        text : o.tag_text
                    }
                }
            ),
            preventNew : true
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form. this will
    //      be used with `model.save` to try to update the model.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form. note that we have
        // to do the select2 instance separately. also notice
        // that we are getting the FULL record information for
        // the tags created here, and sorting them based upon
        // their text.

        var attrs = this.jqoForm.serialize_object();
        
        attrs.tags = this.ws_tags.getSelection();
        if ( attrs.tags.length ) {
            var tags = [];
            for ( var x=0; x < attrs.tags.length; x++ ) {
                tags.push({id:attrs.tags[x].id,tag_text:attrs.tags[x].text,is_auto:0});
            }
            attrs.tags = _.sortBy(
                tags,
                function(o){
                    return o.tag_text;
                }
            );
        }

        // trim all the strings
        attrs.order_id = +attrs.order_id;
        attrs.question_text = $.trim(attrs.question_text);
        attrs.answer_text = $.trim(attrs.answer_text);        

        // replace "" with null and true/false with 1/0
        attrs.answer_text = !attrs.answer_text.length ? null : attrs.answer_text;

        // add the 'note' tag if there is no answer.
        if ( !attrs.answer_text ) {
            attrs.tags = attrs.tags || [];
            attrs.tags.push(_.filter(
                    app.store.get("card.tags"),
                    function(o){return o.tag_text === "note"}
                )[0]
            );
        }

        return attrs;
    }

});

//---------------------------------------------------------------------------------------
// View:        VWidgetStudyingBrowseCardsFormFilter
// Description: We inherit everything from VBaseWidgetBrowseFormFilter.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsFormFilter = VBaseWidgetBrowseFormFilter.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-form-filter",

    className : function() {
        return _.result(VBaseWidgetBrowseFormFilter.prototype,'className') + " widget-studying-browse-cards-form-filter";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBrowseFormFilter.prototype,'events'),{
        });
    }
});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsFormSaveTest
// Description: This view houses a form that is filled out and submitted to create a new
//              model of a given type (defined by derived views). The request, invalid,
//              sync, and error events (from the model) are captured here and dealt with.
//              Alerts are displayed within the form as appropriate.
//
//              Methods dealing with the manipulation/presentation of the form itself
//              and parsing of the form data are overloaded; as is the method that
//              instantiates the model itself. Note that several models may be instantiated
//              over time, as multiple records may be created.
//
//              Two bootstrap events are created here: "onCreateSave" and
//              "onCreateCancel". These are triggered when that respective function
//              has completed (i.e., the model was successfuly saved), not just when
//              certain buttons are pushed. If you want to fiddle around with the model's
//              events directly, as a derived view, then you'll need to add your own hooks.
//
//              The errors returned from the model's validation need to be an object
//              with two fields (.msg and .field). `field` should match the name
//              of a given input field on the form, so it can be highlighted.
//              
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsFormSaveTest = VBaseWidgetFormCreate.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-form-save-test",
    templateID : "tpl-widget-studying-browse-cards-form-save-test",
    successAlertText : undefined, // not used
    requestText : "Saving...",
    formName : "saveTest",

    className : function() {
        return _.result(VBaseWidgetFormCreate.prototype,'className') + " widget-studying-browse-cards-form-save-test";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetFormCreate.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty our references.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.ws_sharing = null;
        return VBaseWidgetFormCreate.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is the data type that we will be creating through our form.
    ///////////////////////////////////////////////////////////////////////////

    instantiateModel : function() { /* overloaded */
        var model = new TestModel();
        model.urlRoot = model.baseUrlRoot + "/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID;
        return model;
    },

    ///////////////////////////////////////////////////////////////////////////
    // We require some data to be present on the form upon display. Prepare
    // that information now.
    ///////////////////////////////////////////////////////////////////////////

    getDefaultAttrsForTemplate : function() { /* overloaded */
        
        var attrs = {};        
        var keywords = app.store.get("card.filter.keywords");
        var tags = app.store.get("card.filter.tags");

        attrs.numSets = app.store.get("test.save.setIDs").length;
        attrs.numKeywords = keywords ? keywords.length : 0;
        attrs.numTags = tags ? tags.length : 0;

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our editing form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // we need to build our select2 instance.

        this.ws_sharing = new WSelect2({
            elem : this.jqoForm.find("input[name=sharing]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_sharing.init({
            data : _.map(
                app.store.get("sharing.types"),
                function(o){
                    var r = {};
                    r.id = r.text = o;
                    return r;
                }
            ),
            preventNew : true,
            placeholder : "e.g., public"
        });

        this.ws_sharing.set(this.attrs.get("sharing"));
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form. this will
    //      be used with `model.save` to try to update the model.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form. note that we have
        // to do the select2 instance separately.

        var attrs = this.jqoForm.serialize_object();
        attrs.sharing = this.ws_sharing.getSelection();
        if ( attrs.sharing.length ) {
            attrs.sharing = attrs.sharing[0].id;
        }
        else {
            attrs.sharing = null;
        }

        // trim all the strings
        attrs.test_name = $.trim(attrs.test_name);
        attrs.description = $.trim(attrs.description);        

        // replace "" with null and true/false
        attrs.description = !attrs.description.length ? null : attrs.description;

        // add in the information from our store regarding the sets and filter(s).

        var setIDs = app.store.get("test.save.setIDs");
        var keywords = app.store.get("card.filter.keywords");
        var tags = app.store.get("card.filter.tags");

        attrs.setIDs = setIDs;
        attrs.keywords = keywords ? keywords : [];
        attrs.tags = tags ? tags : [];

        return attrs;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsList
// Description: The list widget for the "browse cards" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-studying-browse-cards-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        var collection = new CardsCollection();
        if ( $.gettype(this.options.sbIsAscending).base !== "undefined" ) {
            collection.isAscending = this.options.sbIsAscending;
        }
        return collection;
    },

    instantiateModel : function() { /* overloaded */
        return new CardModel();
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Simple factory function. The settings and options have been built up
    // already by our base class. Add anything else we need.
    //
    //      settings:
    //
    //          .model
    //          .listSettings
    //
    //      options:
    //
    //          .listOptions
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateWidgetRecordEditable : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseCardsRecordEditable(settings,options);
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsRecordEditableDisplay
// Description: One of two possible subViews to a VWidgetStudyingBrowseCardsRecordEditable.
//              This particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-record-editable-display",
    templateID : "tpl-widget-studying-browse-cards-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-record-editable-display-flashcard widget-studying-browse-cards-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Any escaping of the text attributes or manipulation of the attributes in
    // any way/shape/form must be done here. Always operate on/return a cloned
    // copy of the model's attributes.
    ///////////////////////////////////////////////////////////////////////////

    filterModelAttributes : function() { /* overloaded */
        
        var attrs = _.clone(this.settings.recordSettings.model.attributes);

        // we use the pagedown markup on both the question and answer text.

        attrs.question_text = app.markdownSanitizerConverter.makeHtml(attrs.question_text);
        if ( attrs.answer_text ) {
            attrs.answer_text = app.markdownSanitizerConverter.makeHtml(attrs.answer_text);
        }

        return attrs;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsRecordEditableEdit
// Description: One of two possible subViews to a VWidgetStudyingBrowseCardsRecordEditable.
//              This particular view presents a form for editing the model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsRecordEditableEdit = VBaseWidgetRecordEditableEdit.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-record-editable-edit",
    templateID : "tpl-widget-studying-browse-cards-record-editable-edit",

    className : function() {
        return _.result(VBaseWidgetRecordEditableEdit.prototype,'className') + " widget-record-editable-edit-flashcard widget-studying-browse-cards-record-editable-edit";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableEdit.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Removing ourself from the DOM. Empty all references.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        this.ws_tags = null;
        return VBaseWidgetRecordEditableEdit.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our editing form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // we need to build our select2 instance.

        this.ws_tags = new WSelect2({
            elem : this.jqoForm.find("input[name=tags]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_tags.init({
            tags : _.map(
                _.filter(app.store.get("card.tags"),function(o){return !o.is_auto;}),
                function(o){
                    return {
                        id : o.id,
                        text : o.tag_text
                    }
                }
            ),
            preventNew : true
        });

        // we could use have the defaultTags option for ws_tags, but that wouldn't
        // have preserved the id/text separation if they remained present when saved.
        // in other words, upon checking the selection we'd get something like:
        // {id:"difficulty1",text:"difficulty1"}. by doing it this way, we get
        // separate id and text values if they remain selected upon saving.
        
        this.ws_tags.set(
            _.map(
                _.filter(this.settings.recordSettings.model.get("tags"),function(o){return !o.is_auto;}),
                function(o) {
                    return o.id;
                }
            )
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form. this will
    //      be used with `model.save` to try to update the model.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form. note that we have
        // to do the select2 instance separately.

        var attrs = this.jqoForm.serialize_object();
        
        attrs.tags = this.ws_tags.getSelection();
        if ( attrs.tags.length ) {
            var tags = [];
            for ( var x=0; x < attrs.tags.length; x++ ) {
                tags.push({id:attrs.tags[x].id,tag_text:attrs.tags[x].text,is_auto:0});
            }
            attrs.tags = _.sortBy(
                tags,
                function(o){
                    return o.tag_text;
                }
            );
        }

        // trim all the strings
        attrs.order_id = +attrs.order_id;
        attrs.question_text = $.trim(attrs.question_text);
        attrs.answer_text = $.trim(attrs.answer_text);        

        // replace "" with null and true/false with 1/0
        attrs.answer_text = !attrs.answer_text.length ? null : attrs.answer_text;

        // add the 'note' tag if there is no answer.
        if ( !attrs.answer_text ) {
            attrs.tags = attrs.tags || [];
            attrs.tags.push(_.filter(
                    app.store.get("card.tags"),
                    function(o){return o.tag_text === "note"}
                )[0]
            );
        }

        return attrs;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsRecordEditable
// Description: This widget is used to display a model's attributes and give the user the
//              ability to edit them. We have a toolbar, for the buttons relating to the
//              record (e.g., select, edit). By default, we provide functionality for
//              select, edit, and delete buttons; although they do not need to exist in
//              the toolbar, as they'll just not be used then. Note that a toolbar
//              itself is not actually required, it can be null and then won't be
//              processed.
//
//              Beyond the toolbarView, we also have a recordView which either displays
//              the model's attributes or an edit form.
//
//              The 'Select' button simply add/removes a class to the element created here.
//              Delete attempts to `destroy` the contained model and 'Edit' changes the
//              recordView (contained here) to either a VBaseWidgetRecordEditableDisplay- or
//              VBaseWidgetRecordEditableEdit-derived view.
//
//              Notice that we do not add ourselves to any parent element here, we
//              simply render out our information and then our owner view will render
//              us in the appropriate position.
//
//              We trigger three events here: onClickRecord, onRecordSave, onRecordDestroy.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-record-editable",
    templateID : "tpl-widget-studying-browse-cards-record-editable",
    flagDialogTitle : "Flag Flashcard",
    flagDialogMsg : "<p>Are you sure you want to flag this card as inappropriate?</p>",
    deleteDialogTitle : "Delete Flashcard",
    deleteDialogMsg : "<p>Are you sure you want to delete this card? WARNING: THIS CANNOT BE UNDONE!</p>",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-record-editable-flashcard widget-studying-browse-cards-record-editable";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },    

    ///////////////////////////////////////////////////////////////////////////
    // As the user might be able to edit/delete models here, we need to update
    // the model's urlRoot variable so we know how to contact the server.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        this.settings.model.urlRoot = this.settings.model.baseUrlRoot + "/" + this.settings.listSettings.urlIDs.mID + "/" + this.settings.listSettings.urlIDs.uID + "/" + this.settings.listSettings.urlIDs.sID;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Based upon our current state, and the particular user that's looking,
    // we will figure out which toolbar buttons are enabled.
    ///////////////////////////////////////////////////////////////////////////

    setToolbarButtonsEnabled : function() { /* overloaded and extended */

        VBaseWidgetRecordEditable.prototype.setToolbarButtonsEnabled.call(this);

        // if we aren't editing, then whether or not we can use certain
        // buttons will depend on whether this belongs to us

        var isUser = this.settings.listSettings.urlIDs.uID === app.store.get("user").id;

        if ( !this.isEditing ) {
            this.toolbarView.setEnabled({
                select : isUser,
                edit : isUser,
                flag : !isUser,
                delete : isUser
            });
        }
    },

    instantiateToolbarView : function() { /* overloaded */
        return new VWidgetStudyingBrowseCardsRecordEditableToolbar();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Specify the VBaseWidgetRecordEditableDisplay- and
    // VBaseWidgetRecordEditableDisplay-derived views we will use here.
    //
    // The settings and options have already been started by our base view.
    // They will include `recordSettings` (which contains `model`) and 
    // `recordOptions`, respectively. Add whatever we need that's unique here.
    ///////////////////////////////////////////////////////////////////////////    

    instantiateDisplayView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseCardsRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseCardsRecordEditableEdit(settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to either be saved or destroyed on the server. Display
    // the error to the user. We only get a `userError` on change:is_flagged, as 
    // they may be unsuccessful in applying their flag.
    //
    //  @options: All backbone.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VWidgetStudyingBrowseCardsRecordEditable__onModelError(model,xhr,options) { /* overloaded */

        Spinner.get().hide(function(){

            var userError = app.getAjaxUserError(xhr);

            if ( ( xhr.status === 400 ) && ( userError ) && ( ( userError.type === "flag-reputation" ) || ( userError.type === "flag-duplicate" ) ) ) {

                var msg = null;
                if ( userError.type === "flag-reputation" ) {
                    msg = "You are not able to flag any more content for the moment. Please give the administrators time to evaluate your previous flags.";
                }
                else {
                    msg = "You have already flagged that content. Please give the administrators time to evaluate your previous flag.";
                }
                
                bsDialog.create({
                    title : "Error!",
                    msg : "<p>"+msg+"</p>",
                    ok : function() {}
                });
            }
            else {
                app.dealWithAjaxFail(xhr,null,null);
            }

        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsRecordEditableToolbar
// Description: The toolbar for a VWidgetStudyingBrowseCardsRecordEditable.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsRecordEditableToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-record-editable-toolbar",
    templateID : "tpl-widget-studying-browse-cards-record-editable-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-cards-record-editable-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsToolbar
// Description: The toolbar for the "browse cards" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-toolbar",
    templateID : "tpl-widget-studying-browse-cards-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-cards-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VPageStudyingBrowseTests
// Description: This view represents the page where the user is able to browse all of the
//              tests that belong to a given user for a given module. The page contains a
//              breadcrumb, toolbar, and list of records; each represented by a subview.
//              Notice that forms are created for this view.
//
//              Several events are captured here: onClickBreadcrumb, onClickToolbar,
//              and onClickRecord. These are triggered by their  respective subviews. 
//              When our data has been loaded, we trigger an "onPageReady" event, letting 
//              our parent know that we are ready to render.
//
//              Again, there are no forms here.
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseTests = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-tests",
    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-studying-browse-tests";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePageBrowse.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty all our references
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.listData = null;
        this.breadcrumb = null;
        return VBasePageBrowse.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Update the help link in the footer.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePageBrowse.prototype.render.call(this);

        var href = this.$("div.sb-footer div.help a").prop("href");
        this.$("div.sb-footer div.help a").prop("href",href+"tests/");

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageStudyingBrowseTests__loadData() { /* overloaded */

        // we will be storing an array of sets, as well as a breadcrumb
        this.listData = null;
        this.breadcrumb = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading tests...",opacity:0});

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/tests-manual.php/fetch/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.gID + "/" + this.settings.urlIDs.uID,
            type : "POST",            
            data : JSON.stringify({
                includeAuto:!app.store.has("tests.hide_auto")
            }),
            dataType : "json",
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            this.listData = data.tests;
            this.breadcrumb = data.breadcrumb;

            this.ready();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {

            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // When the `content` element is rendered, using the `content` template,
    // this function provides the attributes hash to be sent to that template.
    ///////////////////////////////////////////////////////////////////////////

    getContentAttributes : function() { /* overloaded */
        return {
            heading : "Tests"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the breadcrumb, toolbar, and list views for this 
    // particular page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() { /* overloaded */
        return new VWidgetStudyingBrowseTestsBreadcrumb({
            data:this.breadcrumb
        });
    },

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseTestsToolbar();
    },

    instantiateListView : function() { /* overloaded */
        var options = {};
        if ( app.store.has("tests.isAscending") ) {
            options.sbIsAscending = app.store.get("tests.isAscending");
        }
        return new VWidgetStudyingBrowseTestsList(
            {
                listData:this.listData,
                urlIDs:this.settings.urlIDs
            },
            options
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, the user is always able to sort and hide_auto (toggle).
    // Delete is only available if the user owns the tests being displayed.
    // If "hide_auto" is currently on, then highlight that button.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() { /* overloaded */

        var isUser = this.settings.urlIDs.uID === app.store.get("user").id;

        // we will set the text of the display/sort button. always assume ascending by default.
        this.toolbarView.getButton("display_sort").html(app.store.has("tests.isAscending") ? ( app.store.get("tests.isAscending") ? "Sort Descending" : "Sort Ascending" ) : "Sort Descending" );

        this.toolbarView.setEnabled({
            display:true,
            hide_auto:true,
            delete:isUser
        });

        // hide_auto is on?

        var hideAuto = app.store.has("tests.hide_auto");
        if ( hideAuto ) {
            this.toolbarView.getButton("hide_auto").removeClass("btn-default").addClass("btn-warning");
        }
    },

    /*
        Trigger Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked one of the crumbs in our breadcrumb. All of the
    // information we require can be found in the `crumb` object passed to us.
    // In particular, we want the `urlIDs` inside it, as they will tell us what
    // position in the browsing hierarchy we should go to after clicking this
    // crumb.
    //
    //  @crumb: the data object from the VBaseBreadcrumbCrumb view. contains
    //          `.urlIDs`.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickBreadcrumb : function(crumb) {
        this.trigger("setPage",{
            urlIDs : crumb.urlIDs
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, as well as the event that started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function VPageStudyingBrowseTests__onClickToolbar(buttonName,event) {

        // DISPLAY

        if ( buttonName.indexOf("display") !== -1 ) {

            // SORT

            if ( buttonName === "display_sort" ) {
                var isAscending = !this.listView.collection.isAscending;
                app.store.set("tests.isAscending",isAscending);
                app.saveUserSettings();
                this.refresh();
            }
        }

        // HIDE AUTO (toggle)

        else if ( buttonName === "hide_auto" ) {

            // either highlight the 'show auto' button or make it plain again, depending on
            // whether or not we're showing auto sets.
            var wasHidingAuto = app.store.has("tests.hide_auto");

            if ( wasHidingAuto ) {
                app.store.rem("tests.hide_auto");
            }
            else {
                app.store.set("tests.hide_auto",true);
            }

            this.refresh();
        }

        // DELETE

        else if ( buttonName === "delete" ) {

            // we must have some sets selected in our listView
            var testsSelected = this.listView.getSelected();            
            if ( !testsSelected.length ) {
                bsDialog.create({                    
                    title : "Delete Tests",
                    msg : "<p>You must select some tests first!</p>",
                    ok : function() {}
                });
            }

            else {

                // grab all of the testIDs that they want to delete.

                var testIDs = [];
                testsSelected.each(function(idx,jqo){
                    var attrs = $(jqo).data("modelAttributes");
                    testIDs.push(attrs.id);
                });

                // the user has selected some sets to delete. we will create the function to do so
                // and then attach it to the "OK" button of a bootstrap dialog (modal).            

                okayFunction = function() {

                    Spinner.get().show({msg:"Removing...",opacity:0});

                    $.ajax({
                        url : app.JS_ROOT + "ajax/studying/tests-manual.php/delete/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID,
                        type : "POST",            
                        data : JSON.stringify(testIDs),
                        dataType : "json",
                        contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
                        context : this,
                        beforeSend : function(jqxhr,options) {
                            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                        },
                    })
                    .done(function(data,textStatus,jqXHR) {

                        // upon success, we receive an array of all the testIDs that were deleted. if it doesn't
                        // match the list that we originally sent, the server would have generated an error.
                        
                        // note: for working and broken examples of using for loop values in closures, see
                        // http://jsfiddle.net/UWzcd/2/

                        // the function that receives the event for "onExternalRemove" expects the parameter
                        // to be a function that can be used as a matching function when iterating through
                        // the collection of models that make up the listView.

                        for ( var x=0; x < data.testIDs.length; x++ ) {
                            (function(testID){
                                this.listView.trigger("onExternalRemove",function(o){
                                    return (o.id === testID);
                                });
                            }.bind(this))(data.testIDs[x]);
                        }
                        Spinner.get().hide();
                    })
                    .fail(function(jqXHR,textStatus,errorThrown) {

                        Spinner.get().hide(function(){
                            app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                        });
                    });

                }.bind(this);

                // show the dialog to ensure that they really want this.

                bsDialog.create({                    
                    title : "Delete Tests",
                    msg : "<p>Are you sure you want to delete these tests? WARNING: THIS CANNOT BE UNDONE!</p>",
                    ok : okayFunction,
                    cancel : function(){}
                });
            }
        }
        
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTestsBreadcrumb
// Description: We inherit everything from VBaseWidgetBreadcrumb.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTestsBreadcrumb = VBaseWidgetBreadcrumb.extend({

    /* overloaded */
    id : "widget-studying-browse-tests-breadcrumb",
    templateID : "tpl-widget-studying-browse-tests-breadcrumb",

    className : function() {
        return _.result(VBaseWidgetBreadcrumb.prototype,'className') + " breadcrumb widget-studying-browse-tests-breadcrumb";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBreadcrumb.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Given an array of objects, each representing enough information to
    // build a single crumb, we will construct an ordered array of objects that
    // each contain the following fields: .display, .href, .data.
    //
    //  @data:    
    //
    //      array of objects. will have a `crumbName` field to tell
    //      us what information is in a particular object.
    //
    //  @return:
    //
    //      An ordered array of objects, containing the fields mentioned above.
    //      Return `null` for failure.
    //          
    ///////////////////////////////////////////////////////////////////////////

    generateCrumbs : function(data) { /* overloaded */

        var crumbInfo = null; // from sent data
        var breadcrumb = []; // returned ary
        var crumb = {}; // goes into ary

        // moduleID

        crumbInfo = _.find(data,function(o){
            return o.crumbName === "moduleID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        
        var moduleID = crumbInfo.module_id;
        crumb.crumbDisplay = crumbInfo.subject_code + " " + crumbInfo.class_code + " (" + crumbInfo.semester_name + ", " + crumbInfo.year + ")";
        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/";
        crumb.crumbData = {urlIDs:{}};
        breadcrumb.push(crumb);

        // groupID.

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "groupID";
        });
        if ( !crumbInfo ) {
            return null;
        }

        var groupID = crumbInfo.id;
        if ( crumbInfo.id === "self" ) {
            crumb.crumbDisplay = "My Stuff";            
        }
        else if ( crumbInfo.id === "pub" ) {
            crumb.crumbDisplay = "Public Studygroup";
        }
        else {
            crumb.crumbDisplay = "Studygroup (" + crumbInfo.created_by_first_name + ")";
        }

        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID}};
        breadcrumb.push(crumb);

        // userID
        // NOTE: we are only interested in doing 'userID' if we do not have a groupID of "self". let's check
        // the data.

        selfCrumb = _.find(data,function(o){
            return ( ( o.crumbName === "groupID" ) && ( o.id === "self" ) );
        });        

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "userID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        var userID = crumbInfo.id;
        if ( !selfCrumb ) {
            crumb.crumbDisplay = crumbInfo.full_name;
            crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
            crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/" +  "g" + groupID + "/";
            crumb.crumbData = {urlIDs:{mID:moduleID,gID:groupID}};
            breadcrumb.push(crumb);
        }

        // typeID.

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "typeID";
        });
        if ( !crumbInfo ) {
            return null;
        }

        var typeID = crumbInfo.id;
        if ( crumbInfo.id === "cards" ) {
            crumb.crumbDisplay = "Flashcards";            
        }
        else if ( crumbInfo.id === "tests" ) {
            crumb.crumbDisplay = "Tests";
        }

        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/" + "g" + groupID + "/" + "u" + userID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID,gID:groupID,uID:userID}};
        breadcrumb.push(crumb);
        
        return breadcrumb;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTestsList
// Description: The list widget for the "browse tests" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTestsList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-studying-browse-tests-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-studying-browse-tests-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        var collection = new TestsCollection();
        if ( $.gettype(this.options.sbIsAscending).base !== "undefined" ) {
            collection.isAscending = this.options.sbIsAscending;
        }
        return collection;
    },

    instantiateModel : function() { /* overloaded */
        return new TestModel();
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Simple factory function. The settings and options have been built up
    // already by our base class. Add anything else we need.
    //
    //      settings:
    //
    //          .model
    //          .listSettings
    //
    //      options:
    //
    //          .listOptions
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateWidgetRecordEditable : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseTestsRecordEditable(settings,options);
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTestsRecordEditableDisplay
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTestsRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : "widget-studying-browse-tests-record-editable-display",
    templateID : "tpl-widget-studying-browse-tests-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-studying-browse-tests-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTestsRecordEditableEdit
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view presents a form for editing the model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTestsRecordEditableEdit = VBaseWidgetRecordEditableEdit.extend({

    /* overloaded */
    id : "widget-studying-browse-tests-record-editable-edit",
    templateID : "tpl-widget-studying-browse-tests-record-editable-edit",

    className : function() {
        return _.result(VBaseWidgetRecordEditableEdit.prototype,'className') + " widget-studying-browse-tests-record-editable-edit";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableEdit.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Removing ourself from the DOM. Empty all references.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        this.ws_sharing = null;
        return VBaseWidgetRecordEditableEdit.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our editing form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // we need to build our select2 instance.

        this.ws_sharing = new WSelect2({
            elem : this.jqoForm.find("input[name=sharing]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_sharing.init({
            data : _.map(
                app.store.get("sharing.types"),
                function(o){
                    var r = {};
                    r.id = r.text = o;
                    return r;
                }
            ),
            preventNew : true,
            placeholder : "e.g., public"
        });

        this.ws_sharing.set(this.settings.recordSettings.model.get("sharing"));
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form. this will
    //      be used with `model.save` to try to update the model.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form. note that we have
        // to do the select2 instance separately.

        var attrs = this.jqoForm.serialize_object();
        attrs.sharing = this.ws_sharing.getSelection();
        if ( attrs.sharing.length ) {
            attrs.sharing = attrs.sharing[0].id;
        }
        else {
            attrs.sharing = null;
        }

        // trim all the strings
        attrs.test_name = $.trim(attrs.test_name);
        attrs.description = $.trim(attrs.description);        

        // replace "" with null
        attrs.description = !attrs.description.length ? null : attrs.description;

        return attrs;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTestsRecordEditable
// Description: This widget is used to display a model's attributes and give the user the
//              ability to edit them. We have a toolbar, for the buttons relating to the
//              record (e.g., select, edit). By default, we provide functionality for
//              select, edit, and delete buttons; although they do not need to exist in
//              the toolbar, as they'll just not be used then. Note that a toolbar
//              itself is not actually required, it can be null and then won't be
//              processed.
//
//              Beyond the toolbarView, we also have a recordView which either displays
//              the model's attributes or an edit form.
//
//              The 'Select' button simply add/removes a class to the element created here.
//              Delete attempts to `destroy` the contained model and 'Edit' changes the
//              recordView (contained here) to either a VBaseWidgetRecordEditableDisplay- or
//              VBaseWidgetRecordEditableEdit-derived view.
//
//              Notice that we do not add ourselves to any parent element here, we
//              simply render out our information and then our owner view will render
//              us in the appropriate position.
//
//              We trigger two events here: onRecordSave, onRecordDestroy.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTestsRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : "widget-studying-browse-tests-record-editable",
    templateID : "tpl-widget-studying-browse-tests-record-editable",
    flagDialogTitle : "Flag Test",
    flagDialogMsg : "<p>Are you sure you want to flag this test as inappropriate?</p>",
    deleteDialogTitle : "Delete Test",
    deleteDialogMsg : "<p>Are you sure you want to delete this test? WARNING: THIS CANNOT BE UNDONE!</p>",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-studying-browse-tests-record-editable";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },    

    ///////////////////////////////////////////////////////////////////////////
    // As the user might be able to edit/delete models here, we need to update
    // the model's urlRoot variable so we know how to contact the server.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        this.settings.model.urlRoot = this.settings.model.baseUrlRoot + "/" + this.settings.listSettings.urlIDs.mID + "/" + this.settings.listSettings.urlIDs.uID;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Based upon our current state, and the particular user that's looking,
    // we will figure out which toolbar buttons are enabled.
    ///////////////////////////////////////////////////////////////////////////

    setToolbarButtonsEnabled : function() { /* overloaded and extended */

        VBaseWidgetRecordEditable.prototype.setToolbarButtonsEnabled.call(this);

        // if we aren't editing, then only 'take' is always available
        // to us. however, the rest are only available if the test record belongs to us
        // AND is not an auto_test, except for info which is available on anything but
        // an auto test.

        var isUser = this.settings.listSettings.urlIDs.uID === app.store.get("user").id;
        var notAuto = !this.settings.model.get("is_auto_test");

        if ( !this.isEditing ) {
            this.toolbarView.setEnabled({
                info : notAuto,
                take : true,
                select : isUser&&notAuto,
                edit : isUser&&notAuto,
                flag : !isUser&&notAuto,
                delete : isUser&&notAuto
            });
        }
    },

    instantiateToolbarView : function() { /* overloaded */
        return new VWidgetStudyingBrowseTestsRecordEditableToolbar();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Specify the VBaseWidgetRecordEditableDisplay- and
    // VBaseWidgetRecordEditableDisplay-derived views we will use here.
    //
    // The settings and options have already been started by our base view.
    // They will include `recordSettings` (which contains `model`) and 
    // `recordOptions`, respectively. Add whatever we need that's unique here.
    ///////////////////////////////////////////////////////////////////////////    

    instantiateDisplayView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseTestsRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseTestsRecordEditableEdit(settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // One of the toolbar buttons that is associated directly with this record
    // has been clicked. The base view deals with some of the buttons, and we
    // deal with the leftovers.
    //
    //  @buttonName - the `name` field from the HTML of the buttton.
    //  @event - raw 'click' event data.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,event) { /* overloaded and extend */

        // our base view will deal with `select`, `edit`, and `delete`.
        VBaseWidgetRecordEditable.prototype.onClickToolbar.call(this,buttonName,event);

        // we will deal with the two unique ones here:

        // INFO

        if ( buttonName === "info" ) {

            // we have to build the attributes for the information template. first thing we
            // have to do is convert our tag IDs into strings of text.

            var tagsText = _.map(
                this.settings.model.get("tags"),
                function(id){
                    var obj = _.find(
                        app.store.get("card.tags"),
                        function(o){
                            return o.id===id;
                        }
                    )

                    return obj.tag_text;
                }
            );

            // convert the tags text and keywords text into strings for display

            tagsText = tagsText.length ? tagsText.join(", ") : "None";
            var keywordsText = this.settings.model.get("keywords").length ? this.settings.model.get("keywords").join(", ") : "None";

            // if we have an is_auto_test here, then there is no detailed setsInfo 
            // (as that information is stored in the test itself, with the name and description).

            var attrs = {};
            if ( this.settings.model.get("is_auto_test") ) {
                attrs = {
                    num_cards : this.settings.model.get("num_cards"),
                    setsInfo : null
                };
            }
            else {
                attrs = _.extend({},this.settings.model.attributes,{tagsText:tagsText,keywordsText:keywordsText});
            }

            // generate the HTML content for our bootstrap modal and then display it.            

            var html = $.includejs.getTemplate("tpl-widget-studying-browse-tests-record-editable-info",attrs);
            bsDialog.create({                
                title : "Test Information",
                msg : html,
                ok : function() {}
            });
        }

        // TAKE TEST

        else if ( buttonName === "take" ) {

            var id = this.settings.model.get("id");
            var isAuto = this.settings.model.get("is_auto_test");
            app.router.navigate(
                isAuto ? "studying/taketest/auto/"+id+"/" : "studying/taketest/"+id+"/",
                {trigger:true}
            );
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to either be saved or destroyed on the server. Display
    // the error to the user. We only get a `userError` on change:is_flagged, as 
    // they may be unsuccessful in applying their flag.
    //
    //  @options: All backbone.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VWidgetStudyingBrowseTestsRecordEditable__onModelError(model,xhr,options) { /* overloaded */

        Spinner.get().hide(function(){

            var userError = app.getAjaxUserError(xhr);

            if ( ( xhr.status === 400 ) && ( userError ) && ( ( userError.type === "flag-reputation" ) || ( userError.type === "flag-duplicate" ) ) ) {

                var msg = null;
                if ( userError.type === "flag-reputation" ) {
                    msg = "You are not able to flag any more content for the moment. Please give the administrators time to evaluate your previous flags.";
                }
                else {
                    msg = "You have already flagged that content. Please give the administrators time to evaluate your previous flag.";
                }
                
                bsDialog.create({
                    title : "Error!",
                    msg : "<p>" + msg + "</p>",
                    ok : function() {}
                });
            }
            else {
                app.dealWithAjaxFail(xhr,null,null);
            }

        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTestsRecordEditableToolbar
// Description: The toolbar for a VWidgetStudyingBrowseTestsRecordEditable.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTestsRecordEditableToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-tests-record-editable-toolbar",
    templateID : "tpl-widget-studying-browse-tests-record-editable-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-tests-record-editable-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTestsToolbar
// Description: The toolbar for the "browse tests" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTestsToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-tests-toolbar",
    templateID : "tpl-widget-studying-browse-tests-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-tests-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VSectionTestsTake
// Description: This is the section, or parent, view for the entire "Tests"->"Take"
//              section, which may be sent an autoSetID or a testID.
//---------------------------------------------------------------------------------------

var VSectionStudyingTakeTest = VBaseSection.extend({

    /* overloaded */
    id : "section-tests-browse",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : "studying",

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-tests-take";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseSection.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Although the page can change within this section, we never change the
    // URL. Accordingly, all we'll do here is ensure that the URL is valid.
    // The `urlIDs` that we get contain either a .tID or .aID.
    //
    //  @options:   Not used.
    //
    //  @return
    //
    //      If `null` is sent back, that means that we don't have to
    //      change the URL at all. `false` is returned for an error (404), and
    //      a string is returned on success.
    //
    ///////////////////////////////////////////////////////////////////////////

    setURL : function(settings,options) { /* overloaded */

        // we receive either urlIDs, for a single test/autoset, or 
        // manualData for a make-shift test.

        if ( settings.urlIDs ) {

            // we will have been given either tID (testID) or aID (autoSetID). we
            // must have one, we cannot have both, and they must an be integer.

            var urlIDs = settings.urlIDs;

            for ( id in urlIDs ) {
                if ( $.gettype(urlIDs[id]).base !== "undefined" ) {
                    urlIDs[id] = +urlIDs[id];
                    if ( $.gettype(urlIDs[id]).base !== "number" ) {
                        return false;
                    }
                }
            }

            if ( ( !urlIDs.tID && !urlIDs.aID ) || ( urlIDs.tID && urlIDs.aID ) ) {
                return false;
            }
        }

        else if ( settings.manualData ) {

            if (
                    ( $.gettype(settings.manualData.setIDs).base !== "array" ) ||
                    ( !settings.manualData.setIDs.length ) 
                )
            {
                return false;
            }

        }

        // need one or the other.

        else {
            return false;
        }

        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The page is changing within the section. The `urlIDs` do not change as
    // we progress through the pages, only the "pageName" does. And we needn't
    // worry about anything being valid or not, as we set the values ourselves.
    //
    //  @options:   Not used.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {

        var newPageView = null;

        switch ( settings.pageName ) {

            // information before test starts
            case "intro":
                newPageView = new VPageTestsTakeIntro(settings,options);
                break;

            // actually doing the test
            case "doing":
                newPageView = new VPageTestsTakeDoing(settings,options);
                break;

            // test has been completed: review.
            case "outro":
                newPageView = new VPageTestsTakeOutro(settings,options);
                break;
        }

        return newPageView;
    }

});

//---------------------------------------------------------------------------------------
// View: VPageTestsTakeIntro
// Description: This is the page that is presented just before a user begins a test.
//              We are responsible for loading the test itself from the server. We
//              present the user with a panel (test info) and a small form that
//              enables them to set the test's settings (e.g., sort order, etc.)
//              Accordingly, we have two subViews here.
//
//              Notice that we never generate "onPageFailed" here.
//---------------------------------------------------------------------------------------

var VPageTestsTakeIntro = VBasePage.extend({

    /* overloaded */
    id : "page-tests-take-intro",    
    pageTemplateID : "tpl-page",    
    contentElement : "div.page-content",
    footerElement : "div.page-footer-user",    
    footerTemplateID : "tpl-page-footer-user",
    contentTemplateID : "tpl-page-content-tests-take-intro", // optional

    /* overload */
    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-tests-take-intro";
    },

    panelElement : "div.page-content > div.content-panel",
    formElement : "div.page-content > div.content-form",

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally sent to `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        this.panelView = null;
        this.formView = null;

        VBasePage.prototype.initialize.call(this,settings,options); // copies over parms.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    //
    // If we want to show a spinner at this point we'll have to do so ourselves.
    //
    //  Note:   The data for the listView must be stored into `this.listData`
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageTestsTakeIntro__loadData() { /* overloaded */

        // we will be grabbing the test from the server here
        this.test = null;

        // we are getting either a regular test, an auto set, or a
        // manual test.

        var type = null;
        var id = null;
        var manualTest = null;

        if ( this.settings.urlIDs ) {
            type = ( !!this.settings.urlIDs.aID ? "auto" : "regular" );
            id = ( type === "auto" ? this.settings.urlIDs.aID : this.settings.urlIDs.tID );
        }

        else {
            type = "manual";
            manualTest = this.settings.manualData;
        }

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading test...",opacity:0});
        
        var jqXHR = $.ajax({
            url : app.JS_ROOT + "ajax/studying/tests-manual.php/take",
            type : "POST",            
            data : JSON.stringify({
                type : type,
                id : id,
                manualTest : manualTest
            }),
            dataType : "json",
            contentType : "application/json",
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            if ( data.test ) {
            
                this.test = data.test;

                // we are going to sort the sets of our test into the REVERSE order
                // than they would have in the regular `list` widget. this is because
                // that sort order puts the newest ones (e.g., "Chapter 10") before the
                // earlier ones (e.g., "Chapter 01"). However, in this case, we want them
                // to be from earliest -> latest. notice that to do this all we have
                // to do is sort them in ascending order by their name + description.

                this.test.setsInfo = _.sortBy(
                    this.test.setsInfo,
                    function(o) {
                        return ( o.set_name + ( o.description ? o.description : "" ) );
                    }
                );
            }

            data = null;
            this.ready();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // All of the data has been loaded that the page requires. We will
    // construct our subviews and then trigger an event notifying whoever is
    // listening that we're ready to render.
    ///////////////////////////////////////////////////////////////////////////

    ready : function() { /* overloaded */

        // if we do not have a test then we have failed to load the page

        if ( !this.test ) {
            this.trigger("onPageFailed",this);
            return;
        }

        var panelSettings = _.extend({},this.settings,{templateAttrs:this.buildPanelAttrs()});
        this.panelView = new VWidgetTestsTakeIntroPanel(panelSettings,{});

        this.formView = new VWidgetTestsTakeIntroFormSettings(this.settings,{});        
        
        this.panelView.listenTo(this,"cleanup",this.panelView.remove);
        this.formView.listenTo(this,"cleanup",this.formView.remove);

        this.listenTo(this.panelView,"onPanelOK",this.onPanelOK);
        this.listenTo(this.formView,"onFormSubmit",this.onFormSubmit);

        this.trigger("onPageReady",this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Cleanup ourselves and all subviews.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        // empty references
        this.stopListening(this.panelView);
        this.stopListening(this.formView);
        this.panelView = null;
        this.formView = null;                
        this.test = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton of the page through base, then render our widgets.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);

        this.$(this.panelElement).html(this.panelView.render().$el);
        this.$(this.formElement).html(this.formView.render().$el);

        if ( this.test.is_auto_test ) {
            this.panelView.disableOKButton();
        }

        if ( !this.test.num_cards ) {
            this.formView.disableSaveButton();
        }

        return this;
    },

    /*
        Triggered Events.
    */    

    ///////////////////////////////////////////////////////////////////////////
    // The panel's "ok" button has been pressed. We will display more information
    // about the test in a dialog.
    ///////////////////////////////////////////////////////////////////////////

    onPanelOK : function() {
        
        var html = $.includejs.getTemplate("tpl-widget-tests-take-intro-panel-more-info",this.test);

        bsDialog.create({                
            title : "Test Information",
            msg : html,
            ok : function(){}
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The formView that was opened has successfully "saved" whatever the user
    // entered. Depending on the formView that was instantiated, highlighted
    // by the `formName` param, our actions will differ.
    //
    //  @formName:  The `formName` property of the VBaseWidgetForm-derived view
    //              that was submitted.
    //
    //  @formData:  The data serialized from the form. The structure of this
    //              may change significantly depending on the type of formView
    //              we're working with.
    //
    //  @options:   Any flags that were set along our chain of function calls
    //              that got us here. They will relate directly to the action
    //              of "saving". They may include our own options ("sb...") and
    //              backbone-related options.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) { /* overloaded */

        if ( formName === "settings" ) {
            
            /*
                From the form, we have:
                .randomize
                .display_set_name
                .display_card_tags
                .show_remaining
            */

            // now, our slideshow widget expects us to send an array of objects,
            // which will be converted into a collection in the widget. however,
            // we must sort the array ourselves, as the collection will NOT be
            // sorted when it is passed to the widget. that widget only sorts
            // new items that are added (and we never add anything in our use
            // of the widget here).

            // note that we already sorted our sets in the REVERSE order
            // than they would have been in the regular `list` widget, in `loadData`.

            // now if we aren't randomizing cards, we will just add them in order to
            // the `cards` array.

            var orderedCards = [];

            if ( !formData.randomize ) {

                // separate all the cards based upon their set_id
                var cardsGroupedBySet = _.groupBy(
                    this.test.cards,
                    "set_id"
                );

                // go through all of our sets
                for ( var s=0; s < this.test.setsInfo.length; s++ ) {

                    // grab the cards that belong to that set and
                    // then sort them in ascending order by `order_id`.
                    // notice that this is again the REVERSE for how
                    // they're sorted in normal list widget.

                    var setID = this.test.setsInfo[s].id;
                    var cards = cardsGroupedBySet[setID];

                    cards = _.sortBy(
                        cards,
                        "order_id"
                    );

                    // append these cards to the final array
                    orderedCards = orderedCards.concat(cards);
                }
            }

            else {

                // okay, we've been told to randomize the cards, so we'll just shuffle up
                // the cards 7 times (where did I read that that's how many times you need
                // to get a "good" shuffle)?

                for ( var x=0; x < 7; x++ ) {
                    this.test.cards = _.shuffle(this.test.cards);
                }

                // that is our final order
                orderedCards = this.test.cards;
            }

            // okay, we're done. let's tell our section that we're going to change pages.
            // we'll pass along a few things: (1) our test object. (2) the ordered cards.
            // (3) the settings that were just filled out.

            this.trigger("setPage",{
                urlIDs : this.settings.urlIDs,
                manualData : this.settings.manualData,
                pageName : "doing",
                testSettings : formData,
                test : this.test,
                cards : orderedCards,
                startingIdx : 0
            });
        }
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // We are displaying some of the test's information in our main panel here.
    // Let's update the test to have full info on all of its tags, as well as
    // building displayable strings for the tags (i.e., text) and keywords.
    ///////////////////////////////////////////////////////////////////////////

    buildPanelAttrs : function() {

        // replace our tag IDs with the full objects. this is a permanent
        // change in the test object.

        this.test.tags = _.map(
            this.test.tags,
            function(id){
                return _.find(
                    app.store.get("card.tags"),
                    function(o){
                        return o.id===id;
                    }
                )
            }
        );

        // create the temporary `tagsText` field.
        var tagsText = "None";
        if ( this.test.tags.length ) {
            tagsText = _.pluck(this.test.tags,"tag_text").join(", ");
        }

        // create the temporary `keywordsText` field.
        var keywordsText = this.test.keywords.length ? this.test.keywords.join(", ") : "None";

        // we've finished. extend the attributes of the test with what we just did into a new
        // object that will be used alongside a template.
        return _.extend({},this.test,{tagsText:tagsText,keywordsText:keywordsText});
    }

});

//---------------------------------------------------------------------------------------
// View:        VWidgetTestsTakeIntroFormSettings
// Description: Simple form that allows the user to setup some settings for the test.
//              There is no validation or anything required here, we just pull out
//              the values and move ahead.
//
//              We generate two possible events here: "onFormSave" and "onFormCancel".
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeIntroFormSettings = VBaseWidgetForm.extend({

    /* overloaded */
    id : "widget-tests-take-intro-form-settings",
    templateID : "tpl-widget-tests-take-intro-form-settings",
    formName : "settings",
    successAlertText : undefined, // not used

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-tests-take-intro-form-settings";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Nothing special required here.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */
        
        var attrs = this.jqoForm.serialize_object();
        
        // convert bools into 1/0
        attrs.randomize = attrs.randomize ? 1 : 0;
        attrs.display_set_name = attrs.display_set_name ? 1 : 0;
        attrs.display_card_tags = attrs.display_card_tags ? 1 : 0;
        attrs.show_remaining = attrs.show_remaining ? 1 : 0;

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // We never have cause to do this.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Nothing to do here either. Returning 'undefined' means success.
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function(attrs) {
        // no-op.
    }

});

//---------------------------------------------------------------------------------------
// View:        VWidgetTestsTakeIntroPanel
// Description: Widget that displays the test's information in a panel, with an
//              optional button to get 'more info' on the test (i.e., detailed sets
//              info).
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeIntroPanel = VBaseWidgetPanel.extend({

    /* overload (as required) */
    tagName : "div",

    /* overload */
    id : "widget-tests-take-intro-panel",
    templateID : "tpl-widget-tests-take-intro-panel", // we render an attributes hash to this

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-tests-take-intro-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VPageTestsTakeDoing
// Description: This is the page that actually allows the user to take the test. in
//              We do not load any data from the server, as everything we need was
//              loaded in the 'intro' page. We have several widgets here:
//              two panels, and slideshow.
//---------------------------------------------------------------------------------------

var VPageTestsTakeDoing = VBasePage.extend({

    /* overloaded */
    id : "page-tests-take-doing",    
    pageTemplateID : "tpl-page",    
    contentElement : "div.page-content",
    footerElement : "div.page-footer",    
    footerTemplateID : "tpl-page-footer-user",
    contentTemplateID : "tpl-page-content-tests-take-doing", // optional

    /* overload */
    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-tests-take-doing";
    },

    panelTimerElement : "div.page-content > div.content-panels > div.content-panel-timer",
    panelDetailsElement : "div.page-content > div.content-panels > div.content-panel-details",
    slideshowElement : "div.page-content > div.content-slideshow",

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @settings.  This will contain all the data loaded and setup in the 'intro'
    //              page. Including the test, cards, and settings.
    //  @options.   Sent to `setPage`. Not used.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        this.panelTimerView = null;
        this.panelDetailsView = null;
        this.slideshowView = null;

        // need to do this at the start, as we rely on `this.settings` in some of
        // the member functions that are called here.
        VBasePage.prototype.initialize.call(this,settings,options);

        // this is the stats object that will be sent to our two panel widgets.
        // some of the info is kept here only, some is stored outside and will be
        // copied here whenever we are told of its updating.

        this.stats = {
            idx : 0,
            minutes_spent : 0,
            num_cards : settings.cards.length,
            set_name : this.constructSetName(settings.cards[0].set_id),
        };

        // we have a timer that goes off every minute, to update the time spent
        // on the test.

        this.timer = $.timer(function(){
            this.onTimer();
        }.bind(this));
        this.timer.set({time:60000,autostart:false});        
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is called immediately after `initialize` (through base). We construct
    // all the subviews and tell our parent that we're ready to render.
    ///////////////////////////////////////////////////////////////////////////

    ready : function() { /* overloaded */

        // both panels require our stats and the settings for the test.

        this.panelTimerView = new VWidgetTestsTakeDoingPanelTimer(
            {templateAttrs:_.extend({},{settings:this.settings.testSettings},this.stats)},
            {}
        );
        this.panelDetailsView = new VWidgetTestsTakeDoingPanelDetails(
            {templateAttrs:_.extend({},{settings:this.settings.testSettings},this.stats)},
            {}
        );

        // slideshow requires the page settings (for historical reasons),
        // as well as the objects and starting idx.

        this.slideshowView = new VWidgetTestsTakeDoingSlideshow(
            {
                urlIDs : this.settings.urlIDs,
                objects : this.settings.cards,
                test : this.settings.test,
                startingIdx : this.settings.startingIdx,
            },
            {
                isShowingTags : this.settings.testSettings.display_card_tags
            }
        );
        
        this.panelTimerView.listenTo(this,"cleanup",this.panelTimerView.remove);
        this.panelDetailsView.listenTo(this,"cleanup",this.panelDetailsView.remove);
        this.slideshowView.listenTo(this,"cleanup",this.slideshowView.remove);

        // we only care about events:
        // (1) record changes in the slideshow
        // (2) slideshow toolbar is clicked.
        
        this.listenTo(this.slideshowView,"onRecordChange",this.onSlideshowRecordChange);
        this.listenTo(this.slideshowView,"onClickToolbar",this.onSlideshowClickToolbar);

        this.trigger("onPageReady",this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Cleanup ourselves and all subviews.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* overloaded */

        this.timer.stop();

        this.stopListening(this.slideshowView);
        this.stopListening(this.panelDetailsView);
        this.stopListening(this.panelTimerView);

        // empty references
        this.timer = null;
        this.slideshowView = null;
        this.panelDetailsView = null;
        this.panelTimerView = null;
        
        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // our widgets.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);

        // update the help link
        var href = this.$("div.sb-footer div.help a").prop("href");
        this.$("div.sb-footer div.help a").prop("href",href+"tests/");

        this.$(this.panelTimerElement).html(this.panelTimerView.render().$el);
        this.$(this.panelDetailsElement).html(this.panelDetailsView.render().$el);
        this.$(this.slideshowElement).html(this.slideshowView.render().$el);

        // as this is only called once. we can now start our timer.
        this.timer.play();

        return this;
    },

    /*
        Triggered Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Our timer event has gone off. We increaes the time and re-render the
    // panel that has that information.
    ///////////////////////////////////////////////////////////////////////////

    onTimer : function() {
        this.stats.minutes_spent++;        
        this.panelTimerView.settings.templateAttrs = _.extend({},this.panelTimerView.settings.templateAttrs,this.stats);
        this.$(this.panelTimerElement).html(this.panelTimerView.render().$el);
    },    

    ///////////////////////////////////////////////////////////////////////////
    // The user has changed which record is visible in the slideshow. Take this
    // opportunity to completely update our stats.
    //
    //  @idx.   this is zero-based. So its literal value tells us how many cards
    //          have been answered.
    //
    //  @model. the model that is currently being shown.
    //
    ///////////////////////////////////////////////////////////////////////////

    onSlideshowRecordChange : function(idx,model) {

        this.stats.idx = idx;
        this.stats.set_name = this.constructSetName(model.get("set_id"));
        this.updateDetails();
    },

    ///////////////////////////////////////////////////////////////////////////
    // User has clicked a button in the slideshow's toolbar. The only one
    // we care about here is "end. Everything else can be handled by the slideshow.
    ///////////////////////////////////////////////////////////////////////////

    onSlideshowClickToolbar : function(buttonName,button,event) {

        if ( buttonName === "end" ) {
            this.trigger("setPage",{
                pageName : "outro",
                stats : this.stats,
                urlIDs : this.settings.urlIDs,
                manualData : this.settings.manualData,
                test : this.settings.test,
                correctCardIDs : this.slideshowView.correctCardIDs
            });    
        }
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Get the constructed set name for a given setID
    ///////////////////////////////////////////////////////////////////////////

    constructSetName : function(setID) {
        var set = _.find(this.settings.test.setsInfo,function(o){
            return o.id === setID;
        });
        return set.set_name + ( set.description ? " ("+set.description+")" : "" );
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our stats have been updated (not timer), so we have to re-render that
    // panel of information.
    ///////////////////////////////////////////////////////////////////////////

    updateDetails : function() {
        this.panelDetailsView.settings.templateAttrs = _.extend({},this.panelDetailsView.settings.templateAttrs,this.stats);
        this.$(this.panelDetailsElement).html(this.panelDetailsView.render().$el);
    }

});

//---------------------------------------------------------------------------------------
// View:        VWidgetTestsTakeDoingPanelDetails
// Description: Widget that displays the current stats/info regarding the test in a panel.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingPanelDetails = VBaseWidgetPanel.extend({

    /* overload (as required) */
    tagName : "div",

    /* overload */
    id : "widget-tests-take-doing-panel-details",
    templateID : "tpl-widget-tests-take-doing-panel-details", // we render an attributes hash to this

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-tests-take-doing-panel-details";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View:        VWidgetTestsTakeDoingPanelTimer
// Description: Displays a brief template regarding the time spent, using attributes hash
//              sent to us.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingPanelTimer = VBaseWidgetPanel.extend({

    /* overload (as required) */
    tagName : "div",

    /* overload */
    id : "widget-tests-take-doing-panel-timer",
    templateID : "tpl-widget-tests-take-doing-panel-timer", // we render an attributes hash to this

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-tests-take-doing-panel-timer";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetTestsTakeDoingRecordEditableDisplay
// Description: One of two possible subViews to a VWidgetTestsTakeDoingRecordEditable.
//              This particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : "widget-tests-take-doingrecord-editable-display",
    templateID : "tpl-widget-tests-take-doing-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-record-editable-display-flashcard widget-tests-take-doing-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Any escaping of the text attributes or manipulation of the attributes in
    // any way/shape/form must be done here. Always operate on/return a cloned
    // copy of the model's attributes. Notice that we're using the options that
    // we had set at construction.
    ///////////////////////////////////////////////////////////////////////////

    filterModelAttributes : function() { /* overloaded */
        
        var attrs = _.clone(this.settings.recordSettings.model.attributes);

        // we use the pagedown markup on both the question and answer text.

        attrs.question_text = app.markdownSanitizerConverter.makeHtml(attrs.question_text);
        if ( attrs.answer_text ) {
            attrs.answer_text = app.markdownSanitizerConverter.makeHtml(attrs.answer_text);
        }

        // we are adding in a proprietary field here.
        attrs.isShowingAnswer = this.options.recordOptions.isShowingAnswer;
        attrs.isShowingTags = this.options.recordOptions.isShowingTags;

        return attrs;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetTestsTakeDoingRecordEditableEdit
// Description: One of two possible subViews to a VWidgetTestsTakeDoingRecordEditable.
//              This particular view presents a form for editing the model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingRecordEditableEdit = VBaseWidgetRecordEditableEdit.extend({

    /* overloaded */
    id : "widget-tests-take-doing-record-editable-edit",
    templateID : "tpl-widget-tests-take-doing-record-editable-edit",

    className : function() {
        return _.result(VBaseWidgetRecordEditableEdit.prototype,'className') + " widget-record-editable-edit-flashcard widget-tests-take-doing-record-editable-edit";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableEdit.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Removing ourself from the DOM. Empty all references.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        this.ws_tags = null;
        return VBaseWidgetRecordEditableEdit.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our editing form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // we need to build our select2 instance.

        this.ws_tags = new WSelect2({
            elem : this.jqoForm.find("input[name=tags]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_tags.init({
            tags : _.map(
                _.filter(app.store.get("card.tags"),function(o){return !o.is_auto;}),
                function(o){
                    return {
                        id : o.id,
                        text : o.tag_text
                    }
                }
            ),
            preventNew : true
        });

        // we could use have the defaultTags option for ws_tags, but that wouldn't
        // have preserved the id/text separation if they remained present when saved.
        // in other words, upon checking the selection we'd get something like:
        // {id:"difficulty1",text:"difficulty1"}. by doing it this way, we get
        // separate id and text values if they remain selected upon saving.
        
        this.ws_tags.set(
            _.map(
                _.filter(this.settings.recordSettings.model.get("tags"),function(o){return !o.is_auto;}),
                function(o) {
                    return o.id;
                }
            )
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form. this will
    //      be used with `model.save` to try to update the model.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form. note that we have
        // to do the select2 instance separately.

        var attrs = this.jqoForm.serialize_object();
        
        attrs.tags = this.ws_tags.getSelection();
        if ( attrs.tags.length ) {
            var tags = [];
            for ( var x=0; x < attrs.tags.length; x++ ) {
                tags.push({id:attrs.tags[x].id,tag_text:attrs.tags[x].text,is_auto:0});
            }
            attrs.tags = _.sortBy(
                tags,
                function(o){
                    return o.tag_text;
                }
            );
        }

        // trim all the strings
        attrs.order_id = +attrs.order_id;
        attrs.question_text = $.trim(attrs.question_text);
        attrs.answer_text = $.trim(attrs.answer_text);        

        // replace "" with null and true/false with 1/0
        attrs.answer_text = !attrs.answer_text.length ? null : attrs.answer_text;

        // add the 'note' tag if there is no answer.
        if ( !attrs.answer_text ) {
            attrs.tags = attrs.tags || [];
            attrs.tags.push(_.filter(
                    app.store.get("card.tags"),
                    function(o){return o.tag_text === "note"}
                )[0]
            );
        }

        return attrs;
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetTestsTakeDoingRecord
// Description: This displays a card's attributes, and allows the user to edit them.
//              We differ from the base quite a bit here. We only display certain attributes,
//              based upon the `options` sent. Also, we provide three extra buttons for
//              changing the tags quickly (difficulty1-3).
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : "widget-tests-take-doing-record-editable",
    templateID : "tpl-widget-tests-take-doing-record-editable",
    flagDialogTitle : "Flag Flashcard",
    flagDialogMsg : "<p>Are you sure you want to flag this card as inappropriate?</p>",
    deleteDialogTitle : "Delete Flashcard",
    deleteDialogMsg : "<p>Are you sure you want to delete this card? WARNING: THIS CANNOT BE UNDONE!</p>",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-record-editable-flashcard widget-tests-take-doing-record-editable";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },    

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup our proprietary member data.
    //
    //  @settings.  Has .slideshowSettings in it, and .model
    //  @options.   Not used here directly, but we pass them onto our subviews
    //              (upon construction) which do use them.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* extended */
        VBaseWidgetRecordEditable.prototype.initialize.call(this,settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user can edit/delete models. So we update the URL based upon the
    // test information we were given in settings.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        
        var setID = this.settings.model.get("set_id");
        var setsInfo = this.settings.slideshowSettings.test.setsInfo;

        var set = _.find(setsInfo,function(elem){
            return elem.id === setID;
        });

        var ownerID = set.created_by_id;
        this.settings.model.urlRoot = this.settings.model.baseUrlRoot + "/" + this.settings.slideshowSettings.test.module_id + "/" + ownerID + "/" + setID;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Based upon our current state, and the particular user that's looking,
    // we will figure out which toolbar buttons are enabled.
    ///////////////////////////////////////////////////////////////////////////

    setToolbarButtonsEnabled : function() { /* overloaded and extended */

        VBaseWidgetRecordEditable.prototype.setToolbarButtonsEnabled.call(this);

        // if we aren't editing, then whether or not we can use certain
        // buttons will depend on whether this belongs to us

        var isUser = this.settings.model.get("created_by_id") === app.store.get("user").id;

        if ( !this.isEditing ) {
            this.toolbarView.setEnabled({
                difficulty1 : isUser,
                difficulty2 : isUser,
                difficulty3 : isUser,
                edit : isUser,
                flag : !isUser,
                delete : isUser
            });
        }

        // highlighting difficulty1..3

        var d1 = _.find(this.settings.model.get("tags"),function(o){
            return o.tag_text === "difficulty1";
        });
        var d2 = _.find(this.settings.model.get("tags"),function(o){
            return o.tag_text === "difficulty2";
        });
        var d3 = _.find(this.settings.model.get("tags"),function(o){
            return o.tag_text === "difficulty3";
        });

        this.toolbarView.getButton("difficulty1").removeClass("btn-info btn-default").addClass(d1?"btn-info":"btn-default");
        this.toolbarView.getButton("difficulty2").removeClass("btn-info btn-default").addClass(d2?"btn-info":"btn-default");
        this.toolbarView.getButton("difficulty3").removeClass("btn-info btn-default").addClass(d3?"btn-info":"btn-default");
    },

    instantiateToolbarView : function() { /* overloaded */
        return new VWidgetTestsTakeDoingRecordEditableToolbar();
    },

    ///////////////////////////////////////////////////////////////////////////
    // One of the toolbar buttons that is associated directly with this record
    // has been clicked. The base view deals with some of the buttons, and we
    // deal with the leftovers.
    //
    //  @buttonName - the `name` field from the HTML of the buttton.
    //  @button - the jqo object of the button that was clicked
    //  @event - raw 'click' event data.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function VWidgetTestsTakeDoingRecordEditable__onClickToolbar(buttonName,button,event) { /* overloaded and extend */

        // our base view will deal with `select`, `edit`, and `delete`.
        VBaseWidgetRecordEditable.prototype.onClickToolbar.call(this,buttonName,event);

        // if we aren't sent the button, that means that it's a manual call, let's grab the
        // button in question now. the reason we do this is we want to make sure that
        // a given button is enabled if someone wants it to be pressed (since these buttons
        // can be "manually pressed" through the keyboard).
        if ( !button ) {
            button = this.toolbarView.getButton(buttonName);
        }

        // we will deal with the unique ones here:

        // DIFFICULTY1...3

        if ( ( buttonName.indexOf("difficulty") !== -1 ) && ( !button.prop("disabled") ) ) {

            // we want to edit the model's tags and then save the model to the server.

            var tags = this.settings.model.get("tags");
            var existingTag = _.find(tags,function(o){
                return o.tag_text === buttonName;
            });

            if ( existingTag ) {
                tags.splice(_.indexOf(tags,existingTag),1);
            }
            else {
                
                tags.push(_.find(app.store.get("card.tags"),function(o){return o.tag_text === buttonName;}));
                tags = _.sortBy(
                    tags,
                    function(o){
                        return o.tag_text;
                    }
                );
            }

            // this is messy because this is usually done by our '.edit' subview. and
            // so we aren't listening to any model events, we are just going to do it
            // manually here with the success function. our error function is handled
            // by `onModelError`.

            this.settings.model.save({tags:tags},{
                sbRequestText : "Saving...",
                wait : true, // wait for server OK before setting attr on model
                success : function(model,response,options) {
                    Spinner.get().hide();
                }
            });

            // tags may have changed, which we have to reflect on our toolbar.
            this.setToolbarButtonsEnabled();
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Specify the VBaseWidgetRecordEditableDisplay- and
    // VBaseWidgetRecordEditableDisplay-derived views we will use here.
    //
    // The settings and options have already been started by our base view.
    // They will include `recordSettings` (which contains `model`) and 
    // `recordOptions`, respectively. Add whatever we need that's unique here.
    ///////////////////////////////////////////////////////////////////////////

    instantiateDisplayView : function(settings,options) { /* overloaded */
        return new VWidgetTestsTakeDoingRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return new VWidgetTestsTakeDoingRecordEditableEdit(settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to either be saved or destroyed on the server. Display
    // the error to the user. We only get a `userError` on change:is_flagged, as 
    // they may be unsuccessful in applying their flag.
    //
    //  @options: All backbone.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VWidgetTestsTakeDoingRecordEditable__onModelError(model,xhr,options) { /* overloaded */

        Spinner.get().hide(function(){

            var userError = app.getAjaxUserError(xhr);

            if ( ( xhr.status === 400 ) && ( userError ) && ( ( userError.type === "flag-reputation" ) || ( userError.type === "flag-duplicate" ) ) ) {

                var msg = null;
                if ( userError.type === "flag-reputation" ) {
                    msg = "You are not able to flag any more content for the moment. Please give the administrators time to evaluate your previous flags.";
                }
                else {
                    msg = "You have already flagged that content. Please give the administrators time to evaluate your previous flag.";
                }
                
                bsDialog.create({
                    title : "Error!",
                    msg : "<p>" + msg + "</p>",
                    ok : function() {}
                });
            }
            else {
                app.dealWithAjaxFail(xhr,null,null);
            }

        });
    }

});

//---------------------------------------------------------------------------------------
// View: VWidgetTestsTakeDoingRecordEditableToolbar
// Description: The toolbar for a VWidgetTestsTakeDoingRecordEditable.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingRecordEditableToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-tests-take-doing-record-editable-toolbar",
    templateID : "tpl-widget-tests-take-doing-record-editable-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-tests-take-doing-record-editable-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    },

});

//---------------------------------------------------------------------------------------
// View: VWidgetTestsTakeDoingSlideshow
// Description: We display the cards that are part of the test here. The user can
//              do prev/next/end as well as toggle answer and flag as "correct".
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingSlideshow = VBaseWidgetSlideshow.extend({

    /* overloaded */
    id : "widget-tests-take-doing-slideshow",

    widgetLayoutTemplateID : "tpl-widget-tests-take-doing-slideshow",
    toolbarElement : "div.content-toolbar",
    recordElement : "div.content-record",
    
    className : function() {
        return _.result(VBaseWidgetSlideshow.prototype,'className') + " widget-tests-take-doing-slideshow";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetSlideshow.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Initialize any of our proprietary members.
    //
    //  @options:
    //      contains .isShowingTags. We use that here to determine how the
    //      VBaseWidgetRecordEditable-derived view displays the data.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* extended */

        this.correctCardIDs = [];
        this.isShowingAnswer = false;
        this.isShowingTags = options.isShowingTags;
        VBaseWidgetSlideshow.prototype.initialize.call(this,settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is extended only so that we can begin capturing keyboard input
    // as soon as we are present in the DOM.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* extended */

        this.captureKeyboard();
        return VBaseWidgetSlideshow.prototype.render.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Tell all subviews to cleanup, and then remove ourselves.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        this.releaseKeyboard();
        this.correctCardIDs = null;
        return VBaseWidgetSlideshow.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    //  Overloaded methods to instantiate the appropriate views for our widget.
    ///////////////////////////////////////////////////////////////////////////

    instantiateCollection : function() { /* overloaded */
        return new CardsCollection();
    },

    instantiateToolbar : function() { /* overloaded */
        return new VWidgetTestsTakeDoingSlideshowToolbar();
    },

    ///////////////////////////////////////////////////////////////////////////
    // We will send our VBaseWidgetRecordEditable-derived view a lot of info.
    // It wants the `test` from our settings, as well as the model that it's
    // working on. As for options, it needs to know if it's showing the answer
    // or the tags of the card.
    ///////////////////////////////////////////////////////////////////////////

    instantiateRecord : function() { /* overloaded */
        return new VWidgetTestsTakeDoingRecordEditable(
            {
                slideshowSettings:this.settings,
                model:this.collection.at(this.idx)
            },
            {
                slideshowOptions:this.options,
                isShowingAnswer:this.isShowingAnswer,
                isShowingTags:this.isShowingTags
            }
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // We deal with our proprietary buttons here: show, correct.
    ///////////////////////////////////////////////////////////////////////////

    updateToolbar : function() { /* extended */

        VBaseWidgetSlideshow.prototype.updateToolbar.call(this);

        var toolbarButtonState = this.toolbarView.getEnabled();
        this.toolbarView.setEnabled(_.extend({},toolbarButtonState,{
            show_answer : !!this.collection.length,
            correct : !!this.collection.length
        }));

        if ( this.collection.length ) {

            // highlighting show_answer

            this.toolbarView.getButton("show_answer").removeClass("btn-info btn-default").addClass(this.isShowingAnswer?"btn-info":"btn-default");

            // highlighting correct

            var model = this.collection.at(this.idx);
            var correct = !model ? false : _.contains(this.correctCardIDs,model.get("id"));

            this.toolbarView.getButton("correct").removeClass("btn-success btn-default").addClass(correct?"btn-success":"btn-default");
        }
    },

    /*
        Triggered Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Everytime the user changes card, we reset `isShowingAnswer` to false.
    // And that gets sent to the recordView everytime a new card is shown through
    // its constructor. The next/prev buttons will trigger a refresh through
    // our base widget, whereas we refresh manually on 'show answer'.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,button,event) { /* extended */        

        // PREV

        if ( buttonName === "prev" ) {
            this.isShowingAnswer = false;
        }        

        // NEXT

        else if ( buttonName === "next" ) {
            this.isShowingAnswer = false;
        }

        // SHOW ANSWER (toggle)

        else if ( buttonName === "show_answer" ) {
            this.isShowingAnswer = !this.isShowingAnswer;
            this.renderRecord();
            this.updateToolbar();
        }

        // CORRECT (toggle)

        else if ( buttonName === "correct" ) {

            var cardModel = this.collection.at(this.idx);
            var wasCorrect = _.indexOf(this.correctCardIDs,cardModel.get("id"));

            // was it previously correct? if so, now it's not.
            if ( wasCorrect !== -1 ) {
                this.correctCardIDs = _.without(this.correctCardIDs,cardModel.get("id"));
            }
            else {
                this.correctCardIDs.push(cardModel.get("id"));
            }

            this.updateToolbar();
        }

        VBaseWidgetSlideshow.prototype.onClickToolbar.call(this,buttonName,event);
    },

    ///////////////////////////////////////////////////////////////////////////
    // We use these three events to disable/re-enable our keyboard capturing.
    // This prevents us from capturing their keystrokes while they are editing
    // a given card.
    ///////////////////////////////////////////////////////////////////////////

    onRecordEdit : function(recordView) {
        this.releaseKeyboard();
    },

    onRecordSave : function(recordView) {
        this.captureKeyboard();
    },

    onRecordCancel : function(recordView) {
        this.captureKeyboard();
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Start capturing all the keystrokes that we are interested in. We have
    // to grab them from "body", otherwise the focus-requirements are too
    // strict (e.g., have to be focused on input within the div, can't just
    // be focused on the div). Notice that we are only ever calling toolbar
    // commands here - nothing outside of those functions already setup.
    ///////////////////////////////////////////////////////////////////////////

    captureKeyboard : function() {

        // we are going to block the ENTER key from being processed by
        // the default handlers. this avoids the situation where someone
        // is just holding down ENTER while focused on a given key, which
        // would endlessly cycle the key being on/off/on/off...

        $("body").on("keydown",function(event){

            // stop only certain key values
            switch ( event.keyCode ) {
                case 13:
                    event.preventDefault();
                    event.stopPropagation();
                    break;
            }
        });

        $("body").on("keyup",function(event){

            // capture all UP events and stop 'em.

            event.stopPropagation();
            event.preventDefault();

            // we do NOT allow for keypresses while the app is busy and
            // blocking mouse input.

            if ( !Spinner.get().isShowing() ) {
            
                switch ( event.keyCode ) {

                    // left/right arrows
                    case 37:
                        this.onClickToolbar("prev");
                        break;
                    case 39:
                        this.onClickToolbar("next");
                        break;

                    // space/enter/esc
                    case 32:
                        this.onClickToolbar("show_answer");
                        break;
                    case 13:
                        this.onClickToolbar("correct");
                        break;
                    case 27:
                        this.onClickToolbar("end");
                        break;
                    
                    // 1,2,3 (numpad and regular)
                    case 49:
                    case 50:
                    case 51:
                    case 97:
                    case 98:
                    case 99:
                        var suffix = ( event.keyCode < 97 ? event.keyCode-48 : event.keyCode-96 );
                        if ( this.recordView ) {
                            this.recordView.onClickToolbar("difficulty"+suffix);
                        }
                        break;

                }
            }

        }.bind(this));
    },

    ///////////////////////////////////////////////////////////////////////////
    // Stop capturing any keyboard events. This frees the user to enter values
    // into input fields, for ex., without us having to deal with their keystrokes.
    ///////////////////////////////////////////////////////////////////////////

    releaseKeyboard : function() {
        $("body").off("keydown");
        $("body").off("keyup");
    }
    
});

//---------------------------------------------------------------------------------------
// View: VWidgetTestsTakeDoingSlideshowToolbar
// Description: The toolbar for the slideshow widget shown while taking a test.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingSlideshowToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-tests-take-doing-slideshow-toolbar",
    templateID : "tpl-widget-tests-take-doing-slideshow-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-slideshow-toolbar widget-tests-take-doing-slideshow-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});

//---------------------------------------------------------------------------------------
// View: VPageTestsTakeOutro
// Description: The test is done. We present a short summary and ask if they want
//              to take it again.
//---------------------------------------------------------------------------------------

var VPageTestsTakeOutro = VBasePage.extend({

    /* overloaded */
    id : "page-tests-take-outro",    
    pageTemplateID : "tpl-page",    
    contentElement : "div.page-content",
    footerElement : "div.page-footer-user",    
    footerTemplateID : "tpl-page-footer-user",
    contentTemplateID : "tpl-page-content-tests-take-outro", // optional

    /* overload */
    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-tests-take-outro";
    },

    panelElement : "div.page-content > div.content-panel",

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //      Quickly parse the data we got from the "doing" page. We just
    //      construct a string to say how many they got right.
    //  
    //  @options. Not used here.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        settings.stats.num_correct_string = settings.correctCardIDs.length + " / " + settings.test.cards.length + " ("+(Math.floor((settings.correctCardIDs.length/settings.test.cards.length)*100))+"%)";

        this.panelView = null;

        VBasePage.prototype.initialize.call(this,settings,options); // copies over parms.
    },

    ///////////////////////////////////////////////////////////////////////////
    // No data to load here. Just construct our widgets and tell parent that
    // we're ready to render.
    ///////////////////////////////////////////////////////////////////////////

    ready : function() { /* overloaded */

        var panelAttrs = _.extend({},this.settings.stats,this.settings.test);
        this.panelView = new VWidgetTestsTakeOutroPanel({templateAttrs:panelAttrs},{});
        
        this.panelView.listenTo(this,"cleanup",this.panelView.remove);
        
        this.listenTo(this.panelView,"onPanelOK",this.onPanelOK);
        this.listenTo(this.panelView,"onPanelCancel",this.onPanelCancel);

        this.trigger("onPageReady",this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Cleanup ourselves and all subviews.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        this.stopListening(this.panelView);

        // empty references        
        this.panelView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML through our base, then render the two widgets.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);

        this.$(this.panelElement).html(this.panelView.render().$el);

        return this;
    },

    /*
        Triggered Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked the "re-take test" button. Let's send them back to
    // the 'intro' section, internally, through our section.
    ///////////////////////////////////////////////////////////////////////////

    onPanelOK : function(event) {
        
        this.trigger("setPage",{
            pageName : "intro",
            urlIDs : this.settings.urlIDs,
            manualData : this.settings.manualData
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We are going to go back to tests/flashcards section, depending on
    // whether or not this was a manual test.
    ///////////////////////////////////////////////////////////////////////////

    onPanelCancel : function(event) {

        var moduleID = this.settings.test.module_id;
        app.router.navigate("#studying/browse/"+"m"+moduleID+"/",{trigger:true});
    }

});

//---------------------------------------------------------------------------------------
// View:        VWidgetTestsTakeOutroPanel
// Description: Shows some summary information about what test was taken, as well as
//              the time taken and number correct.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeOutroPanel = VBaseWidgetPanel.extend({

    /* overload (as required) */
    tagName : "div",

    /* overload */
    id : "widget-tests-take-outro-panel",
    templateID : "tpl-widget-tests-take-outro-panel", // we render an attributes hash to this

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-tests-take-outro-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
            "click button[name=button_cancel]" : "onClickCancel"
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We added a second button to this panel.
    ///////////////////////////////////////////////////////////////////////////

    onClickCancel : function(event) {
        this.trigger("onPanelCancel",event);
    }

});

//---------------------------------------------------------------------------------------
// Application: Studybash
// Description: This is the main application object for Studybash. You could look at this
//              as the main controller for the site. Through this object, the site is
//              initialized, the router is created, and views are constructed based upon
//              what functions the router calls.
//---------------------------------------------------------------------------------------

var app = {};

///////////////////////////////////////////////////////////////////////////////
// The entry-point of the website. We will verify that the browser supports
// the site, pre-load some images, setup most of the plug-ins, load some 
// dependencies, grab settings from server, and start the router.
///////////////////////////////////////////////////////////////////////////////

app.init = function app__init(settings) {    

    var support = $.browser_support();

    if ( support.passed ) {

        // all of the images that are placed in the .imagePreload div element
        // must be pre-loaded before the site can begin. wait for that to occur.

        $("div.imagePreload").waitForImages(function(){            

            // (0) copy over any settings that we require from our param object

            this.JS_ROOT = settings.JS_ROOT;
            this.DOMAIN_ROOT = settings.DOMAIN_ROOT;

            // (1) setup everything that must be loaded regardless of whether or not
            // we have an LIU. this includes all of the plug-in settings.            

            $.includejs.settings.ROOT = app.JS_ROOT;
            $.includejs.settings.cache = false;            

            $.tracedError.settings.url = "ajax/manual.php/error";
            $.tracedError.settings.cleanup = function() {};
            $.tracedError.settings.html = function() {};

            Spinner.settings.ROOT = app.JS_ROOT;
            Spinner.settings.title = "Studybash";

            $.ajaxSetup({timeout:30000});

            this.view = null;
            this.section = null;            
            app.setupOnClickLink();

            // (2) fully process the settings that we received as our param object.
            // we will branch based upon whether or not we were given an LIU.

            
            if ( settings.user ) {
                this.store.set("user",settings.user);
                this.prepareForLIU();
            }
            else {
                this.prepareForNonLIU();
            }            

        }.bind(this));
    }

    else {        

        app.gotoSection("browserFail");

        // let the server know about this.

        $.tracedError.settings.url = "ajax/manual.php/error";
        $.tracedError.settings.cleanup = function() {};
        $.tracedError.settings.html = function() {};

        var msg = "Browser failed the support test. Return object from $.browser_support(): " + JSON.stringify(support);
        $.tracedError.createTracedError(msg);
    }
}

///////////////////////////////////////////////////////////////////////////////
// We are preparing the application for either an LIU (logged-in user) or
// a non-LIU.
///////////////////////////////////////////////////////////////////////////////

app.prepareForLIU = function app__prepareForLIU() {

    $.storage.settings.BASE = "studybash.storage.";
    this.retrieveUserSettings();
    this.setupPagedown();

    // load all of the templates for the entire site. when that is completed
    // we are `ready`

    $.includejs.include({
        
        tpl : ["studybash.user"],
        
        success : function app__prepareForLIU__success() {

            // load the application settings and general data that is used in
            // more than once place (i.e., easier to load it here).

            $.ajax({
                url : app.JS_ROOT+"ajax/manual.php/data-LIU",
                type : "GET",
                dataType : "json",
                contentType : "application/json",
                context : this,
                beforeSend : function(jqxhr,options) {
                    jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                }
            })
            .done(function(data,textStatus,jqXHR) {

                // setup some store values that were sent back.
                this.store.set("system_message_interval",data.store.system_message_interval);
                this.store.set("sharing.types",data.store.sharingTypes);
                this.store.set("card.tags",data.store.cardTags);
                this.store.set("institutions",data.store.institutions);
                this.store.set("semesters",data.store.semesters);
                this.store.set("classes.years.before",data.store.classes_yearsBefore);
                this.store.set("classes.years.after",data.store.classes_yearsAfter);

                // ready to start
                this.ready();
            })
            .fail(function(jqXHR,textStatus,errorThrown) {                        
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });                    

        }.bind(this),
        
        error : function app__prepareForLIU__error(options,jqXHR,textStatus,errorThrown) {
            jqXHR = _.extend({},jqXHR,{includeJSOptions:options});
            this.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
        }.bind(this)
    });
}

app.prepareForNonLIU = function app__prepareForNonLIU() {
    
    // load only the templates that we require for the non-LIU.

    $.includejs.include({
        
        tpl : ["studybash.welcome"],
        
        success : function app__prepareForNonLIU__success() {

            // we are ready to start.
            this.ready();          

        }.bind(this),
        
        error : function app__prepareForNonLIU__error(options,jqXHR,textStatus,errorThrown) {

            jqXHR = _.extend({},jqXHR,{includeJSOptions:options});
            this.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            
        }.bind(this)
    });

}

///////////////////////////////////////////////////////////////////////////////
// The application is ready to go.
///////////////////////////////////////////////////////////////////////////////

app.ready = function app_ready() {

    // start the site. this takes our current URL and activates
    // the appropriate section.

    this.router = new AppRouter();
    Backbone.history.start();
}

///////////////////////////////////////////////////////////////////////////////
// Sets up the markdown converter used for the text fields of question/answer
// on a card. This enables users to create fancy HTML stuff and links, while
// ensuring that what they enter is safe. We use the sanitized version of 
// Google's pagedown: https://code.google.com/p/pagedown/
///////////////////////////////////////////////////////////////////////////////

app.setupPagedown = function app__setupPageDown() {

    function sanitizeHtml(html) {

        // .img-thumbnail is from twitter bootstrap.
        // .navigate means that the link actually goes somewhere (i.e., not just an <a> in a menu for ex.)
        function sanitizeTag(tag) {

            if ( tag.match(/^<img.*>$/i) ) {
                return tag.slice(0,tag.length-1) + " class=\"img-thumbnail\">";
            }
            else if ( tag.match(/^<a.*>$/i) ) {
                return tag.slice(0,tag.length-1) + " class=\"navigate\">";
            }
            else {
                return tag;
            }
        }

        return html.replace(/<[^>]*>?/gi, sanitizeTag);
    }
    
    //this.markdownConverter = new Markdown.Converter();
    this.markdownSanitizerConverter = Markdown.getSanitizingConverter();

    // we want to ensure that all of the images that are added through these
    // types of input have their properties pre-determined (i.e.,. max width/height).
    // see: http://stackoverflow.com/questions/21190381/pagedown-adding-a-css-class-to-every-img-tag-with-javascript/21191523
    this.markdownSanitizerConverter.hooks.chain("postConversion",sanitizeHtml);
}

///////////////////////////////////////////////////////////////////////////////
// As this is an SPA, we manage all links that are clicked. If the link is
// within our site, then we will send it to the router. Otherwise, we open
// a new tab for the external link.
//
//  NOTE:   If `router.navigate` gets called before the event bubbles up here
//          then the event is stopped in its tracks. So if the click is
//          captured anywhere else and the router is activated, it won't
//          get here.
//
///////////////////////////////////////////////////////////////////////////////

app.setupOnClickLink = function app__setupOnClickLink(event) {

    // notice that we aren't concerned with anything that doesn't have 'navigate'
    // on it. this allows us, for example, to ignore mailto: links.
    
    $("#content").on("click","a.navigate",function(event){

        var link = $(event.currentTarget);
        var url = link.prop("href");
        var explicit = link.hasClass("newtab");
        var pos = url.indexOf(app.DOMAIN_ROOT);

        if ( url === "#" ) {
            $.tracedError.createTracedError("event: "+JSON.stringify({event:event}));
        }

        if ( ( pos >= 0 ) && ( !explicit ) ) {

            // grab everything *after* our root, and also skipping
            // over the "#" character.

            url = url.slice(pos+app.DOMAIN_ROOT.length+1);
            this.router.navigate(url,{trigger:true});
        }

        // external URL

        else {
            window.open(url);
        }

        event.preventDefault();

    }.bind(this));
}

///////////////////////////////////////////////////////////////////////////////
// This is responsible for containing all data that is used outside of the app 
// class and needs to persist or be shared (or both).
///////////////////////////////////////////////////////////////////////////////

app.store = (function app__store(){

    var data = {};

    var has = function app__store__has(key) {
        
        // We use .hasOwnProperty rather than `x in y` so that we do not go
        // down the entire prototype chain.
        return data.hasOwnProperty(key);
    }

    var get = function app__store__get(key) {
        
        // Will return undefined (as in `typeof x === undefined` is true) if the
        // key does not exist.
        return data[key];
    }

    var set = function app__store__set(key,value) {
        data[key] = value;
    }

    var merge = function app__store__merge(key,value) {
        
        var old = this.get(key) || {};
        this.set(key,_.extend(old,value));        
    }

    var rem = function app__store__rem(key,matchAll) {

        // delete all of the keys that have `key` as a substring?

        if ( matchAll ) {

            var toDelete = [];

            for ( k in data ) {
                var idx = k.toString().indexOf(key.toString());
                if ( idx !== -1 ) {
                    toDelete.push(k);
                }
            }

            for ( var x=0; x < toDelete.length; x++ ) {
                delete data[toDelete[x]];
            }
        }

        // delete only the key that was sent.
        
        else {
            
            if ( this.has(key) ) {
                delete data[key];
            }
        }
    }

    return {
        has : has,
        get : get,
        set : set,
        rem : rem
    };

})();

///////////////////////////////////////////////////////////////////////////////
// Take all of the per-user settings that have been saved in our app.store
// and copy them over into HTML5 localStorage. Many of these settings may be
// `undefined`. But that is no matter, as we will only apply settings from
// localStorage (in `retrieve...`) that are NOT `undefined`.
///////////////////////////////////////////////////////////////////////////////

app.saveUserSettings = function app__saveUserSettings() {

    var user = this.store.get("user");
    var storageKey = user.full_name + "(" + user.id + ").settings";
    userSettings = $.storage.get(storageKey) || {};

    userSettings["modules.show_completed"] = app.store.get("modules.show_completed");
    userSettings["sets.isAscending"] = app.store.get("sets.isAscending");
    userSettings["sets.sortCriteria"] = app.store.get("sets.sortCriteria");
    userSettings["cards.isAscending"] = app.store.get("cards.isAscending");
    userSettings["tests.hide_auto"] = app.store.get("tests.hide_auto");
    userSettings["tests.users.sortCriteria"] = app.store.get("tests.users.sortCriteria");
    userSettings["tests.users.isAscending"] = app.store.get("tests.users.isAscending");
    userSettings["tests.isAscending"] = app.store.get("tests.isAscending");

    $.storage.set(storageKey,userSettings);
    return userSettings;
}

///////////////////////////////////////////////////////////////////////////////
// Grab all of the user settings from our HTML5 localStorage. Note that
// `undefined` values are NOT copied over into `app.store`. Accordingly, we only
// copy over values that were actually present in `app.store` when they were
// originally saved.
///////////////////////////////////////////////////////////////////////////////

app.retrieveUserSettings = function app__retrieveUserSettings() {

    var user = this.store.get("user");
    var storageKey = user.full_name + "(" + user.id + ").settings";
    userSettings = $.storage.get(storageKey);
    this.store.rem("isFirstLogin");

    // if we have no settings, that means it's the first time using the site with this
    // machine. if that's the case, and the LIU is on their first login, we'll identify
    // them as a new user and create their settings (which will be all empty values).

    if ( !userSettings ) {        
        userSettings = {};
        if ( user.num_logins === 1 ) {
            this.store.set("isFirstLogin",true);
            userSettings = this.saveUserSettings();
        }
    }

    for ( var property in userSettings ) {
        if ( userSettings.hasOwnProperty(property) ) {
            var val = userSettings[property];
            if ( typeof val !== undefined ) {
                app.store.set(property,val);
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
// Given the jqXHR object, let's examine the response text sent back to see
// if it's in the format of our `userError` string. That format is:
// "userError:(TYPE)[MSG]". Type cannot be null (empty) but msg can be.
//
//  @return:
//      undefined:  no responseText to check
//      null:       had responseText but wasn't in `userError` format.
//      object:     was valid, has fields .type and .msg.
//
///////////////////////////////////////////////////////////////////////////////

app.getAjaxUserError = function app__getAjaxUserError(jqXHR) {
    
    var userError = undefined;
    if ( jqXHR && jqXHR.responseText ) {
        userError = jqXHR.responseText.match(/^userError:\((.+)\)\[(.*)\]$/);
        // if matched, the first element in array is full string.
        userError = ( userError && userError.length === 3 ) ? { type : userError[1], msg : userError[2] } : null;
    }

    return userError;
}

///////////////////////////////////////////////////////////////////////////////
// Dealing with AJAX failures will be a common occurrance in the application.
// Let's standardize how they are dealt with.
///////////////////////////////////////////////////////////////////////////////

app.dealWithAjaxFail = function app__dealWithAjaxFail(jqXHR,textStatus,errorThrown) {

    // (1) in timeout we have:
    // jqxhr.readystate = 0, status = 0, .statusText = timeout
    // textStatus = timeout
    // errorThrown = timeout
    //
    // (2) in couldn't parse JSON in jQuery (on client) we have:
    // jqxhr.readystate = 4, status = 200, responseText = "whatever wasn't JSON", statusText = OK
    // textStatus = parseerror
    // errorThrown = "SyntaxError: JSON.parse: unexpected ...""
    //
    // (3) in an exception/error caught by our server code:
    // jqxhr.readystate = 4, status = 400, responseText = "Timeout (high traffic volume)", statusText = Bad Request
    // textStatus = error
    // errorThrown = "Bad Request"
    //
    // (4) in PHP error not contained by the ajax code (e.g., would still display itself if we were viewing the PHP file itself)
    // jqxhr.readystate = 4, status = 200, responseText = "<b>Fatal Error</b>: Cannot access protected...", statusText = OK
    // textstatus = parseerror
    // errorThrown = SyntaxError: JSON.parse...
    //
    // (5) on aborting the jQuery AJAX call:
    // jqxhr.readystate = 0, status = 0, responseText = undefined, statusText = "abort"
    // textStatus = abort
    // errorThrown = abort

    // these wouldn't have been registered as an error on the server.
    if ( jqXHR.status !== 400 ) {
        $.tracedError.createTracedError("app.store.user: \n"+JSON.stringify(app.store.get("user"))+" \nfail parms: "+JSON.stringify({jqXHR:jqXHR,textStatus:textStatus,errorThrown:errorThrown}));
    }    

    // if we have a user error, we will capture some of them here. if we aren't capturing that particular one, we'll just give
    // a generic error, as we don't want code-based information going to the client.

    var msg = this.getAjaxUserError(jqXHR);
    var hadUserMsg = !!msg;
    if ( msg ) {

        switch ( msg.type ) {
        
            case "not_loggedin":
                
                bsDialog.create({
                    title : "Error!",
                    msg : "<p>You have been logged out. Please login again to continue working.</p>",
                    ok : function() {
                        this.cleanupSession();
                    }.bind(this)
                });
                break;

            case "session_token":

                bsDialog.create({
                    title : "Error!",
                    msg : "<p>Have you logged in elsewhere? If not, please re-login and change your password immediately.</p>",
                    ok : function() {
                        this.cleanupSession();
                    }.bind(this)
                });
                break;

            case "no_session":

                bsDialog.create({
                    title : "Error!",
                    msg : "<p>Please login first!</p>",
                    ok : function() {
                        this.cleanupSession();
                    }.bind(this)
                });
                break;

            default:

                msg = null;
                break;
        }
    }
    if ( !msg ) {
        
        // if the string sent back was from us (i.e., the status value is what we send) then display our
        // message. otherwise, a generic one.
        msg = ( ( jqXHR.status === 400 ) && ( hadUserMsg ) ) ? jqXHR.responseText : "Unexpected Server Response. Please try again!";

        ColorboxDialog.get("Studybash").open({
            msg : msg,
            callback : function(){}
        });
    }    
}

///////////////////////////////////////////////////////////////////////////////
// A user's session is ending (e.g., logging out). So we will cleanup whatever
// is required now that the session is over.
//
//  @keepURL - if true, we do not mess with the current URL.
///////////////////////////////////////////////////////////////////////////////

app.cleanupSession = function app__cleanupSession(keepURL) {

    // this indicates that no one is logged-in.
    this.store.rem("user");

    // and we don't want to poll for system messages anymore
    if ( this.systemMsgs ) {
        this.systemMsgs.shutdown();
        this.systemMsgs = null;
    }

    // if we are being asked to move back to the login page, and we have
    // a router instantiated, we'll use it. otherwise, do it manually,
    // which would be required if the user didn't get to point of `ready`
    // (i.e., a continuing session was interrupted upon loading the initial
    // data).

    if ( !keepURL ) {
        if ( this.router ) {
            this.router.navigate("login/",{trigger:true});
        }
        else {            
            window.location = app.JS_ROOT;
        }
    }
}

///////////////////////////////////////////////////////////////////////////
// We are checking if the user needs to be re-directed. We are told whether
// or not the user needs to be logged in to visit the page they're trying
// to visit. If their logged-in status doesn't match the expectations, then
// they are re-directed to either the login/ page or the dash/ page.
//
//  @return - did we perform a redirect?
///////////////////////////////////////////////////////////////////////////

app.doRedirect = function app__doRedirect(needToBeLoggedIn) {

    if ( needToBeLoggedIn ) {

        // not logged in. but they need to be, so ask them to do so.        
        if ( !this.store.has("user") ) {
            this.router.navigate("login/",{trigger:true});
            return true;
        }

        else {

            // the user is supposed to be logged in, and they are, so we will
            // check to see if we've already created our system-messages
            // controller. if not, we'll do so now and get it started.

            if ( !this.systemMsgs ) {

                this.systemMsgs = bsSystemMsgs;
                
                var s = this.systemMsgs.settings;
                s.title = "Studybash (System Messages)";
                s.url = app.JS_ROOT + "ajax/manual.php/system/msgs";
                s.user = app.store.get("user");
                s.interval = app.store.get("system_message_interval"); // in ms

                this.systemMsgs.begin();
            }
        }
    }

    else {

        // they're not supposed to be logged in to visit this section,
        // but they already are, so move them over to the main site.

        if ( this.store.has("user") ) {
            this.router.navigate("dash/",{trigger:true});
            return true;
        }
    }

    return false; // no re-direct performed
}

///////////////////////////////////////////////////////////////////////////
// Display a particular section of the site to the user. We do so by creating
// the appropriate view - based upon the section/params sent - and then
// rendering it (while also cleaning up the old view).
//
//  @section.   string representing the sectionName
//  @parms.     the parms of the URL
//  @options.   options that were manually set by the code in `router`
///////////////////////////////////////////////////////////////////////////

app.gotoSection = function app__gotoSection(section,parms,options) {
    
    // this is the element where we will be rendering our section into.
    var sectionElement = $("#content");

    // if we have a current view then remove it from the DOM.
    if ( this.view ) {
        this.view.remove();        
        this.view = null;
    }

    // depending on the section we are going to, we will create
    // a different type of view.

    switch ( section ) {

        case "login":

            this.view = new VSectionAccount(
                {pageName:"login"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "register":
            
            this.view = new VSectionAccount(
                {pageName:"register"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "verify":

            this.view = new VSectionAccount(
                {pageName:"verify"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "reset":
            
            this.view = new VSectionAccount(
                {pageName:"reset"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;
        
        case "dash":
            
            this.view = new VSectionDash(
                {pageName:"dash"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;
        
        case "classes":

            this.view = new VSectionClasses(
                {pageName:"classes"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "studying":

            this.view = new VSectionStudyingBrowse(
                parms,
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "takeTest":

            this.view = new VSectionStudyingTakeTest(
                _.extend({},parms,{pageName:"intro"}),
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "help":

            if ( !parms ) {
                parms = "general";
            }
            
            this.view = new VSectionHelp(
                {pageName:parms},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "logout":

            this.view = new VSectionLogout(
                {pageName:"logout"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "notFound":
            
            this.view = new VSectionNotfound(
                {pageName:"notfound"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "browserFail":            
            
            this.view = new VSectionBrowserfail(
                null,
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                null
            );

            break;

        default:
            break;
    }

    // note that we do NOT render anything here by default. all of the sections have
    // to execute the callback, which then renders them (i.e., when they are ready
    // to be rendered).
}

//---------------------------------------------------------------------------------------
// Router: AppRouter
// Description: The one and only router for the website. If a URL is typed into the address
//              bar, this object is notified. If we want to manually change a URL in the
//              address bar, we use `app.router.navigate` and the call comes here.
//---------------------------------------------------------------------------------------

var AppRouter = Backbone.Router.extend({

    // all of the URLs that we are interested in matching. for each, we tell the
    // site what function to call. format is: "direct_match", "page/:optional_parm", 
    // "page/*everything".

    routes : {
        
        "" : "default",
        
        "login/(*parms)" : "login",        
        "register/(*parms)" : "register",
        
        "verify/(*parms)" : "verify",
        "setpwd/(*parms)" : "setpwd",

        "reset/(*parms)" : "reset",
        "sendcode/(*parms)" : "sendcode",
        
        "dash/(*parms)" : "dash",
        
        "classes/(*parms)" : "classes",

        "studying/" : "studying",
        "studying/browse/" : "studying",
        "studying/browse/m:moduleID/" : "studying",
        "studying/browse/m:moduleID/g:groupID/" : "studying",
        "studying/browse/m:moduleID/g:groupID/u:userID/" : "studying",
        "studying/browse/m:moduleID/g:groupID/u:userID/:type/" : "studying",
        "studying/browse/m:moduleID/g:groupID/u:userID/:type/s:setID/" : "studying",

        "studying/taketest/auto/:autoSetID/" : "takeTestAuto",
        "studying/taketest/manual/" : "takeTestManual",
        "studying/taketest/:testID/" : "takeTest",

        "help/(:pageName/)" : "help",
        
        "logout/(*parms)" : "logout",
        
        "*parms" : "notFound" // catches whatever doesn't match above
    },

    ///////////////////////////////////////////////////////////////////////////
    // Constructor of the router.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(options) {

        this.listenTo(this,"all",function(){
            //console.log("MainRouter.event: "+arguments[0]);
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Functions representing a particular route within the site.
    ///////////////////////////////////////////////////////////////////////////

    default : function() {

        // we are sent to the default URL when re-directed by `session.php`
        // so if this is their first login, we'll send them to help. the only
        // other way they can get back in here is if they reload the page by
        // typing in the default URL for themselves, which would prevent
        // "isFirstLogin" from being set.
        
        if ( app.store.has("isFirstLogin") ) {
            app.router.navigate("help/",{trigger:true});
        }
        else {
            app.router.navigate("dash/",{trigger:true});
        }
    },

    login : function(parms) {

        // the `false` param represents the fact that we should NOT
        // be logged in when trying to go to this particular section.
        // this function call double checks that the user's logged-in
        // status matches what is sent. if so, it passes through to
        // out `gotoSection` call. if not, the user is redirected to
        // the appropriate section and another routing function will
        // be called.

        if ( !app.doRedirect(false) ) {
            app.gotoSection("login",null,{sbFromRouter:true});
        }
    },    

    register : function(parms) {
        if ( !app.doRedirect(false) ) {
            app.gotoSection("register",null,{sbFromRouter:true});
        }
    },

    verify : function(parms) {
        if ( !app.doRedirect(false) ) {
            app.gotoSection("verify",null,{sbFromRouter:true});
        }
    },

    setpwd : function(parms) {
        if ( !app.doRedirect(false) ) {
            app.gotoSection("verify",null,{sbFromRouter:true,sbSetPwd:true});
        }
    },

    reset : function(parms) {
        if ( !app.doRedirect(false) ) {
            app.gotoSection("reset",null,{sbFromRouter:true});
        }
    },

    sendcode : function(parms) {
        if ( !app.doRedirect(false) ) {
            app.gotoSection("reset",null,{sbFromRouter:true,sbSendCode:true});
        }
    },

    dash : function(parms) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("dash");
        }
    },

    classes : function(parms) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("classes");
        }
    },

    studying : function(moduleID,groupID,userID,typeID,setID) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("studying",{urlIDs:{mID:moduleID,gID:groupID,uID:userID,tID:typeID,sID:setID}});
        }
    },

    groups : function(moduleID) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("groups",{urlIDs:{mID:moduleID}});
        }
    },

    flashcards : function(moduleID,groupID,userID,setID) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("flashcards",{urlIDs:{mID:moduleID,gID:groupID,uID:userID,sID:setID}});
        }
    },

    testsBrowse : function(moduleID,groupID,userID) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("testsBrowse",{urlIDs:{mID:moduleID,gID:groupID,uID:userID}});
        }
    },    

    takeTestAuto : function(autoSetID) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("takeTest",{urlIDs:{aID:autoSetID}});
        }
    },

    takeTestManual : function() {
        if ( !app.doRedirect(true) ) {
            var manualData = app.store.get("tests.manual");
            app.store.rem("tests.manual");
            app.gotoSection("takeTest",{manualData:manualData});
        }
    },

    takeTest : function(testID) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("takeTest",{urlIDs:{tID:testID}});
        }
    },

    help : function(pageName) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("help",pageName);
        }
    },

    logout : function(parms) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("logout");
        }
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Invalid URL.
    ///////////////////////////////////////////////////////////////////////////

    notFound : function(parms) {
        app.gotoSection("notFound");
    }

});

