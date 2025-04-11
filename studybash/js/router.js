//---------------------------------------------------------------------------------------
// Router: AppRouter
// Description: The one and only router for the website. If a URL is typed into the address
//              bar, this object is notified. If we want to manually change a URL in the
//              address bar, we use `app.router.navigate` and the call comes here.
//---------------------------------------------------------------------------------------

var AppRouter = Backbone.Router.extend({

    // all of the URLs that we are interested in matching. for each, we tell the
    // site what function to call. format is: "direct_match", "page/:optional_parm", 
    // "page/*everything".

    routes : {
        
        "" : "default",
        
        "login/(*parms)" : "login",        
        "register/(*parms)" : "register",
        
        "verify/(*parms)" : "verify",
        "setpwd/(*parms)" : "setpwd",

        "reset/(*parms)" : "reset",
        "sendcode/(*parms)" : "sendcode",
        
        "dash/(*parms)" : "dash",
        
        "classes/(*parms)" : "classes",

        "studying/" : "studying",
        "studying/browse/" : "studying",
        "studying/browse/m:moduleID/" : "studying",
        "studying/browse/m:moduleID/g:groupID/" : "studying",
        "studying/browse/m:moduleID/g:groupID/u:userID/" : "studying",
        "studying/browse/m:moduleID/g:groupID/u:userID/:type/" : "studying",
        "studying/browse/m:moduleID/g:groupID/u:userID/:type/s:setID/" : "studying",

        "studying/taketest/auto/:autoSetID/" : "takeTestAuto",
        "studying/taketest/manual/" : "takeTestManual",
        "studying/taketest/:testID/" : "takeTest",

        "help/(:pageName/)" : "help",
        
        "logout/(*parms)" : "logout",
        
        "*parms" : "notFound" // catches whatever doesn't match above
    },

    ///////////////////////////////////////////////////////////////////////////
    // Constructor of the router.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(options) {

        this.listenTo(this,"all",function(){
            //console.log("MainRouter.event: "+arguments[0]);
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Functions representing a particular route within the site.
    ///////////////////////////////////////////////////////////////////////////

    default : function() {

        // we are sent to the default URL when re-directed by `session.php`
        // so if this is their first login, we'll send them to help. the only
        // other way they can get back in here is if they reload the page by
        // typing in the default URL for themselves, which would prevent
        // "isFirstLogin" from being set.
        
        if ( app.store.has("isFirstLogin") ) {
            app.router.navigate("help/",{trigger:true});
        }
        else {
            app.router.navigate("dash/",{trigger:true});
        }
    },

    login : function(parms) {

        // the `false` param represents the fact that we should NOT
        // be logged in when trying to go to this particular section.
        // this function call double checks that the user's logged-in
        // status matches what is sent. if so, it passes through to
        // out `gotoSection` call. if not, the user is redirected to
        // the appropriate section and another routing function will
        // be called.

        if ( !app.doRedirect(false) ) {
            app.gotoSection("login",null,{sbFromRouter:true});
        }
    },    

    register : function(parms) {
        if ( !app.doRedirect(false) ) {
            app.gotoSection("register",null,{sbFromRouter:true});
        }
    },

    verify : function(parms) {
        if ( !app.doRedirect(false) ) {
            app.gotoSection("verify",null,{sbFromRouter:true});
        }
    },

    setpwd : function(parms) {
        if ( !app.doRedirect(false) ) {
            app.gotoSection("verify",null,{sbFromRouter:true,sbSetPwd:true});
        }
    },

    reset : function(parms) {
        if ( !app.doRedirect(false) ) {
            app.gotoSection("reset",null,{sbFromRouter:true});
        }
    },

    sendcode : function(parms) {
        if ( !app.doRedirect(false) ) {
            app.gotoSection("reset",null,{sbFromRouter:true,sbSendCode:true});
        }
    },

    dash : function(parms) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("dash");
        }
    },

    classes : function(parms) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("classes");
        }
    },

    studying : function(moduleID,groupID,userID,typeID,setID) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("studying",{urlIDs:{mID:moduleID,gID:groupID,uID:userID,tID:typeID,sID:setID}});
        }
    },

    groups : function(moduleID) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("groups",{urlIDs:{mID:moduleID}});
        }
    },

    flashcards : function(moduleID,groupID,userID,setID) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("flashcards",{urlIDs:{mID:moduleID,gID:groupID,uID:userID,sID:setID}});
        }
    },

    testsBrowse : function(moduleID,groupID,userID) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("testsBrowse",{urlIDs:{mID:moduleID,gID:groupID,uID:userID}});
        }
    },    

    takeTestAuto : function(autoSetID) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("takeTest",{urlIDs:{aID:autoSetID}});
        }
    },

    takeTestManual : function() {
        if ( !app.doRedirect(true) ) {
            var manualData = app.store.get("tests.manual");
            app.store.rem("tests.manual");
            app.gotoSection("takeTest",{manualData:manualData});
        }
    },

    takeTest : function(testID) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("takeTest",{urlIDs:{tID:testID}});
        }
    },

    help : function(pageName) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("help",pageName);
        }
    },

    logout : function(parms) {
        if ( !app.doRedirect(true) ) {
            app.gotoSection("logout");
        }
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Invalid URL.
    ///////////////////////////////////////////////////////////////////////////

    notFound : function(parms) {
        app.gotoSection("notFound");
    }

});