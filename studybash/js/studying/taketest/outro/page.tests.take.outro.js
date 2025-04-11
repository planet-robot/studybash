//---------------------------------------------------------------------------------------
// View: VPageTestsTakeOutro
// Description: The test is done. We present a short summary and ask if they want
//              to take it again.
//---------------------------------------------------------------------------------------

var VPageTestsTakeOutro = VBasePage.extend({

    /* overloaded */
    id : "page-tests-take-outro",    
    pageTemplateID : "tpl-page",    
    contentElement : "div.page-content",
    footerElement : "div.page-footer-user",    
    footerTemplateID : "tpl-page-footer-user",
    contentTemplateID : "tpl-page-content-tests-take-outro", // optional

    /* overload */
    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-tests-take-outro";
    },

    panelElement : "div.page-content > div.content-panel",

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //      Quickly parse the data we got from the "doing" page. We just
    //      construct a string to say how many they got right.
    //  
    //  @options. Not used here.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        settings.stats.num_correct_string = settings.correctCardIDs.length + " / " + settings.test.cards.length + " ("+(Math.floor((settings.correctCardIDs.length/settings.test.cards.length)*100))+"%)";

        this.panelView = null;

        VBasePage.prototype.initialize.call(this,settings,options); // copies over parms.
    },

    ///////////////////////////////////////////////////////////////////////////
    // No data to load here. Just construct our widgets and tell parent that
    // we're ready to render.
    ///////////////////////////////////////////////////////////////////////////

    ready : function() { /* overloaded */

        var panelAttrs = _.extend({},this.settings.stats,this.settings.test);
        this.panelView = new VWidgetTestsTakeOutroPanel({templateAttrs:panelAttrs},{});
        
        this.panelView.listenTo(this,"cleanup",this.panelView.remove);
        
        this.listenTo(this.panelView,"onPanelOK",this.onPanelOK);
        this.listenTo(this.panelView,"onPanelCancel",this.onPanelCancel);

        this.trigger("onPageReady",this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Cleanup ourselves and all subviews.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        this.stopListening(this.panelView);

        // empty references        
        this.panelView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML through our base, then render the two widgets.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);

        this.$(this.panelElement).html(this.panelView.render().$el);

        return this;
    },

    /*
        Triggered Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked the "re-take test" button. Let's send them back to
    // the 'intro' section, internally, through our section.
    ///////////////////////////////////////////////////////////////////////////

    onPanelOK : function(event) {
        
        this.trigger("setPage",{
            pageName : "intro",
            urlIDs : this.settings.urlIDs,
            manualData : this.settings.manualData
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We are going to go back to tests/flashcards section, depending on
    // whether or not this was a manual test.
    ///////////////////////////////////////////////////////////////////////////

    onPanelCancel : function(event) {

        var moduleID = this.settings.test.module_id;
        app.router.navigate("#studying/browse/"+"m"+moduleID+"/",{trigger:true});
    }

});