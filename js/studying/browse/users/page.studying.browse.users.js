//---------------------------------------------------------------------------------------
// View: VPageStudyingBrowseUsers
// Description: This view represents the page where the user is able to browse all of the
//              users that are enrolled in a given module. The page contains a
//              breadcrumb, toolbar, and list of records; each represented by a subview.
//              The formView portion of VBasePageBrowse is used only for filtering, as
//              there is no editing/adding of any kind performed.
//
//              Several events are captured here: onClickBreadcrumb, onClickToolbar, 
//              onClickRecord, and onFormSubmit/onFormCancel. These are triggered by their
//              respective subviews. When our data has been loaded, we trigger an 
//              "onPageReady" event, letting our parent know that we are ready to render.
//
//              The forms available here are "filter".
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseUsers = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-users",
    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-studying-browse-users";
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
        this.breadcrumb = null;
        return VBasePageBrowse.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageStudyingBrowseUsers__loadData() { /* overloaded */

        // we will be storing an array of users, as well as a breadcrumb
        this.listData = null;
        this.breadcrumb = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading users...",opacity:0});

        // ask the server for a list of all of the students enrolled
        // in our given class.

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/studying-other.php/users/"+this.settings.urlIDs.mID+"/"+this.settings.urlIDs.gID,
            type : "POST",            
            dataType : "json",
            data : JSON.stringify({
                includeAuto:!app.store.has("tests.hide_auto"),
                filter:{                    
                    keywords : app.store.get("card.filter.keywords"),
                    tags : app.store.get("card.filter.tags")
                }
            }),
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            this.listData = data.users;
            this.breadcrumb = data.breadcrumb;
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
            heading : "Students"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the breadcrumb, toolbar, and list views for this particular
    // page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() { /* overloaded */
        return new VWidgetStudyingBrowseUsersBreadcrumb({
            data : this.breadcrumb
        });
    },

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseUsersToolbar();
    },

    instantiateListView : function() { /* overloaded */
        var options = {};
        if ( app.store.has("flashcards.users.isAscending") ) {
            options.sbIsAscending = app.store.get("flashcards.users.isAscending");
        }
        if ( app.store.has("flashcards.users.sortCriteria") ) {
            options.sbSortCriteria = app.store.get("flashcards.users.sortCriteria");
        }
        return new VWidgetStudyingBrowseUsersList(
            {
                listData:this.listData
            },
            options
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // `VBasePageBrowse.displayForm` has been called. We must instantiate a
    // given formView, based upon the `formName` sent.
    //
    //  @settings. Required values. Created for `displayForm`.
    //  @options. Any flags that might be useful. Created for `displayForm`.
    //
    ///////////////////////////////////////////////////////////////////////////

    instantiateFormView : function(formName,settings,options) { /* overloaded */

        var formView = null;

        switch ( formName ) {

            case "filter" :
                formView = new VWidgetStudyingBrowseUsersFormFilter(settings,options);
                break;
        }

        return formView;
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, when this view is shown, there may be some toolbar buttons
    // that are immediately available.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() {

        // we will set the text of the sort order button. always assume ascending by default.
        this.toolbarView.getButton("display_sort_order").html(app.store.has("flashcards.users.isAscending") ? ( app.store.get("flashcards.users.isAscending") ? "Sort Descending" : "Sort Ascending" ) : "Sort Descending" );

        // we will set the text of the sort criteria button. always assume name by default.
        this.toolbarView.getButton("display_sort_criteria").html(app.store.has("flashcards.users.sortCriteria") ? ( app.store.get("flashcards.users.sortCriteria") === "name" ? "Sort By Num Cards" : "Sort By Name" ) : "Sort By Num Cards" );

        // enable/disable
        this.toolbarView.setEnabled({
            display:true,
            filter:true
        });

        // content in filter?

        var keywords = app.store.get("card.filter.keywords");
        var tags = app.store.get("card.filter.tags");

        if ( keywords || tags ) {
            this.toolbarView.getButton("filter").removeClass("btn-default").addClass("btn-info");
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // A form has been opened on the page. So we will temporarily disable all
    // of the buttons on the toolbar that allow another form to be opened, as
    // there is only one allowed to be shown at a time.
    ///////////////////////////////////////////////////////////////////////////

    disableToolbarFormButtons : function() { /* overloaded */

        this.savedToolbarButtonState = this.toolbarView.getEnabled();
        this.toolbarView.setEnabled({
            display:true,
            filter:false
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The form that was displaying is now gone. Reset our toolbar buttons
    // to how they were before it was opened.
    ///////////////////////////////////////////////////////////////////////////

    reEnableToolbarFormButtons : function() { /* overloaded */
        this.toolbarView.setEnabled(this.savedToolbarButtonState);
        this.savedToolbarButtonState = null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked one of the crumbs in our breadcrumb. All of the
    // information we require can be found in the `crumb` object passed to us.
    // In particular, we want the `urlIDs` inside it, as they will tell us what
    // position in the browsing hierarchy we should go to after clicking this
    // crumb.
    //
    //  @crumb: the data object from the VBaseBreadcrumbCrumb view. contains
    //          `.urlIDs`.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickBreadcrumb : function(crumb) {
        this.trigger("setPage",{
            urlIDs : crumb.urlIDs
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, as well as the event that started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,event) {

        // DISPLAY

        if ( buttonName.indexOf("display") !== -1 ) {

            // SORT CRITERIA

            if ( buttonName === "display_sort_criteria" ) {
                var sortCriteria = this.listView.collection.sortCriteria;
                sortCriteria = ( sortCriteria === "name" ? "cards" : "name" );
                app.store.set("flashcards.users.sortCriteria",sortCriteria);
                this.refresh();
            }

            // SORT ORDER

            else if ( buttonName === "display_sort_order" ) {
                var isAscending = this.listView.collection.isAscending;
                app.store.set("flashcards.users.isAscending",!isAscending);
                this.refresh();
            }
        }

        // FILTER SET

        else if ( buttonName === "filter_set" ) {
            this.displayForm("filter");
        }

        // FILTER CLEAR

        else if ( buttonName === "filter_clear" ) {
            var hadFilter = app.store.has("card.filter.tags") || app.store.has("card.filter.keywords");
            app.store.rem("card.filter",true);
            if ( hadFilter ) {
                this.refresh();
            }
        }

    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the users in our list. We are going
    // to trigger a page change, sending along the urlIDs that represent our
    // new position in the browsing hierarchy.
    //
    //  @modelAttributes:   Cloned attributes hash for the model whose view
    //                      was clicked on by the user in the listView.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickRecord : function(modelAttributes) {
        this.trigger("setPage",{
            urlIDs : _.extend({},this.settings.urlIDs,{
                uID:modelAttributes.id
            }),
            containerAttributes:modelAttributes
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The formView that was opened has successfully "saved" whatever the user
    // entered. Depending on the formView that was instantiated, highlighted
    // by the `formName` param, our actions will differ.
    //
    //  @formName:  The `formName` property of the VBaseWidgetForm-derived view
    //              that was submitted.
    //
    //  @formData:  The data serialized from the form. The structure of this
    //              may change significantly depending on the type of formView
    //              we're working with.
    //
    //  @options:   Any flags that were set along our chain of function calls
    //              that got us here. They will relate directly to the action
    //              of "saving". They may include our own options ("sb...") and
    //              backbone-related options.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) { /* overloaded */

        switch ( formName ) {
            
            // setting a new filter.
            case "filter":                

                // clear existing filter and create new one, if we
                // have any values from the form to do so.

                var hadFilter = app.store.has("card.filter.tags") || app.store.has("card.filter.keywords");
                app.store.rem("card.filter",true);

                if ( formData.keywords.length || formData.tags.length ) {

                    // set the filter information in our store and refresh
                    // the page. the filter information will be checked by
                    // the `setDefaultToolbarEnabled` method and the
                    // filter button will be highlighted.
                    
                    app.store.set("card.filter.keywords",formData.keywords);
                    app.store.set("card.filter.tags",formData.tags);
                    this.refresh();
                }

                // nothing is on the filter.                
                else {

                    // clearing what we had before.
                    if ( hadFilter ) {
                        this.onClickToolbar("filter_clear",null);                        
                    }
                    // nothing to do.
                    else {
                        this.closeForm();
                    }
                }
                
                break;
        }
    }    

});