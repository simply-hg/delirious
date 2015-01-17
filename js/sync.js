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

function autoSync() {
	console.log("starting autosync");
	syncGroups();
	syncFeeds();
	syncSavedItems("sync");
	syncUnreadItems("sync");

	console.log("Current Page: " + getCurrentPageID());
	// Now we should reload home, if we are here,
	// or print out a message, asking for a reload
	switch (getCurrentPageID()) {
		case "page-home":
			// reload home
			prepareHome();
		break;
		default:
			// do nothing for now
		break;
	}
	return false;
}

function syncItems() {
	autoSync();
	return false;
}

function syncSavedItems(what) {
	// This function compares your local stored items with all saved items online.
	// if some are missing here, we load them.
	// if some are missing there, we remove our copy (because it was probably unsaved somewhere else...).
	// It is done by comparing ids
	
	if ( what == "full" ) {
		refreshSavedItems();
		return;
	}
	showHideLoader("start");
	$.post(dm_url + "?api&saved_item_ids", { api_key: dm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			var online_ids = data.saved_item_ids.split(',');
			if ( saved_items.length == 0 && online_ids.length > 0) {
				// get a full load
				console.log("let's load all saved items");
				refreshSavedItems();
			} else {
				local_ids = [];
			
				$.each(saved_items, function(index, value) {
					local_ids.push(value.id.toString());
				});

				var load_em = _.difference(online_ids, local_ids);

				delete_em =  _.difference(local_ids, online_ids);


			
				if ( delete_em.length > 0 ) {
					saved_items = _.reject(saved_items, function(item) {
	
						if ( $.inArray(item.id.toString(), delete_em ) == -1 )  {
							return false;
						} else {
							return true;
						}
					});
					console.log("store " + saved_items.length + " saved items");
					$.jStorage.set("dm-local-items", saved_items);
				}
				
				if ( load_em.length > 0 ) {
					processLoadedSaveItems = _.after(load_em.length, storeLoadedSavedItems);
					loadSavedItems(load_em);
				}
			}
			
			

		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

var afterItemLoad;
function syncUnreadItems(what) {
	// This function compares your local unread items with all unread items online.
	// if some are missing here, we load them.
	// if some are missing there, we remove our copy (because it was probably read somewhere else...).
	// It is done by comparing ids

	last_dm_refresh = now();
	console.log(last_dm_refresh);
	if ( what == "full" ) {
		refreshItems();
		return;
	}
	showHideLoader("start");
	$.post(dm_url + "?api&unread_item_ids", { api_key: dm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			var run_anyway = false;
			var online_unread_ids = data.unread_item_ids.split(',');
			last_fever_refresh = data.last_refreshed_on_time;

			local_unread_ids = [];
			$.each(items, function(index, value) {
				local_unread_ids.push(value.id.toString());
			});

			var load_unread_em = _.difference(online_unread_ids, local_unread_ids);
			delete_unread_em =  _.difference(local_unread_ids, online_unread_ids);
			
			if ( load_unread_em.length > 0 ) {
				// load unread items
				afterItemLoad = _.after(load_unread_em.length, runAfterItemLoad);
				loadItems(load_unread_em);
			} else {
				run_anyway = true;
			}
			
			if ( delete_unread_em.length > 0 ) {
				items = _.reject(items, function(item) {
					if ( $.inArray(item.id.toString(), delete_unread_em ) == -1 )  {
						return false;
					} else {
						return true;
					}
				});
				run_anyway = true;
			} else {
				run_anyway = true;
			}

			if (run_anyway == true) {
				runAfterItemLoad();
			}
			
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}


function refreshItems() {
	//last_dm_refresh =  Math.round(+new Date()/1000); // from: http://stackoverflow.com/questions/221294/how-do-you-get-a-timestamp-in-javascript
	showHideLoader("start");
	$.post(dm_url + "?api&unread_item_ids", { api_key: dm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			var ids = data.unread_item_ids.split(',');
			ids = _.compact(ids);
			items = [];
			if ( ids.length == 0 ) {
				last_fever_refresh = data.last_refreshed_on_time;
				runAfterItemLoad();
			} else {
				afterItemLoad = _.after(ids.length, runAfterItemLoad);
				loadItems(ids);
			}
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function loadItems(ids) {

	// Fever-API allows to get a maximum of 50 links per request, we need to split it, obviously

	if ( ids.length > 40 ) {
		var first = _.first(ids, 40);
		var rest  = _.rest(ids, 40);
	} else {
		var first = ids;
		var rest = [];
	}
	var get_ids = first.join(",");
	showHideLoader("start");
	$.post(dm_url + "?api&items&with_ids="+ _.escape(get_ids), { api_key: dm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			last_fever_refresh = data.last_refreshed_on_time;
			$.each(data.items, function(index, value) {
				// Save each item in cache
				items.push(value);
				afterItemLoad();
			});
		}
	});
	
	if ( rest.length > 0 ) {
		loadItems(rest);
	} else {
		// finished
	}
	
}

function runAfterItemLoad() {
	runAfterItemLoadNoHome();
	prepareHome();
}

function runAfterItemLoadNoHome() {
	console.log("Finished items load");
	items = _.sortBy(items, "created_on_time");
	items = _.uniq(items);
	if ( order_items == "desc" ) {
		items.reverse();
	}
	items_loaded = true;
	return true;
}

var processLoadedSaveItems;
function refreshSavedItems() {
	showHideLoader("start");
	$.post(dm_url + "?api&saved_item_ids", { api_key: dm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			$.jStorage.set("dm-local-items", []);
			saved_items = [];
			if ( data.saved_item_ids != "") {
				var ids = data.saved_item_ids.split(',');
				processLoadedSaveItems = _.after(ids.length, storeLoadedSavedItems);
				loadSavedItems(ids);
			}
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function storeLoadedSavedItems() {
	console.log("store "+saved_items.length+" saved items 2");
	saved_items = _.sortBy(saved_items, "created_on_time");
	if ( order_items == "desc" ) {
		saved_items.reverse();
	}
	console.log("store "+saved_items.length+" saved items 2");
	$.jStorage.set("dm-local-items", saved_items);
	prepareHome();
}

function loadSavedItems(ids) {
	//console.log("Loading saved item ids");
	//console.log(ids);
	// Fever-API allows to get a maximum of 50 links per request, we need to split it, obviously
	if ( ids.length > 40 ) {
		var first = _.first(ids, 40);
		var rest  = _.rest(ids, 40);
	} else {
		var first = ids;
		var rest = [];
	}
	var get_ids = first.join(",");
	
	showHideLoader("start");
	$.post(dm_url + "?api&items&with_ids=" + get_ids, { api_key: dm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			$.each(data.items, function(index, value) {
				//var local_items = $.jStorage.get("dm-local-items", []);
				//console.log("psuhing an item");
				saved_items.push(value);
				processLoadedSaveItems();
				//processLoadedSaveItems();
				//$.jStorage.set("dm-local-items", local_items);
			});
			
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	
	if ( rest.length > 0 ) {
		loadSavedItems(rest);
	} else {
		storeLoadedSavedItems();
	}
	
}

function markItemsRead(ids) {
	var ids_to_mark_read;
	if ( _.isArray(ids) ) {
		// An array of ids
		ids_to_mark_read = ids;
	} else {
		// a comma seperated string
		ids_to_mark_read = _.compact(ids.split(","));
	}
	var read_items = [];
	read_items = _.reject(items, function(item) {
		if ( $.inArray(item.id.toString(), ids_to_mark_read ) == -1 )  {
			return true;
		} else {
			return false;
		}
	});
	$.each(read_items, function(index, value) {
		value.is_read = 1;
		session_read_items.push(value);
	});
	items = _.reject(items, function(item) {
		if ( $.inArray(item.id.toString(), ids_to_mark_read ) == -1 )  {
			return false;
		} else {
			return true;
		}
	});

	$.each(ids_to_mark_read, function(index, value) {
		markItemRead(value);
	});	
	runAfterItemLoad();
}

function markItemRead(id) {
	if ( $.trim(id) != "") {
		$(".dm-single-item-link-"+id).removeClass("dm-item-is-unread").addClass("dm-item-is-read");
		showHideLoader("start");
		$.post(dm_url + "?api", { api_key: dm_key, mark: "item", as: "read", id: $.trim(_.escape(id))  }).done(function(data) {
			showHideLoader("stop");
			if ( checkAuth(data.auth) ) {

			}
		}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	}
}

function markKindlingRead() {
	
	$.each(items, function(index, value) {
		value.is_read = 1;
		session_read_items.push(value);
	});
	
	items = [];
	
	
	showHideLoader("start");
	$.post(dm_url + "?api", { api_key: dm_key, mark: "group", as: "read", id: 0, before: last_dm_group_show }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			syncItems();
			window.history.back();
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function markAllRead() {
	
	$.each(items, function(index, value) {
		value.is_read = 1;
		session_read_items.push(value);
	});
	
	items = [];
	
	
	showHideLoader("start");
	$.post(dm_url + "?api", { api_key: dm_key, mark: "group", as: "read", id: 0, before: last_dm_group_show }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			syncItems();
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}



function markGroupAsRead(group_id, ids) {
	//var data     = $("#dm-group-content").data("dm-current-ids");
	//var group_id = $("#dm-group-content").data("dm-current-group-id");
	//$("#dm-group-content").removeData("dm-current-ids");
	$("#dm-group-content").removeData("dm-current-group-id");
	markGroupRead("group", getNumber(group_id) );//what, id, ids
	//$.mobile.navigate("#page-home");
	window.history.back();
	return false;
}

function markGroupRead(what, id) {
	console.log(what + " :" + id);
	var feed_ids_to_mark_read;
	if ( what == "feed" ) {
		feed_ids_to_mark_read = [ getString(id) ];
	}
	if ( what == "group" ) {
		console.log(feeds_groups);
		feed_ids_to_mark_read_x = _.findWhere( feeds_groups, {group_id: getNumber(id)} );
		feed_ids_to_mark_read = feed_ids_to_mark_read_x.feed_ids.split(",");
	}
	feed_ids_to_mark_read = _.compact(feed_ids_to_mark_read);
	//console.log(feed_ids_to_mark_read);
	
	var read_items = [];
	read_items = _.reject(items, function(item) {
		if ( $.inArray(item.feed_id.toString(), feed_ids_to_mark_read ) == -1 )  {
			return true;
		} else {
			return false;
		}
	});
	$.each(read_items, function(index, value) {
		value.is_read = 1;
		session_read_items.push(value);
	});
	
	items = _.reject(items, function(item) {
		if ( $.inArray(item.feed_id.toString(), feed_ids_to_mark_read ) == -1 )  {
			return false;
		} else {
			return true;
		}
	});

	if ( $.trim(id) != "") {
		showHideLoader("start");
		$.post(dm_url + "?api", { api_key: dm_key, mark: what, as: "read", id: $.trim(_.escape(id)), before: last_dm_group_show  }).done(function(data) {
			showHideLoader("stop");
			if ( checkAuth(data.auth) ) {
				//$.mobile.navigate("#page-home", {transition: "slide"});
				syncItems();
				//window.history.back();
			}
		}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	}
	runAfterItemLoadNoHome();
}

function saveItem(id) {
	//id = $.trim(id);
	if ( $.trim(id) != "") {
		console.log("Save: " + id);
		//var local_items = $.jStorage.get("dm-local-items", []);
		var item = _.findWhere(items, {id: id});
		//console.log(id);
		if ( item ) {
			//
			item.is_saved = 1;
			saved_items.push(item);
			$.jStorage.set("dm-local-items", saved_items);
		} else {
			item = _.findWhere(session_read_items, {id: id});
			if ( item ) {
				item.is_saved = 1;
				saved_items.push(item);
				$.jStorage.set("dm-local-items", saved_items);
			}
			
		}
		showHideLoader("start");
		$.post(dm_url + "?api", { api_key: dm_key, mark: "item", as: "saved", id: $.trim(_.escape(id))  }).done(function(data) {
			showHideLoader("stop");
			if ( checkAuth(data.auth) ) {
				console.log(data);
			}
		}).fail(function(){ showHideLoader("stop"); checkAuth(0); console.log("Save fail"); });
	}
}

function unsaveItem(id) {
	if ( $.trim(id) != "") {
		//var saved_items = $.jStorage.get("dm-local-items", []);
		current_unsave_id = id;
		var unsave_item = _.findWhere(saved_items, {id:id});
		
		unsave_item.id_saved = 0;
		session_read_items.push(unsave_item);
		
		saved_items = _.reject(saved_items, function(item) {
			if ( item.id != current_unsave_id )  {
				return false;
			} else {

				return true;
			}
		});
		$.jStorage.set("dm-local-items", saved_items);

		showHideLoader("start");
		$.post(dm_url + "?api", { api_key: dm_key, mark: "item", as: "unsaved", id: $.trim(_.escape(id))  }).done(function(data) {
			showHideLoader("stop");
			if ( checkAuth(data.auth) ) {

			}
		}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	}
}

function isItemSaved(id) {
	var test = _.findWhere(saved_items, {id:id});
	if (test) {
		return true;
	} else {
		return false;
	}
}

function toggleSaveState(id) {
	if ( isItemSaved(id) ) {
		saveCurrentItem(id);
	} else {
		unsaveCurrentItem(id);
	}
}

function saveCurrentItem(id) {
	//var id = $("#dm-single-btn-save").data("dm-save-item-id");
	saveItem(id);
	//$("#dm-single-btn-save .ui-btn-text").html("Unsave");
	//$("#dm-single-btn-save").attr("onclick", "unsaveCurrentItem();");
	//$("#dm-single-btn-save" ).buttonMarkup({ icon: "minus" });

	return false;
}
function unsaveCurrentItem(id) {
	//var id = $("#dm-single-btn-save").data("dm-save-item-id");
	unsaveItem(id);
	//$("#dm-single-btn-save .ui-btn-text").html("Save");
	//$("#dm-single-btn-save").attr("onclick", "saveCurrentItem();");
	//$("#dm-single-btn-save" ).buttonMarkup({ icon: "plus" });

	return false;
}



function markFeedAsRead(feed_id, ids) {
	//var data     = $("#dm-feed-content").data("dm-feed-item-ids");
	//var feed_id = $("#dm-feed-content").data("dm-feed-id");
	$("#dm-feed-content").removeData("dm-feed-item-ids");
	$("#dm-feed-content").removeData("dm-feed-id");
	markGroupRead("feed", getNumber(feed_id), ids);//what, id, ids
	//$.mobile.navigate("#page-home");
	window.history.back();
	return false;
}

function refreshFavicons() {
	showHideLoader("start");
	$.post(dm_url + "?api&favicons", { api_key: dm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			favicons = data.favicons;
			$.jStorage.set("dm-favicons", favicons);
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	return false;
}

function syncGroups() {
	showHideLoader("start");
	$.post(dm_url + "?api&groups", { api_key: dm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			groups       = _.sortBy(data.groups, "title");
			groups.sort(function(a,b) {
				var group_a = a.title.toLowerCase();
				var group_b = b.title.toLowerCase();
				if (group_a < group_b) {
					return -1;
				}
				if (group_a > group_b) {
					return 1;
				}
				return 0;
			});		
			feeds_groups = data.feeds_groups;
			

			
			prepareHome();
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function syncFeeds() {
	showHideLoader("start");
	$.post(dm_url + "?api&feeds", { api_key: dm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			feeds = data.feeds;
			feeds.sort(function(a,b) {
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
			
			if (feeds.length !== feed_counter) {
				console.log("Refreshing favicons");
				feed_counter = feeds.length;
				$.jStorage.set("dm-feed-counter", feed_counter);
				refreshFavicons();
			}
			
			prepareHome();
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function checkAuth(auth) {
	console.log("checking auth");
	if ( auth == 1 ) {
		return true;
	} else {
		if ( auth_success == true ) {
			// it was once successful, so it's probably a network issue,
			// a stop or anything else, just log it, and don't do anything at all.
			// an alert would be ok too, but this might be unwise, as 
			// initial loading can happen quite often...
			console.log("Probably stopped or network issue.");
		} else {
			//console.log("Forbidden");
			alert("Please check your Login-credentials. This could also mean, that your internet connection is lost. Or maybe you stopped loading a page.");
			initSettings();
			$.mobile.navigate("#page-settings", {transition: transition});
			//$.mobile.silentScroll(0);
			return false;		
		}

	}
}

function unreadLastItems() {
	showHideLoader("start");
	$.post(dm_url + "?api", { api_key: dm_key, unread_recently_read: "1" }).done(function(data) {
		showHideLoader("stop");
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}
