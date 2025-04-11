//---------------------------------------------------------------------------------------
// View:        VWidgetStudyingBrowseUsersFormFilter
// Description: We inherit everything from VBaseWidgetBrowseFormFilter.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseUsersFormFilter = VBaseWidgetBrowseFormFilter.extend({

    /* overloaded */
    id : "widget-studying-browse-users-form-filter",

    className : function() {
        return _.result(VBaseWidgetBrowseFormFilter.prototype,'className') + " widget-studying-browse-users-form-filter";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBrowseFormFilter.prototype,'events'),{
        });
    }
});