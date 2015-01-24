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
	dbgMsg("starting autosync");
	syncGroups();
	syncFeeds();
	syncSavedItems("sync");
	syncUnreadItems("sync");

	dbgMsg("Current Page: " + getCurrentPageID());
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


var afterItemLoad;
function syncUnreadItems(what) {
	// This function compares your local unread items with all unread items online.
	// if some are missing here, we load them.
	// if some are missing there, we remove our copy (because it was probably read somewhere else...).
	// It is done by comparing ids

	last_dm_refresh = now();
	//dbgMsg(last_dm_refresh);
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

			var local_unread_ids = [];
			$.each(items, function(index, value) {
				local_unread_ids.push(value.id.toString());
			});

			var load_unread_em = _.difference(online_unread_ids, local_unread_ids);
			var delete_unread_em =  _.difference(local_unread_ids, online_unread_ids);
			
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

	if ( ids.length > 50 ) {
		var first = _.first(ids, 50);
		var rest  = _.rest(ids, 50);
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
	dbgMsg("Finished items load");
	items = _.sortBy(items, "created_on_time");
	items = _.uniq(items);
	if ( getOption("order_items") == "desc" ) {
		items.reverse();
	}
	items_loaded = true;
	return true;
}




function markItemsRead(ids) {
	var ids_to_mark_read;
	if ( _.isArray(ids) ) {
		// An array of ids
		ids_to_mark_read = ids;
	} else {
		// a comma seperated string
		//dbgMsg(ids);
		ids = getString(ids);
		ids_to_mark_read = _.compact(ids.split(","));
		
		if ( _.isArray( ids_to_mark_read ) !== true ) {
			ids_to_mark_read = [ids];
		}
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
	//runAfterItemLoadNoHome();
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
	$("#dm-group-content").removeData("dm-current-group-id");
	markGroupRead("group", getNumber(group_id) );//what, id, ids
	window.history.back();
	return false;
}

function markGroupRead(what, id) {
	dbgMsg(what + " :" + id);
	var feed_ids_to_mark_read;
	if ( what == "feed" ) {
		feed_ids_to_mark_read = [ getString(id) ];
	}
	if ( what == "group" ) {
		dbgMsg(feeds_groups);
		var feed_ids_to_mark_read_x = _.findWhere( feeds_groups, {group_id: getNumber(id)} );
		feed_ids_to_mark_read = feed_ids_to_mark_read_x.feed_ids.split(",");
	}
	feed_ids_to_mark_read = _.compact(feed_ids_to_mark_read);
	//dbgMsg(feed_ids_to_mark_read);
	
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
				//syncItems();
				//window.history.back();
			}
		}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	}
	runAfterItemLoadNoHome();
}

function saveItem(id) {
	//id = $.trim(id);
	if ( $.trim(id) != "") {
		dbgMsg("Save: " + id);
		//var local_items = simpleStorage.get("dm-local-items", []);
		var item = _.findWhere(items, {id: id});
		//dbgMsg(id);
		if ( !item ) {
			item = _.findWhere(session_read_items, {id: id});
		}
		if ( item ) {
			item.is_saved = 1;
			item.html = "";
			item.url = "";
			saved_items.push(item);
		
			storeLoadedSavedItems()
			showHideLoader("start");
			$.post(dm_url + "?api", { api_key: dm_key, mark: "item", as: "saved", id: $.trim(_.escape(id))  }).done(function(data) {
				showHideLoader("stop");
				if ( checkAuth(data.auth) ) {
				}
			}).fail(function(){ showHideLoader("stop"); checkAuth(0); dbgMsg("Save fail"); });
		}
	}
}

