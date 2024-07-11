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