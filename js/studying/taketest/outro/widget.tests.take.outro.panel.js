//---------------------------------------------------------------------------------------
// View:        VWidgetTestsTakeOutroPanel
// Description: Shows some summary information about what test was taken, as well as
//              the time taken and number correct.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeOutroPanel = VBaseWidgetPanel.extend({

    /* overload (as required) */
    tagName : "div",

    /* overload */
    id : "widget-tests-take-outro-panel",
    templateID : "tpl-widget-tests-take-outro-panel", // we render an attributes hash to this

    className : function() {
        return _.result(VBaseWidgetPanel.prototype,'className') + " widget-tests-take-outro-panel";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetPanel.prototype,'events'),{
            "click button[name=button_cancel]" : "onClickCancel"
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We added a second button to this panel.
    ///////////////////////////////////////////////////////////////////////////

    onClickCancel : function(event) {
        this.trigger("onPanelCancel",event);
    }

});