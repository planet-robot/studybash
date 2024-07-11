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