//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsRecordEditableEdit
// Description: One of two possible subViews to a VWidgetStudyingBrowseCardsRecordEditable.
//              This particular view presents a form for editing the model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsRecordEditableEdit = VBaseWidgetRecordEditableEdit.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-record-editable-edit",
    templateID : "tpl-widget-studying-browse-cards-record-editable-edit",

    className : function() {
        return _.result(VBaseWidgetRecordEditableEdit.prototype,'className') + " widget-record-editable-edit-flashcard widget-studying-browse-cards-record-editable-edit";
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

        this.ws_tags = null;
        return VBaseWidgetRecordEditableEdit.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our editing form has already been rendered. However, there is some manual
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

        // we could use have the defaultTags option for ws_tags, but that wouldn't
        // have preserved the id/text separation if they remained present when saved.
        // in other words, upon checking the selection we'd get something like:
        // {id:"difficulty1",text:"difficulty1"}. by doing it this way, we get
        // separate id and text values if they remain selected upon saving.
        
        this.ws_tags.set(
            _.map(
                _.filter(this.settings.recordSettings.model.get("tags"),function(o){return !o.is_auto;}),
                function(o) {
                    return o.id;
                }
            )
        );
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