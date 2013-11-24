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

function registerEventHandlers() { 

	$("#fmjs-homescreen-message").on("vclick", function(e) { e.stopPropagation(); $(this).empty(); });
	
	$(document).on("pagecreate", ".fmjs-page", function(e) {
		console.log("pagecreate: " + $(this).attr("id") );
	});
	$(document).on("pageinit", ".fmjs-page", function(e) {
		console.log("pageinit: " + $(this).attr("id") );
	});
	//$( "#fmjs-panel" ).on( "panelbeforeopen", function( event, ui ) {
	//	buildPanel();
	//});
	
	$(document).on("pagebeforeshow", ".fmjs-page", function(e, o) {
		
		id = $(this).attr("id");
		
		if ( _.isUndefined( $(o.prevPage).attr("id") ) ) {
			console.log("prev page is empty, startup assumed");
			if ( id != "page-home" ) {
				console.log("show home instead");
				showHome();
			} else {
				// home is shown...
				// return and don't do anything, because
				// home is created after item load
				return;
			}
		} else {
			console.log("from: " + $(o.prevPage).attr("id") );
		}
		
		console.log("pagebeforeshow: " + $(this).attr("id") );
		//console.log("Items loaded: " + items_loaded);
		//console.log("Items load started: " + started_items_load);
		switch ( id ) {
			case "page-home":
				prepareHome();
			break;
			case "page-settings":
				initSettings();
			break;
			case "page-all-feeds":
				showAllFeeds();
			break;
			case "page-saved":
				showSaved();
			break;
			case "page-groups":
				showGroups();
			break;
			case "page-edit-homescreen":
				showEditHomescreen();
			break;
			case "page-feedgroup":
				var id = $( this ).data("fmjs-group-id");
				showFeedsInGroup(id);
			break;
			case "page-single":
				var id = $( this ).data("fmjs-item-id");
				console.log("single-id: "+id);
			break;
		}
		
		$(this).enhanceWithin();
	});
	
	$ ( document ).on("vclick", ".fmjs-button", function(e) {
		console.log("vclick button");
		e.stopPropagation();
		e.preventDefault();
		var button = $(this).data("fmjs-fnc");
		switch (button) {
			case "show-item":
				var id = $(this).data("fmjs-show-item");
				//console.log(id);
				$( "#page-single" ).data("fmjs-item-id", id);
				//showSingleItem(id);
				showSingleItem(id);
				$.mobile.navigate("#page-single", {transition: transition});
			break;
			case "show-group":
				var id = $(this).data("fmjs-show-group");
				showGroup(id);
				$.mobile.navigate("#page-group", {transition: transition});
			break;
			case "show-group-selector":
				var id = $(this).data("fmjs-show-group");
				if ( groupview == "feeds" ) {
					// feeds 
					//var id = $(this).data("fmjs-group-id");
					$("#page-feedgroup").data("fmjs-group-id", id);
					$.mobile.navigate("#page-feedgroup", {transition: transition});
				} else {
					// items
					showGroup(id);
					$.mobile.navigate("#page-group", {transition: transition});
				}
				//showGroupSelector(id);
			break;
			case "show-feed":
				var id = $(this).data("fmjs-show-feed");
				$("#page-feed").data("fmjs-show-feed-id", id);
				showFeed(id);
				$.mobile.navigate("#page-feed", {transition: transition});
				
			break;
			case "show-all-feeds":
				$.mobile.navigate("#page-all-feeds", {transition: transition});
			break;
			case "show-hot":
				//$("#fmjs-panel").panel( "close" );
				showHot(1);
				$.mobile.navigate("#page-hot", {transition: transition});
			break;
			case "show-hot-more":
				var page = $(this).data("fmjs-hot-page");
				page++;
				$(this).data("fmjs-hot-page", page);
				showHot(page);
			break;
			case "show-kindling-more":
				markItemsRead( $(this).data("fmjs-ids") );
				var data = $(this).data("fmjs-ids");
				
				//console.log( data );
				buildKindling();
				$("#page-kindling").enhanceWithin();
				$.mobile.silentScroll(0);
				
			break;
			case "show-group-more":
				markItemsRead( $(this).data("fmjs-item-ids") );
				buildGroup( $(this).data("fmjs-group-id") );
				$("#page-group").enhanceWithin();
				$.mobile.silentScroll(0);
				
			break;
			case "show-feed-more":
				markItemsRead( $(this).data("fmjs-item-ids") );
				buildFeed( $(this).data("fmjs-feed-id") );
				$("#page-feed").enhanceWithin();
				$.mobile.silentScroll(0);
			break;
			case "show-home":
				showHome();
			break;
			case "to-top":
				$.mobile.silentScroll(0);
			break;
			case "back":
				window.history.back();
			break;
			case "show-groups":
				$.mobile.navigate("#page-groups", {transition: transition});
			break;
			case "sync-items":
				syncItems();
			break;
			case "show-sparks":
				showSparks();
			break;
			case "show-kindling":
				showKindling();
				$.mobile.navigate("#page-kindling", {transition: transition});
			break;
			case "refresh-favicons":
				refreshFavicons();
			break;
			case "refresh-saved-items":
				refreshSavedItems();
			break;			
			case "refresh-items":
				refreshItems();
			break;
			case "show-edit-homescreen":
				$.mobile.navigate("#page-edit-homescreen", {transition: transition});
			break;
			case "show-saved":
				$.mobile.navigate("#page-saved", {transition: transition});
			break;
			case "mark-items-read":
				var ids = $(this).data("fmjs-item-ids");
				markItemsRead(ids);
			break;
			case "mark-kindling-read":
				markKindlingRead();
			break;
			case "mark-all-read":
				markAllRead();
			break;
			case "mark-group-read":
				//var ids = $(this).data("fmjs-item-ids");
				var group_id = $(this).data("fmjs-group-id");
				markGroupAsRead(group_id, ids);
			break;
			case "mark-feed-read":
				var ids = $(this).data("fmjs-item-ids");
				var feed_id = $(this).data("fmjs-feed-id");
				markFeedAsRead(feed_id, ids);
			break;
			case "toggle-group-fav":
			case "mark-group-fav":
				markGroupAsFav();
			break;
			case "toggle-feed-fav":
			case "mark-feed-fav":
				markFeedAsFav();
			break;
			case "save-settings":
				saveSettings();
			break;
			case "save-homescreen":
				saveHomescreen();
			break;
			case "logout":
				logout();
			break;
			case "toggle-save-item":
			case "save-item":
				var id = $(this).data("fmjs-save-item-id");
				id = parseInt(id, 10);
				console.log(id);
				
				var save_state = isItemSaved(id);
				
				console.log("Save state id: "+ id + " -> " + save_state);
				if ( !save_state ) {
					$(this).text("Unsave");
					//$(this).buttonMarkup();
					$(this).buttonMarkup({ icon: "minus" });
					//$(this).buttonMarkup("refresh");
					saveCurrentItem(id);
				} else {
					$(this).text("Save");
					//$(this).buttonMarkup();
					$(this).buttonMarkup({ icon: "plus" });
					//$(this).buttonMarkup("refresh");
					unsaveCurrentItem(id);
				}
				//toggleSaveState(id);
			break;			
			case "show-feeds-group":
				var id = $(this).data("fmjs-group-id");
				$("#page-feedgroup").data("fmjs-group-id", id);
				$.mobile.navigate("#page-feedgroup", {transition: transition});
			break;
			case "":
			break;
			case "":
			break;	
			case "":
			break;
			case "":
			break;
			case "":
			break;
			case "":
			break;				
			default:
			break;
		}
	});
}
