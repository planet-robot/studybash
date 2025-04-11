//---------------------------------------------------------------------------------------
// View: VWidgetClassesRecordEditable
// Description: This shows an enrollment record and allows it to be edited.
//              We trigger events here: onRecordSave, onRecordDestroy.
//---------------------------------------------------------------------------------------

var VWidgetClassesRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-classes-record-editable",
    deleteDialogTitle : "Remove Class",
    deleteDialogMsg : "<p>Are you sure you want to remove this class?</p>",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-classes-record-editable" + ( this.model.get("completed") ? " widget-classes-record-editable-completed" : " widget-classes-record-editable-not-completed" );
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
        // no-op.        
    },

    instantiateToolbarView : function() { /* overloaded */
        return new VWidgetClassesRecordEditableToolbar();
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
        return new VWidgetClassesRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return new VWidgetClassesRecordEditableEdit(settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to either be saved or destroyed on the server. Display
    // the error to the user. We only get a `userError` on delete, as they
    // may be trying to delete a class that still has stuff in it. Any errors
    // on saving should have been caught on the client.
    //
    //  @options: All backbone.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VWidgetClassesRecordEditable__onModelError(model,xhr,options) { /* overloaded */

        Spinner.get().hide(function(){

            var userError = app.getAjaxUserError(xhr);

            if ( ( xhr.status === 400 ) && ( userError ) ) {
                
                var count = +userError.msg;
                var type = userError.type + ( count > 1 ? "s" : "" );

                bsDialog.create({
                    title : "Error!",
                    msg : "<p>You cannot remove that class. You still have " + count + " " + type + " for it.</p>",
                    ok : function() {}
                });
            }
            else {
                app.dealWithAjaxFail(xhr,null,null);
            }

        });
    }

});