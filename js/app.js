function init() {
	if ( fm_url != "" ) {
		$("#fmjs-fever-url").val(fm_url);
	}
	if ( fm_user != "" ) {
		$("#fmjs-e-mail").val(fm_user);
	}
	$('input:radio[name="fmjs-setting-transitions"]').filter('[value="'+transition+'"]').prop('checked', true);
	$('input:radio[name="fmjs-setting-html-content"]').filter('[value="'+html_content+'"]').prop('checked', true);
	$('input:radio[name="fmjs-setting-groupview"]').filter('[value="'+groupview+'"]').prop('checked', true);
	$('input:radio[name="fmjs-setting-empty-groups"]').filter('[value="'+show_empty_groups+'"]').prop('checked', true);
	$('input:radio[name="fmjs-setting-sharing"]').filter('[value="'+sharing+'"]').prop('checked', true);
	$('#fmjs-setting-sharing-msg').val(sharing_msg);
}

function start() {
	// Load Config, if any

	// Check, if we have all the auth-data

	// test-auth
	if ( fm_url == "" ) {
		checkAuth(0);
	}
	started = true;
	//init();
	showHideLoader("start");
	$.post(fm_url + "?api", { api_key: fm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			auth_success = true;
			// Get groups and build them
			syncSavedItems("start");
			showHideLoader("start");
			$.post(fm_url + "?api&groups", { api_key: fm_key }).done(function(data) {
				showHideLoader("stop");
				if ( checkAuth(data.auth) ) {
					
					groups       = _.sortBy(data.groups, "title");
					feeds_groups = data.feeds_groups;
					//createGroups(false);
					$.post(fm_url + "?api&feeds", { api_key: fm_key }).done(function(data) {
						if ( checkAuth(data.auth) ) {
							feeds = _.sortBy(data.feeds, "title");
							syncUnreadItems("full");
						}
					});
				}
			}).fail(function(){ showHideLoader("stop"); checkAuth(0); });

		}
			
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	
}

function saveSettings() {
	var url, user, password, transition, html_content, groupview, emptygroups, share_buttons, sharing_text;
	
	url        = $.trim($("#fmjs-fever-url").val());
	user       = $.trim($("#fmjs-e-mail").val());
	password   = $.trim($("#fmjs-password").val());
	transition = $('input[name=fmjs-setting-transitions]:checked').val();
	html_content = $('input[name=fmjs-setting-html-content]:checked').val();
	groupview = $('input[name=fmjs-setting-groupview]:checked').val();
	emptygroups = $('input[name=fmjs-setting-empty-groups]:checked').val();
	share_buttons = $('input[name=fmjs-setting-sharing]:checked').val();
	sharing_text = $('#fmjs-setting-sharing-msg').val();
	
	if ( $.jStorage.storageAvailable() ) {
		$.jStorage.set("fmjs-url", url);
		
		if ( password != "" ) {
			key = MD5(user + ":" + password);
			$.jStorage.set("fmjs-user", user);
			$.jStorage.set("fmjs-key", key);
		}
		
		$.jStorage.set("fmjs-transition", transition);
		$.jStorage.set("fmjs-html-content", html_content);
		$.jStorage.set("fmjs-groupview", groupview);
		$.jStorage.set("fmjs-show-empty-groups", emptygroups);
		$.jStorage.set("fmjs-sharing", share_buttons);
		$.jStorage.set("fmjs-sharing-msg", sharing_text);

	} else {
		return false;
	}
	restart();
	$.mobile.changePage("#page-home", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;	
}

function restart() {
	getSettings();
	start();
}

function logout() {
	$.jStorage.deleteKey("fmjs-key");
	$.jStorage.deleteKey("fmjs-url");
	$.jStorage.deleteKey("fmjs-user");
	$.jStorage.deleteKey("fmjs-favicons");
	$.jStorage.deleteKey("fmjs-local-items");
	$.jStorage.deleteKey("fmjs-transition");
	$.jStorage.deleteKey("fmjs-html-content");
	$.jStorage.deleteKey("fmjs-groupview");
	$.jStorage.deleteKey("fmjs-sharing");
	$.jStorage.deleteKey("fmjs-sharing-msg");

	$.jStorage.deleteKey("fmjs-fav-feeds");
	$.jStorage.deleteKey("fmjs-fav-groups");
	$.jStorage.deleteKey("fmjs-widgets");
	$.jStorage.deleteKey("fmjs-show-empty-groups");
	fm_key   = '';
	fm_url   = '';
	fm_user  = '';
	favicons = '';
	items = [];
	saved_items = [];
	session_read_items = [];
	auth_success = false;
	start();
}

function showSaved() {

	$("#fmjs-saved-content").empty();
	$("#fmjs-saved-content").append('<ul id="fmjs-saved-view" data-role="listview" data-divider-theme="d" data-inset="true" data-filter="true"></ul>');
	//var local_items = $.jStorage.get("fmjs-local-items", []);

	if ( saved_items.length > 0 ) {
		//local_items = _.sortBy(local_items, "created_on_time");
		$.each(saved_items, function(index, value) {
			var item = "";
			item += renderListviewItem(value, true, false, "long");
			$("#fmjs-saved-view").append(item);

		});
	}
	if (called_saved == false ) {
		called_saved = true;
	} else {
		//$("#fmjs-saved-view").listview();
		$("#page-saved").trigger("create");
	}
	
	$.mobile.changePage("#page-saved", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;
}

function showHot(page) {

	if ( page == 1 ) {
		// First page has been called, so do a complete refresh
		$("#fmjs-hot-content").empty();
		$("#fmjs-hot-more").attr("onclick", "showHot(2);");
	} else {
		// another page has been called, so let's append a new one
		var next_page = page;
		next_page++;
		$("#fmjs-hot-more").attr("onclick", "showHot("+next_page+");");
	}
	
	// Get range and offset
	var range  = $("#fmjs-hot-range :selected").attr("value");
	var offset = $("#fmjs-hot-offset :selected").attr("value");

	showHideLoader("start");
	$.post(fm_url + "?api&links&offset="+offset+"&range="+range+"&page="+page, { api_key: fm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
		
			load_ids = '';
			$.each(data.links, function(index, value) {
				var item = '';
				var id_list = '';
				load_ids += value.item_ids + ',';
				item += '<div>';
				item += '<h2>';
				item += _.escape( value.temperature ) + '<span style="color:red">°</span>&nbsp;';
				if (value.is_local == 1 && value.is_item == 1) {
					load_ids += value.item_id + ",";
					item += '<a href="" class="fmjs-link-'+value.item_id+' fmjs-hot-links" onclick="showSingleItem('+value.item_id+');">'+_.escape(value.title)+'</a>';
				} else {
					item += '<a href="'+value.url+'" class="fmjs-hot-links" target="_blank">'+_.escape(value.title)+'</a>';
				}
				
				item += '</h2>';
			
				if (value.is_local == 1 && value.is_item == 1) {
					// Add local stuff here, like excerpt an feed name.
					
					item +='<p style="max-height:2.8em;overflow:hidden;" class="fmjs-link-'+_.escape(value.item_id)+'-content"></p>';
					item += '<p style="text-align:right;">posted by <span class="fmjs-link-'+_.escape(value.item_id)+'-favicon"></span> <span class="fmjs-link-'+_.escape(value.item_id)+'-feedname fmjs-hot-links">Feed</span></p><p style="text-align:right;"><a href="'+_.escape(value.url)+'" target="_blank" data-role="button" data-theme="b" data-inline="true" data-mini="true" data-icon="grid">Open URL</a> <a href="" onclick="saveItem('+_.escape(value.item_id)+');" target="_blank" data-role="button" data-icon="plus" data-theme="b" data-inline="true" data-mini="true">Save</a></p>';
				}
			
				// Now we show a list of all those items, linking to this hot item...
				item += '<ul data-role="listview" data-divider-theme="d" data-inset="true" id="fmjs-hot-content-link-'+_.escape(value.id)+'" class="fmjs-hot-linkbox">';

				var links = value.item_ids.split(',');
				for (var i=0, link_id; link_id=links[i]; i++) {
					// item is "some", then "example", then "array"
					// i is the index of item in the array
					link_id = _.escape(link_id);
					item += '<li><p><span class="fmjs-link-'+link_id+'-favicon"></span><a href="" class="fmjs-link-'+link_id+' fmjs-hot-links fmjs-single-item-link-'+link_id+'" onclick="showSingleItem('+link_id+');"><span class="fmjs-link-'+link_id+'-title fmjs-hot-links fmjs-single-item-link-'+link_id+'">Link: '+link_id+'</span></a> by <span class="fmjs-link-'+link_id+'-feedname fmjs-hot-links">Feed</span></p></li>';
					id_list += link_id + ",";
				}	
				item += '</ul>';
				//
				item += '<div style="text-align:right"><a href="" data-role="button" onclick="markItemsRead(\''+_.escape(id_list)+'\');" data-theme="b" data-inline="true" data-mini="true" data-icon="check">Mark Links as read</a></div>';
				//
				item += '</div>';
				$("#fmjs-hot-content").append(item);

				//$(".fmjs-hot-to-button").button();
				
			});	

			var ids_to_get = load_ids.split(',');
			ids_to_get     = _.compact(_.uniq(ids_to_get));
			// let's see, if some are already loaded...
			$.each(ids_to_get, function(index, id) {
				var local = _.findWhere(items, {id: parseInt(id, 10)});
				if ( !local ) {
					local = _.findWhere(session_read_items, {id: parseInt(id, 10)});
				}
				if ( local ) {
					local_check_id = id;
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
			
			//$("#page-hot").trigger("create");
			if ( page == 1) {
				if ( called_hot == false ) {
					called_hot = true;
				} else {
					//$(".fmjs-to-listview").listview().removeClass("fmjs-to-listview");
					$("#page-hot").trigger("create");
				}
				$.mobile.changePage("#page-hot", {transition: transition});
				//$.mobile.silentScroll(0);
				return false;
			} else {
				//$(".fmjs-to-listview").listview().removeClass("fmjs-to-listview");
				$("#page-hot").trigger("create");
				return false;
			}
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function fillLinkPlaceholder(placeholder_ids, class_prefix) {
	// Fever-API allows to get a maximum of 50 links per request, we need to split it, obviously

	if ( placeholder_ids.length > 20 ) {
		var first = _.first(placeholder_ids, 20);
		var rest  = _.rest(placeholder_ids, 20);
	} else {
		var first = placeholder_ids;
		var rest = [];
	}
	var get_ids = first.join(",");
	showHideLoader("start");
	$.post(fm_url + "?api&items&with_ids="+ _.escape(get_ids), { api_key: fm_key }).done(function(data) {
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
	}
}

function replacePlaceholder(value) {
	var class_prefix = 'link';
	$(".fmjs-"+class_prefix+"-"+value.id+"-title").html(_.escape(value.title));

	if ( value.is_read == 0 ) {
		$(".fmjs-"+class_prefix+"-"+value.id+"-title").addClass("fmjs-item-is-unread");
	} else {
		$(".fmjs-"+class_prefix+"-"+value.id+"-title").addClass("fmjs-item-is-read");
	}

	$(".fmjs-"+class_prefix+"-"+value.id+"-content").html(_.escape(value.html));

	var feedname = _.findWhere(feeds, {id: value.feed_id});
	$(".fmjs-"+class_prefix+"-"+value.id+"-feedname").html('<a href="" onclick="showFeed('+_.escape($.trim(feedname.id))+');">'+_.escape(feedname.title)+'</a>');

	var favicon = getFavicon(feedname);
	$(".fmjs-"+class_prefix+"-"+value.id+"-favicon").append(favicon).removeClass("fmjs-"+class_prefix+"-"+value.id+"-favicon");
	return true;
}

function showGroup(id) {

	$("#fmjs-group-content").removeData("fmjs-current-ids");
	$("#fmjs-group-content").removeData("fmjs-current-group-id");
	$("#fmjs-group-content").empty();
	$("#fmjs-group-content").append('<a href="" data-role="button" onclick="showFeedsInGroup('+id+')" id="fmjs-group-show-feeds">Show Feeds of group</a>');
	$("#fmjs-group-content").append('<ul data-role="listview" data-divider-theme="d" data-inset="true" data-filter="true" id="fmjs-group-view"></ul>');

	var group = _.findWhere(groups, {id: id});
	

	var ids_to_show = _.where(feeds_groups, {group_id: id});
	
	feeds_to_show = ids_to_show[0].feed_ids.split(",");
	feeds_for_group = [];
	$.each(feeds_to_show, function(index, value) {
		feeds_for_group.push(parseInt(value, 10));
	});

	item_ids_in_group = '';
	group_item_counter = 0;
	$.each(items, function(index, value) {
		if ( $.inArray(value.feed_id, feeds_for_group ) !== -1 && value.is_read == 0 ) {
			var item = "";
			item += renderListviewItem(value, true, false, false);
			item_ids_in_group += value.id +",";
			group_item_counter++;
			$("#fmjs-group-view").append(item);
		}
	});
	
	$("#fmjs-group-header").html(group.title + ' ('+group_item_counter+')');
	$("#fmjs-group-content").data("fmjs-current-ids", item_ids_in_group);
	$("#fmjs-group-content").data("fmjs-current-group-id", id);

	if ( _.contains(fav_groups, id) ) {
		$("#fmjs-group-favmarker").html("Remove group from favourites");
	} else {
		$("#fmjs-group-favmarker").html("Mark group as favourite");
	}

	if (called_group == false ) {
		called_group = true;
	} else {
		$("#page-group").trigger("create");
	}

	$.mobile.changePage("#page-group", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;
}

function showFeed(id) {

	$("#fmjs-feed-content").empty();
	$("#fmjs-feed-content").append('<ul data-divider-theme="d" data-inset="true" data-filter="true" id="fmjs-feed-view" data-role="listview"></ul>');
	$("#fmjs-feed-content").removeData("fmjs-feed-item-ids");
	$("#fmjs-feed-content").removeData("fmjs-feed-id");	
	called_feed_info = _.findWhere(feeds, {id: id});
	
	$("#fmjs-feed-header").html(called_feed_info.title);
	feed_items_shown = '';
	var items_to_show = _.where(items, {feed_id: id});
	items_to_show = _.sortBy(items_to_show, "created_on_time");

	$.each(items_to_show, function(index, value) {

		if ( value.is_read == "0" ) {
			feed_items_shown += value.id + ',';
			var item = renderListviewItem(value, false, true, "long");
			$("#fmjs-feed-view").append(item);
		}
	});
	
	$("#fmjs-feed-content").data("fmjs-feed-item-ids", feed_items_shown);
	$("#fmjs-feed-content").data("fmjs-feed-id", id);

	if ( _.contains(fav_feeds, id) ) {
		$("#fmjs-feed-favmarker").html("Remove feed from favourites");
	} else {
		$("#fmjs-feed-favmarker").html("Mark feed as favourite");
	}

	if (called_feed == false ) {
		called_feed = true;
	} else {
		$("#page-feed").trigger("create");
	}

	$.mobile.changePage("#page-feed", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;
}


function refreshFavicons() {
	showHideLoader("start");
	$.post(fm_url + "?api&favicons", { api_key: fm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			favicons = data.favicons;
			$.jStorage.set("fmjs-favicons", favicons);
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	return false;
}

function showSingleItem(id) {
	var item = _.findWhere(items, {id: id});

	if ( !item ) {
		item = _.findWhere(saved_items, {id: id});
	} 
	
	if ( !item ) {
		item = _.findWhere(session_read_items, {id: id});
	}
	
	if ( !item ) {
		showHideLoader("start");
		$.post(fm_url + "?api&items&with_ids="+ _.escape(id), { api_key: fm_key }).done(function(data) {
			showHideLoader("stop");
			if ( checkAuth(data.auth) ) {
				session_read_items.push(data.items[0]);
				renderSingleItem(data.items[0]);
			}
		}).fail(function(){ showHideLoader("stop"); checkAuth(0); });		
	} else {
		renderSingleItem(item);
	}
	return false;	
}

function renderSingleItem(data) {
	console.log(data);
	if ( html_content == "raw") {
		$("#fmjs-single-content").html(data.html);
		$("#fmjs-single-content a").attr("target", "_blank");
		$("#fmjs-single-content img").attr("height", "");
		$("#fmjs-single-content img").attr("width", "");
		$("#fmjs-single-content").fitVids();

	} else {
		$("#fmjs-single-content").html(_.escape(data.html));
	}

	$("#fmjs-single-content").data("fmjs-single-item-current", data.id);
	$("#fmjs-single-title").html(_.escape(data.title));

	$("#fmjs-single-url").attr("href", data.url);
	var meta = '';
	if (data.author) {
		meta += 'by ' + data.author + ' ';
	}
	meta += 'on ' + renderDate("long", data.created_on_time);
	$("#fmjs-single-meta").html(_.escape(meta));
	var feedname = _.findWhere(feeds, {id: data.feed_id});

	$("#fmjs-feed-title").html(_.escape(feedname.title));

	var favicon_img = getFavicon(feedname);

	$("#fmjs-single-feedname").html(favicon_img + _.escape(feedname.title));
	$("#fmjs-single-feedname").attr("onclick", "showFeed("+_.escape(data.feed_id)+");");

	markItemsRead(data.id.toString());
	if ( data.is_saved == 1 ) {
		if ( called_single == true ) {
			$("#fmjs-single-btn-save .ui-btn-text").html("Unsave");
		} else {
			$("#fmjs-single-btn-save").html("Unsave");
		}
		$("#fmjs-single-btn-save").attr("onclick", "unsaveCurrentItem();");
		$("#fmjs-single-btn-save" ).buttonMarkup({ icon: "minus" });		
	} else {
		if ( called_single == true ) {
			$("#fmjs-single-btn-save .ui-btn-text").html("Save");
		} else {
			$("#fmjs-single-btn-save").html("Save");
		}
		$("#fmjs-single-btn-save").attr("onclick", "saveCurrentItem();");
		$("#fmjs-single-btn-save" ).buttonMarkup({ icon: "plus" });	
	}
	
	var sharing_buttons = '';
	if (sharing == "all" ) {
		// Add Facebook-Button
		sharing_buttons += '<iframe src="//www.facebook.com/plugins/like.php?href='+encodeURI(data.url)+'&amp;send=false&amp;layout=button_count&amp;width=250&amp;show_faces=false&amp;font&amp;colorscheme=light&amp;action=like&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:250px; height:21px;" allowTransparency="true"></iframe>';
		
		// Add Twitter-Button
		sharing_buttons += '<a href="https://twitter.com/share" class="twitter-share-button" data-size="large" data-url="'+encodeURI(data.url)+'">Tweet</a>';
		sharing_buttons += '<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>';
		// Add Google+-Button
		sharing_buttons += '<div class="g-plus" data-action="share" data-annotation="bubble" data-href="'+encodeURI(data.url)+'"></div>';
		sharing_buttons += '<script type="text/javascript">';
		sharing_buttons += '(function() {';
		sharing_buttons += "var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;";
		sharing_buttons += "po.src = 'https://apis.google.com/js/plusone.js';";
		sharing_buttons += "var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);";
		sharing_buttons += '})();';
		sharing_buttons += '</script>';
	}
	
	if ( sharing == "all" || sharing == "email" ) {
	
		// Add E-Mail-Button
		var e_mail_msg = sharing_msg.split("%url%").join(data.url);
		sharing_buttons += '<a href="mailto:?subject='+encodeURI('Check it out: '+_.escape(data.title))+'&body='+encodeURI(e_mail_msg)+'" data-role="button">Share Link by E-Mail</a>';
	}
	$("#fmjs-single-sharing-buttons").html(sharing_buttons);
	
	if (called_single == false ) {
		called_single = true;
	} else {
		$("#page-single").trigger("create");
		if ( sharing == "all" ) {
			// twitter button needs to be refreshed
			twttr.widgets.load();
		}	
	}
	

	$.mobile.changePage("#page-single", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;
}

function renderDate(how, timestamp) {
	var now  = new Date();
	var date = new Date(timestamp*1000);
	var month =  date.getMonth();
	month++;
	var minutes = date.getMinutes();
	if (minutes < 10 ) {
		minutes = "0" + minutes;
	}
	
	if ( how == "long") {
		return date.getDate() + '.' + month + '.' + date.getFullYear() + ' @ ' + date.getHours()+ ':' + minutes;
	}
	
	if ( how == "date" ) {
		return date.getDate() + '.' + month + '.' + date.getFullYear();
	}
	
	if ( how == "time" ) {
		return date.getHours()+ ':' + minutes;
	}
	
	if ( how == "relative-date" ) {
		return '';
	}

	if ( how == "relative-time" ) {
		return '';
	}
}

function checkAuth(auth) {
	if ( auth == 1 ) {
		return true;
	} else {
		if ( auth_success == true ) {
			// it was once successful, so it's probably a network issue,
			// a stop or anything else, just log it, and don't do anything at all.
			// an alert would be ok too, but this might be unwise, as 
			// initial loading can happen quite often...
			//console.log("Probably stopped or network issue.");
		} else {
			//console.log("Forbidden");
			alert("Please check your Login-credentials. This could also mean, that your internet connection is lost. Or maybe you stopped loading a page.");	

			$.mobile.changePage("#page-settings", {transition: transition});
			//$.mobile.silentScroll(0);
			return false;		
		}

	}
}

function getUnreadSparks() {
	var spark_feeds = _.where(feeds, {is_spark: 1});

	feeds_for_sparks_unread = [];
	$.each(spark_feeds, function(index, value) {
		feeds_for_sparks_unread.push(value.id);
	});
	
	unread_in_sparks_counter = 0;
	unread_sparks = [];
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

	$("#fmjs-sparks-content").empty();
	$("#fmjs-sparks-content").append('<ul data-role="listview" data-divider-theme="d" data-inset="true" id="fmjs-sparks-view"></ul>');

	var sparks = getUnreadSparks();
	item_ids_in_sparks = "";
	$.each(sparks.items, function(index, value) {
		if ( value.is_read == 0 ) {
			var item = "";
			item += renderListviewItem(value, true, false, false);
			
			item_ids_in_sparks += value.id +",";
			$("#fmjs-sparks-view").append(item);
		}
	});
	$("#fmjs-sparks").data("fmjs-current-ids", item_ids_in_sparks);
	if (called_sparks == false ) {
		called_sparks = true;
	} else {
		//$("#fmjs-sparks-view").listview();
		$("#page-sparks").trigger("create");
	}
	$.mobile.changePage("#page-sparks", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;

}



function showAllFeeds() {
	$("#fmjs-all-feeds-content").empty();
	$("#fmjs-all-feeds-content").append('<ul data-role="listview" data-divider-theme="d" data-inset="true" data-filter="true" id="fmjs-all-feeds-view"></ul>');
	
	$.each(feeds, function(index, value){

		var item = '';
		item += '<li>';
		item += '<a onclick="showFeed('+_.escape(value.id)+')">';
		
		item += getFavicon(value, "ui-li-icon ui-corner-none");
		var unread = _.where(items, {is_read:0, feed_id:value.id});
		
		item += _.escape(value.title)+ '<span class="ui-li-count">'+unread.length+'</span>'+'</a>';
		item += '</li>';

		$("#fmjs-all-feeds-view").append(item);
		
	});
	
	if (called_all_feeds == false ) {
		called_all_feeds = true;
	} else {
		//$("#fmjs-all-feeds-view").listview();
		$("#page-all-feeds").trigger("create");
	}

	$.mobile.changePage("#page-all-feeds", {transition: transition});
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
	}
	
	if ( loading == 1 && state == "start") {
		$.mobile.loading( "show", {
			text: "Synchronizing data...",
			textVisible: true,
			theme: "b",
		});
	}
}

function showKindling() {
	$("#fmjs-kindling-content").empty();
	$("#fmjs-kindling-content").append('<ul data-role="listview" data-divider-theme="d" data-inset="true" data-filter="true" id="fmjs-kindling-view"></ul>');

	$.each(items, function(index, value) {
		if ( value.is_read == 0 ) {
			var item = renderListviewItem(value, true, false, false);
			$("#fmjs-kindling-view").append(item);
		}
	});

	if (called_kindling == false ) {
		called_kindling = true;
	} else {
		//$("#fmjs-kindling-view").listview();
		$("#page-kindling").trigger("create");
	}

	$.mobile.changePage("#page-kindling", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;
}

function getFavicon(feed, css_classes) {
	// should a a feed-object
	if ( !!css_classes ) {

	} else {
		var css_classes = "fmjs-favicon";
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

	//$("#fmjs-feedgroup-content").removeData("fmjs-current-ids");
	//$("#fmjs-feedgroup-content").removeData("fmjs-current-group-id");
	$("#fmjs-feedgroup-content").empty();
	$("#fmjs-feedgroup-content").append('<a href="" data-role="button" onclick="showGroup('+id+')" id="fmjs-feedgroup-show-all">Show all items</a>');
	$("#fmjs-feedgroup-content").append('<ul data-role="listview" data-divider-theme="d" data-inset="true" data-filter="true" id="fmjs-feedgroup-view"></ul>');
	
	var group = _.findWhere(groups, {id: id});
	var unread = countUnreadInGroup(id);
	$("#fmjs-feedgroup-header").html(group.title + ' ('+unread+')');

	var ids_to_show = _.findWhere(feeds_groups, {group_id: id});
	
	var feeds_to_show = ids_to_show.feed_ids.split(",");
	
	$.each(feeds_to_show, function(index, value) {
		var item = renderListviewItemFeed(value);
		if (item) {
			$("#fmjs-feedgroup-view").append(item);
		}
	});

	if (called_feedgroup == false ) {
		called_feedgroup = true;
	} else {
		//$("#fmjs-feedgroup-view").listview();
		//$("#fmjs-feedgroup-show-all").button();
		$("#page-feedgroup").trigger("create");
	}

	$.mobile.changePage("#page-feedgroup", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;

}

function renderListviewItemFeed(feed_id) {
	var feed = _.findWhere(feeds, {id: parseInt(feed_id, 10)});
	var unread = _.where(items, {is_read:0, feed_id:feed.id});
	
	if (unread == 0 ) {
		if ( show_empty_groups == "false" ) {
			return '';
		}
	}
	var item = '';
	item += '<li>';
	item += '<a onclick="showFeed('+_.escape(feed.id)+')">';
		
	item += getFavicon(feed, "ui-li-icon ui-corner-none");

	
	item += _.escape(feed.title)+ '<span class="ui-li-count">'+unread.length+'</span>'+'</a>';
	item += '</li>';
	return item;
}

function renderListviewItem(item, with_feed, with_author, with_time) {
	// creates the whole li-string...
	var li, css_classes;
	
	li  = '<li data-theme="c">';
	li += '<p>';
			
	var feed = _.findWhere(feeds, {id: item.feed_id});
	li += getFavicon(feed);
	
	if ( item.is_read == 0 ) {
		css_classes = 'fmjs-item-is-unread';
	} else {
		css_classes = 'fmjs-item-is-read';
	}
	
	li += '<a href="" onclick="showSingleItem('+_.escape(item.id)+')" class="fmjs-hot-links fmjs-single-item-link-'+_.escape(item.id)+' '+css_classes+'">' + _.escape(item.title) + '</a>';
	if ( with_feed == true ) {
		li += ' by <a href="" onclick="showFeed('+_.escape(feed.id)+');" class="fmjs-hot-links">'+_.escape(feed.title)+'</a>';
	}
	if ( with_author == true && item.author ) {
		li += ' by '+_.escape(item.author)+'';
	}
	if ( with_time ) {
		li += ' @ ' + renderDate(with_time, item.created_on_time);
	}
	li += '</p>';
	li += '</li>';
	return li;
}

function prepareHome() {
	// Which Widgets to display?
	
	$.each(widgets, function(index, value) {
		$("#fmjs-widget-place-"+value.place).html( eval(value.fnc) );
	});
	$("#page-home").trigger("create");
}

function showHome() {
	prepareHome();
	// navigate home
	if (called_home == false ) {
		called_home = true;
	} else {
		//$(".fmjs-home-views").listview("refresh");
		$("#page-home").trigger("create");
	}

	$.mobile.changePage("#page-home", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;
}

function showGroups() {
	$("#fmjs-groups-content").empty();
	$("#fmjs-groups-content").append(widgetSystemGroups());
	$("#fmjs-groups-content").append(widgetCustomGroups());

	if (called_groups == false ) {
		called_groups = true;
	} else {
		//$(".fmjs-to-listview").listview().removeClass("fmjs-to-listview");
		//$(".fmjs-to-button").button().removeClass("fmjs-to-button");
		$("#page-groups").trigger("create");
	}	
	
	$.mobile.changePage("#page-groups", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;
}

function markFeedAsFav() {
	var id = $("#fmjs-feed-content").data("fmjs-feed-id");

	if ( _.contains(fav_feeds, id) ) {
		// should be removed
		fav_feeds = _.without(fav_feeds, id);
		$.jStorage.set("fmjs-fav-feeds", _.compact(fav_feeds));
		$("#fmjs-feed-favmarker").html("Mark feed as favourite");
		
	} else {
		fav_feeds.push(id);
		$.jStorage.set("fmjs-fav-feeds", _.compact(fav_feeds));
		$("#fmjs-feed-favmarker").html("Remove feed from favourites");
	}

	return false;
}

function markGroupAsFav() {
	var id = $("#fmjs-group-content").data("fmjs-current-group-id");

	if ( _.contains(fav_groups, id) ) {
		// should be removed
		fav_groups = _.without(fav_groups, id);
		$.jStorage.set("fmjs-fav-groups", _.compact(fav_groups));
		$("#fmjs-group-favmarker").html("Mark group as favourite");
		
	} else {
		fav_groups.push(id);
		$.jStorage.set("fmjs-fav-groups", _.compact(fav_groups));
		$("#fmjs-group-favmarker").html("Remove group from favourites");
	}
	return false;
}

function countUnreadInGroup(id) {
	var group = _.findWhere(groups, {id: id});
	var ids_to_show = _.findWhere(feeds_groups, {group_id: id});
	
	count_feeds_to_show = ids_to_show.feed_ids.split(",");
	count_feeds_for_group = [];
	$.each(count_feeds_to_show, function(index, value) {
		count_feeds_for_group.push(parseInt(value, 10));
	});

	count_group_item_counter = 0;
	$.each(items, function(index, value) {
		if ( $.inArray(value.feed_id, count_feeds_for_group ) !== -1 && value.is_read == 0 ) {
			count_group_item_counter++;
		}
	});
	return count_group_item_counter;
}

function showEditHomescreen() {

	widget_place_options = '<option value="widgetEmpty">None</option>';
	defined_widgets = _.sortBy(defined_widgets, "title");
	$.each(defined_widgets, function(index, value) {
		widget_place_options += '<option value="'+value.fnc+'">'+value.title+'</option>';
	});
	
	$.each(widget_places, function(index, value) {
		var field_name = 'fmjs-edit-homescreen-' + value;
		var field = '<div data-role="fieldcontain">';
		
		field += '<label for="'+field_name+'-select">Widget&nbsp;'+value.toUpperCase()+':</label><br>';  
		field += '<select data-native-menu="true" name="'+field_name+'" id="'+field_name+'-select">';
		field += widget_place_options;
		field += '</select>';
		field += '</div>';
		
		$("#fmjs-edit-widget-place-"+value).html(field);
	});
	
	/* Now set selects to their current values... */
	// $('#fmjs-setting-empty-groups').filter('[value="'+show_empty_groups+'"]').prop('checked', true);
	$.each(widgets, function (index, value) {
		$('#fmjs-edit-widget-place-'+value.place+ ' option').filter('[value="'+value.fnc+'"]').prop('selected', true);
	});
	
	if (called_edit_homescreen == false ) {
		called_edit_homescreen = true;
	} else {
		$("#page-edit-homescreen").trigger("create");
	}	
	
	$.mobile.changePage("#page-edit-homescreen", {transition: transition});
	//$.mobile.silentScroll(0);
	return false;
}

function saveHomescreen() {
	widgets = [];
	$.each(widget_places, function(index, value) {
		var field_name = 'fmjs-edit-homescreen-' + value;
		//$('input[name=fmjs-setting-transitions]:checked').val();
		var func = $("#"+field_name+"-select option:selected").val();
		var this_widget = { place: value, fnc: func, options: {} };
		widgets.push(this_widget);
	});
	$.jStorage.set("fmjs-widgets", widgets);
	showHome();

}
