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



function start() {
	// test-auth
	console.log("start");

	if ( dm_url === "" ) {
		console.log("No URL. To settings please");
		checkAuth(0);
	} else {
		started_items_load = true;
		console.log("start api call");
		showHideLoader("start");
		$.post(dm_url + "?api", { api_key: dm_key }).done(function (data) {
			showHideLoader("stop");
			console.log("Fever API version: " + data.api_version);
			if ( checkAuth(data.auth) ) {
				auth_success = true;
				// Get groups and build them
				console.log("first success");
				
				syncGroups();
				syncFeeds();
				syncUnreadItems("full");
				syncSavedItems("start");
				dm_autosync = window.setInterval("autoSync()", 5 * 60 * 1000);
				prepareHome();
			}
			
		}).fail(function () { showHideLoader("stop"); checkAuth(0); });
	}

}
function initSettings() {
	if ( dm_url !== "" ) {
		$("#dm-fever-url").val(dm_url);
	}
	if ( dm_user !== "" ) {
		$("#dm-e-mail").val(dm_user);
	}
	$('input:radio[name="dm-setting-transitions"]').filter('[value="' + transition + '"]').prop('checked', true);
	$('input:radio[name="dm-setting-html-content"]').filter('[value="' + html_content + '"]').prop('checked', true);
	$('input:radio[name="dm-setting-groupview"]').filter('[value="' + groupview + '"]').prop('checked', true);
	$('input:radio[name="dm-setting-empty-groups"]').filter('[value="' + show_empty_groups + '"]').prop('checked', true);
	$('input:radio[name="dm-setting-sharing"]').filter('[value="' + sharing + '"]').prop('checked', true);
	
	
	
	$('#dm-setting-sharing-mobile').prop("checked", sharing_mobile);
	
	$('input:radio[name="dm-setting-order"]').filter('[value="' + order_items + '"]').prop('checked', true);
	$('input:radio[name="dm-setting-paginate-items"]').filter('[value="' + paginate_items + '"]').prop('checked', true);
	
	$('input:radio[name="dm-setting-widget-recent-items-count"]').filter('[value="' + widget_recent_items + '"]').prop('checked', true);
	
	$('#dm-setting-sharing-msg').val(sharing_msg);
}
function saveSettings() {
	var url, user, password, transition, html_content, groupview, emptygroups, share_buttons, share_mobile, sharing_text, item_order, page, key, recent_items;
	
	url           = $.trim($("#dm-fever-url").val());
	user          = $.trim($("#dm-e-mail").val());
	password      = $.trim($("#dm-password").val());
	$("#dm-password").val("");
	transition    = $('input[name=dm-setting-transitions]:checked').val();
	html_content  = $('input[name=dm-setting-html-content]:checked').val();
	groupview     = $('input[name=dm-setting-groupview]:checked').val();
	emptygroups   = $('input[name=dm-setting-empty-groups]:checked').val();
	share_buttons = $('input[name=dm-setting-sharing]:checked').val();
	share_mobile  = $('#dm-setting-sharing-mobile').prop("checked");
	sharing_text  = $('#dm-setting-sharing-msg').val();
	item_order    = $('input[name=dm-setting-order]:checked').val();
	page          = $('input[name=dm-setting-paginate-items]:checked').val();
	recent_items = $('input[name=dm-setting-widget-recent-items-count]:checked').val();

	$.jStorage.set("dm-url", url);
	
	if ( password != "" ) {
		key = MD5(user + ":" + password);
		password = "";
		$.jStorage.set("dm-user", user);
		$.jStorage.set("dm-key", key);
	}
	
	$.jStorage.set("dm-transition", transition);
	$.jStorage.set("dm-html-content", html_content);
	$.jStorage.set("dm-groupview", groupview);
	$.jStorage.set("dm-show-empty-groups", emptygroups);
	$.jStorage.set("dm-sharing", share_buttons);
	$.jStorage.set("dm-sharing-mobile", share_mobile);
	$.jStorage.set("dm-sharing-msg", sharing_text);
	$.jStorage.set("dm-order-items", item_order);
	$.jStorage.set("dm-paginate-items", page);

	$.jStorage.set("dm-widget-recent-items", recent_items);


	restart();
	$.mobile.navigate("#page-home", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;	
}

function restart() {
	getSettings();
	start();
}

function logout() {
	$.jStorage.deleteKey("dm-key");
	$.jStorage.deleteKey("dm-url");
	$.jStorage.deleteKey("dm-user");
	$.jStorage.deleteKey("dm-favicons");
	$.jStorage.deleteKey("dm-local-items");
	$.jStorage.deleteKey("dm-transition");
	$.jStorage.deleteKey("dm-html-content");
	$.jStorage.deleteKey("dm-groupview");
	$.jStorage.deleteKey("dm-sharing");
	$.jStorage.deleteKey("dm-sharing-msg");
	$.jStorage.deleteKey("dm-order-items");

	$.jStorage.deleteKey("dm-fav-feeds");
	$.jStorage.deleteKey("dm-fav-groups");
	$.jStorage.deleteKey("dm-widgets");
	$.jStorage.deleteKey("dm-show-empty-groups");
	dm_key   = '';
	dm_url   = '';
	dm_user  = '';
	favicons = '';
	items = [];
	saved_items = [];
	session_read_items = [];
	auth_success = false;
	start();
}

function showSaved() {
	$("#dm-select-saved-time").removeClass("ui-btn-active");
	$("#dm-select-saved-time").addClass("ui-btn-active");
	
	showSavedByTime();
	return;
}

function showSavedByTime() {

	$("#dm-saved-content").empty();
	$("#dm-saved-content").append('<ul id="dm-saved-view" data-role="listview" data-divider-theme="a" data-inset="true" data-filter="true"></ul>');
	//var local_items = $.jStorage.get("dm-local-items", []);
	var title = "Saved Items (" +  saved_items.length + ")";
	$("#page-saved").data("title", title);
	$("#dm-saved-header").html(title);
	document.title = title;
	if ( saved_items.length > 0 ) {
		//local_items = _.sortBy(local_items, "created_on_time");
		$.each(saved_items, function(index, value) {
			var item = "";
			item += renderListviewItem(value, true, true, "long");
			$("#dm-saved-view").append(item);

		});
	}

	return false;
}

function showSavedByFeed() {
	var grouped_items;
	var feed_ids;
	$("#dm-saved-content").empty();
	//$("#dm-saved-content").append('<ul id="dm-saved-view" data-role="listview" data-divider-theme="a" data-inset="true" data-filter="true"></ul>');
	//var local_items = $.jStorage.get("dm-local-items", []);
	var title = "Saved Items (" +  saved_items.length + ")";
	
	$("#page-saved").data("title", title);
	document.title = title;	
	$("#dm-saved-header").html(title);
	
	if ( saved_items.length > 0 ) {
		grouped_items = _.groupBy(saved_items, "feed_id");
		feed_ids = _.keys(grouped_items);
		//console.log(feed_ids);
		
		$.each(feeds, function(index,value){
			//console.log(value.id + " " + value.title );
			//console.log(feed_ids);
			if ( _.contains( feed_ids, getString(value.id) ) ) {
				console.log(value.title);
				var saved_part = "<h2>" + value.title + "</h2>";
				var show_pieces = _.filter( saved_items, function(saves){
					//console.log(saves);
					//console.log(value.id + " -> " + saves.feed_id );
					if ( getNumber(saves.feed_id) === getNumber(value.id) ) {
						return true;
					} else {
						return false;
					} 
				});
				console.log(show_pieces);
				
				saved_part += '<ul data-role="listview" data-divider-theme="a" data-inset="true">';
				
				$.each(show_pieces, function(index, value) {
					saved_part += renderListviewItem(value, true, true, "long");
				});
				
				saved_part += '</ul>';
				
				$("#dm-saved-content").append(saved_part);
			}
		});
		
		/*$.each(saved_items, function(index, value) {
			var item = "";
			item += renderListviewItem(value, true, true, "long");
			$("#dm-saved-view").append(item);

		});*/
	}

	return false;
}


function showHot(page) {

	if ( page == 1 ) {
		// First page has been called, so do a complete refresh
		$("#dm-hot-content").empty();
		//$("#dm-hot-more").attr("onclick", "showHot(2);");
	} else {
		// another page has been called, so let's append a new one
		var next_page = page;
		next_page++;
		//$("#dm-hot-more").data("dm-hot-more", next_page);
	}
	
	// Get range and offset
	var range  = $("#dm-hot-range option:selected").val();//attr("value");
	var offset = $("#dm-hot-offset option:selected").val();//attr("value");

	showHideLoader("start");
	$.post(dm_url + "?api&links&offset="+offset+"&range="+range+"&page="+page, { api_key: dm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
		
			var load_ids = '';
			$.each(data.links, function(index, value) {
				var item = '';
				var id_list = '';
				load_ids += value.item_ids + ',';
				item += '<div>';
				item += '<h2>';
				item += _.escape( value.temperature ) + '<span style="color:red">°</span>&nbsp;';
				if (value.is_local == 1 && value.is_item == 1) {
					load_ids += value.item_id + ",";
					item += '<a href="" class="dm-link-'+value.item_id+' dm-hot-links dm-button" data-dm-fnc="show-item" data-dm-show-item="'+_.escape(value.item_id)+'">'+_.escape(value.title)+'</a>';
				} else {
					item += '<a href="'+value.url+'" class="dm-hot-links" target="_blank">'+_.escape(value.title)+'</a>';
				}
				
				item += '</h2>';
			
				if (value.is_local == 1 && value.is_item == 1) {
					// Add local stuff here, like excerpt an feed name.
					
					item +='<p style="max-height:2.8em;overflow:hidden;" class="dm-link-'+_.escape(value.item_id)+'-content"></p>';
					item += '<p style="text-align:right;">posted by <span class="dm-link-'+_.escape(value.item_id)+'-favicon"></span> ';
					item += '<span class="dm-link-'+_.escape(value.item_id)+'-feedname dm-hot-links">Feed</span></p>';
					item += '<p style="text-align:right;">';
					item += '<a href="'+_.escape(value.url)+'" target="_blank" data-role="button" data-theme="a" data-inline="true" data-mini="true" data-icon="grid">Open URL</a> ';
					item += '<a href="" data-dm-fnc="toggle-save-item" data-dm-save-item-id="'+_.escape(value.item_id)+'" data-role="button" data-icon="plus" data-theme="a" data-inline="true" data-mini="true" class="dm-button dm-link-'+_.escape(value.item_id)+'-save-button">Save</a></p>';
				}
			
				// Now we show a list of all those items, linking to this hot item...
				item += '<ul data-role="listview" data-theme="a" data-inset="true" id="dm-hot-content-link-'+_.escape(value.id)+'" class="dm-hot-linkbox">';

				var links = value.item_ids.split(',');
				for (var i=0, link_id; link_id=links[i]; i++) {
					// item is "some", then "example", then "array"
					// i is the index of item in the array
					link_id = _.escape(link_id);
					item += '<li class="ui-li-has-icon"><span class="dm-link-'+link_id+'-favicon"></span><p>';
					item += '<a href="" class="dm-link-'+link_id+' dm-button dm-hot-links dm-single-item-link-'+link_id+'" data-dm-show-item="'+_.escape(link_id)+'" data-dm-fnc="show-item">';
					item += '<span class="dm-link-'+link_id+'-title dm-hot-links dm-single-item-link-'+link_id+'">Link: '+link_id+'</span>';
					item += '</a> ';
					item += 'by <span class="dm-link-'+link_id+'-feedname dm-hot-links">Feed</span></p></li>';
					id_list += link_id + ",";
				}	
				item += '</ul>';
				//
				item += '<div style="text-align:right">';
				item += '<a href="" data-role="button" data-theme="a" data-inline="true" data-mini="true" data-icon="check" class="dm-button" data-dm-fnc="mark-items-read" data-dm-item-ids="'+_.escape(id_list)+'">Mark Links as read</a>';
				item += '</div>';
				//
				item += '</div>';
				$("#dm-hot-content").append(item);
				
			});	

			var ids_to_get = load_ids.split(',');
			ids_to_get     = _.compact(ids_to_get);
			// let's see, if some are already loaded...
			$.each(ids_to_get, function(index, id) {
				var local = _.findWhere(items, {id: parseInt(id, 10)});
				if ( !local ) {
					local = _.findWhere(session_read_items, {id: parseInt(id, 10)});
				}
				if ( local ) {
					var local_check_id = id;
					ids_to_get = _.filter(ids_to_get, function(id) {
						if (id == local_check_id ) {
							return false;
						}
						return true;
					});
					replacePlaceholder(local);
				}
			});
			
			
			fillLinkPlaceholder(ids_to_get, 'link' );
			
			if ( page == 1) {

				return false;
			} else {
				//$(".dm-to-listview").listview().removeClass("dm-to-listview");
				//$("#page-hot").enhanceWithin();
				return false;
			}
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function fillLinkPlaceholder(placeholder_ids, class_prefix) {
	// Fever-API allows to get a maximum of 50 links per request, we need to split it, obviously

	if ( placeholder_ids.length > 40 ) {
		var first = _.first(placeholder_ids, 40);
		var rest  = _.rest(placeholder_ids, 40);
	} else {
		var first = placeholder_ids;
		var rest = [];
	}
	var get_ids = first.join(",");
	showHideLoader("start");
	$.post(dm_url + "?api&items&with_ids="+ _.escape(get_ids), { api_key: dm_key }).done(function(data) {
		showHideLoader("stop");
		if (checkAuth(data.auth) ) {
			$.each(data.items, function(index, value) {
				session_read_items.push(value);
				replacePlaceholder(value);
			});
		
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	
	if ( rest.length > 0 ) {
		fillLinkPlaceholder(rest, class_prefix);
	} else {
		$("#page-hot").enhanceWithin();
	}
}

function replacePlaceholder(value) {
	var class_prefix = 'link';
	var feed_class="dm-is-read";
	
	if (html_content == "raw" ) {
		$(".dm-"+class_prefix+"-"+value.id+"-title").html($.parseHTML(value.title));
		$(".dm-"+class_prefix+"-"+value.id+"-content").html(_.escape(value.html));
	} else {
		$(".dm-"+class_prefix+"-"+value.id+"-title").html(_.escape(value.title));
		$(".dm-"+class_prefix+"-"+value.id+"-content").html(_.escape(value.html));	
	}
	
	if ( value.is_read == 0 ) {
		$(".dm-"+class_prefix+"-"+value.id+"-title").addClass("dm-item-is-unread");
		feed_class="dm-is-unread";
	} else {
		$(".dm-"+class_prefix+"-"+value.id+"-title").addClass("dm-item-is-read");
	}
	
	var feedname = _.findWhere(feeds, {id: value.feed_id});
	$(".dm-"+class_prefix+"-"+value.id+"-feedname").html('<a href="" class="dm-button '+feed_class+'" data-dm-fnc="show-feed" data-dm-show-feed="'+_.escape(feedname.id)+'">'+_.escape(feedname.title)+'</a>');
	

	
	if ( value.is_saved == 1 ) {
		console.log("saved");
		$('.dm-link-'+_.escape(value.id)+'-save-button').text("Unsave");
		$('.dm-link-'+_.escape(value.id)+'-save-button').buttonMarkup({ icon: "minus" });
		//$('.dm-link-'+_.escape(value.id)+'-save-button').buttonMarkup("refresh");	

	} else {
		console.log("unsaved");
		$('.dm-link-'+_.escape(value.id)+'-save-button').text("Save");
		$('.dm-link-'+_.escape(value.id)+'-save-button').buttonMarkup({ icon: "plus" });
		//$('.dm-link-'+_.escape(value.id)+'-save-button').buttonMarkup("refresh");
	}
	


	var favicon = getFavicon(feedname, "ui-li-icon dm-favicon");
	$(".dm-"+class_prefix+"-"+value.id+"-favicon").before(favicon).removeClass("dm-"+class_prefix+"-"+value.id+"-favicon");
	return true;
}

function buildGroup(id) {
	last_dm_group_show = now();
	id = getNumber(id);
	//console.log(paginate_items);
	$("#dm-group-content").empty();
	$("#dm-group-more").empty();
	$("#dm-group-content").append('<div style="margin-bottom:1em;"><a href="" data-role="button" data-dm-fnc="show-feeds-group" data-dm-group-id="'+id+'" id="dm-group-show-feeds" class="dm-button">Show Feeds of Group</a></div>');
	$("#dm-group-content").append('<ul data-role="listview" data-divider-theme="a" data-inset="true" data-filter="true" id="dm-group-view"></ul>');
	
	// get group items
	var group = _.findWhere(groups, {id: id});
	var ids_to_show = _.findWhere(feeds_groups, {group_id: id});
	
	var feeds_for_group = [];
	feeds_for_group = _.map( ids_to_show.feed_ids.split(","), function(id) {
		return getNumber(id);
	});
	
	var group_items = _.filter(items, function(value) {
		if ( $.inArray(value.feed_id, feeds_for_group ) !== -1 && value.is_read == 0 ) {
			return true;
		} else {
			return false;		
		}
	});
	var unread = group_items.length;
	
	// check if we need to group items...
	var item_ids_in_group = '';
	//group_item_counter = 0;
	console.log( getNumber(paginate_items) );
	if ( paginate_items == "all" || getNumber(paginate_items) >= unread ) {
		//no, just show all items
		console.log("check all");
		$.each(group_items, function(index, value) {
			var item = "";
			item += renderListviewItem(value, true, true, "long");
			item_ids_in_group += value.id +",";
			//group_item_counter++;
			$("#dm-group-view").append(item);
		});
		$("#dm-group-more").append('<button class="dm-button" data-dm-fnc="mark-group-read" data-dm-group-id="'+id+'" data-dm-item-ids="'+item_ids_in_group+'">Mark Items Read</button>');
		$("#dm-group-read").data("dm-fnc", "mark-group-read");
		$("#dm-group-read").data("dm-group-id", id);
		$("#dm-group-read").data("dm-item-ids", item_ids_in_group);
		
	} else {
		// yes, show just some items
		console.log("check paginate");
		$.each( _.first(group_items, getNumber(paginate_items) ), function(index, value) {
			var item = "";
			item += renderListviewItem(value, true, true, "long");
			item_ids_in_group += value.id +",";
			//group_item_counter++;
			$("#dm-group-view").append(item);
		});
		$("#dm-group-more").append('<button class="dm-button" data-dm-fnc="show-group-more" data-dm-group-id="'+id+'" data-dm-item-ids="'+item_ids_in_group+'">Show More</button>');
		$("#dm-group-read").data("dm-fnc", "show-group-more");
		$("#dm-group-read").data("dm-item-ids", item_ids_in_group);
		$("#dm-group-read").data("dm-group-id", id);
	}
	var title = group.title + ' ('+unread+')';
	$("#page-group").data("title", title);
	$("#dm-group-header").html(title);
	document.title = title;

	$("#dm-group-content").data("dm-current-ids", item_ids_in_group);
	$("#dm-group-content").data("dm-current-group-id", id);

	// build whole group
	$("#dm-mark-group-read").data("dm-item-ids", item_ids_in_group);
	$("#dm-mark-group-read").data("fdm-group-id", id);
	// build part of group
	$.mobile.resetActivePageHeight();

	//$("#page-group").enhanceWithin();

}

function showGroup(id) {

	$("#dm-group-content").removeData("dm-current-ids");
	$("#dm-group-content").removeData("dm-current-group-id");

	buildGroup(id);

	
	$("#dm-group-favmarker").data("dm-group-id", id);
	$("#dm-mark-group-read").data("dm-group-id", id);
	
	if ( _.contains(fav_groups, id) ) {
		$("#dm-group-favmarker").html("Remove Group from Favourites");
	} else {
		$("#dm-group-favmarker").html("Mark Group as Favourite");
	}

	return false;
}

function buildFeed(id) {
	last_dm_group_show = now();
	id = getNumber(id);
	console.log(paginate_items);
	$("#dm-feed-content").empty();
	$("#dm-feed-more").empty();

	$("#dm-feed-content").append('<ul data-role="listview" data-divider-theme="a" data-inset="true" data-filter="true" id="dm-feed-view"></ul>');
	
	// get group items
	var feed_items = _.where(items, {feed_id: id});
	var feed = _.findWhere(feeds, {id:id});

	var unread = feed_items.length;
	
	// check if we need to group items...
	var item_ids_in_feed = '';
	//group_item_counter = 0;
	//console.log( getNumber(paginate_items) );
	//console.log(feed_items);
	if ( paginate_items == "all" || getNumber(paginate_items) >= unread ) {
		//no, just show all items
		console.log("check all");
		$.each(feed_items, function(index, value) {
			var item = "";
			item += renderListviewItem(value, false, true, "long");
			item_ids_in_feed += value.id +",";
			//group_item_counter++;
			$("#dm-feed-view").append(item);
		});
		$("#dm-feed-more").append('<button class="dm-button" data-dm-fnc="mark-feed-read" data-dm-feed-id="'+id+'" data-dm-item-ids="'+item_ids_in_feed+'">Mark Items Read</button>');
		$("#dm-feed-read").data("dm-fnc", "mark-feed-read");
		$("#dm-feed-read").data("dm-feed-id", id);
		$("#dm-feed-read").data("dm-item-ids", item_ids_in_feed);
		
	} else {
		// yes, show just some items
		console.log("check paginate");
		$.each( _.first(feed_items, getNumber(paginate_items) ), function(index, value) {
			var item = "";
			item += renderListviewItem(value, true, true, "long");
			item_ids_in_feed += value.id +",";
			//group_item_counter++;
			$("#dm-feed-view").append(item);
		});
		$("#dm-feed-more").append('<button class="dm-button" data-dm-fnc="show-feed-more" data-dm-feed-id="'+id+'" data-dm-item-ids="'+item_ids_in_feed+'">Show More</button>');
		$("#dm-feed-read").data("dm-fnc", "show-feed-more");
		$("#dm-feed-read").data("dm-item-ids", item_ids_in_feed);
		$("#dm-feed-read").data("dm-feed-id", id);
	}
	var title = feed.title + ' ('+unread+')';
	$("#page-feed").data("title", title);
	$("#dm-feed-header").html(title);
	document.title = title;
	
	$("#dm-feed-content").data("dm-feed-item-ids", item_ids_in_feed);
	$("#dm-feed-content").data("dm-feed-id", id);
	
	$("#dm-feed-content").data("dm-current-ids", item_ids_in_feed);
	$("#dm-feed-content").data("dm-current-feed-id", id);
	
	$("#dm-mark-feed-read").data("dm-item-ids", item_ids_in_feed);
	$("#dm-mark-feed-read").data("dm-feed-id", id);
	// build whole group

}

function showFeed(id) {
	id = getNumber(id);
	$("#dm-feed-content").removeData("dm-feed-item-ids");
	$("#dm-feed-content").removeData("dm-feed-id");	
	buildFeed(id);


	if ( _.contains(fav_feeds, id) ) {
		$("#dm-feed-favmarker").html("Remove Feed from Favourites");
	} else {
		$("#dm-feed-favmarker").html("Mark Feed as Favourite");
	}
	//$.mobile.resetActivePageHeight();

	return false;
}




function showSingleItem(id) {
	var item = _.findWhere(items, {id: getNumber(id)});

	if ( !item ) {
		item = _.findWhere(saved_items, {id: id});
	} 
	
	if ( !item ) {
		item = _.findWhere(session_read_items, {id: id});
	}
	
	if ( !item ) {
		showHideLoader("start");
		$.post(dm_url + "?api&items&with_ids="+ _.escape(id), { api_key: dm_key }).done(function(data) {
			showHideLoader("stop");
			if ( checkAuth(data.auth) ) {
				session_read_items.push(data.items[0]);
				renderSingleItem(data.items[0]);
			}
		}).fail(function(){ showHideLoader("stop"); checkAuth(0); });		
	} else {
		renderSingleItem(item);
	}
	$.mobile.silentScroll(0);
	return false;	
}

function renderSingleItem(data) {
	//console.log(data);
	$("#dm-single-content").empty();
	if ( html_content == "raw") {
		try {
			var content = $.parseHTML(data.html);
			$("#dm-single-content").append(content);
		} catch(e) {
			console.log("error in html of item");
			$("#dm-single-content").html(_.escape(data.html));
		}
		$("#dm-single-content a").attr("target", "_blank");
		$("#dm-single-content img").attr("height", "");
		$("#dm-single-content img").attr("width", "");
		$("#dm-single-content").fitVids();
	} else {
		$("#dm-single-content").html(_.escape(data.html));
	}

	$("#dm-single-content").data("dm-single-item-current", data.id);
	$("#dm-single-title").html(_.escape(data.title));
	$("#dm-single-title").attr("href", data.url);
	$("#page-single").data("title", _.escape(data.title));
	$("#dm-single-url").attr("href", data.url);
	var meta = '';
	if (data.author) {
		meta += 'by ' + data.author + ' ';
	}
	meta += 'on ' + renderDate("long", data.created_on_time);
	$("#dm-single-meta").html(_.escape(meta));
	var feedname = _.findWhere(feeds, {id: data.feed_id});

	$("#dm-feed-title").html(_.escape(feedname.title));

	var favicon_img = getFavicon(feedname);

	$("#dm-single-feedname").html(favicon_img + _.escape(feedname.title));
	$("#dm-single-feedname").data("dm-show-feed", data.feed_id);
	
	$("#dm-single-btn-save").data("dm-save-item-id", data.id);
	
	markItemsRead(data.id.toString());
	if ( data.is_saved == 1 ) {

		$("#dm-single-btn-save").text("Unsave");
		$("#dm-single-btn-save" ).buttonMarkup({ icon: "minus" });		
	} else {
		$("#dm-single-btn-save").text("Save");
		$("#dm-single-btn-save" ).buttonMarkup({ icon: "plus" });	
	}
	$("#dm-single-sharing-buttons").empty();
	//var sharing_buttons = '';
	if (sharing == "all" ) {
		// Add Facebook-Button
		var fb_button = '<iframe src="//www.facebook.com/plugins/like.php?href='+encodeURI(data.url)+'&amp;send=false&amp;layout=box_count&amp;width=100&amp;show_faces=false&amp;font&amp;colorscheme=light&amp;action=like&amp;height=90" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:100px; height:90px;" allowTransparency="true"></iframe>';
		
		// Add Twitter-Button
		var twitter_button = '<a href="https://twitter.com/share" class="twitter-share-button" data-size="medium" data-count="vertical" data-url="'+encodeURI(data.url)+'">Tweet</a>';
		twitter_button += '<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>';
		// Add Google+-Button
		var gplus_button = '<div class="g-plusone" data-size="tall" data-href="'+encodeURI(data.url)+'"></div>';
		gplus_button += '<script type="text/javascript">';
		gplus_button += '(function() {';
		gplus_button += "var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;";
		gplus_button += "po.src = 'https://apis.google.com/js/plusone.js';";
		gplus_button += "var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);";
		gplus_button += '})();';
		gplus_button += '</script>';
		try {
			$("#dm-single-sharing-buttons").append(fb_button);
		} catch (e) {
			console.log("fb button caused an error...");
		}
		try {
			$("#dm-single-sharing-buttons").append(twitter_button);
		} catch (e) {
			console.log("twitter button caused an error...");
		}
		try {
			$("#dm-single-sharing-buttons").append(gplus_button);
		} catch (e) {
			console.log("g+ button caused an error...");
		}
	}
	
	if ( sharing == "all" || sharing == "email" ) {
		// Add E-Mail-Button
		var e_mail_msg = sharing_msg.split("%url%").join(data.url);
		var email_button = '<a href="mailto:?subject='+encodeURI('Check it out: '+data.title)+'&amp;body='+encodeURI(e_mail_msg)+'" data-role="button">Share Link by E-Mail</a>';
		$("#dm-single-sharing-buttons").append(email_button);
	}
	
	if (sharing ==="all" || sharing === "email") {
		/*
		These are the links:
		<a  href="https://twitter.com/intent/tweet?text=YOUR-TITLE&url=YOUR-URL&via=TWITTER-HANDLE">Tweet</a>
		<a  href="http://www.facebook.com/sharer/sharer.php?u=YOUR-URL">Share on Facebook</a>
		<a  href="https://plus.google.com/share?url=YOUR-URL">Plus on Google+</a>
		*/
		
		var passive_buttons = '<div data-role="navbar"><ul>';
		
		passive_buttons += '<li><a href="http://www.facebook.com/sharer/sharer.php?u='+encodeURI(data.url)+'" target="_blank">Facebook</a></li>';
		passive_buttons += '<li><a href="https://twitter.com/intent/tweet?text=Look&url='+encodeURI(data.url)+'" target="_blank">Twitter</a></li>';
		passive_buttons += '<li><a href="https://plus.google.com/share?url='+encodeURI(data.url)+'" target="_blank">Google+</a></li>';
		
		passive_buttons += '</ul></div>';
		
		if ( sharing_mobile ) {
			passive_buttons += '<div data-role="navbar"><ul>';
			passive_buttons += '<li><a href="whatsapp://send?text=' + encodeURI( data.title + ' - ' + data.url ) + '">WhatApp</a></li>';
			passive_buttons += '<li><a href="threema://compose?text=' + encodeURI( data.title + ' - ' + data.url ) + '">Threema</a></li>';
			passive_buttons += '</ul></div>';
		}
		$("#dm-single-passive-sharing-buttons").empty();
		$("#dm-single-passive-sharing-buttons").append(passive_buttons);
		
		
	}

	if ( sharing == "all" ) {
		// twitter button needs to be refreshed
		try {
			twttr.widgets.load();
		} catch (e) {
			// ignore this one...
			console.log("twitter object seems to be missing...");
		} 
	}		
	$.mobile.resetActivePageHeight();

	return false;
}

function getUnreadSparks() {
	var spark_feeds = _.where(feeds, {is_spark: 1});

	var feeds_for_sparks_unread = [];
	$.each(spark_feeds, function(index, value) {
		feeds_for_sparks_unread.push(value.id);
	});
	
	var unread_in_sparks_counter = 0;
	var unread_sparks = [];
	$.each(items, function(index, value) {
		if ( $.inArray(value.feed_id, feeds_for_sparks_unread ) == true && value.is_read == 0 ) {
			unread_in_sparks_counter++;
			unread_sparks.push(value);
		}
	});
	var result = { items: unread_sparks, counter: unread_in_sparks_counter }
	return result;
}

function showSparks() {
	last_dm_group_show = now();
	$("#dm-sparks-content").empty();
	$("#dm-sparks-content").append('<ul data-role="listview" data-divider-theme="a" data-inset="true" id="dm-sparks-view"></ul>');

	var sparks = getUnreadSparks();
	var item_ids_in_sparks = "";
	$.each(sparks.items, function(index, value) {
		if ( value.is_read == 0 ) {
			var item = "";
			item += renderListviewItem(value, true, true, "long");
			
			item_ids_in_sparks += value.id +",";
			$("#dm-sparks-view").append(item);
		}
	});
	$("#dm-sparks").data("dm-current-ids", item_ids_in_sparks);

	$.mobile.navigate("#page-sparks", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;

}

function showAllFeeds() {

	buildAllFeeds();
	return false;
}

function buildAllFeeds() {
	$("#dm-all-feeds-content").empty();
	$("#dm-all-feeds-content").append('<ul data-role="listview" data-divider-theme="a" data-inset="true" data-filter="true" id="dm-all-feeds-view"></ul>');
	countUnreadItems();
	//console.log(unread_counter);
	//console.log("build all feeds");
	$.each(feeds, function(index, value){
		
		var item = renderListviewItemFeed(value, true);
		//console.log(item);
		$("#dm-all-feeds-view").append(item);
	});

	var title = "All Feeds (" + feeds.length + ")";
	$("#page-all-feeds").data("title", title);
	$("#dm-all-feeds-title").html(title);
	

	//$("#page-all-feeds").trigger("create");
	//$.mobile.navigate("#page-all-feeds", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;
}

function showHideLoader(state) {
	if ( state == "start" ) {
		loading++;
	} else {
		loading--;
	}
	
	if ( loading == 0 ) {
		$.mobile.loading( "hide" );
		prepareHome();
	}
	
	if ( loading == 1 && state == "start") {
		$.mobile.loading( "show", {
			text: "Synchronizing data...",
			textVisible: true,
			theme: "a",
		});
	}
}

function buildKindling() {
	last_dm_group_show = now();
	$("#dm-kindling-content").empty();
	$("#dm-kindling-content").append('<ul data-role="listview" data-divider-theme="a" data-inset="true" data-filter="true" id="dm-kindling-view"></ul>');
	$("#dm-kindling-more").empty();
	var paginated_ids = '';
	console.log("check2");
	if ( paginate_items == "all" ) {
		$.each(items, function(index, value) {
			if ( value.is_read == 0 ) {
				var item = renderListviewItem(value, true, true, "long");
				$("#dm-kindling-view").append(item);
				paginated_ids += item.id + ",";
			}
		});
	} else {
		var kindling = _.first(items, getNumber(paginate_items));
		console.log(kindling.length);
		$.each(kindling, function(index, value) {
			if ( value.is_read == 0 ) {
				var item = renderListviewItem(value, true, true, "long");
				$("#dm-kindling-view").append(item);
				paginated_ids += value.id + ",";
			}
		});
		
		if ( items.length > getNumber(paginate_items) ) {
			var btn_text = "Show More";
			$("#dm-kindling-more").append('<button data-dm-fnc="show-kindling-more" class="dm-button" data-dm-ids="'+paginated_ids+'">'+btn_text+'</button>');
		} else {
			var btn_text = "Mark as Read";
			$("#dm-kindling-more").append('<button data-dm-fnc="mark-kindling-read" class="dm-button" data-dm-ids="'+paginated_ids+'">'+btn_text+'</button>');
		}
		
				
		$("#dm-kindling-items").data('dm-ids', paginated_ids);
		
	}
	// Fever<span style="color:red">°</span> Kindling
	// dm-kindling-header
	$("#dm-kindling-header").html('Fever<span style="color:red">°</span> Kindling Items (' + items.length + ')');
	document.title = 'Fever° Kindling Items (' + items.length + ')';
	$("#page-kindling").data("title", 'Fever° Kindling Items (' + items.length + ')');
	$.mobile.resetActivePageHeight();
	//$("#page-kindling").enhanceWithin();
	return true;
}

function showKindling() {
	console.log("check");
	buildKindling();
	return false;
}

function getFavicon(feed, css_classes) {
	// should a a feed-object
	if ( !!css_classes ) {

	} else {
		var css_classes = "dm-favicon";
	}

	var favicon = _.findWhere(favicons, {id: feed.favicon_id});
	var item_data = '';
	if ( favicon ) {
		if ( favicon.id != 1) {
			// return feed specific favicon
			return '<img src="data:'+favicon.data+'" height="16" width="16" class="'+css_classes+'"/>';
		}
	}
	
	// return generic code
	return '<img src="artwork/feed-icon-generic.png" height="16" width="16" class="'+css_classes+'"/>';
}

function showGroupSelector(id) {
	if ( groupview == "feeds" ) {
		// feeds 
		showFeedsInGroup(id);
	} else {
		// items
		showGroup(id);
	}
	return false;
}

function showFeedsInGroup(id) {
	last_dm_group_show = now();
	$("#dm-feedgroup-content").empty();
	$("#dm-feedgroup-content").append('<div style="margin-bottom:1em;"><a href="" data-role="button" data-dm-show-group="'+id+'" class="dm-button" data-dm-fnc="show-group" id="dm-feedgroup-show-all">Show All Items</a></div>');
	$("#dm-feedgroup-content").append('<ul data-role="listview" data-divider-theme="a" data-inset="true" data-filter="true" id="dm-feedgroup-view"></ul>');
	
	var group = _.findWhere(groups, {id: getNumber(id)});
	var unread = countUnreadInGroup(id);
	var title = group.title + ' ('+unread+')';
	$("#page-feedgroup").data("title", title);
	$("#dm-feedgroup-header").html(title);

	var ids_to_show = _.findWhere(feeds_groups, {group_id: id});
	
	var feeds_to_show = _.compact(ids_to_show.feed_ids.split(","));
	
	var gr_feeds = [];
	
	var feed_id;
	for ( feed_id in feeds_to_show) {	
		gr_feeds.push( _.findWhere(feeds, {id: getNumber( feeds_to_show[feed_id]  )}) );
	}
	
	gr_feeds.sort(function(a,b) {
		var feed_a = a.title.toLowerCase();
		var feed_b = b.title.toLowerCase();
		if (feed_a < feed_b) {
			return -1;
		}
		if (feed_a > feed_b) {
			return 1;
		}
		return 0;
	});		
	
	countUnreadItems();
	$.each(gr_feeds, function(index, value) {
		var item = renderListviewItemFeed(value, false);
		if (item) {
			$("#dm-feedgroup-view").append(item);
		}
	});

	return false;

}



function renderListviewItemFeed(feed, show_all) {
	//var feed = _.findWhere(feeds, {id: parseInt(feed_id, 10)});
	if ( _.isUndefined(feed) ) {
		return '';
	}
	var unread = getUnreadCountFeed(feed.id);//_.where(items, {is_read:0, feed_id:feed.id});
	
	if ( unread == 0 ) {
		if ( show_empty_groups == "false" && show_all == false) {
			return '';
		}
	}
	var item = '';
	item += '<li>';

	item += '<a class="dm-button" data-dm-fnc="show-feed" data-dm-show-feed="'+_.escape(feed.id)+'">';
	item += getFavicon(feed, "ui-li-icon dm-favicon dm-favicon-feed");
	item += _.escape(feed.title)+ '<span class="ui-li-count">'+unread+'</span>'+'</a>';
	item += '</li>';
	return item;
}

function renderListviewItem(item, with_feed, with_author, with_time) {
	// creates the whole li-string...
	var li, css_classes;
	
	li  = '<li>';

	var feed = _.findWhere(feeds, {id: item.feed_id});
	li += getFavicon(feed, "dm-favicon ui-li-icon");
	li += '<p class="dm-listview-content">';
	if ( item.is_read == 0 ) {
		css_classes = 'dm-item-is-unread';
	} else {
		css_classes = 'dm-item-is-read';
	}
	//console.log("checkpoint");
	li += '<a href="" class="dm-button dm-hot-links dm-single-item-link-'+_.escape(item.id)+' '+css_classes+'" data-dm-show-item="'+_.escape(item.id)+'" data-dm-fnc="show-item">' + _.escape(item.title) + '</a></p><p class="dm-listview-content">posted';
	if ( with_feed == true ) {
		li += ' on <a href="" class="dm-hot-links dm-is-read dm-button" data-dm-fnc="show-feed" data-dm-show-feed="'+_.escape(feed.id)+'">'+_.escape(feed.title)+'</a>';
	}
	if ( with_author == true && item.author ) {
		li += ' by '+_.escape(item.author)+'';
	}
	if ( with_time ) {
		li += ' at ' + renderDate(with_time, item.created_on_time);
	}
	li += '</p>';
	li += '</li>';
	return li;
}

function prepareHome() {
	// Which Widgets to display?
	var curr_page = $(":mobile-pagecontainer").pagecontainer("getActivePage").attr("id");
	console.log("preparing home");
	
	$.each(widgets, function(index, value) {
		$("#dm-widget-place-"+value.place).html(eval(value.fnc));
	});

	switch(curr_page) {
		case "page-home":
			// reload home
			document.title = "Delirious° (" + items.length + ")";
			$("#dm-header").html('Delirious<span style="color:red">°</span> (' + items.length + ')');
			$.mobile.resetActivePageHeight();
			$("#page-home").enhanceWithin();
		break;
		default:
			// do nothing for now
		break;
	}
	

}

function showHome() {

	$.mobile.navigate("#page-home", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;
}

function showGroups() {
	$("#dm-groups-content").empty();
	$("#dm-groups-content").append(widgetSystemGroups());
	$("#dm-groups-content").append(widgetCustomGroups());

	return false;
}

function markFeedAsFav() {
	var id = $("#dm-feed-content").data("dm-feed-id");

	if ( _.contains(fav_feeds, id) ) {
		// should be removed
		fav_feeds = _.without(fav_feeds, id);
		$.jStorage.set("dm-fav-feeds", _.compact(fav_feeds));
		$("#dm-feed-favmarker").html("Mark Feed as Favourite");
		
	} else {
		fav_feeds.push(id);
		$.jStorage.set("dm-fav-feeds", _.compact(fav_feeds));
		$("#dm-feed-favmarker").html("Remove Feed from Favourites");
	}

	return false;
}

function markGroupAsFav() {
	var id = $("#dm-group-content").data("dm-current-group-id");

	if ( _.contains(fav_groups, id) ) {
		// should be removed
		fav_groups = _.without(fav_groups, id);
		$.jStorage.set("dm-fav-groups", _.compact(fav_groups));
		$("#dm-group-favmarker").html("Mark Group as Favourite");
		
	} else {
		fav_groups.push(id);
		$.jStorage.set("dm-fav-groups", _.compact(fav_groups));
		$("#dm-group-favmarker").html("Remove Group from Favourites");
	}
	return false;
}

function countUnreadInGroup(id) {
	var group = _.findWhere(groups, {id: id});
	var ids_to_show = _.findWhere(feeds_groups, {group_id: id});
	
	if ( _.isUndefined(ids_to_show) ) {
		// No feeds in it...
		return 0;
	}
	
	var count_feeds_to_show = ids_to_show.feed_ids.split(",");

	var count_feeds_for_group = [];
	$.each(count_feeds_to_show, function(index, value) {
		count_feeds_for_group.push(parseInt(value, 10));
	});

	var count_group_item_counter = 0;
	$.each(items, function(index, value) {
		if ( $.inArray(value.feed_id, count_feeds_for_group ) !== -1 && value.is_read == 0 ) {
			count_group_item_counter++;
		}
	});
	return count_group_item_counter;
}

function showEditHomescreen() {

	var widget_place_options = '<option value="widgetEmpty">None</option>';
	defined_widgets = _.sortBy(defined_widgets, "title");
	$.each(defined_widgets, function(index, value) {
		widget_place_options += '<option value="'+value.fnc+'">'+value.title+'</option>';
	});
	
	$.each(widget_places, function(index, value) {
		var field_name = 'dm-edit-homescreen-' + value;
		var field = '<div data-role="fieldcontain">';
		
		field += '<label for="'+field_name+'-select">Widget&nbsp;'+value.toUpperCase()+':</label><br>';  
		field += '<select data-native-menu="true" name="'+field_name+'" id="'+field_name+'-select">';
		field += widget_place_options;
		field += '</select>';
		field += '</div>';
		
		$("#dm-edit-widget-place-"+value).html(field);
	});
	
	/* Now set selects to their current values... */
	// $('#dm-setting-empty-groups').filter('[value="'+show_empty_groups+'"]').prop('checked', true);
	$.each(widgets, function (index, value) {
		$('#dm-edit-widget-place-'+value.place+ ' option').filter('[value="'+value.fnc+'"]').prop('selected', true);
	});

	return false;
}

function saveHomescreen() {
	widgets = [];
	$.each(widget_places, function(index, value) {
		var field_name = 'dm-edit-homescreen-' + value;
		//$('input[name=dm-setting-transitions]:checked').val();
		var func = $("#"+field_name+"-select option:selected").val();
		var this_widget = { place: value, fnc: func, options: {} };
		widgets.push(this_widget);
	});
	$.jStorage.set("dm-widgets", widgets);
	showHome();

}


function countUnreadItems() {
	unread_counter = {};
	console.log("counting unread items");
	
	$.each(items, function(key, value) {
		if ( value.is_read == 0 ) {
			if ( unread_counter["feed-"+value.feed_id] ) {
				unread_counter["feed-"+value.feed_id]++;
			} else {
				unread_counter["feed-"+value.feed_id] = 1;
			}
		}
		
	});
	return true;
}

function getUnreadCountFeed(feed_id) {
	
	var unread = unread_counter["feed-"+feed_id];
	//console.log(unread);
	if ( unread ) {
		return unread_counter["feed-"+feed_id];
	} else {
		return 0;
	}
}


function showSavedItemsGroupedByFeed() {
	var grouped_items = _.groupBy(saved_items, function(item) {
		return item.feed_id;
	});
	saved_items_grouped = {};
	// each, li's in array speichern, nach feed_id
	$.each(grouped_items, function(key, value) {
	
	});
	// Je feed_id das HEader und die Sortierung generieren
	
	// sortieren, ausgeben
	return;
}

