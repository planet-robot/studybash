//---------------------------------------------------------------------------------------
// View: VSectionHelp
// Description: The 'help' section.
//---------------------------------------------------------------------------------------

var VSectionHelp = VBaseSection.extend({

    /* overloaded */
    id : "section-help",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : "help",

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-help";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseSection.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We never change the URL here. Sending `null` tells our caller that.
    ///////////////////////////////////////////////////////////////////////////

    setURL : function(settings,options) { /* overloaded */
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The page is changing within the section. We have to figure out which
    // page should be displayed, based upon our member var `settings`. Nothing
    // is done here except for actually creating the pageView itself.
    //
    //  @options:   Any flags to be passed along to the page being constructed.
    //              They were created for `setPage`.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {

        var newPageView = null;

        switch ( settings.pageName ) {

            case "general":
                newPageView = new VPageHelpGeneral(settings,options);
                break;

            case "classes":
                newPageView = new VPageHelpClasses(settings,options);
                break;

            case "studying":
                newPageView = new VPageHelpStudying(settings,options);
                break;

            case "groups":
                newPageView = new VPageHelpGroups(settings,options);
                break;

            case "flashcards":
                newPageView = new VPageHelpFlashcards(settings,options);
                break;

            case "tests":
                newPageView = new VPageHelpTests(settings,options);
                break;            

            case "contact":
                newPageView = new VPageHelpContact(settings,options);
                break;            
        }

        return newPageView;
    }

});