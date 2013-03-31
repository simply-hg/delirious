widget_places = ["a1", "b1", "a2", "b2", "a3", "b3", "a4", "b4", "a5", "b5", "a6", "b6", "a7", "b7", "a8", "b8", "a9", "b9"];
var defined_widgets = [
	// Some Buttons:
	{ fnc: "widgetButtonHotView", title: "Button: Show Hot Items", desc: ""},
	{ fnc: "widgetButtonSaved", title: "Button: Show Saved Items", desc: ""},
	{ fnc: "widgetButtonKindling", title: "Button: Show Kindling Items", desc: ""},
	{ fnc: "widgetButtonSparks", title: "Button: Show Sparks", desc: ""},
	{ fnc: "widgetButtonAllFeeds", title: "Button: Show All Feeds", desc: ""},
	{ fnc: "widgetButtonGroups", title: "Button: Show Groups", desc: ""},
	{ fnc: "widgetButtonReloadFavicons", title: "Button: Reload Favicons", desc: ""},
	{ fnc: "widgetButtonSettings", title: "Button: Show Settings", desc:"" },
	{ fnc: "widgetButtonEditHomescreen", title: "Button: Edit Homescreen", desc:"" },
	{ fnc: "widgetButtonSyncItems", title: "Button: Sync Items", desc:"" },
	{ fnc: "widgetButtonMarkAllRead", title: "Button: Mark all read", desc:"" },
	
	// Favourites:
	{ fnc: "widgetShowFavFeeds", title: "Show Favourite Feeds", desc: "" },
	{ fnc: "widgetShowFavGroups", title: "Show Favourite Groups", desc: "" },
	
	// Groups:
	{ fnc: "widgetSystemGroups", title: "Show System Groups", desc: "" },
	{ fnc: "widgetCustomGroups", title: "Show Custom Groups", desc: "" }
];
function widgetEmpty() {
	return '';
}
function widgetSystemGroups() {
	var sysgroups = '';

	sysgroups += '<h2>Fever<span style="color:red">°</span> Groups</h2><ul data-role="listview" data-theme="a" data-inset="true" class="fmjs-to-listview" style="margin-top:-10px;">';

	sysgroups += '<li data-theme="d"><a href="" data-transition="slide" onclick="showHot(1);">Hot</a></li>';
	sysgroups += '<li data-theme="d"><a href="" data-transition="slide" onclick="showKindling();">Kindling';
	var unread_items = _.where(items, {is_read:0});
	sysgroups +=    '<span class="ui-li-count">'+unread_items.length+'</span>'+'</a></li>';
	sysgroups += '<li data-theme="d"><a href="" data-transition="slide" onclick="showSparks();">Sparks';
	var unread_sparks = getUnreadSparks();
	sysgroups += 	'<span class="ui-li-count">'+unread_sparks.counter+'</span>'+'</a></li>';
	sysgroups += '<li data-theme="d"><a href="" data-transition="slide" onclick="showSaved();">Saved items</a>';
	sysgroups +=    '<span class="ui-li-count">'+saved_items.length+'</span>'+'</li>';
	sysgroups += '<li data-theme="d"><a href="" data-transition="slide" onclick="showAllFeeds();">All Feeds';
	sysgroups +=    '<span class="ui-li-count">'+feeds.length+'</span>'+'</a></li>';
	sysgroups += '</ul>';
	sysgroups += '<p>Last Fever<span style="color:red">°</span> refresh @ '+renderDate("time", last_fever_refresh)+'</p>';
	return '<div class="fmjs-widget-container">' + sysgroups + '</div>';
}

function widgetCustomGroups() {
	panel_custom_groups = '<h2>My Groups</h2><ul data-role="listview" data-filter-theme="d" data-divider-theme="d" data-theme="d" data-inset="true" data-filter="true" id="fmjs-groups" class="fmjs-home-views fmjs-to-listview">';

	$.each( groups, function(index, value) {
		var unread = countUnreadInGroup(value.id);
		
		if ( unread == 0 ) {
			if ( show_empty_groups == "true") {
				panel_custom_groups += '<li data-theme="d" id="fmjs-group-'+value.id+'"><a href="" onclick="showGroupSelector('+value.id+');">'+ _.escape(value.title) +'</a>';
			panel_custom_groups += '<span class="ui-li-count">'+unread+'</span>'+'</li>';
			}
		} else {
			panel_custom_groups += '<li data-theme="d" id="fmjs-group-'+value.id+'"><a href="" onclick="showGroupSelector('+value.id+');">'+ _.escape(value.title) +'</a>';
			panel_custom_groups += '<span class="ui-li-count">'+unread+'</span>'+'</li>';
		}
		
		
	});
	panel_custom_groups += '</ul>';
	return '<div class="fmjs-widget-container">' + panel_custom_groups + '</div>';
}

