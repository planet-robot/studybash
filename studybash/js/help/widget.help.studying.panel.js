//---------------------------------------------------------------------------------------
// View: VWidgetHelpStudyingPanel
// Description: The panel of information for this page.
//---------------------------------------------------------------------------------------

var VWidgetHelpStudyingPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    id : "widget-help-studying-panel",
    templateID : "tpl-widget-help-studying-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-help-studying-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});