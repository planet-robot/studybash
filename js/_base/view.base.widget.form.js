//---------------------------------------------------------------------------------------
// View:        VBaseWidgetForm
// Description: This view houses a form that is filled out and submitted, although it
//              is not attached to any backbone model or collection. The information from
//              the form is simply returned as an attributes object (using names from
//              the form controls as the field names).
//
//              Methods dealing with the manipulation/presentation of the form itself
//              and parsing of the form data are overloaded. Since no model is attached
//              any validation of the form's must be done manually.
//
//              Events are created here: "onFormSubmit" and "onFormCancel".
//              These are triggered when that respective function has completed (i.e.,
//              validation has passed on "save" and we can now submit). By default, the
//              method that generates "onFormSubmit" is called automatically right after 
//              `onAttrsValid` is called.
//
//              The error returned from the validation func needs to be an object
//              with two fields (.msg and .field). `field` should match the name
//              of a given input field on the form, so it can be highlighted.
//              
//---------------------------------------------------------------------------------------

var VBaseWidgetForm = Backbone.View.extend({

    // creating new DOM element
    tagName : "div",

    /* overload and/or extend */
    id : undefined,
    className : "widget widget-form",
    templateID : undefined,
    successAlertText : undefined,
    alertTemplateID : "tpl-alert",
    alertDismissTemplateID : "tpl-alert-dismiss",
    allowDefaultSubmit : false,
    formName : undefined,    

    // UI events from the HTML created by this view
    events : {
        "click button[name=button_save]" : "onClickSave",
        "click button[name=button_cancel]" : "onClickCancel",
        "submit form" : "onSubmit"
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //  @settings:
    //
    //      Data object of required values. None here.
    //
    //  @options:
    //      Any flags that might be useful.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {

        this.settings = settings || {};
        this.options = options || {};

        // we are binding to the ESCAPE key, in order to get out of our form.
        $("body").on("keyup",null,{context:this},this.onEscapeKey);

        // we are creating a new attributes hash (and will be doing so again
        // after every successful 'submit')
        this.createFreshAttrs();
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {        

        // unbind our keyboard event - leaving any other events for 'keyup' as
        // they were.
        $("body").off("keyup",null,this.onEscapeKey);

        // all subview(s) will be listening for this event.
        this.trigger("cleanup");

        // empty references
        this.attrs = null;
        this.attrsOptions = null;
        this.settings = null;
        this.options = null;
        this.jqoForm = null;

        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // If we require some attributes to be present on the form upon display
    // then you must overload the `getDefaultAttrsForTemplate` method. Regardless,
    // the template is rendered and the form is prepared.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        var defaultAttrs = this.getDefaultAttrsForTemplate();
        this.$el.html($.includejs.getTemplate(this.templateID,defaultAttrs));
        
        this.jqoForm = this.$("form");
        this.prepareForm(); /* overload */
        this.jqoForm.find("*[data-toggle=tooltip]").tooltip();

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // If we require some attributes to be present on the form upon display
    // then this function should return them.
    ///////////////////////////////////////////////////////////////////////////

    getDefaultAttrsForTemplate : function() { /* overload (as required) */
        // no-op.
        return {};
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our creation form has already been rendered. However, if there is some manual
    // work that we have to do, then it will be done here.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overload as required */
        // no-op.
    },

    /*
        Utility functions
    */

    ///////////////////////////////////////////////////////////////////////////
    // Simply empty out our attributes hash, as we are starting fresh.
    ///////////////////////////////////////////////////////////////////////////

    createFreshAttrs : function() { /* overload (if required) */
        this.attrs = null;
        this.attrsOptions = null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Remove all of the succes/error feedback from the form.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFeedback : function() {
        this.jqoForm.find("div.alert").remove();
        this.jqoForm.find(".has-error").removeClass("has-error");
    },

    ///////////////////////////////////////////////////////////////////////////
    // Simply clear out the form. This will be used after a successful 'save'
    // has occurred and we're ready to enter new attributes.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overload and extend (if necessary) */
        this.jqoForm.find("input").not("[type='checkbox']").val("");        
        this.jqoForm.find("input[type='checkbox']").prop("checked",false);
        this.jqoForm.find("textarea").val("");
    },

    ///////////////////////////////////////////////////////////////////////////
    // Enable or disable the 'Save' button within ourselves.
    ///////////////////////////////////////////////////////////////////////////

    enableSaveButton : function() {
        this.$("button[name=button_save]").prop("disabled",false);
    },

    disableSaveButton : function() {
        this.$("button[name=button_save]").prop("disabled",true);
    },

    /*
        UI Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has pressed the ESCAPE key. We are going to shut down the form.
    ///////////////////////////////////////////////////////////////////////////

    onEscapeKey : function(event) {

        var context = event.data.context;

        switch ( event.keyCode ) {
            case 27:
                context.onClickCancel(event);
                break;
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull the attributes out from the form (using overloaded method) and
    // then attempt to validate them.
    ///////////////////////////////////////////////////////////////////////////

    onClickSave : function(event) { /* overload as required */

        this.clearFormFeedback();

        // could involve significant manual manipulation if, for ex., we have
        // select2 instances on there.

        var attrs = this.getFormAttrs(); /* overload */

        // if we are returned `undefined` then we will manually call our success
        // method. if we are returned `null` then we won't do anything
        // (assume the rest is automated). any other return value is considered
        // an error-specificiation, and so it is sent to `onAttrsInvalid`

        var error = this.validateAttrs(attrs); /* overload */
        if ( $.gettype(error).base === "undefined" ) {
            this.onAttrsValid(attrs);
        }
        else if ( error !== null ) {
            this.onAttrsInvalid(error);
        }

        // we may have been called manually, so double check
        // that we have an event to stop.
        if ( event ) {
            event.preventDefault();
            event.stopPropagation();
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // User has changed their mind.
    ///////////////////////////////////////////////////////////////////////////

    onClickCancel : function(event) {
        this.trigger("onFormCancel");
    },

    ///////////////////////////////////////////////////////////////////////////
    // The form is being submitted. We expect this to be called manually from
    // our 'onAttrsValid' method. If that is not the case (i.e., automatic
    // submission from pressing ENTER) then we have to force a call back to
    // 'onClickSave', and that method can take it from there.
    ///////////////////////////////////////////////////////////////////////////

    onSubmit : function(event) {

        if ( !this.attrs ) {
            event.preventDefault();
            event.stopPropagation();
            this.onClickSave(null);
        }

        else {

            if ( !this.allowDefaultSubmit ) {
                event.preventDefault();                
                event.stopPropagation();
            }

            // make a local copy of the attributes hash, as we are
            // passing it on to any caller that is listening. however
            // we want to create a new one for ourselves, breaking all
            // connections to the old one before passing it on. this
            // won't have any effect on the local copy we've set here.

            var attrs = this.attrs;
            var attrsOptions = this.attrsOptions;
            this.createFreshAttrs();
            this.trigger("onFormSubmit",this.formName,attrs,attrsOptions);
            attrs = attrsOptions = null;
        }
    },

    /*
        Validation results.
    */

    ///////////////////////////////////////////////////////////////////////////
    // There were validation problems with the fields entered. We will highlight
    // the field that has a problem and output the error message.
    //
    //  @error - object containing `field` and `msg` fields.
    ///////////////////////////////////////////////////////////////////////////

    onAttrsInvalid : function(error) { /* overload and extend (as required) */

        this.clearFormFeedback();

        // add a danger alert at the top of the form

        var alert = $.includejs.getTemplate(this.alertTemplateID,{msg:error.msg,classes:"alert-danger"});
        this.jqoForm.prepend(alert);

        // based upon the field that failed, we will highlight a given
        // UI control, so they know where the problem was. this is all based
        // on Twitter Bootstrap's form and field HTML layout. the field could
        // be an `input` or a `textarea`.

        var field = this.jqoForm.find("input[name="+error.field+"]");
        field = field.length ? field : this.jqoForm.find("textarea[name="+error.field+"]");
        if ( field.length ) {
            field.parent().addClass("has-error");
        }
    },    

    ///////////////////////////////////////////////////////////////////////////
    // The attributes hash has passed validation, so we will notify any listeners
    // of our success. Finally, clear the form and create a fresh attributes hash.
    //
    //  @attrs: The attributes hash returned from `getFormAttrs`.
    //
    ///////////////////////////////////////////////////////////////////////////

    onAttrsValid : function(attrs) { /* overload as required */

        this.clearFormFields();
        this.clearFormFeedback();

        // create a dismissable alert, if we have that text specified

        if ( this.successAlertText ) {

            var html_text = $.includejs.getTemplate(
                this.alertDismissTemplateID,
                {
                    classes:"alert-success",
                    msg:"<strong>Success!</strong> - " + _.result(this,"successAlertText")
                }
            );
            this.jqoForm.prepend(html_text);
        }

        // as our form has been validated, we can now submit it. notice that if we
        // don't have any attributes we're setting them to an empty object. we do this
        // so that our `onSubmit` method will know that the attributes have been processed.

        this.attrs = attrs || {};
        this.attrsOptions = null;
        this.jqoForm.submit();
    }

});