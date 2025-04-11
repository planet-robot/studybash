//---------------------------------------------------------------------------------------
// Application: Studybash
// Description: This is the main application object for Studybash. You could look at this
//              as the main controller for the site. Through this object, the site is
//              initialized, the router is created, and views are constructed based upon
//              what functions the router calls.
//---------------------------------------------------------------------------------------

var app = {};

///////////////////////////////////////////////////////////////////////////////
// The entry-point of the website. We will verify that the browser supports
// the site, pre-load some images, setup most of the plug-ins, load some 
// dependencies, grab settings from server, and start the router.
///////////////////////////////////////////////////////////////////////////////

app.init = function app__init(settings) {    

    var support = $.browser_support();

    if ( support.passed ) {

        // all of the images that are placed in the .imagePreload div element
        // must be pre-loaded before the site can begin. wait for that to occur.

        $("div.imagePreload").waitForImages(function(){            

            // (0) copy over any settings that we require from our param object

            this.JS_ROOT = settings.JS_ROOT;
            this.DOMAIN_ROOT = settings.DOMAIN_ROOT;

            // (1) setup everything that must be loaded regardless of whether or not
            // we have an LIU. this includes all of the plug-in settings.            

            $.includejs.settings.ROOT = app.JS_ROOT;
            $.includejs.settings.cache = false;            

            $.tracedError.settings.url = "ajax/manual.php/error";
            $.tracedError.settings.cleanup = function() {};
            $.tracedError.settings.html = function() {};

            Spinner.settings.ROOT = app.JS_ROOT;
            Spinner.settings.title = "Studybash";

            $.ajaxSetup({timeout:30000});

            this.view = null;
            this.section = null;            
            app.setupOnClickLink();

            // (2) fully process the settings that we received as our param object.
            // we will branch based upon whether or not we were given an LIU.

            
            if ( settings.user ) {
                this.store.set("user",settings.user);
                this.prepareForLIU();
            }
            else {
                this.prepareForNonLIU();
            }            

        }.bind(this));
    }

    else {        

        app.gotoSection("browserFail");

        // let the server know about this.

        $.tracedError.settings.url = "ajax/manual.php/error";
        $.tracedError.settings.cleanup = function() {};
        $.tracedError.settings.html = function() {};

        var msg = "Browser failed the support test. Return object from $.browser_support(): " + JSON.stringify(support);
        $.tracedError.createTracedError(msg);
    }
}

///////////////////////////////////////////////////////////////////////////////
// We are preparing the application for either an LIU (logged-in user) or
// a non-LIU.
///////////////////////////////////////////////////////////////////////////////

app.prepareForLIU = function app__prepareForLIU() {

    $.storage.settings.BASE = "studybash.storage.";
    this.retrieveUserSettings();
    this.setupPagedown();

    // load all of the templates for the entire site. when that is completed
    // we are `ready`

    $.includejs.include({
        
        tpl : ["studybash.user"],
        
        success : function app__prepareForLIU__success() {

            // load the application settings and general data that is used in
            // more than once place (i.e., easier to load it here).

            $.ajax({
                url : app.JS_ROOT+"ajax/manual.php/data-LIU",
                type : "GET",
                dataType : "json",
                contentType : "application/json",
                context : this,
                beforeSend : function(jqxhr,options) {
                    jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                }
            })
            .done(function(data,textStatus,jqXHR) {

                // setup some store values that were sent back.
                this.store.set("system_message_interval",data.store.system_message_interval);
                this.store.set("sharing.types",data.store.sharingTypes);
                this.store.set("card.tags",data.store.cardTags);
                this.store.set("institutions",data.store.institutions);
                this.store.set("semesters",data.store.semesters);
                this.store.set("classes.years.before",data.store.classes_yearsBefore);
                this.store.set("classes.years.after",data.store.classes_yearsAfter);

                // ready to start
                this.ready();
            })
            .fail(function(jqXHR,textStatus,errorThrown) {                        
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });                    

        }.bind(this),
        
        error : function app__prepareForLIU__error(options,jqXHR,textStatus,errorThrown) {
            jqXHR = _.extend({},jqXHR,{includeJSOptions:options});
            this.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
        }.bind(this)
    });
}

