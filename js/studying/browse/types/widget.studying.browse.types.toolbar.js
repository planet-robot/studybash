//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTypesToolbar
// Description: The toolbar for the "browse types" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTypesToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-types-toolbar",
    templateID : "tpl-widget-studying-browse-types-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-types-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});