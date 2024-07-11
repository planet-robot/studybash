/*
    "IncludeJS" jQuery plugin

    This is a straightforward plug-in that allows you to dynamically load templates (for
    underscore, defined as `<script type='text/template'>` blocks) and .js files. It is not
    like RequireJS where the loaded .js files are treated as modules. It is understood that
    what you load will be defined in the global namespace.

    Personally, I used it to avoid having to load all of my `Backbone.View` files at once
    on the main page. This way I can spread them out to where they are needed.

    Note that it does NOT load .css files, as that turned out to be a nasty mess to get
    working, so you will have to do that manually on the main page for all .js files that 
    require it.

    Dependencies:
    -------------

    * http://jquery.com/
    * http://underscorejs.org - for templates
    * http://eleventyone.github.io/jquery.gettype/ - for $.gettype()

    Methods/Usage:
    --------------

        $.includejs.options = {...}
        $.includejs.include({...});
        $.includejs.getTemplate("...");

    Examples:
    --------

        See the example provided on the github project page.

*/

(function($) {

    $.includejs = (function(){

        //
        // Private Data
        //        

        // any templates loaded are kept here. key=id(html), value=template.
        var templates = {};

        // tracks all of the .tpl.htm files that have been successfully loaded.
        // key = name, value = undefined.
        var tplFiles = {};

        // tracks all of the .js files that have been successfully loaded.
        // key = name, value = undefined.
        var jsFiles = {};

        // a dictionary of all the templates that are being loaded currently
        // key = name, value = array of request ids waiting for it.
        var loadingTPLFiles = {};

        // a dictionary of all the .js files that are being loaded currently.
        // key = name, value = array of ids(int) waiting for it.
        var loadingJSFiles = {};

        // a dictionary of `include` requests that are currently waiting for file(s) to
        // load - could be waiting on templates and/or .js files. key = id, value = req object
        var requestsPending = {};

        // used to hand out unique IDs
        var id = 0;

        //
        // Public Data
        //

        // the paths are used when AJAX calls are made. `cache` determines whether
        // or not we are allowed to use cached versions of the files that are
        // requested (again, via AJAX).

        var settings = {
            ROOT : "/",
            JS_PATH : "_inc/js/",
            TPL_PATH : "_inc/tpl/",
            cache : true
        };

        //
        // Private Methods
        //

        ///////////////////////////////////////////////////////////////////////
        // Gives out a unique ID, by using our private counter (which is increased
        // for the next call).
        ///////////////////////////////////////////////////////////////////////

        var makeUniqueID = function includejs__makeUniqueID() {
            return id++;
        }

        ///////////////////////////////////////////////////////////////////////
        // Grab/add an include request from our pending list.
        ///////////////////////////////////////////////////////////////////////

        var getIncRequest = function includejs__getIncRequest(id) {
            return requestsPending[id];
        }

        var addIncRequest = function includejs__addIncRequest(incRequest) {
            requestsPending[incRequest.id] = incRequest;
        }

        ///////////////////////////////////////////////////////////////////////
        // Abort all of the active AJAX requests for a particular incRequest.
        ///////////////////////////////////////////////////////////////////////

        var abortAllAJAX = function includejs__abortAllAJAX(incRequest) {

            // this is a private method. any errors discovered should be
            // exceptions, as they are not user-generated.

            if ( $.gettype(incRequest).base !== "object" ) {
                throw new Error("Invalid `incRequest`");
            }

            incRequest.isAborting = true;

            // if there are ajax requests to abort, then do so now then
            // empty out the array.

            _.each(incRequest.ajaxRequests,function(elem,idx){
                if ( $.gettype(elem).base === "object" ) {
                    elem.abort(); // this ends up calling this function again.
                    elem = null;
                }
            });

            incRequest.ajaxRequests.splice(0,incRequest.ajaxRequests.length);
            incRequest.ajaxRequests = null;
        }

        ///////////////////////////////////////////////////////////////////////
        // Grab a file, either script or template, via AJAX and then tell the
        // appropriate callback our result.
        //
        //  @options - object containing the following:
        //
        //          isScript - false for template data
        //          fileName
        //          id - the id for the object that requested this.
        //          success - callback
        //          error - callback
        //
        ///////////////////////////////////////////////////////////////////////

        var getViaAJAX = function includejs__getViaAJAX(options) {

            options = $.gettype(options).base === "object" ? options : {};
            options.isScript = !!options.isScript;
            options.fileName = options.fileName || "notset";
            options.id = $.gettype(options.id).base === "number" ? options.id : "notset";

            var incRequest = getIncRequest(options.id);

            // this method is only ever called from within the class, as it's private.
            // any errors that occur here should be dealt with via exception. user-generated
            // errors will be caught higher up in the calling hierarchy.

            if ( $.gettype(incRequest).base !== "object" ) {
                throw new Error("Invalid `incRequest`");
            }

            // if the callbacks aren't setup properly, notifications won't be passed around
            // which defeats the whole purpose.
            
            if ( $.gettype(options.success).base !== "function" ) {
                throw new Error("Invalid `success` callback");
            }

            if ( $.gettype(options.error).base !== "function" ) {
                throw new Error("Invalid `error` callback");
            }

            // request the file.
            var path = options.isScript ? settings.JS_PATH : settings.TPL_PATH;
            var ext = options.isScript ? ".js" : ".tpl.htm";
            var dtype = options.isScript ? "script" : "html";            

            var jqXHR = $.ajax({
                url : settings.ROOT + path + options.fileName + ext,
                type : "GET",
                timeout : 10000,
                dataType : dtype,
                context : this
            })
            .done(function(data,textStatus,jqXHR) {

                if ( !incRequest.isAborting ) {                
                    options.success(options,data);
                }
            })
            .fail(function(jqXHR,textStatus,errorThrown) {

                // no notifications of error are sent when aborting.
                if ( !incRequest.isAborting ) {
                    options.error(options,jqXHR);
                }
            })
            .always(function(a,textStatus,c){                

                // if we're not aborting then try to remove
                // the jqXHR object from our tracking list.
                
                if ( !incRequest.isAborting ) {
                    var jqXHR = null;
                    jqXHR = ( textStatus === "success" ) ? c : a;
                    incRequest.ajaxRequests = _.without(incRequest.ajaxRequests,jqXHR);
                }
            });

            // add this request to our main list.
            incRequest.ajaxRequests.push(jqXHR);
        }

        ///////////////////////////////////////////////////////////////////////
        // A file of templates has been retrieved through AJAX. Let's parse what
        // we have and then see if the requestor is waiting for anything else.
        //
        //  @options - the options sent to `getViaAJAX`
        //  @templateData - contents of the .tpl.htm file
        //
        ///////////////////////////////////////////////////////////////////////

        var receivedTemplate = function includejs__receivedTemplate(options,templateData) {

            // We have the contents of an html file full of script-based
            // template blocks (i.e., <script type="text/template">), let's
            // parse all of the individual templates that are in it. Those
            // templates are stored as member data, within a dictionary.

            // key = id of template, value = template.

            var templateDict = {};
            var data = $(templateData).filter("script[type='text/template']");
            data.each(function(idx,elem){
                templateDict[$(elem).attr("id")] = $(elem).html();
            });

            // add the templates that we loaded in to our main dictionary.
            _.extend(templates,templateDict);

            // grab an array of all the `incRequest` instances that are
            // waiting for this template. then go through them all
            // and see if this was the last one they were waiting
            // for (if so, we can trigger `success` for them).

            waitList = loadingTPLFiles[options.fileName];
            _.each(waitList,function(elem,idx){
                
                // we have their id(int). let's get the actual request and
                // remove this template file from their list.

                var incRequest = requestsPending[elem];
                incRequest.pendingTemplates = _.without(incRequest.pendingTemplates,options.fileName);
                
                // check to see if it's been fulfilled.
                checkRequestFulfilled(incRequest);
            });

            // this tpl file is no longer being loaded.
            
            loadingTPLFiles[options.fileName] = null;
            delete loadingTPLFiles[options.fileName];
            tplFiles[options.fileName] = true;
        }        

        ///////////////////////////////////////////////////////////////////////
        // A .js file has been loaded through AJAX. Let's see if the requestor 
        // is waiting for anything else.
        //
        //  @options - the options sent to `getViaAJAX`
        //  @scriptData - the contents of the .js file (ignored)
        //
        ///////////////////////////////////////////////////////////////////////

        var receivedScript = function includejs__receivedScript(options,scriptData) {

            // grab an array of all the `incRequest` instances that are
            // waiting for this js file. then go through them all
            // and see if this was the last one they were waiting
            // for (if so, we can trigger `success` for them).

            waitList = loadingJSFiles[options.fileName];
            _.each(waitList,function(elem,idx){
                
                // we have their id(int). let's get the actual request and
                // remove this js file from their list.
                
                var incRequest = requestsPending[elem];
                incRequest.pendingJS = _.without(incRequest.pendingJS,options.fileName);

                // check to see if it's been fulfilled.
                checkRequestFulfilled(incRequest);
            });

            // this js file is no longer being loaded.
            
            loadingJSFiles[options.fileName] = null;
            delete loadingJSFiles[options.fileName];
            jsFiles[options.fileName] = true;
        }

        ///////////////////////////////////////////////////////////////////////
        // A file has failed to be loaded via AJAX. SHUT DOWN EVERYTHING!
        ///////////////////////////////////////////////////////////////////////

        var loadFailed = function includejs__loadFailed(options,jqXHR,textStatus,errorThrown) {

            var incRequest = getIncRequest(options.id);
            incRequest.ajaxRequests = _.without(incRequest.ajaxRequests,jqXHR);

            if ( !incRequest.isAborting ) {
                abortAllAJAX(incRequest);
                incRequest.error(options,jqXHR,textStatus,errorThrown);
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Checking to see if this request has been fulfilled. If so, call
        // success callback.
        ///////////////////////////////////////////////////////////////////////

        var checkRequestFulfilled = function includejs__checkRequestFulfilled(incRequest) {

            // if there are no more scripts/templates needed for this
            // request, then it's done.
                
            if (
                    ( !incRequest.pendingTemplates || !incRequest.pendingTemplates.length ) &&
                    ( !incRequest.pendingJS || !incRequest.pendingJS.length )
                )
            {
                incRequest.success();
                requestsPending[incRequest.id] = null;                    
                delete requestsPending[incRequest.id];
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // We have sent a request to load template and/or .js files. Let's load
        // what isn't already here and then tell them the good news.
        ///////////////////////////////////////////////////////////////////////

        var addRequest = function includejs__addRequest(incRequest) {

            // assume everything has already been loaded

            var neededTPL = [];
            var neededJS = [];

            /*
                * Loading/waiting needed?
            */

            // look to see if we require any templates.
            if ( incRequest.tpl.length ) {
                
                neededTPL = _.filter(incRequest.tpl,function(elem){
                    return !tplFiles[elem];
                });
            }

            // look to see if we require any js files.
            if ( incRequest.js.length ) {
                
                neededJS = _.filter(incRequest.js,function(elem){
                    return !jsFiles[elem];
                });
            }

            // if everything has already been loaded, then just
            // send our success now.

            if ( ( !neededTPL.length ) && ( !neededJS.length ) ) {
                incRequest.success();
                return;
            }

            // otherwise we have to wait. execute the callback and
            // add to our request to the list. we'll update that request here.

            else {
                incRequest.waiting();
                addIncRequest(incRequest);
            }

            // go through both arrays of filenames. let's load them in or, if
            // they are already loading in, we'll just add our request to the list
            // that are waiting for them to load.

            var neededFiles = incRequestPending = incRequest.pendingTemplates = neededTPL;
            var loadingFiles = loadingTPLFiles;
            var isScript = false;
            var successCallback = receivedTemplate;

            do {

                if ( neededFiles.length ) {

                    // some of these files may already be loading. if they are
                    // we'll just add our name to the waiting list. if not, we have
                    // to load them ourselves here.

                    incRequestPending = neededFiles;

                    _.each(incRequestPending,function(elem,idx){

                        // already loading. add our id to waiting list.

                        if ( loadingFiles[elem] ) {
                            loadingFiles[elem].push(incRequest.id);
                        }

                        // we are the first to request it. let's load
                        // it in.

                        else {
                            
                            // create the dictionary entry.                        
                            loadingFiles[elem] = [incRequest.id];

                            // save the current cache setting before we
                            // set it to what we want.

                            var cache = !!$.ajaxSetup().cache;
                            $.ajaxSetup({cache:!!settings.cache});

                            getViaAJAX({
                                isScript : isScript,
                                fileName : elem,
                                id : incRequest.id,                        
                                success : successCallback,
                                error : loadFailed
                            });

                            // reset the cache setting, as we're done.
                            $.ajaxSetup({cache:cache});
                        }
                    });
                }

                // if we just did templates, now do the same for scripts. just
                // change some references to different vars.

                if ( neededFiles === neededTPL ) {
                    neededFiles = incRequestPendeing = incRequest.pendingJS = neededJS;
                    loadingFiles = loadingJSFiles;
                    isScript = true;
                    successCallback = receivedScript;
                }
                else {
                    neededFiles = null;
                }
            }
            while ( neededFiles );
        }

        //
        // Public Methods
        //

        ///////////////////////////////////////////////////////////////////////
        // The main workhorse. Loads templates and/or .js files. Send success
        // and error callback functions if you're interested.
        //
        // Note that the templates and .js files are loaded concurrently, so if
        // you want to add a .js file that is going to execute immediately, and
        // requires a template to be available, then you'll have to make
        // separate calls.
        //
        //  @options -  an object containing the following members:
        //
        //      tpl (0+) - array of filenames
        //      js (0+) - array filenames
        //      waiting - callback
        //      success - callback
        //      error - callback
        //
        ///////////////////////////////////////////////////////////////////////

        var include = function includejs__include(options) {

            options = $.gettype(options).base === "object" ? options : {};
            options.tpl = $.gettype(options.tpl).base === "array" ? options.tpl : [];
            options.js = $.gettype(options.js).base === "array" ? options.js : [];
            options.waiting = $.gettype(options.waiting).base === "function" ? options.waiting : function(){};
            options.success = $.gettype(options.success).base === "function" ? options.success : function(){};
            options.error = $.gettype(options.error).base === "function" ? options.error : function(){};

            // create an object representing the request
            var incRequest = _.extend({},options,{
                id:makeUniqueID(),
                isAborting:false,
                ajaxRequests:[]
            });
            addRequest(incRequest);
        }

        ///////////////////////////////////////////////////////////////////////
        // Evaluate and return a template that has been loaded in.
        // The advantage of doing all this here is that we can add the ROOT
        // value to all of the template data objects, freeing the caller from
        // doing it everytime (if they need it).
        //
        //  @tplName - the id(html) that was assigned to the template
        //  @data - the data object to pass to the function returned by
        //          _.template().
        //
        ///////////////////////////////////////////////////////////////////////

        var getTemplate = function includejs__getTemplate(tplName,data) {

            if ( !templates[tplName] ) {
                console.error("`tplName` not found in $.includejs dictionary: "+tplName);
                return null;
            }

            data = $.gettype(data).base === "object" ? data : {};
            var year = new Date().getFullYear();
            _.extend(data,{
                ROOT:settings.ROOT,
                YEAR:year
            });
            year = null;
            
            return _.template(templates[tplName])(data);
        }

        //
        // Public interface
        //

        return {

            // data
            settings : settings,

            // methods
            include : include,
            getTemplate : getTemplate
        };

    })();

}(jQuery));