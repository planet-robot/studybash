//---------------------------------------------------------------------------------------
// View: VWidgetHelpTestsPanel
// Description: The panel of information for this page.
//---------------------------------------------------------------------------------------

var VWidgetHelpTestsPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    id : "widget-help-tests-panel",
    templateID : "tpl-widget-help-tests-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-help-tests-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});