//---------------------------------------------------------------------------------------
// View: VPageTestsTakeIntro
// Description: This is the page that is presented just before a user begins a test.
//              We are responsible for loading the test itself from the server. We
//              present the user with a panel (test info) and a small form that
//              enables them to set the test's settings (e.g., sort order, etc.)
//              Accordingly, we have two subViews here.
//
//              Notice that we never generate "onPageFailed" here.
//---------------------------------------------------------------------------------------

var VPageTestsTakeIntro = VBasePage.extend({

    /* overloaded */
    id : "page-tests-take-intro",    
    pageTemplateID : "tpl-page",    
    contentElement : "div.page-content",
    footerElement : "div.page-footer-user",    
    footerTemplateID : "tpl-page-footer-user",
    contentTemplateID : "tpl-page-content-tests-take-intro", // optional

    /* overload */
    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-tests-take-intro";
    },

    panelElement : "div.page-content > div.content-panel",
    formElement : "div.page-content > div.content-form",

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally sent to `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        this.panelView = null;
        this.formView = null;

        VBasePage.prototype.initialize.call(this,settings,options); // copies over parms.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    //
    // If we want to show a spinner at this point we'll have to do so ourselves.
    //
    //  Note:   The data for the listView must be stored into `this.listData`
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageTestsTakeIntro__loadData() { /* overloaded */

        // we will be grabbing the test from the server here
        this.test = null;

        // we are getting either a regular test, an auto set, or a
        // manual test.

        var type = null;
        var id = null;
        var manualTest = null;

        if ( this.settings.urlIDs ) {
            type = ( !!this.settings.urlIDs.aID ? "auto" : "regular" );
            id = ( type === "auto" ? this.settings.urlIDs.aID : this.settings.urlIDs.tID );
        }

        else {
            type = "manual";
            manualTest = this.settings.manualData;
        }

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading test...",opacity:0});
        
        var jqXHR = $.ajax({
            url : app.JS_ROOT + "ajax/studying/tests-manual.php/take",
            type : "POST",            
            data : JSON.stringify({
                type : type,
                id : id,
                manualTest : manualTest
            }),
            dataType : "json",
            contentType : "application/json",
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            if ( data.test ) {
            
                this.test = data.test;

                // we are going to sort the sets of our test into the REVERSE order
                // than they would have in the regular `list` widget. this is because
                // that sort order puts the newest ones (e.g., "Chapter 10") before the
                // earlier ones (e.g., "Chapter 01"). However, in this case, we want them
                // to be from earliest -> latest. notice that to do this all we have
                // to do is sort them in ascending order by their name + description.

                this.test.setsInfo = _.sortBy(
                    this.test.setsInfo,
                    function(o) {
                        return ( o.set_name + ( o.description ? o.description : "" ) );
                    }
                );
            }

            data = null;
            this.ready();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // All of the data has been loaded that the page requires. We will
    // construct our subviews and then trigger an event notifying whoever is
    // listening that we're ready to render.
    ///////////////////////////////////////////////////////////////////////////

    ready : function() { /* overloaded */

        // if we do not have a test then we have failed to load the page

        if ( !this.test ) {
            this.trigger("onPageFailed",this);
            return;
        }

        var panelSettings = _.extend({},this.settings,{templateAttrs:this.buildPanelAttrs()});
        this.panelView = new VWidgetTestsTakeIntroPanel(panelSettings,{});

        this.formView = new VWidgetTestsTakeIntroFormSettings(this.settings,{});        
        
        this.panelView.listenTo(this,"cleanup",this.panelView.remove);
        this.formView.listenTo(this,"cleanup",this.formView.remove);

        this.listenTo(this.panelView,"onPanelOK",this.onPanelOK);
        this.listenTo(this.formView,"onFormSubmit",this.onFormSubmit);

        this.trigger("onPageReady",this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Cleanup ourselves and all subviews.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        // empty references
        this.stopListening(this.panelView);
        this.stopListening(this.formView);
        this.panelView = null;
        this.formView = null;                
        this.test = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton of the page through base, then render our widgets.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);

        this.$(this.panelElement).html(this.panelView.render().$el);
        this.$(this.formElement).html(this.formView.render().$el);

        if ( this.test.is_auto_test ) {
            this.panelView.disableOKButton();
        }

        if ( !this.test.num_cards ) {
            this.formView.disableSaveButton();
        }

        return this;
    },

    /*
        Triggered Events.
    */    

    ///////////////////////////////////////////////////////////////////////////
    // The panel's "ok" button has been pressed. We will display more information
    // about the test in a dialog.
    ///////////////////////////////////////////////////////////////////////////

    onPanelOK : function() {
        
        var html = $.includejs.getTemplate("tpl-widget-tests-take-intro-panel-more-info",this.test);

        bsDialog.create({                
            title : "Test Information",
            msg : html,
            ok : function(){}
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The formView that was opened has successfully "saved" whatever the user
    // entered. Depending on the formView that was instantiated, highlighted
    // by the `formName` param, our actions will differ.
    //
    //  @formName:  The `formName` property of the VBaseWidgetForm-derived view
    //              that was submitted.
    //
    //  @formData:  The data serialized from the form. The structure of this
    //              may change significantly depending on the type of formView
    //              we're working with.
    //
    //  @options:   Any flags that were set along our chain of function calls
    //              that got us here. They will relate directly to the action
    //              of "saving". They may include our own options ("sb...") and
    //              backbone-related options.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) { /* overloaded */

        if ( formName === "settings" ) {
            
            /*
                From the form, we have:
                .randomize
                .display_set_name
                .display_card_tags
                .show_remaining
            */

            // now, our slideshow widget expects us to send an array of objects,
            // which will be converted into a collection in the widget. however,
            // we must sort the array ourselves, as the collection will NOT be
            // sorted when it is passed to the widget. that widget only sorts
            // new items that are added (and we never add anything in our use
            // of the widget here).

            // note that we already sorted our sets in the REVERSE order
            // than they would have been in the regular `list` widget, in `loadData`.

            // now if we aren't randomizing cards, we will just add them in order to
            // the `cards` array.

            var orderedCards = [];

            if ( !formData.randomize ) {

                // separate all the cards based upon their set_id
                var cardsGroupedBySet = _.groupBy(
                    this.test.cards,
                    "set_id"
                );

                // go through all of our sets
                for ( var s=0; s < this.test.setsInfo.length; s++ ) {

                    // grab the cards that belong to that set and
                    // then sort them in ascending order by `order_id`.
                    // notice that this is again the REVERSE for how
                    // they're sorted in normal list widget.

                    var setID = this.test.setsInfo[s].id;
                    var cards = cardsGroupedBySet[setID];

                    cards = _.sortBy(
                        cards,
                        "order_id"
                    );

                    // append these cards to the final array
                    orderedCards = orderedCards.concat(cards);
                }
            }

            else {

                // okay, we've been told to randomize the cards, so we'll just shuffle up
                // the cards 7 times (where did I read that that's how many times you need
                // to get a "good" shuffle)?

                for ( var x=0; x < 7; x++ ) {
                    this.test.cards = _.shuffle(this.test.cards);
                }

                // that is our final order
                orderedCards = this.test.cards;
            }

            // okay, we're done. let's tell our section that we're going to change pages.
            // we'll pass along a few things: (1) our test object. (2) the ordered cards.
            // (3) the settings that were just filled out.

            this.trigger("setPage",{
                urlIDs : this.settings.urlIDs,
                manualData : this.settings.manualData,
                pageName : "doing",
                testSettings : formData,
                test : this.test,
                cards : orderedCards,
                startingIdx : 0
            });
        }
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // We are displaying some of the test's information in our main panel here.
    // Let's update the test to have full info on all of its tags, as well as
    // building displayable strings for the tags (i.e., text) and keywords.
    ///////////////////////////////////////////////////////////////////////////

    buildPanelAttrs : function() {

        // replace our tag IDs with the full objects. this is a permanent
        // change in the test object.

        this.test.tags = _.map(
            this.test.tags,
            function(id){
                return _.find(
                    app.store.get("card.tags"),
                    function(o){
                        return o.id===id;
                    }
                )
            }
        );

        // create the temporary `tagsText` field.
        var tagsText = "None";
        if ( this.test.tags.length ) {
            tagsText = _.pluck(this.test.tags,"tag_text").join(", ");
        }

        // create the temporary `keywordsText` field.
        var keywordsText = this.test.keywords.length ? this.test.keywords.join(", ") : "None";

        // we've finished. extend the attributes of the test with what we just did into a new
        // object that will be used alongside a template.
        return _.extend({},this.test,{tagsText:tagsText,keywordsText:keywordsText});
    }

});