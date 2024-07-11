//---------------------------------------------------------------------------------------
// View: VWidgetClassesToolbar
// Description: The toolbar for the "classes" page.
//---------------------------------------------------------------------------------------

var VWidgetClassesToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-classes-toolbar",
    templateID : "tpl-widget-classes-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-classes-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});