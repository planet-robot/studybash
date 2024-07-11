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