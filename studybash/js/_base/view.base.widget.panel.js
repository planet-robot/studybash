//---------------------------------------------------------------------------------------
// View:        VBaseWidgetPanel
// Description: Simple widget that renders a template to its element, using a member
//              data object as its attributes hash. Captures a single button's 'click'
//              event ("ok" button).
//
//              We can generate a single event here: onPanelOK.
//---------------------------------------------------------------------------------------

var VBaseWidgetPanel = Backbone.View.extend({

    /* overload */
    tagName : "div",
    className : "widget widget-panel",
    templateID : undefined,

    // UI events from the HTML created by this view
    events : {
        "click button[name=button_ok]" : "onClickOK"
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //  @settings:  data object that contains:
    //
    //              .templateAttrs
    //
    //              This contains the attributes hash used to fill the template.
    //
    //  @options:   Any flags that might be used internally.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {
        this.settings = settings || {};
        this.options = options || {};
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {        
        
        this.settings = null;
        this.options = null;

        this.trigger("cleanup");
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Simply render our template with our attributes hash. Notice that
    // we call `delegateEvents` as we have an events hash, this enables our parent
    // to re-render us without issue.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {
        this.$el.html($.includejs.getTemplate(this.templateID,this.settings.templateAttrs));
        this.$("*[data-toggle=tooltip]").tooltip();
        this.delegateEvents();
        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The button on our panel has been clicked. Generate the event for
    // our parent.
    ///////////////////////////////////////////////////////////////////////////

    onClickOK : function(event) {
        this.trigger("onPanelOK");
        event.preventDefault();
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Enable or disable the button within ourselves.
    ///////////////////////////////////////////////////////////////////////////

    enableOKButton : function() {
        this.$("button[name=button_ok]").prop("disabled",false);
    },

    disableOKButton : function() {
        this.$("button[name=button_ok]").prop("disabled",true);
    }

});