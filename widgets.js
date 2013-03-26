function widgetSystemGroups() {
  var sysgroups = '';

	sysgroups += '<h2>Fever<span style="color:red">°</span> Groups</h2><ul data-role="listview" data-theme="a" data-inset="true" class="fmjs-to-listview">';

	sysgroups += '<li data-theme="d"><a href="#" data-transition="slide" onclick="showHot(1);">Hot</a></li>';
	sysgroups += '<li data-theme="d"><a href="#" data-transition="slide" onclick="showKindling();">Kindling';
	var unread_items = _.where(items, {is_read:0});
	sysgroups +=    '<span class="ui-li-count">'+unread_items.length+'</span>'+'</a></li>';
	sysgroups += '<li data-theme="d"><a href="#" data-transition="slide" onclick="showSparks();">Sparks</a></li>';
	sysgroups += '<li data-theme="d"><a href="#" data-transition="slide" onclick="showSaved();">Saved items</a>';
	sysgroups +=    '<span class="ui-li-count">'+saved_items.length+'</span>'+'</li>';
	sysgroups += '<li data-theme="d"><a href="#" data-transition="slide" onclick="showAllFeeds();">All Feeds';
	sysgroups +=    '<span class="ui-li-count">'+feeds.length+'</span>'+'</a></li>';
	sysgroups += '</ul>';
	sysgroups += '<p>Last Fever<span style="color:red">°</span> refresh @ '+renderDate("time", last_fever_refresh)+'</p>';
	return '<div class="fmjs-widget-container">' + sysgroups + '</div>';
}

function widgetCustomGroups() {
	panel_custom_groups = '<h2>Groups</h2><ul data-role="listview" data-filter-theme="d" data-divider-theme="d" data-theme="d" data-inset="true" data-filter="true" id="fmjs-groups" class="fmjs-home-views fmjs-to-listview">';
	console.log("just before "+show_empty_groups);
	$.each( groups, function(index, value) {
		var unread = countUnreadInGroup(value.id);
		
		if ( unread == 0 ) {
			if ( show_empty_groups == "true") {
				panel_custom_groups += '<li data-theme="d" id="fmjs-group-'+value.id+'"><a href="#" onclick="showGroupSelector('+value.id+');">'+ _.escape(value.title) +'</a>';
			panel_custom_groups += '<span class="ui-li-count">'+unread+'</span>'+'</li>';
			}
		} else {
			panel_custom_groups += '<li data-theme="d" id="fmjs-group-'+value.id+'"><a href="#" onclick="showGroupSelector('+value.id+');">'+ _.escape(value.title) +'</a>';
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
			content_ShowFavGroups = '<li data-theme="d"><a href="#" onclick="showGroupSelector('+group.id+');">'+ _.escape(group.title) +'</a>';
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
		console.log(value);
		value = parseInt(value, 10);
		var fav_items = _.where(items, {feed_id: value});
		console.log(fav_items);
		if ( fav_items.length ) {
			content_ShowFavFeeds += renderListviewItemFeed(value);
		} else {
			console.log("feed " + value + " has no items");
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
	var widget = '';
	return '<a href="" data-role="button" onclick="showSparks();" class="fmjs-to-button">Show Sparks</a>';
}

function widgetButtonKindling() {
	var widget = '';
	return '<a href="" data-role="button" onclick="showKindling();" class="fmjs-to-button">Show Kindling</a>';
}

function widgetButtonSaved() {
	var widget = '';
	return '<a href="" data-role="button" onclick="showSaved();" class="fmjs-to-button">Show Saved</a>';
}

function widgetButtonHotView() {
	var widget = '';
	return '<a href="" data-role="button" onclick="showHot(1);" class="fmjs-to-button">Show Hot Items</a>';
}
function widgetButtonAllFeeds() {
	var widget = '';
	return '<a href="" data-role="button" onclick="showAllFeeds();" class="fmjs-to-button">Show All Feeds</a>';
}
