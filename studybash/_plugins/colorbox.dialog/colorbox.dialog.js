//---------------------------------------------------------------------------------------
// Singleton: Colorbox.Dialog
// Description: A simple class that represents a modal dialog, through Colorbox.
//              A message is displayed and an OK button is presented. A callback is
//              optional for the OK button, but it is shown regardless.
//---------------------------------------------------------------------------------------

var ColorboxDialog = (function(){

    //
    // Private Members
    //

    var title = null;
    var instance = null;

    //
    // Private Methods
    //    

    function ColorboxDialog() {

        if ( !( this instanceof ColorboxDialog ) ) {
            throw new Error("Must be called with 'new'");
        }

        this.showing = false;

        //
        // Public Methods
        //

        ///////////////////////////////////////////////////////////////////////
        // Show the spinner with a given message.
        // @message - any string. Shouldn't matter if it's more than one line.
        ///////////////////////////////////////////////////////////////////////

        this.open = function ColorboxDialog__show(options) {

            var html_text = "\
            <div id='colorbox_dialog'>\
                <p class='msg'>"+options.msg+"</p>\
                <p class='button'><button type='button' class='btn btn-warning'>OK</button></p>\
            </div>";

            var cbox_settings = {
                html : html_text,
                transition: "none",
                closeButton : false,
                overlayClose : false,                
                escKey : false,
                width : "300px"
            };

            if ( this.title ) {                
                cbox_settings = $.extend(cbox_settings,{title:this.title});
            }

            $.colorbox(cbox_settings);

            $("#colorbox_dialog button").on("click",function(){
                this.close(options.callback);
            }.bind(this));

            this.showing = true;
        }

        ///////////////////////////////////////////////////////////////////////
        // Remove the colorbox dialog from the window.
        // @callback -  called when the dialog is *actually* gone, as it takes
        //              a short while to fadeout (optional).
        ///////////////////////////////////////////////////////////////////////

        this.close = function ColorboxDialog__hide(callback) {            

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
    }

    //
    // Public interface
    //

    return {

        get : function ColorboxDialog__get(title) {

            if ( instance === null ) {
                instance = new ColorboxDialog();
            }

            instance.title = title;

            return instance;
        }
    }

})();