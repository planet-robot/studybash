//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseModulesRecordEditableDisplay
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseModulesRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-studying-browse-modules-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-studying-browse-modules-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    }

});