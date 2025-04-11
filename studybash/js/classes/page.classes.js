//---------------------------------------------------------------------------------------
// View: VPageClasses
// Description: The user can browse a list of the classes that they are currently enrolled in,
//              or add a new class to their enrollment list.
//
//              There are three widgets here: toolbar, form, and list.
//---------------------------------------------------------------------------------------

var VPageClasses = VBasePage.extend({

    /* overloaded */
    id : "page-classes",
    pageTemplateID : "tpl-page",
    contentTemplateID : "tpl-page-classes", // leave undefined to not template this element.
    footerTemplateID : "tpl-page-footer-user",
    contentElement : "div.page-content",
    footerElement : "div.page-footer",

    /* overload */
    className : function() {
        return _.result(VBasePage.prototype,'className') + " page-classes";
    },

    toolbarElement : "div.page-content > div.content > div.content-toolbar",
    formElement : "div.page-content > div.content > div.content-form",
    listElement : "div.page-content > div.content > div.content-list",

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBasePage.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //  @options.   They were originally sent to `VBaseSection.setPage`.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overloaded and extended */        

        this.toolbarView = null;
        this.formView = null;
        this.listView = null;

        VBasePage.prototype.initialize.call(this,settings,options); // copies over parms.
    },

    ///////////////////////////////////////////////////////////////////////////
    // We will load the general enrollment data here. This will tell us how many
    // students have enrolled in each class (and in which years/semesters).
    ///////////////////////////////////////////////////////////////////////////

    loadData : function VPageClasses__loadData() { /* overloaded */

        // this will contain all of the user's enrollment records. a simple array of objects.
        this.userEnrollment = null;

        // we are loading a big data structure here:
        //
        // (1) dictionary. KEY = subj/class combo. VALUE = object.
        // (2) object. COUNT = total for class. HAS_ADMIN = admin enrolled in class? YEARS = dictionary.
        // (3) dictionary. KEY = year. VALUE = object.
        // (4) object. COUNT = total for year. SEMESTERS = dictionary.
        // (5) dictionary. KEY = semester name. VALUE = total for semester, in that year.
        
        this.generalEnrollment = null;

        // show our spinner modal, so all input is temporarily blocked.
        Spinner.get().show({msg:"Loading data...",opacity:0});
        
        var jqXHR = $.ajax({
            url : app.JS_ROOT + "ajax/classes-manual.php/init",
            type : "POST",
            dataType : "json",
            data : JSON.stringify(app.store.get("user").id),
            contentType : "application/json",
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {            
            this.userEnrollment = data.userEnrollment;
            this.generalEnrollment = data.generalEnrollment;
            data = null;
            this.ready();
            Spinner.get().hide();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // All of the data has been loaded that the page requires. We will
    // construct our subviews and then trigger an event notifying whoever is
    // listening that we're ready to render. Notice that we are not
    // dealing with the formView here, as that is manually constructed/removed
    // everytime it's needed.
    ///////////////////////////////////////////////////////////////////////////

    ready : function() { /* overloaded */

        this.toolbarView = new VWidgetClassesToolbar();        
        this.toolbarView.listenTo(this,"cleanup",this.toolbarView.remove);
        this.listenTo(this.toolbarView,"onClickToolbar",this.onClickToolbar);

        this.listView = new VWidgetClassesList({
            listData : this.userEnrollment
        });
        this.listView.listenTo(this,"cleanup",this.listView.remove);        

        this.trigger("onPageReady",this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Cleanup ourselves and all subviews.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* overloaded */

        // empty references
        this.stopListening(this.toolbarView);
        this.stopListening(this.listView);
        this.stopListening(this.formView);        
        this.toolbarView = null;        
        this.listView = null;
        this.formView = null;

        return VBasePage.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML for the page with our template, before rendering
    // toolbar and list views.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overloaded and extended */

        VBasePage.prototype.render.call(this);

        // update the help link in the footer
        var href = this.$("div.sb-footer div.help a").prop("href");
        this.$("div.sb-footer div.help a").prop("href",href+"classes/");

        this.$(this.toolbarElement).html(this.toolbarView.render().$el);
        this.toolbarView.setEnabled({add:true});

        this.$(this.listElement).html(this.listView.render().$el);

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the enabled toolbar buttons. We are
    // sent the name of that button, as well as the event that started it all.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,event) {

        // ADD

        if ( buttonName === "add" ) {
            this.displayAddForm();
        }
    },    

    ///////////////////////////////////////////////////////////////////////////
    // We are opening the `add` form.
    ///////////////////////////////////////////////////////////////////////////

    displayAddForm : function() {

        // this should never happen.
        if ( this.formView ) {
            this.stopListening(this.formView);
            this.formView = null;
        }

        this.formView = new VWidgetClassesFormAdd({
            generalEnrollment:this.generalEnrollment
        });
        this.listenTo(this.formView,"onFormSubmit",this.onFormSubmit);
        this.listenTo(this.formView,"onFormCancel",this.onFormCancel);
        this.formView.listenTo(this,"cleanup",this.formView.remove);

        // since only one form should be open at a time in the browse
        // page, we will ask to disable all the form-related buttons
        // on our toolbar, while it's open.

        this.$(this.formElement).html(this.formView.render().$el);
        this.toolbarView.setEnabled({});
    },

    ///////////////////////////////////////////////////////////////////////////
    // Remove the formView from our element.
    ///////////////////////////////////////////////////////////////////////////

    closeForm : function() {
        
        this.stopListening(this.formView);
        this.formView.remove();
        this.formView = null;

        // we can now re-enable all the form-related buttons on the toolbar
        this.toolbarView.setEnabled({add:true});
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our 'add' form has successfully been submitted. That means that the
    // model was successfully created on the server and sent back. We will
    // now add it to our listView.
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

    onFormSubmit : function(formName,formData,options) { /* overload (as required) */

        this.listView.trigger("onExternalAdd",formData,options);
        this.closeForm();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The formView has been canceled. Remove it from our element.
    ///////////////////////////////////////////////////////////////////////////

    onFormCancel : function() {
        this.closeForm();
    }

});