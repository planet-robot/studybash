//---------------------------------------------------------------------------------------
// View: VPageStudyingBrowseTests
// Description: This view represents the page where the user is able to browse all of the
//              tests that belong to a given user for a given module. The page contains a
//              breadcrumb, toolbar, and list of records; each represented by a subview.
//              Notice that forms are created for this view.
//
//              Several events are captured here: onClickBreadcrumb, onClickToolbar,
//              and onClickRecord. These are triggered by their  respective subviews. 
//              When our data has been loaded, we trigger an "onPageReady" event, letting 
//              our parent know that we are ready to render.
//
//              Again, there are no forms here.
//---------------------------------------------------------------------------------------

var VPageStudyingBrowseTests = VBasePageBrowse.extend({

    /* overloaded */
    id : "page-studying-browse-tests",
    className : function() {
        return _.result(VBasePageBrowse.prototype,'className') + " page-studying-browse-tests";
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
        this.$("div.sb-footer div.help a").prop("href",href+"tests/");

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Loads all of the data required for the page. When we are finished, we
    // will call `ready` which prepares us for rendering and eventually triggers
    // the "onPageReady" event.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageStudyingBrowseTests__loadData() { /* overloaded */

        // we will be storing an array of sets, as well as a breadcrumb
        this.listData = null;
        this.breadcrumb = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading tests...",opacity:0});

        $.ajax({
            url : app.JS_ROOT + "ajax/studying/tests-manual.php/fetch/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.gID + "/" + this.settings.urlIDs.uID,
            type : "POST",            
            data : JSON.stringify({
                includeAuto:!app.store.has("tests.hide_auto")
            }),
            dataType : "json",
            contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {

            this.listData = data.tests;
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
            heading : "Tests"
        };
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate the breadcrumb, toolbar, and list views for this 
    // particular page.
    ///////////////////////////////////////////////////////////////////////////

    instantiateBreadcrumbView : function() { /* overloaded */
        return new VWidgetStudyingBrowseTestsBreadcrumb({
            data:this.breadcrumb
        });
    },

    instantiateToolbarView : function() { /* overloaded */        
        return new VWidgetStudyingBrowseTestsToolbar();
    },

    instantiateListView : function() { /* overloaded */
        var options = {};
        if ( app.store.has("tests.isAscending") ) {
            options.sbIsAscending = app.store.get("tests.isAscending");
        }
        return new VWidgetStudyingBrowseTestsList(
            {
                listData:this.listData,
                urlIDs:this.settings.urlIDs
            },
            options
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // By default, the user is always able to sort and hide_auto (toggle).
    // Delete is only available if the user owns the tests being displayed.
    // If "hide_auto" is currently on, then highlight that button.
    ///////////////////////////////////////////////////////////////////////////

    setDefaultToolbarEnabled : function() { /* overloaded */

        var isUser = this.settings.urlIDs.uID === app.store.get("user").id;

        // we will set the text of the display/sort button. always assume ascending by default.
        this.toolbarView.getButton("display_sort").html(app.store.has("tests.isAscending") ? ( app.store.get("tests.isAscending") ? "Sort Descending" : "Sort Ascending" ) : "Sort Descending" );

        this.toolbarView.setEnabled({
            display:true,
            hide_auto:true,
            delete:isUser
        });

        // hide_auto is on?

        var hideAuto = app.store.has("tests.hide_auto");
        if ( hideAuto ) {
            this.toolbarView.getButton("hide_auto").removeClass("btn-default").addClass("btn-warning");
        }
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

    onClickToolbar : function VPageStudyingBrowseTests__onClickToolbar(buttonName,event) {

        // DISPLAY

        if ( buttonName.indexOf("display") !== -1 ) {

            // SORT

            if ( buttonName === "display_sort" ) {
                var isAscending = !this.listView.collection.isAscending;
                app.store.set("tests.isAscending",isAscending);
                app.saveUserSettings();
                this.refresh();
            }
        }

        // HIDE AUTO (toggle)

        else if ( buttonName === "hide_auto" ) {

            // either highlight the 'show auto' button or make it plain again, depending on
            // whether or not we're showing auto sets.
            var wasHidingAuto = app.store.has("tests.hide_auto");

            if ( wasHidingAuto ) {
                app.store.rem("tests.hide_auto");
            }
            else {
                app.store.set("tests.hide_auto",true);
            }

            this.refresh();
        }

        // DELETE

        else if ( buttonName === "delete" ) {

            // we must have some sets selected in our listView
            var testsSelected = this.listView.getSelected();            
            if ( !testsSelected.length ) {
                bsDialog.create({                    
                    title : "Delete Tests",
                    msg : "<p>You must select some tests first!</p>",
                    ok : function() {}
                });
            }

            else {

                // grab all of the testIDs that they want to delete.

                var testIDs = [];
                testsSelected.each(function(idx,jqo){
                    var attrs = $(jqo).data("modelAttributes");
                    testIDs.push(attrs.id);
                });

                // the user has selected some sets to delete. we will create the function to do so
                // and then attach it to the "OK" button of a bootstrap dialog (modal).            

                okayFunction = function() {

                    Spinner.get().show({msg:"Removing...",opacity:0});

                    $.ajax({
                        url : app.JS_ROOT + "ajax/studying/tests-manual.php/delete/" + this.settings.urlIDs.mID + "/" + this.settings.urlIDs.uID,
                        type : "POST",            
                        data : JSON.stringify(testIDs),
                        dataType : "json",
                        contentType : "application/json", // RESTful (default: 'application/x-www-form-urlencoded')
                        context : this,
                        beforeSend : function(jqxhr,options) {
                            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
                        },
                    })
                    .done(function(data,textStatus,jqXHR) {

                        // upon success, we receive an array of all the testIDs that were deleted. if it doesn't
                        // match the list that we originally sent, the server would have generated an error.
                        
                        // note: for working and broken examples of using for loop values in closures, see
                        // http://jsfiddle.net/UWzcd/2/

                        // the function that receives the event for "onExternalRemove" expects the parameter
                        // to be a function that can be used as a matching function when iterating through
                        // the collection of models that make up the listView.

                        for ( var x=0; x < data.testIDs.length; x++ ) {
                            (function(testID){
                                this.listView.trigger("onExternalRemove",function(o){
                                    return (o.id === testID);
                                });
                            }.bind(this))(data.testIDs[x]);
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
                    title : "Delete Tests",
                    msg : "<p>Are you sure you want to delete these tests? WARNING: THIS CANNOT BE UNDONE!</p>",
                    ok : okayFunction,
                    cancel : function(){}
                });
            }
        }
        
    }

});