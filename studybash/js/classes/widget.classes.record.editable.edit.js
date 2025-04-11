//---------------------------------------------------------------------------------------
// View: VWidgetClassesRecordEditableEdit
// Description: One of two possible subViews to a VWidgetClassesRecordEditable. This
//              particular view presents a form for editing the model's attributes.
//---------------------------------------------------------------------------------------

var VWidgetClassesRecordEditableEdit = VBaseWidgetRecordEditableEdit.extend({

    /* overloaded */
    id : undefined, // multiple in DOM
    templateID : "tpl-widget-classes-record-editable-edit",

    className : function() {
        return _.result(VBaseWidgetRecordEditableEdit.prototype,'className') + " widget-classes-record-editable-edit";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetRecordEditableEdit.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our editing form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls. We also have to ask the server for suggestions for the
    // class_name, lecturer_name, and textbook_url fields.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function VWidgetClassesRecordEditableEdit__prepareForm() { /* overloaded */

        // setup some references.

        this.jqoClassName = this.jqoForm.find("input[name=class_name]");
        this.jqoLecturerName = this.jqoForm.find("input[name=lecturer_name]");
        this.jqoTextbookURL = this.jqoForm.find("input[name=textbook_url]");
        this.jqoCompleted = this.jqoForm.find("input[name=completed]");

        // we will have a dictionary with keys of "class_name", "lecturer_name", and "textbook_url". each value is an array
        // of objects, fields are .text and .num_used.
        this.suggestions = null;

        Spinner.get().show({msg:"Loading suggestions...",opacity:0});
            
        var jqXHR = $.ajax({
            url : app.JS_ROOT + "ajax/classes-manual.php/suggestions",
            type : "POST",
            dataType : "json",
            data : JSON.stringify({
                subject_code : this.settings.recordSettings.model.get("subject_code"),
                class_code : this.settings.recordSettings.model.get("class_code"),
                year : this.settings.recordSettings.model.get("year"),
                semester : this.settings.recordSettings.model.get("semester")
            }),
            contentType : "application/json",
            context : this,
            beforeSend : function(jqxhr,options) {
                jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
            },
        })
        .done(function(data,textStatus,jqXHR) {
            this.suggestions = data;
            data = null;
            this.displaySuggestions();
            Spinner.get().hide();
        })
        .fail(function(jqXHR,textStatus,errorThrown) {
            Spinner.get().hide(function(){
                app.dealWithAjaxFail(jqXHR,textStatus,errorThrown);
            });
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // We have received some suggestions from the server regarding the
    // final three fields. Of course, those suggestions might be empty (array).
    // Nevertheless, we will re-init and enable our final three select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    displaySuggestions : function() {

        // (1) class_name

        this.ws_class_name = new WSelect2({
            elem : this.jqoClassName,
            makeElement : null,
            filterSelection : function(choice) {
                return $.leftovers.parse.simple_name_case(choice.id);
            }
        });

        this.ws_class_name.init({
            data : _.map(
                this.suggestions["class_name"],
                function(o){
                    return {
                        id : o.text,
                        text : o.text + " (" + o.num_used + ")"
                    };
                }
            ),
            allowClear : true,
            preventNew : false,
            placeholder : "e.g., Biological Psychology"
        });

        var v = this.settings.recordSettings.model.get("class_name");
        if ( v ) {
            this.ws_class_name.setData({id:v,text:v});
        }

        // (2) lecturer_name

        this.ws_lecturer_name = new WSelect2({
            elem : this.jqoLecturerName,
            makeElement : null,
            filterSelection : function(choice) {
                return $.leftovers.parse.name_case(choice.id);
            }
        });

        this.ws_lecturer_name.init({
            data : _.map(
                this.suggestions["lecturer_name"],
                function(o){
                    return {
                        id : o.text,
                        text : o.text + " (" + o.num_used + ")"
                    };
                }
            ),
            allowClear : true,
            preventNew : false,
            placeholder : "e.g., Victor Frankenstein"
        });

        var v = this.settings.recordSettings.model.get("lecturer_name");
        if ( v ) {
            this.ws_lecturer_name.setData({id:v,text:v});
        }

        // (3) textbook_url

        this.ws_textbook_url = new WSelect2({
            elem : this.jqoTextbookURL,
            makeElement : null,
            filterSelection : function(choice) {
                choice.id = $.trim(choice.id);                
                if ( ( choice.id.indexOf("http://") !== 0 ) && ( choice.id.indexOf("https://") !== 0 ) ) {
                    choice.id = "http://" + choice.id;
                }
                return $.leftovers.parse.cropUrlParms(choice.id);
            }
        });

        this.ws_textbook_url.init({
            data : _.map(
                this.suggestions["textbook_url"],
                function(o){
                    return {
                        id : o.text,
                        text : o.text + " (" + o.num_used + ")"
                    };
                }
            ),
            allowClear : true,
            preventNew : false,
            placeholder : "e.g., amazon.com/Creation-Life-How-Make-It/dp/0674011139/"
        });

        var v = this.settings.recordSettings.model.get("textbook_url");
        if ( v ) {
            this.ws_textbook_url.setData({id:v,text:v});
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the attributes that the user has entered from our form. Parse
    // whatever is needed and then return them again.
    //
    //  @return:
    //      object with fields corresponding to fields in the form.
    //
    ///////////////////////////////////////////////////////////////////////////

    getFormAttrs : function() { /* overloaded */

        // grab the attributes from the form. note that we have
        // to do the select2 instance separately.

        var attrs = this.jqoForm.serialize_object();

        // (1) class_name

        attrs.class_name = this.ws_class_name.getSelection();
        attrs.class_name = attrs.class_name.length ? $.leftovers.parse.simple_name_case($.trim(attrs.class_name[0].id)) : null;        

        // (2) lecturer_name

        attrs.lecturer_name = this.ws_lecturer_name.getSelection();
        attrs.lecturer_name = attrs.lecturer_name.length ? $.leftovers.parse.name_case($.trim(attrs.lecturer_name[0].id)) : null;

        // (3) textbook_url

        attrs.textbook_url = this.ws_textbook_url.getSelection();
        if ( attrs.textbook_url.length ) {
            attrs.textbook_url = $.leftovers.parse.cropUrlParms($.trim(attrs.textbook_url[0].id));
            if ( ( attrs.textbook_url.indexOf("http://") !== 0 ) && ( attrs.textbook_url.indexOf("https://") !== 0 ) ) {
                attrs.textbook_url = "http://" + attrs.textbook_url;
            }
        }
        else {
            attrs.textbook_url = null;
        }

        // (4) completed

        attrs.completed = attrs.completed ? 1 : 0;

        return attrs;
    },

});