//---------------------------------------------------------------------------------------
// View:        VWidgetTestsTakeDoingPanelDetails
// Description: Widget that displays the current stats/info regarding the test in a panel.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingPanelDetails = VBaseWidgetPanel.extend({

    /* overload (as required) */
    tagName : "div",

    /* overload */
    id : "widget-tests-take-doing-panel-details",
    templateID : "tpl-widget-tests-take-doing-panel-details", // we render an attributes hash to this

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-tests-take-doing-panel-details";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    }

});