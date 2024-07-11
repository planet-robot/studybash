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