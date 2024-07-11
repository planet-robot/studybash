//---------------------------------------------------------------------------------------
// View: VBaseWidgetSlideshow
// Description: This widget has a collection of models which are rendered into a
//              VBaseWidgetRecordEditable-derived view, one at a time. In the view
//              there are two subviews: toolbarView and recordView. We expect there
//              to be at least three buttons on the toolbar: prev, next, and "end".
//              We generate several events here: "onRecordChange", "onClickToolbar",
//              "onEnd".
//
//              You can edit the models through the VBaseWidgetRecordEditable-derived
//              view, but the collection is never re-sorted here. We go through the
//              collection using `idx` which is increased or decreased by 1 everytime
//              prev/next is chosen. Outsiders can mess with the collection, but that
//              is not recommended.
//
//              We expect to be passed an array of objects which will be used as models
//              for the collection, both types of which are determined here.
//---------------------------------------------------------------------------------------

var VBaseWidgetSlideshow = Backbone.View.extend({

    /* overload */
    tagName : "div",
    id : undefined,
    className : "widget widget-slideshow",

    widgetLayoutTemplateID : undefined,
    toolbarElement : undefined,
    recordElement : undefined,

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
    //  @settings. Object containing all the necessary values for our execution.
    //
    //      .objects: Array of objects we'll convert to a collection of models
    //      .startingIdx: Which model index we should start at.
    //
    //  @options. Not used by default.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* extend as required */

        this.settings = settings || {};
        this.options = options || {};

        // this will not change. create it now and set it up.
        this.toolbarView = this.instantiateToolbar();
        this.toolbarView.listenTo(this,"cleanup",this.toolbarView.remove);
        this.listenTo(this.toolbarView,"onClickToolbar",this.onClickToolbar);

        // create our collection and reset its data to all of the data
        // objects that we were sent, thereby creating a collection of
        // models. the only event that we care about here is `remove`,
        // as that will require us to ensure that our current `idx` is
        // still valid.        

        this.collection = this.instantiateCollection();
        this.collection.reset(settings.objects,{sort:false});
        this.listenTo(this.collection,"remove",this.onRemoveCollection);

        // we track our movement through the collection solely with an index.
        this.idx = settings.startingIdx;
        this.idx = ( this.idx < 0 ? 0 : this.idx );
        this.idx = ( this.idx >= this.collection.length ? this.collection.length-1 : this.idx );

        // this is created everytime a record is shown, we will therefore wait
        // until `render` is called to create one.
        this.recordView = null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Tell all subviews to cleanup, and then remove ourselves.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extend as required */

        this.stopListening(this.collection);
        this.stopListening(this.toolbarView);
        this.stopListening(this.recordView);

        // send a message to any listening views that we're cleaning up.
        this.trigger("cleanup");

        // empty references
        this.settings = null;
        this.options = null;
        this.collection = null;        
        this.toolbarView = null;
        this.recordView = null;

        return Backbone.View.prototype.remove.call(this);
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Render the layout for the widget before rendering the toolbar and the
    // record itself. Based upon the current status of the slideshow, update
    // the toolbar buttons regarding what is/isn't enabled. Initially, we'll
    // want "prev" to be disabled, obviously.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        this.$el.html($.includejs.getTemplate(this.widgetLayoutTemplateID));
        this.$(this.toolbarElement).html(this.toolbarView.render().$el);
        this.renderRecord();

        this.updateToolbar();
        
        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render our VBaseWidgetRecordEditable-derived view. If there is one
    // there now, we'll remove it before creating a new one. Notice that we
    // don't need to bind to any of its events, it can be completely autonomous
    // here as we don't resort on changes.
    ///////////////////////////////////////////////////////////////////////////

    renderRecord : function() {

        if ( !this.collection.length ) {
            return;
        }

        if ( this.recordView ) {
            this.stopListening(this.recordView);
            this.recordView.remove();
            this.recordView = null;
        }

        this.recordView = this.instantiateRecord();
        this.listenTo(this.recordView,"onRecordFlag",this.onRecordFlag);
        
        // these three do nothing by default.
        this.listenTo(this.recordView,"onRecordEdit",this.onRecordEdit);
        this.listenTo(this.recordView,"onRecordSave",this.onRecordSave);
        this.listenTo(this.recordView,"onRecordCancel",this.onRecordCancel);
        
        this.recordView.listenTo(this,"cleanup",this.recordView.remove);

        this.$(this.recordElement).html(this.recordView.render().$el);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Based upon the current state of the slideshow (i.e., what record we
    // are on), we'll decide whether "prev" and "next" are enabled. Assume
    // 'end' is always enabled.
    ///////////////////////////////////////////////////////////////////////////

    updateToolbar : function() { /* extend (as required) */

        var toolbarButtonState = this.toolbarView.getEnabled();
        this.toolbarView.setEnabled(_.extend({},toolbarButtonState,{
            prev : (!!this.idx && !!this.collection.length),
            next : (this.idx < this.collection.length-1),
            end : true
        }));
    },

    ///////////////////////////////////////////////////////////////////////////
    // Instantiate our collection, VBaseWidgetToolbar-, and 
    // VBaseWidgetRecordEditable-derived views.
    ///////////////////////////////////////////////////////////////////////////

    instantiateCollection : function() { /* overload */
        // no-op.
        return null;
    },

    instantiateToolbar : function() { /* overload */
        // no-op.
        return null;
    },

    instantiateRecord : function() { /* overload */
        // no-op.
        return null;
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has moved our index within the slideshow. As long as we've
    // moved to a new record (which should always be the case) then we'll
    // render our current record and send an event notification.
    ///////////////////////////////////////////////////////////////////////////

    idxChanged : function(oldIdx) {
        
        if ( !this.collection.length ) {
            this.stopListening(this.recordView);
            this.recordView.remove();
            this.recordView = null;
        }
        else {
            if ( oldIdx !== this.idx ) {
                this.renderRecord();
                this.trigger("onRecordChange",this.idx,this.collection.at(this.idx));
            }
        }

        // as state has changed, we always check what toolbar buttons should be
        // enabled.
        this.updateToolbar();
    },

    /*
        Triggered Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // We will check the three buttons that should normally be present:
    // prev, next, end.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,event) { /* overload/extend as required */

        this.trigger("onClickToolbar",buttonName,event);

        // PREV

        if ( buttonName === "prev" ) {
            var oldIdx = this.idx;
            this.idx = ( this.idx - 1 < 0 ? 0 : this.idx-1 );
            this.idxChanged(oldIdx);
        }

        // NEXT

        else if ( buttonName === "next" ) {
            var oldIdx = this.idx;
            this.idx = ( this.idx + 1 >= this.collection.length ? this.collection.length-1 : this.idx + 1 );
            this.idxChanged(oldIdx);
        }

        // END

        else if ( buttonName === "end" ) {
            this.trigger("onEnd");
        }
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
    // All three of these are no-ops by default. However, you may choose to
    // do something with the events yourself. But nothing NEEDS to be done, is
    // the point.
    ///////////////////////////////////////////////////////////////////////////

    onRecordEdit : function(recordView) {
        //no-op.
    },

    onRecordSave : function(recordView) {
        //no-op.
    },

    onRecordCancel : function(recordView) {
        //no-op.
    },

    /*
        Collection Events
    */

    ///////////////////////////////////////////////////////////////////////////
    // A model has been removed from our collection. We will simply move on
    // to the next one in our collection.
    //
    //  @options: Not used here.
    //
    ///////////////////////////////////////////////////////////////////////////

    onRemoveCollection : function(model,collection,options) {
        this.onClickToolbar("next",null);
    }
});