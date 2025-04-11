//---------------------------------------------------------------------------------------
// Object: Bootstrap.systemMsgs
// Description: Polls a given server every x seconds for new messages.
//              If any are found, a dialog is opened and they are all displayed within it.
//
// Usage:   (1) Set settings.url, settings.user, and settings.interval
//          (2) Call `begin` to initialize and start the timer
//          (3) Call `shutdown` when done
//
// Dependencies: bsDialog, $.timer
//---------------------------------------------------------------------------------------

var bsSystemMsgs = (function(){

    //
    // Private Members
    //

    var timer = null;
    var settings = {
        url : null,
        title : null,
        user : {},
        interval : 60000 // msg
    }

    //
    // Private Methods
    //

    ///////////////////////////////////////////////////////////////////////////
    // The timer has triggered. Let's poll the server for new messages.
    // If any messages are returned, they will be displayed from here.
    ///////////////////////////////////////////////////////////////////////////

    onTimer = function bsSystemMsgs__onTimer() {

        shutdown();

        $.ajax({
            url : settings.url,
            type : "POST",
            timeout : 10000,
            dataType : "json",                
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            data : JSON.stringify(settings.user),
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN",settings.user.token);
            }.bind(this)
        })
        .done(function(data,textStatus,jqXHR) {

            // if we received any messages then we will update
            // the user record with the highest ID (given separately)
            // and then display the messages

            if ( data.msgs.length ) {
                settings.user.last_system_msg_read = data.id;
                display(data.msgs);
            }

            // either way, restart their timer.            
            begin();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {

            // any errors are just logged to the console.
            var msg = jqXHR.status === 200 ? errorThrown : jqXHR.responseText;
            console.error(msg);
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    // Simple function to return our html template.    
    ///////////////////////////////////////////////////////////////////////////

    //fixme: this should not be in here, it should be in a .tpl file.
    template = function bsSystemMsgs__template(obj) {
        var html_text = "\
        <li class='list-group-item bs-mine-msg'>\
            <p><span>Message ID:</span> " + obj.id + "</p>\
            <p><span>Timestamp:</span> " + obj.created_on + "</p>\
            <p><span>Message:</span> " + obj.message + "</p>\
        </li>\
        ";
        return html_text;
    }

    ///////////////////////////////////////////////////////////////////////////
    // We have an array of text messages to show to the user. Do so here by
    // opening a bsDialog.
    ///////////////////////////////////////////////////////////////////////////

    display = function bsSystemMsgs__display(msgs) {

        /*

        var html_text = "<ul class='list-group bs-mine-msgs'>";            
        _.each(msgs,function(elem){
            html_text += this.template(elem);
        },this);
        html_text += "</ul>";

        bsDialog.create({
            title : settings.title,
            msg : html_text,
            ok : function() {
                begin();
            }
        });

        */

        // fixme: Bootstrap's documentation says don't have more than one at a time.
        // but it seems to work?!?
        // source: http://getbootstrap.com/javascript/#modals

        var msg = settings.title + ":\n\n";
        _.each(msgs,function(elem){
            msg += ( "ID : " + elem.id + "\nTimestamp: " + elem.created_on + "\nMessage: " + elem.message + "\n----------\n" );
        },this);
        
        alert(msg);
    }

    //
    // Public Methods
    //

    ///////////////////////////////////////////////////////////////////////
    // Start the timer. Every x seconds we'll look for new messages.
    ///////////////////////////////////////////////////////////////////////

    begin = function bsSystemMsgs__begin() {

        if ( !timer ) {
            timer = $.timer(function(){
                onTimer();
            });
            timer.set({time:settings.interval,autostart:true});
        }
        else {
            shutdown();
            timer.play();
        }
    }

    ///////////////////////////////////////////////////////////////////////
    // Stop the timer.
    ///////////////////////////////////////////////////////////////////////

    shutdown = function BootstrapMsgs__shutdown() {
        timer.stop();
    }    

    //
    // Public interface
    //

    return {

        // data
        settings : settings,

        // methods
        begin : begin,
        shutdown : shutdown
    }

})();