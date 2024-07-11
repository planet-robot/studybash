//---------------------------------------------------------------------------------------
// View: VPageHelpStudying
// Description: Main help page.
//---------------------------------------------------------------------------------------

var VPageHelpStudying = VBasePageHelp.extend({

    /* overloaded */
    id : "page-help-studying",
    tabActiveName : "studying",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help-studying";
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
        return new VWidgetHelpStudyingPanel({
            templateAttrs:{}
        });
    }

});