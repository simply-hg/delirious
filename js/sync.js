function autoSync() {
	syncSavedItems("sync");
	syncUnreadItems("sync");
	console.log("autosync started");
	console.log($.mobile.activePage.attr("id"));
	// Now we should reload home, if we are here,
	// or print out a message, asking for a reload
	switch($.mobile.activePage.attr("id")) {
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
	syncSavedItems("sync");
	syncUnreadItems("sync");
	prepareHome();
	return false;
}

function syncSavedItems(what) {
	// This function compares your local stored items with all saved items online.
	// if some are missing here, we load them.
	// if some are missing there, we remove our copy (beacuse it was probably unsaved somewhere else...).
	// It is done by comparing ids
	
	if ( what == "full" ) {
		refreshSavedItems();
		return;
	}
	showHideLoader("start");
	$.post(fm_url + "?api&saved_item_ids", { api_key: fm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			var online_ids = data.saved_item_ids.split(',');

			local_ids = [];
			$.each(saved_items, function(index, value) {
				local_ids.push(value.id.toString());
			});

			var load_em = _.difference(online_ids, local_ids);

			delete_em =  _.difference(local_ids, online_ids);

			if ( load_em.length > 0 ) {
				if ( what == "start" && load_em.length > 50 ) {
					// too much to load on start, this should be done with a full refresh...
					// adding a message to top
					$("#fmjs-homescreen-message").append('<div class="warning">Please reload your saved items in the settings screen (click to hide message).</div>');
					return;
					
				} else {
					processLoadedSaveItems = _.after(load_em.length, storeLoadedSavedItems);
					loadSavedItems(load_em);
				}
			}
			
			if ( delete_em.length > 0 ) {
				saved_items = _.reject(saved_items, function(item) {
	
					if ( $.inArray(item.id.toString(), delete_em ) == -1 )  {
						return false;
					} else {

						return true;
					}
				});
			}
			$.jStorage.set("fmjs-local-items", saved_items);

		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}


function syncUnreadItems(what) {
	// This function compares your local unread items with all unread items online.
	// if some are missing here, we load them.
	// if some are missing there, we remove our copy (because it was probably unsaved somewhere else...).
	// It is done by comparing ids
	//createGroups(true);
	last_fmjs_refresh = now();
	console.log(last_fmjs_refresh);
	if ( what == "full" ) {
		refreshItems();
		return;
	}
	showHideLoader("start");
	$.post(fm_url + "?api&unread_item_ids", { api_key: fm_key }).done(function(data) {
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
			
			//$.jStorage.set("fmjs-local-items", saved_items);

		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function refreshItems() {
	//last_fmjs_refresh =  Math.round(+new Date()/1000); // from: http://stackoverflow.com/questions/221294/how-do-you-get-a-timestamp-in-javascript
	showHideLoader("start");
	$.post(fm_url + "?api&unread_item_ids", { api_key: fm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			var ids = data.unread_item_ids.split(',');
			ids = _.compact(ids);
			items = [];
			if ( ids.length == 0 ) {
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
	$.post(fm_url + "?api&items&with_ids="+ _.escape(get_ids), { api_key: fm_key }).done(function(data) {
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
	runAfterItemLoadNoHome
	prepareHome();
}
function runAfterItemLoadNoHome() {
	console.log("Finished items load");
	items = _.sortBy(items, "created_on_time");
	if ( order_items == "desc" ) {
		items.reverse();
	}
	items_loaded = true;
	return true;
}


function refreshSavedItems() {
	showHideLoader("start");
	$.post(fm_url + "?api&saved_item_ids", { api_key: fm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			$.jStorage.set("fmjs-local-items", []);
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
	saved_items = _.sortBy(saved_items, "created_on_time");
	if ( order_items == "desc" ) {
		saved_items.reverse();
	}	
	$.jStorage.set("fmjs-local-items", saved_items);
}

function loadSavedItems(ids) {
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
	$.post(fm_url + "?api&items&with_ids=" + get_ids, { api_key: fm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			$.each(data.items, function(index, value) {
				//var local_items = $.jStorage.get("fmjs-local-items", []);
				saved_items.push(value);
				processLoadedSaveItems();
				//$.jStorage.set("fmjs-local-items", local_items);
			});
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	
	if ( rest.length > 0 ) {
		loadItems(rest);
	} else {
		
	}
	
}

function markItemsRead(ids) {
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
		$(".fmjs-single-item-link-"+id).removeClass("fmjs-item-is-unread").addClass("fmjs-item-is-read");
		showHideLoader("start");
		$.post(fm_url + "?api", { api_key: fm_key, mark: "item", as: "read", id: $.trim(_.escape(id))  }).done(function(data) {
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
	$.post(fm_url + "?api", { api_key: fm_key, mark: "group", as: "read", id: 0, before: last_fmjs_group_show }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			syncItems();
			window.history.back();
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function markGroupAsRead(group_id, ids) {
	//var data     = $("#fmjs-group-content").data("fmjs-current-ids");
	//var group_id = $("#fmjs-group-content").data("fmjs-current-group-id");
	//$("#fmjs-group-content").removeData("fmjs-current-ids");
	$("#fmjs-group-content").removeData("fmjs-current-group-id");
	markGroupRead("group", getNumber(group_id) );//what, id, ids
	//$.mobile.changePage("#page-home");
	window.history.back();
	return false;
}

function markGroupRead(what, id) {
	console.log(what + " :" + id);
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
		$.post(fm_url + "?api", { api_key: fm_key, mark: what, as: "read", id: $.trim(_.escape(id)), before: last_fmjs_group_show  }).done(function(data) {
			showHideLoader("stop");
			if ( checkAuth(data.auth) ) {
				//$.mobile.changePage("#page-home", {transition: "slide"});
				syncItems();
				window.history.back();
			}
		}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	}
	runAfterItemLoadNoHome();
}

function saveItem(id) {
	//id = $.trim(id);
	if ( $.trim(id) != "") {
		console.log(id);
		//var local_items = $.jStorage.get("fmjs-local-items", []);
		var item = _.findWhere(items, {id: id});
		console.log(id);
		if ( item ) {
			//
			item.is_saved = 1;
			saved_items.push(item);
			$.jStorage.set("fmjs-local-items", saved_items);
		} else {
			item = _.findWhere(session_read_items, {id: id});
			if ( item ) {
				item.is_saved = 1;
				saved_items.push(item);
				$.jStorage.set("fmjs-local-items", saved_items);
			}
			
		}
		showHideLoader("start");
		$.post(fm_url + "?api", { api_key: fm_key, mark: "item", as: "saved", id: $.trim(_.escape(id))  }).done(function(data) {
			showHideLoader("stop");
			if ( checkAuth(data.auth) ) {

			}
		}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	}
}

function unsaveItem(id) {
	if ( $.trim(id) != "") {
		//var saved_items = $.jStorage.get("fmjs-local-items", []);
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
		$.jStorage.set("fmjs-local-items", saved_items);

		showHideLoader("start");
		$.post(fm_url + "?api", { api_key: fm_key, mark: "item", as: "unsaved", id: $.trim(_.escape(id))  }).done(function(data) {
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
	//var id = $("#fmjs-single-btn-save").data("fmjs-save-item-id");
	saveItem(id);
	//$("#fmjs-single-btn-save .ui-btn-text").html("Unsave");
	//$("#fmjs-single-btn-save").attr("onclick", "unsaveCurrentItem();");
	//$("#fmjs-single-btn-save" ).buttonMarkup({ icon: "minus" });

	return false;
}
function unsaveCurrentItem(id) {
	//var id = $("#fmjs-single-btn-save").data("fmjs-save-item-id");
	unsaveItem(id);
	//$("#fmjs-single-btn-save .ui-btn-text").html("Save");
	//$("#fmjs-single-btn-save").attr("onclick", "saveCurrentItem();");
	//$("#fmjs-single-btn-save" ).buttonMarkup({ icon: "plus" });

	return false;
}



function markFeedAsRead(feed_id, ids) {
	//var data     = $("#fmjs-feed-content").data("fmjs-feed-item-ids");
	//var feed_id = $("#fmjs-feed-content").data("fmjs-feed-id");
	$("#fmjs-feed-content").removeData("fmjs-feed-item-ids");
	$("#fmjs-feed-content").removeData("fmjs-feed-id");
	markGroupRead("feed", getNumber(feed_id), ids);//what, id, ids
	//$.mobile.changePage("#page-home");
	window.history.back();
	return false;
}


