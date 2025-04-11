//---------------------------------------------------------------------------------------
// View:        VPageStudyingBrowseGroups
// Description: This view represents the page where the user is able to browse all of the
//              study groups that they belong to for a particular enrollment of theirs.
//              This includes: personal content, the public studygroup, and all private
//              studygroups that they have joined.
//
//              This page contains breadcrumb, toolbar, form, and list views.
//
//              Several events are captured here: onClickBreadcrumb, onClickToolbar, 
//              onClickRecord, onFormSubmit/onFormCancel.
//
//              The forms available here are "code"
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseGroups = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-groups",

    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-studying-browse-groups";
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
    // Update the help link in the footer.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePageBrowse.prototype.render.call(this);

        var href = this.$("div.sb-footer div.help a").prop("href");
        this.$("div.sb-footer div.help a").prop("href",href+"studygroups/");

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageStudyingBrowseGroups__loadData() { /* overloaded */

        // we will be storing an array of groups as well as a breadcrumb
        this.listData = null;
        this.breadcrumb = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading groups...",opacity:0});

        // ask the server for a list of all of the private studygroups that
        // our user has joined.

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/groups-manual.php/fetch/"+this.settings.urlIDs.mID,
            type : "POST",            
            dataType : "json",
            data : JSON.stringify({
                code : app.store.has("groups.code") ? app.store.get("groups.code") : null
            }),
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            // construct the personal studygroup manually

            var gPersonalContent = {
                id:"self",
                num_members : 1,
                is_user_member : true,
                is_user_owner : true
            };
            
            this.listData = [gPersonalContent].concat(data.groups);
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
            heading : "Groups"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the breadcrumb, toolbar, and list views for this particular
    // page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() { /* overloaded */
        return new VWidgetStudyingBrowseGroupsBreadcrumb({
            data:this.breadcrumb
        });
    },

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseGroupsToolbar();
    },

    instantiateListView : function() { /* overloaded */
        return new VWidgetStudyingBrowseGroupsList(
            {
                listData:this.listData,
                urlIDs:this.settings.urlIDs
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

            case "code" :
                formView = new VWidgetStudyingBrowseGroupsFormCode(settings,options);
                break;
        }

        return formView;
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, when this view is shown, there may be some toolbar buttons
    // that are immediately available.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() {

        this.toolbarView.setEnabled({
            code:true,
            add:true
        });

        // code provided?

        var code = app.store.get("groups.code");

        if ( code ) {
            this.toolbarView.getButton("code").removeClass("btn-default").addClass("btn-info");
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
            code:false,
            add:false
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
    // The user has clicked on one of the groups in our list. We are going
    // to trigger a page change, sending along the urlIDs that represent our
    // new position in the browsing hierarchy.
    //
    //  @modelAttributes:   Cloned attributes hash for the model whose view
    //                      was clicked on by the user in the listView.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickRecord : function(modelAttributes) {

        var urlIDs = _.extend({},this.settings.urlIDs,{
            gID:modelAttributes.id
        });

        // now, if we are going to our own content (i.e., group="self") then
        // we can set the gID *and* the uID right now.

        if ( urlIDs.gID === "self" ) {
            urlIDs.uID = app.store.get("user").id;
        }

        this.trigger("setPage",{
            urlIDs:urlIDs,
            containerAttributes:modelAttributes
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, as well as the event that started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function VPageStudyingBrowseGroups__onClickToolbar(buttonName,button,event) {

        // SET SEARCH CODE

        if ( buttonName === "code" ) {
            this.displayForm("code");
        }

        // CREATE NEW GROUP

        else if ( buttonName === "add" ) {

            bsDialog.create({                    
                title : "Create Studygroup",
                msg : "<p>Do you want to create a private studygroup for this class?</p>",
                ok : function() {

                    $.ajax({
                        url : app.JS_ROOT + "ajax/studying/groups-manual.php/create/"+this.settings.urlIDs.mID,
                        type : "POST",            
                        dataType : "json",
                        data : JSON.stringify({
                            code : $.leftovers.parse.generate_random_string(6,false,true,true)
                        }),
                        contentType : "application/json",
                        context : this,
                        beforeSend : function(jqxhr,options) {
                            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                        },
                    })
                    .done(function(data,textStatus,jqXHR) {
                        this.listView.trigger("onExternalAdd",data,{});                            
                    })
                    .fail(function(jqXHR,textStatus,errorThrown) {

                        Spinner.get().hide(function(){
                        
                            var userError = app.getAjaxUserError(jqXHR);
                            if ( ( jqXHR.status === 400 ) && ( userError ) && ( userError.type === "owner" ) ) {

                                bsDialog.create({
                                    title : "Error!",
                                    msg : "<p>You are already the owner of a studygroup for this class. To create another one you'll have to leave that group first.</p>",
                                    ok : function() {}
                                });
                            }
                            else {
                                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                            }
                        });
                    });

                }.bind(this),
                cancel : function() {}
            });
        }            
    },

    ///////////////////////////////////////////////////////////////////////////
    // The formView that was opened has successfully "submitted" whatever the user
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
    //              of "submitting". They may include our own options ("sb...") and
    //              backbone-related options.
    //
    ///////////////////////////////////////////////////////////////////////////

    onFormSubmit : function(formName,formData,options) { /* overloaded */

        switch ( formName ) {

            // setting a new search code.
            case "code":

                // refresh the page, with the new search code.

                var hadCode = app.store.has("groups.code");
                app.store.rem("groups.code");

                if ( formData.code.length ) {

                    // set the code information in our store and refresh
                    // the page. the code information will be checked by
                    // the `setDefaultToolbarEnabled` method and the
                    // code button will be highlighted.
                    
                    app.store.set("groups.code",formData.code);
                    this.refresh();
                }

                // no code
                else {

                    // clearing what we had before.
                    if ( hadCode ) {
                        this.refresh();
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