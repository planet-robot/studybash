//---------------------------------------------------------------------------------------
// View: HappinessView
// Description: Responsible for the page displayed when the browser has failed our tests.
//---------------------------------------------------------------------------------------

var HappinessView = Backbone.View.extend({

    // creating a new DOM element
    tagName : "div",
    id : "browser-fail",    

    // UI events from the HTML created by this view
    events : {
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // This sets up the listeners for the backbone events that the view cares 
    // about, as well as asking the server for the information we need.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(options) {

        /*
            Parse the options.
        */

        // we need to know the parent DOM element that we'll be working with.
        this.parent = options.parent;

        /*
            Setup the backbone events that we're interested in.
        */

        /*
            Load what we need from the server.
        */

        // setup templates first.

        this.templates = {}
        this.templates["tpl-browserfail"] = $.includejs.getTemplate("tpl-browserfail",{});
    },

    ///////////////////////////////////////////////////////////////////////////
    // The view is being removed from the DOM. Let's trigger an event that
    // our subview(s) will respond to, thereby removing themselves too.
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        // all subview(s) will be listening for this event.
        this.trigger("cleanup");

        // jsfiddle for super() testing: http://jsfiddle.net/hLjC2/
        return Backbone.View.prototype.remove.call(this);
    },
    
    ///////////////////////////////////////////////////////////////////////////
    // Actually adds our created element to the DOM, at a pre-specified
    // position.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        this.$el.html(this.templates["tpl-browserfail"]);
        this.parent.append(this.$el);

        return this;
    }

});