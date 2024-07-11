/*
    "WSelect2" - Simple wrapper class for select2 instances.

    Dependencies:
    -------------

        - http://ivaynberg.github.io/select2/
        - http://jquery.com/
        - http://underscorejs.org/

    Example:
    --------

        // optional: takes an option for the select and makes a select2 object from it
        function makeElement(value) {
            return { id : value, text : value + " (!)" };
        }

        // optional: given the current selection, return what should be shown in select2
        function filter(ext_data) {
            if ( ext_data.is_user ) {
                return $.trim(ext_data.value).toUpperCase();
            }
            else {
                return ext_data.data ? ext_data.data.id : "";
            }
        }

        var sel = new WSelect2({
            makeElement : makeElement, // optional
            filterSelection : filter, // optional
            elem : $("#my_hidden_select")
        });

        sel.init({            
            allowClear : false,            
            preventNew : false,
            placeholder : "How many fingers?",
            raw : ["one","two","three"] // can send `data` instead (ary of objects, with .id, .text),
            //tokenSeparators : [","," "] // optional, only used if `tags` are present
        });

*/

/*
    Public methods.
*/

///////////////////////////////////////////////////////////////////////////////
// Constructor
//
//  @options:
//      .elem           (required) the hidden input, jQuery element that we're taking over
//      .makeElement    (optional) if sending `raw` in `init` this converts each element into an object
//      .filter          (optional) when an object is selected in the s2, what should we show?
//
///////////////////////////////////////////////////////////////////////////////

function WSelect2(options) {

    if ( !( this instanceof WSelect2 ) ) {
        throw new Error("Must be called with `new`");
    }

    this.elem = options.elem;
    this.makeElement = options.makeElement;
    this.filterSelection = options.filterSelection;
    this.__class_types = ["WSelect2"];
}

///////////////////////////////////////////////////////////////////////////////
// Convert the `elem` given in constructor into a select2 instance and setup
// the choices/tags that are available. There is no trouble to call this multiple
// times, it will properly reset itself each time before being re-setup.
//
// @options:
//      .tags - array of strings. data will be ignored.
//      .defaultTags - array of strings. only if `.tags` is present (use `set` to preserve id/text)
//      .raw - array of values that will be converted into objects (.id/.text)
//      .data - array of objects to be used directly
//      .tokenSeparators - array of chars (optional)
//      .preventNew - stop new options being added to the select2 instance
//
///////////////////////////////////////////////////////////////////////////////

WSelect2.prototype.init = function WSelect2__init(options) {

    if ( this.elem.select2 ) {
        this.reset();
    }

    this.data = undefined;
    this.tags = undefined;
    this.raw = undefined;

    // three modes:
    // (1) tags
    // (2) raw - send an array of string values (or other if `makeElement` was given)
    // (3) data - just copy over to the data object array

    if ( options.tags ) {
        
        this.tags = options.tags;

        // add the default tags, if we have some. select2 expects them to be like this: <input type='hidden' value='one,two,three'>

        if ( options.defaultTags && options.defaultTags.length ) {
            var str = "";
            for ( x=0; x < options.defaultTags.length; x++ ) {
                if ( x ) {
                    str += ",";
                }
                str += options.defaultTags[x];
            }
            this.elem.attr("value",str);
        }
        else {
            options.defaultTags = null;
        }
    }
    else if ( options.raw ) {
        this.raw = _.clone(options.raw);
        this.makeArray();
    }
    else if ( options.data ) {
        this.data = _.clone(options.data);
    }

    // instantiate the select2 instance, using the options setup above.
    // note: to mess around with this stuff, look here for a jsfiddle: http://jsfiddle.net/9jKCF/2/

    var s2options = {

        data : this.data,
        tags : this.tags,
        tokenSeparators : ( this.tags ? options.tokenSeparators : undefined ),

        allowClear : options.allowClear ? true : false,
        placeholder : options.placeholder ? options.placeholder : undefined,
        formatSelection : _.bind(this.formatSelection,this),

        createSearchChoice : ( !options.preventNew ? this.newEntry : function(){return null;} )
    };

    // if there are no defaults, regardless of our mode, then remove the "No matches" message.

    if (
            ( this.tags && !options.defaultTags && !options.preventNew ) ||
            ( !this.tags && !this.data && !options.preventNew )
        )
    {
        _.extend(s2options,{formatNoMatches:function(term){return "";}});
    }

    this.elem.select2(s2options);
}

///////////////////////////////////////////////////////////////////////////////
// Enable/disable the select2.
///////////////////////////////////////////////////////////////////////////////

WSelect2.prototype.enable = function WSelect2__enable() {
    this.elem.select2("enable",true);    
}

