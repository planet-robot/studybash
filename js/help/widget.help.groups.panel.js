//---------------------------------------------------------------------------------------
// View: VWidgetHelpGroupsPanel
// Description: The panel of information for this page.
//---------------------------------------------------------------------------------------

var VWidgetHelpGroupsPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    id : "widget-help-groups-panel",
    templateID : "tpl-widget-help-groups-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-help-groups-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});