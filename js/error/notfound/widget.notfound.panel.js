//---------------------------------------------------------------------------------------
// View: VWidgetNotfoundPanel
// Description: Displays the 404 "page not found" template
//---------------------------------------------------------------------------------------

var VWidgetNotfoundPanel = VBaseWidgetPanel.extend({

    /* overloaded */
    templateID : "tpl-widget-notfound-panel",

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-notfound-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    },

});