//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseUsersRecordEditable
// Description: This widget simply displays the record's attributes. Editing is not allowed.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseUsersRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : "widget-studying-browse-users-record-editable",
    templateID : "tpl-widget-studying-browse-users-record-editable",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-studying-browse-users-record-editable";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We do not allow the user to edit/delete models here.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our toolbar is empty for this record, as we cannot manipulate it in
    // any way, except for clicking on it.
    ///////////////////////////////////////////////////////////////////////////

    instantiateToolbarView : function() { /* overloaded */
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Specify the VBaseWidgetRecordEditableDisplay- and
    // VBaseWidgetRecordEditableDisplay-derived views we will use here.
    //
    // The settings and options have already been started by our base view.
    // They will include `recordSettings` (which contains `model`) and 
    // `recordOptions`, respectively. Add whatever we need that's unique here.
    ///////////////////////////////////////////////////////////////////////////    

    instantiateDisplayView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseUsersRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return null;
    }

});