//---------------------------------------------------------------------------------------
// View: VWidgetTestsTakeDoingRecord
// Description: This displays a card's attributes, and allows the user to edit them.
//              We differ from the base quite a bit here. We only display certain attributes,
//              based upon the `options` sent. Also, we provide three extra buttons for
//              changing the tags quickly (difficulty1-3).
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : "widget-tests-take-doing-record-editable",
    templateID : "tpl-widget-tests-take-doing-record-editable",
    flagDialogTitle : "Flag Flashcard",
    flagDialogMsg : "<p>Are you sure you want to flag this card as inappropriate?</p>",
    deleteDialogTitle : "Delete Flashcard",
    deleteDialogMsg : "<p>Are you sure you want to delete this card? WARNING: THIS CANNOT BE UNDONE!</p>",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-record-editable-flashcard widget-tests-take-doing-record-editable";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },    

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup our proprietary member data.
    //
    //  @settings.  Has .slideshowSettings in it, and .model
    //  @options.   Not used here directly, but we pass them onto our subviews
    //              (upon construction) which do use them.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* extended */
        VBaseWidgetRecordEditable.prototype.initialize.call(this,settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user can edit/delete models. So we update the URL based upon the
    // test information we were given in settings.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        
        var setID = this.settings.model.get("set_id");
        var setsInfo = this.settings.slideshowSettings.test.setsInfo;

        var set = _.find(setsInfo,function(elem){
            return elem.id === setID;
        });

        var ownerID = set.created_by_id;
        this.settings.model.urlRoot = this.settings.model.baseUrlRoot + "/" + this.settings.slideshowSettings.test.module_id + "/" + ownerID + "/" + setID;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Based upon our current state, and the particular user that's looking,
    // we will figure out which toolbar buttons are enabled.
    ///////////////////////////////////////////////////////////////////////////

    setToolbarButtonsEnabled : function() { /* overloaded and extended */

        VBaseWidgetRecordEditable.prototype.setToolbarButtonsEnabled.call(this);

        // if we aren't editing, then whether or not we can use certain
        // buttons will depend on whether this belongs to us

        var isUser = this.settings.model.get("created_by_id") === app.store.get("user").id;

        if ( !this.isEditing ) {
            this.toolbarView.setEnabled({
                difficulty1 : isUser,
                difficulty2 : isUser,
                difficulty3 : isUser,
                edit : isUser,
                flag : !isUser,
                delete : isUser
            });
        }

        // highlighting difficulty1..3

        var d1 = _.find(this.settings.model.get("tags"),function(o){
            return o.tag_text === "difficulty1";
        });
        var d2 = _.find(this.settings.model.get("tags"),function(o){
            return o.tag_text === "difficulty2";
        });
        var d3 = _.find(this.settings.model.get("tags"),function(o){
            return o.tag_text === "difficulty3";
        });

        this.toolbarView.getButton("difficulty1").removeClass("btn-info btn-default").addClass(d1?"btn-info":"btn-default");
        this.toolbarView.getButton("difficulty2").removeClass("btn-info btn-default").addClass(d2?"btn-info":"btn-default");
        this.toolbarView.getButton("difficulty3").removeClass("btn-info btn-default").addClass(d3?"btn-info":"btn-default");
    },

    instantiateToolbarView : function() { /* overloaded */
        return new VWidgetTestsTakeDoingRecordEditableToolbar();
    },

    ///////////////////////////////////////////////////////////////////////////
    // One of the toolbar buttons that is associated directly with this record
    // has been clicked. The base view deals with some of the buttons, and we
    // deal with the leftovers.
    //
    //  @buttonName - the `name` field from the HTML of the buttton.
    //  @button - the jqo object of the button that was clicked
    //  @event - raw 'click' event data.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function VWidgetTestsTakeDoingRecordEditable__onClickToolbar(buttonName,button,event) { /* overloaded and extend */

        // our base view will deal with `select`, `edit`, and `delete`.
        VBaseWidgetRecordEditable.prototype.onClickToolbar.call(this,buttonName,event);

        // if we aren't sent the button, that means that it's a manual call, let's grab the
        // button in question now. the reason we do this is we want to make sure that
        // a given button is enabled if someone wants it to be pressed (since these buttons
        // can be "manually pressed" through the keyboard).
        if ( !button ) {
            button = this.toolbarView.getButton(buttonName);
        }

        // we will deal with the unique ones here:

        // DIFFICULTY1...3

        if ( ( buttonName.indexOf("difficulty") !== -1 ) && ( !button.prop("disabled") ) ) {

            // we want to edit the model's tags and then save the model to the server.

            var tags = this.settings.model.get("tags");
            var existingTag = _.find(tags,function(o){
                return o.tag_text === buttonName;
            });

            if ( existingTag ) {
                tags.splice(_.indexOf(tags,existingTag),1);
            }
            else {
                
                tags.push(_.find(app.store.get("card.tags"),function(o){return o.tag_text === buttonName;}));
                tags = _.sortBy(
                    tags,
                    function(o){
                        return o.tag_text;
                    }
                );
            }

            // this is messy because this is usually done by our '.edit' subview. and
            // so we aren't listening to any model events, we are just going to do it
            // manually here with the success function. our error function is handled
            // by `onModelError`.

            this.settings.model.save({tags:tags},{
                sbRequestText : "Saving...",
                wait : true, // wait for server OK before setting attr on model
                success : function(model,response,options) {
                    Spinner.get().hide();
                }
            });

            // tags may have changed, which we have to reflect on our toolbar.
            this.setToolbarButtonsEnabled();
        }
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
        return new VWidgetTestsTakeDoingRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return new VWidgetTestsTakeDoingRecordEditableEdit(settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to either be saved or destroyed on the server. Display
    // the error to the user. We only get a `userError` on change:is_flagged, as 
    // they may be unsuccessful in applying their flag.
    //
    //  @options: All backbone.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VWidgetTestsTakeDoingRecordEditable__onModelError(model,xhr,options) { /* overloaded */

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