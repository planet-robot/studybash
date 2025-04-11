//---------------------------------------------------------------------------------------
// View: VBaseWidgetFormCreate
// Description: An extended form widget that creates a new model of a given type
//              (defined by derived views). We have overloaded some of the methods on
//              VBaseWidgetForm that were working with just an attributes hash to now
//              work with models; hence some of the function names might seem a bit off.
//              The request, invalid, sync, and error events (from the model) are 
//              captured here and dealt with. Alerts are displayed within the form as appropriate.
//
//              Two backbone events are created here: "onFormSave" and
//              "onFormCancel". These are triggered when that respective function
//              has completed (i.e., the model was successfuly saved), not just when
//              certain buttons are pushed. If you want to fiddle around with the model's
//              events directly, as a derived view, then you'll need to add your own hooks.
//
//              The error returned from the model's validation needs to be an object
//              with two fields (.msg and .field). `field` should match the name
//              of a given input field on the form, so it can be highlighted.
//              
//---------------------------------------------------------------------------------------

var VBaseWidgetFormCreate = VBaseWidgetForm.extend({

    /* overload and/or extend */
    id : undefined,
    templateID : undefined,
    successAlertText : undefined,
    alertTemplateID : "tpl-alert",
    alertDismissTemplateID : "tpl-alert-dismiss",
    requestText : undefined,
    allowDefaultSubmit : false,
    formName : undefined,

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-form-create";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        // empty references
        this.stopListening(this.attrs);
        return VBaseWidgetForm.prototype.remove.call(this);
    },

    /*
        Utility functions
    */

    ///////////////////////////////////////////////////////////////////////////
    // We need to create a model and bind some listeners to it. This is called
    // in two situations: initialize (construction) or because we've 
    // successfully created a model and passed it off to a listener already. Either
    // way we need a fresh one to work on.
    ///////////////////////////////////////////////////////////////////////////

    createFreshAttrs : function() { /* overloaded */

        // if we have an existing model, then remove all refs to it as
        // we're going to create a new one.

        if ( this.attrs ) {
            this.stopListening(this.attrs);
            this.attrs = null;
        }

        this.attrs = this.instantiateModel(); /* overload */

        // We deal directly with a single model for adding purposes. upon saving
        // we will either have an `invalid` event (client validation fail) or
        // `request` (client validation passed). if it passed, then we have
        // `sync` (server success) or `error` (server error).
        // two of the methods used here were defined in the base
        // view and so we'll be using them (onAttrs...).
        
        this.listenTo(this.attrs,"request",this.onModelRequest);
        this.listenTo(this.attrs,"invalid",this.onAttrsInvalid);
        this.listenTo(this.attrs,"sync",this.onAttrsValid);
        this.listenTo(this.attrs,"error",this.onModelError);        
    },

    ///////////////////////////////////////////////////////////////////////////
    // The attributes have been pulled (and parsed) from the form. We will
    // validate them through attempting to save the model to the server. If
    // validation fails, the server will never be contacted. Of course, by
    // doing this, we also may run into a server error, which will be caught
    // by our event listeners as well.
    //
    //  @attrs: attributes hash returned from the form (after our manipulation).
    //
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function(attrs) { /* overloaded */

        // try to save the model, given a new attributes hash. we return
        // `null` to tell our caller that validation will be delayed and
        // automated, so we will deal with calling the respective success/error
        // functions ourselves (through our backbone event bindings).
        
        this.attrs.save(attrs,{wait:true});
        return null;
    },

    /*
        Backbone events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Sending a request to the server, as invalid was not triggered.
    //
    //  @options: A combination of backbone options and our own ('sb' prefix).
    ///////////////////////////////////////////////////////////////////////////

    onModelRequest : function(model,xhr,options) {

        this.clearFormFeedback();
        Spinner.get().show({msg:this.requestText,opacity:0});
    },

    ///////////////////////////////////////////////////////////////////////////
    // There were validation problems with the fields entered. We will highlight
    // the field that has a problem and output the error message. This comes
    // straight from the `model.validate` method of the model type we're using,
    // so we have to grab the error object alone and pass it on to our base
    // view.
    //
    //  @error - object containing `field` and `msg` fields.
    ///////////////////////////////////////////////////////////////////////////

    onAttrsInvalid : function(model,error,options) { /* overloaded and extended */
        VBaseWidgetForm.prototype.onAttrsInvalid.call(this,error);
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Not only has the model passed validation, but it has successfully been 
    // saved on the server as well. Trigger our success to let whoever cares 
    // about the new model know, and then reset ourselves.
    //
    // This is overloaded as we are receiving different parameters than the
    // VBaseWidgetForm version.
    //
    //  @model:     the model that was saved.
    //  @options:   direct from backbone's `save` call, some of our stuff might
    //              be in there too ('sb' prefix).
    //
    ///////////////////////////////////////////////////////////////////////////

    onAttrsValid : function(model,response,options) { /* overloaded */

        this.clearFormFields();
        this.clearFormFeedback();

        // create a dismissable alert, if we have the text specified
        if ( this.successAlertText ) {

            var html_text = $.includejs.getTemplate(
                this.alertDismissTemplateID,
                {
                    classes:"alert-success",
                    msg:"<strong>Success!</strong> - " + this.successAlertText
                }
            );
            this.jqoForm.prepend(html_text);
        }

        
        // as our form has been validated, we can now submit it.
        this.attrs = model;
        this.attrsOptions = options;
        this.jqoForm.submit();
        Spinner.get().hide();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to be saved to the server, as there was an error.
    // Display that error now.
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VBaseWidgetFormCreate__onModelError(model,xhr,options) {
        
        Spinner.get().hide(function(){
            app.dealWithAjaxFail(xhr,null,null);
        });
    }    

});