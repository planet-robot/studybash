//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsToolbar
// Description: The toolbar for the "browse sets" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-toolbar",
    templateID : "tpl-widget-studying-browse-sets-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-sets-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});