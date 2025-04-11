//---------------------------------------------------------------------------------------
// View: VPageStudyingBrowseCards
// Description: This view represents the page where the user is able to browse all of the
//              cards that belong to a set for a given user for a given module. The page contains a
//              breadcrumb, toolbar, form, and list of records; each represented by a subview.
//
//              Several events are captured here: onClickBreadcrumb, onClickToolbar,
//              onClickRecord, and onFormSave/onFormCancel. These are triggered by their 
//              respective subviews. When our data has been loaded, we trigger an "onPageReady"
//              event, letting our parent know that we are ready to render.
//
//              The forms available here are "create", "filter", and "saveTest".
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseCards = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-cards",
    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-studying-browse-cards";
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

    loadData : function VPageStudyingBrowseCards__loadData() { /* overloaded */

        // we will be storing an array of sets, as well as a breadcrumb
        this.listData = null;
        this.breadcrumb = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading cards...",opacity:0});

        // Load the models for this collection. note that we are not
        // using the collection.fetch method (along with 'reset' event)
        // because we need to make use of our `filter` info (if it
        // exists) and sending data on a `fetch` is a huge pain with
        // backbone.

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/cards-manual.php/fetch/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.gID + "/" + this.settings.urlIDs.uID + "/" + this.settings.urlIDs.sID,
            type : "POST",            
            data : JSON.stringify({
                filter:{
                    keywords : app.store.get("card.filter.keywords"),
                    tags : app.store.get("card.filter.tags")
                }
            }),
            dataType : "json",
            contentType : "application/json",
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            this.listData = data.cards;
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
            heading : "Cards"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the breadcrumb, toolbar, and list views for this 
    // particular page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() { /* overloaded */
        return new VWidgetStudyingBrowseCardsBreadcrumb({
            data:this.breadcrumb
        });
    },

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseCardsToolbar();
    },

    instantiateListView : function() { /* overloaded */
        var options = {};
        if ( app.store.has("cards.isAscending") ) {
            options.sbIsAscending = app.store.get("cards.isAscending");
        }
        return new VWidgetStudyingBrowseCardsList(
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
                formView = new VWidgetStudyingBrowseCardsFormCreate(settings,options);
                break;

            case "batch" :
                formView = new VWidgetStudyingBrowseCardsFormBatch(settings,options);
                break;

            case "filter" :
                formView = new VWidgetStudyingBrowseCardsFormFilter(settings,options);
                break;

            case "saveTest" :
                formView = new VWidgetStudyingBrowseCardsFormSaveTest(settings,options);
                break;
        }

        return formView;
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, the user is always able to sort, filter, and saveTest.
    // The other ones are only available if the user owns the cards being
    // displayed. If a filter is present in our store, or if there is data
    // on the clipboard, we will highlight those respective buttons.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() { /* overloaded */

        var isUser = this.settings.urlIDs.uID === app.store.get("user").id;

        // we will set the text of the display/sort button. always assume ascending by default.
        this.toolbarView.getButton("display_sort").html(app.store.has("cards.isAscending") ? ( app.store.get("cards.isAscending") ? "Sort Descending" : "Sort Ascending" ) : "Sort Descending" );

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
            this.toolbarView.getButton("clipboard").removeClass("btn-default").addClass(isCut ? "btn-danger" : "btn-warning" );
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
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, as well as the event that started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function VPageStudyingBrowseCards__onClickToolbar(buttonName,event) {

        // DISPLAY

        if ( buttonName.indexOf("display") !== -1 ) {

            // SORT

            if ( buttonName === "display_sort" ) {
                var isAscending = !this.listView.collection.isAscending;
                app.store.set("cards.isAscending",isAscending);
                this.refresh();
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

                // we must have some cards selected in our listView
                var cardsSelected = this.listView.getSelected();
                if ( !cardsSelected.length ) {
                    bsDialog.create({                    
                        title : "Cut/Copy Flashcards",
                        msg : "<p>You must select some cards first!</p>",
                        ok : function() {}
                    });
                }

                else {

                    // highlight them all as being cut or copied.
                    cardsSelected.addClass("widget-record-editable-"+(isCut?"cut":"copy"));

                    // remove the 'selected' property
                    this.listView.clearSelected();

                    // grab all of the ids that they want to cut/copy.
                    var cardIDs = [];
                    cardsSelected.each(function(idx,jqo){
                        var attrs = $(jqo).data("modelAttributes");
                        cardIDs.push(attrs.id);
                    });

                    // create an object that details this operation, so
                    // when we go to paste we know what we're doing.

                    var clipboardData = {};
                    clipboardData.isCut = isCut;
                    clipboardData.type = "cards";
                    clipboardData.ids = cardIDs;
                    clipboardData.srcModuleID = this.settings.urlIDs.mID;
                    clipboardData.srcSetID = this.settings.urlIDs.sID;
                    
                    app.store.rem("clipboard",true);
                    app.store.set("clipboard",clipboardData);

                    bsDialog.create({                    
                        title : "Cut/Copy Flashcards",
                        msg : "<p>" + cardIDs.length + " card(s) have been placed on the clipboard</p>",
                        ok : function() {}
                    });

                    // highlight the "clipboard" toolbar button, as we now have something on the clipboard.
                    this.toolbarView.getButton("clipboard").removeClass("btn-default btn-warning btn-danger").addClass(( isCut ? "btn-danger" : "btn-warning" ))
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

                // (2) they must have cards on the clipboard.
                else if ( clipboard.type !== "cards" ) {
                    errorMsg = "You can only paste cards here!";
                }

                // (3)  ensure that they aren't trying to paste sets into the same
                //      set that they cut/copied them from!
                else if ( clipboard.srcSetID === this.settings.urlIDs.sID ) {
                    errorMsg = "Source/destination sets are the same!";
                }

                if ( errorMsg ) {
                    bsDialog.create({                
                        title : "Paste",
                        msg : "<p>" + errorMsg + "</p>",
                        ok : function(){}
                    });
                }

                // everything checked out. let's paste the cards here and then select them, so the
                // user knows what's been pasted. Notice that we are NOT applying the current filter
                // to the pasted cards, so even if the cards WOULD NOT pass the filter, they are still
                // displayed, in order to let the user know what was pasted. if they want to see the
                // current set, with the new pasted cards, *and* the filter, all the have to do is hit
                // 'refresh'.

                else {

                    // clear the current selections (if any)
                    this.listView.clearSelected();

                    Spinner.get().show({msg:"Pasting...",opacity:0});

                    $.ajax({
                        url : app.JS_ROOT + "ajax/studying/cards-manual.php/paste/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID + "/" + this.settings.urlIDs.sID,
                        type : "POST",
                        data : JSON.stringify({
                            isCut:+(clipboard.isCut),
                            cardIDs:clipboard.ids,
                            srcModuleID:clipboard.srcModuleID,
                            dstModuleID:this.settings.urlIDs.mID,
                            srcSetID:clipboard.srcSetID,
                            dstSetID:this.settings.urlIDs.sID
                        }),
                        dataType : "json",
                        contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
                        context : this,
                        beforeSend : function(jqxhr,options) {
                            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                        },
                    })
                    .done(function(data,textStatus,jqXHR) {

                        // we have received an array of new cards from the server. we are going to add them
                        // to the listView. the parameters for "onExternalAdd" are: (attrObject, options)
                        // since backbone options can be sent to the function that is bound to this event,
                        // we are identifying our proprietary options with the `sb` prefix.

                        for ( var x=0; x < data.newCards.length; x++ ) {
                            this.listView.trigger("onExternalAdd",data.newCards[x],{sbMakeSelected:true});
                        }
                        Spinner.get().hide(function(){
                            bsDialog.create({                    
                                title : "Paste Cards",
                                msg : "<p>" + data.newCards.length + " card(s) pasted</p>",
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

        // ADD

        else if ( buttonName.indexOf("add") !== -1 ) {

            // ADD SINGLE CARD

            if ( buttonName === "add_card" ) {
                this.displayForm("create",{urlIDs:this.settings.urlIDs});
            }

            // ADD CARD BATCH

            else if ( buttonName === "add_batch" ) {
                this.displayForm("batch",{urlIDs:this.settings.urlIDs});
            }
        }

        // DELETE

        else if ( buttonName === "delete" ) {

            // we must have some cards selected in our listView
            var cardsSelected = this.listView.getSelected();            
            if ( !cardsSelected.length ) {
                bsDialog.create({                    
                    title : "Delete Flashcards",
                    msg : "<p>You must select some cards first!</p>",
                    ok : function() {}
                });
            }

            else {

                // grab all of the cardIDs that they want to delete.

                var cardIDs = [];
                cardsSelected.each(function(idx,jqo){
                    var attrs = $(jqo).data("modelAttributes");
                    cardIDs.push(attrs.id);
                });

                // the user has selected some sets to delete. we will create the function to do so
                // and then attach it to the "OK" button of a bootstrap dialog (modal).            

                okayFunction = function() {

                    // prevents them from copying/cutting stuff onto the clipboard, deleting them, and then
                    // trying to paste them.
                    this.clearClipboard();

                    Spinner.get().show({msg:"Removing...",opacity:0});

                    $.ajax({
                        url : app.JS_ROOT + "ajax/studying/cards-manual.php/delete/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID + "/" + this.settings.urlIDs.sID,
                        type : "POST",            
                        data : JSON.stringify(cardIDs),
                        dataType : "json",
                        contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
                        context : this,
                        beforeSend : function(jqxhr,options) {
                            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                        },
                    })
                    .done(function(data,textStatus,jqXHR) {

                        // upon success, we receive an array of all the cardIDs that were deleted. if it doesn't
                        // match the list that we originally sent, the server would have generated an error.
                        
                        // note: for working and broken examples of using for loop values in closures, see
                        // http://jsfiddle.net/UWzcd/2/

                        // the function that receives the event for "onExternalRemove" expects the parameter
                        // to be a function that can be used as a matching function when iterating through
                        // the collection of models that make up the listView.

                        for ( var x=0; x < data.cardIDs.length; x++ ) {
                            (function(cardID){
                                this.listView.trigger("onExternalRemove",function(o){
                                    return (o.id === cardID);
                                });
                            }.bind(this))(data.cardIDs[x]);
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
                    title : "Delete Flashcards",
                    msg : "<p>Are you sure you want to delete these cards? WARNING: THIS CANNOT BE UNDONE!</p>",
                    ok : okayFunction,
                    cancel : function(){}
                });
            }
        }

        // TEST

        else if ( buttonName.indexOf("test_") !== -1 ) {

            // TAKE

            if ( buttonName === "test_take" ) {

                var setIDs = [this.settings.urlIDs.sID];
                var keywords = app.store.get("card.filter.keywords") || [];
                var tags = app.store.get("card.filter.tags") || [];

                bsDialog.create({
                    title: "Take Test",
                    msg : "<p>Do you want to take a test comprised of this set and any filter information you have selected?</p>",
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
                });
            }

            // SAVE AS

            else if ( buttonName === "test_save" ) {

                // we are operating only on the current set and we only require
                // its ID. open the form so the user can fill out the rest of the test's
                // information.

                app.store.rem("test.save",true); // empty all
                app.store.set("test.save.setIDs",[this.settings.urlIDs.sID]);
                this.displayForm("saveTest",{urlIDs:this.settings.urlIDs});
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
            
            // new card has been created, we don't close the form (they can
            // keep adding).
            case "create":
                this.listView.trigger("onExternalAdd",formData,options);
                break;

            // we have received an array of new cards from the server. we are going to add them
            // to the listView. the parameters for "onExternalAdd" are: (attrObject, options)
            // since backbone options can be sent to the function that is bound to this event,
            // we are identifying our proprietary options with the `sb` prefix.
            case "batch":
                var newCards = formData;
                for ( var x=0; x < newCards.length; x++ ) {
                    this.listView.trigger("onExternalAdd",newCards[x],{sbMakeSelected:true});
                }
                this.closeForm();
                bsDialog.create({                    
                    title : "Create Multiple Flashcards",
                    msg : "<p>"+newCards.length + " card(s) created</p>",
                    ok : function() {}
                });
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