WSelect2.prototype.disable = function WSelect2__disable() {
    this.elem.select2("enable",false);    
}

///////////////////////////////////////////////////////////////////////////////
// Get the jqo associated with the actual select2 control. Note that if you
// just need to do .select("something") then you would use `this.elem`
///////////////////////////////////////////////////////////////////////////////

WSelect2.prototype.getContainer = function WSelect2__getContainer() {
    return this.elem.select2("container");
}

///////////////////////////////////////////////////////////////////////////////
// Make it so nothing is selected.
///////////////////////////////////////////////////////////////////////////////

WSelect2.prototype.reset = function WSelect2__reset() {
    this.elem.select2("data",null);
}

///////////////////////////////////////////////////////////////////////////////
// Make it so something is selected.
//
//  @id -   Must match the `id` of one of the objects present. Can send an 
//          array if you want to select several.
///////////////////////////////////////////////////////////////////////////////

WSelect2.prototype.set = function WSelect2__set(id) {
    this.elem.select2("val",id);
}

///////////////////////////////////////////////////////////////////////////////
// Make it so something is selected.
//
//  @obj    You are sending an object with .id and .text. It need not match
//          an existing object in the select. The existing options will remain
//          but this new one (if is new), will currently be selected. Just like
//          they have typed it and chosen it themselves. Of course, if it
//          DOES match something that's already there, then it will be highlighted
//          when they open the drop-down (as if it was there because they
//          selected it).
///////////////////////////////////////////////////////////////////////////////

WSelect2.prototype.setData = function WSelect2__setData(obj) {
    this.elem.select2("data",obj);
}

///////////////////////////////////////////////////////////////////////////////
// Retrieve the currently selected item(s) in the select2.
//
//  @return -   an array of objects, each one representing a selection. the objects
//              contain .id and .text, just like the defaults, but we've also
//              added in .isNew for the ones that were added by the user.
///////////////////////////////////////////////////////////////////////////////

WSelect2.prototype.getSelection = function WSelect2__getSelection() {

    var data = this.elem.select2("data");

    // if we only have one, let's build our array manually.
    if ( !$.isArray(data) ) {
        if ( data ) {
            data = [data];
        }
        else {
            data = [];
        }
    }

    // go through the array and make sure that all of the `.isNew`
    // selections are *actually* new. the reason this might be
    // an issue is when using tags... if you type "one" and then hit
    // SPACE (assuming that's a separator) then it considers that as a user-
    // entered one, even if "one" is in the default list. if you type "one"
    // and then hit ENTER, it doesn't consider it new.

    for ( x=0; x < data.length; x++ ) {

        var sel = data[x];
        if ( sel.isNew ) {
            
            var matches = _.filter(
                this.tags ? this.tags : this.data,
                function(o) {
                    return ( ( o.text === sel.text ) && ( !o.isNew ) );
                }
            );

            if ( matches.length ) {
                sel.isNew = false;
            }
        }
    }

    return data;
}

/*
    Private methods.
*/

WSelect2.prototype.makeArray = function WSelect2__makeArray() {

    this.data = [];
    for ( x=0; x < this.raw.length; x++ ) {
        var obj = {}
        if ( this.makeElement ) {
            obj = this.makeElement(this.raw[x]);
        }
        else {
            obj.id = obj.text = this.raw[x];
        }
        this.data.push(obj);
    }
}

///////////////////////////////////////////////////////////////////////////////
// The user is creating their own entry for the select2 instance. This creates
// the object that is constructed out the value they enter.
///////////////////////////////////////////////////////////////////////////////

//fixme: this is what i should be giving the user access to, not 'filterSelection'
WSelect2.prototype.newEntry = function WSelect2__newEntry(value) {
    return { id : value, text : value, isNew : true };
}

/////////////////////////////////////////////////////////////////////////////////////
// A selection is about to be displayed in a select2 control. We are receiving
// a data object from the select2 instance, which contains .id (to return) and
// .text (to show). If we have a filterSelection function setup, then we'll send
// the entire object to it.
//
//  @data (obj) => the object from select2 (i.e., .id, .text)
//  @con (obj) => [IGNORED] the container
//  @escapeMarkup =>    a function that escapes the necessary characters for output
//                      (e.g., < becomes &lt;)
/////////////////////////////////////////////////////////////////////////////////////

WSelect2.prototype.formatSelection = function WSelect2__formatSelection(data,con,escapeMarkup) {

    var text = this.filterSelection ? this.filterSelection(data) : data.text;

    // just in case we aren't supposed to allow it to be added (i.e., filterSelection returned
    // null) then we'll double check before trying to escape it.
    return text ? escapeMarkup(text) : undefined;
}