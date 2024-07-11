//---------------------------------------------------------------------------------------
// Object: Bootstrap.Dialog
// Description: Provides an easy way to create/close modal dialogs, through Twitter BS.
//              Message is displayed with an OK button callback. The caller may also provide
//              a callback for a Cancel button (if not, no cancel button is shown).
//
//              Do NOT use this for the displaying of forms. The layout on mobile phones
//              (as of Dec 2013) goes freakin' crazy with stuff like select2 inside a
//              bs dialog. So keep it to a straightforward text message.
//
// Dependencies: Bootstrap, jquery.types
//---------------------------------------------------------------------------------------

var bsDialog = (function(){

    //
    // Private Members
    //

    // used to give out unique IDs
    var uniqueID = 0;

    // all of the IDs of open dialogs
    var openDialogs = [];

    //
    // Private Methods
    //

    ///////////////////////////////////////////////////////////////////////////
    // Give out a unique ID
    ///////////////////////////////////////////////////////////////////////////

    getUniqueID = function bsDialog__getUniqueID() {
        return uniqueID++;
    }

    //
    // Public Methods
    //

    ///////////////////////////////////////////////////////////////////////
    // Create a new dialog, with the message and buttons that we've been sent.
    //
    //  @options - Objec containing the following fields:
    //              .title : the title for the dialog
    //              .msg : the message to output within the dialog
    //              .ok : callback for OK (required)
    //              .cancel : callback for cancel (undefined=cancel removed)
    //
    //  @return - the html ID of the dialog
    ///////////////////////////////////////////////////////////////////////

    create = function bsDialog__create(options) {
        
        if ( $.gettype(options.ok).base !== "function" ) {
            throw new Error("`options.ok` was not a callback");
        }

        var htmlID = "bsDialog-"+getUniqueID();

        // setup the buttons.

        var cancel = $.gettype(options.cancel).base === "function";        
        
        var button_html_text = null;
        button_html_text = "<button type='button' class='btn btn-success btn-ok'>OK</button>";

        if ( cancel ) {
            button_html_text += "\n<button type='button' class='btn btn-danger btn-cancel'>Cancel</button>";
        }

        // setup the dialog html

        var html_text = "\
        <div class='modal fade' id='"+htmlID+"' tabindex='-1' role='dialog' aria-labelledby='myModalLabel' aria-hidden='true'>\
            <div class='modal-dialog'>\
                <div class='modal-content'>\
                    <div class='modal-header'>\
                        <h4 class='modal-title'>"+options.title+"</h4>\
                    </div>\
                    <div class='modal-body'>\
                        "+options.msg+"\
                    </div>\
                    <div class='modal-footer'>\
        "+button_html_text+"\
                    </div>\
                </div>\
            </div>\
        </div>";

        // add the dialog to the DOM. it will be display:none by default (thx bs)
        // we setup our callbacks to OK/CANCEL and then show the modal.

        $("body").append(html_text);

        $("#"+htmlID+" button.btn-ok").on("click",function(){                
            this.close(htmlID,options.ok);
        }.bind(this));

        if ( cancel ) {
            $("#"+htmlID+" button.btn-cancel").on("click",function(){
                this.close(htmlID,options.cancel);
            }.bind(this));
        }

        // now turn it into a modal

        $("#"+htmlID).modal({
            backdrop : "static",
            keyboard : false
        });

        openDialogs.push(htmlID);
        return htmlID;
    }

    ///////////////////////////////////////////////////////////////////////
    // Close an existing dialog, and execute a callback when it's done being
    // closed.
    //
    //  @htmlID - the text portion of the html ID of the dialog (not inc. #)
    //  @callback - function to execute when the dialog has finished closing
    ///////////////////////////////////////////////////////////////////////

    close = function bsDialog__close(htmlID,callback) {

        if ( callback ) {
            if ( $.gettype(callback).base !== "function" ) {
                throw new Error("`callback` was not a function: "+callback);
            }
        }

        // make sure there is a dialog to workon.

        var idx = _.indexOf(openDialogs,htmlID,false);
        var jqo = $("#"+htmlID);

        if ( ( idx !== -1 ) && ( jqo.length ) ) {

            // when the dialog has been completely hidden, we will
            // execute our callback.

            jqo.on("hidden.bs.modal",function(){
                this.remove();
                if ( callback ) {
                    callback();
                }
            });

            // start closing the dialog
            jqo.modal("hide");

            // remove it from our list of opens
            openDialogs.splice(idx,1);
        }

    }

    //
    // Public interface
    //

    return {

        // data

        // methods
        create : create,
        close : close
    }

})();