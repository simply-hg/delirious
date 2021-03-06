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
	dbgMsg("start");

	if ( dm_url === "" ) {
		dbgMsg("No URL. Login");
		$.mobile.navigate("#page-login");
		//checkAuth(0);
	} else {
		started_items_load = true;
		//dbgMsg("start api call");
		showHideLoader("start");
		$.post(dm_url + "?api", { api_key: dm_key }).done(function (data) {
			showHideLoader("stop");
			//dbgMsg("Fever API version: " + data.api_version);
			if ( checkAuth(data.auth) ) {
				auth_success = true;
				// Get groups and build them
				//dbgMsg("first success");
				
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
	dbgMsg(dm_config);
	if ( dm_url !== "" ) {
		$("#dm-fever-url").val(dm_url);
	}
	if ( dm_user !== "" ) {
		$("#dm-e-mail").val(dm_user);
	}
	$('input:radio[name="dm-setting-transitions"]').filter('[value="' + getOption("transition") + '"]').prop('checked', true);
		
	$('input:radio[name="dm-setting-groupview"]').filter('[value="' + getOption("groupview") + '"]').prop('checked', true);
	$('input:radio[name="dm-setting-empty-groups"]').filter('[value="' + getOption("show_empty_groups") + '"]').prop('checked', true);
	$('input:radio[name="dm-setting-sharing"]').filter('[value="' + getOption("sharing") + '"]').prop('checked', true);
	$('input:radio[name="dm-setting-order"]').filter('[value="' + getOption("order_items") + '"]').prop('checked', true);
	$('input:radio[name="dm-setting-paginate-items"]').filter('[value="' + getOption("paginate_items") + '"]').prop('checked', true);	
	$('#dm-setting-sharing-msg').val(getOption("sharing_msg"));
	
	// New:
	$('#dm-setting-sharing-mobile').prop("checked", getOption ( "sharing_mobile") );
	
	$('input:radio[name="dm-setting-widget-recent-items-count"]').filter('[value="' + getOption("widget_recent_items") + '"]').prop('checked', true);
	$('input:radio[name="dm-setting-html-content"]').filter('[value="' + getOption("html_content") + '"]').prop('checked', true);
	
	
}
function saveSettings() {
	var url, user, password, transition, page, key;
	
	// New:
	setOption("html_content",        $('input[name=dm-setting-html-content]:checked').val());
	setOption("sharing_mobile",      getBool($('#dm-setting-sharing-mobile').is(":checked")));
	setOption("widget_recent_items", getNumber($('input[name=dm-setting-widget-recent-items-count]:checked').val()));
	setOption("transition",          $('input[name=dm-setting-transitions]:checked').val());
	setOption("groupview",           $('input[name=dm-setting-groupview]:checked').val());
	setOption("show_empty_groups",   getBool($('input[name=dm-setting-empty-groups]:checked').val()));
	setOption("sharing",             $('input[name=dm-setting-sharing]:checked').val());
	setOption("sharing_msg",         $('#dm-setting-sharing-msg').val());
	setOption("order_items",         $('input[name=dm-setting-order]:checked').val());
	setOption("paginate_items",      getNumber($('input[name=dm-setting-paginate-items]:checked').val()));

	// Still needed
	url           = $.trim($("#dm-fever-url").val());
	user          = $.trim($("#dm-e-mail").val());
	password      = $.trim($("#dm-password").val());
	$("#dm-password").val("");
	
	if ( password != "" ) {
		key = MD5( user + ":" + password );
		password = "";
		
		setOption("url",  $.trim($("#dm-fever-url").val()));
		setOption("user", $.trim($("#dm-e-mail").val()));
		setOption("key",  key);
		
		auth_success = false;
		saveOptions();

		$.post(url + "?api", { api_key: key }).done(function (data) {
			//dbgMsg("Fever API version: " + data.api_version);
			//dbgMsg(data);
			if ( data.auth === 1 ) {
				auth_success = true;
				// Get groups and build them
				//dbgMsg("first success");
				// save url, email und key
				setOption("url", url);
				setOption("key", key);
				setOption("user", user);
				saveOptions();
				
				storeLoadedSavedItems();
				restart();
				// home
				$.mobile.navigate("#page-home", {transition: transition});		
			} else {
				// Nichts wars, nochmal versuchen
				alert("Wrong credentials. Please try again.");
			}

			}).fail(function () { checkAuth(0); });		
		
		return false;
	}
	
	saveOptions();
	getSettings();
	runAfterItemLoadNoHome();
	storeLoadedSavedItems();
	$.mobile.navigate("#page-home", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;	
}


function restart() {
	getSettings();
	start();
}

function login() {
	var url           = $.trim($("#dm-login-url").val());
	var user          = $.trim($("#dm-login-e-mail").val());
	var password      = $.trim($("#dm-login-password").val());
	var key = MD5(user + ":" + password);

	$.post(url + "?api", { api_key: key }).done(function (data) {
		//dbgMsg("Fever API version: " + data.api_version);
		
		dbgMsg(data);
		if ( data.auth == 1 ) {
			dbgMsg("login()");
			auth_success = true;
			// Get groups and build them
			dbgMsg(dm_config);
			// save url, email und key
			setOption("url", url);
			setOption("key", key);
			setOption("user", user);
			
			dbgMsg(dm_config);
			
			$("#dm-login-url").val("");
			$("#dm-login-e-mail").val("");
			$("#dm-login-password").val("");			
			// start
			getSettings();
			
			start();
			// home
			$.mobile.navigate("#page-home", {transition: transition});		
		} else {
			// Nichts wars, nochmal versuchen
			alert("Wrong credentials. Please try again.");
		}
			
		}).fail(function () { checkAuth(0); });
	// Test

}

function logout() {
	// Old Settings:
	simpleStorage.flush();	
	
	dm_key   = '';
	dm_url   = '';
	dm_user  = '';
	favicons = '';
	dm_config = {};
	dm_data = {};
	items = [];
	saved_items = [];
	session_read_items = [];
	auth_success = false;
	start();
}

function showSaved() {
	$("#dm-select-saved-time").removeClass("ui-btn-active");
	$("#dm-select-saved-time").addClass("ui-btn-active");
	showSavedByTimePage(1);
	return;
}

function showSavedByTime() {
	showSavedByTimePage(1);
	
	/*
	$("#dm-saved-content").empty();
	$("#dm-saved-content").append('<ul id="dm-saved-view" data-role="listview" data-divider-theme="a" data-inset="true" data-filter="true"></ul>');
	//var local_items = simpleStorage.get("dm-local-items", []);
	var title = "Saved Items (" +  saved_items.length + ")";
	$("#page-saved").data("title", title);
	$("#dm-saved-header").html(title);
	document.title = title;
	if ( saved_items.length > 0 ) {
		//local_items = _.sortBy(local_items, "created_on_time");
		var items_html = "";
		$.each(saved_items, function(index, value) {
			items_html += renderListviewItem(value, true, true, "long");
		});
		$("#dm-saved-view").append(items_html);

	}
	*/
	return false;
}

function showSavedByTimePage(page) {
	checkpoint("showSavedByTimePage()");
	$("#dm-saved-content").empty();
	//var local_items = simpleStorage.get("dm-local-items", []);
	var title = "Saved Items (" +  saved_items.length + ")";
	$("#page-saved").data("title", title);
	$("#dm-saved-header").html(title);
	document.title = title;
	if ( saved_items.length > 0 ) {
		//local_items = _.sortBy(local_items, "created_on_time");
		var items_html = "";
		
		if ( getOption('paginate_items') !== 0 ) {
			checkpoint("page saved items");
			var pages = Math.ceil(saved_items.length / getOption("paginate_items"));
			
			var upper_limit = Math.min(getOption('paginate_items') * page - 1, saved_items.length - 1 );	
			var lower_limit = getOption('paginate_items') * (page - 1);

			dbgMsg('Pages: '+pages+', Upper: '+ upper_limit+', Lower:' + lower_limit);
			
			//dbgMsg(saved_items);
			
			for ( var i = lower_limit ; i <= upper_limit ; i++ ) {
				items_html += renderListviewItem(saved_items[i], true, true, "long");
			}
			
			var page_buttons = '';
			var next_button = '';
			var last_button = '';
			
			for ( var j=1; j<=pages;j++ ) {
				var add_css_class = '';
				if ( j === getNumber(page) ) {
					add_css_class = ' ui-btn-active';
				}
				page_buttons += '<a href="" data-role="button" data-dm-fnc="show-saved-page" data-dm-saved-page="'+j+'" class="ui-btn ui-corner-all ui-btn-inline dm-button'+add_css_class+'">&nbsp;'+j+'&nbsp;</a>';
			}
						
			if ( page !== pages ) {
				var next = getNumber(page)+1;
				next_button = '<a href="" data-role="button" data-dm-fnc="show-saved-page" data-dm-saved-page="'+ next +'" class="ui-btn ui-icon-arrow-r ui-btn-icon-right ui-corner-all ui-btn-inline dm-button">Next</a>';
			} else {
				next_button = '<a href="" data-role="button" data-dm-fnc="show-saved-page" class="ui-btn ui-corner-all ui-icon-arrow-r ui-btn-icon-right ui-btn-inline ui-state-disabled">Next</a>';
			}
			
			if ( page !== 1 ) {
				var last = getNumber(page)-1;
				last_button = '<a href="" data-role="button" data-dm-fnc="show-saved-page" data-dm-saved-page="'+ last +'" class="ui-btn ui-icon-arrow-l ui-btn-icon-left ui-corner-all ui-btn-inline dm-button">Last</a>'
			} else {
				last_button = '<a href="" data-role="button" data-dm-fnc="show-saved-page" class="ui-btn ui-icon-arrow-l ui-btn-icon-left ui-corner-all ui-btn-inline ui-state-disabled">Last</a>';
			}
			
			//items_html = last_button + page_buttons + next_button + items_html;
			//items_html += last_button + page_buttons + next_button;
			
			$("#dm-saved-content").append( last_button + page_buttons + next_button);
			$("#dm-saved-content").append('<ul id="dm-saved-view" data-role="listview" data-divider-theme="a" data-inset="true" data-filter="true">'+items_html+'</ul>');
			$("#dm-saved-content").append( last_button + page_buttons + next_button);


			
		} else {
			$.each(saved_items, function(index, value) {	
				items_html += renderListviewItem(value, true, true, "long");
			});
			$("#dm-saved-content").append('<ul id="dm-saved-view" data-role="listview" data-divider-theme="a" data-inset="true" data-filter="true">'+items_html+'</ul>');
			
		}
		


	}

	return false;
}

function showSavedByFeed() {
	var grouped_items;
	var feed_ids;
	$("#dm-saved-content").empty();
	//$("#dm-saved-content").append('<ul id="dm-saved-view" data-role="listview" data-divider-theme="a" data-inset="true" data-filter="true"></ul>');
	var title = "Saved Items (" +  saved_items.length + ")";
	
	$("#page-saved").data("title", title);
	document.title = title;	
	$("#dm-saved-header").html(title);
	
	if ( saved_items.length > 0 ) {
		grouped_items = _.groupBy(saved_items, "feed_id");
		feed_ids = _.keys(grouped_items);
		//dbgMsg(feed_ids);
		
		$.each(feeds, function(index,value){
			//dbgMsg(value.id + " " + value.title );
			//dbgMsg(feed_ids);
			if ( _.contains( feed_ids, getString(value.id) ) ) {
				dbgMsg(value.title);
				var saved_part = "<h2>" + escapeString(value.title) + "</h2>";
				var show_pieces = _.filter( saved_items, function(saves){
					//dbgMsg(saves);
					//dbgMsg(value.id + " -> " + saves.feed_id );
					if ( getNumber(saves.feed_id) === getNumber(value.id) ) {
						return true;
					} else {
						return false;
					} 
				});
				dbgMsg(show_pieces);
				
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
					item += '<a href="" class="dm-link-'+value.item_id+' dm-hot-links dm-button" data-dm-fnc="show-item" data-dm-show-item="'+_.escape(value.item_id)+'">'+escapeString(value.title)+'</a>';
				} else {
					item += '<a href="'+value.url+'" class="dm-hot-links" target="_blank">'+escapeString(value.title)+'</a>';
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
	
	if ( getOption("html_content") === "raw" ) {
		$(".dm-"+class_prefix+"-"+value.id+"-title").html($.parseHTML(value.title));
		$(".dm-"+class_prefix+"-"+value.id+"-content").html(escapeString(value.html));
	} else {
		$(".dm-"+class_prefix+"-"+value.id+"-title").html(escapeString(value.title));
		$(".dm-"+class_prefix+"-"+value.id+"-content").html(escapeString(value.html));	
	}
	
	if ( value.is_read == 0 ) {
		$(".dm-"+class_prefix+"-"+value.id+"-title").addClass("dm-item-is-unread");
		feed_class="dm-is-unread";
	} else {
		$(".dm-"+class_prefix+"-"+value.id+"-title").addClass("dm-item-is-read");
	}
	
	var feedname = _.findWhere(feeds, {id: value.feed_id});
	$(".dm-"+class_prefix+"-"+value.id+"-feedname").html('<a href="" class="dm-button '+feed_class+'" data-dm-fnc="show-feed" data-dm-show-feed="'+_.escape(feedname.id)+'">'+escapeString(feedname.title)+'</a>');
	

	
	if ( value.is_saved == 1 ) {
		dbgMsg("saved");
		$('.dm-link-'+_.escape(value.id)+'-save-button').text("Unsave");
		$('.dm-link-'+_.escape(value.id)+'-save-button').buttonMarkup({ icon: "minus" });
		//$('.dm-link-'+_.escape(value.id)+'-save-button').buttonMarkup("refresh");	

	} else {
		dbgMsg("unsaved");
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
	//dbgMsg(paginate_items);
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
	dbgMsg( getOption("paginate_items") );
	
	if ( getNumber(getOption("paginate_items")) === 0 || getNumber(getOption("paginate_items")) >= unread ) {
		//no, just show all items
		dbgMsg("check all");
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
		dbgMsg("check paginate");
		$.each( _.first(group_items, getNumber(getOption("paginate_items")) ), function(index, value) {
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
	$("#dm-group-header").html(escapeString(title));
	document.title = title;

	$("#dm-group-content").data("dm-current-ids", item_ids_in_group);
	$("#dm-group-content").data("dm-current-group-id", id);

	// build whole group
	$("#dm-mark-group-read").data("dm-item-ids", item_ids_in_group);
	$("#dm-mark-group-read").data("fdm-group-id", id);
	// build part of group
	//$.mobile.resetActivePageHeight();

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
	//dbgMsg(paginate_items);
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
	//dbgMsg( getNumber(paginate_items) );
	//dbgMsg(feed_items);
	if ( getNumber(getOption("paginate_items")) === 0 || getNumber(getOption("paginate_items")) >= unread ) {
		//no, just show all items
		dbgMsg("check all");
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
		dbgMsg("check paginate");
		$.each( _.first(feed_items, getNumber(getOption("paginate_items")) ), function(index, value) {
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
	$("#dm-feed-header").html(escapeString(title));
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
	dbgMsg("item after items:");
	dbgMsg(item);
	/*if ( !item ) {
		item = _.findWhere(saved_items, {id: id});
	}
	
	if ( !item ) {
		item = _.findWhere(session_read_items, {id: id});
	}*/
	
	dbgMsg("item after session_read_items:");
	dbgMsg(item);
	
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
	//$.mobile.silentScroll(0);
	return false;	
}

function renderSingleItem(data) {
	dbgMsg(data);
	markItemsRead(data.id.toString());

	$("#dm-single-content").empty();
	if ( getOption("html_content") === "raw") {
		try {
			var content = $.parseHTML(data.html);
			$(content).find("img").removeAttr("onerror");
			$(content).find("img").removeAttr("onload");
					
			$("#dm-single-content").append(content);
			$("#dm-single-content a").attr("target", "_blank");
			
			$('#dm-single-content img').each( function (index) {
					
					$("#dm-single-content img").attr("height", "");
					$("#dm-single-content img").attr("width", "");
					$(this).on('load', function(e) {
						if ($(this).prop('naturalWidth') >= 320 ) {
							$(this).addClass('dm-single-image-wide');
							dbgMsg("added class image wide");
						} else {
							$(this).addClass('dm-single-image-small');
							dbgMsg("added class image small");

						}
					});
							   

			});
			
	
			$("#dm-single-content div").css("width","");

			$("#dm-single-content").fitVids();
			
			

		} catch(e) {
			dbgMsg("error in html of item");
			
			var content = escapeString(data.html);
			
			content = content.split("\n").join("<br>");
			
			$("#dm-single-content").html(content);
		}
		
		
	} else {
		
		var content = escapeString(data.html);
		content = content.split("\n").join("<br>");
	
		$("#dm-single-content").html(content);
	}

	//$("#dm-single-content").data("dm-single-item-current", data.id);
	$("#dm-single-title").html(escapeString(data.title));
	$("#dm-single-title").attr("href", data.url);
	$("#page-single").data("title", _.escape(data.title));
	$("#dm-single-url").attr("href", data.url);
	var meta = '';
	if (data.author) {
		meta += 'by ' + data.author + ' ';
	}
	meta += 'on ' + renderDate("long", data.created_on_time);
	$("#dm-single-meta").html(escapeString(meta));
	var feedname = _.findWhere(feeds, {id: data.feed_id});

	$("#dm-single-feed-title").html(escapeString(feedname.title));
	$("#page-single").data("title", _.escape(feedname.title));

	var favicon_img = getFavicon(feedname);

	$("#dm-single-feedname").html(favicon_img + _.escape(feedname.title));
	$("#dm-single-feedname").data("dm-show-feed", data.feed_id);
	
	$("#dm-single-btn-save").data("dm-save-item-id", data.id);
	
	
	if ( data.is_saved === 1 ) {
		$("#dm-single-btn-save").text("Unsave");
		$("#dm-single-btn-save" ).buttonMarkup({ icon: "minus" });		
	} else {
		$("#dm-single-btn-save").text("Save");
		$("#dm-single-btn-save" ).buttonMarkup({ icon: "plus" });	
	}
	$("#dm-single-sharing-buttons").empty();
	//var sharing_buttons = '';
	if ( getOption("sharing") === "all" ) {
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
			dbgMsg("fb button caused an error...");
		}
		try {
			$("#dm-single-sharing-buttons").append(twitter_button);
		} catch (e) {
			dbgMsg("twitter button caused an error...");
		}
		try {
			$("#dm-single-sharing-buttons").append(gplus_button);
		} catch (e) {
			dbgMsg("g+ button caused an error...");
		}
	}
	
	if ( getOption("sharing") === "all" || getOption("sharing") === "email" ) {
		// Add E-Mail-Button
		var e_mail_msg = getOption("sharing_msg").split("%url%").join(data.url);
		var email_button = '<a href="mailto:?subject='+encodeURI('Check it out: '+data.title)+'&amp;body='+encodeURI(e_mail_msg)+'" data-role="button">Share Link by E-Mail</a>';
		$("#dm-single-sharing-buttons").append(email_button);
	}
	
	if ( getOption("sharing") === "all" || getOption("sharing") === "email") {
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
		
		if ( getOption("sharing_mobile") ) {
			dbgMsg("mobile Sharing: " + getOption("sharing_mobile") );
			passive_buttons += '<div data-role="navbar"><ul>';
			passive_buttons += '<li><a href="whatsapp://send?text=' + encodeURI( data.title + ' - ' + data.url ) + '">WhatsApp</a></li>';
			passive_buttons += '<li><a href="threema://compose?text=' + encodeURI( data.title + ' - ' + data.url ) + '">Threema</a></li>';
			passive_buttons += '</ul></div>';
		}
		$("#dm-single-passive-sharing-buttons").empty();
		$("#dm-single-passive-sharing-buttons").append(passive_buttons);
		
		
	}

	if ( getOption("sharing") === "all" ) {
		// twitter button needs to be refreshed
		try {
			twttr.widgets.load();
		} catch (e) {
			// ignore this one...
			dbgMsg("twitter object seems to be missing...");
		} 
	}		
	//$.mobile.resetActivePageHeight();
	$("#page-single").enhanceWithin();
	//$("#page-single").trigger('updatelayout');
	
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
	//dbgMsg(unread_counter);
	//dbgMsg("build all feeds");
	$.each(feeds, function(index, value){
		
		var item = renderListviewItemFeed(value, true);
		//dbgMsg(item);
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
	dbgMsg("check2");
	if ( getOption("paginate_items") === 0 ) {
		$.each(items, function(index, value) {
			if ( value.is_read == 0 ) {
				var item = renderListviewItem(value, true, true, "long");
				$("#dm-kindling-view").append(item);
				paginated_ids += item.id + ",";
			}
		});
	} else {
		var kindling = _.first(items, getNumber(getOption("paginate_items")));
		dbgMsg(kindling.length);
		$.each(kindling, function(index, value) {
			if ( value.is_read == 0 ) {
				var item = renderListviewItem(value, true, true, "long");
				$("#dm-kindling-view").append(item);
				paginated_ids += value.id + ",";
			}
		});
		
		if ( items.length > getNumber(getOption("paginate_items")) ) {
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
	//$.mobile.resetActivePageHeight();
	//$("#page-kindling").enhanceWithin();
	return true;
}

function showKindling() {
	dbgMsg("check");
	buildKindling();
	return false;
}

function getFavicon(feed, css_classes) {
	// should a a feed-object
	if ( !!feed) {

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
	}
	// return generic code
	return '<img src="artwork/feed-icon-generic.png" height="16" width="16" class="'+css_classes+'"/>';
}

function showGroupSelector(id) {
	if ( getOption("groupview") == "feeds" ) {
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
	var title = escapeString(group.title + ' ('+unread+')');
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
	var unread = getNumber(getUnreadCountFeed(feed.id));//_.where(items, {is_read:0, feed_id:feed.id});
	
	if ( unread === 0 ) {
		if ( getOption("show_empty_groups") === false && show_all === false) {
			return '';
		}
	}
	var item = '';
	item += '<li>';

	item += '<a class="dm-button" data-dm-fnc="show-feed" data-dm-show-feed="'+_.escape(feed.id)+'">';
	item += getFavicon(feed, "ui-li-icon dm-favicon dm-favicon-feed");
	item += escapeString(feed.title)+ '<span class="ui-li-count">'+unread+'</span>'+'</a>';
	item += '</li>';
	return item;
}

function renderListviewItem(item, with_feed, with_author, with_time) {
	// creates the whole li-string...
	var li, css_classes;
	
	
	li  = '<li>';

	var feed = _.findWhere(feeds, {id: item.feed_id});
	
	if ( !feed ) {
		return '';	
	}
	
	li += getFavicon(feed, "dm-favicon ui-li-icon");
	li += '<p class="dm-listview-content">';
	if ( item.is_read == 0 ) {
		css_classes = 'dm-item-is-unread';
	} else {
		css_classes = 'dm-item-is-read';
	}
	//dbgMsg("checkpoint");
	li += '<a href="" class="dm-button dm-hot-links dm-single-item-link-'+_.escape(item.id)+' '+css_classes+'" data-dm-show-item="'+_.escape(item.id)+'" data-dm-fnc="show-item">' + escapeString(item.title) + '</a></p><p class="dm-listview-content">posted';
	if ( with_feed == true ) {
		li += ' on <a href="" class="dm-hot-links dm-is-read dm-button" data-dm-fnc="show-feed" data-dm-show-feed="'+_.escape(feed.id)+'">'+escapeString(feed.title)+'</a>';
	}
	if ( with_author == true && item.author ) {
		li += ' by '+escapeString(item.author)+'';
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
	dbgMsg("preparing home");
	

	switch(curr_page) {
		case "page-home":
			// reload home
			$.each(widgets, function(index, value) {
				$("#dm-widget-place-"+value.place).html(eval(value.fnc));
			});

			document.title = "Delirious° (" + items.length + ")";
			$("#dm-header").html('Delirious<span style="color:red">°</span> (' + items.length + ')');
			//$.mobile.resetActivePageHeight();
			$("#page-home").enhanceWithin();
			//$( "[data-position='fixed']" ).toolbar( 'updatePagePadding' );
		break;
		default:
			// do nothing for now
		break;
	}
	
//	



}

function showHome() {

	$.mobile.navigate("#page-home", {transition: transition});
	//$.mobile.resetActivePageHeight();
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
	dbgMsg("markFeedAsFav()");
	if ( _.contains(fav_feeds, id) ) {
		// should be removed
		fav_feeds = _.without(fav_feeds, id);
		dbgMsg("Remove feed from fav " + id);
		var res = simpleStorage.set("dm-fav-feeds", _.compact(fav_feeds));
		dbgMsg(res);
		$("#dm-feed-favmarker").html("Mark Feed as Favourite");
		
	} else {
		fav_feeds.push(id);
		dbgMsg("add feed to fav " + id);

		var res = simpleStorage.set("dm-fav-feeds", _.compact(fav_feeds));
		dbgMsg(res);
		$("#dm-feed-favmarker").html("Remove Feed from Favourites");
	}

	return false;
}

function markGroupAsFav() {
	var id = $("#dm-group-content").data("dm-current-group-id");

	if ( _.contains(fav_groups, id) ) {
		// should be removed
		fav_groups = _.without(fav_groups, id);
		simpleStorage.set("dm-fav-groups", _.compact(fav_groups));
		$("#dm-group-favmarker").html("Mark Group as Favourite");
		
	} else {
		fav_groups.push(id);
		simpleStorage.set("dm-fav-groups", _.compact(fav_groups));
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
	simpleStorage.set("dm-widgets", widgets);
	showHome();

}


function countUnreadItems() {
	unread_counter = {};
	dbgMsg("counting unread items");
	
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
	//dbgMsg(unread);
	if ( unread ) {
		return unread_counter["feed-"+feed_id];
	} else {
		return 0;
	}
}

function exportSettings() {

	var settings = {};
	if ( $("#dm-export-fav").is(":checked")  ) {
		settings.fav_feeds = fav_feeds;
		settings.fav_groups = fav_groups;
	}
	
	if ( $("#dm-export-homescreen").is(":checked") ) {
		settings.widgets = widgets;
	}
	
	if ( $("#dm-export-settings").is(":checked") ) {
		settings.config = dm_config;
	}
	return LZString.compressToEncodedURIComponent( JSON.stringify(settings) );
}

function saveImportedSettings(settings) {
	dbgMsg("saveImportedSettings()");
	dbgMsg(settings);
	
	if ( !_.isUndefined(settings.widgets) ) {
		dbgMsg("Import a new Layout");
		simpleStorage.set("dm-widgets", settings.widgets);
		widgets = settings.widgets;
	}
	
	if ( !_.isUndefined(settings.config) ) {
		dbgMsg("Import new settings");
		settings.config["url"] = getOption("url");
		settings.config["key"] = getOption("key");
		settings.config["user"] = getOption("user");
		dbgMsg(settings.config);
		simpleStorage.set("dm-config", settings.config);
		dm_config = settings.config;
	}
		
	if ( !_.isUndefined(settings.fav_feeds) ) {
		dbgMsg("Import Fav Feeds");
		simpleStorage.set("dm-fav-feeds", settings.fav_feeds);
		fav_feeds = settings.fav_feeds;
	}
		
	if ( !_.isUndefined(settings.fav_groups) ) {
		dbgMsg("Import Fav Groups");
		simpleStorage.set("dm-fav-groups", settings.fav_groups);
		fav_groups = settings.fav_groups;
	}
}

function showImportExport() {
	var settings = exportSettings();
	$("#dm-export-settings-box").val(settings);
}

function importSettings() {
	if ( $("#dm-import-settings").val() ) {
		
		var settings = JSON.parse( LZString.decompressFromEncodedURIComponent( $("#dm-import-settings").val() ) );
		saveImportedSettings();
		
	}
	
	getSettings();
	runAfterItemLoadNoHome();
	storeLoadedSavedItems();
	$.mobile.navigate("#page-home", {transition: transition});
}

function generateExportFile() {
	var settings = exportSettings();
	var settings_file = new Blob( [settings], {type : 'application/octet-stream'});
	saveAs(settings_file, "settings.dm");
	
}

function showCheckFavs() {
	countUnreadItems();

	// First, show Groups

	var content_ShowFavGroups = '';
	//dbgMsg(fav_groups);
	$.each(groups, function (index, value) {
		
		if ( _.contains(fav_groups, value.id)  ) {
			var unread = countUnreadInGroup(value.id);
			
			var group = _.findWhere(groups, {id: value.id});
			content_ShowFavGroups += '<li data-theme="a">';
			content_ShowFavGroups += '<a href="" data-dm-show-group="' + group.id + '" class="dm-button" data-dm-fnc="show-group-selector">' + _.escape(group.title);
			content_ShowFavGroups += '<span class="ui-li-count">' + unread + '</span></a></li>';
		}
	});
	
	if (content_ShowFavGroups) {
		content_ShowFavGroups = '<ul data-role="listview" data-theme="a" data-inset="true">' + content_ShowFavGroups;
		content_ShowFavGroups += '</ul>';
	} else {
		content_ShowFavGroups = '<p>No favourite groups.</p>';
	}
	$('#dm-checkfavs-groups').html(content_ShowFavGroups);
	// Second Show Fav Feeds
	
	var content_ShowFavFeeds = '';
	$.each(feeds, function (index, value) {
		if ( _.contains(fav_feeds, value.id) ) {
			var feed = _.findWhere(feeds, {id: getNumber(value.id)});
			content_ShowFavFeeds += renderListviewItemFeed(feed, true);
		}
	});
	if (content_ShowFavFeeds) {
		content_ShowFavFeeds = '<ul data-role="listview" data-theme="a" data-inset="true">' + content_ShowFavFeeds + '</ul>';
	} else {
		content_ShowFavFeeds = '<p>No favourite feeds.</p>';
	}	
	
	$('#dm-checkfavs-feeds').html(content_ShowFavFeeds);

}