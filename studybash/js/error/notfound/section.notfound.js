//---------------------------------------------------------------------------------------
// Section: VSectionNotfound
// Description: We display only one page here.
//---------------------------------------------------------------------------------------

var VSectionNotfound = VBaseSection.extend({

    /* overloaded */
    id : "section-notfound",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : undefined,

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-error";
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
    // We have only one page here.
    ///////////////////////////////////////////////////////////////////////////

    instantiatePageView : function(settings,options) {        
        return new VPageNotfound(settings,options);
    }

});