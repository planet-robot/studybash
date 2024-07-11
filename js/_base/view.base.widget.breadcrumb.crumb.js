//---------------------------------------------------------------------------------------
// View: VBaseWidgetBreadcrumbCrumb
// Description: A view representing a single crumb in our parent VBaseWidgetBreadcrumb
//              instance.
//---------------------------------------------------------------------------------------

var VBaseWidgetBreadcrumbCrumb = Backbone.View.extend({

    // creating new DOM element
    tagName : "li",

    /* overload */
    id : undefined,
    className : "widget widget-breadcrumb-crumb",

    // UI events from the HTML created by this view
    events : {
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Copy over the information we need from parms into members, then setup
    // the HTML5 data of our element to be that which is associated with the
    // crumb itself.
    //
    //  @settings:
    //
    //      .numCrumb - out of N crumbs, what number are we? (1-based)
    //      .totalCrumbs - N crumbs (1-based)
    //      .maxDisplayLength - how long can the display string be?
    //      .crumb - data object, contains AT LEAST `.displayStr`
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings) {
        
        this.numCrumb = settings.numCrumb;
        this.totalCrumbs = settings.totalCrumbs;
        this.maxDisplayLength = settings.maxDisplayLength;
        this.crumb = settings.crumb;
        this.$el.data("crumb",this.crumb);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        // all subview(s) will be listening for this event.
        this.trigger("cleanup");

        // empty references
        this.crumb = null;
        this.stopListening();
        
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // We are creating an `a` element inside our own $el, that represents the
    // clickable crumb.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        var displayStr = $.leftovers.parse.crop_string(this.crumb.displayStr,this.maxDisplayLength);

        var a = $("<a></a>")
        .prop("href","#")
        .addClass(this.numCrumb === this.totalCrumbs ? "active" : "")
        .html(displayStr);

        this.$el.html(a);

        return this;
    }

});