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

var widget_places = ["a1", "b1", "a2", "b2", "a3", "b3", "a4", "b4", "a5", "b5", "a6", "b6", "a7", "b7", "a8", "b8", "a9", "b9"];
var defined_widgets = [
	// Some Buttons:
	{fnc: "widgetButtonHotView", title: "Button: Show Hot Items", desc: ""},
	{fnc: "widgetButtonSaved", title: "Button: Show Saved Items", desc: ""},
	{fnc: "widgetButtonKindling", title: "Button: Show Kindling Items", desc: ""},
	{fnc: "widgetButtonSparks", title: "Button: Show Sparks", desc: ""},
	{fnc: "widgetButtonAllFeeds", title: "Button: Show All Feeds", desc: ""},
	{fnc: "widgetButtonGroups", title: "Button: Show Groups", desc: ""},
	{fnc: "widgetButtonReloadFavicons", title: "Button: Reload Favicons", desc: ""},
	{fnc: "widgetButtonSettings", title: "Button: Show Settings", desc: "" },
	{fnc: "widgetButtonEditHomescreen", title: "Button: Edit Homescreen", desc: ""},
	{fnc: "widgetButtonSyncItems", title: "Button: Sync Items", desc: "" },
	{fnc: "widgetButtonMarkAllRead", title: "Button: Mark all read", desc: "" },
	{fnc: "widgetButtonUnreadLastItems", title: "Button: Last items unread", desc: ""},
	
	// Favourites:
	{fnc: "widgetShowFavFeeds", title: "Show Favourite Feeds", desc: ""},
	{fnc: "widgetShowFavGroups", title: "Show Favourite Groups", desc: ""},
	{fnc: "widgetFavFeedsLastItems", title: "Recent Favourite Items", dec: ""},
	
	// Groups:
	{fnc: "widgetSystemGroups", title: "Show System Groups", desc: ""},
	{fnc: "widgetCustomGroups", title: "Show Custom Groups", desc: ""}
];
function parseWidget(widget) {
	return '<div class="dm-widget-container">' + widget + '</div>';
}
function widgetEmpty() {
	return '';
}
function widgetSystemGroups() {
	var sysgroups = '';

	sysgroups += '<h2>Fever<span style="color:red">°</span> Groups</h2>';
	sysgroups += '<ul data-role="listview" data-theme="a" data-inset="true">'; //  style="margin-top:-10px;"

	sysgroups += '<li><a href="" class="dm-button" data-dm-fnc="show-hot">Hot</a></li>';

	sysgroups += '<li><a href="" class="dm-button" data-dm-fnc="show-kindling">Kindling';
	var unread_items = _.where(items, {is_read: 0});

	sysgroups +=    '<span class="ui-li-count">' + unread_items.length + '</span></a></li>';
	sysgroups += '<li><a href="" class="dm-button" data-dm-fnc="show-sparks">Sparks';

	var unread_sparks = getUnreadSparks();
	sysgroups += 	'<span class="ui-li-count">' + unread_sparks.counter + '</span></a></li>';

	sysgroups += '<li><a href="" class="dm-button" data-dm-fnc="show-saved">Saved Items';
	sysgroups +=    '<span class="ui-li-count">' + saved_items.length + '</span></a></li>';

	sysgroups += '<li><a href="" class="dm-button" data-dm-fnc="show-all-feeds">All Feeds';
	sysgroups +=    '<span class="ui-li-count">' + _.size(feeds) + '</span></a></li>';
	
	sysgroups += '</ul>';
	sysgroups += '<p>Last Fever<span style="color:red">°</span> Refresh @ ' + renderDate("time", last_fever_refresh) + '</p>';
	return parseWidget(sysgroups);
}

function widgetCustomGroups() {

	var panel_custom_groups = '<h2>My Groups</h2>';
	panel_custom_groups += '<ul data-role="listview" data-filter-theme="a" data-divider-theme="a" data-theme="a" data-inset="true" data-filter="true" id="dm-groups" class="dm-home-views">';

	$.each(groups, function (index, value) {
		var unread = countUnreadInGroup(value.id);
		
		if (unread === 0) {
			if (show_empty_groups === "true") {
				panel_custom_groups += '<li id="dm-group-' + value.id + '">';
				panel_custom_groups += '<a href="" class="dm-button" data-dm-fnc="show-group-selector" data-dm-show-group="' + _.escape(value.id) + '">';
				panel_custom_groups += _.escape(value.title);
				panel_custom_groups += '<span class="ui-li-count">' + unread + '</span></a></li>';
			}
		} else {
			panel_custom_groups += '<li id="dm-group-' + value.id + '"><a href="" class="dm-button" data-dm-fnc="show-group-selector" data-dm-show-group="' + _.escape(value.id) + '">' + _.escape(value.title);
			panel_custom_groups += '<span class="ui-li-count">' + unread + '</span></a></li>';
		}
		
	});
	panel_custom_groups += '</ul>';
	return parseWidget(panel_custom_groups);
}

function widgetHotView() {
	return '';
}

function widgetShowGroup() {
	// shows a group
	return '';
}

