//---------------------------------------------------------------------------------------
// View: VPageLogout
// Description: We simply log the user out and say goodbye.
//---------------------------------------------------------------------------------------

var VPageLogout = VBasePage.extend({

    /* overloaded */
    id : "page-logout",
    pageTemplateID : "tpl-page",
    contentTemplateID : "tpl-page-logout",
    footerTemplateID : "tpl-page-footer-welcome",
    contentElement : "div.page-content",
    footerElement : "div.page-footer",

    panelElement : "div.page-content > div.content > div.content-panel",

    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-logout";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally created for `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */
        
        this.profileView = new VWidgetLogoutPanel({
            templateAttrs:app.store.get("user")
        });
        this.timer = null;

        VBasePage.prototype.initialize.call(this,settings,options);        
    },

    ///////////////////////////////////////////////////////////////////////////
    // Log the user out. When we are finished, we will call `ready` which 
    // prepares us for rendering and eventually triggers the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageLogout__loadData() { /* overloaded */

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Logging out...",opacity:0});

        $.ajax({
            url : app.JS_ROOT+"ajax/account.php/logout",
            type : "POST",
            dataType : "json",
            contentType : "application/json",
            data : JSON.stringify(app.store.get("user")),
            processData : false,
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            }
        })
        .done(function(data,textStatus,jqXHR) {            

            Spinner.get().hide(function(){
                
                this.ready();

                // after ten seconds, we'll go back to the "login" page.
                this.timer = $.timer(function(){
                    this.timer.stop();
                    app.router.navigate("login/",{trigger:true});
                }.bind(this));
                this.timer.set({time:10000,autostart:true});

            }.bind(this));
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){            
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        })
        .always(function(a,textStatus,c){
            // keep the URL as is... we're changing it with our timer
            app.cleanupSession(true);
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        if ( this.timer ) {
            this.timer.stop();        
        }
        this.stopListening(this.profileView);
        this.timer = null;
        this.profileView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // breadcrumb, toolbar, and list views. Finally, we setup the default buttons
    // that are enabled in our toolbar.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);
        this.$(this.panelElement).html(this.profileView.render().$el);

        return this;
    }

});