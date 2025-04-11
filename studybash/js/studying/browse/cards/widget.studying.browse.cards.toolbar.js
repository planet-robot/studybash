//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsToolbar
// Description: The toolbar for the "browse cards" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-toolbar",
    templateID : "tpl-widget-studying-browse-cards-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-studying-browse-cards-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});