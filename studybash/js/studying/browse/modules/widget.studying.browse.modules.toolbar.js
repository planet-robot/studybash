//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseModulesToolbar
// Description: The toolbar for the "browse modules" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseModulesToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-modules-toolbar",
    templateID : "tpl-widget-studying-browse-modules-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-modules-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});