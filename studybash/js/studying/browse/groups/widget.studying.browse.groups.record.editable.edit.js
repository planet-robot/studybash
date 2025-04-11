//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseGroupsRecordEditableEdit
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view presents a form for editing the model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsRecordEditableEdit = VBaseWidgetRecordEditableEdit.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-studying-browse-groups-record-editable-edit",

    className : function() {
        return _.result(VBaseWidgetRecordEditableEdit.prototype,'className') + " widget-studying-browse-groups-record-editable-edit";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableEdit.prototype,'events'),{
            "click button[name=button_generate]" : "onClickGenerate",
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Removing ourself from the DOM. Empty all references.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        this.ws_sharing = null;
        return VBaseWidgetRecordEditableEdit.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form. this will
    //      be used with `model.save` to try to update the model.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */        

        var attrs = this.jqoForm.serialize_object();

        // we have to grab the disabled control values manually.
        attrs.code = this.jqoForm.find("input[name=code]").val();

        return attrs;
    },

    /*
        UI events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on the "Generate New Code" button. We'll simply
    // generate a random string and place it in the text input control
    // (which is disabled).
    ///////////////////////////////////////////////////////////////////////////

    onClickGenerate : function(event) {

        var newCode = $.leftovers.parse.generate_random_string(6,false,true,true);
        this.jqoForm.find("input[name=code]").val(newCode);
    },

});