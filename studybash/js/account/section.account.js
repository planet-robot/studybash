//---------------------------------------------------------------------------------------
// View: VSectionAccount
// Description: This section deals with logging in, registering, verifying, and resetting.
//              With a page being devoted to each.
//---------------------------------------------------------------------------------------

var VSectionAccount = VBaseSection.extend({

    /* overloaded */
    id : "section-account",
    sectionTemplateID : "tpl-section-welcome",
    headerTemplateID : "tpl-section-header-welcome",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : undefined, // not used

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-account";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseSection.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The page is changing within the section. We have to construct a URL
    // based upon the `settings` given. Note that the URL constructed is simply
    // copied into the address bar, there is no routing involved.
    //
    //  @options:   Any flags that are going to be passed along to the page
    //              construction. They was created for `setPage`.
    //
    //  @return
    //
    //      If `null` is sent back, that means that we don't have to
    //      change the URL at all. `false` is returned for an error (404), and
    //      a string is returned on success.
    //
    ///////////////////////////////////////////////////////////////////////////

    setURL : function(settings,options) { /* overloaded */

        // if we were sent here by the router, then we have nothing to do.
        if ( options.sbFromRouter ) {
            return null;
        }

        // we will have been given a string in `settings` called `pageName`.
        // we'll just use that to dictate the URL.

        if (
                ( settings.pageName === "login" ) ||
                ( settings.pageName === "register" ) ||
                ( settings.pageName === "verify" ) ||
                ( settings.pageName === "reset" )
            )
        {
            return settings.pageName + "/";
        }

        // 404.

        else {
            return false;
        }
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

            case "login":
                newPageView = new VPageAccountLogin(settings,options);
                break;

            case "register":
                newPageView = new VPageAccountRegister(settings,options);
                break;

            case "verify":
                newPageView = new VPageAccountVerify(settings,options);
                break;

            case "reset":
                newPageView = new VPageAccountReset(settings,options);
                break;
        }

        return newPageView;
    }

});