app.prepareForNonLIU = function app__prepareForNonLIU() {
    
    // load only the templates that we require for the non-LIU.

    $.includejs.include({
        
        tpl : ["studybash.welcome"],
        
        success : function app__prepareForNonLIU__success() {

            // we are ready to start.
            this.ready();          

        }.bind(this),
        
        error : function app__prepareForNonLIU__error(options,jqXHR,textStatus,errorThrown) {

            jqXHR = _.extend({},jqXHR,{includeJSOptions:options});
            this.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            
        }.bind(this)
    });

}

///////////////////////////////////////////////////////////////////////////////
// The application is ready to go.
///////////////////////////////////////////////////////////////////////////////

app.ready = function app_ready() {

    // start the site. this takes our current URL and activates
    // the appropriate section.

    this.router = new AppRouter();
    Backbone.history.start();
}

///////////////////////////////////////////////////////////////////////////////
// Sets up the markdown converter used for the text fields of question/answer
// on a card. This enables users to create fancy HTML stuff and links, while
// ensuring that what they enter is safe. We use the sanitized version of 
// Google's pagedown: https://code.google.com/p/pagedown/
///////////////////////////////////////////////////////////////////////////////

app.setupPagedown = function app__setupPageDown() {

    function sanitizeHtml(html) {

        // .img-thumbnail is from twitter bootstrap.
        // .navigate means that the link actually goes somewhere (i.e., not just an <a> in a menu for ex.)
        function sanitizeTag(tag) {

            if ( tag.match(/^<img.*>$/i) ) {
                return tag.slice(0,tag.length-1) + " class=\"img-thumbnail\">";
            }
            else if ( tag.match(/^<a.*>$/i) ) {
                return tag.slice(0,tag.length-1) + " class=\"navigate\">";
            }
            else {
                return tag;
            }
        }

        return html.replace(/<[^>]*>?/gi, sanitizeTag);
    }
    
    //this.markdownConverter = new Markdown.Converter();
    this.markdownSanitizerConverter = Markdown.getSanitizingConverter();

    // we want to ensure that all of the images that are added through these
    // types of input have their properties pre-determined (i.e.,. max width/height).
    // see: http://stackoverflow.com/questions/21190381/pagedown-adding-a-css-class-to-every-img-tag-with-javascript/21191523
    this.markdownSanitizerConverter.hooks.chain("postConversion",sanitizeHtml);
}

///////////////////////////////////////////////////////////////////////////////
// As this is an SPA, we manage all links that are clicked. If the link is
// within our site, then we will send it to the router. Otherwise, we open
// a new tab for the external link.
//
//  NOTE:   If `router.navigate` gets called before the event bubbles up here
//          then the event is stopped in its tracks. So if the click is
//          captured anywhere else and the router is activated, it won't
//          get here.
//
///////////////////////////////////////////////////////////////////////////////

app.setupOnClickLink = function app__setupOnClickLink(event) {

    // notice that we aren't concerned with anything that doesn't have 'navigate'
    // on it. this allows us, for example, to ignore mailto: links.
    
    $("#content").on("click","a.navigate",function(event){

        var link = $(event.currentTarget);
        var url = link.prop("href");
        var explicit = link.hasClass("newtab");
        var pos = url.indexOf(app.DOMAIN_ROOT);

        if ( url === "#" ) {
            $.tracedError.createTracedError("event: "+JSON.stringify({event:event}));
        }

        if ( ( pos >= 0 ) && ( !explicit ) ) {

            // grab everything *after* our root, and also skipping
            // over the "#" character.

            url = url.slice(pos+app.DOMAIN_ROOT.length+1);
            this.router.navigate(url,{trigger:true});
        }

        // external URL

        else {
            window.open(url);
        }

        event.preventDefault();

    }.bind(this));
}

///////////////////////////////////////////////////////////////////////////////
// This is responsible for containing all data that is used outside of the app 
// class and needs to persist or be shared (or both).
///////////////////////////////////////////////////////////////////////////////

