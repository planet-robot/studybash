//---------------------------------------------------------------------------------------
// View: VBaseSection
// Description: This represents the base view for a section of the site. A section refers to
//              a place where the "page" may change, but we do not want to go through the
//              `router` object directly. In other words, we may change the URL but all of
//              that "routing" is done internally to this section.
//
//              This means that we render the header and menu at this point, before passing off
//              control to one of our pageView instances, which will render everything
//              below that point (i.e., everything else). There is very little functionality
//              performed here except to serve as an entry point and a fallback point when the
//              pageView needs to change for the section.
//
//              When setting/changing the page, we must construct a URL that is shown in
//              the address bar, but does not trigger a router event. If that is invalid,
//              we trigger the 404 route. Beyond that, it is the pageView that actually 
//              renders the widgets (i.e., CONTENT) of the section (as that will change
//              depending on which pageView is active).
//---------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Note:    The way parameters are organized in this hierarchy of views is like
//          so: Any parameter that is required is sent as a named parameter, with
//          a specific and identifying name. If there are several requirements,
//          that are known, then they are all named. If, however, their number
//          is unknown, they are sent as an object. This object is called `settings`.
//          However, try to keep `settings` for construction purposes only, for
//          every other scenario, used named parameters.
//
//          Any optional parameters are grouped together, whether known or unknown,
//          in an object named `options`. This is the same name that backbone
//          uses, so they may become merged - be careful not to use property names
//          that backbone uses.
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Note:    Files, views, and templates are named using the following format:
//
//          [base?][baseType][section][page][name] *note: a '.' isn't always a delimiter
//
//          base - present if it's a pseudo-abstract view (i.e., not instantiated directly)
//          baseType - (i.e., section, page, widget)
//          section - name of the section it's in
//          page - name of the page it's in
//          name - the name of the file/view/template (if the previous fields don't identify it)
//
//          examples:
//
//              [widget][flashcards.browse][modules][list]
//              [section][flashcards.browse]
//              [page][flashcards.browse]
//              [base][page][browse]
//              [base][widget][list]
//              [widget][dash][profile][panel]
//
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Note:    Most objects involved in our hierarchy will take `settings` and
//          `options` values in their constructor. Settings are required values
//          and options are, well, optional values. If an object is required, make
//          it a property of the `settings` object, do not send it as the
//          `settings` object alone.
//-----------------------------------------------------------------------------

