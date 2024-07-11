//---------------------------------------------------------------------------------------
// View: VSectionClasses
// Description: The 'classes' section.
//---------------------------------------------------------------------------------------

var VSectionClasses = VBaseSection.extend({

    /* overloaded */
    id : "section-classes",
    sectionTemplateID : "tpl-section-user",
    headerTemplateID : "tpl-section-header-user",
    headerElement : "div.section-header",
    pageElement : "div.section-page",    
    menuClassNameActive : "classes",

    className : function() {
        return _.result(VBaseSection.prototype,'className') + " section-classes";
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
        return new VPageClasses(settings,options);
    }

});