//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseGroupsToolbar
// Description: The toolbar for the "browse groups" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-groups-toolbar",
    templateID : "tpl-widget-studying-browse-groups-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-groups-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});