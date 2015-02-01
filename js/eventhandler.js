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

function registerEventHandlers() {
	
	$(document).on("pagecreate", ".dm-page", function (e) {
		//dbgMsg("pagecreate: " + $(this).attr("id") );
	});
	$(document).on("pageinit", ".dm-page", function (e) {
		//dbgMsg("pageinit: " + $(this).attr("id") );
	});

	$( document ).on( "pageshow", function(e,o){
		
		$(this).enhanceWithin();
		
		try {
			$( ".dm-toolbar" ).toolbar( "updatePagePadding" );
		} catch (e) {
			console.log(e);
		}

	} );
	
	$(document).on("pagebeforeshow", ".dm-page", function (e, o) {
		
		var id = $(this).attr("id");
		
		if ( _.isUndefined( $(o.prevPage).attr("id") ) ) {
			dbgMsg("prev page is empty, startup assumed");
			if ( id !== "page-home" ) {
				dbgMsg("show home instead");
				if ( dm_url !== "" && id !== "page-settings" ) {
					// if no url is given, chences are,
					// we are running into settings screen
					showHome();
				}
			} else {
				// home is shown...

				// return and don't do anything, because
				// home is created after item load
				dbgMsg("was in pagebeforeshow for " + id);
				return;
			}
		} else {
			dbgMsg("from: " + $(o.prevPage).attr("id") );
		}
		
		dbgMsg("pagebeforeshow: " + $(this).attr("id") );
		//dbgMsg("Items loaded: " + items_loaded);
		//dbgMsg("Items load started: " + started_items_load);
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
				var id = $( this ).data("dm-group-id");
				showFeedsInGroup(id);
			break;
			case "page-single":
				//var id = $( this ).data("dm-item-id");

				//dbgMsg("single-id: "+id);
			break;
			case "page-login":
				if ( auth_success === true ) {
					$.mobile.navigate("#page-home", {transition: transition});
				} else {
					simpleStorage.flush();
				}
			break;
			case "page-importexport":
				showImportExport();
			break;
		}
		$(this).enhanceWithin();

		//$.mobile.resetActivePageHeight();
		/*try {
			$( "div[data-position='fixed']" ).toolbar( 'updatePagePadding' );
		} catch (e) {
			console.log(e);
		}*/
	});
	
	$ ( document ).on("vclick", ".dm-button", function(e) {
		e.stopPropagation();
		e.preventDefault();		var button = $(this).data("dm-fnc");
		dbgMsg("vclick button: " + button);

		switch (button) {
			case "show-item":
				var id = $(this).data("dm-show-item");
				//dbgMsg(id);
				//$( "#page-single" ).data("dm-item-id", id);
				showSingleItem(id);
				$.mobile.navigate("#page-single", {transition: transition});
			break;
			
			case "show-group":
				var id = $(this).data("dm-show-group");
				showGroup(id);
				$.mobile.navigate("#page-group", {transition: transition});
			break;
			case "show-group-selector":
				var id = $(this).data("dm-show-group");
				if ( getOption("groupview") == "feeds" ) {
					// feeds 
					//var id = $(this).data("dm-group-id");
					$("#page-feedgroup").data("dm-group-id", id);
					$.mobile.navigate("#page-feedgroup", {transition: transition});
				} else {
					// items
					showGroup(id);
					$.mobile.navigate("#page-group", {transition: transition});
				}
				//showGroupSelector(id);
			break;
			case "show-feed":
				var id = $(this).data("dm-show-feed");
				$("#page-feed").data("dm-show-feed-id", id);
				showFeed(id);
				$.mobile.navigate("#page-feed", {transition: transition});
				
			break;
			case "show-all-feeds":
				$.mobile.navigate("#page-all-feeds", {transition: transition});
			break;
			case "show-hot":
				//$("#dm-panel").panel( "close" );
				showHot(1);
				$.mobile.navigate("#page-hot", {transition: transition});
			break;
			case "show-hot-more":
				var page = $(this).data("dm-hot-page");
				page++;
				$(this).data("dm-hot-page", page);
				showHot(page);
			break;
			case "show-kindling-more":
				markItemsRead( $(this).data("dm-ids") );
				var data = $(this).data("dm-ids");
				
				//dbgMsg( data );
				buildKindling();
				$("#page-kindling").enhanceWithin();
				$.mobile.silentScroll(0);
				
			break;
			case "show-group-more":
				markItemsRead( $(this).data("dm-item-ids") );
				buildGroup( $(this).data("dm-group-id") );
				$("#page-group").enhanceWithin();
				$.mobile.silentScroll(0);
				
			break;
			case "show-feed-more":
				markItemsRead( $(this).data("dm-item-ids") );
				buildFeed( $(this).data("dm-feed-id") );
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
				var ids = $(this).data("dm-item-ids");
				markItemsRead(ids);
			break;
			case "mark-kindling-read":
				markKindlingRead();
			break;
			case "mark-all-read":
				markAllRead();
			break;
			case "mark-group-read":
				//var ids = $(this).data("dm-item-ids");
				var group_id = $(this).data("dm-group-id");
				markGroupAsRead(group_id, ids);
			break;
			case "mark-feed-read":
				var ids = $(this).data("dm-item-ids");
				var feed_id = $(this).data("dm-feed-id");
				markFeedAsRead(feed_id, ids);
			break;
			case "mark-read-recent-fav-items":
				var ids = $(this).data("dm-item-ids");
				markItemsRead(ids);
				showHome();
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
				if ( confirm("Logout deletes all your data and connot be undone. Are you sure?") ) {
					logout();
				}
			break;
			case "toggle-save-item":
			case "save-item":
				var id = $(this).data("dm-save-item-id");
				id = getNumber(id);
				//dbgMsg(id);
				
				var save_state = isItemSaved(id);
				
				//dbgMsg("Save state id: "+ id + " -> " + save_state);
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
				var id = $(this).data("dm-group-id");
				$("#page-feedgroup").data("dm-group-id", id);
				$.mobile.navigate("#page-feedgroup", {transition: transition});
			break;
			case "unread-last-items":
				unreadLastItems();
				syncItems();
				showHome();				
			break;
			case "show-saved-time":
				showSavedByTimePage(1);
				$("#page-saved").enhanceWithin();
			break;	
			case "show-saved-feed":
				showSavedByFeed();
				$("#page-saved").enhanceWithin();
			break;
			case "login":
				login();
			break;
			case "import-settings":
				importSettings();
			break;
			case "download-settings":
				generateExportFile();
			break;
			case "upload-settings":
				importSettingsFile();
			break;
			case 'show-saved-page':
				var saved_page = $(this).data("dm-saved-page");
				showSavedByTimePage( getNumber(saved_page) );
				$("#page-saved").enhanceWithin();

			break;
				
			default: 
			break;
		}
	});
	$( document ).ready(function() {

		$('#dm-settings-file-import').change( function (ereignis) {
			var f = ereignis.target.files[0]; 
			if ( f ) {
				var r = new FileReader();
				r.onload = function(e) { 
					var settings = e.target.result;
					saveImportedSettings( JSON.parse( LZString.decompressFromEncodedURIComponent( settings )) );
					
					getSettings();
					runAfterItemLoadNoHome();
					storeLoadedSavedItems();
					$.mobile.navigate("#page-home", {transition: transition});
				}
				r.readAsText(f);

			}
		});
		
		$('.dm-export-box').change( function(e) {
			showImportExport();
		}); 
	});

}
