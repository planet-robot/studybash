//---------------------------------------------------------------------------------------
// View: VBaseWidgetRecordEditableDisplay
// Description: One of two possible subViews of a VBaseWidgetRecordEditable. This
//              particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VBaseWidgetRecordEditableDisplay = Backbone.View.extend({

    // creating new DOM element
    tagName : "div",
    
    /* overload and/or extend */
    className : "widget widget-record-editable-display",
    templateID : undefined,

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //  @settings:
    //
    //      .recordSettings. Which contains:
    //
    //          .model - the model we'll be displaying the attributes for.
    //
    //  @options:
    //
    //      Data object sent to VBaseWidgetRecordEditable-derived parent upon
    //      construction.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {        
        this.settings = settings || {};
        this.options = options || {};
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
        this.settings = null;
        this.options = null;

        // jsfiddle for super() testing: http://jsfiddle.net/hLjC2/
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render out the attributes. They will be passed through a filtering
    // function first, at which point any escaping/parsing/altering/etc. will
    // be done.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        var attrs = this.filterModelAttributes();
        this.$el.html($.includejs.getTemplate(this.templateID,attrs));
        this.$("*[data-toggle=tooltip]").tooltip();
        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Any escaping of the text attributes or manipulation of the attributes in
    // any way/shape/form must be done here. Always operate on/return a cloned
    // copy of the model's attributes.
    ///////////////////////////////////////////////////////////////////////////

    filterModelAttributes : function() { /* overload (when required) */
        // no-op.
        return _.clone(this.settings.recordSettings.model.attributes);
    }

});