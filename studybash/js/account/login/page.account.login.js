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