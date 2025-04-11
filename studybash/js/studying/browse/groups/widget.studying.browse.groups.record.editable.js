//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseGroupsRecordEditable
// Description: This widget simply displays the record's attributes. Editing is not allowed.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseGroupsRecordEditable = VBaseWidgetRecordEditable.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-studying-browse-groups-record-editable",

    className : function() {
        return _.result(VBaseWidgetRecordEditable.prototype,'className') + " widget-groups-studying-groups-record-editable";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditable.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // As the user might be able to edit/delete models here, we need to update
    // the model's urlRoot variable so we know how to contact the server.
    ///////////////////////////////////////////////////////////////////////////

    updateModelURL : function() { /* overloaded */
        this.settings.model.urlRoot = this.settings.model.baseUrlRoot + "/" + this.settings.listSettings.urlIDs.mID;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Based upon our current state, and the particular user that's looking,
    // we will figure out which toolbar buttons are enabled.
    ///////////////////////////////////////////////////////////////////////////

    setToolbarButtonsEnabled : function() { /* overloaded and extended */

        VBaseWidgetRecordEditable.prototype.setToolbarButtonsEnabled.call(this);

        // if we aren't editing, and this isn't a public studygroup, then whether or
        // not we can use certain buttons will depend on our relationship to the group

        if ( ( !this.isEditing ) && ( this.settings.model.get("id") === +this.settings.model.get("id") ) ) {
            this.toolbarView.setEnabled({
                edit : this.settings.model.get("owner_id") === app.store.get("user").id,
                join : !this.settings.model.get("is_user_member"),
                leave : this.settings.model.get("is_user_member"),
                members : true
            });
        }

        // otherwise, everything is disabled except 'members', if it's not our own stuff.
        else {
            this.toolbarView.setEnabled({
                members : ( this.settings.model.get("id") !== "self" )
            });
        }
    },

    instantiateToolbarView : function() { /* overloaded */
        return new VWidgetStudyingBrowseGroupsRecordEditableToolbar();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Specify the VBaseWidgetRecordEditableDisplay- and
    // VBaseWidgetRecordEditableDisplay-derived views we will use here.
    //
    // The settings and options have already been started by our base view.
    // They will include `recordSettings` (which contains `model`) and 
    // `recordOptions`, respectively. Add whatever we need that's unique here.
    ///////////////////////////////////////////////////////////////////////////    

    instantiateDisplayView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseGroupsRecordEditableDisplay(settings,options);
    },

    instantiateEditView : function(settings,options) { /* overloaded */
        return new VWidgetStudyingBrowseGroupsRecordEditableEdit(settings,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // One of the toolbar buttons that is associated directly with this record
    // has been clicked. The base view deals with some of the buttons, and we
    // deal with the leftovers.
    //
    //  @buttonName - the `name` field from the HTML of the buttton.
    //  @event - raw 'click' event data.
    //
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,button,event) { /* overloaded and extend */

        // our base view will deal with `edit`; we will deal with the unique ones
        // here.

        VBaseWidgetRecordEditable.prototype.onClickToolbar.call(this,buttonName,event);

        // JOIN

        if ( buttonName === "join" ) {            
            this.trigger("onRecordJoin",this);
        }

        // LEAVE

        else if ( buttonName === "leave" ) {
            this.trigger("onRecordLeave",this);
        }

        // MEMBERS

        else if ( buttonName === "members" ) {

            // fixme: this should be a template.
            var html = "<ul class='list-group'>";
            var members = this.settings.model.get("members");
            for ( var x=0; x < members.length; x++ ) {
                html += "<li class='list-group-item'>" + members[x].full_name + "</li>";
            }
            html += "</ul>";

            bsDialog.create({                    
                title : "Group Members",
                msg : html,
                ok : function() {}
            });
        }
    },

});