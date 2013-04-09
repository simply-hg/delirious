$(document).ready(function() {
	start();
	$("#fmjs-homescreen-message").on("vclick", function(e) { e.stopPropagation(); $(this).empty(); });
	
	$(document).on("pagecreate", ".fmjs-page", function(e) {
		console.log("pagecreate: " + $(this).attr("id") );
	});
	$(document).on("pageinit", ".fmjs-page", function(e) {
		console.log("pageinit: " + $(this).attr("id") );
	});
	$(document).on("pagebeforeshow", ".fmjs-page", function(e) {
		
		id = $(this).attr("id");
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
				if ( !id ) {
					console.log("no id");
					//restart();
					//showHome();
				}
			break;
		}
		
		$(this).trigger("create");
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
				$.mobile.changePage("#page-single", {transition: transition});
			break;
			case "show-group":
				var id = $(this).data("fmjs-show-group");
				showGroup(id);
				$.mobile.changePage("#page-group", {transition: transition});
			break;
			case "show-group-selector":
				var id = $(this).data("fmjs-show-group");
				if ( groupview == "feeds" ) {
					// feeds 
					//var id = $(this).data("fmjs-group-id");
					$("#page-feedgroup").data("fmjs-group-id", id);
					$.mobile.changePage("#page-feedgroup", {transition: transition});
				} else {
					// items
					showGroup(id);
					$.mobile.changePage("#page-group", {transition: transition});
				}
				//showGroupSelector(id);
			break;
			case "show-feed":
				var id = $(this).data("fmjs-show-feed");
				$("#page-feed").data("fmjs-show-feed-id", id);
				showFeed(id);
				$.mobile.changePage("#page-feed", {transition: transition});
				
			break;
			case "show-all-feeds":
				$.mobile.changePage("#page-all-feeds", {transition: transition});
			break;
			case "show-hot":
				showHot(1);
				$.mobile.changePage("#page-hot", {transition: transition});
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
				$("#page-kindling").trigger("create");
				$.mobile.silentScroll(0);
				
			break;
			case "show-group-more":
				markItemsRead( $(this).data("fmjs-item-ids") );
				buildGroup( $(this).data("fmjs-group-id") );
				$("#page-group").trigger("create");
				$.mobile.silentScroll(0);
				
			break;
			case "show-feed-more":
				markItemsRead( $(this).data("fmjs-item-ids") );
				buildFeed( $(this).data("fmjs-feed-id") );
				$("#page-feed").trigger("create");
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
				$.mobile.changePage("#page-groups", {transition: transition});
			break;
			case "sync-items":
				syncItems();
			break;
			case "show-sparks":
				showSparks();
			break;
			case "show-kindling":
				showKindling();
				$.mobile.changePage("#page-kindling", {transition: transition});
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
				$.mobile.changePage("#page-edit-homescreen", {transition: transition});
			break;
			case "show-saved":
				$.mobile.changePage("#page-saved", {transition: transition});
			break;
			case "mark-items-read":
				var ids = $(this).data("fmjs-item-ids");
				markItemsRead(ids);
			break;
			case "mark-kindling-read":
				markKindlingRead();
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
				
				console.log(save_state);
				if ( !save_state ) {
					$(this).children(".ui-btn-inner").children(".ui-btn-text").html("Unsave");
					$(this).buttonMarkup();
					$(this).buttonMarkup({ icon: "minus" });
					$(this).buttonMarkup("refresh");
					saveCurrentItem(id);
				} else {
					$(this).children(".ui-btn-inner").children(".ui-btn-text").html("Save");
					$(this).buttonMarkup();
					$(this).buttonMarkup({ icon: "plus" });
					$(this).buttonMarkup("refresh");
					unsaveCurrentItem(id);
				}
				//toggleSaveState(id);
			break;			
			case "show-feeds-group":
				var id = $(this).data("fmjs-group-id");
				$("#page-feedgroup").data("fmjs-group-id", id);
				$.mobile.changePage("#page-feedgroup", {transition: transition});
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
});
