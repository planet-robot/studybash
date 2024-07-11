//---------------------------------------------------------------------------------------
// View:        VPageStudyingBrowseModules
// Description: This view represents the page where the user is able to browse all of the
//              modules that they are currently enrolled in. The page contains a
//              toolbar, and list of records; each represented by a subview.
//
//              Several events are captured here: onClickToolbar, and
//              onClickRecord. These are triggered by their respective subviews. When
//              our data has been loaded, we trigger an "onPageReady" event, letting
//              our parent know that we are ready to render.
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseModules = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-modules",
    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-studying-browse-modules";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePageBrowse.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Empty all our references
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.listData = null;
        return VBasePageBrowse.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Update the help link in the footer.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePageBrowse.prototype.render.call(this);

        var href = this.$("div.sb-footer div.help a").prop("href");
        this.$("div.sb-footer div.help a").prop("href",href+"classes/");

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageStudyingBrowseModules__loadData() { /* overloaded */

        // we will be storing an array of enrollment records
        this.listData = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading classes...",opacity:0});
        
        // ask the server for a list of all of the enrollments for the
        // logged in user.

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/studying-other.php/enrollment",
            type : "POST",
            dataType : "json",
            data : JSON.stringify({
                includeCompleted:app.store.has("modules.show_completed")
            }),
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            this.listData = data.enrollment;
            this.ready();            
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // When the `content` element is rendered, using the `content` template,
    // this function provides the attributes hash to be sent to that template.
    ///////////////////////////////////////////////////////////////////////////

    getContentAttributes : function() { /* overloaded */
        return {
            heading : "Pick a Class"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the toolbar, and list views for this particular
    // page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseModulesToolbar();
    },

    instantiateListView : function() { /* overloaded */
        return new VWidgetStudyingBrowseModulesList({
            listData : this.listData
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, when this view is shown, there may be some toolbar buttons
    // that are immediately available.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() {
        this.toolbarView.setEnabled({display:true});

        // set the text of "show/hide completed"

        var showCompleted = app.store.has("modules.show_completed");
        this.toolbarView.getButton("display_completed").html(showCompleted?"Hide Completed":"Show Completed");
    },

    /*
        Trigger events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, as well as the event that started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,button,event) {

        // DISPLAY

        if ( buttonName.indexOf("display") !== -1 ) {

            // SHOW COMPLETED (toggle)

            if ( buttonName === "display_completed" ) {

                var isShowing = app.store.has("modules.show_completed");
                if ( isShowing ) {
                    app.store.rem("modules.show_completed");
                }
                else {
                    app.store.set("modules.show_completed",true);
                }
                app.saveUserSettings();
                this.refresh();
            }
        }

    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the modules in our list. We are going
    // to trigger a page change, sending along the urlIDs that represent our
    // new position in the browsing hierarchy.
    ///////////////////////////////////////////////////////////////////////////

    onClickRecord : function(modelAttributes) {
        this.trigger("setPage",{
            urlIDs : _.extend({},this.settings.urlIDs,{
                mID:modelAttributes.module_id
            }),
            containerAttributes : modelAttributes
        });
    }    

});