//---------------------------------------------------------------------------------------
// View: VWidgetTestsTakeDoingRecordEditableToolbar
// Description: The toolbar for a VWidgetTestsTakeDoingRecordEditable.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingRecordEditableToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-tests-take-doing-record-editable-toolbar",
    templateID : "tpl-widget-tests-take-doing-record-editable-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-tests-take-doing-record-editable-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    },

});