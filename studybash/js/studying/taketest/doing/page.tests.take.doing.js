//---------------------------------------------------------------------------------------
// View: VPageTestsTakeDoing
// Description: This is the page that actually allows the user to take the test. in
//              We do not load any data from the server, as everything we need was
//              loaded in the 'intro' page. We have several widgets here:
//              two panels, and slideshow.
//---------------------------------------------------------------------------------------

var VPageTestsTakeDoing = VBasePage.extend({

    /* overloaded */
    id : "page-tests-take-doing",    
    pageTemplateID : "tpl-page",    
    contentElement : "div.page-content",
    footerElement : "div.page-footer",    
    footerTemplateID : "tpl-page-footer-user",
    contentTemplateID : "tpl-page-content-tests-take-doing", // optional

    /* overload */
    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-tests-take-doing";
    },

    panelTimerElement : "div.page-content > div.content-panels > div.content-panel-timer",
    panelDetailsElement : "div.page-content > div.content-panels > div.content-panel-details",
    slideshowElement : "div.page-content > div.content-slideshow",

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @settings.  This will contain all the data loaded and setup in the 'intro'
    //              page. Including the test, cards, and settings.
    //  @options.   Sent to `setPage`. Not used.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        this.panelTimerView = null;
        this.panelDetailsView = null;
        this.slideshowView = null;

        // need to do this at the start, as we rely on `this.settings` in some of
        // the member functions that are called here.
        VBasePage.prototype.initialize.call(this,settings,options);

        // this is the stats object that will be sent to our two panel widgets.
        // some of the info is kept here only, some is stored outside and will be
        // copied here whenever we are told of its updating.

        this.stats = {
            idx : 0,
            minutes_spent : 0,
            num_cards : settings.cards.length,
            set_name : this.constructSetName(settings.cards[0].set_id),
        };

        // we have a timer that goes off every minute, to update the time spent
        // on the test.

        this.timer = $.timer(function(){
            this.onTimer();
        }.bind(this));
        this.timer.set({time:60000,autostart:false});        
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is called immediately after `initialize` (through base). We construct
    // all the subviews and tell our parent that we're ready to render.
    ///////////////////////////////////////////////////////////////////////////

    ready : function() { /* overloaded */

        // both panels require our stats and the settings for the test.

        this.panelTimerView = new VWidgetTestsTakeDoingPanelTimer(
            {templateAttrs:_.extend({},{settings:this.settings.testSettings},this.stats)},
            {}
        );
        this.panelDetailsView = new VWidgetTestsTakeDoingPanelDetails(
            {templateAttrs:_.extend({},{settings:this.settings.testSettings},this.stats)},
            {}
        );

        // slideshow requires the page settings (for historical reasons),
        // as well as the objects and starting idx.

        this.slideshowView = new VWidgetTestsTakeDoingSlideshow(
            {
                urlIDs : this.settings.urlIDs,
                objects : this.settings.cards,
                test : this.settings.test,
                startingIdx : this.settings.startingIdx,
            },
            {
                isShowingTags : this.settings.testSettings.display_card_tags
            }
        );
        
        this.panelTimerView.listenTo(this,"cleanup",this.panelTimerView.remove);
        this.panelDetailsView.listenTo(this,"cleanup",this.panelDetailsView.remove);
        this.slideshowView.listenTo(this,"cleanup",this.slideshowView.remove);

        // we only care about events:
        // (1) record changes in the slideshow
        // (2) slideshow toolbar is clicked.
        
        this.listenTo(this.slideshowView,"onRecordChange",this.onSlideshowRecordChange);
        this.listenTo(this.slideshowView,"onClickToolbar",this.onSlideshowClickToolbar);

        this.trigger("onPageReady",this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Cleanup ourselves and all subviews.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* overloaded */

        this.timer.stop();

        this.stopListening(this.slideshowView);
        this.stopListening(this.panelDetailsView);
        this.stopListening(this.panelTimerView);

        // empty references
        this.timer = null;
        this.slideshowView = null;
        this.panelDetailsView = null;
        this.panelTimerView = null;
        
        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // our widgets.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);

        // update the help link
        var href = this.$("div.sb-footer div.help a").prop("href");
        this.$("div.sb-footer div.help a").prop("href",href+"tests/");

        this.$(this.panelTimerElement).html(this.panelTimerView.render().$el);
        this.$(this.panelDetailsElement).html(this.panelDetailsView.render().$el);
        this.$(this.slideshowElement).html(this.slideshowView.render().$el);

        // as this is only called once. we can now start our timer.
        this.timer.play();

        return this;
    },

    /*
        Triggered Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Our timer event has gone off. We increaes the time and re-render the
    // panel that has that information.
    ///////////////////////////////////////////////////////////////////////////

    onTimer : function() {
        this.stats.minutes_spent++;        
        this.panelTimerView.settings.templateAttrs = _.extend({},this.panelTimerView.settings.templateAttrs,this.stats);
        this.$(this.panelTimerElement).html(this.panelTimerView.render().$el);
    },    

    ///////////////////////////////////////////////////////////////////////////
    // The user has changed which record is visible in the slideshow. Take this
    // opportunity to completely update our stats.
    //
    //  @idx.   this is zero-based. So its literal value tells us how many cards
    //          have been answered.
    //
    //  @model. the model that is currently being shown.
    //
    ///////////////////////////////////////////////////////////////////////////

    onSlideshowRecordChange : function(idx,model) {

        this.stats.idx = idx;
        this.stats.set_name = this.constructSetName(model.get("set_id"));
        this.updateDetails();
    },

    ///////////////////////////////////////////////////////////////////////////
    // User has clicked a button in the slideshow's toolbar. The only one
    // we care about here is "end. Everything else can be handled by the slideshow.
    ///////////////////////////////////////////////////////////////////////////

    onSlideshowClickToolbar : function(buttonName,button,event) {

        if ( buttonName === "end" ) {
            this.trigger("setPage",{
                pageName : "outro",
                stats : this.stats,
                urlIDs : this.settings.urlIDs,
                manualData : this.settings.manualData,
                test : this.settings.test,
                correctCardIDs : this.slideshowView.correctCardIDs
            });    
        }
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Get the constructed set name for a given setID
    ///////////////////////////////////////////////////////////////////////////

    constructSetName : function(setID) {
        var set = _.find(this.settings.test.setsInfo,function(o){
            return o.id === setID;
        });
        return set.set_name + ( set.description ? " ("+set.description+")" : "" );
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our stats have been updated (not timer), so we have to re-render that
    // panel of information.
    ///////////////////////////////////////////////////////////////////////////

    updateDetails : function() {
        this.panelDetailsView.settings.templateAttrs = _.extend({},this.panelDetailsView.settings.templateAttrs,this.stats);
        this.$(this.panelDetailsElement).html(this.panelDetailsView.render().$el);
    }

});