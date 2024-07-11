//---------------------------------------------------------------------------------------
// View: VWidgetHelpClassesPanel
// Description: The panel of information for this page.
//---------------------------------------------------------------------------------------

var VWidgetHelpClassesPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    id : "widget-help-classes-panel",
    templateID : "tpl-widget-help-classes-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-help-classes-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});