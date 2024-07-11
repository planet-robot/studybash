//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTestsRecordEditable
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
//              We trigger two events here: onRecordSave, onRecordDestroy.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTestsRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : "widget-studying-browse-tests-record-editable",
    templateID : "tpl-widget-studying-browse-tests-record-editable",
    flagDialogTitle : "Flag Test",
    flagDialogMsg : "<p>Are you sure you want to flag this test as inappropriate?</p>",
    deleteDialogTitle : "Delete Test",
    deleteDialogMsg : "<p>Are you sure you want to delete this test? WARNING: THIS CANNOT BE UNDONE!</p>",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-studying-browse-tests-record-editable";
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

        // if we aren't editing, then only 'take' is always available
        // to us. however, the rest are only available if the test record belongs to us
        // AND is not an auto_test, except for info which is available on anything but
        // an auto test.

        var isUser = this.settings.listSettings.urlIDs.uID === app.store.get("user").id;
        var notAuto = !this.settings.model.get("is_auto_test");

        if ( !this.isEditing ) {
            this.toolbarView.setEnabled({
                info : notAuto,
                take : true,
                select : isUser&&notAuto,
                edit : isUser&&notAuto,
                flag : !isUser&&notAuto,
                delete : isUser&&notAuto
            });
        }
    },

    instantiateToolbarView : function() { /* overloaded */
        return new VWidgetStudyingBrowseTestsRecordEditableToolbar();
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
        return new VWidgetStudyingBrowseTestsRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseTestsRecordEditableEdit(settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // One of the toolbar buttons that is associated directly with this record
    // has been clicked. The base view deals with some of the buttons, and we
    // deal with the leftovers.
    //
    //  @buttonName - the `name` field from the HTML of the buttton.
    //  @event - raw 'click' event data.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,event) { /* overloaded and extend */

        // our base view will deal with `select`, `edit`, and `delete`.
        VBaseWidgetRecordEditable.prototype.onClickToolbar.call(this,buttonName,event);

        // we will deal with the two unique ones here:

        // INFO

        if ( buttonName === "info" ) {

            // we have to build the attributes for the information template. first thing we
            // have to do is convert our tag IDs into strings of text.

            var tagsText = _.map(
                this.settings.model.get("tags"),
                function(id){
                    var obj = _.find(
                        app.store.get("card.tags"),
                        function(o){
                            return o.id===id;
                        }
                    )

                    return obj.tag_text;
                }
            );

            // convert the tags text and keywords text into strings for display

            tagsText = tagsText.length ? tagsText.join(", ") : "None";
            var keywordsText = this.settings.model.get("keywords").length ? this.settings.model.get("keywords").join(", ") : "None";

            // if we have an is_auto_test here, then there is no detailed setsInfo 
            // (as that information is stored in the test itself, with the name and description).

            var attrs = {};
            if ( this.settings.model.get("is_auto_test") ) {
                attrs = {
                    num_cards : this.settings.model.get("num_cards"),
                    setsInfo : null
                };
            }
            else {
                attrs = _.extend({},this.settings.model.attributes,{tagsText:tagsText,keywordsText:keywordsText});
            }

            // generate the HTML content for our bootstrap modal and then display it.            

            var html = $.includejs.getTemplate("tpl-widget-studying-browse-tests-record-editable-info",attrs);
            bsDialog.create({                
                title : "Test Information",
                msg : html,
                ok : function() {}
            });
        }

        // TAKE TEST

        else if ( buttonName === "take" ) {

            var id = this.settings.model.get("id");
            var isAuto = this.settings.model.get("is_auto_test");
            app.router.navigate(
                isAuto ? "studying/taketest/auto/"+id+"/" : "studying/taketest/"+id+"/",
                {trigger:true}
            );
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to either be saved or destroyed on the server. Display
    // the error to the user. We only get a `userError` on change:is_flagged, as 
    // they may be unsuccessful in applying their flag.
    //
    //  @options: All backbone.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VWidgetStudyingBrowseTestsRecordEditable__onModelError(model,xhr,options) { /* overloaded */

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