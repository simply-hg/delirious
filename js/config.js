/*
The MIT License (MIT)

Copyright (c) 2013 Hans-Georg Kluge

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var dm_key, dm_url, dm_user;

var groups       = {};
var feeds        = {};
var feeds_groups = {};
var favicons     = {};

// Some settings
var transition   = "slide";
var html_content = "escape";
var show_empty_groups = "false";
var sharing = "email";
var sharing_msg = "Check out this nice article I found: %url%";
var started = false;
var order_items = "asc";
var groupview = "items";
var paginate_items = "100";

var items              = [];
var saved_items        = [];
var session_read_items = [];
var unread_counter = {};
var items_loaded = false;
var started_items_load = false;

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
var last_dm_refresh    = 0; // unix timestamps in seconds when were items refreshed last time
var last_fever_refresh = 0; // unix timestamps in seconds when Server last refreshed items
var last_dm_group_show = now();

function getSettings() {

	dm_key            = $.jStorage.get("dm-key", "");
	dm_url            = $.jStorage.get("dm-url", "");
	dm_user           = $.jStorage.get("dm-user", "");
	favicons          = $.jStorage.get("dm-favicons", []);
	transition        = $.jStorage.get("dm-transition", transition);
	html_content      = $.jStorage.get("dm-html-content", html_content);
	groupview         = $.jStorage.get("dm-groupview", groupview);
	show_empty_groups = $.jStorage.get("dm-show-empty-groups", show_empty_groups);
	order_items       = $.jStorage.get("dm-order-items", order_items);
	sharing           = $.jStorage.get("dm-sharing", sharing);
	sharing_msg       = $.jStorage.get("dm-sharing-msg", sharing_msg);
	paginate_items    = $.jStorage.get("dm-paginate-items", paginate_items);
	
	saved_items  = $.jStorage.get("dm-local-items", []);
	widgets      = $.jStorage.get("dm-widgets", default_widgets);
	
	fav_feeds  = $.jStorage.get("dm-fav-feeds", []);
	fav_groups = $.jStorage.get("dm-fav-groups", []);
	
	$.mobile.defaultPageTransition = transition;

	return true;

}


			
$(document).bind("mobileinit", function(){
	//apply overrides here
	console.log("mobilestart");
	getSettings();
	registerEventHandlers();
	start();
});
