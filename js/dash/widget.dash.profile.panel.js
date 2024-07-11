//---------------------------------------------------------------------------------------
// View: VWidgetDashProfilePanel
// Description: Displays the user's profile information.
//---------------------------------------------------------------------------------------

var VWidgetDashProfilePanel = VBaseWidgetPanel.extend({

    /* overloaded */
    className : undefined,
    templateID : "tpl-dash-profile",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-panel-dash-profile";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});