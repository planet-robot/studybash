//---------------------------------------------------------------------------------------
// View: VSectionBrowserfail
// Description: This is a one-off section that is designed to provide the interface expected
//              by the app (i.e., like all other sections) but to work with a single template
//              for its display. So there are no pages here, just the section, which renders
//              a lone template.
//
//              The reason it's like this is because we cannot be assured that $.includejs 
//              will work, so we're left with the minimum functionality possible - i.e., do
//              everything ourselves.
//---------------------------------------------------------------------------------------

var VSectionBrowserfail = Backbone.View.extend({

    // creating new DOM element
    tagName : "div",
    id : "section-page-browserfail",
    className : "section section-page-browserfail",

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // We execute the callback immediately. As we are ready to render from the
    // beginning.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,callback,options) {
        callback(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // We simply render our template. Nothing else to do.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        var templateAttrs = {};
        var html = _.template(
            $("#tpl-section-page-browserfail").html(),
            _.extend({},templateAttrs,{ROOT:app.JS_ROOT})
        );
        this.$el.html(html);

        return this;
    }

});