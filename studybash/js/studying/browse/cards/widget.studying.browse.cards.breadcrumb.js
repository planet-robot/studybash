//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsBreadcrumb
// Description: We inherit everything from VBaseWidgetBreadcrumb.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsBreadcrumb = VBaseWidgetBreadcrumb.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-breadcrumb",
    templateID : "tpl-widget-studying-browse-cards-breadcrumb",

    className : function() {
        return _.result(VBaseWidgetBreadcrumb.prototype,'className') + " breadcrumb widget-studying-browse-cards-breadcrumb";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetBreadcrumb.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Given an array of objects, each representing enough information to
    // build a single crumb, we will construct an ordered array of objects that
    // each contain the following fields: .display, .href, .data.
    //
    //  @data:    
    //
    //      array of objects. will have a `crumbName` field to tell
    //      us what information is in a particular object.
    //
    //  @return:
    //
    //      An ordered array of objects, containing the fields mentioned above.
    //      Return `null` for failure.
    //          
    ///////////////////////////////////////////////////////////////////////////

    generateCrumbs : function(data) { /* overloaded */

        var crumbInfo = null; // from sent data
        var breadcrumb = []; // returned ary
        var crumb = {}; // goes into ary

        // moduleID

        crumbInfo = _.find(data,function(o){
            return o.crumbName === "moduleID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        
        var moduleID = crumbInfo.module_id;
        crumb.crumbDisplay = crumbInfo.subject_code + " " + crumbInfo.class_code + " (" + crumbInfo.semester_name + ", " + crumbInfo.year + ")";
        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/";
        crumb.crumbData = {urlIDs:{}};
        breadcrumb.push(crumb);

        // groupID.

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "groupID";
        });
        if ( !crumbInfo ) {
            return null;
        }

        var groupID = crumbInfo.id;
        if ( crumbInfo.id === "self" ) {
            crumb.crumbDisplay = "My Stuff";            
        }
        else if ( crumbInfo.id === "pub" ) {
            crumb.crumbDisplay = "Public Studygroup";
        }
        else {
            crumb.crumbDisplay = "Studygroup (" + crumbInfo.created_by_first_name + ")";
        }

        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID}};
        breadcrumb.push(crumb);

        // userID
        // NOTE: we are only interested in doing 'userID' if we do not have a groupID of "self". let's check
        // the data.

        selfCrumb = _.find(data,function(o){
            return ( ( o.crumbName === "groupID" ) && ( o.id === "self" ) );
        });        

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "userID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        var userID = crumbInfo.id;
        if ( !selfCrumb ) {
            crumb.crumbDisplay = crumbInfo.full_name;
            crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
            crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/" +  "g" + groupID + "/";
            crumb.crumbData = {urlIDs:{mID:moduleID,gID:groupID}};
            breadcrumb.push(crumb);
        }

        // typeID.

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "typeID";
        });
        if ( !crumbInfo ) {
            return null;
        }

        var typeID = crumbInfo.id;
        if ( crumbInfo.id === "cards" ) {
            crumb.crumbDisplay = "Flashcards";            
        }
        else if ( crumbInfo.id === "tests" ) {
            crumb.crumbDisplay = "Tests";
        }

        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/" + "g" + groupID + "/" + "u" + userID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID,gID:groupID,uID:userID}};
        breadcrumb.push(crumb);

        // setID.

        var crumb = {};
        crumbInfo = _.find(data,function(o){
            return o.crumbName === "setID";
        });
        if ( !crumbInfo ) {
            return null;
        }
        crumb.crumbDisplay = crumbInfo.set_name + ( crumbInfo.description ? " (" + crumbInfo.description + ")" : "" );
        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/" + "m" + moduleID + "/" + "g" + groupID + "/" + "u" + userID + "/" + typeID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID,gID:groupID,uID:userID,tID:typeID}};
        breadcrumb.push(crumb);
        
        return breadcrumb;
    }

});