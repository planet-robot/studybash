//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTestsRecordEditableToolbar
// Description: The toolbar for a VWidgetStudyingBrowseTestsRecordEditable.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTestsRecordEditableToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-tests-record-editable-toolbar",
    templateID : "tpl-widget-studying-browse-tests-record-editable-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-tests-record-editable-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    },

});