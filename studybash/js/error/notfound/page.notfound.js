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