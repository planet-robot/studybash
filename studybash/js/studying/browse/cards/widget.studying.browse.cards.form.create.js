//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsFormCreate
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

var VWidgetStudyingBrowseCardsFormCreate = VBaseWidgetFormCreate.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-form-create",
    templateID : "tpl-widget-studying-browse-cards-form-create",
    successAlertText : "New Card Added!",
    requestText : "Saving...",
    formName : "create",

    className : function() {
        return _.result(VBaseWidgetFormCreate.prototype,'className') + " widget-studying-browse-cards-form-create";
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
        this.ws_tags = null;
        return VBaseWidgetFormCreate.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is the data type that we will be creating through our form.
    ///////////////////////////////////////////////////////////////////////////

    instantiateModel : function() { /* overloaded */
        var model = new CardModel();
        model.urlRoot = model.baseUrlRoot + "/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID + "/" + this.settings.urlIDs.sID;
        return model;
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Our creation form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // we need to build our select2 instance.

        this.ws_tags = new WSelect2({
            elem : this.jqoForm.find("input[name=tags]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_tags.init({
            tags : _.map(
                _.filter(app.store.get("card.tags"),function(o){return !o.is_auto;}),
                function(o){
                    return {
                        id : o.id,
                        text : o.tag_text
                    }
                }
            ),
            preventNew : true
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
        // to do the select2 instance separately. also notice
        // that we are getting the FULL record information for
        // the tags created here, and sorting them based upon
        // their text.

        var attrs = this.jqoForm.serialize_object();
        
        attrs.tags = this.ws_tags.getSelection();
        if ( attrs.tags.length ) {
            var tags = [];
            for ( var x=0; x < attrs.tags.length; x++ ) {
                tags.push({id:attrs.tags[x].id,tag_text:attrs.tags[x].text,is_auto:0});
            }
            attrs.tags = _.sortBy(
                tags,
                function(o){
                    return o.tag_text;
                }
            );
        }

        // trim all the strings
        attrs.order_id = +attrs.order_id;
        attrs.question_text = $.trim(attrs.question_text);
        attrs.answer_text = $.trim(attrs.answer_text);        

        // replace "" with null and true/false with 1/0
        attrs.answer_text = !attrs.answer_text.length ? null : attrs.answer_text;

        // add the 'note' tag if there is no answer.
        if ( !attrs.answer_text ) {
            attrs.tags = attrs.tags || [];
            attrs.tags.push(_.filter(
                    app.store.get("card.tags"),
                    function(o){return o.tag_text === "note"}
                )[0]
            );
        }

        return attrs;
    }

});