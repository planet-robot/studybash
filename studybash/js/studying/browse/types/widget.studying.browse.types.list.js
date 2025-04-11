//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTypesList
// Description: The list widget for the "browse types" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTypesList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-studying-browse-types-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-studying-browse-types-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        var collection = new TypesCollection();
        return collection;
    },

    instantiateModel : function() { /* overloaded */
        return new TypeModel();
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
        return new VWidgetStudyingBrowseTypesRecordEditable(settings,options);
    }

});