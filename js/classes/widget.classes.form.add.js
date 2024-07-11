//---------------------------------------------------------------------------------------
// View: VWidgetClassesFormAdd
// Description: This form is used by the user to create a new enrollment. They select
//              the class they want (or enter a new one) and then pick the year and semesters.
//              All of those fields have the number of users enrolled in that particular
//              class/year/semester combo listed.
//
//              Once they've chosen those three things, we offer suggestions to them
//              in the "class_name", "lecturer_name", and "textbook_url" fields. All of which
//              can be ignored by the user.
//
//              We are working with an EnrollmentModel here. Two events are created:
//              "onFormSave" and "onFormCancel". These are triggered when the form
//              has actually been saved (i.e., model pushed to server), or when the
//              user clicks cancel.
//
//              We are capturing the events of our select2 instances, as when they are
//              changed we need to change the values in some of the other instances.
//              
//---------------------------------------------------------------------------------------

var VWidgetClassesFormAdd = VBaseWidgetFormCreate.extend({

    /* overloaded */
    id : "widget-classes-form-add",
    templateID : "tpl-widget-classes-form-add",
    successAlertText : undefined,
    requestText : "Adding...",
    formName : "add",

    className : function() {
        return _.result(VBaseWidgetFormCreate.prototype,'className') + " widget-classes-form-add";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetFormCreate.prototype,'events'),{
            "change input[name=codes]" : "onChangeCodes",
            "change input[name=year]" : "onChangeYear",
            "change input[name=semester]" : "onChangeSemester"
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is the data type that we will be creating through our form.
    ///////////////////////////////////////////////////////////////////////////

    instantiateModel : function() { /* overloaded */
        var model = new EnrollmentModel();
        return model;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our form has already been rendered. However, there is some manual
    // work that we have to do in order to convert the hidden inputs into
    // select2 controls. We will store some references to our select2 controls
    // and prepare the "codes" control. The other ones will be setup with
    // empty values and be disabled.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overloaded */

        // grab references to all of the select2 controls in the form
        
        this.jqoCodes = this.jqoForm.find("input[name=codes]");
        this.jqoYear = this.jqoForm.find("input[name=year]");
        this.jqoSemester = this.jqoForm.find("input[name=semester]");
        this.jqoClassName = this.jqoForm.find("input[name=class_name]");
        this.jqoLecturerName = this.jqoForm.find("input[name=lecturer_name]");
        this.jqoTextbookURL = this.jqoForm.find("input[name=textbook_url]");
        this.jqoCompleted = this.jqoForm.find("input[name=completed]");

        // (1) subject/class codes.
        // the classes that have previously been enrolled in were loaded in `loadData`
        // and can be found in `this.settings.generalEnrollment`. that's a dictionary
        // with each "SUBJECT_CODE CLASS_CODE" as a key. the value is an object
        // which tells us how many users are in the class (in any year/semester).
        // we'll pull out just the codes here for now.

        this.enrolledCodes = [];
        var generalEnrollment = this.settings.generalEnrollment;
        for ( var code in generalEnrollment ) {
            if ( generalEnrollment.hasOwnProperty(code) ) {
                this.enrolledCodes.push(code);
            }
        }

        // create the select2.

        this.ws_codes = new WSelect2({
            elem : this.jqoCodes,
            makeElement : null,
            filterSelection : function(choice) {
                return choice.id.toUpperCase();
            }
        });

        // .text is displayed to user. we are going to use the code string
        // with (#) appended on the end.

        this.ws_codes.init({
            data : _.map(
                this.enrolledCodes,
                function(code){
                    var r = {};
                    r.id = code;
                    r.text = r.id + " (" + generalEnrollment[code].count + ")";
                    return r;
                }
            ),
            preventNew : false,
            placeholder : "e.g., PSYC 101"
        });

        // now, the year and semester select2s are disabled until we have chosen a value for
        // the select2 above them in the form. class_name, lecturer_name, and textbook_url are
        // disabled until we have selected a code, year, and semester.

        // (2) year.

        this.ws_year = new WSelect2({
            elem : this.jqoYear,
            makeElement : null,
            filterSelection : function(choice) {
                return choice.id;
            }
        });

        this.ws_year.init({
            data : [],
            preventNew : true,
            placeholder : "e.g., " + new Date().getFullYear()
        });

        this.ws_year.disable();

        // (3) semester.

        this.ws_semester = new WSelect2({
            elem : this.jqoSemester,
            makeElement : null,
            filterSelection : function(choice) {
                return choice.id;
            }
        });

        this.ws_semester.init({
            data : [],
            preventNew : true,
            placeholder : "e.g., Fall"
        });

        this.ws_semester.disable();

        // (4) class_name.

        this.ws_class_name = new WSelect2({
            elem : this.jqoClassName,
            makeElement : null,
            filterSelection : function(choice) {
                return $.leftovers.parse.simple_name_case(choice.id);
            }
        });

        this.ws_class_name.init({
            data : [],
            preventNew : true,
            placeholder : "e.g., Biological Psychology"
        });

        this.ws_class_name.disable();

        // (5) lecturer_name.

        this.ws_lecturer_name = new WSelect2({
            elem : this.jqoLecturerName,
            makeElement : null,
            filterSelection : function(choice) {
                return $.leftovers.parse.name_case(choice.id);
            }
        });

        this.ws_lecturer_name.init({
            data : [],
            preventNew : true,
            placeholder : "e.g., Victor Frankenstein"
        });

        this.ws_lecturer_name.disable();

        // (6) textbook_url

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
            data : [],
            preventNew : true,
            placeholder : "e.g., http://amazon.com/Creation-Life-How-Make-It/dp/0674011139/"
        });

        this.ws_textbook_url.disable();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Removing ourself from the DOM.
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        // empty references
        
        this.jqoCodes = null;
        this.jqoYear = null;
        this.jqoSemester = null;
        this.jqoClassName = null;
        this.jqoLecturerName = null;
        this.jqoTextbookURL = null;
        this.jqoCompleted = null;

        this.enrolledCodes = null;
        this.ws_codes = null;
        this.ws_year = null;
        this.ws_semester = null;
        this.ws_class_name = null;
        this.ws_lecturer_name = null;
        this.ws_textbook_url = null;

        return VBaseWidgetFormCreate.prototype.remove.call(this);
    },

    /*
        Utility Functions
    */

    ///////////////////////////////////////////////////////////////////////////
    // Pull out the respective values from the first three select2 controls:
    // codes, year, semester.
    ///////////////////////////////////////////////////////////////////////////

    getSelectedCodes : function() {
        
        var sel = this.ws_codes.getSelection();
        if ( sel && sel.length ) {
            sel = sel[0].id.split(" ");
            sel = { subject_code : sel[0], class_code : sel[1], isNew : sel[0].isNew };
        }
        else {
            sel = {};
        }

        return sel;
    },

    getSelectedYear : function() {

        var sel = this.ws_year.getSelection();
        if ( sel && sel.length ) {
            sel = +sel[0].id;
        }
        else {
            sel = null;
        }

        return sel;
    },

    getSelectedSemester : function() {

        var sel = this.ws_semester.getSelection();
        if ( sel && sel.length ) {
            sel = sel[0].id;
            sel = _.find(
                app.store.get("semesters"),
                function(o){
                    return o.name === sel;
                }
            );
        }
        else {
            sel = {};
        }

        return sel;
    },

    /*
        UI Events
    */

    ///////////////////////////////////////////////////////////////////////////
    // User has chosen a subject/class code in the select2. we are now going
    // to enable only the year select2. but first we have to grab the enrollment
    // data for the class code and fill in our options for `year`.
    ///////////////////////////////////////////////////////////////////////////

    onChangeCodes : function(event) {

        // disable everything but `year`.

        this.ws_semester.disable();
        this.ws_class_name.disable();
        this.ws_lecturer_name.disable();
        this.ws_textbook_url.disable();

        if ( !event.added ) {
            this.ws_year.disable();
            return;
        }

        var selectedClass = event.added.id.toUpperCase();

        // now we have to setup the values that will be in the
        // year select2 instance. this is all the years that
        // are available to the user, along with the number
        // of users that are enrolled in this class in that year.

        var yearsAfter = app.store.get("classes.years.after");
        var yearsBefore = app.store.get("classes.years.before");

        var classEnrollment = event.added.isNew ? null : this.settings.generalEnrollment[selectedClass];
        var data = [];

        // go through all of the years that are available to the user.
        // if we have some enrollment information for this class
        // in that year, then we'll add it to the option.

        var currentYear = new Date().getFullYear();
        for ( var year = currentYear+yearsAfter; year >= currentYear-yearsBefore; year-- ) {
            
            var text = year.toString();

            if ( classEnrollment && classEnrollment.years.hasOwnProperty(year) ) {
                text += " (" + (+classEnrollment.years[year].count) + ")";
            }
            else if ( classEnrollment ) {
                text += " (0)";
            }

            // add that as an option for the select2. remember that
            // `text` is shown to user, and `id` is returned.

            data.push({
                id : year.toString(),
                text : text
            });
        }

        // re-init the `year` control. enable it.

        this.ws_year.init({
            data : data,
            preventNew : true,
            placeholder : "e.g., " + currentYear
        });

        this.ws_year.enable();
    },

    ///////////////////////////////////////////////////////////////////////////
    // User has chosen a year from the appropriate select2 control. We can
    // now enable the `semester` control and populate it with enrollment info
    // if there is any for this class/year combo.
    ///////////////////////////////////////////////////////////////////////////

    onChangeYear : function(event) {

        // disable everything below `semester`.

        this.ws_class_name.disable();
        this.ws_lecturer_name.disable();
        this.ws_textbook_url.disable();

        if ( !event.added ) {
            this.ws_semester.disable();
            return;
        }

        // now we have to setup the values to appear in the
        // `semester` control. to do this, we need to know what
        // class code we're working with, as well as the year.

        var year = +event.added.id;
        var classCode = this.getSelectedCodes();
        classCode = classCode.isNew ? null : ( classCode.subject_code + " " + classCode.class_code );

        // we are going to go through the semester names that we've been
        // storing in `app.store`. if there is enrollment information
        // to add to it then we will.

        var data = [];
        var semesters = app.store.get("semesters");
        var semesterEnroll = this.settings.generalEnrollment[classCode];
        semesterEnroll = semesterEnroll ? semesterEnroll.years[year] : null;

        for ( var semester=0; semester < semesters.length; semester++ ) {

            var text = semesters[semester].name + " [" + semesters[semester].description + "]";

            if ( semesterEnroll && semesterEnroll.semesters.hasOwnProperty(semesters[semester].name) ) {
                text += " (" + semesterEnroll.semesters[semesters[semester].name] + ")";
            }
            else if ( semesterEnroll ) {
                text += " (0)";
            }

            // remember that `text` is displayed to the user, and `id` is returned to us.
            data.push({
                id : semesters[semester].name,
                text : text
            });
        }

        // now re-init our semester control, with the data we just generated for it.

        this.ws_semester.init({
            data : data,
            preventNew : true,
            placeholder : "e.g., Fall"
        });

        this.ws_semester.enable();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has chosen a semester. This means that we can now get the
    // suggestions from the server regarding the "class_name", "lecturer_name",
    // and "textbook_url" fields.
    ///////////////////////////////////////////////////////////////////////////

    onChangeSemester : function VWidgetClassesFormAdd__onChangeSemester(event) {

        // disable everything below `semester`.

        this.ws_class_name.disable();
        this.ws_lecturer_name.disable();
        this.ws_textbook_url.disable();

        if ( !event.added ) {
            return;
        }

        // we will have a dictionary with keys of "class_name", "lecturer_name", and "textbook_url". each value is an array
        // of objects, fields are .text and .num_used.
        this.suggestions = null;

        // grab the information from codes and year controls. we have to tell
        // the server what module we are looking up. if the class codes are new, then
        // we won't bother looking up anything. NOTE: we do not want the server
        // to return an error if it can't find the module in question (which is possible
        // if no one has enrolled in the specific year/semester combo). these are just
        // suggestions, and it's possible that someone removed themselves from a year/semester
        // module after the user first visited the page, so no need to crash if they request
        // info for a module that doesn't exist. they just get empty response.

        var codes = this.getSelectedCodes();
        var year = this.getSelectedYear();
        var semester = event.added.id;

        if ( codes.isNew ) {
            this.suggestions = [];
            this.displaySuggestions();
        }

        // they are picking an existing class that others have enrolled in. let's ask the server
        // for the most popular suggestions regarding class_name, lecturer_name, textbook_url.

        else {

            Spinner.get().show({msg:"Loading suggestions...",opacity:0});
            
            var jqXHR = $.ajax({
                url : app.JS_ROOT + "ajax/classes-manual.php/suggestions",
                type : "POST",
                dataType : "json",
                data : JSON.stringify({
                    subject_code : codes.subject_code,
                    class_code : codes.class_code,
                    year : year,
                    semester : semester
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
        }        
    },

    ///////////////////////////////////////////////////////////////////////////
    // We have received some suggestions from the server regarding the
    // final three fields. Of course, those suggestions might be empty (array).
    // Nevertheless, we will re-init and enable our final three select2 controls.
    ///////////////////////////////////////////////////////////////////////////

    displaySuggestions : function() {

        // (1) class_name

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

        this.ws_class_name.enable();

        // (2) lecturer_name

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

        this.ws_lecturer_name.enable();        

        // (3) textbook_url

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
            placeholder : "e.g., http://amazon.com/Creation-Life-How-Make-It/dp/0674011139/"
        });

        this.ws_textbook_url.enable();
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

        // (1) codes
        
        var codes = this.getSelectedCodes();
        attrs.subject_code = $.trim(codes.subject_code).toUpperCase();
        attrs.class_code = $.trim(codes.class_code).toUpperCase();

        // (2) year

        attrs.year = +this.getSelectedYear();

        // (3) semester

        attrs.semester = $.trim(this.getSelectedSemester().name);

        // (4) class_name

        attrs.class_name = this.ws_class_name.getSelection();
        attrs.class_name = attrs.class_name.length ? $.leftovers.parse.simple_name_case($.trim(attrs.class_name[0].id)) : null;        

        // (5) lecturer_name

        attrs.lecturer_name = this.ws_lecturer_name.getSelection();
        attrs.lecturer_name = attrs.lecturer_name.length ? $.leftovers.parse.name_case($.trim(attrs.lecturer_name[0].id)) : null;

        // (6) textbook_url

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

        // (7) completed

        attrs.completed = attrs.completed ? 1 : 0;

        return attrs;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to be saved to the server, as there was an error.
    // Display that error now.
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VWidgetClassesFormAdd__onModelError(model,xhr,options) { /* overloaded */
        
        Spinner.get().hide(function(){

            var userError = app.getAjaxUserError(xhr);

            if ( ( xhr.status === 400 ) && ( userError ) && ( userError.type === "enrollment" ) ) {

                bsDialog.create({
                    title : "Error!",
                    msg : "<p>Failed to enroll. Are you already enrolled in that class?</p>",
                    ok : function() {}
                });
            }
            else {
                app.dealWithAjaxFail(xhr,null,null);
            }

        });
    }    

});