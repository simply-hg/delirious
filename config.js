var fm_key, fm_url, fm_user;

var groups       = {};
var feeds        = {};
var feeds_groups = {};
var favicons     = {};

// Some settings
var transition   = "";
var html_content = "";
var show_empty_groups = "false";

var items              = [];
var saved_items        = [];
var session_read_items = [];

var fav_groups = [];
var fav_feeds  = [];

// For navigation purposes to refresh listviews
var called_group     = false;
var called_saved     = false;
var called_feed      = false;
var called_sparks    = false;
var called_hot       = false;
var called_all_feeds = false;
var called_kindling  = false;
var called_single    = false;
var called_home      = false; // well, we are not calling home :s just a naming coincidence
var called_feedgroup = false;

var loading           = 0; // counts current loading processes
var auth_success      = false; // if a successful auth has been registered this is true. helps on stopped or failed connections. Not (!) used for authentification
var last_fmjs_refresh   = 0; // unix timestamps in seconds when were items refreshed last time
var last_fever_refresh = 0; // unix timestamps in seconds when Server last refreshed items

function getSettings() {
  if ( $.jStorage.storageAvailable() ) {
		fm_key       = $.jStorage.get("fmjs-key", "");
		fm_url       = $.jStorage.get("fmjs-url", "");
		fm_user      = $.jStorage.get("fmjs-user", "");
		favicons     = $.jStorage.get("fmjs-favicons");
		transition   = $.jStorage.get("fmjs-transition", "slide");
		html_content = $.jStorage.get("fmjs-html-content", "escape");
		groupview    = $.jStorage.get("fmjs-groupview", "items");
		show_empty_groups = $.jStorage.get("fmjs-show-empty-groups", "false");
		console.log('loaded set' + show_empty_groups);
		saved_items = $.jStorage.get("fmjs-local-items", []);
		
		fav_feeds  = $.jStorage.get("fmjs-fav-feeds", []);
		fav_groups = $.jStorage.get("fmjs-fav-groups", []);
		 $.mobile.defaultPageTransition = transition;
		return true;
	} else {
		return false;
	}
}


$(document).bind("mobileinit", function(){
  //apply overrides here
  getSettings();
 
});
