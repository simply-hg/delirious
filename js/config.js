var fm_key, fm_url, fm_user;

var groups       = {};
var feeds        = {};
var feeds_groups = {};
var favicons     = {};

// Some settings
var transition   = "";
var html_content = "";
var show_empty_groups = "false";
var sharing = "email";
var sharing_msg = "Check out this nice article I found: %url%";
var started = false;

var items              = [];
var saved_items        = [];
var session_read_items = [];

var fav_groups = [];
var fav_feeds  = [];

var default_widgets = [
	{place:"a1", fnc: "widgetButtonHotView", options: {}},
	{place:"b1", fnc: "widgetButtonSaved", options: {}},
	{place:"a2", fnc: "widgetShowFavFeeds", options: {}},
	{place:"b2", fnc: "widgetShowFavGroups", options: {}},
	{place:"a3", fnc: "widgetSystemGroups", options: {}},
	{place:"b3", fnc: "widgetCustomGroups", options: {}},
	{place:"a4", fnc: "widgetButtonKindling", options: {}},
	{place:"b4", fnc: "widgetButtonSparks", options: {}},
	{place:"a5", fnc: "widgetButtonReloadFavicons", options: {}},
	{place:"b5", fnc: "widgetButtonSettings", options: {}},
	{place:"a6", fnc: "widgetButtonEditHomescreen", options: {}},
];
var widgets = [];

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
var called_groups    = false;
var called_edit_homescreen = false;

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
		sharing      = $.jStorage.get("fmjs-sharing", sharing);
		sharing_msg  = $.jStorage.get("fmjs-sharing-msg", sharing_msg);
		
		saved_items = $.jStorage.get("fmjs-local-items", []);
		widgets     = $.jStorage.get("fmjs-widgets", default_widgets);
		
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
 	console.log("start");
});
