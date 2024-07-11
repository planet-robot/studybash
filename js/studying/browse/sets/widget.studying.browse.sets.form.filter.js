//---------------------------------------------------------------------------------------
// View:        VWidgetStudyingBrowseSetsFormFilter
// Description: We inherit everything from VBaseWidgetBrowseFormFilter.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsFormFilter = VBaseWidgetBrowseFormFilter.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-form-filter",

    className : function() {
        return _.result(VBaseWidgetBrowseFormFilter.prototype,'className') + " widget-studying-browse-sets-form-filter";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBrowseFormFilter.prototype,'events'),{
        });
    }
});