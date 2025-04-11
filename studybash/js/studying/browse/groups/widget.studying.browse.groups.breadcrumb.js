//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseGroupsBreadcrumb
// Description: We inherit everything from VBaseWidgetBreadcrumb.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsBreadcrumb = VBaseWidgetBreadcrumb.extend({

    /* overloaded */
    id : "widget-studying-browse-groups-breadcrumb",
    templateID : "tpl-widget-studying-browse-groups-breadcrumb",

    className : function() {
        return _.result(VBaseWidgetBreadcrumb.prototype,'className') + " breadcrumb widget-studying-browse-groups-breadcrumb";
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

        // we are constructing only a single crumb here, containing the
        // class code/semester/year.

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
        
        crumb.crumbDisplay = crumbInfo.subject_code + " " + crumbInfo.class_code + " (" + crumbInfo.semester_name + ", " + crumbInfo.year + ")";
        crumb.crumbDisplay = $.leftovers.parse.crop_string(crumb.crumbDisplay,40);
        crumb.crumbHref = app.JS_ROOT + "#studying/browse/";
        crumb.crumbData = {urlIDs:{}};

        breadcrumb.push(crumb);
        return breadcrumb;
    }

});