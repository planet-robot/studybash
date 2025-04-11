//---------------------------------------------------------------------------------------
// View: VWidgetHelpForm
// Description: Displays the 'contact us' form.
//---------------------------------------------------------------------------------------

var VWidgetHelpFormContact = VBaseWidgetForm.extend({

    /* overload and/or extend */
    id : "widget-help-form-contact",
    templateID : "tpl-widget-help-form-contact",
    formName : "register",
    
    successAlertText : function() {
        return "Your email has been sent. Thank you for the feedback!";
    },

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-help-form-contact";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
        });
    },
    
    ///////////////////////////////////////////////////////////////////////////
    // After the form has been successfully submitted, we will lock everything.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overloaded */

        this.$("textarea").prop("disabled",true);
        this.$("select").prop("disabled",true);
        this.$("button").prop("disabled",true);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Nothing to do here.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */
        //no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields from our select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        var attrs = this.jqoForm.serialize_object();
        
        // trim all the strings
        attrs.subject = $.trim(attrs.subject);
        attrs.message = $.trim(attrs.message);

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the message's text. Then we'll try to send it, and if that
    // is successful, then it's truely been "validated".
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function VWidgetHelpFormContact__validateAttrs(attrs) { /* overloaded */        

        // (1) message. must be more than 10 chars.

        if ( !attrs.message || ( attrs.message.length < 10 ) ) {
            return {
                msg : "<strong>Message</strong>: Please enter a message",
                field : "message"
            };
        }

        // attempt to send the message.

        Spinner.get().show({msg:"Sending message...",opacity:0});

        $.ajax({
            url : app.JS_ROOT+"ajax/manual.php/help/message",
            type : "POST",
            dataType : "json",
            contentType : "application/json",
            data : JSON.stringify(attrs),
            processData : false,
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN",app.store.get("user").token);
            }
        })
        .done(function(data,textStatus,jqXHR) {
            this.onAttrsValid(data);
            Spinner.get().hide();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });

        // we're going to validate the rest on the server. take no action
        // in our base widget.
        return null;
    }

});