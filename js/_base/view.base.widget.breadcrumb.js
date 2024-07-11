//---------------------------------------------------------------------------------------
// View:        VBaseWidgetBreadcrumb
// Description: This view is used to render a breadcrumb. We are given data to start
//              that is sent into `generateCrumbs` and then broken down into an array
//              of objects. Those objects each represent a crumb that can be clicked on.
//
//              Each crumb object that is rendered/managed has the following:
//
//              .crumbDisplay - the string to display in the link
//              .crumbHref - the string that goes inside the 'href' property of the link
//              .crumbData - the object that is set in HTML5 data, returned with event.
//
//              We generate one event here: onClickCrumb. However, if we have failed
//              to generate our crumbs, during `initialize`, you will have to poll us
//              to find out with `hasValidCrumbs` - no listeners will have been
//              attached by then.
//---------------------------------------------------------------------------------------

var VBaseWidgetBreadcrumb = Backbone.View.extend({

    // creating new DOM element
    tagName : "ol",
    className : "widget widget-breadcrumb", /* extend if required */

    /* overload */
    id : undefined,
    templateID : undefined,

    // UI events from the HTML created by this view
    events : {
        "click a.crumb" : "onClickCrumb"
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Generate all of the crumb data objects.
    //
    //  @settings:
    //
    //      Contains the require value:
    //
    //      .data:
    //
    //      this is an array of objects which will be constructed into an ordered
    //      array of crumbs. this must hold enough information for the view to
    //      generate its own list of ordered crumbs. it can be in any format you
    //      want, as the derived breadcrumb views will have to parse it.
    //      
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {

        // `generateCrumbs` will fill the `crumbs` array with objects that
        // have the following fields: .crumbDisplay, .crumbHref, .crumbData. It is the
        // .data field from each object that is returned from onClickCrumb.
        this.crumbs = this.generateCrumbs(settings.data);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Take the array of objects sent and construct our own array of objects
    // with the fields: .crumbDisplay, .crumbHref, .crumbData. Return NULL on failure.
    ///////////////////////////////////////////////////////////////////////////

    generateCrumbs : function(data) { /* overload */
        // no-op
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {        

        // empty references and tell sub-views to cleanup.
        this.crumbs = null;
        this.trigger("cleanup");
        
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // If our call to `generateCrumbs` was unsuccessful, `this.crumbs` will be
    // `null`. Again, we cannot generate an event for this because it was all
    // done in `initialize`, so nobody could have been listening yet.
    ///////////////////////////////////////////////////////////////////////////

    hasValidCrumbs : function() {
        return ( this.crumbs !== null );
    },

    ///////////////////////////////////////////////////////////////////////////
    // Create all the individual crumb views, based upon the crumbs we've 
    // generated. Nothing else to render here.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        if ( this.hasValidCrumbs() ) {

            // create the elements.            
            this.$el.html($.includejs.getTemplate(this.templateID,{crumbs:this.crumbs}));

            // attach the HTML5 data to the elements
            var elem = this.$("a.crumb");
            for ( var x=0; x < elem.length; x++ ) {
                if ( x < this.crumbs.length ) {
                    $(elem[x]).data("crumbData",this.crumbs[x].crumbData);
                }
            }
        }

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked one of the crumbs. We will trigger an event so
    // if anyone cares, they will be notified. The data relating to the crumb
    // is stored in the HTML5 data attached to the crumb's view. The target
    // of the event will be an `a` tag, but we want its parent (which is the
    // VBaseWidgetBreadcrumbCrumb-derived view).
    ///////////////////////////////////////////////////////////////////////////

    onClickCrumb : function(event) {
        this.trigger("onClickCrumb",$(event.currentTarget).data("crumbData"));
        event.preventDefault();
        event.stopPropagation();
    }    

});