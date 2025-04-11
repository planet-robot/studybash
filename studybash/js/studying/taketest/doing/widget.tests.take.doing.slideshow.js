//---------------------------------------------------------------------------------------
// View: VWidgetTestsTakeDoingSlideshow
// Description: We display the cards that are part of the test here. The user can
//              do prev/next/end as well as toggle answer and flag as "correct".
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingSlideshow = VBaseWidgetSlideshow.extend({

    /* overloaded */
    id : "widget-tests-take-doing-slideshow",

    widgetLayoutTemplateID : "tpl-widget-tests-take-doing-slideshow",
    toolbarElement : "div.content-toolbar",
    recordElement : "div.content-record",
    
    className : function() {
        return _.result(VBaseWidgetSlideshow.prototype,'className') + " widget-tests-take-doing-slideshow";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetSlideshow.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Initialize any of our proprietary members.
    //
    //  @options:
    //      contains .isShowingTags. We use that here to determine how the
    //      VBaseWidgetRecordEditable-derived view displays the data.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* extended */

        this.correctCardIDs = [];
        this.isShowingAnswer = false;
        this.isShowingTags = options.isShowingTags;
        VBaseWidgetSlideshow.prototype.initialize.call(this,settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is extended only so that we can begin capturing keyboard input
    // as soon as we are present in the DOM.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* extended */

        this.captureKeyboard();
        return VBaseWidgetSlideshow.prototype.render.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Tell all subviews to cleanup, and then remove ourselves.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        this.releaseKeyboard();
        this.correctCardIDs = null;
        return VBaseWidgetSlideshow.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    //  Overloaded methods to instantiate the appropriate views for our widget.
    ///////////////////////////////////////////////////////////////////////////

    instantiateCollection : function() { /* overloaded */
        return new CardsCollection();
    },

    instantiateToolbar : function() { /* overloaded */
        return new VWidgetTestsTakeDoingSlideshowToolbar();
    },

    ///////////////////////////////////////////////////////////////////////////
    // We will send our VBaseWidgetRecordEditable-derived view a lot of info.
    // It wants the `test` from our settings, as well as the model that it's
    // working on. As for options, it needs to know if it's showing the answer
    // or the tags of the card.
    ///////////////////////////////////////////////////////////////////////////

    instantiateRecord : function() { /* overloaded */
        return new VWidgetTestsTakeDoingRecordEditable(
            {
                slideshowSettings:this.settings,
                model:this.collection.at(this.idx)
            },
            {
                slideshowOptions:this.options,
                isShowingAnswer:this.isShowingAnswer,
                isShowingTags:this.isShowingTags
            }
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // We deal with our proprietary buttons here: show, correct.
    ///////////////////////////////////////////////////////////////////////////

    updateToolbar : function() { /* extended */

        VBaseWidgetSlideshow.prototype.updateToolbar.call(this);

        var toolbarButtonState = this.toolbarView.getEnabled();
        this.toolbarView.setEnabled(_.extend({},toolbarButtonState,{
            show_answer : !!this.collection.length,
            correct : !!this.collection.length
        }));

        if ( this.collection.length ) {

            // highlighting show_answer

            this.toolbarView.getButton("show_answer").removeClass("btn-info btn-default").addClass(this.isShowingAnswer?"btn-info":"btn-default");

            // highlighting correct

            var model = this.collection.at(this.idx);
            var correct = !model ? false : _.contains(this.correctCardIDs,model.get("id"));

            this.toolbarView.getButton("correct").removeClass("btn-success btn-default").addClass(correct?"btn-success":"btn-default");
        }
    },

    /*
        Triggered Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Everytime the user changes card, we reset `isShowingAnswer` to false.
    // And that gets sent to the recordView everytime a new card is shown through
    // its constructor. The next/prev buttons will trigger a refresh through
    // our base widget, whereas we refresh manually on 'show answer'.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,button,event) { /* extended */        

        // PREV

        if ( buttonName === "prev" ) {
            this.isShowingAnswer = false;
        }        

        // NEXT

        else if ( buttonName === "next" ) {
            this.isShowingAnswer = false;
        }

        // SHOW ANSWER (toggle)

        else if ( buttonName === "show_answer" ) {
            this.isShowingAnswer = !this.isShowingAnswer;
            this.renderRecord();
            this.updateToolbar();
        }

        // CORRECT (toggle)

        else if ( buttonName === "correct" ) {

            var cardModel = this.collection.at(this.idx);
            var wasCorrect = _.indexOf(this.correctCardIDs,cardModel.get("id"));

            // was it previously correct? if so, now it's not.
            if ( wasCorrect !== -1 ) {
                this.correctCardIDs = _.without(this.correctCardIDs,cardModel.get("id"));
            }
            else {
                this.correctCardIDs.push(cardModel.get("id"));
            }

            this.updateToolbar();
        }

        VBaseWidgetSlideshow.prototype.onClickToolbar.call(this,buttonName,event);
    },

    ///////////////////////////////////////////////////////////////////////////
    // We use these three events to disable/re-enable our keyboard capturing.
    // This prevents us from capturing their keystrokes while they are editing
    // a given card.
    ///////////////////////////////////////////////////////////////////////////

    onRecordEdit : function(recordView) {
        this.releaseKeyboard();
    },

    onRecordSave : function(recordView) {
        this.captureKeyboard();
    },

    onRecordCancel : function(recordView) {
        this.captureKeyboard();
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Start capturing all the keystrokes that we are interested in. We have
    // to grab them from "body", otherwise the focus-requirements are too
    // strict (e.g., have to be focused on input within the div, can't just
    // be focused on the div). Notice that we are only ever calling toolbar
    // commands here - nothing outside of those functions already setup.
    ///////////////////////////////////////////////////////////////////////////

    captureKeyboard : function() {

        // we are going to block the ENTER key from being processed by
        // the default handlers. this avoids the situation where someone
        // is just holding down ENTER while focused on a given key, which
        // would endlessly cycle the key being on/off/on/off...

        $("body").on("keydown",function(event){

            // stop only certain key values
            switch ( event.keyCode ) {
                case 13:
                    event.preventDefault();
                    event.stopPropagation();
                    break;
            }
        });

        $("body").on("keyup",function(event){

            // capture all UP events and stop 'em.

            event.stopPropagation();
            event.preventDefault();

            // we do NOT allow for keypresses while the app is busy and
            // blocking mouse input.

            if ( !Spinner.get().isShowing() ) {
            
                switch ( event.keyCode ) {

                    // left/right arrows
                    case 37:
                        this.onClickToolbar("prev");
                        break;
                    case 39:
                        this.onClickToolbar("next");
                        break;

                    // space/enter/esc
                    case 32:
                        this.onClickToolbar("show_answer");
                        break;
                    case 13:
                        this.onClickToolbar("correct");
                        break;
                    case 27:
                        this.onClickToolbar("end");
                        break;
                    
                    // 1,2,3 (numpad and regular)
                    case 49:
                    case 50:
                    case 51:
                    case 97:
                    case 98:
                    case 99:
                        var suffix = ( event.keyCode < 97 ? event.keyCode-48 : event.keyCode-96 );
                        if ( this.recordView ) {
                            this.recordView.onClickToolbar("difficulty"+suffix);
                        }
                        break;

                }
            }

        }.bind(this));
    },

    ///////////////////////////////////////////////////////////////////////////
    // Stop capturing any keyboard events. This frees the user to enter values
    // into input fields, for ex., without us having to deal with their keystrokes.
    ///////////////////////////////////////////////////////////////////////////

    releaseKeyboard : function() {
        $("body").off("keydown");
        $("body").off("keyup");
    }
    
});