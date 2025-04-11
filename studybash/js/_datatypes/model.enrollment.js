//---------------------------------------------------------------------------------------
// Model: Enrollment
// Description: Holds a single `enrollment` record (e.g., PSYC 101, Fall, 2013, Dr. X, ...)
//---------------------------------------------------------------------------------------

var EnrollmentModel = Backbone.Model.extend({

    defaults : {
        subject_code : undefined,
        class_code : undefined,
        semester : undefined,
        semester_order_id : undefined,
        semester_description : undefined, // e.g., Jan - Apr
        year : undefined,
        class_name : null, // optional
        lecturer_name : null, // optional
        textbook_url : null, // optional
        completed : undefined
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup all the backbone-related events that we are interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // the url we use to save a single model - when working with more
        // than one (i.e., loading) we use the collection
        this.urlRoot = app.JS_ROOT + "ajax/classes-backbone.php";        

        this.listenTo(this,"all",function(){
            //console.log("MEnrollment.onAll ==> " + arguments[0]);
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // `sync` is called every time a model is either read or saved from/to the
    // server. We use this to send our user token along, to prevent CSRF/XSRF
    // attacks.
    // @CSRF/XSRF: http://www.codinghorror.com/blog/2008/10/preventing-csrf-and-xsrf-attacks.html
    ///////////////////////////////////////////////////////////////////////////

    sync : function(method,model,options) {

        // .beforeSend is an option for $.ajax (http://api.jquery.com/jQuery.ajax/)
        // to get at headers: http://stackoverflow.com/questions/541430/how-do-i-read-any-request-header-in-php
        options.beforeSend = function(jqxhr,options) {
            jqxhr.setRequestHeader("SESSIONTOKEN",app.store.get("user").token);
        };

        return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the model. Here we go through all of the attributes of the
    // model and ensure that they are valid.
    // @return - object containing .msg and .field on error, nothing on success
    ///////////////////////////////////////////////////////////////////////////

    validate : function(attrs,options) {

        // Required Data

        // (1) check the subject/class codes

        if ( ( !attrs.subject_code ) || ( !attrs.class_code ) ) {
            return {
                msg : "<strong>Subject/Class Code</strong>: Format is, e.g., PSYC 101",
                field : "codes"
            };
        }
            
        var re = new RegExp("^[A-Z]{3,6}$");
        if ( !re.test(attrs.subject_code) ) {
            return {
                msg : "<strong>Subject Code</strong>: 3-6 chars long, charset: [<em>A-Z</em>]",
                field : "codes"
            };
        }

        re = new RegExp("^[-A-Z0-9.]{3,12}$");
        if ( !re.test(attrs.class_code) ) {
            return {
                msg : "<strong>Class Code</strong>: 3-12 chars long, charset: <em>A-Z</em>, <em>0-9</em>, <em>-.</em>",
                field : "codes"
            };
        }

        // (2) check the year

        if ( !attrs.year ) {
            return {
                msg : "<strong>Year</strong>: Please pick a year",
                field : "year"
            };
        }

        // (3) check the semester
        
        if ( !attrs.semester ) {
            return {
                msg : "<strong>Semester</strong>: Please pick a semester",
                field : "semester"
            };
        }        

        // Optional Data.

        // (4) check the class name

        if ( attrs.class_name && attrs.class_name.length ) {
            
            if ( ( attrs.class_name.length < 4 ) || ( attrs.class_name.length > 64 ) ) {
                return {
                    msg : "<strong>Class Name</strong>: Please make it between 4-64 chars",
                    field : "class_name"
                };
            }

            re = new RegExp("^[-,+ A-z0-9()']+$");
            if ( !re.test(attrs.class_name) ) {
                return {
                    msg : "<strong>Class Name</strong>: Available charset: <em>A-z</em>, <em>0-9</em>, <em>-.!&,()'</em>",
                    field : "class_name"
                };
            }
        }

        // (5) check the lecturer name

        if ( attrs.lecturer_name && attrs.lecturer_name.length ) {
            
            if ( ( attrs.lecturer_name.length < 4 ) || ( attrs.lecturer_name.length > 64 ) ) {
                return {
                    msg : "<strong>Lecturer Name</strong>: Please make it between 4-64 chars",
                    field : "lecturer_name"
                };
            }

            re = new RegExp("^[-. A-Za-z0-9()]+$");
            if ( !re.test(attrs.lecturer_name) ) {
                return {
                    msg : "<strong>Lecturer Name</strong>: Available charset: <em>A-z</em>, <em>0-9</em>, <em>-.()</em>",
                    field : "lecturer_name"
                };
            }
        }

        // (6) check the textbook URL

        if ( attrs.textbook_url && attrs.textbook_url.length ) {
            
            if ( attrs.textbook_url.length > 128 ) {
                return {
                    msg : "<strong>Textbook URL</strong>: Please make it less than 128 chars",
                    field : "textbook_url"
                };
            }

            // source: http://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
            re = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|(www\\.)?){1}([0-9A-Za-z-\\.@:%_\‌​+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");
            if ( !re.test(attrs.textbook_url) ) {
                return {
                    msg : "<strong>Textbook URL</strong>: Please make it a valid URL (or leave it empty)",
                    field : "textbook_url"
                };
            }
        }

        // if it passed we are not supposed to return anything.
    }

});