//---------------------------------------------------------------------------------------
// View: VPageHelpGroups
// Description: Main help page.
//---------------------------------------------------------------------------------------

var VPageHelpGroups = VBasePageHelp.extend({

    /* overloaded */
    id : "page-help-groups",
    tabActiveName : "groups",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help-groups";
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
        return new VWidgetHelpGroupsPanel({
            templateAttrs:{}
        });
    }

});