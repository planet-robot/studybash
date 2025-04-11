//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTestsToolbar
// Description: The toolbar for the "browse tests" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTestsToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-tests-toolbar",
    templateID : "tpl-widget-studying-browse-tests-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-tests-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});