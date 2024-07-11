//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsFormBatch
// Description: This form is used to grab a single field of text (which will be parsed
//              elsewhere) and zero or more card tags. There is no server communication
//              here, just validation.
//
//              Two bootstrap events are created here: "onCreateSave" and
//              "onCreateCancel". These are triggered when that respective function
//              has completed (i.e., the form was validated), not just when
//              certain buttons are pushed.
//
//              The errors returned from the form's validation need to be an object
//              with two fields (.msg and .field). `field` should match the name
//              of a given input field on the form, so it can be highlighted.
//              
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsFormBatch = VBaseWidgetForm.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-form-batch",
    templateID : "tpl-widget-studying-browse-cards-form-batch",
    successAlertText : undefined, // not used
    formName : "batch",

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-studying-browse-cards-form-batch";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
        });
    },

    // the tags used to deliminate questions and answers in the massive text field that
    // we have to parse.

    questionTag : "{{q}}",
    answerTag : "{{a}}",

    ///////////////////////////////////////////////////////////////////////////
    // Setup the select2 instances.
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
    // We only clear the textarea when this is called, we will leave the
    // tags as they are.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overloaded */
        this.jqoForm.find("textarea").val("");
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields from our select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        var attrs = this.jqoForm.serialize_object();

        // notice that we are getting the FULL record information for
        // the tags applied here, and sorting them based upon their text.

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

        // trim our string
        attrs.parse_text = $.trim(attrs.parse_text);

        return attrs;
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

        // (1) tags - no duplicates

        if ( attrs.tags && attrs.tags.length ) {

            var uniqTags = _.uniq(attrs.tags);
            if ( uniqTags.length !== attrs.tags.length ) {
                return {
                    msg : "<strong>Tags</strong>: No duplicates",
                    field : "tags"
                };
            }
        }

        // (2) parse_text. the rules for this are as follows:
        //
        // (a) it must start on QUESTION_TAG
        // (b) after every ANSWER_TAG there must eventually be EOS or QUESTION_TAG - i.e., can't have back-to-back ANSWER_TAGs

        if ( !attrs.parse_text.length ) {
            return {
                msg : "<strong>Text</strong>: Please enter some text",
                field : "parse_text"
            };
        }

        // (a)
        else if ( attrs.parse_text.indexOf(this.questionTag) !== 0 ) {
            return {
                msg : "<strong>Text</strong>: Must begin with "+this.questionTag,
                field : "parse_text"
            };
        }

        // (b)
        else {

            // just look for back to back ANSWER_TAGs. we can test this quickly with a regular expression.
            // source: http://stackoverflow.com/questions/20980654/javascript-regular-expression-unbroken-repetitions-of-a-pattern
            //
            // FIXME: this must change everytime you change the question or answer tags. it needs to
            // include them here.

            if ( attrs.parse_text.match(/{\{a}}((?!{\{q}}).)*{\{a}}/) ) {
                return {
                    msg : "<strong>Text</strong>: Cannot have two consecutive "+this.answerTag+" blocks",
                    field : "parse_text"
                }
            }
        }

        // we are now going to parse the text and create a bunch of card models. we
        // return `null` to tell our caller that validation will be delayed and
        // automated, so we will deal with calling the respective success/error
        // functions ourselves (through our backbone event bindings).
        
        this.parseCards(attrs);
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has submitted the "card batch" form and now we need to
    // parse their text input into a number of cards (which may or may not
    // be notes or have answers). If we are here then we know the text
    // text is valid (i.e., cannot fail parse), so we needn't worry about that
    // here. If we successfully create the cards on the server then we call
    // `this.onAttrsValid` ourself.
    //
    //  @formData:  The attributes hash returned from the form. Contains
    //              `parse_text` and `tags`.
    //
    ///////////////////////////////////////////////////////////////////////////

    parseCards : function VWidgetStudyingBrowseCardsFormBatch__parseCards(formData) {

        var cardObjs = [];

        // (1) we go through the text and create individual card data objects.

        var currentPos = 0; // we know the string starts on QUESTION_TAG
        var nextQPos = 0;
        var nextAPos = 0;

        do {            

            var cardObj = {};
            cardObj.tags = _.clone(formData.tags);

            // figure out where our question_text ends. it could be:
            // (a) the answer
            // (b) the next question
            // (c) EOS

            nextQPos = formData.parse_text.indexOf(this.questionTag,currentPos+1);
            nextAPos = formData.parse_text.indexOf(this.answerTag,currentPos+1);
            var endPos = null;

            // (c)

            if ( ( nextAPos === -1 ) && ( nextQPos === -1 ) ) {
                endPos = undefined;
            }

            // (b)

            else if (
                        ( nextQPos !== -1 ) &&
                        (
                            ( nextAPos === -1 ) ||
                            (
                                ( nextAPos !== -1 ) &&
                                ( nextQPos < nextAPos )
                            )
                        )
                    )
            {
                endPos = nextQPos;
            }

            // (a)

            else {
                endPos = nextAPos;
            }

            cardObj.question_text = $.trim(formData.parse_text.substring(currentPos+this.questionTag.length,endPos));
            cardObj.answer_text = null;

            // if we have an answer, let's add it.

            if (
                    ( nextAPos !== -1 ) &&
                    (
                        ( nextQPos === -1 ) ||
                        ( nextAPos < nextQPos )
                    )
                )
            {
                // figure out where our answer_text ends. it could be:
                // be:
                // (a) the next question
                // (b) EOs
                
                var endPos = null;

                // (b)

                if ( nextQPos === -1 ) {
                    endPos = undefined;
                }
                else {
                    endPos = nextQPos;
                }

                cardObj.answer_text = $.trim(formData.parse_text.substring(nextAPos+this.answerTag.length,endPos));
            }

            // add the card to our array. if there is no answer, it's a note.

            if ( !cardObj.answer_text ) {
                cardObj.tags.push(
                    _.filter(
                        app.store.get("card.tags"),
                        function(o){return o.tag_text === "note"}
                    )[0]
                );
            }
            cardObjs.push(cardObj);

            // grab the next question.
            currentPos = formData.parse_text.indexOf(this.questionTag,currentPos+1);
        }
        while ( currentPos !== -1 );

        // (2)  we create those cards for real on the db. the db sends us back
        //      the updated records, which we return as our form's attributes
        //      in "onFormSave"

        Spinner.get().show({msg:"Creating cards...",opacity:0});

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/cards-manual.php/create_batch/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID + "/" + this.settings.urlIDs.sID,
            type : "POST",
            data : JSON.stringify(cardObjs),
            dataType : "json",
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {
            // we have received an array of new cards from the server. that will be the return
            // result from our form.
            this.onAttrsValid(data.newCards);
            data = null;
            Spinner.get().hide();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });        
        });
    }

});