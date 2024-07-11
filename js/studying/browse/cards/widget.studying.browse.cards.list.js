//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsList
// Description: The list widget for the "browse cards" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-studying-browse-cards-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        var collection = new CardsCollection();
        if ( $.gettype(this.options.sbIsAscending).base !== "undefined" ) {
            collection.isAscending = this.options.sbIsAscending;
        }
        return collection;
    },

    instantiateModel : function() { /* overloaded */
        return new CardModel();
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Simple factory function. The settings and options have been built up
    // already by our base class. Add anything else we need.
    //
    //      settings:
    //
    //          .model
    //          .listSettings
    //
    //      options:
    //
    //          .listOptions
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateWidgetRecordEditable : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseCardsRecordEditable(settings,options);
    }

});