app.store = (function app__store(){

    var data = {};

    var has = function app__store__has(key) {
        
        // We use .hasOwnProperty rather than `x in y` so that we do not go
        // down the entire prototype chain.
        return data.hasOwnProperty(key);
    }

    var get = function app__store__get(key) {
        
        // Will return undefined (as in `typeof x === undefined` is true) if the
        // key does not exist.
        return data[key];
    }

    var set = function app__store__set(key,value) {
        data[key] = value;
    }

    var merge = function app__store__merge(key,value) {
        
        var old = this.get(key) || {};
        this.set(key,_.extend(old,value));        
    }

    var rem = function app__store__rem(key,matchAll) {

        // delete all of the keys that have `key` as a substring?

        if ( matchAll ) {

            var toDelete = [];

            for ( k in data ) {
                var idx = k.toString().indexOf(key.toString());
                if ( idx !== -1 ) {
                    toDelete.push(k);
                }
            }

            for ( var x=0; x < toDelete.length; x++ ) {
                delete data[toDelete[x]];
            }
        }

        // delete only the key that was sent.
        
        else {
            
            if ( this.has(key) ) {
                delete data[key];
            }
        }
    }

    return {
        has : has,
        get : get,
        set : set,
        rem : rem
    };

})();

///////////////////////////////////////////////////////////////////////////////
// Take all of the per-user settings that have been saved in our app.store
// and copy them over into HTML5 localStorage. Many of these settings may be
// `undefined`. But that is no matter, as we will only apply settings from
// localStorage (in `retrieve...`) that are NOT `undefined`.
///////////////////////////////////////////////////////////////////////////////

app.saveUserSettings = function app__saveUserSettings() {

    var user = this.store.get("user");
    var storageKey = user.full_name + "(" + user.id + ").settings";
    userSettings = $.storage.get(storageKey) || {};

    userSettings["modules.show_completed"] = app.store.get("modules.show_completed");
    userSettings["sets.isAscending"] = app.store.get("sets.isAscending");
    userSettings["sets.sortCriteria"] = app.store.get("sets.sortCriteria");
    userSettings["cards.isAscending"] = app.store.get("cards.isAscending");
    userSettings["tests.hide_auto"] = app.store.get("tests.hide_auto");
    userSettings["tests.users.sortCriteria"] = app.store.get("tests.users.sortCriteria");
    userSettings["tests.users.isAscending"] = app.store.get("tests.users.isAscending");
    userSettings["tests.isAscending"] = app.store.get("tests.isAscending");

    $.storage.set(storageKey,userSettings);
    return userSettings;
}

///////////////////////////////////////////////////////////////////////////////
// Grab all of the user settings from our HTML5 localStorage. Note that
// `undefined` values are NOT copied over into `app.store`. Accordingly, we only
// copy over values that were actually present in `app.store` when they were
// originally saved.
///////////////////////////////////////////////////////////////////////////////