function widgetHotView() {

}

function widgetShowGroup() {
	// shows a group
	
}

function widgetShowFavGroups() {
	// 
	content_ShowFavGroups = '';
	$.each(fav_groups, function(index, value){
		var unread = countUnreadInGroup(value);
		if ( unread > 0 ) {
			var group = _.findWhere(groups, {id:value});
			content_ShowFavGroups = '<li data-theme="d"><a href="" onclick="showGroupSelector('+group.id+');">'+ _.escape(group.title) +'</a>';
			content_ShowFavGroups += '<span class="ui-li-count">'+unread+'</span>'+'</li>';
		}  
	});
	
	if ( content_ShowFavGroups ) {
		content_ShowFavGroups = '<ul data-role="listview" data-theme="d" data-inset="true" class="fmjs-to-listview">' + content_ShowFavGroups;
		content_ShowFavGroups += '</ul>';
	} else {
		content_ShowFavGroups = '<p>No new items in your favourite groups.</p>';
	}
	return '<div class="fmjs-widget-container">' + content_ShowFavGroups + '</div>';
}



function widgetShowFavFeeds() {
	// These feeds are being shown if they have items
	//
	content_ShowFavFeeds = '';
	$.each(fav_feeds, function(index, value) {

		value = parseInt(value, 10);
		var fav_items = _.where(items, {feed_id: value});

		if ( fav_items.length ) {
			content_ShowFavFeeds += renderListviewItemFeed(value);
		} else {

		}
	});
	if ( content_ShowFavFeeds ) {
		content_ShowFavFeeds = '<ul data-role="listview" data-theme="d" data-inset="true" class="fmjs-to-listview">' + content_ShowFavFeeds;
		content_ShowFavFeeds += '</ul>';
	} else {
		content_ShowFavFeeds = '<p>No new items in your favourite feeds.</p>';
	}
	return '<div class="fmjs-widget-container">' + content_ShowFavFeeds + '</div>'; 
}


/* Some simple Buttons... */ 


function widgetButtonSparks() {
	return '<a href="" data-role="button" onclick="showSparks();">Show Sparks</a>';
}

function widgetButtonKindling() {
	return '<a href="" data-role="button" onclick="showKindling();">Show Kindling</a>';
}

function widgetButtonSaved() {
	return '<a href="" data-role="button" onclick="showSaved();">Show Saved</a>';
}

function widgetButtonHotView() {
	return '<a href="" data-role="button" onclick="showHot(1);">Show Hot Items</a>';
}
function widgetButtonAllFeeds() {
	return '<a href="" data-role="button" onclick="showAllFeeds();">Show All Feeds</a>';
}
function widgetButtonGroups() {
	return '<a href="" data-role="button" onclick="showGroups();">Show Groups</a>';
}

// ------------------------------

function widgetButtonSettings() {
	return '<a href="#page-settings" data-icon="gear" data-role="button">Edit Settings</a>';
}

function widgetButtonReloadFavicons() {
	return '<a href="" data-role="button" data-icon="refresh" onclick="refreshFavicons();">Reload Favicons</a>';
}

function widgetButtonEditHomescreen() {
	return '<a href="" data-role="button" data-icon="grid" onclick="showEditHomescreen();">Edit Homescreen</a>';
}

function widgetButtonSyncItems() {
	return '<a href="" data-role="button" data-icon="refresh" onclick="syncItems();">Sync with Fever<span style="color:red;">°</span></a>';
}

function widgetButtonMarkAllRead() {
	return '<a href="" data-role="button" data-icon="check" onclick="markKindlingRead();">Mark all Read</a>';
}
