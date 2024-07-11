//---------------------------------------------------------------------------------------
// View: VSectionDash
// Description: The 'dashboard' section.
//---------------------------------------------------------------------------------------

var VSectionDash = VBaseSection.extend({

    /* overloaded */
    id : "section-dash",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : "dash",

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-dash";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseSection.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We never change the URL here. Sending `null` tells our caller that.
    ///////////////////////////////////////////////////////////////////////////

    setURL : function(settings,options) { /* overloaded */
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // We only have one page here.
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {
        return new VPageDashProfile(settings,options);
    }

});