//---------------------------------------------------------------------------------------
// View:        VWidgetTestsTakeDoingPanelTimer
// Description: Displays a brief template regarding the time spent, using attributes hash
//              sent to us.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingPanelTimer = VBaseWidgetPanel.extend({

    /* overload (as required) */
    tagName : "div",

    /* overload */
    id : "widget-tests-take-doing-panel-timer",
    templateID : "tpl-widget-tests-take-doing-panel-timer", // we render an attributes hash to this

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-tests-take-doing-panel-timer";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    }

});