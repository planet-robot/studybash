//---------------------------------------------------------------------------------------
// View: VPageHelpClasses
// Description: Main help page.
//---------------------------------------------------------------------------------------

var VPageHelpClasses = VBasePageHelp.extend({

    /* overloaded */
    id : "page-help-classes",
    tabActiveName : "classes",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help-classes";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Create the view(s) for this page.
    ///////////////////////////////////////////////////////////////////////////
    
    instantiatePanel : function(settings,options) { /* overloaded */        
        return new VWidgetHelpClassesPanel({
            templateAttrs:{}
        });
    }

});