//---------------------------------------------------------------------------------------
// View: VPageHelpFlashcards
// Description: Main help page.
//---------------------------------------------------------------------------------------

var VPageHelpFlashcards = VBasePageHelp.extend({

    /* overloaded */
    id : "page-help-flashcards",
    tabActiveName : "flashcards",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-help-flashcards";
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
        return new VWidgetHelpFlashcardsPanel({
            templateAttrs:{}
        });
    }

});