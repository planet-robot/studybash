//---------------------------------------------------------------------------------------
// View:        VPageStudyingBrowseSets
// Description: This view represents the page where the user is able to browse all of the
//              sets that belong to a given user for a given module. The page contains a
//              breadcrumb, toolbar, form, and list of records; each represented by a subview.
//
//              Several events are captured here: onClickBreadcrumb, onClickToolbar,
//              onClickRecord, and onFormSave/onFormCancel. These are triggered by their 
//              respective subviews. When our data has been loaded, we trigger an "onPageReady"
//              event, letting our parent know that we are ready to render.
//
//              The forms available here are "create", "filter", and "saveTest".
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseSets = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-sets",
    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-studying-browse-sets";
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
        this.$("div.sb-footer div.help a").prop("href",href+"flashcards/");

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageStudyingBrowseSets__loadData() { /* overloaded */

        // we will be storing an array of sets, as well as a breadcrumb
        this.listData = null;
        this.breadcrumb = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading sets...",opacity:0});

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/sets-manual.php/fetch/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.gID + "/" + this.settings.urlIDs.uID,
            type : "POST",            
            data : JSON.stringify({
                filter:{
                    keywords : app.store.get("card.filter.keywords"),
                    tags : app.store.get("card.filter.tags")
                }
            }),
            dataType : "json",
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            this.listData = data.sets;
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
            heading : "Sets"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the breadcrumb, toolbar, and list views for this 
    // particular page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() { /* overloaded */
        return new VWidgetStudyingBrowseSetsBreadcrumb({
            data:this.breadcrumb
        });
    },

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseSetsToolbar();
    },

    instantiateListView : function() { /* overloaded */
        var options = {};
        if ( app.store.has("sets.isAscending") ) {
            options.sbIsAscending = app.store.get("sets.isAscending");
        }
        if ( app.store.has("sets.sortCriteria") ) {
            options.sbSortCriteria = app.store.get("sets.sortCriteria");
        }
        return new VWidgetStudyingBrowseSetsList(
            {
                listData:this.listData,
                urlIDs:this.settings.urlIDs
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

            case "create" :
                formView = new VWidgetStudyingBrowseSetsFormCreate(settings,options);
                break;

            case "filter" :
                formView = new VWidgetStudyingBrowseSetsFormFilter(settings,options);
                break;

            case "saveTest" :
                formView = new VWidgetStudyingBrowseSetsFormSaveTest(settings,options);
                break;
        }

        return formView;
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, the user is always able to sort, filter, and saveTest.
    // The other ones are only available if the user owns the sets being
    // displayed. If a filter is present in our store, or if there is data
    // on the clipboard, we will highlight those respective buttons.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() { /* overloaded */

        var isUser = this.settings.urlIDs.uID === app.store.get("user").id;

        // we will set the text of the display/sort button. always assume ascending by default.
        this.toolbarView.getButton("display_sort_order").html(app.store.has("sets.isAscending") ? ( app.store.get("sets.isAscending") ? "Sort Descending" : "Sort Ascending" ) : "Sort Descending" );

        // we will set the text of the sort criteria button. always assume name by default.
        this.toolbarView.getButton("display_sort_criteria").html(app.store.has("sets.sortCriteria") ? ( app.store.get("sets.sortCriteria") === "name" ? "Sort By Num Cards" : "Sort By Name" ) : "Sort By Num Cards" );

        // enable/disable.
        this.toolbarView.setEnabled({
            display:true,
            clipboard:isUser,
            add:isUser,
            delete:isUser,
            filter:true,
            test:true
        });

        // records on clipboard?

        var clipboard = app.store.get("clipboard");
        if ( $.gettype(clipboard).base !== "undefined" ) {
            var isCut = clipboard.isCut;
            this.toolbarView.getButton("clipboard").removeClass("btn-default").addClass(( isCut ? "btn-danger" : "btn-warning" ));
        }

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
            clipboard:this.savedToolbarButtonState.clipboard,
            add:false,
            delete:this.savedToolbarButtonState.delete,
            filter:false,
            test:false
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

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // All records that have been cut/copied to the clipboard are being released.
    // Empty the clipboard's data in the store and remove all of the CSS classes
    // that might have been applied to records in our listView, identifying them
    // as being cut/copied.
    ///////////////////////////////////////////////////////////////////////////

    clearClipboard : function() {
        app.store.rem("clipboard",true);
        this.listView.getFilteredRecordViews(".widget-record-editable-cut, .widget-record-editable-copy").removeClass("widget-record-editable-cut widget-record-editable-copy");
        this.toolbarView.getButton("clipboard").removeClass("btn-warning btn-danger").addClass("btn-default");
    },

    /*
        Trigger Events.
    */

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
    // The user has clicked on one of the modules in our list. We are going
    // to trigger a page change, sending along the urlIDs that represent our
    // new position in the browsing hierarchy.
    ///////////////////////////////////////////////////////////////////////////

    onClickRecord : function(modelAttributes) {
        this.trigger("setPage",{
            urlIDs : _.extend({},this.settings.urlIDs,{
                sID:modelAttributes.id
            }),
            containerAttributes:modelAttributes
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, the button itself, as well as the event that 
    // started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function VPageStudyingBrowseSets__onClickToolbar(buttonName,button,event) {

        // DISPLAY

        if ( buttonName.indexOf("display") !== -1 ) {

            // SORT CRITERIA

            if ( buttonName === "display_sort_criteria" ) {
                var sortCriteria = this.listView.collection.sortCriteria;
                app.store.set("sets.sortCriteria",( sortCriteria === "name" ? "cards" : "name" ));
                app.saveUserSettings();
                this.refresh();
            }

            // SORT ORDER

            else if ( buttonName === "display_sort_order" ) {
                var isAscending = this.listView.collection.isAscending;
                app.store.set("sets.isAscending",!isAscending);
                app.saveUserSettings();
                this.refresh();
            }

            // SELECT ALL

            else if ( buttonName === "display_select_all" ) {
                this.listView.getFilteredRecordViews(".widget-record-editable").addClass("widget-record-editable-selected");
            }

            // CLEAR SELECTED

            else if ( buttonName === "display_clear_selected" ) {
                this.listView.clearSelected();
            }
        }

        // CLIPBOARD

        else if ( buttonName.indexOf("clipboard") !== -1 ) {

            // CLEAR

            if ( buttonName ==="clipboard_clear" ) {
                this.clearClipboard();
            }

            // CUT/COPY

            else if ( ( buttonName === "clipboard_cut" ) || ( buttonName === "clipboard_copy" ) ) {

                var isCut = ( buttonName === "clipboard_cut" );

                // we must have some sets selected in our listView
                var setsSelected = this.listView.getSelected();
                if ( !setsSelected.length ) {
                    bsDialog.create({                    
                        title : "Cut/Copy Sets",
                        msg : "<p>You must select some sets first!</p>",
                        ok : function() {}
                    });
                }

                else {

                    // highlight them all as being cut or copied.
                    setsSelected.addClass("widget-record-editable-"+(isCut?"cut":"copy"));

                    // remove the 'selected' property
                    this.listView.clearSelected();

                    // grab all of the setIDs that they want to cut/copy.
                    var setIDs = [];
                    setsSelected.each(function(idx,jqo){
                        var attrs = $(jqo).data("modelAttributes");
                        setIDs.push(attrs.id);
                    });

                    // create an object that details this operation, so
                    // when we go to paste we know what we're doing.

                    var clipboardData = {};
                    clipboardData.isCut = isCut;
                    clipboardData.type = "sets";
                    clipboardData.ids = setIDs;
                    clipboardData.srcModuleID = this.settings.urlIDs.mID;
                    clipboardData.srcSetID = undefined;
                    
                    app.store.rem("clipboard",true);
                    app.store.set("clipboard",clipboardData);

                    bsDialog.create({                    
                        title : "Cut/Copy Sets",
                        msg : "<p>" + setIDs.length + " set(s) have been placed on the clipboard" + "</p>",
                        ok : function() {}
                    });

                    // highlight the "clipboard" toolbar button, as we now have something on the clipboard.
                    this.toolbarView.getButton("clipboard").removeClass("btn-default btn-warning btn-danger").addClass( isCut ? "btn-danger" : "btn-warning" );
                }
            }

            // PASTE

            else if ( buttonName === "clipboard_paste" ) {

                // check for the several errors that might occur first.

                var errorMsg = null;
                var clipboard = app.store.get("clipboard");
                
                // (1) we must have something on the clipboard.
                if ( $.gettype(clipboard).base === "undefined" ) {
                    errorMsg = "Clipboard is empty!";
                }

                // (2) they must have sets on the clipboard.
                else if ( clipboard.type !== "sets" ) {
                    errorMsg = "You can only paste sets here!";
                }

                // (3)  ensure that they aren't trying to paste sets into the same
                //      module that they cut/copied them from!
                else if ( clipboard.srcModuleID === this.settings.urlIDs.mID ) {
                    errorMsg = "Source/destination classes are the same!";
                }

                if ( errorMsg ) {
                    bsDialog.create({                
                        title : "Paste",
                        msg : "<p>" + errorMsg + "</p>",
                        ok : function(){}
                    });
                }

                // everything checked out. let's paste the sets here and then select them, so the
                // user knows what's been pasted.

                else {

                    // clear the current selections (if any)
                    this.listView.clearSelected();

                    Spinner.get().show({msg:"Pasting...",opacity:0});

                    $.ajax({
                        url : app.JS_ROOT + "ajax/studying/sets-manual.php/paste/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID,
                        type : "POST",            
                        data : JSON.stringify({
                            isCut:+(clipboard.isCut),
                            setIDs:clipboard.ids,
                            srcModuleID:clipboard.srcModuleID,
                            dstModuleID:this.settings.urlIDs.mID
                        }),
                        dataType : "json",
                        contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
                        context : this,
                        beforeSend : function(jqxhr,options) {
                            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                        },
                    })
                    .done(function(data,textStatus,jqXHR) {

                        // we have received an array of new sets from the server. we are going to add them
                        // to the listView. the parameters for "onExternalAdd" are: (attrObject, options)
                        // since backbone options can be sent to the function that is bound to this event,
                        // we are identifying our proprietary options with the `sb` prefix.

                        for ( var x=0; x < data.newSets.length; x++ ) {
                            this.listView.trigger("onExternalAdd",data.newSets[x],{sbMakeSelected:true});
                        }
                        Spinner.get().hide(function(){
                            bsDialog.create({                    
                                title : "Paste Sets",
                                msg : "<p>" + data.newSets.length + " set(s) pasted" + "</p>",
                                ok : function() {}
                            });
                        });
                    })
                    .fail(function(jqXHR,textStatus,errorThrown) {

                        Spinner.get().hide(function(){
                            app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                        });
                    })

                    // Whether we fail or succeed, the clipboard is now empty.
                    .always(function(a,textStatus,c){
                        this.clearClipboard();
                    });
                }
            }
        }

        // ADD SET

        else if ( buttonName === "add" ) {
            this.displayForm("create",{urlIDs:this.settings.urlIDs});
        }

        // DELETE

        else if ( buttonName === "delete" ) {

            // we must have some sets selected in our listView
            var setsSelected = this.listView.getSelected();            
            if ( !setsSelected.length ) {
                bsDialog.create({                    
                    title : "Delete Sets",
                    msg : "<p>You must select some sets first!</p>",
                    ok : function() {}
                });
            }

            else {

                // grab all of the setIDs that they want to delete.

                var setIDs = [];
                setsSelected.each(function(idx,jqo){
                    var attrs = $(jqo).data("modelAttributes");
                    setIDs.push(attrs.id);
                });

                // the user has selected some sets to delete. we will create the function to do so
                // and then attach it to the "OK" button of a bootstrap dialog (modal).            

                okayFunction = function() {

                    // prevents them from copying/cutting stuff onto the clipboard, deleting them, and then
                    // trying to paste them.
                    this.clearClipboard();

                    Spinner.get().show({msg:"Removing...",opacity:0});

                    $.ajax({
                        url : app.JS_ROOT + "ajax/studying/sets-manual.php/delete/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID,
                        type : "POST",            
                        data : JSON.stringify(setIDs),
                        dataType : "json",
                        contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
                        context : this,
                        beforeSend : function(jqxhr,options) {
                            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                        },
                    })
                    .done(function(data,textStatus,jqXHR) {

                        // upon success, we receive an array of all the setIDs that were deleted. if it doesn't
                        // match the list that we originally sent, the server would have generated an error.
                        
                        // note: for working and broken examples of using for loop values in closures, see
                        // http://jsfiddle.net/UWzcd/2/

                        // the function that receives the event for "onExternalRemove" expects the parameter
                        // to be a function that can be used as a matching function when iterating through
                        // the collection of models that make up the listView.

                        for ( var x=0; x < data.setIDs.length; x++ ) {
                            (function(setID){
                                this.listView.trigger("onExternalRemove",function(o){
                                    return (o.id === setID);
                                });
                            }.bind(this))(data.setIDs[x]);
                        }
                        Spinner.get().hide();
                    })
                    .fail(function(jqXHR,textStatus,errorThrown) {

                        Spinner.get().hide(function(){
                            app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
                        });
                    });

                }.bind(this);

                // show the dialog to ensure that they really want this.

                bsDialog.create({                    
                    title : "Delete Sets",
                    msg : "<p>Are you sure you want to delete these sets? This will also delete any cards that are inside them. WARNING: THIS CANNOT BE UNDONE!</p>",
                    ok : okayFunction,
                    cancel : function(){}
                });
            }
        }

        // TEST

        else if ( buttonName.indexOf("test_") !== -1 ) {

            // TAKE

            if ( buttonName === "test_take" ) {

                // we must have some sets selected in our listView
                var setsSelected = this.listView.getSelected();            
                if ( !setsSelected.length ) {
                    bsDialog.create({                    
                        title : "Take Test",
                        msg : "<p>You must select some sets first!</p>",
                        ok : function() {}
                    });
                }

                // just grab all of the setIDs from our selected sets. we don't
                // require any more of the models' information than that.
                else {

                    var setIDs = [];        
                    setsSelected.each(function(idx,o){
                        var attrs = $(o).data("modelAttributes");
                        setIDs.push(attrs.id);
                    });

                    var keywords = app.store.get("card.filter.keywords") || [];
                    var tags = app.store.get("card.filter.tags") || [];

                    bsDialog.create({
                        title: "Take Test",
                        msg : "<p>Do you want to take a test comprised of the set(s) and filter information you have selected?</p>",
                        ok : function() {
                            app.store.rem("tests.manual");
                            app.store.set("tests.manual",{
                                module_id : this.settings.urlIDs.mID,
                                setIDs : setIDs,
                                keywords : keywords,
                                tags : tags
                            });
                            app.router.navigate(
                                "studying/taketest/manual/",
                                {trigger:true}
                            );
                        }.bind(this),
                        cancel : function() {}
                    })
                }
            }

            // SAVE AS

            else if ( buttonName === "test_save" ) {

                // we must have some sets selected in our listView
                var setsSelected = this.listView.getSelected();            
                if ( !setsSelected.length ) {
                    bsDialog.create({                    
                        title : "Save As Test",
                        msg : "<p>You must select some sets first!</p>",
                        ok : function() {}
                    });
                }

                // just grab all of the setIDs from our selected sets. we don't
                // require any more of the models' information than that. then
                // open the form so the user can fill out the rest of the test's
                // information.
                else {

                    var setIDs = [];        
                    setsSelected.each(function(idx,o){
                        var attrs = $(o).data("modelAttributes");
                        setIDs.push(attrs.id);
                    });
                    app.store.rem("test.save",true); // empty all
                    app.store.set("test.save.setIDs",setIDs);                
                    this.displayForm("saveTest",{urlIDs:this.settings.urlIDs});
                }
            }
        }

        // FILTER SET

        else if ( buttonName === "filter_set" ) {
            this.displayForm("filter");
        }

        // FILTER CLEAR

        else if ( buttonName === "filter_clear" ) {
            app.store.rem("card.filter",true);
            this.refresh();
        }

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
            
            // new set has been created
            case "create":
                this.listView.trigger("onExternalAdd",formData,options);
                this.closeForm();
                break;

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

            // test has been saved
            case "saveTest":

                this.listView.clearSelected();
                app.store.rem("test.save",true);
                this.closeForm();
                break;
        }
    }    

});