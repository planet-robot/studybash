//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseGroupsRecordEditableToolbar
// Description: The toolbar for a VWidgetStudyingBrowseGroupsRecordEditable.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsRecordEditableToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-studying-browse-groups-record-editable-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-groups-record-editable-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    },

});