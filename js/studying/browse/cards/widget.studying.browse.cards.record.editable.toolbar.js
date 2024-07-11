//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsRecordEditableToolbar
// Description: The toolbar for a VWidgetStudyingBrowseCardsRecordEditable.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsRecordEditableToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-record-editable-toolbar",
    templateID : "tpl-widget-studying-browse-cards-record-editable-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-cards-record-editable-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    },

});