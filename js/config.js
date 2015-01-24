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
	"widget_recent_items": 10,
	"saved_items_compressed":false
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

function getStorageKey(which, default_value) {
	if ( simpleStorage.canUse() ) {
		var data = simpleStorage.get(which);

		if ( _.isUndefined(data) ) {
			return default_value;
		} else {
			return data;
		}
	} else {
		return default_value;
	}
}

function getSettings() {

	dm_config = getStorageKey("dm-config", dm_config);
	dm_data   = getStorageKey("dm-data", dm_data);
	dbgMsg(dm_config);
	dm_key  = getOption("key");//simpleStorage.get("dm-key", "");
	dm_url  = getOption("url");//simpleStorage.get("dm-url", "");
	dm_user = getOption("user");//simpleStorage.get("dm-user", "");
	
	transition = getOption("transition");//simpleStorage.get("dm-transition", transition);

	feeds_hash   = getStorageKey("dm-feed-hash", feeds_hash);
	feed_counter = getStorageKey("dm-feed-counter", feed_counter);
	favicons     = getStorageKey("dm-favicons", favicons);

	var saved_items_compressed = getStorageKey("dm-saved-items", "");
	//dbgMsg("Saved items:");
	//dbgMsg(saved_items_compressed);
	if ( saved_items_compressed == "" ) {
		// no saved items
		saved_items = [];
	} else {
		saved_items = JSON.parse( LZString.decompressFromUTF16(saved_items_compressed) );
	}
	
	widgets    = getStorageKey("dm-widgets", default_widgets);
	
	fav_feeds  = getStorageKey("dm-fav-feeds", []);
	fav_groups = getStorageKey("dm-fav-groups", []);
	
	// Let's be sure that old settings are removed...
	simpleStorage.deleteKey("dm-sharing-mobile");
	simpleStorage.deleteKey("dm-html-content");

	// Still in use:
	simpleStorage.deleteKey("dm-key");
	simpleStorage.deleteKey("dm-url");
	simpleStorage.deleteKey("dm-user");
	//simpleStorage.deleteKey("dm-favicons");
	simpleStorage.deleteKey("dm-local-items");
	simpleStorage.deleteKey("dm-transition");
	simpleStorage.deleteKey("dm-groupview");
	simpleStorage.deleteKey("dm-sharing");
	simpleStorage.deleteKey("dm-sharing-msg");
	simpleStorage.deleteKey("dm-order-items");
	simpleStorage.deleteKey("dm-widget-recent-items");
	simpleStorage.deleteKey("dm-show-empty-groups");
	$.jStorage.flush();
	$.mobile.defaultPageTransition = transition;

	return true;

}
			
$(document).bind("mobileinit", function () {
	//apply overrides here
	dbgMsg("mobilestart");
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
		dbgMsg("Get Config unbekannt: " + which);
		return -1;
	}
}

function saveOptions() {
	var worked = simpleStorage.set("dm-config", dm_config);
	dbgMsg(worked);
}

function setOption(which, value) {
	if ( _.has(dm_config), which ) {
		dm_config[which] = value;
		//simpleStorage.set("dm-config", dm_config);
	} else {
		dbgMsg("Set Config unbekannt: " + which);
		return -1;
	}	
}