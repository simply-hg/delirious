"use strict";
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

// These should be arrays i think
var groups       = [];
var feeds        = [];
var feeds_groups = [];
var favicons     = [];


var widget_recent_items = 10;

var items              = [];
var saved_items        = [];
var session_read_items = [];
var unread_counter = {};
var items_loaded = false;
var started_items_load = false;

var feeds_hash = "none";
var feed_counter = 0;

var fav_groups = [];
var fav_feeds  = [];

var dm_autosync;

var default_widgets = [
	{place: "a1", fnc: "widgetButtonHotView", options: {}},
	{place: "b1", fnc: "widgetButtonSaved", options: {}},
	{place: "a2", fnc: "widgetShowFavFeeds", options: {}},
	{place: "b2", fnc: "widgetShowFavGroups", options: {}},
	{place: "a3", fnc: "widgetSystemGroups", options: {}},
	{place: "b3", fnc: "widgetCustomGroups", options: {}},
	{place: "a4", fnc: "widgetButtonKindling", options: {}},
	{place: "b4", fnc: "widgetButtonSparks", options: {}},
	{place: "a5", fnc: "widgetButtonReloadFavicons", options: {}},
	{place: "b5", fnc: "widgetButtonSettings", options: {}},
	{place: "a6", fnc: "widgetButtonEditHomescreen", options: {}},
	{place: "b6", fnc: "widgetButtonLogout", options: {}}
];
var widgets = [];

var dm_config = {
	"url": "",
	"key": "",
	"user": "",
	"transition": "slide",
	"html_content": "escape", // Values: "raw", "escape"
	"show_empty_groups": false,
	"sharing": "email", // "email", "all"
	"sharing_mobile": true,
	"sharing_msg": "Check out this nice article I found: %url%",
	"order_items": "asc",
	"groupview": "items",
	"paginate_items": 100,
	"widget_recent_items": 10
}

// Some default settings
var transition   = "slide";
//var html_content = "escape";

var started = false;



var dm_data = {
	feed_counter: 0,
	feeds_hash: "none",
	favicons: []
}

var loading           = 0; // counts current loading processes
var auth_success      = false; // if a successful auth has been registered this is true. helps on stopped or failed connections. Not (!) used for authentification
var last_dm_refresh    = 0; // unix timestamps in seconds when were items refreshed last time
var last_fever_refresh = 0; // unix timestamps in seconds when Server last refreshed items
var last_dm_group_show = now();

function getSettings() {
	console.log(dm_config);
	dm_config = $.jStorage.get("dm-config", dm_config);
	dm_data   = $.jStorage.get("dm-data", dm_data);
	console.log(dm_config);

	dm_key  = getOption("key");//$.jStorage.get("dm-key", "");
	dm_url  = getOption("url");//$.jStorage.get("dm-url", "");
	dm_user = getOption("user");//$.jStorage.get("dm-user", "");
	
	transition = getOption("transition");//$.jStorage.get("dm-transition", transition);

	feeds_hash   = $.jStorage.get("dm-feed-hash", feeds_hash);
	feed_counter = $.jStorage.get("dm-feed-counter", feed_counter);
	favicons     = $.jStorage.get("dm-favicons", favicons);

	saved_items = $.jStorage.get("dm-local-items", []);
	widgets     = $.jStorage.get("dm-widgets", default_widgets);
	
	fav_feeds  = $.jStorage.get("dm-fav-feeds", []);
	fav_groups = $.jStorage.get("dm-fav-groups", []);
	
	// Let's be sure that old settings are removed...
	$.jStorage.deleteKey("dm-sharing-mobile");
	$.jStorage.deleteKey("dm-html-content");

	// Still in use:
	$.jStorage.deleteKey("dm-key");
	$.jStorage.deleteKey("dm-url");
	$.jStorage.deleteKey("dm-user");
	$.jStorage.deleteKey("dm-favicons");
	$.jStorage.deleteKey("dm-local-items");
	$.jStorage.deleteKey("dm-transition");
	$.jStorage.deleteKey("dm-groupview");
	$.jStorage.deleteKey("dm-sharing");
	$.jStorage.deleteKey("dm-sharing-msg");
	$.jStorage.deleteKey("dm-order-items");
	$.jStorage.deleteKey("dm-widget-recent-items");
	$.jStorage.deleteKey("dm-show-empty-groups");
	
	$.mobile.defaultPageTransition = transition;

	return true;

}
			
$(document).bind("mobileinit", function () {
	//apply overrides here
	console.log("mobilestart");
	getSettings();
	registerEventHandlers();
	start();
});

function getFever(args) {
	return getOption("url") + "?api" + args;	
}
function getURL() {
	return getOption("url");
}

function getOption(which) {
	if ( _.has(dm_config), which ) {
		return dm_config[which];
	} else {
		console.log("Get Config unbekannt: " + which);
		return -1;
	}
}

function saveOptions() {
	$.jStorage.set("dm-config", dm_config);
}

function setOption(which, value) {
	if ( _.has(dm_config), which ) {
		dm_config[which] = value;
		//$.jStorage.set("dm-config", dm_config);
	} else {
		console.log("Set Config unbekannt: " + which);
		return -1;
	}	
}