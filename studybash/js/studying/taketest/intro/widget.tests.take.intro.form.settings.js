//---------------------------------------------------------------------------------------
// View:        VWidgetTestsTakeIntroFormSettings
// Description: Simple form that allows the user to setup some settings for the test.
//              There is no validation or anything required here, we just pull out
//              the values and move ahead.
//
//              We generate two possible events here: "onFormSave" and "onFormCancel".
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeIntroFormSettings = VBaseWidgetForm.extend({

    /* overloaded */
    id : "widget-tests-take-intro-form-settings",
    templateID : "tpl-widget-tests-take-intro-form-settings",
    formName : "settings",
    successAlertText : undefined, // not used

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-tests-take-intro-form-settings";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Nothing special required here.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */
        
        var attrs = this.jqoForm.serialize_object();
        
        // convert bools into 1/0
        attrs.randomize = attrs.randomize ? 1 : 0;
        attrs.display_set_name = attrs.display_set_name ? 1 : 0;
        attrs.display_card_tags = attrs.display_card_tags ? 1 : 0;
        attrs.show_remaining = attrs.show_remaining ? 1 : 0;

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // We never have cause to do this.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Nothing to do here either. Returning 'undefined' means success.
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function(attrs) {
        // no-op.
    }

});