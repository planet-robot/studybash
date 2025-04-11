//---------------------------------------------------------------------------------------
// View: VBaseWidgetToolbar
// Description: The toolbar contains one or more buttons which may be clicked (enabling
//              them is done through here). Upon being clicked the "onClickToolbar"
//              event is triggered, with the name of the button as the parameter.
//
//              Captures the click of all buttons with the .toolbar_action class on them,
//              including drop-down options of a button (`a` tag, rather than `button` tag).
//
//              Assumes that all buttons that are capturable by this view have a `name`
//              field setup in HTML.
//
//              All buttons are disabled by default.
//---------------------------------------------------------------------------------------

var VBaseWidgetToolbar = Backbone.View.extend({

    // creating a new element
    tagName : "div",

    /* overload */
    id : undefined,
    className : "widget widget-toolbar",
    templateID : undefined,

    // UI events from the HTML created by this view
    events : {
        "click button.toolbar_action" : "onClickToolbar",
        "click a.toolbar_action" : "onClickToolbar"
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {
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

        // jsfiddle for super() testing: http://jsfiddle.net/hLjC2/
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // All buttons are disabled by default. Enable the ones we want.
    //
    //  @buttons:
    //
    //      object containing a property for each button that we want to 
    //      enable (e.g., {filter:true,save:true}). Each property should correspond
    //      to a `name` value found on a particular button.
    ///////////////////////////////////////////////////////////////////////////

    setEnabled : function(buttons) {

        this.$("button").prop("disabled",true);
        for ( var prop in buttons ) {
            if ( buttons[prop] ) {
                this.$("button[name="+prop+"]").prop("disabled",false);
            }
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Return an object with all of the enabled buttons as properties.
    // The properties will have the text from the button's `name` field.
    ///////////////////////////////////////////////////////////////////////////

    getEnabled : function() {

        var enabledButtons = {};
        this.$("button").each(function(index){
            if ( $(this).prop("disabled") === false ) {
                var name = $(this).prop("name");
                enabledButtons[name] = true;
            }
        });

        return enabledButtons;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the jqo for the button with the name given. Will have length=0
    // on failure. If we can't find a `button` with that name, then we'll
    // look for an `a` element (as could be a sub-button).
    ///////////////////////////////////////////////////////////////////////////

    getButton : function(buttonName) {
        var button = this.$("button[name="+buttonName+"]");
        if ( !button.length ) {
            button = this.$("a[name="+buttonName+"]");
        }
        return button;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Someone has clicked either one of the buttons or one of the dropdown button
    // links. Trigger an event for anyone who cared to listen.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(event) {

        var button = $(event.currentTarget);
        var buttonName = button.prop("name");
        this.$("*[data-toggle=tooltip]").tooltip("hide");
        this.trigger("onClickToolbar",buttonName,button,event);
        event.preventDefault();
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Generate the HTML for the toolbar and disable all of the buttons.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        this.$el.html($.includejs.getTemplate(this.templateID));
        this.setEnabled({});
        this.$("*[data-toggle=tooltip]").tooltip();

        return this;
    }

});