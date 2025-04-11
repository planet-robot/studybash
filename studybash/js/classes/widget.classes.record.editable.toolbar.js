//---------------------------------------------------------------------------------------
// View: VWidgetClassesRecordEditableToolbar
// Description: The toolbar for a VWidgetClassesRecordEditable.
//---------------------------------------------------------------------------------------

var VWidgetClassesRecordEditableToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-classes-record-editable-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-classes-record-editable-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    },

});