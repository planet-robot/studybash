//---------------------------------------------------------------------------------------
// View: VWidgetTestsTakeDoingRecordEditableDisplay
// Description: One of two possible subViews to a VWidgetTestsTakeDoingRecordEditable.
//              This particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetTestsTakeDoingRecordEditableDisplay = VBaseWidgetRecordEditableDisplay.extend({

    /* overloaded */
    id : "widget-tests-take-doingrecord-editable-display",
    templateID : "tpl-widget-tests-take-doing-record-editable-display",

    className : function() {
        return _.result(VBaseWidgetRecordEditableDisplay.prototype,'className') + " widget-record-editable-display-flashcard widget-tests-take-doing-record-editable-display";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableDisplay.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Any escaping of the text attributes or manipulation of the attributes in
    // any way/shape/form must be done here. Always operate on/return a cloned
    // copy of the model's attributes. Notice that we're using the options that
    // we had set at construction.
    ///////////////////////////////////////////////////////////////////////////

    filterModelAttributes : function() { /* overloaded */
        
        var attrs = _.clone(this.settings.recordSettings.model.attributes);

        // we use the pagedown markup on both the question and answer text.

        attrs.question_text = app.markdownSanitizerConverter.makeHtml(attrs.question_text);
        if ( attrs.answer_text ) {
            attrs.answer_text = app.markdownSanitizerConverter.makeHtml(attrs.answer_text);
        }

        // we are adding in a proprietary field here.
        attrs.isShowingAnswer = this.options.recordOptions.isShowingAnswer;
        attrs.isShowingTags = this.options.recordOptions.isShowingTags;

        return attrs;
    }

});