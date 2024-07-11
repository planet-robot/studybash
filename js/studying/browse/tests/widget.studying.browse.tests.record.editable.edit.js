//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseTestsRecordEditableEdit
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view presents a form for editing the model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseTestsRecordEditableEdit = VBaseWidgetRecordEditableEdit.extend({

    /* overloaded */
    id : "widget-studying-browse-tests-record-editable-edit",
    templateID : "tpl-widget-studying-browse-tests-record-editable-edit",

    className : function() {
        return _.result(VBaseWidgetRecordEditableEdit.prototype,'className') + " widget-studying-browse-tests-record-editable-edit";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableEdit.prototype,'events'),{
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
    // Our editing form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // we need to build our select2 instance.

        this.ws_sharing = new WSelect2({
            elem : this.jqoForm.find("input[name=sharing]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_sharing.init({
            data : _.map(
                app.store.get("sharing.types"),
                function(o){
                    var r = {};
                    r.id = r.text = o;
                    return r;
                }
            ),
            preventNew : true,
            placeholder : "e.g., public"
        });

        this.ws_sharing.set(this.settings.recordSettings.model.get("sharing"));
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

        // grab the attributes from the form. note that we have
        // to do the select2 instance separately.

        var attrs = this.jqoForm.serialize_object();
        attrs.sharing = this.ws_sharing.getSelection();
        if ( attrs.sharing.length ) {
            attrs.sharing = attrs.sharing[0].id;
        }
        else {
            attrs.sharing = null;
        }

        // trim all the strings
        attrs.test_name = $.trim(attrs.test_name);
        attrs.description = $.trim(attrs.description);        

        // replace "" with null
        attrs.description = !attrs.description.length ? null : attrs.description;

        return attrs;
    }

});