//---------------------------------------------------------------------------------------
// View: VWidgetLogoutPanel
// Description: Displays a goodbye message for the user.
//---------------------------------------------------------------------------------------

var VWidgetLogoutPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    className : undefined,
    templateID : "tpl-widget-logout-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-logout-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});