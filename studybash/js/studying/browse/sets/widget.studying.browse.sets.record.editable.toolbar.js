//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsRecordEditableToolbar
// Description: The toolbar for a VWidgetStudyingBrowseSetsRecordEditable.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsRecordEditableToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-record-editable-toolbar",
    templateID : "tpl-widget-studying-browse-sets-record-editable-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-sets-record-editable-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});