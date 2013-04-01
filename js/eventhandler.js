$(document).ready(function() {
	start();
	$("#fmjs-homescreen-message").on("vclick", function(e) { e.stopPropagation(); $(this).empty(); });
	
	$("#page-settings").on("pagebeforeshow", function(e) {
		initSettings();
		$("#page-settings").trigger("create");
	});
	$("#page-home").on("pagebeforeshow", function(e) {
		prepareHome();
		$("#page-home").trigger("create");
	});
	
	$ ( document ).on("vclick", ".fmjs-button", function(e) {
		e.stopPropagation();
		e.preventDefault();
		var button = $(this).data("fmjs-fnc");
		switch (button) {
			case "show-item":
				var id = $(this).data("fmjs-show-item");
				//console.log(id);
				showSingleItem(id);	
			break;
			case "show-group":
				var id = $(this).data("fmjs-show-group");
				showGroup(id);
			break;
			case "show-group-selector":
				var id = $(this).data("fmjs-show-group");
				showGroupSelector(id);
			break;
			case "show-feed":
				var id = $(this).data("fmjs-show-feed");
				showFeed(id);
			break;
			case "show-all-feeds":
				showAllFeeds();
			break;
			case "show-hot":
				showHot(1);
			break;
			case "show-hot-more":
				var page = $(this).data("fmjs-hot-page");
				page++;
				$(this).data("fmjs-hot-page", page);
				showHot(page);
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
				showGroups();
			break;
			case "sync-items":
				syncItems();
			break;
			case "show-sparks":
				showSparks();
			break;
			case "show-kindling":
				showKindling();
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
				showEditHomescreen();
			break;
			case "show-saved":
				showSaved();
			break;
			case "mark-items-read":
				var ids = $(this).data("fmjs-item-ids");
				markItemsRead(ids);
			break;
			case "mark-kindling-read":
				markKindlingRead();
			break;
			case "mark-group-read":
				markGroupAsRead();
			break;
			case "mark-feed-read":
				markFeedAsRead();
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
				showFeedsInGroup(id);
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
