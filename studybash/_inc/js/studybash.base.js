//---------------------------------------------------------------------------------------
// Collection: FlashcardCollection
// Description: A collection of flashcard models. Sorted by order_id.
//---------------------------------------------------------------------------------------

var CardsCollection = Backbone.Collection.extend({

    model : function(attrs,options) {
        return new CardModel(attrs,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup the backbone-related events that we're interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // when loading the collection, this is the url we contact. note
        // that fetch is the only operation on the collection that involves
        // the server - the rest are done on models directly.
        this.url = app.JS_ROOT + "ajax/studying/cards-backbone.php";

    	this.listenTo(this,"all",function(){
            //console.log("FlashcardCollection.onAll ==> " + arguments[0]);
        });

        // assume ascending sort.
        this.isAscending = true;
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
    		jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
    	};

    	return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // `comparator` is used by the sort function on our collection in order
    // to know how to properly order the models.
    // @returns: -1 for 'a' comes first, +1 for 'b' comes first, 0 for equal
    ///////////////////////////////////////////////////////////////////////////

    comparator : function(a,b) {

        var a_first = (
            ( a.get("order_id") < b.get("order_id") ) ||
            ( ( a.get("order_id") === b.get("order_id") ) && ( a.get("id") < b.get("id") ) )
        );

        if ( a_first ) {
            return -1 * [-1,1][+!!this.isAscending];
        }

        // now check for equality. if not, b comes first.

        var equal  = (
            ( a.get("order_id") === b.get("order_id") ) &&
            ( a.get("id") === b.get("id") )
        );

        return equal ? 0 : ( +1*[-1,1][+!!this.isAscending] );
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is called when the collection of models is returned from the
    // server. If you want to manipulate the data before backbone gets ahold
    // of it, this is the place.
    //
    //  @response - this is the `data` returned from the AJAX call. Backbone
    //              expects it to be an array of objects after this function
    //              is through. so if you return an object with other info
    //              inside it, then you need extract that here, put it somewhere
    //              else, and then set `response` to the array of objects that
    //              backbone is expecting.
    //
    ///////////////////////////////////////////////////////////////////////////

    parse : function(response,options) {

        // no-op: just pass along what we received.
    	return response;
    }
});

//---------------------------------------------------------------------------------------
// Collection: CardsCollectionUnsorted
// Description: Exactly the same as CardsCollection except `comparator` has been
//              overloaded as a no-op.
//---------------------------------------------------------------------------------------

var CardsCollectionUnsorted = CardsCollection.extend({

    ///////////////////////////////////////////////////////////////////////////
    // `comparator` is used by the sort function on our collection in order
    // to know how to properly order the models.
    // @returns: -1 for 'a' comes first, +1 for 'b' comes first, 0 for equal
    ///////////////////////////////////////////////////////////////////////////

    comparator : function(a,b) {
        //no-op.
    }
    
});

//---------------------------------------------------------------------------------------
// Collection: EnrollmentCollection
// Description: Holds all of the EnrollmentModel instances, both active and completed.
//              This keeps them sorted, with most recent, 'active' first.
//---------------------------------------------------------------------------------------

var EnrollmentCollection = Backbone.Collection.extend({

    // each element is an EnrollmentModel    
    model : function(attrs,options) {
        return new EnrollmentModel(attrs,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup the backbone-related events that we're interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // when loading the collection, this is the url we contact
        this.url = app.JS_ROOT + "ajax/classes-backbone.php";

    	this.listenTo(this,"all",function(){
            //console.log("CEnrollment.onAll ==> " + arguments[0]);
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
    // `comparator` is used by the sort function on our collection in order
    // to know how to properly order the models.
    // @returns: -1 for 'a' comes first, +1 for 'b' comes first, 0 for equal
    ///////////////////////////////////////////////////////////////////////////

    comparator : function(a,b) {

        // first look for 'a' coming first.

    	var a_first = (
            ( a.get("completed") < b.get("completed") ) ||
            ( ( a.get("completed") == b.get("completed") ) && ( a.get("year") > b.get("year") ) ) ||
            ( ( a.get("completed") == b.get("completed") ) && ( a.get("year") == b.get("year") ) && ( a.get("semester_order_id") > b.get("semester_order_id") ) ) ||
            ( ( a.get("completed") == b.get("completed") ) && ( a.get("year") == b.get("year") ) && ( a.get("semester_order_id") == b.get("semester_order_id") ) && ( a.get("subject_code") < b.get("subject_code") ) ) ||
            ( ( a.get("completed") == b.get("completed") ) && ( a.get("year") == b.get("year") ) && ( a.get("semester_order_id") == b.get("semester_order_id") ) && ( a.get("subject_code") == b.get("subject_code") ) && ( a.get("class_code") < b.get("class_code") ) )
        );

        if ( a_first ) {
        	return -1;
        }

        // now check for equality. if not, b comes first.

        var equal  = (
            ( a.get("completed") == b.get("completed") ) && 
            ( a.get("year") == b.get("year") ) && 
            ( a.get("semester_order_id") == b.get("semester_order_id") ) && 
            ( a.get("subject_code") == b.get("subject_code") ) && 
            ( a.get("class_code") == b.get("class_code") )
        );

        return equal ? 0 : +1;
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is called when the collection of models is returned from the
    // server. If you want to manipulate the data before backbone gets ahold
    // of it, this is the place.
    ///////////////////////////////////////////////////////////////////////////

    parse : function(response,options) {
        
        // no-op: just pass it along.
    	return response;
    }
});

//---------------------------------------------------------------------------------------
// Collection: GroupsCollection
// Description: A collection for study groups; including studygroup, public, and private.
//---------------------------------------------------------------------------------------

var GroupsCollection = Backbone.Collection.extend({

    model : function(attrs,options) {
        return new GroupModel(attrs,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup the backbone-related events that we're interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {
    },

    ///////////////////////////////////////////////////////////////////////////
    // `comparator` is used by the sort function on our collection in order
    // to know how to properly order the models.
    // @returns: -1 for 'a' comes first, +1 for 'b' comes first, 0 for equal
    ///////////////////////////////////////////////////////////////////////////

    comparator : function(a,b) {

    	var aIsPrivate = ( +a.get("id") === a.get("id") );
    	var bIsPrivate = ( +b.get("id") === b.get("id") );

        // first look for 'a' coming first. ascending order.

        var a_first = (
            ( a.get("id") === "self" ) ||
            ( ( a.get("id") === "pub" ) && ( bIsPrivate ) ) ||
            ( ( aIsPrivate === bIsPrivate === true ) && ( a.get("is_user_member") < b.get("is_user_member") ) ) ||
            ( ( aIsPrivate === bIsPrivate === true ) && ( a.get("is_user_member") === b.get("is_user_member") ) && ( a.get("is_user_owner") > b.get("is_user_owner") ) ) ||
            ( ( aIsPrivate === bIsPrivate === true ) && ( a.get("is_user_member") === b.get("is_user_member") ) && ( a.get("is_user_owner") === b.get("is_user_owner") ) && ( a.get("owner_last_name") < b.get("owner_last_name") ) ) ||
            ( ( aIsPrivate === bIsPrivate === true ) && ( a.get("is_user_member") === b.get("is_user_member") ) && ( a.get("is_user_owner") === b.get("is_user_owner") ) && ( a.get("owner_last_name") === b.get("owner_last_name") ) && ( a.get("owner_first_name") < b.get("owner_first_name") ) )
        );

        if ( a_first ) {
            return -1;
        }

        // now check for equality. if not, b comes first. remember that there
        // can only be one "self" and one "pub".

        var equal  = (
            ( aIsPrivate === bIsPrivate === true ) && 
            ( a.get("is_user_member") === b.get("is_user_member") ) &&
            ( a.get("is_user_owner") === b.get("is_user_owner") ) &&
            ( a.get("owner_last_name") === b.get("owner_last_name") ) &&
            ( a.get("owner_first_name") === b.get("owner_first_name") )
        );

        return equal ? 0 : +1;
    },
    
});

//---------------------------------------------------------------------------------------
// Collection: SetsCollection
// Description: A collection for fc set models. Sorted alphabetically by default, by name 
//              and then description.
//---------------------------------------------------------------------------------------

var SetsCollection = Backbone.Collection.extend({

    model : function(attrs,options) {
        return new SetModel(attrs,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup the backbone-related events that we're interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // when loading the collection, this is the url we contact. note
        // that fetch is the only operation on the collection that involves
        // the server - the rest are done on models directly.
        this.url = app.JS_ROOT + "ajax/studying/sets-backbone.php";

    	this.listenTo(this,"all",function(){
            //console.log("CSets.onAll ==> " + arguments[0]);
        });

        // we have two possible sort criteria: "name", "cards"
        this.sortCriteria = "name";

        // assume ascending sort.
        this.isAscending = true;
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
    		jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
    	};

    	return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // `comparator` is used by the sort function on our collection in order
    // to know how to properly order the models.
    // @returns: -1 for 'a' comes first, +1 for 'b' comes first, 0 for equal
    ///////////////////////////////////////////////////////////////////////////

    comparator : function(a,b) {

        // sorting by cards (sort by name when equal)

        if ( this.sortCriteria === "cards" ) {

            var fieldName = "num_filtered_cards";

            // first look for 'a' coming first. this code was written
            // with an ascending sort being the default.

            var a_first = (
                ( a.get(fieldName) < b.get(fieldName) ) ||
                ( ( a.get(fieldName) === b.get(fieldName) ) && ( a.get("set_name") < b.get("set_name") ) ) ||
                ( ( a.get(fieldName) === b.get(fieldName) ) && ( a.get("set_name") === b.get("set_name") ) && ( a.get("description") < b.get("description") ) )
            );

            if ( a_first ) {
                return -1 * [-1,1][+!!this.isAscending];
            }

            // now check for equality. if not, b comes first.

            var equal  = (
                ( a.get(fieldName) === b.get(fieldName) ) &&
                ( a.get("set_name") === b.get("set_name") ) &&
                ( a.get("description") === b.get("description") )
            );

            return equal ? 0 : ( +1*[-1,1][+!!this.isAscending] );
        }

        // by name is default.

        else {

            // first look for 'a' coming first. this code was written
            // with an ascending sort being the default.

            var a_first = (
                ( a.get("set_name") < b.get("set_name") ) ||
                ( ( a.get("set_name") === b.get("set_name") ) && ( a.get("description") < b.get("description") ) )
            );

            if ( a_first ) {
                return -1 * [-1,1][+!!this.isAscending];
            }

            // now check for equality. if not, b comes first.

            var equal  = (
                ( a.get("set_name") == b.get("set_name") ) &&
                ( a.get("description") == b.get("description") )
            );

            return equal ? 0 : ( +1*[-1,1][+!!this.isAscending] );
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is called when the collection of models is returned from the
    // server. If you want to manipulate the data before backbone gets ahold
    // of it, this is the place.
    //
    //  @response - this is the `data` returned from the AJAX call. Backbone
    //              expects it to be an array of objects after this function
    //              is through. so if you return an object with other info
    //              inside it, then you need extract that here, put it somewhere
    //              else, and then set `response` to the array of objects that
    //              backbone is expecting.
    //
    ///////////////////////////////////////////////////////////////////////////

    parse : function(response,options) {

        // no-op: just send through whatever we received.
        return response;
    }
    
});

//---------------------------------------------------------------------------------------
// Collection: TestsCollection
// Description: A collection for test models. Sorted by is_auto_test and then alphabetically 
//              by default, by name then description.
//---------------------------------------------------------------------------------------

var TestsCollection = Backbone.Collection.extend({

    model : function(attrs,options) {
        return new TestModel(attrs,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup the backbone-related events that we're interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // when loading the collection, this is the url we contact. note
        // that fetch is the only operation on the collection that involves
        // the server - the rest are done on models directly.
        this.url = app.JS_ROOT + "ajax/studying/tests-backbone.php";

    	this.listenTo(this,"all",function(){
            //console.log("CTests.onAll ==> " + arguments[0]);
        });

        // assume ascending sort.
        this.isAscending = true;
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
    		jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
    	};

    	return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // `comparator` is used by the sort function on our collection in order
    // to know how to properly order the models.
    // @returns: -1 for 'a' comes first, +1 for 'b' comes first, 0 for equal
    ///////////////////////////////////////////////////////////////////////////

    comparator : function(a,b) {

        // first look for 'a' coming first. note that we were sorting by descending
        // order by default, before adding the `isAscending` flag.

    	var a_first = (
            ( a.get("is_auto_test") > b.get("is_auto_test") ) ||
            ( ( a.get("is_auto_test") === b.get("is_auto_test") ) && ( a.get("test_name") > b.get("test_name") ) ) ||
            ( ( a.get("is_auto_test") === b.get("is_auto_test") ) && ( a.get("test_name") == b.get("test_name") ) && ( a.get("description") > b.get("description") ) )
        );

        if ( a_first ) {
        	return -1 * [1,-1][+!!this.isAscending];
        }

        // now check for equality. if not, b comes first.

        var equal  = (
            ( a.get("is_auto_test") == b.get("is_auto_test") ) &&
            ( a.get("test_name") == b.get("test_name") ) && 
            ( a.get("description") == b.get("description") )
        );

        return equal ? 0 : ( +1 * [1,-1][+!!this.isAscending] );
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is called when the collection of models is returned from the
    // server. If you want to manipulate the data before backbone gets ahold
    // of it, this is the place.
    //
    //  @response - this is the `data` returned from the AJAX call. Backbone
    //              expects it to be an array of objects after this function
    //              is through. so if you return an object with other info
    //              inside it, then you need extract that here, put it somewhere
    //              else, and then set `response` to the array of objects that
    //              backbone is expecting.
    //
    ///////////////////////////////////////////////////////////////////////////

    parse : function(response,options) {

        // no-op: just send through whatever we received.
        return response;
    }
    
});

//---------------------------------------------------------------------------------------
// Collection:  TypesCollection
// Description: A collection of types of content available
//---------------------------------------------------------------------------------------

var TypesCollection = Backbone.Collection.extend({

    model : function(attrs,options) {
        return new TypeModel(attrs,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup the backbone-related events that we're interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {
    },

    ///////////////////////////////////////////////////////////////////////////
    // `comparator` is used by the sort function on our collection in order
    // to know how to properly order the models.
    // @returns: -1 for 'a' comes first, +1 for 'b' comes first, 0 for equal
    ///////////////////////////////////////////////////////////////////////////

    comparator : function(a,b) {

        // first look for 'a' coming first. ascending order.

        var a_first = (
            ( a.get("type_name") === "Flashcards" )
        );

        if ( a_first ) {
            return -1;
        }

        // now check for equality. if not, b comes first. remember that there
        // can only be one "self" and one "pub".

        var equal  = (
            ( a.get("type_name") === b.get("type_name") )
        );

        return equal ? 0 : +1;
    },
    
});

//---------------------------------------------------------------------------------------
// Collection: UsersCollection
// Description: Holds all of the EnrollmentModel instances, both active and completed.
//              This keeps them sorted, with most recent, 'active' first.
//---------------------------------------------------------------------------------------

var UsersCollection = Backbone.Collection.extend({

    model : function(attrs,options) {
        return new UserModel(attrs,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup the backbone-related events that we're interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // when loading the collection, this is the url we contact
        this.url = app.JS_ROOT + "ajax/user.php";

    	this.listenTo(this,"all",function(){
            //console.log("CEnrollment.onAll ==> " + arguments[0]);
        });

        // we have three possible sort criteria: "name", "cards", "tests"
        this.sortCriteria = "name";

        // assume ascending sort.
        this.isAscending = true;
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
    		jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
    	};

    	return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // `comparator` is used by the sort function on our collection in order
    // to know how to properly order the models.
    // @returns: -1 for 'a' comes first, +1 for 'b' comes first, 0 for equal
    ///////////////////////////////////////////////////////////////////////////

    comparator : function(a,b) {

        var aIsUser = a.get("id") === app.store.get("user").id;
        var bIsUser = b.get("id") === app.store.get("user").id;

        // sorting by cards or tests (sort by name when equal)

        if ( ( this.sortCriteria === "cards" ) || ( this.sortCriteria === "tests" ) ) {

            var fieldName = ( this.sortCriteria === "cards" ? "num_filtered_cards" : "num_tests" );

            // first look for 'a' coming first. this code was written
            // with an ascending sort being the default.

            var a_first = (
                ( a.get(fieldName) < b.get(fieldName) ) ||
                ( ( a.get(fieldName) === b.get(fieldName) ) && ( a.get("last_name") < b.get("last_name") ) ) ||
                ( ( a.get(fieldName) === b.get(fieldName) ) && ( a.get("last_name") === b.get("last_name") ) && ( a.get("first_name") < b.get("first_name") ) )
            );

            if ( a_first ) {
                return -1 * [-1,1][+!!this.isAscending];
            }

            // now check for equality. if not, b comes first.

            var equal  = (
                ( a.get(fieldName) === b.get(fieldName) ) &&
                ( a.get("last_name") === b.get("last_name") ) &&
                ( a.get("first_name") === b.get("first_name") )
            );

            return equal ? 0 : ( +1*[-1,1][+!!this.isAscending] );
        }

        // by name is default.

        else {

            // first look for 'a' coming first. this code was written
            // with an ascending sort being the default.

        	var a_first = (
                ( aIsUser > bIsUser ) ||
                ( ( aIsUser === bIsUser ) && ( a.get("last_name") < b.get("last_name") ) ) ||
                ( ( aIsUser === bIsUser ) && ( a.get("last_name") === b.get("last_name") ) && ( a.get("first_name") < b.get("first_name") ) )
            );

            if ( a_first ) {
                return -1 * [-1,1][+!!this.isAscending];
            }

            // now check for equality. if not, b comes first.

            var equal  = (
                ( aIsUser === bIsUser ) &&
                ( a.get("last_name") == b.get("last_name") ) &&
                ( a.get("first_name") == b.get("first_name") )
            );

            return equal ? 0 : ( +1*[-1,1][+!!this.isAscending] );
        }        
    },

    ///////////////////////////////////////////////////////////////////////////
    // This is called when the collection of models is returned from the
    // server. If you want to manipulate the data before backbone gets ahold
    // of it, this is the place.
    ///////////////////////////////////////////////////////////////////////////

    parse : function(response,options) {
        
        // no-op: just pass it along.
    	return response;
    }
});

//---------------------------------------------------------------------------------------
// Model: FlashcardModel
// Description: Holds a single flashcard record.
//---------------------------------------------------------------------------------------

var CardModel = Backbone.Model.extend({

    defaults : {
        id : undefined,
        set_id : undefined,
        order_id : undefined,
        question_text : undefined,
        answer_text : null, // optional
        created_on : undefined
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup all the backbone-related events that we are interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // the url we use to save a single model - when working with more
        // than one (i.e., loading) we use the collection. note that
        // this will be added to in order to specify the enrollment, 
        // user, set, and flashcard ID as appropriate.
        this.urlRoot = app.JS_ROOT + "ajax/studying/cards-backbone.php";
        this.baseUrlRoot = this.urlRoot;

        this.listenTo(this,"all",function(){
            //console.log("FlashcardModel.onAll ==> " + arguments[0]);
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
            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
        };

        return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the model. Here we go through all of the attributes of the
    // model and ensure that they are valid.
    // @return - object containing .msg and .field on error, nothing on success
    ///////////////////////////////////////////////////////////////////////////

    validate : function(attrs,options) {

        // (1) order_id. only tested on existing models, not new ones (as given
        // auto-value on server)

        if ( attrs.id ) {

            var re = new RegExp("^[0-9]+$");
            if ( !re.test(attrs.order_id) ) {
                return {
                    msg : "<strong>Order ID</strong>: Please enter a value of zero or above",
                    field : "order_id"
                };
            }
        }

        // (2) question_text

        if ( ( !attrs.question_text.length ) || ( attrs.question_text.length > 14336 ) ) {
            return {
                msg : "<strong>Question</strong>: 1-14336 chars long",
                field : "question_text"
            };
        }

        // (3) answer_text (optional)

        if ( attrs.answer_text && attrs.answer_text.length ) {
        
            if ( attrs.answer_text.length > 4096 ) {
                return {
                    msg : "<strong>Answer</strong>: 0-4096 chars long",
                    field : "answer_text"
                };
            }
        }

        // (4) tags - no duplicates

        if ( attrs.tags && attrs.tags.length ) {

            var uniqTags = _.uniq(attrs.tags,false,function(o){
                return o.id;
            });
            if ( uniqTags.length !== attrs.tags.length ) {
                return {
                    msg : "<strong>Tags</strong>: No duplicates",
                    field : "tags"
                };
            }
        }

        // if it passed we are not supposed to return anything.
    }

});

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

//---------------------------------------------------------------------------------------
// Model: GroupModel
// Description: Represents a "studygroup". This will include the user's personal
//              content, the public studygroup, and all private studygroups.
//---------------------------------------------------------------------------------------

var GroupModel = Backbone.Model.extend({

    defaults : {
        id : undefined, // "self", "pub", or integer (for private)        
        num_members : undefined,
        owner_first_name : undefined, // undefined for public studygroup vv
        owner_last_name : undefined,
        owner_id : undefined,
        created_on : undefined,
        code : undefined,
        is_user_member : undefined, // added by PHP
        is_user_owner : undefined // added by PHP
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup all the backbone-related events that we are interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {
        // the url we use to save a single model - when working with more
        // than one (i.e., loading) we use the collection. note that
        // this will be added to in order to specify the enrollment, 
        // user, and set ID as appropriate.
        this.urlRoot = app.JS_ROOT + "ajax/studying/groups-backbone.php";
        this.baseUrlRoot = this.urlRoot;

        this.listenTo(this,"all",function(){
            //console.log("MSets.onAll ==> " + arguments[0]);
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
            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
        };

        return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the model. Here we go through all of the attributes of the
    // model and ensure that they are valid.
    // @return - object containing .msg and .field on error, nothing on success
    ///////////////////////////////////////////////////////////////////////////

    validate : function(attrs,options) {

        // (1) the code

        if ( !attrs.code ) {
            return {
                msg : "<strong>Code</strong>: Please set a search code for the group",
                field : "code"
            };
        }
           
        var re = new RegExp("^[A-z0-9]{6}$");
        if ( !re.test(attrs.code) ) {
            return {
                msg : "<strong>Code</strong>: 6 chars long, charset: [<em>A-z</em>, <em>0-9</em>]",
                field : "code"
            };
        }

        // if it passed we are not supposed to return anything.
    }

});

//---------------------------------------------------------------------------------------
// Model: SetModel
// Description: Holds a single fc set record.
//---------------------------------------------------------------------------------------

var SetModel = Backbone.Model.extend({

    defaults : {
        set_name : undefined,
        description : null, // optional
        sharing : undefined,
        has_auto_test : undefined,
        created_on : undefined,
        created_by : undefined, // manual
        num_filtered_cards : undefined, // manual
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup all the backbone-related events that we are interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // the url we use to save a single model - when working with more
        // than one (i.e., loading) we use the collection. note that
        // this will be added to in order to specify the enrollment, 
        // user, and set ID as appropriate.
        this.urlRoot = app.JS_ROOT + "ajax/studying/sets-backbone.php";
        this.baseUrlRoot = this.urlRoot;

        this.listenTo(this,"all",function(){
            //console.log("MSets.onAll ==> " + arguments[0]);
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
            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
        };

        return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the model. Here we go through all of the attributes of the
    // model and ensure that they are valid.
    // @return - object containing .msg and .field on error, nothing on success
    ///////////////////////////////////////////////////////////////////////////

    validate : function(attrs,options) {

        // (1) name

        var re = new RegExp("^[-!.,& A-z0-9'\"()\\[\\]]{1,32}$");
        if ( !re.test(attrs.set_name) ) {
            return {
                msg : "<strong>Name</strong>: 1-32 chars long, charset: [<em>A-Z</em>, <em>0-9</em>, <em>-! .,&()[]'\"</em>]",
                field : "set_name"
            };
        }

        // (2) description (optional)

        if ( attrs.description && attrs.description.length ) {
        
            re = new RegExp("^[-!.,& A-z0-9'\"()\\[\\]]{1,64}$");
            if ( !re.test(attrs.description) ) {
                return {
                    msg : "<strong>Description</strong>: 0-64 chars long, charset: [<em>A-Z</em>, <em>0-9</em>, <em>-! .,&()[]'\"</em>]",
                    field : "description"
                };
            }
        }

        // (3) sharing

        if ( !attrs.sharing ) {
            return {
                msg : "<strong>Sharing</strong>: Please pick a value",
                field : "sharing"
            };
        }

        // (4) has auto test. cannot be invalid on the client.

        // if it passed we are not supposed to return anything.
    }

});

//---------------------------------------------------------------------------------------
// Model: TestModel
// Description: Holds a single test record.
//---------------------------------------------------------------------------------------

var TestModel = Backbone.Model.extend({

    defaults : {
        test_name : undefined,
        description : null, // optional
        sharing : undefined,
        setIDs : undefined,
        keywords : undefined,
        tags : undefined,
        is_auto_test : undefined,
        created_on : undefined
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup all the backbone-related events that we are interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // the url we use to save a single model - when working with more
        // than one (i.e., loading) we use the collection. note that
        // this will be added to in order to specify the enrollment, 
        // user, and set ID as appropriate.
        this.urlRoot = app.JS_ROOT + "ajax/studying/tests-backbone.php";
        this.baseUrlRoot = this.urlRoot;

        this.listenTo(this,"all",function(){
            //console.log("MTests.onAll ==> " + arguments[0]);
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
            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
        };

        return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the model. Here we go through all of the attributes of the
    // model and ensure that they are valid.
    // @return - object containing .msg and .field on error, nothing on success
    ///////////////////////////////////////////////////////////////////////////

    validate : function(attrs,options) {

        // (1) name

        var re = new RegExp("^[-!.,& A-z0-9'\"()\\[\\]]{1,32}$");
        if ( !re.test(attrs.test_name) ) {
            return {
                msg : "<strong>Name</strong>: 1-32 chars long, charset: [<em>A-Z</em>, <em>0-9</em>, <em>-! .,&()[]'\"</em>]",
                field : "test_name"
            };
        }

        // (2) description (optional)

        if ( attrs.description && attrs.description.length ) {
        
            re = new RegExp("^[-!.,& A-z0-9'\"()\\[\\]]{1,64}$");
            if ( !re.test(attrs.description) ) {
                return {
                    msg : "<strong>Description</strong>: 0-64 chars long, charset: [<em>A-Z</em>, <em>0-9</em>, <em>-! .,&()[]'\"</em>]",
                    field : "description"
                };
            }
        }

        // (3) sharing

        if ( !attrs.sharing ) {
            return {
                msg : "<strong>Sharing</strong>: Please pick a value",
                field : "sharing"
            };
        }

        // (4) setIDs

        if ( !attrs.setIDs.length ) {
            return {
                msg : "<strong>Sets</strong>: Please pick some sets",
                field : "sets"
            };
        }

        // (5) keywords - no duplicates

        if ( attrs.keywords && attrs.keywords.length ) {

            var uniqKeywords = _.uniq(attrs.keywords);
            if ( uniqKeywords.length !== attrs.keywords.length ) {
                return {
                    msg : "<strong>Keywords</strong>: No duplicates",
                    field : "keywords"
                };
            }
        }

        // (6) tags - no duplicates

        if ( attrs.tags && attrs.tags.length ) {

            var uniqTags = _.uniq(attrs.tags);
            if ( uniqTags.length !== attrs.tags.length ) {
                return {
                    msg : "<strong>Tags</strong>: No duplicates",
                    field : "tags"
                };
            }
        }

        // if it passed we are not supposed to return anything.
    }

});

//---------------------------------------------------------------------------------------
// Model: TypeModel
// Description: Represents a "type" of content, along with the amount of that content
//              that a given user has.
//---------------------------------------------------------------------------------------

var TypeModel = Backbone.Model.extend({

    defaults : {
        id : undefined, // "cards" or "tests"
        type_name : undefined, // for display purposes
        count : undefined
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup all the backbone-related events that we are interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {
        
        // setup the URL, `JS_ROOT` isn't setup until the inline js on index.php
        this.urlRoot = app.JS_ROOT + "_ajax/user.php";

        this.listenTo(this,"all",function(){
            //console.log("TypeModel.onAll ==> " + arguments[0]);
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
            jqxhr.setRequestHeader("SESSIONTOKEN", ( app && app.store.has("user") ) ? app.store.get("user").token : "unspecified" );
        };

        return Backbone.sync(method,model,options);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Validate the model. Here we go through all of the attributes of the
    // model and ensure that they are valid. Of course this is never done through
    // a form, so the field/msg values are meaningful only for debug.
    //
    // @return - object containing .msg and .field on error, nothing on success
    ///////////////////////////////////////////////////////////////////////////

    validate : function(attrs,options) {

        // (1) id

        if ( ( attrs.id !== "cards" ) && ( attrs.id !== "tests" ) ) {            
            return {
                msg : "<strong>ID</strong>: Please set a valid ID",
                field : "id"
            };
        }

        // (2) count

        if ( $.gettype(attrs.count).base !== "number" ) {
            return {
                msg : "<strong>Count</strong>: Please provide a count value",
                field : "count"
            };
        }

        // if it passed we are not supposed to return anything.
    }

});

//---------------------------------------------------------------------------------------
// Model: User
// Description: Holds a single `user` record (e.g., email, full_name, institution_id, ...)
//---------------------------------------------------------------------------------------

var UserModel = Backbone.Model.extend({

    defaults : {
        institution_id : undefined,
        email : undefined,
        password : undefined,
        status : undefined,
        full_name : undefined,
        registered_on : undefined,
        last_login : undefined,
        num_logins : undefined,
        verification_code : undefined
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Setup all the backbone-related events that we are interested in.
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {

        // setup the URL, `JS_ROOT` isn't setup until the inline js on index.php
        this.urlRoot = app.JS_ROOT + "_ajax/user.php";

        this.listenTo(this,"all",function(){
            //console.log("UserModel.onAll ==> " + arguments[0]);
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
    //
    //  @options - object containing:
    //      .func - "register", "verify", "update"
    //      .institutions - array of objects with .email_suffix and .name
    //  @return - object containing .msg and .field
    ///////////////////////////////////////////////////////////////////////////

    validate : function(attrs,options) {

        // (A) "REGISTERING"

        if ( options.func === "register" ) {

            // (1) check the full_name. ensure it's between 2 and 3 words.

            attrs.full_name = $.trim(attrs.full_name);
            var name = attrs.full_name.split(" ");
            if ( ( name.length < 2 ) || ( name.length > 3 ) ) {
                return {
                    msg : "<strong>Name</strong>: Please enter your full name",
                    field : "full_name"
                }
            }

            // also check that it's got safe characters

            re = new RegExp("^[- A-Za-z']{5,64}$");
            if ( !re.test(attrs.full_name) ) {
                return {
                    msg : "<strong>Name</strong>: 5-64 chars long, charset: <em>A-z</em>, <em>-'</em>",
                    field : "full_name"
                };
            }

            // (2) email. ensure it's an appropriate format (naive).

            attrs.email = $.trim(attrs.email);
            var result = $.leftovers.parse.validate_string({
                str : attrs.email ? attrs.email : "",
                field : "Email",
                match_type : "email"
            });

            if ( !result.passed ) {
                return {
                    msg : "<strong>Email</strong>: Please enter a valid email address",
                    field : "email"
                }
            }

            // look for it in our institution list.

            var email = attrs.email ? attrs.email.split("@") : ["",""];
            var result = _.find(options.institutions,function(elem){
                return elem.email_suffix = email[1];
            });
            if ( !result ) {
                msg = "<strong>Email</strong>: I'm sorry but we only support the following institutions at the moment: ";
                var len = msg.length;
                $.each(options.institutions_email_suffixes,function(idx,elem) {
                    if ( msg.length !== len ) {
                        msg += ", ";
                    }
                    msg += elem;
                });
                return {
                    msg : msg,
                    field : "email"
                }
            }
        }

        // (B) "VERIFYING"/"UPDATING"

        if ( ( options.func == "verify" ) || ( options.func == "update" ) ) {

            // (1) password

            attrs.password = $.trim(attrs.password);
            if ( ( attrs.password.length < 6 ) || ( attrs.password.length > 64 ) ) {
                return {
                    msg : "<strong>Password</strong>: 6-64 chars long",
                    field : "password"
                };
            }
        }

        // if it passed we are not supposed to return anything.
    }

});

//---------------------------------------------------------------------------------------
// View: VBasePage
// Description: This is the base view for a page that exists within a section.
//
//              When our page is ready to be rendered an "onPageReady" event is
//              triggered, for any parent who cares. If the page fails to prepare for
//              rendering then an "onPageFailed" event is triggered. In both cases, we
//              send along a parameter of `this` (i.e., the page that is generating the
//              event).
//---------------------------------------------------------------------------------------

var VBasePage = Backbone.View.extend({

    // creating new DOM element
    tagName : "div",

    /* overload */
    id : undefined,
    className : "page",
    pageTemplateID : undefined,
    contentTemplateID : undefined, // leave undefined to not template this element.
    footerTemplateID : undefined,
    contentElement : undefined,
    footerElement : undefined,

    // UI events from the HTML created by this view
    events : {
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //  @settings:
    //
    //      These were sent to VSection::setPage and were used to determine
    //      what page should be instantiated (i.e., us!). So they will
    //      have passed through VSection for sure.
    //
    //  @options:
    //
    //      Any optional flags that relate to the page being instantiated.
    //      They were created for `VBaseSection.setPage`
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) { /* overload if required */
        this.settings = settings || {};
        this.options = options || {};
    },

    ///////////////////////////////////////////////////////////////////////////
    // Load all of the data that is required for the page. When completed we
    // call `ready`, which gets us ready to render and notifies any listeners
    // that we have finished loading and ready to be rendered.
    //
    // If we want a spinner shown at this point, we'll have to do so ourselves.
    ///////////////////////////////////////////////////////////////////////////

    loadData : function() { /* overload if required */        
        // no-op.
        this.ready();
    },

    ///////////////////////////////////////////////////////////////////////////
    // When the `content` element is rendered, using the `content` template,
    // this function provides the attributes hash to be sent to that template.
    ///////////////////////////////////////////////////////////////////////////

    getContentAttributes : function() { /* overload as required */
        // no-op.
        return {};
    },

    ///////////////////////////////////////////////////////////////////////////
    // All of the data has been loaded that the page requires. We will
    // construct our subviews and then trigger an event notifying whoever is
    // listening that we're ready to render.
    ///////////////////////////////////////////////////////////////////////////

    ready : function() { /* overload and extend (if required) */
        this.trigger("onPageReady",this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extent (as required) */        

        // NOTE: inheriting views will extend this function and then simply 
        // empty their local references before calling this method and
        // returning its return value. It's fine to nullify a reference to
        // a view that was listening to you, as it won't affect their ability
        // to execute the method setup in the listenTo:
        // http://jsfiddle.net/HgGLa/

        // empty references 
        this.settings = null;
        this.options = null;        

        // send a message to any listening views that we're cleaning up.
        this.trigger("cleanup");

        // jsfiddle for super() testing: http://jsfiddle.net/hLjC2/
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton HTML templates for both the page and the content,
    // before rendering the footer template's HTML.
    ///////////////////////////////////////////////////////////////////////////

    render : function() { /* overload and extend (as required) */        

        this.$el.html($.includejs.getTemplate(this.pageTemplateID));

        // the content element may not need to be templated. if not, it will
        // just remain an empty element for now.

        if ( this.contentTemplateID ) {
            this.$(this.contentElement).html($.includejs.getTemplate(this.contentTemplateID,this.getContentAttributes()));
        }

        // the only information our footer needs it the current year. and that's apart
        // of all the templates by default.

        this.$(this.footerElement).html($.includejs.getTemplate(this.footerTemplateID));
        return this;
    }

});

//---------------------------------------------------------------------------------------
// View: VBaseSection
// Description: This represents the base view for a section of the site. A section refers to
//              a place where the "page" may change, but we do not want to go through the
//              `router` object directly. In other words, we may change the URL but all of
//              that "routing" is done internally to this section.
//
//              This means that we render the header and menu at this point, before passing off
//              control to one of our pageView instances, which will render everything
//              below that point (i.e., everything else). There is very little functionality
//              performed here except to serve as an entry point and a fallback point when the
//              pageView needs to change for the section.
//
//              When setting/changing the page, we must construct a URL that is shown in
//              the address bar, but does not trigger a router event. If that is invalid,
//              we trigger the 404 route. Beyond that, it is the pageView that actually 
//              renders the widgets (i.e., CONTENT) of the section (as that will change
//              depending on which pageView is active).
//---------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Note:    The way parameters are organized in this hierarchy of views is like
//          so: Any parameter that is required is sent as a named parameter, with
//          a specific and identifying name. If there are several requirements,
//          that are known, then they are all named. If, however, their number
//          is unknown, they are sent as an object. This object is called `settings`.
//          However, try to keep `settings` for construction purposes only, for
//          every other scenario, used named parameters.
//
//          Any optional parameters are grouped together, whether known or unknown,
//          in an object named `options`. This is the same name that backbone
//          uses, so they may become merged - be careful not to use property names
//          that backbone uses.
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Note:    Files, views, and templates are named using the following format:
//
//          [base?][baseType][section][page][name] *note: a '.' isn't always a delimiter
//
//          base - present if it's a pseudo-abstract view (i.e., not instantiated directly)
//          baseType - (i.e., section, page, widget)
//          section - name of the section it's in
//          page - name of the page it's in
//          name - the name of the file/view/template (if the previous fields don't identify it)
//
//          examples:
//
//              [widget][flashcards.browse][modules][list]
//              [section][flashcards.browse]
//              [page][flashcards.browse]
//              [base][page][browse]
//              [base][widget][list]
//              [widget][dash][profile][panel]
//
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Note:    Most objects involved in our hierarchy will take `settings` and
//          `options` values in their constructor. Settings are required values
//          and options are, well, optional values. If an object is required, make
//          it a property of the `settings` object, do not send it as the
//          `settings` object alone.
//-----------------------------------------------------------------------------

var VBaseSection = Backbone.View.extend({

    // creating new DOM element
    tagName : "div",

    /* overload */
    id : undefined,
    className : "section", // inherit as function, like `events` (see below)
    sectionTemplateID : undefined,
    headerTemplateID : undefined,
    headerElement : undefined,
    pageElement : undefined,
    menuClassNameActive : undefined,

    // UI events from the HTML created by this view. always inherit this through
    // a function (i.e., http://stackoverflow.com/questions/9403675/backbone-view-inherit-and-extend-events-from-parent)
    events : {        
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // We will setup the first page of the section. When the data for that page
    // has loaded, we will notify our caller that we're ready to be rendered.
    //
    //  @settings:
    //
    //      Data object of required values. Sent to us from `app.router`. It represents
    //      a parsed object of properties that was extracted from the URL entered
    //      that got us to this section. At this stage, it should enable the section
    //      to figure out: (a) what page should be instantiated; and (b) what URL
    //      should be displayed (based upon the page that was instantiated - this
    //      will likely not change the first time the section is entered).
    //
    //  @callback:
    //
    //      The function to call when the section is ready to be rendered.
    //      This is required because we do not know where this section will
    //      be going in the DOM, and our parent, who DOES know, needs to know
    //      when we're ready to be rendered.
    //
    //  @options:
    //
    //      Any flags that you want to pass along to the page construction.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,callback,options) {

        this.setPage(
            settings,
            function(){
                callback(this);
            }.bind(this),
            options
        );
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        // all subview(s) will be listening for this event.
        this.trigger("cleanup");

        // empty references
        this.stopListening(this.pageView);
        this.pageView = null;

        // note: jsfiddle for super() testing: http://jsfiddle.net/hLjC2/        
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Setting up the current pageView. First, based upon the settings that
    // have been sent we will construct and display the URL that represents
    // the page. If that fails, we trigger a 404. The settings also tell us
    // what page we should be instantiating.
    //
    // If we have been given a `callback`, that means this is the original
    // call to the view, so it's being constructed, and our caller needs to
    // know when we can be rendered. Otherwise, it's an internal call, from
    // one of our pages, and so we can simply re-render the page.
    //
    // @settings:   Required values. This will be used to determine what page
    //              instance should be instantiated as well as what URL we
    //              should be showing. Sent from either `VSection::constructor`
    //              or from a manual call to `setPage`.
    //
    // @options:    Any flags that you want to pass along to the page construction.
    //              If this is our initial page, they were passed to our constructor,
    //              otherwise they were created for this function.
    //      
    ///////////////////////////////////////////////////////////////////////////

    setPage : function(settings,callback,options) {

        var url = this.setURL(settings,options); /* overload */

        // if `null` is sent back, that means that we don't have to
        // change the URL at all. `false` is returned for an error (404).
        
        if ( $.gettype(url).base === "string" ) {
            app.router.navigate(url,{trigger:false});
        }
        else if ( url === false ) {
            app.gotoSection("notFound");
            return;
        }

        // remove our existing page.

        if ( this.pageView ) {
            this.stopListening(this.pageView);
            this.pageView.remove();
        }

        // create our page, giving them access to the settings and options that
        // were sent to us.

        //fixme: this NULL check is not documented anywhere. but it is a very
        // sensible approach to 404 errors. implement it further in the code.
        this.pageView = this.instantiatePageView(settings,options); /* overload */
        if ( !this.pageView ) {
            app.gotoSection("notFound");
            return;
        }
        this.pageView.listenTo(this,"cleanup",this.pageView.remove);

        // the pageView can tell us three things:
        
        // (1)  it wants us to change the current page (which is what we're doing now).
        this.listenTo(this.pageView,"setPage",this.setPage);

        // (2)  it is ready to be rendered. the rendering duties are performed by
        //      our caller if we were called from our own constructor (`initialize`).
        //      otherwise, if it was an internal call to `setPage`, then we can just
        //      render the page ourselves (as our element already exists in the DOM)
        //      and we won't have been sent a callback.

        this.listenTo(this.pageView,"onPageReady",function(){            
            if ( callback ) {
                callback(this);
            }
            else {
                this.renderPage();
            }
        }.bind(this));

        // (3)  it failed to prepare for rendering, we treat this the same as a 404 error.
        //      notice that we are removing any spinner that might have been started by
        //      the page, just as we do after our call to `renderPage`... except since
        //      we failed we'll never get there.

        this.listenTo(this.pageView,"onPageFailed",function(){            
            Spinner.get().hide(function(){
                app.gotoSection("notFound");
            });
        }.bind(this));

        // now that everything is setup, we can ask the page to load
        // it's data, which will eventually trigger "onPageReady" when it's 
        // done. note that the `pageView` view will have to display its own
        // spinner if it wants one shown.
        
        this.pageView.loadData();
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the skeleton template for a section, followed by the header and
    // menu. Finally, we render the page itself.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        this.$el.html($.includejs.getTemplate(this.sectionTemplateID));

        this.$(this.headerElement).html($.includejs.getTemplate(this.headerTemplateID));

        // not all sections will have a menu. if `menuClassNameActive` is defined, then
        // we assume that their header is a menu.
        
        if ( this.menuClassNameActive ) {
            this.$(this.headerElement).find("li").removeClass("active");
            this.$(this.headerElement).find("li."+this.menuClassNameActive).addClass("active");
        }

        this.renderPage();

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render the page within its appropriate element. As data was successfully
    // loaded (for the page in question), and fully displayed, we can get rid
    // of the spinner (if it was displayed as part of the `pageView.loadData`).
    ///////////////////////////////////////////////////////////////////////////

    renderPage : function() {
        this.$(this.pageElement).html(this.pageView.render().$el);        
        Spinner.get().hide();
    }

});

//---------------------------------------------------------------------------------------
// View: VBaseWidgetBreadcrumbCrumb
// Description: A view representing a single crumb in our parent VBaseWidgetBreadcrumb
//              instance.
//---------------------------------------------------------------------------------------

var VBaseWidgetBreadcrumbCrumb = Backbone.View.extend({

    // creating new DOM element
    tagName : "li",

    /* overload */
    id : undefined,
    className : "widget widget-breadcrumb-crumb",

    // UI events from the HTML created by this view
    events : {
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Copy over the information we need from parms into members, then setup
    // the HTML5 data of our element to be that which is associated with the
    // crumb itself.
    //
    //  @settings:
    //
    //      .numCrumb - out of N crumbs, what number are we? (1-based)
    //      .totalCrumbs - N crumbs (1-based)
    //      .maxDisplayLength - how long can the display string be?
    //      .crumb - data object, contains AT LEAST `.displayStr`
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings) {
        
        this.numCrumb = settings.numCrumb;
        this.totalCrumbs = settings.totalCrumbs;
        this.maxDisplayLength = settings.maxDisplayLength;
        this.crumb = settings.crumb;
        this.$el.data("crumb",this.crumb);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        // all subview(s) will be listening for this event.
        this.trigger("cleanup");

        // empty references
        this.crumb = null;
        this.stopListening();
        
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // We are creating an `a` element inside our own $el, that represents the
    // clickable crumb.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        var displayStr = $.leftovers.parse.crop_string(this.crumb.displayStr,this.maxDisplayLength);

        var a = $("<a></a>")
        .prop("href","#")
        .addClass(this.numCrumb === this.totalCrumbs ? "active" : "")
        .html(displayStr);

        this.$el.html(a);

        return this;
    }

});

//---------------------------------------------------------------------------------------
// View:        VBaseWidgetBreadcrumb
// Description: This view is used to render a breadcrumb. We are given data to start
//              that is sent into `generateCrumbs` and then broken down into an array
//              of objects. Those objects each represent a crumb that can be clicked on.
//
//              Each crumb object that is rendered/managed has the following:
//
//              .crumbDisplay - the string to display in the link
//              .crumbHref - the string that goes inside the 'href' property of the link
//              .crumbData - the object that is set in HTML5 data, returned with event.
//
//              We generate one event here: onClickCrumb. However, if we have failed
//              to generate our crumbs, during `initialize`, you will have to poll us
//              to find out with `hasValidCrumbs` - no listeners will have been
//              attached by then.
//---------------------------------------------------------------------------------------

var VBaseWidgetBreadcrumb = Backbone.View.extend({

    // creating new DOM element
    tagName : "ol",
    className : "widget widget-breadcrumb", /* extend if required */

    /* overload */
    id : undefined,
    templateID : undefined,

    // UI events from the HTML created by this view
    events : {
        "click a.crumb" : "onClickCrumb"
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    // Generate all of the crumb data objects.
    //
    //  @settings:
    //
    //      Contains the require value:
    //
    //      .data:
    //
    //      this is an array of objects which will be constructed into an ordered
    //      array of crumbs. this must hold enough information for the view to
    //      generate its own list of ordered crumbs. it can be in any format you
    //      want, as the derived breadcrumb views will have to parse it.
    //      
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {

        // `generateCrumbs` will fill the `crumbs` array with objects that
        // have the following fields: .crumbDisplay, .crumbHref, .crumbData. It is the
        // .data field from each object that is returned from onClickCrumb.
        this.crumbs = this.generateCrumbs(settings.data);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Take the array of objects sent and construct our own array of objects
    // with the fields: .crumbDisplay, .crumbHref, .crumbData. Return NULL on failure.
    ///////////////////////////////////////////////////////////////////////////

    generateCrumbs : function(data) { /* overload */
        // no-op
        return null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {        

        // empty references and tell sub-views to cleanup.
        this.crumbs = null;
        this.trigger("cleanup");
        
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // If our call to `generateCrumbs` was unsuccessful, `this.crumbs` will be
    // `null`. Again, we cannot generate an event for this because it was all
    // done in `initialize`, so nobody could have been listening yet.
    ///////////////////////////////////////////////////////////////////////////

    hasValidCrumbs : function() {
        return ( this.crumbs !== null );
    },

    ///////////////////////////////////////////////////////////////////////////
    // Create all the individual crumb views, based upon the crumbs we've 
    // generated. Nothing else to render here.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        if ( this.hasValidCrumbs() ) {

            // create the elements.            
            this.$el.html($.includejs.getTemplate(this.templateID,{crumbs:this.crumbs}));

            // attach the HTML5 data to the elements
            var elem = this.$("a.crumb");
            for ( var x=0; x < elem.length; x++ ) {
                if ( x < this.crumbs.length ) {
                    $(elem[x]).data("crumbData",this.crumbs[x].crumbData);
                }
            }
        }

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked one of the crumbs. We will trigger an event so
    // if anyone cares, they will be notified. The data relating to the crumb
    // is stored in the HTML5 data attached to the crumb's view. The target
    // of the event will be an `a` tag, but we want its parent (which is the
    // VBaseWidgetBreadcrumbCrumb-derived view).
    ///////////////////////////////////////////////////////////////////////////

    onClickCrumb : function(event) {
        this.trigger("onClickCrumb",$(event.currentTarget).data("crumbData"));
        event.preventDefault();
        event.stopPropagation();
    }    

});

//---------------------------------------------------------------------------------------
// View:        VBaseWidgetForm
// Description: This view houses a form that is filled out and submitted, although it
//              is not attached to any backbone model or collection. The information from
//              the form is simply returned as an attributes object (using names from
//              the form controls as the field names).
//
//              Methods dealing with the manipulation/presentation of the form itself
//              and parsing of the form data are overloaded. Since no model is attached
//              any validation of the form's must be done manually.
//
//              Events are created here: "onFormSubmit" and "onFormCancel".
//              These are triggered when that respective function has completed (i.e.,
//              validation has passed on "save" and we can now submit). By default, the
//              method that generates "onFormSubmit" is called automatically right after 
//              `onAttrsValid` is called.
//
//              The error returned from the validation func needs to be an object
//              with two fields (.msg and .field). `field` should match the name
//              of a given input field on the form, so it can be highlighted.
//              
//---------------------------------------------------------------------------------------

var VBaseWidgetForm = Backbone.View.extend({

    // creating new DOM element
    tagName : "div",

    /* overload and/or extend */
    id : undefined,
    className : "widget widget-form",
    templateID : undefined,
    successAlertText : undefined,
    alertTemplateID : "tpl-alert",
    alertDismissTemplateID : "tpl-alert-dismiss",
    allowDefaultSubmit : false,
    formName : undefined,    

    // UI events from the HTML created by this view
    events : {
        "click button[name=button_save]" : "onClickSave",
        "click button[name=button_cancel]" : "onClickCancel",
        "submit form" : "onSubmit"
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //  @settings:
    //
    //      Data object of required values. None here.
    //
    //  @options:
    //      Any flags that might be useful.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {

        this.settings = settings || {};
        this.options = options || {};

        // we are binding to the ESCAPE key, in order to get out of our form.
        $("body").on("keyup",null,{context:this},this.onEscapeKey);

        // we are creating a new attributes hash (and will be doing so again
        // after every successful 'submit')
        this.createFreshAttrs();
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {        

        // unbind our keyboard event - leaving any other events for 'keyup' as
        // they were.
        $("body").off("keyup",null,this.onEscapeKey);

        // all subview(s) will be listening for this event.
        this.trigger("cleanup");

        // empty references
        this.attrs = null;
        this.attrsOptions = null;
        this.settings = null;
        this.options = null;
        this.jqoForm = null;

        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // If we require some attributes to be present on the form upon display
    // then you must overload the `getDefaultAttrsForTemplate` method. Regardless,
    // the template is rendered and the form is prepared.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        var defaultAttrs = this.getDefaultAttrsForTemplate();
        this.$el.html($.includejs.getTemplate(this.templateID,defaultAttrs));
        
        this.jqoForm = this.$("form");
        this.prepareForm(); /* overload */
        this.jqoForm.find("*[data-toggle=tooltip]").tooltip();

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // If we require some attributes to be present on the form upon display
    // then this function should return them.
    ///////////////////////////////////////////////////////////////////////////

    getDefaultAttrsForTemplate : function() { /* overload (as required) */
        // no-op.
        return {};
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our creation form has already been rendered. However, if there is some manual
    // work that we have to do, then it will be done here.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overload as required */
        // no-op.
    },

    /*
        Utility functions
    */

    ///////////////////////////////////////////////////////////////////////////
    // Simply empty out our attributes hash, as we are starting fresh.
    ///////////////////////////////////////////////////////////////////////////

    createFreshAttrs : function() { /* overload (if required) */
        this.attrs = null;
        this.attrsOptions = null;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Remove all of the succes/error feedback from the form.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFeedback : function() {
        this.jqoForm.find("div.alert").remove();
        this.jqoForm.find(".has-error").removeClass("has-error");
    },

    ///////////////////////////////////////////////////////////////////////////
    // Simply clear out the form. This will be used after a successful 'save'
    // has occurred and we're ready to enter new attributes.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFields : function() { /* overload and extend (if necessary) */
        this.jqoForm.find("input").not("[type='checkbox']").val("");        
        this.jqoForm.find("input[type='checkbox']").prop("checked",false);
        this.jqoForm.find("textarea").val("");
    },

    ///////////////////////////////////////////////////////////////////////////
    // Enable or disable the 'Save' button within ourselves.
    ///////////////////////////////////////////////////////////////////////////

    enableSaveButton : function() {
        this.$("button[name=button_save]").prop("disabled",false);
    },

    disableSaveButton : function() {
        this.$("button[name=button_save]").prop("disabled",true);
    },

    /*
        UI Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // The user has pressed the ESCAPE key. We are going to shut down the form.
    ///////////////////////////////////////////////////////////////////////////

    onEscapeKey : function(event) {

        var context = event.data.context;

        switch ( event.keyCode ) {
            case 27:
                context.onClickCancel(event);
                break;
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Pull the attributes out from the form (using overloaded method) and
    // then attempt to validate them.
    ///////////////////////////////////////////////////////////////////////////

    onClickSave : function(event) { /* overload as required */

        this.clearFormFeedback();

        // could involve significant manual manipulation if, for ex., we have
        // select2 instances on there.

        var attrs = this.getFormAttrs(); /* overload */

        // if we are returned `undefined` then we will manually call our success
        // method. if we are returned `null` then we won't do anything
        // (assume the rest is automated). any other return value is considered
        // an error-specificiation, and so it is sent to `onAttrsInvalid`

        var error = this.validateAttrs(attrs); /* overload */
        if ( $.gettype(error).base === "undefined" ) {
            this.onAttrsValid(attrs);
        }
        else if ( error !== null ) {
            this.onAttrsInvalid(error);
        }

        // we may have been called manually, so double check
        // that we have an event to stop.
        if ( event ) {
            event.preventDefault();
            event.stopPropagation();
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // User has changed their mind.
    ///////////////////////////////////////////////////////////////////////////

    onClickCancel : function(event) {
        this.trigger("onFormCancel");
    },

    ///////////////////////////////////////////////////////////////////////////
    // The form is being submitted. We expect this to be called manually from
    // our 'onAttrsValid' method. If that is not the case (i.e., automatic
    // submission from pressing ENTER) then we have to force a call back to
    // 'onClickSave', and that method can take it from there.
    ///////////////////////////////////////////////////////////////////////////

    onSubmit : function(event) {

        if ( !this.attrs ) {
            event.preventDefault();
            event.stopPropagation();
            this.onClickSave(null);
        }

        else {

            if ( !this.allowDefaultSubmit ) {
                event.preventDefault();                
                event.stopPropagation();
            }

            // make a local copy of the attributes hash, as we are
            // passing it on to any caller that is listening. however
            // we want to create a new one for ourselves, breaking all
            // connections to the old one before passing it on. this
            // won't have any effect on the local copy we've set here.

            var attrs = this.attrs;
            var attrsOptions = this.attrsOptions;
            this.createFreshAttrs();
            this.trigger("onFormSubmit",this.formName,attrs,attrsOptions);
            attrs = attrsOptions = null;
        }
    },

    /*
        Validation results.
    */

    ///////////////////////////////////////////////////////////////////////////
    // There were validation problems with the fields entered. We will highlight
    // the field that has a problem and output the error message.
    //
    //  @error - object containing `field` and `msg` fields.
    ///////////////////////////////////////////////////////////////////////////

    onAttrsInvalid : function(error) { /* overload and extend (as required) */

        this.clearFormFeedback();

        // add a danger alert at the top of the form

        var alert = $.includejs.getTemplate(this.alertTemplateID,{msg:error.msg,classes:"alert-danger"});
        this.jqoForm.prepend(alert);

        // based upon the field that failed, we will highlight a given
        // UI control, so they know where the problem was. this is all based
        // on Twitter Bootstrap's form and field HTML layout. the field could
        // be an `input` or a `textarea`.

        var field = this.jqoForm.find("input[name="+error.field+"]");
        field = field.length ? field : this.jqoForm.find("textarea[name="+error.field+"]");
        if ( field.length ) {
            field.parent().addClass("has-error");
        }
    },    

    ///////////////////////////////////////////////////////////////////////////
    // The attributes hash has passed validation, so we will notify any listeners
    // of our success. Finally, clear the form and create a fresh attributes hash.
    //
    //  @attrs: The attributes hash returned from `getFormAttrs`.
    //
    ///////////////////////////////////////////////////////////////////////////

    onAttrsValid : function(attrs) { /* overload as required */

        this.clearFormFields();
        this.clearFormFeedback();

        // create a dismissable alert, if we have that text specified

        if ( this.successAlertText ) {

            var html_text = $.includejs.getTemplate(
                this.alertDismissTemplateID,
                {
                    classes:"alert-success",
                    msg:"<strong>Success!</strong> - " + _.result(this,"successAlertText")
                }
            );
            this.jqoForm.prepend(html_text);
        }

        // as our form has been validated, we can now submit it. notice that if we
        // don't have any attributes we're setting them to an empty object. we do this
        // so that our `onSubmit` method will know that the attributes have been processed.

        this.attrs = attrs || {};
        this.attrsOptions = null;
        this.jqoForm.submit();
    }

});

//---------------------------------------------------------------------------------------
// View: VBaseWidgetFormCreate
// Description: An extended form widget that creates a new model of a given type
//              (defined by derived views). We have overloaded some of the methods on
//              VBaseWidgetForm that were working with just an attributes hash to now
//              work with models; hence some of the function names might seem a bit off.
//              The request, invalid, sync, and error events (from the model) are 
//              captured here and dealt with. Alerts are displayed within the form as appropriate.
//
//              Two backbone events are created here: "onFormSave" and
//              "onFormCancel". These are triggered when that respective function
//              has completed (i.e., the model was successfuly saved), not just when
//              certain buttons are pushed. If you want to fiddle around with the model's
//              events directly, as a derived view, then you'll need to add your own hooks.
//
//              The error returned from the model's validation needs to be an object
//              with two fields (.msg and .field). `field` should match the name
//              of a given input field on the form, so it can be highlighted.
//              
//---------------------------------------------------------------------------------------

var VBaseWidgetFormCreate = VBaseWidgetForm.extend({

    /* overload and/or extend */
    id : undefined,
    templateID : undefined,
    successAlertText : undefined,
    alertTemplateID : "tpl-alert",
    alertDismissTemplateID : "tpl-alert-dismiss",
    requestText : undefined,
    allowDefaultSubmit : false,
    formName : undefined,

    className : function() {
        return _.result(VBaseWidgetForm.prototype,'className') + " widget-form-create";
    },

    // UI events for the HTML created by the view. inherit all past events and add our own.
    events : function() {
        return _.extend({},_.result(VBaseWidgetForm.prototype,'events'),{
        });
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() { /* extended */

        // empty references
        this.stopListening(this.attrs);
        return VBaseWidgetForm.prototype.remove.call(this);
    },

    /*
        Utility functions
    */

    ///////////////////////////////////////////////////////////////////////////
    // We need to create a model and bind some listeners to it. This is called
    // in two situations: initialize (construction) or because we've 
    // successfully created a model and passed it off to a listener already. Either
    // way we need a fresh one to work on.
    ///////////////////////////////////////////////////////////////////////////

    createFreshAttrs : function() { /* overloaded */

        // if we have an existing model, then remove all refs to it as
        // we're going to create a new one.

        if ( this.attrs ) {
            this.stopListening(this.attrs);
            this.attrs = null;
        }

        this.attrs = this.instantiateModel(); /* overload */

        // We deal directly with a single model for adding purposes. upon saving
        // we will either have an `invalid` event (client validation fail) or
        // `request` (client validation passed). if it passed, then we have
        // `sync` (server success) or `error` (server error).
        // two of the methods used here were defined in the base
        // view and so we'll be using them (onAttrs...).
        
        this.listenTo(this.attrs,"request",this.onModelRequest);
        this.listenTo(this.attrs,"invalid",this.onAttrsInvalid);
        this.listenTo(this.attrs,"sync",this.onAttrsValid);
        this.listenTo(this.attrs,"error",this.onModelError);        
    },

    ///////////////////////////////////////////////////////////////////////////
    // The attributes have been pulled (and parsed) from the form. We will
    // validate them through attempting to save the model to the server. If
    // validation fails, the server will never be contacted. Of course, by
    // doing this, we also may run into a server error, which will be caught
    // by our event listeners as well.
    //
    //  @attrs: attributes hash returned from the form (after our manipulation).
    //
    ///////////////////////////////////////////////////////////////////////////

    validateAttrs : function(attrs) { /* overloaded */

        // try to save the model, given a new attributes hash. we return
        // `null` to tell our caller that validation will be delayed and
        // automated, so we will deal with calling the respective success/error
        // functions ourselves (through our backbone event bindings).
        
        this.attrs.save(attrs,{wait:true});
        return null;
    },

    /*
        Backbone events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Sending a request to the server, as invalid was not triggered.
    //
    //  @options: A combination of backbone options and our own ('sb' prefix).
    ///////////////////////////////////////////////////////////////////////////

    onModelRequest : function(model,xhr,options) {

        this.clearFormFeedback();
        Spinner.get().show({msg:this.requestText,opacity:0});
    },

    ///////////////////////////////////////////////////////////////////////////
    // There were validation problems with the fields entered. We will highlight
    // the field that has a problem and output the error message. This comes
    // straight from the `model.validate` method of the model type we're using,
    // so we have to grab the error object alone and pass it on to our base
    // view.
    //
    //  @error - object containing `field` and `msg` fields.
    ///////////////////////////////////////////////////////////////////////////

    onAttrsInvalid : function(model,error,options) { /* overloaded and extended */
        VBaseWidgetForm.prototype.onAttrsInvalid.call(this,error);
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Not only has the model passed validation, but it has successfully been 
    // saved on the server as well. Trigger our success to let whoever cares 
    // about the new model know, and then reset ourselves.
    //
    // This is overloaded as we are receiving different parameters than the
    // VBaseWidgetForm version.
    //
    //  @model:     the model that was saved.
    //  @options:   direct from backbone's `save` call, some of our stuff might
    //              be in there too ('sb' prefix).
    //
    ///////////////////////////////////////////////////////////////////////////

    onAttrsValid : function(model,response,options) { /* overloaded */

        this.clearFormFields();
        this.clearFormFeedback();

        // create a dismissable alert, if we have the text specified
        if ( this.successAlertText ) {

            var html_text = $.includejs.getTemplate(
                this.alertDismissTemplateID,
                {
                    classes:"alert-success",
                    msg:"<strong>Success!</strong> - " + this.successAlertText
                }
            );
            this.jqoForm.prepend(html_text);
        }

        
        // as our form has been validated, we can now submit it.
        this.attrs = model;
        this.attrsOptions = options;
        this.jqoForm.submit();
        Spinner.get().hide();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to be saved to the server, as there was an error.
    // Display that error now.
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VBaseWidgetFormCreate__onModelError(model,xhr,options) {
        
        Spinner.get().hide(function(){
            app.dealWithAjaxFail(xhr,null,null);
        });
    }    

});

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

//---------------------------------------------------------------------------------------
// View:        VBaseWidgetPanel
// Description: Simple widget that renders a template to its element, using a member
//              data object as its attributes hash. Captures a single button's 'click'
//              event ("ok" button).
//
//              We can generate a single event here: onPanelOK.
//---------------------------------------------------------------------------------------

var VBaseWidgetPanel = Backbone.View.extend({

    /* overload */
    tagName : "div",
    className : "widget widget-panel",
    templateID : undefined,

    // UI events from the HTML created by this view
    events : {
        "click button[name=button_ok]" : "onClickOK"
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //  @settings:  data object that contains:
    //
    //              .templateAttrs
    //
    //              This contains the attributes hash used to fill the template.
    //
    //  @options:   Any flags that might be used internally.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {
        this.settings = settings || {};
        this.options = options || {};
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {        
        
        this.settings = null;
        this.options = null;

        this.trigger("cleanup");
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Simply render our template with our attributes hash. Notice that
    // we call `delegateEvents` as we have an events hash, this enables our parent
    // to re-render us without issue.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {
        this.$el.html($.includejs.getTemplate(this.templateID,this.settings.templateAttrs));
        this.$("*[data-toggle=tooltip]").tooltip();
        this.delegateEvents();
        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The button on our panel has been clicked. Generate the event for
    // our parent.
    ///////////////////////////////////////////////////////////////////////////

    onClickOK : function(event) {
        this.trigger("onPanelOK");
        event.preventDefault();
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Enable or disable the button within ourselves.
    ///////////////////////////////////////////////////////////////////////////

    enableOKButton : function() {
        this.$("button[name=button_ok]").prop("disabled",false);
    },

    disableOKButton : function() {
        this.$("button[name=button_ok]").prop("disabled",true);
    }

});

//---------------------------------------------------------------------------------------
// View: VBaseWidgetRecordEditableDisplay
// Description: One of two possible subViews of a VBaseWidgetRecordEditable. This
//              particular view simply renders a model's attributes.
//---------------------------------------------------------------------------------------

var VBaseWidgetRecordEditableDisplay = Backbone.View.extend({

    // creating new DOM element
    tagName : "div",
    
    /* overload and/or extend */
    className : "widget widget-record-editable-display",
    templateID : undefined,

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //  @settings:
    //
    //      .recordSettings. Which contains:
    //
    //          .model - the model we'll be displaying the attributes for.
    //
    //  @options:
    //
    //      Data object sent to VBaseWidgetRecordEditable-derived parent upon
    //      construction.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {        
        this.settings = settings || {};
        this.options = options || {};
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {        

        // all subview(s) will be listening for this event.
        this.trigger("cleanup");

        // empty references
        this.settings = null;
        this.options = null;

        // jsfiddle for super() testing: http://jsfiddle.net/hLjC2/
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render out the attributes. They will be passed through a filtering
    // function first, at which point any escaping/parsing/altering/etc. will
    // be done.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        var attrs = this.filterModelAttributes();
        this.$el.html($.includejs.getTemplate(this.templateID,attrs));
        this.$("*[data-toggle=tooltip]").tooltip();
        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Any escaping of the text attributes or manipulation of the attributes in
    // any way/shape/form must be done here. Always operate on/return a cloned
    // copy of the model's attributes.
    ///////////////////////////////////////////////////////////////////////////

    filterModelAttributes : function() { /* overload (when required) */
        // no-op.
        return _.clone(this.settings.recordSettings.model.attributes);
    }

});

//---------------------------------------------------------------------------------------
// View: VBaseWidgetRecordEditableEdit
// Description: One of two possible subViews to a VBaseWidgetRecordEditable. This
//              particular view presents a form for editing the model's attributes.
//              If the save button is pressed then we attempt to update the model
//              on the server, dealing with the backbone events of `change` and
//              `invalid` here (`sync` and `error` are dealt with in VBaseWidgetRecordEditable).
//
//              We generate two events here: onEditSave and onEditCancel.
//---------------------------------------------------------------------------------------

var VBaseWidgetRecordEditableEdit = Backbone.View.extend({

    // creating new DOM element
    tagName : "div",

    /* overload and/or extend */
    id : undefined,
    className : "widget widget-record-editable-edit",
    templateID : undefined,
    alertTemplateID : "tpl-alert",

    // UI events from the HTML created by this view
    events : {
        "click button[name=button_save]" : "onClickSave",
        "click button[name=button_cancel]" : "onClickCancel"
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //  @settings:
    //
    //      .recordSettings - the settings object from our parent. Contains:
    //
    //          .model - the model we'll be displaying the attributes for.
    //
    //  @options:
    //
    //      Data object sent to VBaseWidgetRecordEditable-derived parent upon
    //      construction.
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {

        // again, all we listen for here is 'change' and 'invalid'. we use 'change'
        // instead of 'sync' so we can trigger the appropriate trigger (since `destroy`)
        // also causes a sync and our parent view (VBaseWidgetRecordEditable) has to trigger an event
        // on 'destroy'.

        this.settings = settings || {};
        this.options = options || {};

        this.listenTo(this.settings.recordSettings.model,"invalid",this.onModelInvalid);
        this.listenTo(this.settings.recordSettings.model,"change",this.onModelChange);
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {        

        // all subview(s) will be listening for this event.
        this.trigger("cleanup");

        // empty all references
        this.stopListening(this.settings.recordSettings.model);
        this.settings = null;
        this.options = null;

        // jsfiddle for super() testing: http://jsfiddle.net/hLjC2/
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render our template with the attributes of the model. They will be passed
    // through a filtering function first, at which point any escaping/parsing/etc.
    // will be done. Finally, we post-process the form, as there may be some manual
    // manipulation required (e.g., for select2 instances).
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        // the attributes are obviously needed here because we are EDITING
        // them (duh guys, duh!)

        var attrs = this.filterModelAttributes();
        this.$el.html($.includejs.getTemplate(this.templateID,attrs));
        
        this.jqoForm = this.$("form");
        this.prepareForm(); /* overload */

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Any escaping of the text attributes or manipulation of the attributes in
    // any way/shape/form must be done here. Always operate/return a cloned
    // copy of the model's attributes.
    ///////////////////////////////////////////////////////////////////////////

    filterModelAttributes : function() { /* overload (when required) */
        // no-op.
        return _.clone(this.settings.recordSettings.model.attributes);
    },

    /*
        Utility functions.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Remove all of the feedback that may still be present on the form.
    ///////////////////////////////////////////////////////////////////////////

    clearFormFeedback : function() {

        // remove existing warnings/alerts (inc. success)
        this.jqoForm.find("div.alert").remove();
        this.jqoForm.find(".has-error").removeClass("has-error");
    },

    ///////////////////////////////////////////////////////////////////////////
    // Our editing form has already been rendered. However, if there is some manual
    // work that we have to do, then it will be done here.
    ///////////////////////////////////////////////////////////////////////////

    prepareForm : function() { /* overload as required */
        // no-op.
    },

    /*
        UI events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // We are going to pull the attributes from the form, which requires an
    // overloaded method as there is likely manual manipulation involved
    // (e.g., select2 instances). If those attributes have changed, we will 
    // attempt to update the model's attributes on the server.
    ///////////////////////////////////////////////////////////////////////////

    onClickSave : function(event) {

        this.clearFormFeedback();
        var attrs = this.getFormAttrs(); /* overload */        

        if ( this.settings.recordSettings.model.changedAttributes(attrs) ) {

            // will either generate 'invalid' (captured here) or 'request'
            // (captured on VBaseWidgetRecordEditable). then will generate
            // either 'change' (here) or 'error' (VBaseWidgetRecordEditable).

            this.settings.recordSettings.model.save(attrs,{
                sbRequestText : "Saving...",
                wait : true // wait for server OK before setting attr on model
            });
        }

        else {
            this.onClickCancel();
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // We're done. Notify whoever cares, so they can take action.
    ///////////////////////////////////////////////////////////////////////////

    onClickCancel : function(event) {
        this.trigger("onEditCancel");
    },

    /*
        Backbone events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // There were validation problems with the fields entered. We will highlight
    // the field that has a problem and output the error message.
    //
    // We expect the model's `validate` method to return an object containing
    // .msg and .field. The `field` value must correspond to the name that
    // is found on one of the `input` controls, so it can be highlighted.
    //
    //  @options: Straight from backbone - i.e., the model's `validate` func.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelInvalid : function(model,error,options) {        

        this.clearFormFeedback();

        // add a danger alert at the top of the form

        var alert = $.includejs.getTemplate(this.alertTemplateID,{msg:error.msg,classes:"alert-danger"});
        this.jqoForm.prepend(alert);

        // based upon the field that failed, we will highlight a given
        // UI control, so they know where the problem was.

        var field = this.jqoForm.find("input[name="+error.field+"]");
        if ( field.length ) {
            field.parent().addClass("has-error");
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model has successfully been saved on the server. Trigger the event
    // to inform others about it.
    //
    //  @options: Straight from backbone's `save` method.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelChange : function(model,options) {
        this.trigger("onEditSave",model,options);
        Spinner.get().hide();
    }

});

//---------------------------------------------------------------------------------------
// View: VBaseWidgetRecordEditable
// Description: This widget is used to display a model's attributes and give the user the
//              ability to edit them. We have a toolbar, for the buttons relating to the
//              record (e.g., select, edit). By default, we provide functionality for
//              select, edit, and delete buttons; although they do not need to exist in
//              the toolbar, as they'll just not be used then. Note that a toolbar
//              itself is not actually required, it can be null and then won't be
//              processed.
//
//              Beyond the toolbarView, we also have a recordView which either displays
//              the model's attributes or an edit form.
//
//              The 'Select' button simply add/removes a class to the element created here.
//              Delete attempts to `destroy` the contained model and 'Edit' changes the
//              recordView (contained here) to either a VBaseWidgetRecordEditableDisplay- or
//              VBaseWidgetRecordEditableEdit-derived view.
//
//              Notice that we do not add ourselves to any parent element here, we
//              simply render out our information and then our owner view will render
//              us in the appropriate position.
//
//              We trigger some events here that our parent will likely want to take
//              direct action on: onClickRecord, onRecordFlag, onRecordDestroy
//
//              However, we also trigger some events where there is no expectation that
//              our parent performs any actions: onRecordEdit, onRecordSave, onRecordCancel,
//              onRecordDeleteMaybe, onRecordDeleteYes, onRecordDeleteNo.
//---------------------------------------------------------------------------------------

var VBaseWidgetRecordEditable = Backbone.View.extend({

    /* overload and/or extend */
    tagName : "div",
    className : "widget widget-record-editable",
    templateID : undefined,
    toolbarElement : "div.toolbar",
    recordViewElement : "div.record-content",
    flagDialogTitle : undefined,
    flagDialogMsg : undefined,
    deleteDialogTitle : undefined,
    deleteDialogMsg : undefined,

    // UI events from the HTML created by this view
    events : {
        "click a.widget-record-editable-display-clickable" : "onClickRecord",
        "mouseenter a.widget-record-editable-display-clickable" : "onStartHoverRecord",
        "mouseleave a.widget-record-editable-display-clickable" : "onStopHoverRecord"
    },

    /*
        Backbone Methods.
    */

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    //
    //      We assume that the model this view will contain has already been
    //      loaded and setup before coming here.
    //
    //  @settings:
    //      This must be a data object containing several objects, rather than
    //      separate parameters. This is because if a single object is sent as
    //      a parameter to a Backbone.View-derived class's CONSTRUCTOR ONLY, then
    //      some of its properties (e.g., id, className) are copied over 
    //      directly. We don't want that here.
    //
    //      .model:         the model (i.e., record) that we will be operating on.
    //
    //  @options:
    //      Flags that might be useful. Might have passed through backbone as
    //      well as our own code (flags are prefixed with 'sb' for our stuff).
    //
    ///////////////////////////////////////////////////////////////////////////

    initialize : function(settings,options) {

        // the pageSettings might be used to, for ex., update our model's URL.
        this.settings = settings || {};
        this.options = options || {};

        // We bind to the model's request and error method as we will
        // control creating/removing the spinner. however, we also bind to
        // the `destroy` method here, because we are able to delete records
        // from this view. finally, we look for "change:is_flagged", as we
        // also allow users to do that operation. all editing is done
        // through a subview, so we needn't deal with global "change" or
        // with "invalid".
        //
        // notice that we don't bind to `sync` as we are more specific
        // in our 'success' methods: i.e., either destroy or change:is_flagged.

        this.updateModelURL(); /* overload */
        this.listenTo(this.settings.model,"request",this.onModelRequest);
        this.listenTo(this.settings.model,"change:is_flagged",this.onModelFlag);
        this.listenTo(this.settings.model,"destroy",this.onModelDestroy);
        this.listenTo(this.settings.model,"error",this.onModelError);

        // if anyone asks our model for a reference to its view
        // we send them a reference to ourselves.

        this.listenTo(this.settings.model,"getView",function(callback){
            callback(this);
        }.bind(this));

        // attributes of the contained model are added to the HTML5
        // data of the element we are creating here.

        this.$el.data("modelAttributes",_.clone(this.settings.model.attributes));

        // if we have been told to mark ourselves as selected already, then
        // do so now.

        if ( options.sbMakeSelected ) {
            this.makeSelected();
        }

        // create our toolbarView, which might be null if it's not
        // required here.

        this.toolbarView = this.instantiateToolbarView(); /* overload */
        
        if ( this.toolbarView ) {
            this.toolbarView.listenTo(this,"cleanup",this.toolbarView.remove);
            this.listenTo(this.toolbarView,"onClickToolbar",this.onClickToolbar);
        }

        // we will start out with a display subview. this is not rendered until our 
        // own `render` is called.

        this.isEditing = false;
        this.recordView = this.instantiateDisplayView( /* overload */
            {
                recordSettings : this.settings
            },
            {
                recordOptions : this.options
            }
        );
        this.recordView.listenTo(this,"cleanup",this.recordView.remove);        
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {        

        // all subview(s) will be listening for this event.
        this.trigger("cleanup");

        // empty references
        this.stopListening(this.recordView);
        this.stopListening(this.toolbarView);
        this.stopListening(this.settings.model);
        this.recordView = null;        
        this.toolbarView = null;
        this.settings = null;
        this.options = null;

        // jsfiddle for super() testing: http://jsfiddle.net/hLjC2/
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Render our skeleton template and then render in the toolbarView and recordView
    // (which is either "display" or "edit" views).
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        // notice that on toolbarView we are calling `delegateEvents`. if this
        // (parent) view is rendered more than once (without having remove/new called)
        // the main `this.$el.html` call below wipes out the event bindings for all
        // the child elements of `this.$el` (i.e., this.subView.$el). we don't need to
        // worry about `recordView` as long as there are no events on it when this is
        // called. and since we would only be on "displayView", not "editView" when we
        // are (re-)rendered, we're okay - but if the "displayView" had events on it, we'd
        // have to do the same thing for it.
        //
        // here's a jsfiddle that demonstrates the problem (and solution):
        //      http://jsfiddle.net/cFLtg/

        this.$el.html($.includejs.getTemplate(this.templateID));
        if ( this.toolbarView ) {
            this.$(this.toolbarElement).html(this.toolbarView.render().$el);
            this.toolbarView.delegateEvents();
        }
        else {
            this.$(this.toolbarElement).html("&nbsp;"); // this provides some content, so the div will still be rendered.
        }
        this.$(this.recordViewElement).html(this.recordView.render().$el);

        // enable the toolbar buttons that are available to the user
        if ( this.toolbarView ) {
            this.setToolbarButtonsEnabled();
        }

        return this;
    },

    /*
        Public Methods.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Based upon our current state, and the particular user that's looking,
    // we will figure out which toolbar buttons are enabled.
    ///////////////////////////////////////////////////////////////////////////

    setToolbarButtonsEnabled : function() { /* overload and extend (if needed) */

        // everything is disabled by default. if we aren't editing, we're ok.

        if ( !this.isEditing ) {
            this.toolbarView.setEnabled({
                select : true,
                edit : true,
                flag : true,
                delete : true
            });
        }

        else {
            this.toolbarView.setEnabled({});
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Add/remove/get the property of being "selected" from this record-editable
    // instance.
    ///////////////////////////////////////////////////////////////////////////

    makeSelected : function() {
        this.$el.addClass("widget-record-editable-selected");
    },

    removeSelected : function() {
        this.$el.removeClass("widget-record-editable-selected");
    },

    isSelected : function() {
        return this.$el.hasClass("widget-record-editable-selected");
    },

    /*
        UI Events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // One of the toolbar buttons that is associated directly with this record
    // has been clicked. We will deal with the cases of select, edit, and
    // delete here. If you have more buttons than that, you'll have to overload
    // and extend this method.
    //
    //  @buttonName - the `name` field from the HTML of the buttton.
    //  @button - the jqo of the button clicked
    //  @event - raw 'click' event data.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(buttonName,button,event) { /* overload and extend (if needed) */

        // SELECT

        if ( buttonName === "select" ) {

            if ( !this.isSelected() ) {
                this.makeSelected();
            }
            else {
                this.removeSelected();
            }
        }

        // EDIT

        else if ( buttonName === "edit" ) {

            if ( !this.isEditing ) {

                // notify our parent. although they needn't do anything with the
                // event. everything relating to editing is being handled
                // here, this is just in case they want to know what's going
                // on.
                this.trigger("onRecordEdit",this);

                this.isEditing = true;
                this.setToolbarButtonsEnabled(); // disables them all

                // remove our current recordView (i.e., display) and
                // create the edit recordView.

                this.stopListening(this.recordView);
                this.recordView.remove();
                this.recordView = new this.instantiateEditView( /* overload */
                    {
                        recordSettings : this.settings
                    },
                    {
                        recordOptions : this.options
                    }
                );
                this.recordView.listenTo(this,"cleanup",this.recordView.remove);

                // we are interested in two events on the `edit` view: save and cancel.
                // these are both only called when the edit recordView has completed the action(s)
                // and is ready to be replaced with the display recordView.

                this.listenTo(this.recordView,"onEditSave",this.onEditSave);
                this.listenTo(this.recordView,"onEditCancel",this.onEditCancel);            

                this.$(this.recordViewElement).html(this.recordView.render().$el);
            }
        }

        // FLAG

        else if ( buttonName === "flag" ) {

            // open a dialog asking them if they are sure.
            bsDialog.create({
                
                title : this.flagDialogTitle,
                msg : this.flagDialogMsg,
                ok : function() {                

                    // patch the record, setting it as flagged.

                    this.settings.model.save(
                    {
                        is_flagged : true
                    },
                    {
                        wait : true,
                        patch : true,
                        sbRequestText : "Flagging..."
                    });
                    
                }.bind(this),
                cancel : function(){}
            });
        }

        // DELETE

        else if ( buttonName === "delete" ) {

            this.trigger("onRecordDeleteMaybe",this);

            // open a dialog asking them if they are sure.
            bsDialog.create({
                
                title : this.deleteDialogTitle,
                msg : this.deleteDialogMsg,
                ok : function() {                    

                    // destroy the model: error or destroy will be triggered, both of
                    // which are captured here.

                    this.settings.model.destroy({
                        wait : true,
                        sbRequestText : "Removing..."
                    });
                    this.trigger("onRecordDeleteYes",this);
                    
                }.bind(this),
                cancel : function(){
                    this.trigger("onRecordDeleteNo",this);
                }.bind(this)
            });
        }
    },

    /*
        Triggered events
    */

    ///////////////////////////////////////////////////////////////////////////
    // The record has successfully been saved to the server. Trigger an event
    // for anyone who cares and then replace the edit recordView. Note that
    // our parent does NOT need to do anything on this event. Everything is
    // handled solely by us in terms of saving the record and updating our
    // own view (i.e., replacing subviews). However, that doesn't mean that
    // a parent won't want to know that we're doing these things.
    //
    //  @model, options: direct from backbone.
    ///////////////////////////////////////////////////////////////////////////

    onEditSave : function(model,options) {
        this.trigger("onRecordSave",this);
        this.onEditCancel(true);
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has cancelled their editing of the model. Remove the current
    // subview and replace it with the display subview. Again, we alert our
    // parent as to what's going on, but they needn't do anything here.
    //
    //  suppressEvent - Useful when called internally, simply to cleanup.
    ///////////////////////////////////////////////////////////////////////////

    onEditCancel : function(suppressEvent) {

        if ( !suppressEvent ) {
            this.trigger("onRecordCancel",this);
        }
        
        this.stopListening(this.recordView);
        this.recordView.remove();
        this.isEditing = false;

        this.recordView = this.instantiateDisplayView(
            {
                recordSettings : this.settings
            },
            {
                recordOptions : this.options
            }
        );
        this.recordView.listenTo(this,"cleanup",this.recordView.remove);

        this.$(this.recordViewElement).html(this.recordView.render().$el);

        // decide which header buttons are available
        this.setToolbarButtonsEnabled();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user has clicked on this particular record, as something in
    // the `display` subView contained an `a` that was flagged clickable. Pass 
    // along the model's attributes, as well as the raw event itself, through 
    // triggering the "onClickRecord" event, which our parent is listening for.
    ///////////////////////////////////////////////////////////////////////////

    onClickRecord : function(event) {
        this.trigger("onClickRecord",this.$el.data("modelAttributes"),event);
        event.preventDefault();
        event.stopPropagation();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user is hovering over a clickable record. Let's highlight it.
    ///////////////////////////////////////////////////////////////////////////

    onStartHoverRecord : function(event) {
        this.trigger("onStartHoverRecord",this,event);        
        this.$el.addClass("widget-record-editable-highlighted");
        event.stopPropagation();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The user was but is no longer hovering over a clickable record. Let's
    // remove our highlight.
    ///////////////////////////////////////////////////////////////////////////

    onStopHoverRecord : function(event) {
        this.trigger("onStopHoverRecord",this,event);
        this.$el.removeClass("widget-record-editable-highlighted");
        event.stopPropagation();
    },

    /*
        Backbone events.
    */

    ///////////////////////////////////////////////////////////////////////////
    // Sending a request to the server. May be for either `destroy` or `save`.
    //
    //  @options: Mixture of backbone and my own ('sb' prefix).
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelRequest : function(model,xhr,options) {
        Spinner.get().show({msg:options.sbRequestText,opacity:0});
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model has been successfully flagged on the server. If we are supposed
    // to keep ourselves (i.e., sbKeepRecord) then we will add the appropriate
    // class to our element and re-set our toolbar. Either way, we notify our
    // listening parent that we have been flagged.
    //
    //  @options: Mixture of backbone and my own ('sb' prefix).
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelFlag : function(model,value,options) {        
        
        options.sbKeepRecord = this.shouldKeepRecordOnFlag(model,value,options);
        if ( options.sbKeepRecord ) {
            this.$el.addClass("widget-record-editable-flagged");
            //this.removeSelected(); // can't select flagged records
            this.setToolbarButtonsEnabled();
        }
        this.trigger("onRecordFlag",model,value,options);
        Spinner.get().hide();
    },

    ///////////////////////////////////////////////////////////////////////////
    // A record has been flagged. Before we send word of this back up to our
    // parent, let's figure out if we want to keep them in any list that they
    // might be contained in.
    ///////////////////////////////////////////////////////////////////////////

    shouldKeepRecordOnFlag : function(model,value,options) { /* overload (as required) */
        // assume: no.
        //fixme: this needs to be overloaded to say "yes" only when it's isUser
        return true;
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model has successfully been destroyed on the server. Trigger the event
    // to inform others about it (i.e., we'll probably be removed from the DOM
    // now, but it's not up to us).
    //
    //  @options: Mixture of backbone and my own ('sb' prefix).
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelDestroy : function(model,response,options) {
        this.trigger("onRecordDestroy",model,response,options);
        Spinner.get().hide();
    },

    ///////////////////////////////////////////////////////////////////////////
    // The model failed to either be saved or destroyed on the server. Display
    // the error to the user.
    //
    //  @options: All backbone.
    //
    ///////////////////////////////////////////////////////////////////////////

    onModelError : function VBaseWidgetRecordEditable__onModelError(model,xhr,options) { /* overload (as required) */
        
        Spinner.get().hide(function(){
            app.dealWithAjaxFail(xhr,undefined,undefined);
        });
    }

});

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

//---------------------------------------------------------------------------------------
// View: VBaseWidgetToolbar
// Description: The toolbar contains one or more buttons which may be clicked (enabling
//              them is done through here). Upon being clicked the "onClickToolbar"
//              event is triggered, with the name of the button as the parameter.
//
//              Captures the click of all buttons with the .toolbar_action class on them,
//              including drop-down options of a button (`a` tag, rather than `button` tag).
//
//              Assumes that all buttons that are capturable by this view have a `name`
//              field setup in HTML.
//
//              All buttons are disabled by default.
//---------------------------------------------------------------------------------------

var VBaseWidgetToolbar = Backbone.View.extend({

    // creating a new element
    tagName : "div",

    /* overload */
    id : undefined,
    className : "widget widget-toolbar",
    templateID : undefined,

    // UI events from the HTML created by this view
    events : {
        "click button.toolbar_action" : "onClickToolbar",
        "click a.toolbar_action" : "onClickToolbar"
    },

    ///////////////////////////////////////////////////////////////////////////
    // - Constructor
    ///////////////////////////////////////////////////////////////////////////

    initialize : function() {
    },

    ///////////////////////////////////////////////////////////////////////////
    // This view is being removed from the DOM. Let's trigger an event that 
    // our subview(s) will respond to, thereby removing themselves too after 
    // propagating the event to their own sub-views (and so on).
    //
    // source: http://unspace.ca/blog/avoiding-memory-leaks-in-backbone/
    ///////////////////////////////////////////////////////////////////////////

    remove : function() {

        // all subview(s) will be listening for this event.
        this.trigger("cleanup");

        // jsfiddle for super() testing: http://jsfiddle.net/hLjC2/
        return Backbone.View.prototype.remove.call(this);
    },

    ///////////////////////////////////////////////////////////////////////////
    // All buttons are disabled by default. Enable the ones we want.
    //
    //  @buttons:
    //
    //      object containing a property for each button that we want to 
    //      enable (e.g., {filter:true,save:true}). Each property should correspond
    //      to a `name` value found on a particular button.
    ///////////////////////////////////////////////////////////////////////////

    setEnabled : function(buttons) {

        this.$("button").prop("disabled",true);
        for ( var prop in buttons ) {
            if ( buttons[prop] ) {
                this.$("button[name="+prop+"]").prop("disabled",false);
            }
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Return an object with all of the enabled buttons as properties.
    // The properties will have the text from the button's `name` field.
    ///////////////////////////////////////////////////////////////////////////

    getEnabled : function() {

        var enabledButtons = {};
        this.$("button").each(function(index){
            if ( $(this).prop("disabled") === false ) {
                var name = $(this).prop("name");
                enabledButtons[name] = true;
            }
        });

        return enabledButtons;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Grab the jqo for the button with the name given. Will have length=0
    // on failure. If we can't find a `button` with that name, then we'll
    // look for an `a` element (as could be a sub-button).
    ///////////////////////////////////////////////////////////////////////////

    getButton : function(buttonName) {
        var button = this.$("button[name="+buttonName+"]");
        if ( !button.length ) {
            button = this.$("a[name="+buttonName+"]");
        }
        return button;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Someone has clicked either one of the buttons or one of the dropdown button
    // links. Trigger an event for anyone who cared to listen.
    ///////////////////////////////////////////////////////////////////////////

    onClickToolbar : function(event) {

        var button = $(event.currentTarget);
        var buttonName = button.prop("name");
        this.$("*[data-toggle=tooltip]").tooltip("hide");
        this.trigger("onClickToolbar",buttonName,button,event);
        event.preventDefault();
    },    

    ///////////////////////////////////////////////////////////////////////////
    // Generate the HTML for the toolbar and disable all of the buttons.
    ///////////////////////////////////////////////////////////////////////////

    render : function() {

        this.$el.html($.includejs.getTemplate(this.templateID));
        this.setEnabled({});
        this.$("*[data-toggle=tooltip]").tooltip();

        return this;
    }

});