function widgetShowFavGroups() {
	var content_ShowFavGroups = '';
	console.log(fav_groups);
	$.each(groups, function (index, value) {
		
		if ( _.contains(fav_groups, value.id)  ) {
			var unread = countUnreadInGroup(value.id);
			if (unread > 0) {
				var group = _.findWhere(groups, {id: value.id});
				content_ShowFavGroups += '<li data-theme="a">';
				content_ShowFavGroups += '<a href="" data-dm-show-group="' + group.id + '" class="dm-button" data-dm-fnc="show-group-selector">' + _.escape(group.title);
				content_ShowFavGroups += '<span class="ui-li-count">' + unread + '</span></a></li>';
			}
		}
	});
	
	if (content_ShowFavGroups) {
		content_ShowFavGroups = '<ul data-role="listview" data-theme="a" data-inset="true">' + content_ShowFavGroups;
		content_ShowFavGroups += '</ul>';
	} else {
		content_ShowFavGroups = '<p>No new items in your favourite groups.</p>';
	}
	return parseWidget(content_ShowFavGroups);
}

function widgetShowFavFeeds() {
	// These feeds are being shown if they have items
	//
	var res_ShowFavFeeds = '';
	countUnreadItems();
	var content_ShowFavFeeds = '';
	$.each(feeds, function (index, value) {
		if ( _.contains(fav_feeds, value.id) ) {
			var feed = _.findWhere(feeds, {id: getNumber(value.id)});
			content_ShowFavFeeds += renderListviewItemFeed(feed, false);
		}
	});
	if (content_ShowFavFeeds) {
		res_ShowFavFeeds = '<ul data-role="listview" data-theme="a" data-inset="true">' + content_ShowFavFeeds + '</ul>';
	} else {
		res_ShowFavFeeds = '<p>No new items in your favourite feeds.</p>';
	}
	return parseWidget(res_ShowFavFeeds);
}

function widgetFavFeedsLastItems() {
	var fav_items = _.filter(items, function(item){ 
		if ( _.contains(fav_feeds, item.feed_id) ) {
			return true; 
		} else {
			return false;
		}
	});
	
	if ( order_items === "asc" ) {
		var recent_ten = _.last(fav_items, getNumber(getOption("widget_recent_items")));
		recent_ten.reverse();
	} else {
		var recent_ten = _.first(fav_items, getNumber(getOption("widget_recent_items")));
	}
	
	if ( recent_ten.length > 0 ) {
		var last_ten_html = '<h2>Recent Favourite Items</h2><ul data-role="listview" data-divider-theme="a" data-inset="true">';
		var last_ten_ids = [];
		$.each(recent_ten, function(index, value) {
			last_ten_ids.push(value.id);
			last_ten_html += renderListviewItem(value, true, true, "long");
		});
		
		last_ten_html += '</ul>';
		
		last_ten_html += '<a href="" data-role="button" class="dm-button"  data-dm-fnc="mark-read-recent-fav-items" data-dm-item-ids="'+last_ten_ids.join(",")+'">Mark Items Read</a>';
		
		return parseWidget(last_ten_html);
	} else {
		return parseWidget('No new items in favourite feeds.');
	}
}

/* Some simple Buttons... */

function widgetButtonSparks() {
	return parseWidget('<a href="" data-role="button" class="dm-button"  data-dm-fnc="show-sparks">Show Sparks</a>');
}

function widgetButtonKindling() {
	return parseWidget('<a href="" data-role="button" class="dm-button" data-dm-fnc="show-kindling">Show Kindling</a>');
}

function widgetButtonSaved() {
	return parseWidget('<a href="" data-role="button" class="dm-button" data-dm-fnc="show-saved">Show Saved</a>');
}

function widgetButtonHotView() {
	return parseWidget('<a href="" data-role="button" class="dm-button" data-dm-fnc="show-hot">Show Hot Items</a>');
}
function widgetButtonAllFeeds() {
	return parseWidget('<a href="" data-role="button" class="dm-button" data-dm-fnc="show-all-feeds">Show All Feeds</a>');
}
function widgetButtonGroups() {
	return parseWidget('<a href="" data-role="button" class="dm-button" data-dm-fnc="show-groups">Show Groups</a>');
}

// ------------------------------

function widgetButtonSettings() {
	return parseWidget('<a href="#page-settings" data-icon="gear" data-role="button">Edit Settings</a>');
}

function widgetButtonReloadFavicons() {
	return parseWidget('<a href="" data-role="button" data-icon="refresh" class="dm-button" data-dm-fnc="refresh-favicons">Reload Favicons</a>');
}

function widgetButtonEditHomescreen() {
	return parseWidget('<a href="" data-role="button" data-icon="grid" class="dm-button" data-dm-fnc="show-edit-homescreen">Edit Homescreen</a>');
}

function widgetButtonSyncItems() {
	return parseWidget('<a href="" data-role="button" data-icon="refresh" class="dm-button" data-dm-fnc="sync-items">Sync with Fever<span style="color:red;">°</span></a>');
}

function widgetButtonMarkAllRead() {
	return parseWidget('<a href="" data-role="button" data-icon="check" class="dm-button" data-dm-fnc="mark-all-read">Mark all Read</a>');
}

function widgetButtonUnreadLastItems() {
	return parseWidget('<a href="" data-role="button" data-icon="eye" class="dm-button" data-dm-fnc="unread-last-items">Mark Last Items Unread</a>');
}
