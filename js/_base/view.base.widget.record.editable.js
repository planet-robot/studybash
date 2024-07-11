//---------------------------------------------------------------------------------------
// View: VBaseWidgetRecordEditable
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
//              We trigger some events here that our parent will likely want to take
//              direct action on: onClickRecord, onRecordFlag, onRecordDestroy
//
//              However, we also trigger some events where there is no expectation that
//              our parent performs any actions: onRecordEdit, onRecordSave, onRecordCancel,
//              onRecordDeleteMaybe, onRecordDeleteYes, onRecordDeleteNo.
//---------------------------------------------------------------------------------------

var VBaseWidgetRecordEditable = Backbone.View.extend({

    /* overload and/or extend */
    tagName : "div",
    className : "widget widget-record-editable",
    templateID : undefined,
    toolbarElement : "div.toolbar",
    recordViewElement : "div.record-content",
    flagDialogTitle : undefined,
    flagDialogMsg : undefined,
    deleteDialogTitle : undefined,
    deleteDialogMsg : undefined,

    // UI events from the HTML created by this view
    events : {
        "click a.widget-record-editable-display-clickable" : "onClickRecord",
        "mouseenter a.widget-record-editable-display-clickable" : "onStartHoverRecord",
        "mouseleave a.widget-record-editable-display-clickable" : "onStopHoverRecord"
    },

    /*
        Backbone Methods.
    */

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //      We assume that the model this view will contain has already been
    //      loaded and setup before coming here.
    //
    //  @settings:
    //      This must be a data object containing several objects, rather than
    //      separate parameters. This is because if a single object is sent as
    //      a parameter to a Backbone.View-derived class's CONSTRUCTOR ONLY, then
    //      some of its properties (e.g., id, className) are copied over 
    //      directly. We don't want that here.
    //
    //      .model:         the model (i.e., record) that we will be operating on.
    //
    //  @options:
    //      Flags that might be useful. Might have passed through backbone as
    //      well as our own code (flags are prefixed with 'sb' for our stuff).
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {

        // the pageSettings might be used to, for ex., update our model's URL.
        this.settings = settings || {};
        this.options = options || {};

        // We bind to the model's request and error method as we will
        // control creating/removing the spinner. however, we also bind to
        // the `destroy` method here, because we are able to delete records
        // from this view. finally, we look for "change:is_flagged", as we
        // also allow users to do that operation. all editing is done
        // through a subview, so we needn't deal with global "change" or
        // with "invalid".
        //
        // notice that we don't bind to `sync` as we are more specific
        // in our 'success' methods: i.e., either destroy or change:is_flagged.

        this.updateModelURL(); /* overload */
        this.listenTo(this.settings.model,"request",this.onModelRequest);
        this.listenTo(this.settings.model,"change:is_flagged",this.onModelFlag);
        this.listenTo(this.settings.model,"destroy",this.onModelDestroy);
        this.listenTo(this.settings.model,"error",this.onModelError);

        // if anyone asks our model for a reference to its view
        // we send them a reference to ourselves.

        this.listenTo(this.settings.model,"getView",function(callback){
            callback(this);
        }.bind(this));

        // attributes of the contained model are added to the HTML5
        // data of the element we are creating here.

        this.$el.data("modelAttributes",_.clone(this.settings.model.attributes));

        // if we have been told to mark ourselves as selected already, then
        // do so now.

        if ( options.sbMakeSelected ) {
            this.makeSelected();
        }

        // create our toolbarView, which might be null if it's not
        // required here.

        this.toolbarView = this.instantiateToolbarView(); /* overload */
        
        if ( this.toolbarView ) {
            this.toolbarView.listenTo(this,"cleanup",this.toolbarView.remove);
            this.listenTo(this.toolbarView,"onClickToolbar",this.onClickToolbar);
        }

        // we will start out with a display subview. this is not rendered until our 
        // own `render` is called.

        this.isEditing = false;
        this.recordView = this.instantiateDisplayView( /* overload */
            {
                recordSettings : this.settings
            },
            {
                recordOptions : this.options
            }
        );
        this.recordView.listenTo(this,"cleanup",this.recordView.remove);        
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {        

        // all subview(s) will be listening for this event.
        this.trigger("cleanup");

        // empty references
        this.stopListening(this.recordView);
        this.stopListening(this.toolbarView);
        this.stopListening(this.settings.model);
        this.recordView = null;        
        this.toolbarView = null;
        this.settings = null;
        this.options = null;

        // jsfiddle for super() testing: http://jsfiddle.net/hLjC2/
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render our skeleton template and then render in the toolbarView and recordView
    // (which is either "display" or "edit" views).
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        // notice that on toolbarView we are calling `delegateEvents`. if this
        // (parent) view is rendered more than once (without having remove/new called)
        // the main `this.$el.html` call below wipes out the event bindings for all
        // the child elements of `this.$el` (i.e., this.subView.$el). we don't need to
        // worry about `recordView` as long as there are no events on it when this is
        // called. and since we would only be on "displayView", not "editView" when we
        // are (re-)rendered, we're okay - but if the "displayView" had events on it, we'd
        // have to do the same thing for it.
        //
        // here's a jsfiddle that demonstrates the problem (and solution):
        //      http://jsfiddle.net/cFLtg/

        this.$el.html($.includejs.getTemplate(this.templateID));
        if ( this.toolbarView ) {
            this.$(this.toolbarElement).html(this.toolbarView.render().$el);
            this.toolbarView.delegateEvents();
        }
        else {
            this.$(this.toolbarElement).html("&nbsp;"); // this provides some content, so the div will still be rendered.
        }
        this.$(this.recordViewElement).html(this.recordView.render().$el);

        // enable the toolbar buttons that are available to the user
        if ( this.toolbarView ) {
            this.setToolbarButtonsEnabled();
        }

        return this;
    },

    /*
        Public Methods.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Based upon our current state, and the particular user that's looking,
    // we will figure out which toolbar buttons are enabled.
    ///////////////////////////////////////////////////////////////////////////

    setToolbarButtonsEnabled : function() { /* overload and extend (if needed) */

        // everything is disabled by default. if we aren't editing, we're ok.

        if ( !this.isEditing ) {
            this.toolbarView.setEnabled({
                select : true,
                edit : true,
                flag : true,
                delete : true
            });
        }

        else {
            this.toolbarView.setEnabled({});
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Add/remove/get the property of being "selected" from this record-editable
    // instance.
    ///////////////////////////////////////////////////////////////////////////

    makeSelected : function() {
        this.$el.addClass("widget-record-editable-selected");
    },

    removeSelected : function() {
        this.$el.removeClass("widget-record-editable-selected");
    },

    isSelected : function() {
        return this.$el.hasClass("widget-record-editable-selected");
    },

    /*
        UI Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // One of the toolbar buttons that is associated directly with this record
    // has been clicked. We will deal with the cases of select, edit, and
    // delete here. If you have more buttons than that, you'll have to overload
    // and extend this method.
    //
    //  @buttonName - the `name` field from the HTML of the buttton.
    //  @button - the jqo of the button clicked
    //  @event - raw 'click' event data.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,button,event) { /* overload and extend (if needed) */

        // SELECT

        if ( buttonName === "select" ) {

            if ( !this.isSelected() ) {
                this.makeSelected();
            }
            else {
                this.removeSelected();
            }
        }

        // EDIT

        else if ( buttonName === "edit" ) {

            if ( !this.isEditing ) {

                // notify our parent. although they needn't do anything with the
                // event. everything relating to editing is being handled
                // here, this is just in case they want to know what's going
                // on.
                this.trigger("onRecordEdit",this);

                this.isEditing = true;
                this.setToolbarButtonsEnabled(); // disables them all

                // remove our current recordView (i.e., display) and
                // create the edit recordView.

                this.stopListening(this.recordView);
                this.recordView.remove();
                this.recordView = new this.instantiateEditView( /* overload */
                    {
                        recordSettings : this.settings
                    },
                    {
                        recordOptions : this.options
                    }
                );
                this.recordView.listenTo(this,"cleanup",this.recordView.remove);

                // we are interested in two events on the `edit` view: save and cancel.
                // these are both only called when the edit recordView has completed the action(s)
                // and is ready to be replaced with the display recordView.

                this.listenTo(this.recordView,"onEditSave",this.onEditSave);
                this.listenTo(this.recordView,"onEditCancel",this.onEditCancel);            

                this.$(this.recordViewElement).html(this.recordView.render().$el);
            }
        }

        // FLAG

        else if ( buttonName === "flag" ) {

            // open a dialog asking them if they are sure.
            bsDialog.create({
                
                title : this.flagDialogTitle,
                msg : this.flagDialogMsg,
                ok : function() {                

                    // patch the record, setting it as flagged.

                    this.settings.model.save(
                    {
                        is_flagged : true
                    },
                    {
                        wait : true,
                        patch : true,
                        sbRequestText : "Flagging..."
                    });
                    
                }.bind(this),
                cancel : function(){}
            });
        }

        // DELETE

        else if ( buttonName === "delete" ) {

            this.trigger("onRecordDeleteMaybe",this);

            // open a dialog asking them if they are sure.
            bsDialog.create({
                
                title : this.deleteDialogTitle,
                msg : this.deleteDialogMsg,
                ok : function() {                    

                    // destroy the model: error or destroy will be triggered, both of
                    // which are captured here.

                    this.settings.model.destroy({
                        wait : true,
                        sbRequestText : "Removing..."
                    });
                    this.trigger("onRecordDeleteYes",this);
                    
                }.bind(this),
                cancel : function(){
                    this.trigger("onRecordDeleteNo",this);
                }.bind(this)
            });
        }
    },

    /*
        Triggered events
    */

    ///////////////////////////////////////////////////////////////////////////
    // The record has successfully been saved to the server. Trigger an event
    // for anyone who cares and then replace the edit recordView. Note that
    // our parent does NOT need to do anything on this event. Everything is
    // handled solely by us in terms of saving the record and updating our
    // own view (i.e., replacing subviews). However, that doesn't mean that
    // a parent won't want to know that we're doing these things.
    //
    //  @model, options: direct from backbone.
    ///////////////////////////////////////////////////////////////////////////

    onEditSave : function(model,options) {
        this.trigger("onRecordSave",this);
        this.onEditCancel(true);
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has cancelled their editing of the model. Remove the current
    // subview and replace it with the display subview. Again, we alert our
    // parent as to what's going on, but they needn't do anything here.
    //
    //  suppressEvent - Useful when called internally, simply to cleanup.
    ///////////////////////////////////////////////////////////////////////////

    onEditCancel : function(suppressEvent) {

        if ( !suppressEvent ) {
            this.trigger("onRecordCancel",this);
        }
        
        this.stopListening(this.recordView);
        this.recordView.remove();
        this.isEditing = false;

        this.recordView = this.instantiateDisplayView(
            {
                recordSettings : this.settings
            },
            {
                recordOptions : this.options
            }
        );
        this.recordView.listenTo(this,"cleanup",this.recordView.remove);

        this.$(this.recordViewElement).html(this.recordView.render().$el);

        // decide which header buttons are available
        this.setToolbarButtonsEnabled();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on this particular record, as something in
    // the `display` subView contained an `a` that was flagged clickable. Pass 
    // along the model's attributes, as well as the raw event itself, through 
    // triggering the "onClickRecord" event, which our parent is listening for.
    ///////////////////////////////////////////////////////////////////////////

    onClickRecord : function(event) {
        this.trigger("onClickRecord",this.$el.data("modelAttributes"),event);
        event.preventDefault();
        event.stopPropagation();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user is hovering over a clickable record. Let's highlight it.
    ///////////////////////////////////////////////////////////////////////////

    onStartHoverRecord : function(event) {
        this.trigger("onStartHoverRecord",this,event);        
        this.$el.addClass("widget-record-editable-highlighted");
        event.stopPropagation();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user was but is no longer hovering over a clickable record. Let's
    // remove our highlight.
    ///////////////////////////////////////////////////////////////////////////

    onStopHoverRecord : function(event) {
        this.trigger("onStopHoverRecord",this,event);
        this.$el.removeClass("widget-record-editable-highlighted");
        event.stopPropagation();
    },

    /*
        Backbone events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Sending a request to the server. May be for either `destroy` or `save`.
    //
    //  @options: Mixture of backbone and my own ('sb' prefix).
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelRequest : function(model,xhr,options) {
        Spinner.get().show({msg:options.sbRequestText,opacity:0});
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model has been successfully flagged on the server. If we are supposed
    // to keep ourselves (i.e., sbKeepRecord) then we will add the appropriate
    // class to our element and re-set our toolbar. Either way, we notify our
    // listening parent that we have been flagged.
    //
    //  @options: Mixture of backbone and my own ('sb' prefix).
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelFlag : function(model,value,options) {        
        
        options.sbKeepRecord = this.shouldKeepRecordOnFlag(model,value,options);
        if ( options.sbKeepRecord ) {
            this.$el.addClass("widget-record-editable-flagged");
            //this.removeSelected(); // can't select flagged records
            this.setToolbarButtonsEnabled();
        }
        this.trigger("onRecordFlag",model,value,options);
        Spinner.get().hide();
    },

    ///////////////////////////////////////////////////////////////////////////
    // A record has been flagged. Before we send word of this back up to our
    // parent, let's figure out if we want to keep them in any list that they
    // might be contained in.
    ///////////////////////////////////////////////////////////////////////////

    shouldKeepRecordOnFlag : function(model,value,options) { /* overload (as required) */
        // assume: no.
        //fixme: this needs to be overloaded to say "yes" only when it's isUser
        return true;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model has successfully been destroyed on the server. Trigger the event
    // to inform others about it (i.e., we'll probably be removed from the DOM
    // now, but it's not up to us).
    //
    //  @options: Mixture of backbone and my own ('sb' prefix).
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelDestroy : function(model,response,options) {
        this.trigger("onRecordDestroy",model,response,options);
        Spinner.get().hide();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to either be saved or destroyed on the server. Display
    // the error to the user.
    //
    //  @options: All backbone.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VBaseWidgetRecordEditable__onModelError(model,xhr,options) { /* overload (as required) */
        
        Spinner.get().hide(function(){
            app.dealWithAjaxFail(xhr,undefined,undefined);
        });
    }

});