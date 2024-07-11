//---------------------------------------------------------------------------------------
// View:        VWidgetStudyingBrowseTypesFormFilter
// Description: We inherit everything from VBaseWidgetBrowseFormFilter.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTypesFormFilter = VBaseWidgetBrowseFormFilter.extend({

    /* overloaded */
    id : "widget-studying-browse-types-form-filter",

    className : function() {
        return _.result(VBaseWidgetBrowseFormFilter.prototype,'className') + " widget-studying-browse-types-form-filter";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBrowseFormFilter.prototype,'events'),{
        });
    }
});