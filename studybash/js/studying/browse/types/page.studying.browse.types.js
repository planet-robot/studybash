//---------------------------------------------------------------------------------------
// View:        VPageStudyingBrowseTypes
// Description: This simply lets the user pick between "cards" and "tests" for a particular
//              user. We show them the number of both that the user has.
//
//              Several events are captured here: onClickBreadcrumb, 
//              onFormSubmit/onFormCancel, onClickRecord. we trigger an "onPageReady" event,
//              letting our parent know that we are ready to render.
//
//              The forms available here are "filter".
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseTypes = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-types",
    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-flashcards-browse-types";
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

    loadData : function VPageStudyingBrowseTypes__loadData() { /* overloaded */

        // we will be storing an array of users, as well as a breadcrumb
        this.listData = null;
        this.breadcrumb = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading user...",opacity:0});

        // ask the server for a list of all of the students enrolled
        // in our given class.

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/studying-other.php/user/"+this.settings.urlIDs.mID+"/"+this.settings.urlIDs.gID+"/"+this.settings.urlIDs.uID,
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

            // we have to construct our own listData here, as we are
            // just receiving a single user's info.

            var tCards = {
                id : "cards",
                type_name : "Flashcards",
                count : data.user.num_filtered_cards
            };

            var tTests = {
                id : "tests",
                type_name : "Tests",
                count : data.user.num_tests
            };
            
            this.listData = [tCards,tTests];
            this.breadcrumb = data.breadcrumb;

            data = null;
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
            heading : "Content"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the breadcrumb, toolbar, and list views for this particular
    // page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() { /* overloaded */
        return new VWidgetStudyingBrowseTypesBreadcrumb({
            data : this.breadcrumb
        });
    },

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseTypesToolbar();
    },

    instantiateListView : function() { /* overloaded */
        return new VWidgetStudyingBrowseTypesList(
            {
                listData:this.listData
            },
            {}
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
                formView = new VWidgetStudyingBrowseTypesFormFilter(settings,options);
                break;
        }

        return formView;
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, when this view is shown, there may be some toolbar buttons
    // that are immediately available.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() {

        // enable/disable
        this.toolbarView.setEnabled({
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

    onClickToolbar : function(buttonName,button,event) {

        // FILTER

        if ( buttonName.indexOf("filter") !== -1 ) {
        
            // FILTER SET

            if ( buttonName === "filter_set" ) {
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
                tID:modelAttributes.id
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