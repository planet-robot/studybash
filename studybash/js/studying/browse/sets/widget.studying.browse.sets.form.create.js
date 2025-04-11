//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseSetsFormCreate
// Description: This view houses a form that is filled out and submitted to create a new
//              model of a given type (defined by derived views). The request, invalid,
//              sync, and error events (from the model) are captured here and dealt with.
//              Alerts are displayed within the form as appropriate.
//
//              Methods dealing with the manipulation/presentation of the form itself
//              and parsing of the form data are overloaded; as is the method that
//              instantiates the model itself. Note that several models may be instantiated
//              over time, as multiple records may be created.
//
//              Two bootstrap events are created here: "onCreateSave" and
//              "onCreateCancel". These are triggered when that respective function
//              has completed (i.e., the model was successfuly saved), not just when
//              certain buttons are pushed. If you want to fiddle around with the model's
//              events directly, as a derived view, then you'll need to add your own hooks.
//
//              The errors returned from the model's validation need to be an object
//              with two fields (.msg and .field). `field` should match the name
//              of a given input field on the form, so it can be highlighted.
//              
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseSetsFormCreate = VBaseWidgetFormCreate.extend({

    /* overloaded */
    id : "widget-studying-browse-sets-form-create",
    templateID : "tpl-widget-studying-browse-sets-form-create",
    successAlertText : undefined, // not used
    requestText : "Saving...",
    formName : "create",

    className : function() {
        return _.result(VBaseWidgetFormCreate.prototype,'className') + " widget-studying-browse-sets-form-create";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetFormCreate.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty our references.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.ws_sharing = null;
        return VBaseWidgetFormCreate.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is the data type that we will be creating through our form.
    ///////////////////////////////////////////////////////////////////////////

    instantiateModel : function() { /* overloaded */
        var model = new SetModel();
        model.urlRoot = model.baseUrlRoot + "/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID;
        return model;
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Our creation form has already been rendered. However, there is some manual
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
        attrs.set_name = $.trim(attrs.set_name);
        attrs.description = $.trim(attrs.description);        

        // replace "" with null and true/false with 1/0
        attrs.description = !attrs.description.length ? null : attrs.description;
        attrs.has_auto_test = attrs.has_auto_test ? 1 : 0;

        // it's empty at the moment
        attrs.num_filtered_cards = 0;

        return attrs;
    }

});