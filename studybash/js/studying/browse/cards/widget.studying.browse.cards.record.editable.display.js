//---------------------------------------------------------------------------------------
// View: VWidgetStudyingBrowseCardsRecordEditableDisplay
// Description: One of two possible subViews to a VWidgetStudyingBrowseCardsRecordEditable.
//              This particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetStudyingBrowseCardsRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : "widget-studying-browse-cards-record-editable-display",
    templateID : "tpl-widget-studying-browse-cards-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-record-editable-display-flashcard widget-studying-browse-cards-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Any escaping of the text attributes or manipulation of the attributes in
    // any way/shape/form must be done here. Always operate on/return a cloned
    // copy of the model's attributes.
    ///////////////////////////////////////////////////////////////////////////

    filterModelAttributes : function() { /* overloaded */
        
        var attrs = _.clone(this.settings.recordSettings.model.attributes);

        // we use the pagedown markup on both the question and answer text.

        attrs.question_text = app.markdownSanitizerConverter.makeHtml(attrs.question_text);
        if ( attrs.answer_text ) {
            attrs.answer_text = app.markdownSanitizerConverter.makeHtml(attrs.answer_text);
        }

        return attrs;
    }

});