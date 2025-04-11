//---------------------------------------------------------------------------------------
// View:        VBaseWidgetBrowseFormFilter2
// Description: This view houses a form that is filled out and submitted to create a new
//              filter which is applied to users, types, sets, cards. There is no server communication
//              here, just validation.
//---------------------------------------------------------------------------------------

var VBaseWidgetBrowseFormFilter = VBaseWidgetForm.extend({

    /* overload */
    id : undefined,

    templateID : "tpl-widget-browse-form-filter",
    successAlertText : undefined, // not used
    formName : "filter",

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-browse-form-filter";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Remove all references
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {
        this.ws_keywords = null;
        this.ws_tags = null;
        return VBaseWidgetForm.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Setup the select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // (1) build the keywords select2 instance.

        this.ws_keywords = new WSelect2({
            elem : this.jqoForm.find("input[name=keywords]"),
            makeElement : null,
            filterSelection : function(obj) {
                return $.trim(obj.text).toLowerCase();
            }
        });

        this.ws_keywords.init({
            tags : [],
            defaultTags : ( app.store.has("card.filter.keywords") ? app.store.get("card.filter.keywords") : [] ),
            preventNew : false,
            tokenSeparators : [","," "]
        });

        // (2) build the tags select2 instance.

        this.ws_tags = new WSelect2({
            elem : this.jqoForm.find("input[name=tags]"),
            makeElement : null,
            filterSelection : null
        });

        this.ws_tags.init({
            tags : _.map(
                app.store.get("card.tags"),
                function(o){
                    return {
                        id : o.id,
                        text : o.tag_text
                    }
                }
            ),
            defaultTags : [],
            preventNew : true
        });

        // if we've previously set some, display them again. we
        // do this through `set`, rather than `defaultTags`, because
        // this preserves the id/text separation on the defaults. if
        // we did `defaultTags` the id/text would be both equal to
        // the string displayed, which is not what we want.

        if ( app.store.has("card.filter.tags") ) {
            this.ws_tags.set(app.store.get("card.filter.tags"));
        }

    },

    ///////////////////////////////////////////////////////////////////////////
    // We never want to do this here, as it's always a sort of editing-style
    // form (values persist until cleared elsewhere).
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overloaded */
        // no-op.
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the form fields from our select2 instances.
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        var attrs = {};

        // pull out all of the keywords
        attrs.keywords = _.pluck(
            this.ws_keywords.getSelection(),
            'text'
        );
        
        // pull out all the tags. notice that we do not care about
        // their text, we simply grab the id of the tag, as that is
        // how they are stored in the db. they are also sorted
        // alphabetically, by their text (before being reduced to their
        // id).

        attrs.tags = _.map(
            _.sortBy(
                this.ws_tags.getSelection(),
                function(o){
                    return o.text;
                }
            ),
            function(o){
                return o.id;
            }
        );

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the filter information.
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function(attrs) { /* overloaded */

        // (1) keywords - no duplicates

        if ( attrs.keywords && attrs.keywords.length ) {

            var uniqKeywords = _.uniq(attrs.keywords);
            if ( uniqKeywords.length !== attrs.keywords.length ) {
                return {
                    msg : "<strong>Keywords</strong>: No duplicates",
                    field : "keywords"
                };
            }
        }

        // (2) tags - no duplicates

        if ( attrs.tags && attrs.tags.length ) {

            var uniqTags = _.uniq(attrs.tags);
            if ( uniqTags.length !== attrs.tags.length ) {
                return {
                    msg : "<strong>Tags</strong>: No duplicates",
                    field : "tags"
                };
            }
        }

        // return nothing on success
    }
});