//---------------------------------------------------------------------------------------
// View: VBaseWidgetRecordEditableEdit
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view presents a form for editing the model's attributes.
//              If the save button is pressed then we attempt to update the model
//              on the server, dealing with the backbone events of `change` and
//              `invalid` here (`sync` and `error` are dealt with in VBaseWidgetRecordEditable).
//
//              We generate two events here: onEditSave and onEditCancel.
//---------------------------------------------------------------------------------------

var VBaseWidgetRecordEditableEdit = Backbone.View.extend({

    // creating new DOM element
    tagName : "div",

    /* overload and/or extend */
    id : undefined,
    className : "widget widget-record-editable-edit",
    templateID : undefined,
    alertTemplateID : "tpl-alert",

    // UI events from the HTML created by this view
    events : {
        "click button[name=button_save]" : "onClickSave",
        "click button[name=button_cancel]" : "onClickCancel"
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //  @settings:
    //
    //      .recordSettings - the settings object from our parent. Contains:
    //
    //          .model - the model we'll be displaying the attributes for.
    //
    //  @options:
    //
    //      Data object sent to VBaseWidgetRecordEditable-derived parent upon
    //      construction.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {

        // again, all we listen for here is 'change' and 'invalid'. we use 'change'
        // instead of 'sync' so we can trigger the appropriate trigger (since `destroy`)
        // also causes a sync and our parent view (VBaseWidgetRecordEditable) has to trigger an event
        // on 'destroy'.

        this.settings = settings || {};
        this.options = options || {};

        this.listenTo(this.settings.recordSettings.model,"invalid",this.onModelInvalid);
        this.listenTo(this.settings.recordSettings.model,"change",this.onModelChange);
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

        // empty all references
        this.stopListening(this.settings.recordSettings.model);
        this.settings = null;
        this.options = null;

        // jsfiddle for super() testing: http://jsfiddle.net/hLjC2/
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render our template with the attributes of the model. They will be passed
    // through a filtering function first, at which point any escaping/parsing/etc.
    // will be done. Finally, we post-process the form, as there may be some manual
    // manipulation required (e.g., for select2 instances).
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        // the attributes are obviously needed here because we are EDITING
        // them (duh guys, duh!)

        var attrs = this.filterModelAttributes();
        this.$el.html($.includejs.getTemplate(this.templateID,attrs));
        
        this.jqoForm = this.$("form");
        this.prepareForm(); /* overload */

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Any escaping of the text attributes or manipulation of the attributes in
    // any way/shape/form must be done here. Always operate/return a cloned
    // copy of the model's attributes.
    ///////////////////////////////////////////////////////////////////////////

    filterModelAttributes : function() { /* overload (when required) */
        // no-op.
        return _.clone(this.settings.recordSettings.model.attributes);
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Remove all of the feedback that may still be present on the form.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFeedback : function() {

        // remove existing warnings/alerts (inc. success)
        this.jqoForm.find("div.alert").remove();
        this.jqoForm.find(".has-error").removeClass("has-error");
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our editing form has already been rendered. However, if there is some manual
    // work that we have to do, then it will be done here.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overload as required */
        // no-op.
    },

    /*
        UI events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // We are going to pull the attributes from the form, which requires an
    // overloaded method as there is likely manual manipulation involved
    // (e.g., select2 instances). If those attributes have changed, we will 
    // attempt to update the model's attributes on the server.
    ///////////////////////////////////////////////////////////////////////////

    onClickSave : function(event) {

        this.clearFormFeedback();
        var attrs = this.getFormAttrs(); /* overload */        

        if ( this.settings.recordSettings.model.changedAttributes(attrs) ) {

            // will either generate 'invalid' (captured here) or 'request'
            // (captured on VBaseWidgetRecordEditable). then will generate
            // either 'change' (here) or 'error' (VBaseWidgetRecordEditable).

            this.settings.recordSettings.model.save(attrs,{
                sbRequestText : "Saving...",
                wait : true // wait for server OK before setting attr on model
            });
        }

        else {
            this.onClickCancel();
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // We're done. Notify whoever cares, so they can take action.
    ///////////////////////////////////////////////////////////////////////////

    onClickCancel : function(event) {
        this.trigger("onEditCancel");
    },

    /*
        Backbone events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // There were validation problems with the fields entered. We will highlight
    // the field that has a problem and output the error message.
    //
    // We expect the model's `validate` method to return an object containing
    // .msg and .field. The `field` value must correspond to the name that
    // is found on one of the `input` controls, so it can be highlighted.
    //
    //  @options: Straight from backbone - i.e., the model's `validate` func.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelInvalid : function(model,error,options) {        

        this.clearFormFeedback();

        // add a danger alert at the top of the form

        var alert = $.includejs.getTemplate(this.alertTemplateID,{msg:error.msg,classes:"alert-danger"});
        this.jqoForm.prepend(alert);

        // based upon the field that failed, we will highlight a given
        // UI control, so they know where the problem was.

        var field = this.jqoForm.find("input[name="+error.field+"]");
        if ( field.length ) {
            field.parent().addClass("has-error");
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model has successfully been saved on the server. Trigger the event
    // to inform others about it.
    //
    //  @options: Straight from backbone's `save` method.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelChange : function(model,options) {
        this.trigger("onEditSave",model,options);
        Spinner.get().hide();
    }

});