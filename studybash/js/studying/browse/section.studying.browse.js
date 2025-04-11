//---------------------------------------------------------------------------------------
// View:        VSectionStudyingBrowse
// Description: This is the section, or parent, view for the entire "Studying" section, which
//              includes browsing classes, groups, users, sets, cards, and tests.
//---------------------------------------------------------------------------------------

var VSectionStudyingBrowse = VBaseSection.extend({

    /* overloaded */
    id : "section-studying",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : "studying",

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-studying";
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

        // base of:
        // #studying/browse/moduleID/groupID/userID/cards/setID/ [OR]
        // #studying/browse/moduleID/groupID/userID/tests/
        var url = "studying/browse/";

        // we may have been given a number of urlIDs, most of which must
        // be integers, but some will be strings of particular values. go
        // through all of our urlIDs and ensure that they are valid. notice
        // that we needn't receive any urlIDs at all either.

        var urlIDs = settings.urlIDs;

        for ( id in urlIDs ) {
            if ( $.gettype(urlIDs[id]).base !== "undefined" ) {

                // the two urlIDs that we might expect strings on are the 'type' and
                // the 'group'.

                // the 'type' MUST be a string, of a particular value.
                if ( id === "tID" ) {
                    if ( ( urlIDs[id] !== "cards" ) && ( urlIDs[id] !== "tests" ) ) {
                        return false;
                    }
                    else {
                        continue;
                    }
                }

                // the group can be a string or an integer.
                else if ( id === "gID" ) {
                    if ( ( urlIDs[id] === "self" ) || ( urlIDs[id] === "pub" ) ) {
                        continue;
                    }
                }

                urlIDs[id] = +urlIDs[id];
                if ( $.gettype(urlIDs[id]).base !== "number" ) {
                    return false;
                }
            }
        }        

        // now ensure that we weren't sent an incorrect number of ids. for ex.,
        // we can't have a uID without having an gID too.

        if (
                ( !urlIDs.mID && urlIDs.gID ) ||
                ( !urlIDs.gID && urlIDs.uID ) ||
                ( !urlIDs.uID && urlIDs.tID ) ||
                ( !urlIDs.tID && urlIDs.sID ) ||
                ( ( urlIDs.tID === "tests" ) && ( urlIDs.sID ) )
            )
        {
            return false;
        }

        // we'll do a quick check to see if someone has sent a url that
        // says "self" (i.e., their content) but without a userID. if that's
        // the case, we'll just set the userID ourselves now.

        if ( ( urlIDs.gID === "self" ) && ( urlIDs.uID !== app.store.get("user").id ) ) {
            urlIDs.uID = app.store.get("user").id;
        }

        // finally, construct the url.

        url += ( urlIDs.mID ? "m"+urlIDs.mID + "/" : "" );
        url += ( urlIDs.gID ? "g"+urlIDs.gID + "/" : "" );        
        url += ( urlIDs.uID ? "u"+urlIDs.uID + "/" : "" );
        url += ( urlIDs.tID ? urlIDs.tID + "/" : "" );
        url += ( urlIDs.sID ? "s"+urlIDs.sID + "/" : "" );

        return url;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The page is changing within the section. We have to figure out which
    // page should be displayed, based upon the member var `settings`. Nothing
    // is done here except for actually creating the pageView itself.
    //
    //  @options:   Any flags to be passed along to the page being constructed.
    //              They were created for `setPage`.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {

        // work our way backwards through the urlIDs that we have. the most specific
        // one we have dictates the type of page that will be displayed.

        var urlIDs = settings.urlIDs;
        var newPageView = null;

        // cards for a set for a user in a group in a class
        if ( urlIDs.sID ) {
            newPageView = new VPageStudyingBrowseCards(settings,options);
        }

        // sets or tests for a user in a group in a class
        else if ( urlIDs.tID ) {            
            if ( urlIDs.tID === "cards" ) {
                newPageView = new VPageStudyingBrowseSets(settings,options);
            }
            else if ( urlIDs.tID === "tests" ) {
                newPageView = new VPageStudyingBrowseTests(settings,options);
            }
        }

        // types of content for a user in a group in a class
        else if ( urlIDs.uID ) {            
            newPageView = new VPageStudyingBrowseTypes(settings,options);
        }

        // users in a group
        else if ( urlIDs.gID ) {
            newPageView = new VPageStudyingBrowseUsers(settings,options);
        }

        // groups in a class
        else if ( urlIDs.mID ) {
            newPageView = new VPageStudyingBrowseGroups(settings,options);
        }

        // modules that the LIU is enrolled in
        else {
            newPageView = new VPageStudyingBrowseModules(settings,options);
        }

        return newPageView;
    }

});