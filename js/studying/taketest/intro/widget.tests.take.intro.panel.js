//---------------------------------------------------------------------------------------
// View:        VWidgetTestsTakeIntroPanel
// Description: Widget that displays the test's information in a panel, with an
//              optional button to get 'more info' on the test (i.e., detailed sets
//              info).
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeIntroPanel = VBaseWidgetPanel.extend({

    /* overload (as required) */
    tagName : "div",

    /* overload */
    id : "widget-tests-take-intro-panel",
    templateID : "tpl-widget-tests-take-intro-panel", // we render an attributes hash to this

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-tests-take-intro-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
        });
    }

});