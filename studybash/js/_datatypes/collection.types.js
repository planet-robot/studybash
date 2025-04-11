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