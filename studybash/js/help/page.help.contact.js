//---------------------------------------------------------------------------------------
// View: VPageHelpContact
// Description: The "contact us" page.
//---------------------------------------------------------------------------------------

var VPageHelpContact = VBasePageHelp.extend({

    /* overloaded */
    id : "page-help-general",
    tabActiveName : "contact",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help-contact";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Create the view(s) for this page.
    ///////////////////////////////////////////////////////////////////////////
    
    instantiateForm : function(settings,options) { /* overloaded */        
        return new VWidgetHelpFormContact({
            pageSettings:settings
        });
    }

});