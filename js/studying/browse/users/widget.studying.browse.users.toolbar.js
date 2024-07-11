//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseUsersToolbar
// Description: The toolbar for the "browse users" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseUsersToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-users-toolbar",
    templateID : "tpl-widget-studying-browse-users-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-users-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});