var VBaseSection = Backbone.View.extend({

    // creating new DOM element
    tagName : "div",

    /* overload */
    id : undefined,
    className : "section", // inherit as function, like `events` (see below)
    sectionTemplateID : undefined,
    headerTemplateID : undefined,
    headerElement : undefined,
    pageElement : undefined,
    menuClassNameActive : undefined,

    // UI events from the HTML created by this view. always inherit this through
    // a function (i.e., http://stackoverflow.com/questions/9403675/backbone-view-inherit-and-extend-events-from-parent)
    events : {        
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // We will setup the first page of the section. When the data for that page
    // has loaded, we will notify our caller that we're ready to be rendered.
    //
    //  @settings:
    //
    //      Data object of required values. Sent to us from `app.router`. It represents
    //      a parsed object of properties that was extracted from the URL entered
    //      that got us to this section. At this stage, it should enable the section
    //      to figure out: (a) what page should be instantiated; and (b) what URL
    //      should be displayed (based upon the page that was instantiated - this
    //      will likely not change the first time the section is entered).
    //
    //  @callback:
    //
    //      The function to call when the section is ready to be rendered.
    //      This is required because we do not know where this section will
    //      be going in the DOM, and our parent, who DOES know, needs to know
    //      when we're ready to be rendered.
    //
    //  @options:
    //
    //      Any flags that you want to pass along to the page construction.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,callback,options) {

        this.setPage(
            settings,
            function(){
                callback(this);
            }.bind(this),
            options
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        // all subview(s) will be listening for this event.
        this.trigger("cleanup");

        // empty references
        this.stopListening(this.pageView);
        this.pageView = null;

        // note: jsfiddle for super() testing: http://jsfiddle.net/hLjC2/        
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Setting up the current pageView. First, based upon the settings that
    // have been sent we will construct and display the URL that represents
    // the page. If that fails, we trigger a 404. The settings also tell us
    // what page we should be instantiating.
    //
    // If we have been given a `callback`, that means this is the original
    // call to the view, so it's being constructed, and our caller needs to
    // know when we can be rendered. Otherwise, it's an internal call, from
    // one of our pages, and so we can simply re-render the page.
    //
    // @settings:   Required values. This will be used to determine what page
    //              instance should be instantiated as well as what URL we
    //              should be showing. Sent from either `VSection::constructor`
    //              or from a manual call to `setPage`.
    //
    // @options:    Any flags that you want to pass along to the page construction.
    //              If this is our initial page, they were passed to our constructor,
    //              otherwise they were created for this function.
    //      
    ///////////////////////////////////////////////////////////////////////////

    setPage : function(settings,callback,options) {

        var url = this.setURL(settings,options); /* overload */

        // if `null` is sent back, that means that we don't have to
        // change the URL at all. `false` is returned for an error (404).
        
        if ( $.gettype(url).base === "string" ) {
            app.router.navigate(url,{trigger:false});
        }
        else if ( url === false ) {
            app.gotoSection("notFound");
            return;
        }

        // remove our existing page.

        if ( this.pageView ) {
            this.stopListening(this.pageView);
            this.pageView.remove();
        }

        // create our page, giving them access to the settings and options that
        // were sent to us.

        //fixme: this NULL check is not documented anywhere. but it is a very
        // sensible approach to 404 errors. implement it further in the code.
        this.pageView = this.instantiatePageView(settings,options); /* overload */
        if ( !this.pageView ) {
            app.gotoSection("notFound");
            return;
        }
        this.pageView.listenTo(this,"cleanup",this.pageView.remove);

        // the pageView can tell us three things:
        
        // (1)  it wants us to change the current page (which is what we're doing now).
        this.listenTo(this.pageView,"setPage",this.setPage);

        // (2)  it is ready to be rendered. the rendering duties are performed by
        //      our caller if we were called from our own constructor (`initialize`).
        //      otherwise, if it was an internal call to `setPage`, then we can just
        //      render the page ourselves (as our element already exists in the DOM)
        //      and we won't have been sent a callback.

        this.listenTo(this.pageView,"onPageReady",function(){            
            if ( callback ) {
                callback(this);
            }
            else {
                this.renderPage();
            }
        }.bind(this));

        // (3)  it failed to prepare for rendering, we treat this the same as a 404 error.
        //      notice that we are removing any spinner that might have been started by
        //      the page, just as we do after our call to `renderPage`... except since
        //      we failed we'll never get there.

        this.listenTo(this.pageView,"onPageFailed",function(){            
            Spinner.get().hide(function(){
                app.gotoSection("notFound");
            });
        }.bind(this));

        // now that everything is setup, we can ask the page to load
        // it's data, which will eventually trigger "onPageReady" when it's 
        // done. note that the `pageView` view will have to display its own
        // spinner if it wants one shown.
        
        this.pageView.loadData();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton template for a section, followed by the header and
    // menu. Finally, we render the page itself.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        this.$el.html($.includejs.getTemplate(this.sectionTemplateID));

        this.$(this.headerElement).html($.includejs.getTemplate(this.headerTemplateID));

        // not all sections will have a menu. if `menuClassNameActive` is defined, then
        // we assume that their header is a menu.
        
        if ( this.menuClassNameActive ) {
            this.$(this.headerElement).find("li").removeClass("active");
            this.$(this.headerElement).find("li."+this.menuClassNameActive).addClass("active");
        }

        this.renderPage();

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the page within its appropriate element. As data was successfully
    // loaded (for the page in question), and fully displayed, we can get rid
    // of the spinner (if it was displayed as part of the `pageView.loadData`).
    ///////////////////////////////////////////////////////////////////////////

    renderPage : function() {
        this.$(this.pageElement).html(this.pageView.render().$el);        
        Spinner.get().hide();
    }

});