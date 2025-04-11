//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTestsList
// Description: The list widget for the "browse tests" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTestsList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-studying-browse-tests-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-studying-browse-tests-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        var collection = new TestsCollection();
        if ( $.gettype(this.options.sbIsAscending).base !== "undefined" ) {
            collection.isAscending = this.options.sbIsAscending;
        }
        return collection;
    },

    instantiateModel : function() { /* overloaded */
        return new TestModel();
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
        return new VWidgetStudyingBrowseTestsRecordEditable(settings,options);
    }

});