//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsRecordEditable
// Description: This widget is used to display a model's attributes and give the user the
//              ability to edit them. We have a toolbar, for the buttons relating to the
//              record (e.g., select, edit). By default, we provide functionality for
//              select, edit, and delete buttons; although they do not need to exist in
//              the toolbar, as they'll just not be used then. Note that a toolbar
//              itself is not actually required, it can be null and then won't be
//              processed.
//
//              Beyond the toolbarView, we also have a recordView which either displays
//              the model's attributes or an edit form.
//
//              The 'Select' button simply add/removes a class to the element created here.
//              Delete attempts to `destroy` the contained model and 'Edit' changes the
//              recordView (contained here) to either a VBaseWidgetRecordEditableDisplay- or
//              VBaseWidgetRecordEditableEdit-derived view.
//
//              Notice that we do not add ourselves to any parent element here, we
//              simply render out our information and then our owner view will render
//              us in the appropriate position.
//
//              We trigger three events here: onEditSave, onEditCancel.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-record-editable",
    templateID : "tpl-widget-studying-browse-sets-record-editable",
    flagDialogTitle : "Flag Set",
    flagDialogMsg : "<p>Are you sure you want to flag this set as inappropriate?</p>",
    deleteDialogTitle : "Delete Set",
    deleteDialogMsg : "<p>Are you sure you want to delete this set? You will lose its cards as well! WARNING: THIS CANNOT BE UNDONE!</p>",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-studying-browse-sets-record-editable";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },    

    ///////////////////////////////////////////////////////////////////////////
    // As the user might be able to edit/delete models here, we need to update
    // the model's urlRoot variable so we know how to contact the server.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        this.settings.model.urlRoot = this.settings.model.baseUrlRoot + "/" + this.settings.listSettings.urlIDs.mID + "/" + this.settings.listSettings.urlIDs.uID;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Based upon our current state, and the particular user that's looking,
    // we will figure out which toolbar buttons are enabled.
    ///////////////////////////////////////////////////////////////////////////

    setToolbarButtonsEnabled : function() { /* overloaded and extended */

        VBaseWidgetRecordEditable.prototype.setToolbarButtonsEnabled.call(this);

        // if we aren't editing, then whether or not we can use certain
        // buttons will depend on whether this belongs to us

        var isUser = this.settings.listSettings.urlIDs.uID === app.store.get("user").id;

        if ( !this.isEditing ) {
            this.toolbarView.setEnabled({
                select : true,
                edit : isUser,
                flag : !isUser,
                delete : isUser
            });
        }
    },

    instantiateToolbarView : function() { /* overloaded */
        return new VWidgetStudyingBrowseSetsRecordEditableToolbar();
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
        return new VWidgetStudyingBrowseSetsRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseSetsRecordEditableEdit(settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to either be saved or destroyed on the server. Display
    // the error to the user. We only get a `userError` on change:is_flagged, as 
    // they may be unsuccessful in applying their flag.
    //
    //  @options: All backbone.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VWidgetStudyingBrowseSetsRecordEditable__onModelError(model,xhr,options) { /* overloaded */

        Spinner.get().hide(function(){

            var userError = app.getAjaxUserError(xhr);

            if ( ( xhr.status === 400 ) && ( userError ) && ( ( userError.type === "flag-reputation" ) || ( userError.type === "flag-duplicate" ) ) ) {

                var msg = null;
                if ( userError.type === "flag-reputation" ) {
                    msg = "You are not able to flag any more content for the moment. Please give the administrators time to evaluate your previous flags.";
                }
                else {
                    msg = "You have already flagged that content. Please give the administrators time to evaluate your previous flag.";
                }
                
                bsDialog.create({
                    title : "Error!",
                    msg : "<p>" + msg + "</p>",
                    ok : function() {}
                });
            }
            else {
                app.dealWithAjaxFail(xhr,null,null);
            }

        });
    }

});