//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseUsersList
// Description: The list widget for the "browse users" page of the "studying" section.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseUsersList = VBaseWidgetList.extend({

    /* overloaded */
    id : "widget-studying-browse-users-list",
    
    className : function() {
        return _.result(VBaseWidgetList.prototype,'className') + " widget-studying-browse-users-list";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetList.prototype,'events'),{
        });
    },

    instantiateCollection : function() { /* overloaded */
        var collection = new UsersCollection();
        if ( $.gettype(this.options.sbIsAscending).base !== "undefined" ) {
            collection.isAscending = this.options.sbIsAscending;
        }
        if ( $.gettype(this.options.sbSortCriteria).base !== "undefined" ) {
            collection.sortCriteria = this.options.sbSortCriteria;
        }
        return collection;
    },

    instantiateModel : function() { /* overloaded */
        return new UserModel();
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Simple factory function. The settings and options have been built up
    // already by our base class. Add anything else we need.
    //
    //      settings:
    //
    //          .model
    //          .listSettings
    //
    //      options:
    //
    //          .listOptions
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateWidgetRecordEditable : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseUsersRecordEditable(settings,options);
    }

});