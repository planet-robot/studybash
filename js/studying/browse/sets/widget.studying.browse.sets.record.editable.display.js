//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsRecordEditableDisplay
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-record-editable-display",
    templateID : "tpl-widget-studying-browse-sets-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-studying-browse-sets-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    }

});