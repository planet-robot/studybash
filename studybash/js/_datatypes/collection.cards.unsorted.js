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