function unsaveItem(id) {
	if ( $.trim(id) != "") {
		//var saved_items = simpleStorage.get("dm-local-items", []);
		var current_unsave_id = id;
		var unsave_item = _.findWhere(saved_items, {id:id});
		
		unsave_item.id_saved = 0;
		//session_read_items.push(unsave_item);
		
		saved_items = _.reject(saved_items, function(item) {
			if ( item.id != current_unsave_id )  {
				return false;
			} else {
				return true;
			}
		});
		storeLoadedSavedItems()
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
	saveItem(id);
	return false;
}
function unsaveCurrentItem(id) {
	unsaveItem(id);
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
			var worked = simpleStorage.set("dm-favicons", favicons);
			dbgMsg("Message from saving faviocons -> Favicons: " + favicons.length );
			dbgMsg(worked);
			feed_counter = feeds.length;
			simpleStorage.set("dm-feed-counter", feed_counter);
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
			
			if ( feeds.length !== getNumber(feed_counter) ) {
				dbgMsg("Feeds: " + feeds.length + ", Counter: " + feed_counter + ", Favicons: " + favicons.length);
				refreshFavicons();
			} else {
				dbgMsg("All favicons are here because:")
				dbgMsg("Feeds: " + feeds.length + ", Counter: " + feed_counter + ", Favicons: " + favicons.length);
			}
			
			prepareHome();
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function checkAuth(auth) {
	//dbgMsg("checking auth");
	if ( auth == 1 ) {
		return true;
	} else {
		if ( auth_success == true ) {
			// it was once successful, so it's probably a network issue,
			// a stop or anything else, just log it, and don't do anything at all.
			// an alert would be ok too, but this might be unwise, as 
			// initial loading can happen quite often...
			dbgMsg("Probably stopped or network issue.");
		} else {
			
			$.mobile.navigate("#page-login", {transition: transition});	
		}
			//alert("Please check your Login-credentials. This could also mean, that your internet connection is lost. Or maybe you stopped loading a page.");
			//initSettings();
			//$.mobile.navigate("#page-settings", {transition: transition});
			//$.mobile.silentScroll(0);
		return false;		
	}

}


function unreadLastItems() {
	showHideLoader("start");
	$.post(dm_url + "?api", { api_key: dm_key, unread_recently_read: "1" }).done(function(data) {
		showHideLoader("stop");
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

// Funcions fpr saved items

var processLoadedSaveItems;
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
			
			dbgMsg( saved_items );
			dbgMsg( "Saved items: " + data.saved_item_ids );
			
			var online_ids = data.saved_item_ids.split(',');
			
			if ( saved_items.length == 0 && online_ids.length > 0) {
				// get a full load
				dbgMsg("Saved items: Load all saved items" );
				refreshSavedItems();
				
			} else {
				dbgMsg("Saved items: Sync saved items");
				
				var local_ids = [];
				$.each(saved_items, function(index, value) {
					local_ids.push(value.id.toString());
				});

				var load_em   = _.difference(online_ids, local_ids);
				var delete_em = _.difference(local_ids, online_ids);

				if ( delete_em.length > 0 ) {
					saved_items = _.reject(saved_items, function(item) {
						if ( $.inArray(item.id.toString(), delete_em ) == -1 )  {
							return false;
						} else {
							return true;
						}
					});
					dbgMsg("Saved items: Deleted " + delete_em.length + " saved items.");
					storeLoadedSavedItems();
				} else {
					dbgMsg("Saved items: Nothing to delete.");
				}
				
				if ( load_em.length > 0 ) {
					dbgMsg("Saved items: Load " + load_em.length + " items" );
					processLoadedSaveItems = _.after(load_em.length, storeLoadedSavedItems);
					loadSavedItems(load_em);
				} else {
					dbgMsg("Saved items: Nothing to load.");
				}
			}
			
			

		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function loadSavedItems(ids) {
	//dbgMsg("Loading saved item ids");
	//dbgMsg(ids);
	// Fever-API allows to get a maximum of 50 links per request, we need to split it, obviously
	if ( ids.length > 50 ) {
		var first = _.first(ids, 50);
		var rest  = _.rest(ids, 50);
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
				//var local_items = simpleStorage.get("dm-local-items", []);
				//dbgMsg("psuhing an item");
				value.html = ""//_.escape(value.html);
				value.url  = "";
				saved_items.push(value);
				//dbgMsg("saved_items length: " + saved_items.length);
				processLoadedSaveItems();
				//processLoadedSaveItems();
				//simpleStorage.set("dm-local-items", local_items);
			});
			
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	
	if ( rest.length > 0 ) {
		loadSavedItems(rest);
	} else {
		//storeLoadedSavedItems();
	}
	
}


function storeLoadedSavedItems() {
	//dbgMsg("storeLoadedSavedItems(): store "+saved_items.length+" saved items");
	saved_items = _.sortBy(saved_items, "created_on_time");
	
	if ( getOption("order_items") == "desc" ) {
		saved_items.reverse();
	}
	
	dbgMsg("storeLoadedSavedItems(): store " + saved_items.length + " saved items");
	var reduced = JSON.stringify(saved_items);
	dbgMsg("Raw size: " + reduced.length);
	
	var compressed = LZString.compressToUTF16(reduced);
	dbgMsg("Compressed size: " + compressed.length);
	
	
	
	var dbg_inf = simpleStorage.set("dm-saved-items", compressed);
	
	dbgMsg(dbg_inf);
	
	//var test = simpleStorage.get("dm-local-items");
	//dbgMsg(test);
	
	prepareHome();
}

function refreshSavedItems() {
	//dbgMsg("refreshSavedItems()");
	showHideLoader("start");
	$.post(dm_url + "?api&saved_item_ids", { api_key: dm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			//
			dbgMsg("refreshSavedItems(): Clearing saved items.");
			simpleStorage.set("dm-saved-items", []);
			saved_items = [];
			if ( data.saved_item_ids != "") {
				var ids = data.saved_item_ids.split(',');
				processLoadedSaveItems = _.after(ids.length, storeLoadedSavedItems);
				loadSavedItems(ids);
			}
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}
