//---------------------------------------------------------------------------------------
// View: VSectionLogout
// Description: This section deals with logging out only. One page alone.
//---------------------------------------------------------------------------------------

var VSectionLogout = VBaseSection.extend({

    /* overloaded */
    id : "section-logout",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : "logout",

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-logout";
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
        return new VPageLogout(settings,options);
    }

});