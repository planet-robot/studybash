/*
    "Storage" jQuery plugin - Version 1.0 (Dec, 2013)

    This is a straightforward plug-in that aids in the storage and retrieval of data
    through the localStorage system of HTML5. There is typically a 5MB limit on this
    storage, so you have to be careful what you try to add to it and how sure you are
    that you'll succeed. Of course, if you want to see if something will fit (while
    you could just try to add it yourself and examine return value) you could simply
    JSON.stringify() the object(s) and get the length of the resultant string.

    source: http://diveintohtml5.info/storage.html

    Dependencies:
    -------------

    * http://jquery.com/ - duh
    * http://plasticthoughts.com/plugins/jquery.types/jquery.types.js - for gettype()

    Usage:
    ------

        <script src='http://plasticthoughts.com/plugins/jquery.storage/jquery.storage.js'></script>    

        $.storage.settings.BASE = "my.application.name";
        var successfullyAdded = $.storage.set("data",[0,1,2,3,4]);

    Examples:
    --------

        See the included sample project source files.

*/

(function($) {

    $.storage = (function(){

        //
        // Private Data
        //        

        // used to hand out unique IDs
        var id = 0;

        //
        // Public Data
        //

        // note: if you DO NOT put 'var' in front of everything here, then it is
        // declared in the GLOBAL SCOPE (that includes variables and functions)

        var settings = {
            BASE : "", // what are we adding in front of every key (change for each app)
        };

        //
        // Private Methods
        //

        ///////////////////////////////////////////////////////////////////////
        // Removes BASE from a given string (i.e., a key), if it's present.
        ///////////////////////////////////////////////////////////////////////

        var removeBASE = function storage__removeBASE(key) {

            if ( key && key.length && ( key.indexOf(settings.BASE) === 0 ) ) {
                return key.substr(settings.BASE.length);
            }
            else {
                return key;
            }
        }

        //
        // Public Methods
        //

        ///////////////////////////////////////////////////////////////////////
        // Looks to see if localStorage is supported.        
        ///////////////////////////////////////////////////////////////////////

        // source: http://diveintohtml5.info/storage.html

        var supported = function storage__supported() {

            try {
                var local_storage_support = ( 'localStorage' in window && window['localStorage'] !== null );
                if ( !local_storage_support ) {
                    throw new Error("local_storage_support: failed");
                }
                return true;
            }
            catch ( e ) {
                return false;
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Figures out the capacity of the local storage space. If you want
        // the TOTAL space, you will have to call `clear` first yourself.
        //
        //  @return - the number of kilobytes (1024 bytes) that it can store.
        ///////////////////////////////////////////////////////////////////////

        // source: http://glynrob.com/javascript/calculate-localstorage-space/

        //FIXME: THIS ALLOCATES 70+ MB ON FIREFOX. The main culprit is the
        // call to `set`. http://jsfiddle.net/w2yGU/show/

        var getCapacityInKb = function storage__getCapacityInKb() {

            // we create a random string to add to all of our keys, so we can
            // add and then remove them easily.

            function randString(length) {

                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                var text = "";

                for( var i=0; i < length; i++ ) {
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                }

                return text;
            }

            // create a base key for all of the values we'll be adding. keep on creating
            // them until we find one that doesn't appear in any of the key values currently
            // present.

            var keys = this.keys();
            var base = null;

            do {
                base = randString(40) + ".";
                var match = _.find(keys,function(k){
                    return ( k.indexOf(base) !== -1 );
                });
            }
            while ( match );

            // create a 1kb packet.
            var packet = new Array(1025).join("a");   

            // add it as many times as we can.

            var counter = 0;
            var success = null;

            do {
                success = this.set(base+counter,packet);
                counter++;
            }
            while ( success );

            // now go through all of the keys that we created and
            // remove them from the store.

            for ( var x = counter-1; x >= 0; x-- ) {
                this.remove(base+x);
            }

            packet = null;
            keys = null;
            base = null;

            return counter;
        }

        ///////////////////////////////////////////////////////////////////////
        // Return an array of all the keys in the localStorage
        ///////////////////////////////////////////////////////////////////////

        var keys = function storage__keys() {

            var store = window.localStorage;
            var keys = [];
            
            for ( var x=0; x < store.length; x++ ) {
                keys.push(removeBASE(store.key(x)));
            }

            return keys;
        }

        ///////////////////////////////////////////////////////////////////////
        // Clears out the storage.
        //
        //  @noFilter - boolean:
        //      By default we clear ONLY the keys that have our BASE as their beginning.
        //      In other words, this should leave anything not added by this plugin.
        //      Set this parm to `true` to clear everything.
        //
        ///////////////////////////////////////////////////////////////////////

        var clear = function storage__clear(noFilter) {

            if ( noFilter ) {
                window.localStorage.clear();
            }
            else {

                var keys = this.keys();

                for ( x=0; x < keys.length; x++ ) {
                    
                    var key = keys[x];
                    if ( key && key.length && ( key.indexOf(settings.BASE) === 0 ) ) {
                        this.remove(key);
                    }
                }
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Delete a key from storage.
        //
        //  @noFilter - don't add our settings.BASE onto the string
        //  @return - was it present?
        ///////////////////////////////////////////////////////////////////////

        var remove = function storage__remove(key,noFilter) {

            var store = window.localStorage;
            var result = store.removeItem((noFilter ? key : settings.BASE+key));
            return $.gettype(result).base !== "undefined";
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Has/get/set an item within the storage container.
        //
        // Note: Remember that the localStorage treats EVERYTHING as JSON (str).
        // So if you want to deal with other types, you need to stringify it
        // going in and parse it coming out. This is done automatically here.
        ///////////////////////////////////////////////////////////////////////

        var has = function storage__get(key) {

            var store = window.localStorage;
            return $.gettype(store[settings.BASE+key]).base !== "undefined";
        }

        var get = function storage__get(key) {

            var store = window.localStorage;
            if ( this.has(key) ) {
                return JSON.parse(store.getItem(settings.BASE+key));
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // @return - was the add successful?
        ///////////////////////////////////////////////////////////////////////

        var set = function storage__set(key,value) {

            var store = window.localStorage;
            var success = true;

            // note: JSON.stringify can go into endless recursion so
            // we have to eliminate any objects that have already appeared.
            // source: http://stackoverflow.com/questions/9382167/serializing-object-that-contains-cyclic-object-value
            // source: http://stackoverflow.com/questions/11616630/json-stringify-avoid-typeerror-converting-circular-structure-to-json

            var seen = [];            
            var excludeSeen = function(key,val) {
                
                if ( ( typeof val === "object" ) && ( val !== null ) ) {
                    
                    if ( seen.indexOf(val) !== -1 ) {
                        return "$.jquery.storage:[endless recursion]";
                    }
                    
                    seen.push(val);
                }

                return val;
            }

            try {
                store.setItem(settings.BASE+key,JSON.stringify(value,excludeSeen));
            }
            catch ( e ) {
                success = false;
            }
            
            seen = null; // enable gc
            return success;
        }

        ///////////////////////////////////////////////////////////////////////
        // Attaches a listener to the 'storage' event. This event fires whenever
        // anyone *changes* anything in the storage (i.e., clear on an empty
        // storage won't trigger it).
        //
        // PRACTICALLY USELESS.
        //
        // note: this is very poorly supported. firefox doesn't seem to support
        // it at all, and it only works on Chrome if *a different tab than yours
        // alters it*
        //
        // see: http://stackoverflow.com/questions/4671852/how-to-bind-to-localstorage-change-event-using-jquery-for-all-browsers/4689033#4689033
        //
        ///////////////////////////////////////////////////////////////////////

        var onStorageChange = function storage__onStorageChange(callback) {            

            $(window).on("storage",function(event){
                callback(event);
            });
        }

        //
        // Public interface
        //

        return {

            // data
            settings : settings,

            // methods            
            supported : supported,
            onStorageChange : onStorageChange,
            getCapacityInKb : getCapacityInKb,
            keys : keys,
            clear : clear,
            remove : remove,
            has : has,
            get : get,
            set : set
        };

    })();

}(jQuery));