app.retrieveUserSettings = function app__retrieveUserSettings() {

    var user = this.store.get("user");
    var storageKey = user.full_name + "(" + user.id + ").settings";
    userSettings = $.storage.get(storageKey);
    this.store.rem("isFirstLogin");

    // if we have no settings, that means it's the first time using the site with this
    // machine. if that's the case, and the LIU is on their first login, we'll identify
    // them as a new user and create their settings (which will be all empty values).

    if ( !userSettings ) {        
        userSettings = {};
        if ( user.num_logins === 1 ) {
            this.store.set("isFirstLogin",true);
            userSettings = this.saveUserSettings();
        }
    }

    for ( var property in userSettings ) {
        if ( userSettings.hasOwnProperty(property) ) {
            var val = userSettings[property];
            if ( typeof val !== undefined ) {
                app.store.set(property,val);
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
// Given the jqXHR object, let's examine the response text sent back to see
// if it's in the format of our `userError` string. That format is:
// "userError:(TYPE)[MSG]". Type cannot be null (empty) but msg can be.
//
//  @return:
//      undefined:  no responseText to check
//      null:       had responseText but wasn't in `userError` format.
//      object:     was valid, has fields .type and .msg.
//
///////////////////////////////////////////////////////////////////////////////

app.getAjaxUserError = function app__getAjaxUserError(jqXHR) {
    
    var userError = undefined;
    if ( jqXHR && jqXHR.responseText ) {
        userError = jqXHR.responseText.match(/^userError:\((.+)\)\[(.*)\]$/);
        // if matched, the first element in array is full string.
        userError = ( userError && userError.length === 3 ) ? { type : userError[1], msg : userError[2] } : null;
    }

    return userError;
}

///////////////////////////////////////////////////////////////////////////////
// Dealing with AJAX failures will be a common occurrance in the application.
// Let's standardize how they are dealt with.
///////////////////////////////////////////////////////////////////////////////

app.dealWithAjaxFail = function app__dealWithAjaxFail(jqXHR,textStatus,errorThrown) {

    // (1) in timeout we have:
    // jqxhr.readystate = 0, status = 0, .statusText = timeout
    // textStatus = timeout
    // errorThrown = timeout
    //
    // (2) in couldn't parse JSON in jQuery (on client) we have:
    // jqxhr.readystate = 4, status = 200, responseText = "whatever wasn't JSON", statusText = OK
    // textStatus = parseerror
    // errorThrown = "SyntaxError: JSON.parse: unexpected ...""
    //
    // (3) in an exception/error caught by our server code:
    // jqxhr.readystate = 4, status = 400, responseText = "Timeout (high traffic volume)", statusText = Bad Request
    // textStatus = error
    // errorThrown = "Bad Request"
    //
    // (4) in PHP error not contained by the ajax code (e.g., would still display itself if we were viewing the PHP file itself)
    // jqxhr.readystate = 4, status = 200, responseText = "<b>Fatal Error</b>: Cannot access protected...", statusText = OK
    // textstatus = parseerror
    // errorThrown = SyntaxError: JSON.parse...
    //
    // (5) on aborting the jQuery AJAX call:
    // jqxhr.readystate = 0, status = 0, responseText = undefined, statusText = "abort"
    // textStatus = abort
    // errorThrown = abort
    
    // these wouldn't have been registered as an error on the server.
    if ( jqXHR.status !== 400 ) {
        $.tracedError.createTracedError("app.store.user: \n"+JSON.stringify(app.store.get("user"))+" \nfail parms: "+JSON.stringify({jqXHR:jqXHR,textStatus:textStatus,errorThrown:errorThrown}));
    }    

    // if we have a user error, we will capture some of them here. if we aren't capturing that particular one, we'll just give
    // a generic error, as we don't want code-based information going to the client.

    var msg = this.getAjaxUserError(jqXHR);
    var hadUserMsg = !!msg;
    if ( msg ) {

        switch ( msg.type ) {
        
            case "not_loggedin":
                
                bsDialog.create({
                    title : "Error!",
                    msg : "<p>You have been logged out. Please login again to continue working.</p>",
                    ok : function() {
                        this.cleanupSession();
                    }.bind(this)
                });
                break;

            case "session_token":

                bsDialog.create({
                    title : "Error!",
                    msg : "<p>Have you logged in elsewhere? If not, please re-login and change your password immediately.</p>",
                    ok : function() {
                        this.cleanupSession();
                    }.bind(this)
                });
                break;

            case "no_session":

                bsDialog.create({
                    title : "Error!",
                    msg : "<p>Please login first!</p>",
                    ok : function() {
                        this.cleanupSession();
                    }.bind(this)
                });
                break;

            default:

                msg = null;
                break;
        }
    }
    if ( !msg ) {
        
        // if the string sent back was from us (i.e., the status value is what we send) then display our
        // message. otherwise, a generic one.
        msg = ( ( jqXHR.status === 400 ) && ( hadUserMsg ) ) ? jqXHR.responseText : "Unexpected Server Response. Please try again!";

        ColorboxDialog.get("Studybash").open({
            msg : msg,
            callback : function(){}
        });
    }    
}

///////////////////////////////////////////////////////////////////////////////
// A user's session is ending (e.g., logging out). So we will cleanup whatever
// is required now that the session is over.
//
//  @keepURL - if true, we do not mess with the current URL.
///////////////////////////////////////////////////////////////////////////////

app.cleanupSession = function app__cleanupSession(keepURL) {

    // this indicates that no one is logged-in.
    this.store.rem("user");

    // and we don't want to poll for system messages anymore
    if ( this.systemMsgs ) {
        this.systemMsgs.shutdown();
        this.systemMsgs = null;
    }

    // if we are being asked to move back to the login page, and we have
    // a router instantiated, we'll use it. otherwise, do it manually,
    // which would be required if the user didn't get to point of `ready`
    // (i.e., a continuing session was interrupted upon loading the initial
    // data).

    if ( !keepURL ) {
        if ( this.router ) {
            this.router.navigate("login/",{trigger:true});
        }
        else {            
            window.location = app.JS_ROOT;
        }
    }
}

///////////////////////////////////////////////////////////////////////////
// We are checking if the user needs to be re-directed. We are told whether
// or not the user needs to be logged in to visit the page they're trying
// to visit. If their logged-in status doesn't match the expectations, then
// they are re-directed to either the login/ page or the dash/ page.
//
//  @return - did we perform a redirect?
///////////////////////////////////////////////////////////////////////////

app.doRedirect = function app__doRedirect(needToBeLoggedIn) {

    if ( needToBeLoggedIn ) {

        // not logged in. but they need to be, so ask them to do so.        
        if ( !this.store.has("user") ) {
            this.router.navigate("login/",{trigger:true});
            return true;
        }

        else {

            // the user is supposed to be logged in, and they are, so we will
            // check to see if we've already created our system-messages
            // controller. if not, we'll do so now and get it started.

            if ( !this.systemMsgs ) {

                this.systemMsgs = bsSystemMsgs;
                
                var s = this.systemMsgs.settings;
                s.title = "Studybash (System Messages)";
                s.url = app.JS_ROOT + "ajax/manual.php/system/msgs";
                s.user = app.store.get("user");
                s.interval = app.store.get("system_message_interval"); // in ms

                this.systemMsgs.begin();
            }
        }
    }

    else {

        // they're not supposed to be logged in to visit this section,
        // but they already are, so move them over to the main site.

        if ( this.store.has("user") ) {
            this.router.navigate("dash/",{trigger:true});
            return true;
        }
    }

    return false; // no re-direct performed
}

///////////////////////////////////////////////////////////////////////////
// Display a particular section of the site to the user. We do so by creating
// the appropriate view - based upon the section/params sent - and then
// rendering it (while also cleaning up the old view).
//
//  @section.   string representing the sectionName
//  @parms.     the parms of the URL
//  @options.   options that were manually set by the code in `router`
///////////////////////////////////////////////////////////////////////////

app.gotoSection = function app__gotoSection(section,parms,options) {
    
    // this is the element where we will be rendering our section into.
    var sectionElement = $("#content");

    // if we have a current view then remove it from the DOM.
    if ( this.view ) {
        this.view.remove();        
        this.view = null;
    }

    // depending on the section we are going to, we will create
    // a different type of view.

    switch ( section ) {

        case "login":

            this.view = new VSectionAccount(
                {pageName:"login"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "register":
            
            this.view = new VSectionAccount(
                {pageName:"register"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "verify":

            this.view = new VSectionAccount(
                {pageName:"verify"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "reset":
            
            this.view = new VSectionAccount(
                {pageName:"reset"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;
        
        case "dash":
            
            this.view = new VSectionDash(
                {pageName:"dash"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;
        
        case "classes":

            this.view = new VSectionClasses(
                {pageName:"classes"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "studying":

            this.view = new VSectionStudyingBrowse(
                parms,
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "takeTest":

            this.view = new VSectionStudyingTakeTest(
                _.extend({},parms,{pageName:"intro"}),
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "help":

            if ( !parms ) {
                parms = "general";
            }
            
            this.view = new VSectionHelp(
                {pageName:parms},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "logout":

            this.view = new VSectionLogout(
                {pageName:"logout"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "notFound":
            
            this.view = new VSectionNotfound(
                {pageName:"notfound"},
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                options
            );

            break;

        case "browserFail":            
            
            this.view = new VSectionBrowserfail(
                null,
                function(sectionView){
                    sectionElement.html(sectionView.render().$el);
                },
                null
            );

            break;

        default:
            break;
    }

    // note that we do NOT render anything here by default. all of the sections have
    // to execute the callback, which then renders them (i.e., when they are ready
    // to be rendered).
}