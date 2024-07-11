//---------------------------------------------------------------------------------------
// Model: FlashcardModel
// Description: Holds a single flashcard record.
//---------------------------------------------------------------------------------------

var CardModel = Backbone.Model.extend({

    defaults : {
        id : undefined,
        set_id : undefined,
        order_id : undefined,
        question_text : undefined,
        answer_text : null, // optional
        created_on : undefined
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup all the backbone-related events that we are interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // the url we use to save a single model - when working with more
        // than one (i.e., loading) we use the collection. note that
        // this will be added to in order to specify the enrollment, 
        // user, set, and flashcard ID as appropriate.
        this.urlRoot = app.JS_ROOT + "ajax/studying/cards-backbone.php";
        this.baseUrlRoot = this.urlRoot;

        this.listenTo(this,"all",function(){
            //console.log("FlashcardModel.onAll ==> " + arguments[0]);
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // `sync` is called every time a model is either read or saved from/to the
    // server. We use this to send our user token along, to prevent CSRF/XSRF
    // attacks.
    // @CSRF/XSRF: http://www.codinghorror.com/blog/2008/10/preventing-csrf-and-xsrf-attacks.html
    ///////////////////////////////////////////////////////////////////////////

    sync : function(method,model,options) {

        // .beforeSend is an option for $.ajax (http://api.jquery.com/jQuery.ajax/)
        // to get at headers: http://stackoverflow.com/questions/541430/how-do-i-read-any-request-header-in-php
        options.beforeSend = function(jqxhr,options) {
            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
        };

        return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the model. Here we go through all of the attributes of the
    // model and ensure that they are valid.
    // @return - object containing .msg and .field on error, nothing on success
    ///////////////////////////////////////////////////////////////////////////

    validate : function(attrs,options) {

        // (1) order_id. only tested on existing models, not new ones (as given
        // auto-value on server)

        if ( attrs.id ) {

            var re = new RegExp("^[0-9]+$");
            if ( !re.test(attrs.order_id) ) {
                return {
                    msg : "<strong>Order ID</strong>: Please enter a value of zero or above",
                    field : "order_id"
                };
            }
        }

        // (2) question_text

        if ( ( !attrs.question_text.length ) || ( attrs.question_text.length > 14336 ) ) {
            return {
                msg : "<strong>Question</strong>: 1-14336 chars long",
                field : "question_text"
            };
        }

        // (3) answer_text (optional)

        if ( attrs.answer_text && attrs.answer_text.length ) {
        
            if ( attrs.answer_text.length > 4096 ) {
                return {
                    msg : "<strong>Answer</strong>: 0-4096 chars long",
                    field : "answer_text"
                };
            }
        }

        // (4) tags - no duplicates

        if ( attrs.tags && attrs.tags.length ) {

            var uniqTags = _.uniq(attrs.tags,false,function(o){
                return o.id;
            });
            if ( uniqTags.length !== attrs.tags.length ) {
                return {
                    msg : "<strong>Tags</strong>: No duplicates",
                    field : "tags"
                };
            }
        }

        // if it passed we are not supposed to return anything.
    }

});