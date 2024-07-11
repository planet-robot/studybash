//---------------------------------------------------------------------------------------
// Singleton: Spinner
// Description: A simple class that represents a colorbox with a message and a 
//              spinner .gif inside (i.e., for loading/saving messages). Control of
//              the page is removed from the user during this time.
//
// Note: Expects the loading.gif file from colorbox to be in the following directory:
//  settings.ROOT + _lib/colorbox/css/images/loading.gif
//---------------------------------------------------------------------------------------

var Spinner = (function(){

    //
    // Private Members
    //

    var settings = {
        ROOT : "",
        title : ""
    };
    
    // the instantiated Spinner class
    var instance = null;    

    //
    // Private Methods
    //    

    function Spinner() {

        if ( !( this instanceof Spinner ) ) {
            throw new Error("Must be called with 'new'");
        }

        this.showing = false;

        //
        // Public Methods
        //

        ///////////////////////////////////////////////////////////////////////
        // Show the spinner with a given message.
        // @options - object containing .msg (multi-line okay) and .opacity
        ///////////////////////////////////////////////////////////////////////

        this.show = function Spinner__show(options) {

            var html_text = "\
            <div id='colorbox_spinner'>\
                <p class='msg'>"+options.msg+"</p>\
                <p class='gif'><img src='"+settings.ROOT+"_lib/colorbox/css/images/loading.gif'></p>\
            </div>";

            var cbox_options = {
                html : html_text,
                transition: "none",
                closeButton : false,
                overlayClose : false,                
                escKey : false,
                width : "300px" // this is total width, including borders and buttons
                //width : "260px"
                //height : "190px" -> don't need this if preloading images.
            };

            if ( typeof options.opacity !== "undefined" ) {
                cbox_options = _.extend(cbox_options,{opacity:options.opacity});
            }
            else {
                cbox_options.opacity = 0.5;
            }

            cbox_options = $.extend(cbox_options,{title:settings.title});

            $.colorbox(cbox_options);            
            this.showing = true;
        }

        ///////////////////////////////////////////////////////////////////////
        // Remove the colorbox dialog from the window.
        // @callback -  called when the dialog is *actually* gone, as it takes
        //              a short while to fadeout (optional).
        ///////////////////////////////////////////////////////////////////////

        this.hide = function Spinner__hide(callback) {            

            if ( this.showing ) {

                $(document).on("cbox_closed",function(){                
                    $(this).off("cbox_closed");
                    if ( callback ) {
                        callback();
                    }
                });

                $.colorbox.close();
                this.showing = false;
            }

            else if ( callback ) {
                callback();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Is the spinner currently being shown? Note that this will return
        // false if it's currently being hidden, but hasn't quite completed yet.
        ///////////////////////////////////////////////////////////////////////

        this.isShowing = function Spinner__isShowing() {
            return this.showing;
        }
    }

    //
    // Public interface
    //

    return {

        // data
        settings : settings,

        // methods
        get : function Spinner__get() {

            if ( instance === null ) {
                instance = new Spinner();
            }

            return instance;
        }
    }

})();