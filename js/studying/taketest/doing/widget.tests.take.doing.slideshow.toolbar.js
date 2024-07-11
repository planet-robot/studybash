//---------------------------------------------------------------------------------------
// View: VWidgetTestsTakeDoingSlideshowToolbar
// Description: The toolbar for the slideshow widget shown while taking a test.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingSlideshowToolbar = VBaseWidgetToolbar.extend({

    /* overloaded */
    id : "widget-tests-take-doing-slideshow-toolbar",
    templateID : "tpl-widget-tests-take-doing-slideshow-toolbar",

    className : function() {
        return _.result(VBaseWidgetToolbar.prototype,'className') + " widget-slideshow-toolbar widget-tests-take-doing-slideshow-toolbar";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetToolbar.prototype,'events'),{
        });
    }

});