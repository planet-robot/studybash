//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseUsersRecordEditableDisplay
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseUsersRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : "widget-studying-browse-users-record-editable-display",
    templateID : "tpl-widget-studying-browse-users-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-studying-browse-users-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    }

});