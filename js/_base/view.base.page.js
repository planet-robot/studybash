//---------------------------------------------------------------------------------------
// View: VBasePage
// Description: This is the base view for a page that exists within a section.
//
//              When our page is ready to be rendered an "onPageReady" event is
//              triggered, for any parent who cares. If the page fails to prepare for
//              rendering then an "onPageFailed" event is triggered. In both cases, we
//              send along a parameter of `this` (i.e., the page that is generating the
//              event).
//---------------------------------------------------------------------------------------

var VBasePage = Backbone.View.extend({

    // creating new DOM element
    tagName : "div",

    /* overload */
    id : undefined,
    className : "page",
    pageTemplateID : undefined,
    contentTemplateID : undefined, // leave undefined to not template this element.
    footerTemplateID : undefined,
    contentElement : undefined,
    footerElement : undefined,

    // UI events from the HTML created by this view
    events : {
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //  @settings:
    //
    //      These were sent to VSection::setPage and were used to determine
    //      what page should be instantiated (i.e., us!). So they will
    //      have passed through VSection for sure.
    //
    //  @options:
    //
    //      Any optional flags that relate to the page being instantiated.
    //      They were created for `VBaseSection.setPage`
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overload if required */
        this.settings = settings || {};
        this.options = options || {};
    },

    ///////////////////////////////////////////////////////////////////////////
    // Load all of the data that is required for the page. When completed we
    // call `ready`, which gets us ready to render and notifies any listeners
    // that we have finished loading and ready to be rendered.
    //
    // If we want a spinner shown at this point, we'll have to do so ourselves.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function() { /* overload if required */        
        // no-op.
        this.ready();
    },

    ///////////////////////////////////////////////////////////////////////////
    // When the `content` element is rendered, using the `content` template,
    // this function provides the attributes hash to be sent to that template.
    ///////////////////////////////////////////////////////////////////////////

    getContentAttributes : function() { /* overload as required */
        // no-op.
        return {};
    },

    ///////////////////////////////////////////////////////////////////////////
    // All of the data has been loaded that the page requires. We will
    // construct our subviews and then trigger an event notifying whoever is
    // listening that we're ready to render.
    ///////////////////////////////////////////////////////////////////////////

    ready : function() { /* overload and extend (if required) */
        this.trigger("onPageReady",this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extent (as required) */        

        // NOTE: inheriting views will extend this function and then simply 
        // empty their local references before calling this method and
        // returning its return value. It's fine to nullify a reference to
        // a view that was listening to you, as it won't affect their ability
        // to execute the method setup in the listenTo:
        // http://jsfiddle.net/HgGLa/

        // empty references 
        this.settings = null;
        this.options = null;        

        // send a message to any listening views that we're cleaning up.
        this.trigger("cleanup");

        // jsfiddle for super() testing: http://jsfiddle.net/hLjC2/
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML templates for both the page and the content,
    // before rendering the footer template's HTML.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overload and extend (as required) */        

        this.$el.html($.includejs.getTemplate(this.pageTemplateID));

        // the content element may not need to be templated. if not, it will
        // just remain an empty element for now.

        if ( this.contentTemplateID ) {
            this.$(this.contentElement).html($.includejs.getTemplate(this.contentTemplateID,this.getContentAttributes()));
        }

        // the only information our footer needs it the current year. and that's apart
        // of all the templates by default.

        this.$(this.footerElement).html($.includejs.getTemplate(this.footerTemplateID));
        return this;
    }

});