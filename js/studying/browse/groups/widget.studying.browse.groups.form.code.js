//---------------------------------------------------------------------------------------
// View:        VWidgetStudyingBrowseGroupsFormCode
// Description: This form is to set a secret code to use when searching for studygroups.
//              There is no server communication here, just validation.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsFormCode = VBaseWidgetForm.extend({

    /* overloaded */
    id : "widget-studying-browse-groups-form-code",
    templateID : "tpl-widget-studying-browse-groups-form-code",
    successAlertText : undefined, // not used
    formName : "code",

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-studying-browse-groups-form-code";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
            "click button[name=button_clear]" : "onClickClear",
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // If we don't currently have a search code set, then we'll clear the
    // "clear" button.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() {
        if ( !app.store.has("groups.code") ) {
            this.jqoForm.find("button[name=button_clear]").prop("disabled",true);
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty out the code field and save the form.
    ///////////////////////////////////////////////////////////////////////////

    onClickClear : function(event) {
        this.jqoForm.find("input[name=code]").val("");
        this.onClickSave(null);
    },

    ///////////////////////////////////////////////////////////////////////////
    // If we require some attributes to be present on the form upon display
    // then this function should return them. We provide the current code
    // or empty if none yet.
    ///////////////////////////////////////////////////////////////////////////

    getDefaultAttrsForTemplate : function() { /* overloaded */
        return {
            code : app.store.get("groups.code")
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields from our select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        var attrs = {};
        attrs = this.jqoForm.serialize_object();

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the code information. We'll let anything through.
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function(attrs) { /* overloaded */
        // return nothing on success
    }
});