//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseModulesList
// Description: The list widget for the "browse modules" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseModulesList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-studying-browse-modules-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-studying-browse-modules-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        return new EnrollmentCollection();
    },

    instantiateModel : function() { /* overloaded */
        return new EnrollmentModel();
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
        return new VWidgetStudyingBrowseModulesRecordEditable(settings,options);
    }

});