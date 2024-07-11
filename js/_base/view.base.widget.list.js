//---------------------------------------------------------------------------------------
// View: VBaseWidgetList
// Description: This view renders a list of VBaseWidgetRecordEditable-derived views. If one
//              of those records is clicked (where applicable) then we are notified through
//              the event "onClickRecord", by a VBaseWidgetRecordEditable-derived view,
//              which we will pass along to any listeners of us.
//
//              The records are stored here as a collection. However, they are passed
//              in as a raw data upon construction, and so the collection is created
//              manually through `collection.add`. We attach listeners to several
//              collection events in order to keep our list maintained and up-to-date.
//              All editing/deleting of the records is dealt with through the
//              VBaseWidgetRecordEditable-derived instances.
//---------------------------------------------------------------------------------------

var VBaseWidgetList = Backbone.View.extend({

    /* overload */
    tagName : "div",
    id : undefined,
    className : "widget widget-list",

    // UI events from the HTML created by this view
    events : {
    },

    /*
        Backbone Methods
    */

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Instantiate our collection and fill it with the array of data objects
    // (representing objects that will be converted into models).
    //
    //  @settings:
    //
    //      Required data object. Contains:
    //
    //      .listData:
    //
    //      an array of objects which will be used to create models in our 
    //      collection.
    //
    //  @options:
    //      any flags that might be useful.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {

        this.settings = settings || {};
        this.options = options || {};

        this.collection = this.instantiateCollection(); /* overload */

        // We have four events on the collection that we care about:
        
        //  (1) Add.
        //  a new model is being added to the collection. we must create a
        //  VBaseRecordEditableContainer-derived class for it. `sort` is
        //  automatically triggered after this.

        this.listenTo(this.collection,"add",this.onAddCollection);

        //  (2) Change.
        //  an existing model has been edited. we have to manually call
        //  `sort` in order to put it in its new correct position.

        this.listenTo(this.collection,"change",this.onChangeCollection);

        //  (3) Remove.
        //  an existing model has been removed from the collection. we
        //  have to remove its associated view.

        this.listenTo(this.collection,"remove",this.onRemoveCollection);

        //  (4) Sort.
        //  the collection is sorted in two situations: (a) adding new
        //  model. (b) editing existing model (manual sort). in either
        //  case we must take the new/edited model's view and move it within 
        //  our view so that it matches its (potentially new) position in the
        //  collection (i.e., the collection itself has been sorted, so now 
        //  let's sort the UI)
        
        this.listenTo(this.collection,"sort",this.onSortCollection);

        // finally, we have an two events that might be triggered on ourselves,
        // by a parent, signifying that a model has been created elsewhere
        // that needs to be added into our list; or that a model from our
        // collection needs to be removed (and removed from UI too).
        this.listenTo(this,"onExternalAdd",this.onExternalAdd);
        this.listenTo(this,"onExternalRemove",this.onExternalRemove);

        // add all of our data objects into the collection as models.
        this.buildCollection(this.settings.listData);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Tell all subviews to cleanup, and then remove ourselves.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {        

        // send a message to any listening views that we're cleaning up.
        this.trigger("cleanup");

        // empty references        
        this.stopListening();
        this.collection = null;
        this.settings = null;
        this.options = null;

        // jsfiddle for super() testing: http://jsfiddle.net/hLjC2/
        return Backbone.View.prototype.remove.call(this);
    },    

    ///////////////////////////////////////////////////////////////////////////
    // There is nothing to do here. As the models are manipulated, they are
    // rendered into our element, and we have no skeleton template that they
    // go inside, so we have nothing to do here. Look at `onSortCollection`
    // for the code that adds the views to our element.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {
        // no-op.
        return this;
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // We go through all of the data objects that we were sent upon construction
    // and create a model using each one as a basis. Those models are added
    // to the collection one-by-one. When 'add' is triggered, the 
    // VBaseWidgetRecordEditable-derived view is created for the model, and
    // when 'sort' is triggered (automatically), that view is placed in the
    // appropriate place in our element.
    ///////////////////////////////////////////////////////////////////////////

    buildCollection : function(listData) {

        for ( var x=0; x < listData.length; x++ ) {

            var newModel = new this.instantiateModel(); /* overload */
            newModel.set(listData[x],{silent:true});
            this.collection.add(newModel,{sbTargetModel:newModel,sbPrevIdx:-1});
            newModel = null;
        }
    },

    /*
        Public Methods
    */

    ///////////////////////////////////////////////////////////////////////////
    // Returns a jQuery object containing all of the DOM elements from
    // VBaseWidgetRecordEditable-derived views that were "selected".
    ///////////////////////////////////////////////////////////////////////////

    getSelected : function() {
        return this.$(".widget-record-editable-selected");
    },

    ///////////////////////////////////////////////////////////////////////////
    // Returns a jQuery object containing all of the DOM elements from
    // VBaseWidgetRecordEditable-derived views that match the given selector.
    ///////////////////////////////////////////////////////////////////////////

    getFilteredRecordViews : function(selector) {
        return this.$(selector);
    },

    ///////////////////////////////////////////////////////////////////////////
    // De-select any VBaseWidgetRecordEditable-derived views that are currently
    // marked as "selected" within our element.
    //
    //  @return: The number of records that were de-selected.
    ///////////////////////////////////////////////////////////////////////////

    clearSelected : function() {
        var selectedRecords = this.$(".widget-record-editable-selected");
        selectedRecords.removeClass("widget-record-editable-selected");
        return selectedRecords.length;
    },

    /*
        Triggered Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on one of the VBaseWidgetRecordEditable-derived
    // views in our list, which has notified us. Pass along the model's attributes,
    // as well as the raw event itself, through triggering the "onClickRecord" event,
    // which our parent is listening for.
    ///////////////////////////////////////////////////////////////////////////

    onClickRecord : function(modelAttributes,event) {
        this.trigger("onClickRecord",modelAttributes,event);
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has flagged one of the VBaseWidgetRecordEditable-derived
    // views in our list, which has notified us. If we have been told to keep
    // the model, then do so. Otherwise, remove it from our list.
    ///////////////////////////////////////////////////////////////////////////

    onRecordFlag : function(model,value,options) {
        if ( !options.sbKeepRecord ) {
            this.collection.remove(model);
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Callbacks triggered when a records in our list is being worked on.
    // Note that nothing NEEDS to be done here, as the records are self-sufficient
    // in this regard.
    ///////////////////////////////////////////////////////////////////////////

    onRecordEdit : function(recordView) {
        this.clearSelected();
        recordView.makeSelected();
    },

    onRecordSave : function(recordView) {
        //no-op.
    },

    onRecordCancel : function(recordView) {
        recordView.removeSelected();
    },

    onRecordDeleteMaybe : function(recordView) {
        this.clearSelected();
        recordView.makeSelected();
    },

    onRecordDeleteYes : function(recordView) {
        //no-op.
    },

    onRecordDeleteNo : function(recordView) {
        recordView.removeSelected();
    },

    ///////////////////////////////////////////////////////////////////////////
    // An attributes hash object has been constructed elsewhere and we have
    // to add it into our collection. By adding it to the collection, the view
    // for it is automatically created, and it is displayed in the proper position
    // in our element. This may come via a `backbone.save` method, or a manual
    // route through our own code.
    //
    //  @attrsObj:
    //      This may or may not be a Backbone.Model. If not, we'll construct one
    //      (of the appropriate type) using the attributes object here for its
    //      values.
    //      
    //  @options:
    //      If we got here via backbone, then this will contain the backbone options
    //      hash. However, no matter what, it may also contain some of our own
    //      proprietary options. These are prefixed with 'sb'.
    //
    ///////////////////////////////////////////////////////////////////////////

    onExternalAdd : function(attrsObj,options) {

        var model = null;        
        if ( !( attrsObj instanceof Backbone.Model ) ) {
            model = this.instantiateModel().set(attrsObj);
        }
        else {
            model = attrsObj;
        }
        this.collection.add(model,_.extend({},{sbTargetModel:model,sbPrevIdx:-1},options));
    },

    ///////////////////////////////////////////////////////////////////////////
    // We are being requested to remove a particular model from our collection
    // from an outside caller. They have sent us a matchingFunc to be run
    // against all the models in our collection. The first model that matches
    // it will be removed.
    //
    //  @return: Boolean for if we removed anything or not.
    //
    ///////////////////////////////////////////////////////////////////////////

    onExternalRemove : function(matchingFunc) {
        var model = this.collection.find(matchingFunc);
        if ( model ) {
            this.collection.remove(model);
            model = null;
            return true;
        }
        return false;
    },

    /*
        Collection Events
    */

    ///////////////////////////////////////////////////////////////////////////
    // Adding a model into our collection. All we do is create a view for it
    // here. Other events (onSort) will take care of actually updating the UI with
    // that view.
    //
    //  @options: From backbone and us as well (fields prefixed with 'sb' if so).
    //
    ///////////////////////////////////////////////////////////////////////////

    onAddCollection : function(model,collection,options) { /* extend as required */

        var view = this.instantiateWidgetRecordEditable( /* overload */
            {
                model:model,
                listSettings:this.settings
            },
            _.extend({},{listOptions:this.options},options)
        );

        this.listenTo(view,"onClickRecord",this.onClickRecord);
        this.listenTo(view,"onRecordFlag",this.onRecordFlag);

        // none of these NEED to do anything. just notification.
        
        this.listenTo(view,"onRecordEdit",this.onRecordEdit);
        this.listenTo(view,"onRecordSave",this.onRecordSave);
        this.listenTo(view,"onRecordCancel",this.onRecordCancel);

        this.listenTo(view,"onRecordDeleteMaybe",this.onRecordDeleteMaybe);
        this.listenTo(view,"onRecordDeleteYes",this.onRecordDeleteYes);
        this.listenTo(view,"onRecordDeleteNo",this.onRecordDeleteNo);

        view.listenTo(this,"cleanup",view.remove);

        return view;
    },

    ///////////////////////////////////////////////////////////////////////////
    // A model has been removed from our collection. Remove its view from
    // the DOM and clear all relevant listeners.
    //
    //  @options: From backbone and us as well (fields prefixed with 'sb' if so).
    //
    ///////////////////////////////////////////////////////////////////////////

    onRemoveCollection : function(model,collection,options) {

        model.trigger("getView",function(view){
            this.stopListening(view);
            view.remove();
        }.bind(this));
    },

    ///////////////////////////////////////////////////////////////////////////
    // An individual model within our collection has successfully been changed
    // and sync'd with the server. Let's re-sort the collection and see if it 
    // needs to move around in the UI.
    //
    //  @options: From backbone and us as well (fields prefixed with 'sb' if so).
    //
    ///////////////////////////////////////////////////////////////////////////

    onChangeCollection : function(model,options) {

        // grab the current idx of the model in the collection and
        // then re-sort manually. this is needed because auto resorts
        // are only done when 'adding' a new model, not changing one.
        var prevIdx = this.collection.indexOf(model);
        this.collection.sort({sbTargetModel:model,sbPrevIdx:prevIdx});
    },    

    ///////////////////////////////////////////////////////////////////////////
    // The collection was just sorted because a new model was added or an
    // old model was edited. And so our model is now in the correct sorted
    // order within the collection. However, that might not be the case for
    // the UI anymore (it definitely won't be the case when "add" was called,
    // as the model's view isn't even in our element yet).
    //
    // So let's grab the model that was worked on, find the model that comes
    // AFTER IT in the collection, and put our view ahead of that model's view
    // in the UI.
    //
    // Note that in this special case, `options` is a misnomer, as they aren't
    // optional. This shouldn't be called generally, only when an individual
    // model needs to be moved into the correct position within our element.
    //
    //  @options:   From backbone and us as well (fields prefixed with 'sb' if so).
    //              Has .sbTargetModel and .sbPrevIdx.
    //
    ///////////////////////////////////////////////////////////////////////////

    onSortCollection : function(collection,options) {

        // grab the new idx of the model that has changed. then we get
        // the model that appears after it in the collection.

        var idx = this.collection.indexOf(options.sbTargetModel);
        var nextModel = this.collection.at(idx+1);

        // if the idx has not changed, then we needn't do anything. if it has
        // then we need to move the view within the UI.

        if ( idx !== options.sbPrevIdx ) {

            // if this is the last model in the view, then we can just append it.
            if ( !nextModel ) {
                options.sbTargetModel.trigger("getView",function(targetModelView){
                    this.$el.append(targetModelView.render().$el);
                }.bind(this));
            }

            // otherwise we have to move it into position above the model that
            // comes after it.
            else {
                nextModel.trigger("getView",function(nextModelView){
                    options.sbTargetModel.trigger("getView",function(targetModelView){
                        nextModelView.$el.before(targetModelView.render().$el);
                    }.bind(this));
                }.bind(this));
            }
        }
    }

});