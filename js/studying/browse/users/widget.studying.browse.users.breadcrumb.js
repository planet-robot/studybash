//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseUsersBreadcrumb
// Description: We inherit everything from VBaseWidgetBreadcrumb.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseUsersBreadcrumb = VBaseWidgetBreadcrumb.extend({

    /* overloaded */
    id : "widget-studying-browse-users-breadcrumb",
    templateID : "tpl-widget-studying-browse-users-breadcrumb",

    className : function() {
        return _.result(VBaseWidgetBreadcrumb.prototype,'className') + " breadcrumb widget-studying-browse-users-breadcrumb";
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
        crumb.crumbHref = app.JS_ROOT + "#flashcards/";
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

        if ( crumbInfo.id === "self" ) {
            crumb.crumbDisplay = "My Flashcards";            
        }
        else if ( crumbInfo.id === "pub" ) {
            crumb.crumbDisplay = "Public Studygroup";
        }
        else {
            crumb.crumbDisplay = "Studygroup (" + crumbInfo.created_by_first_name + ")";
        }

        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);

        var addedUrlIDs = {};
        if ( crumbInfo.id === "self" ) {
            addedUrlIDs.uID = app.store.get("user").id;
        }
        addedUrlIDs.gID = crumbInfo.id;

        crumb.crumbHref = app.JS_ROOT + "#flashcards/" + "m" + moduleID + "/";
        crumb.crumbData = {urlIDs:{mID:moduleID}};
        breadcrumb.push(crumb);
        
        return breadcrumb;
    }

});