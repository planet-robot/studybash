//---------------------------------------------------------------------------------------
// View: VSectionTestsTake
// Description: This is the section, or parent, view for the entire "Tests"->"Take"
//              section, which may be sent an autoSetID or a testID.
//---------------------------------------------------------------------------------------

var VSectionStudyingTakeTest = VBaseSection.extend({

    /* overloaded */
    id : "section-tests-browse",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : "studying",

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-tests-take";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseSection.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Although the page can change within this section, we never change the
    // URL. Accordingly, all we'll do here is ensure that the URL is valid.
    // The `urlIDs` that we get contain either a .tID or .aID.
    //
    //  @options:   Not used.
    //
    //  @return
    //
    //      If `null` is sent back, that means that we don't have to
    //      change the URL at all. `false` is returned for an error (404), and
    //      a string is returned on success.
    //
    ///////////////////////////////////////////////////////////////////////////

    setURL : function(settings,options) { /* overloaded */

        // we receive either urlIDs, for a single test/autoset, or 
        // manualData for a make-shift test.

        if ( settings.urlIDs ) {

            // we will have been given either tID (testID) or aID (autoSetID). we
            // must have one, we cannot have both, and they must an be integer.

            var urlIDs = settings.urlIDs;

            for ( id in urlIDs ) {
                if ( $.gettype(urlIDs[id]).base !== "undefined" ) {
                    urlIDs[id] = +urlIDs[id];
                    if ( $.gettype(urlIDs[id]).base !== "number" ) {
                        return false;
                    }
                }
            }

            if ( ( !urlIDs.tID && !urlIDs.aID ) || ( urlIDs.tID && urlIDs.aID ) ) {
                return false;
            }
        }

        else if ( settings.manualData ) {

            if (
                    ( $.gettype(settings.manualData.setIDs).base !== "array" ) ||
                    ( !settings.manualData.setIDs.length ) 
                )
            {
                return false;
            }

        }

        // need one or the other.

        else {
            return false;
        }

        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The page is changing within the section. The `urlIDs` do not change as
    // we progress through the pages, only the "pageName" does. And we needn't
    // worry about anything being valid or not, as we set the values ourselves.
    //
    //  @options:   Not used.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {

        var newPageView = null;

        switch ( settings.pageName ) {

            // information before test starts
            case "intro":
                newPageView = new VPageTestsTakeIntro(settings,options);
                break;

            // actually doing the test
            case "doing":
                newPageView = new VPageTestsTakeDoing(settings,options);
                break;

            // test has been completed: review.
            case "outro":
                newPageView = new VPageTestsTakeOutro(settings,options);
                break;
        }

        return newPageView;
    }

});