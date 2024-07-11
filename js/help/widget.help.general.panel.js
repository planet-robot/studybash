//---------------------------------------------------------------------------------------
// View: VWidgetHelpGeneralPanel
// Description: The panel of information for this page.
//---------------------------------------------------------------------------------------

var VWidgetHelpGeneralPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    id : "widget-help-general-panel",
    templateID : "tpl-widget-help-general-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-help-general-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});