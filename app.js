var fm_key, fm_url, fm_user;
var groups = {};
var feeds = {};
var feeds_groups = {};
var favicons = {};
var items = [];
var called_group  = false;
var called_saved  = false;
var called_feed   = false;
var called_sparks = false;
var called_hot    = false;
var called_all_feeds = false;
var loading = 0;
var auth_success = false;

function start() {
	// Load Config, if any
	getSettings();
	// Check, if we have all the auth-data

	// test-auth
	$.post(fm_url + "?api", { api_key: fm_key }).done(function(data) {
		if ( checkAuth(data.auth) ) {
			auth_success = true;
			// Get groups and build them
			showHideLoader("start");
			$.post(fm_url + "?api&groups", { api_key: fm_key }).done(function(data) {
				showHideLoader("stop");
				if ( checkAuth(data.auth) ) {
					
					groups = _.sortBy(data.groups, "title");
					feeds_groups = data.feeds_groups;
					createGroups(false);
					$.post(fm_url + "?api&feeds", { api_key: fm_key }).done(function(data) {
						if ( checkAuth(data.auth) ) {
							feeds = _.sortBy(data.feeds, "title");
							refreshItems();
						}
					});
				}
			});

		}
			
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	
}

function refreshItems() {
	console.log("Refreshing items");
	showHideLoader("start");
	$.post(fm_url + "?api&unread_item_ids", { api_key: fm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			var ids = data.unread_item_ids.split(',');
			//console.log(ids);
			items = [];
			loadItems(ids);
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function loadItems(ids) {

	// Fever-API allows to get a maximum of 50 links per request, we need to split it, obviously
	//console.log(placeholder_ids.length);
	if ( ids.length > 20 ) {
		var first = _.first(ids, 20);
		var rest  = _.rest(ids, 20);
	} else {
		var first = ids;
		var rest = [];
	}
	var get_ids = first.join(",");
	showHideLoader("start");
	$.post(fm_url + "?api&items&with_ids="+ _.escape(get_ids), { api_key: fm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			$.each(data.items, function(index, value) {
				// Save each item in cache
				// value.group_id = getGroupID(value.feed_id);
				items.push(value);
			});
		}
	});
	
	if ( rest.length > 0 ) {
		//console.log(rest.length + " to go");
		loadItems(rest);
	} else {
		// finished
		//console.log(items);
		
	}
	
}
function getGroupID(feed_id) {
	return 0;
}

function createGroups(refresh) {	
	if ( refresh == true ) {
		showHideLoader("start");
		$.post(fm_url + "?api&groups", { api_key: fm_key }).done(function(data) {
			showHideLoader("stop");
			if ( checkAuth(data.auth) ) {
				groups = _.sortBy(data.groups, "title");
				feeds_groups = data.feeds_groups.split(",");
				createGroups(false);
			}
		}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	} else {
		$("#fmjs-groups").empty();
		$("#fmjs-groups").listview( "refresh" );
		$.each( groups, function(index, value) {
			var item = '<li data-theme="c" id="fmjs-group-'+value.id+'"><a href="#" onclick="showGroup('+value.id+');" data-transition="slide">'+ _.escape(value.title) +'</a></li>';
			$("#fmjs-groups").append(item);
		});
	
		$("#fmjs-groups").listview( "refresh" );
	}
}



function getSettings() {
	if ( $.jStorage.storageAvailable() ) {
		fm_key   = $.jStorage.get("fmjs-key", "none");
		fm_url   = $.jStorage.get("fmjs-url", "none");
		fm_user  = $.jStorage.get("fmjs-user", "none");
		favicons = $.jStorage.get("fmjs-favicons");
		
		if ( fm_url != "none" ) {
			$("#fmjs-fever-url").val(fm_url);
		}
		if ( fm_user != "none" ) {
			$("#fmjs-e-mail").val(fm_user);
		}
		
	} else {
		return false;
	}
}

function saveSettings() {
	var url, user, password;
	url      = $("#fmjs-fever-url").val();
	user     = $("#fmjs-e-mail").val();
	password = $("#fmjs-password").val();

	if ( $.jStorage.storageAvailable() ) {
		$.jStorage.set("fmjs-url", url);
				
		if ( password != "" ) {
			key = MD5(user + ":" + password);
			$.jStorage.set("fmjs-user", user);
			$.jStorage.set("fmjs-key", key);
		}
		console.log("Saved");
	} else {
		return false;
	}
	//$.mobile.changePage("#page-sparks");
	$.mobile.changePage("#page-home", {transition: "slide"});
	start();
}


function showSaved() {
	//$("#fmjs-saved-content").html("");
	//$("#fmjs-saved-content").listview();
	showHideLoader("start");
	$.post(fm_url + "?api&saved_item_ids", { api_key: fm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {

			$("#fmjs-saved-content").empty();
			$("#fmjs-saved-content").append('<ul id="fmjs-saved-view" data-role="listview" data-divider-theme="d" data-inset="true" data-filter="true"></ul>');
			
			//$("#fmjs-saved-content").listview("refresh");
			if ( data.saved_item_ids != "") {
				//console.log(data.saved_item_ids);
				showHideLoader("start");
				$.post(fm_url + "?api&items&with_ids=" + data.saved_item_ids, { api_key: fm_key }).done(function(data) {
					showHideLoader("stop");
					if ( checkAuth(data.auth) ) {
						var sorted = _.sortBy(data.items, "created_on_time");
						$.each(sorted, function(index, value) {
							if ( value.is_saved == "1" ) {
								var item = "";
								item += '<li data-theme="c"><p>';
								
								var feedname = _.findWhere(feeds, {id: value.feed_id});
								var favicon = _.findWhere(favicons, {id: feedname.favicon_id});
								if (favicon != 1 ) {
									item += '<img src="data:'+favicon.data+'" height="16" width="16" class="fmjs-favicon"/>';
								}  else {
									item += '<img src="feed-icon-generic.png" height="16" width="16" class="fmjs-favicon"/>';
								}
								
								item += '<a href="#" class="fmjs-hot-links" onclick="showSingleItem('+value.id+')">' + value.title + '</a>';
								item += ' by <a href="#" class="fmjs-hot-links" onclick="showFeed('+value.feed_id+');">'+feedname.title+'</a></p>';
								item += '</li>';
								$("#fmjs-saved-view").append(item);
							}
						});
				
						//$("#fmjs-saved-content").listview("refresh");
						if (called_saved == false ) {
							called_saved = true;
						} else {
							$("#fmjs-saved-view").listview();
						}
						//$.mobile.changePage("#page-sparks");
						$.mobile.changePage("#page-saved", {transition: "slide"});
					}
				}).fail(function(){ showHideLoader("stop"); checkAuth(0); });

			}
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function showHot(page) {
	//console.log("Requested hot page: "+page);
	if ( page == 1 ) {
		// First page has been called, so do a complete refresh
		$("#fmjs-hot-content").empty();
		$("#fmjs-hot-more").attr("onclick", "showHot(2)");
	} else {
		// another page has been called, so let's append a new one
		var next_page = page;
		next_page++;
		$("#fmjs-hot-more").attr("onclick", "showHot("+next_page+")");
	}
	
	// Set range and offset
	
	var range  = $("#fmjs-hot-range :selected").attr("value");
	var offset = $("#fmjs-hot-offset :selected").attr("value");
	
	//console.log("Range: "+range);
	//console.log("Offset: "+offset);
	showHideLoader("start");
	$.post(fm_url + "?api&links&offset="+offset+"&range="+range+"&page="+page, { api_key: fm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
		
			load_ids = '';
			//$("#fmjs-hot-content").html("");
			$.each(data.links, function(index, value) {
				//console.log("Link: "+value.id);
				var item = '';
				var id_list = '';
				load_ids += value.item_ids + ',';
				item += '<div>';
				item += '<h2>';
				item += _.escape( value.temperature ) + '<span style="color:red">°</span>&nbsp;';
				if (value.is_local == 1 && value.is_item == 1) {
					load_ids += value.item_id + ",";
					item += '<a href="#" class="fmjs-link-'+value.item_id+' fmjs-hot-links" onclick="showSingleItem('+value.item_id+');">'+_.escape(value.title)+'</a>';
				} else {
					item += '<a href="'+value.url+'" class="fmjs-hot-links" target="_blank">'+_.escape(value.title)+'</a>';
				}
				
				item += '</h2>';
			
				if (value.is_local == 1 && value.is_item == 1) {
					// Add local stuff here, like excerpt an feed name.
					// We'll add that later for now.
					// Special aspect here: We might add a link to fever mobile single item view
					// Not tricky, but ui should be ok for that
					console.log("Local item");
					
					item +='<p style="max-height:2.5em;overflow:hidden;" class="fmjs-link-'+value.item_id+'-content"></p>';
					item += '<p style="text-align:right;">posted by <img src="feed-icon-generic.png" height="16" width="16" alt="Feed-Icon" class="fmjs-link-'+value.item_id+'-favicon fmjs-favicon"/> <span class="fmjs-link-'+value.item_id+'-feedname fmjs-hot-links">Feed</span></p><p style="text-align:right;"><a href="'+value.url+'" target="_blank" data-role="button" data-theme="b" data-inline="true" data-mini="true" class="fmjs-hot-to-button" data-icon="grid">Open URL</a> <a href="#" onclick="saveItem('+value.item_id+');" target="_blank" data-role="button" data-icon="star" data-theme="b" data-inline="true" data-mini="true" class="fmjs-hot-to-button">Save</a></p>';
				}
			
				// Now we show a list of all those items, linking to this hot item...
				//item += '<p>' + value.item_ids+'</p>'; // we remove this line later
				item += '<ul data-role="listview" data-divider-theme="d" data-inset="true" id="fmjs-hot-content-link-'+value.id+'" class="fmjs-hot-linkbox fmjs-to-listview">';
				//console.log(value.item_ids);
				var links = value.item_ids.split(',');
				for (var i=0, link_id; link_id=links[i]; i++) {
					// item is "some", then "example", then "array"
					// i is the index of item in the array
					item += '<li><p><img src="feed-icon-generic.png" height="16" width="16" alt="Feed-Icon" class="fmjs-link-'+link_id+'-favicon fmjs-favicon"/><a href="#" class="fmjs-link-'+link_id+' fmjs-hot-links" onclick="showSingleItem('+link_id+');"><span class="fmjs-link-'+link_id+'-title fmjs-hot-links">Link: '+link_id+'</span></a> by <span class="fmjs-link-'+link_id+'-feedname fmjs-hot-links">Feed</span></p></li>';
					id_list += link_id + ",";
				}	
				item += '</ul>';
				//
				item += '<div style="text-align:right"><a href="#" data-role="button" onclick="markItemsRead(\''+id_list+'\');" data-theme="b" data-inline="true" data-mini="true" class="fmjs-hot-to-button" data-icon="check">Mark Links as read</a></div>';
				//
				item += '</div>';
				$("#fmjs-hot-content").append(item);

				$(".fmjs-hot-to-button").button();
				//$("#fmjs-hot-content-link-"+value.id).listview();
				
			});	

			var ids_to_get = load_ids.split(',');
			//console.log(ids_to_get.length);
			ids_to_get = _.uniq(ids_to_get);
			//console.log(ids_to_get.length);
			
			fillLinkPlaceholder(ids_to_get, 'link' );
			if ( page == 1) {
				if ( called_hot == false ) {
					called_hot = true;
				} else {
					$(".fmjs-to-listview").listview().removeClass("fmjs-to-listview");
				}
				//$.mobile.changePage("#page-sparks");
				$.mobile.changePage("#page-hot", {transition: "slide"});
			} else {
				$(".fmjs-to-listview").listview().removeClass("fmjs-to-listview");
			}
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function fillLinkPlaceholder(placeholder_ids, class_prefix) {
	// Fever-API allows to get a maximum of 50 links per request, we need to split it, obviously
	//console.log(placeholder_ids.length);
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
				$(".fmjs-"+class_prefix+"-"+value.id+"-title").html(_.escape(value.title));
				if ( value.is_read == 0 ) {
					$(".fmjs-"+class_prefix+"-"+value.id+"-title").addClass("fmjs-item-is-unread");
				}
				$(".fmjs-"+class_prefix+"-"+value.id+"-content").html(_.escape(value.html));
				//$("#fmjs-link-"+link_id).attr("href",_.escape(data.url));
				var feedname = _.findWhere(feeds, {id: value.feed_id});
				//items.push(value);
				$(".fmjs-"+class_prefix+"-"+value.id+"-feedname").html('<a href="#" onclick="showFeed('+$.trim(feedname.id)+');">'+_.escape(feedname.title)+'</a>');
				//var feedname = _.findWhere(feeds, {id: value.feed_id});
				var favicon = _.findWhere(favicons, {id: feedname.favicon_id});
				if (favicon != 1 ) {
					$(".fmjs-"+class_prefix+"-"+value.id+"-favicon").attr("src", "data:"+favicon.data);
				}  else {
					item += '<img src="feed-icon-generic.png" height="16" width="16" class="fmjs-favicon"/>';
				}

			});
		
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	
	if ( rest.length > 0 ) {
		fillLinkPlaceholder(rest, class_prefix);
	}
}

function showGroup(id) {
	//var entries = _.where(items, {feed_id: id});
	//console.log(items);
	$("#fmjs-group-content").removeData("fmjs-current-ids");
	$("#fmjs-group-content").empty();
	$("#fmjs-group-content").append('<ul data-role="listview" data-divider-theme="d" data-inset="true" data-filter="true" id="fmjs-group-view"></ul>');

	var group = _.findWhere(groups, {id: id});
	$("#fmjs-group-header").html(group.title);
	//var feeds_to_show = feeds_groups;
	//console.log(feeds_to_show);
	var ids_to_show = _.where(feeds_groups, {group_id: id});
	
	feeds_to_show = ids_to_show[0].feed_ids.split(",");
	feeds_for_group = [];
	$.each(feeds_to_show, function(index, value) {
		feeds_for_group.push(parseInt(value, 10));
	});
	//console.log(feeds_for_group);
	//console.log(feeds_to_show);
	//console.log(items);
	item_ids_in_group = '';
	$.each(items, function(index, value) {
		if ( $.inArray(value.feed_id, feeds_for_group ) !== -1 && value.is_read == 0 ) {
			//console.log(feeds_to_show);
			//console.log(index+' '+value.feed_id);
			var item = "";
			item += '<li data-theme="c"><p>';
			
			var feed = _.findWhere(feeds, {id: value.feed_id});
			var favicon_id = feed.favicon_id;
			var favicon = _.findWhere(favicons, {id: favicon_id});
			if ( favicon.id != 1) {
				//console.log(favicon);
				item += '<img src="data:'+favicon.data+'" height="16" width="16" class="fmjs-favicon"/>';
			} else {
				item += '<img src="feed-icon-generic.png" height="16" width="16" class="fmjs-favicon"/>';
			}

			item += '<strong><a href="#" onclick="showSingleItem('+value.id+')" class="fmjs-hot-links">' + value.title + '</a></strong>';
			item += ' by <a href="#" onclick="showFeed('+feed.id+');" class="fmjs-hot-links">'+feed.title+'</a>';
			item += '</p></li>';
			item_ids_in_group += value.id +",";
			$("#fmjs-group-view").append(item);
		}
	});
	$("#fmjs-group-content").data("fmjs-current-ids", item_ids_in_group);
	if (called_group == false ) {
		called_group = true;
	} else {
		$("#fmjs-group-view").listview();
	}
	//$.mobile.changePage("#page-sparks");
	$.mobile.changePage("#page-group", {transition: "slide"});//("#fmjs-group").listview("refresh");

}

function markGroupAsRead() {
	var data = $("#fmjs-group-content").data("fmjs-current-ids");
	$("#fmjs-group-content").removeData("fmjs-current-ids");
	console.log(data);
	markItemsRead(data);
	//$.mobile.changePage("#page-sparks");
	$.mobile.changePage("#page-home", {transition: "slide"});
}

function showFeed(id) {
	//$("#fmjs-feed-view").listview();
	$("#fmjs-feed-content").empty();
	$("#fmjs-feed-content").append('<ul data-divider-theme="d" data-inset="true" data-filter="true" id="fmjs-feed-view" data-role="listview"></ul>');
	
	var feed_info = _.findWhere(feeds, {id: id});
	
	//console.log(items);
	$("#fmjs-feed-header").html(feed_info.title);
	
	//$("#fmjs-feed-content").append('');
		
	var items_to_show = _.where(items, {feed_id: id});
	//console.log(items_to_show);
	$.each(items_to_show, function(index, value) {
		//console.log(value.feed_id);
		if ( value.is_read == "0" ) {
			var item = "";
			item += '<li data-theme="c"><p>';
			
			var feed = _.findWhere(feeds, {id: value.feed_id});
			var favicon = _.findWhere(favicons, {id: feed.favicon_id});
			
			if ( favicon.id != 1) {
				//console.log(favicon);
				item += '<img src="data:'+favicon.data+'" height="16" width="16" class="fmjs-favicon"/>';
			} else {
				item += '<img src="feed-icon-generic.png" height="16" width="16" class="fmjs-favicon"/>';
			}
				
			item += '<a href="#" class="fmjs-hot-links" onclick="showSingleItem('+value.id+');">' + value.title + '</a>';
			item += '</p></li>';
			$("#fmjs-feed-view").append(item);
		}
	});
	if (called_feed == false ) {
		called_feed = true;
	} else {
		$("#fmjs-feed-view").listview();
	}
	//$("#fmjs-feed-view").listview("refresh");
	//$.mobile.changePage("#page-sparks");
	$.mobile.changePage("#page-feed", {transition: "slide"});
}


function refreshFavicons() {
	showHideLoader("start");
	$.post(fm_url + "?api&favicons", { api_key: fm_key }).done(function(data) {
		showHideLoader("stop");
		if ( checkAuth(data.auth) ) {
			favicons = data.favicons;
			$.jStorage.set("fmjs-favicons", favicons);
			console.log("Favicons refreshed");
		}
	}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
}

function showSingleItem(id) {
	var item = _.findWhere(items, {id: id});
	console.log(item);
	if ( item ) {
		console.log("cache hit");
		renderSingleItem(item);
	} else {
		showHideLoader("start");
		$.post(fm_url + "?api&items&with_ids="+ _.escape(id), { api_key: fm_key }).done(function(data) {
			showHideLoader("stop");
			if ( checkAuth(data.auth) ) {
				renderSingleItem(data.items[0]);
			}
		}).fail(function(){ showHideLoader("stop"); checkAuth(0); });
	}
}
function saveCurrentItem() {
	var id = $("#fmjs-single-content").data("fmjs-single-item-current");
	saveItem(id);
}
function renderSingleItem(data) {
	$("#fmjs-single-content").html(data.html);
	$("#fmjs-single-content").data("fmjs-single-item-current", data.id);
	$("#fmjs-single-title").html(_.escape(data.title));
	//$("#fmjs-single-author").html(_.escape(data.author));
	$("#fmjs-single-url").attr("href", data.url);
	var meta = '';
	if (data.author) {
		meta += 'by ' + data.author + ' ';
	}
	meta += 'on ' + renderDate("long", data.created_on_time);
	$("#fmjs-single-meta").html(_.escape(meta));
	var feedname = _.findWhere(feeds, {id: data.feed_id});
	//console.log(feedname[0].favicon_id);
	$("#fmjs-feed-title").html(_.escape(feedname.title));


	var favicon = _.findWhere(favicons, {id: feedname.favicon_id});
	if ( favicon.id != 1) {
		//console.log(favicon);
		favicon_img = '<img src="data:'+favicon.data+'" height="16" width="16" class="fmjs-favicon"/>';
	} else {
		favicon_img = '<img src="feed-icon-generic.png" height="16" width="16" class="fmjs-favicon"/>';
	}
			
	$("#fmjs-single-feedname").html(favicon_img + _.escape(feedname.title));
	$("#fmjs-single-feedname").attr("onclick", "showFeed("+data.feed_id+");");
	console.log(data.id);
	markItemsRead(data.id.toString());
	//$.mobile.changePage("#page-sparks");
	$.mobile.changePage("#page-single", {transition: "slide"});
}

function renderDate(how, timestamp) {
	if ( how == "long") {
		var date = new Date(timestamp*1000);
		var month =  date.getMonth();
		month++;
		var minutes = date.getMinutes();
		if (minutes < 10 ) {
			minutes = "0"+minutes;
		}
		var return_date = date.getDate() + '.' + month + '.' + date.getFullYear() + ' @ ' + date.getHours()+ ':' + minutes;
		return return_date;
	}
}

function markItemsRead(ids) {
	if ( _.isArray(ids) ) {
		// An array of ids
		ids_to_mark_read = ids;
	} else {
		// a comma seperated string
		ids_to_mark_read = ids.split(",");
		//console.log(ids_split);
	}
	console.log(ids_to_mark_read);
	items = _.reject(items, function(item) {
	
		if ( $.inArray(item.id.toString(), ids_to_mark_read ) == -1 )  {
			return false;
		} else {
			console.log("reject");
			return true;
		}
	});
	
	
	$.each(ids_to_mark_read, function(index, value) {
		markItemRead(value);
	});	

}

function markItemRead(id) {
	if ( $.trim(id) != "") {
		$.post(fm_url + "?api", { api_key: fm_key, mark: "item", as: "read", id: $.trim(_.escape(id))  }).done(function(data) {
			if ( checkAuth(data.auth) ) {
				console.log("Marked as read");
			}
		}).fail(function(){ checkAuth(0); });
	}
}

function saveItem(id) {
	if ( $.trim(id) != "") {
		$.post(fm_url + "?api", { api_key: fm_key, mark: "item", as: "saved", id: $.trim(_.escape(id))  }).done(function(data) {
			if ( checkAuth(data.auth) ) {
				console.log("Saved item on server.");
			}
		}).fail(function(){ checkAuth(0); });
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
			console.log("Probably stopped or network issue.");
		} else {
			console.log("Forbidden");
			alert("Please check your Login-credentials. This could also mean, that your internet connection is lost. Or maybe you stopped loading a page.");	

			$.mobile.changePage("#page-settings", {transition: "slide"});
			return false;		
		}

	}
}

function showSparks() {
	//var entries = _.where(items, {feed_id: id});
	//console.log(items);
	//$("#fmjs-group").removeData("fmjs-current-ids");
	$("fmjs-sparks-content").empty();
	$("fmjs-sparks-content").append('<ul data-role="listview" data-divider-theme="d" data-inset="true" id="fmjs-sparks-view"></ul>');
	
	//var group = _.where(groups, {id: id});
	//$("#fmjs-group-header").html(group[0].title);
	//var feeds_to_show = feeds_groups;
	//console.log(feeds_to_show);
	var spark_feeds = _.where(feeds, {is_spark: 1});
	
	//feeds_to_show = ids_to_show[0].feed_ids.split(",");
	feeds_for_sparks = [];
	$.each(spark_feeds, function(index, value) {
		feeds_for_sparks.push(parseInt(value.id, 10));
	});
	//console.log(feeds_for_group);
	//console.log(feeds_to_show);
	//console.log(items);
	item_ids_in_sparks = '';
	$.each(items, function(index, value) {
		if ( $.inArray(value.feed_id, feeds_for_sparks ) !== -1 && value.is_read == 0 ) {
			//console.log(feeds_to_show);
			//console.log(index+' '+value.feed_id);
			var item = "";
			item += '<li data-theme="c"><p>';
			
			var feed = _.findWhere(feeds, {id: value.feed_id});
			var favicon_id = feed.favicon_id;
			var favicon = _.findWhere(favicons, {id: favicon_id});
			if ( favicon.id != 1) {
				//console.log(favicon);
				item += '<img src="data:'+favicon.data+'" height="16" width="16" class="fmjs-favicon"/>';
			} else {
				item += '<img src="feed-icon-generic.png" height="16" width="16" class="fmjs-favicon"/>';
			}

			item += '<strong><a href="#" onclick="showSingleItem('+value.id+')" class="fmjs-hot-links">' + value.title + '</a></strong>';
			item += '</p></li>';
			item_ids_in_sparks += value.id +",";
			$("#fmjs-sparks-view").append(item);
		}
	});
	$("#fmjs-group").data("fmjs-current-ids", item_ids_in_sparks);
	if (called_sparks == false ) {
		called_sparks = true;
	} else {
		$("#fmjs-sparks-view").listview();
	}
	$.mobile.changePage("#page-sparks", {transition: "slide"});

}

function logout() {
	$.jStorage.deleteKey("fmjs-key");
	$.jStorage.deleteKey("fmjs-url");
	$.jStorage.deleteKey("fmjs-user");
	$.jStorage.deleteKey("fmjs-favicons");
	fm_key   = '';
	fm_url   = '';
	fm_user  = '';
	favicons = '';
	start();
}

function showAllFeeds() {
	$("#fmjs-all-feeds-content").empty();
	$("#fmjs-all-feeds-content").append('<ul data-role="listview" data-divider-theme="d" data-inset="true" data-filter="true" id="fmjs-all-feeds-view"></ul>');
	
	$.each(feeds, function(index, value){
		//console.log(value);
		var item = '';
		item += '<li>';
		item += '<a href="showFeed('+value.id+')">';
			var favicon = _.findWhere(favicons, {id: value.favicon_id});
			if ( favicon.id != 1) {
				//console.log(favicon);
				item += '<img src="data:'+favicon.data+'" height="16" width="16"  class="ui-li-icon ui-corner-none"/>';
			} else {
				item += '<img src="feed-icon-generic.png" height="16" width="16"  class="ui-li-icon ui-corner-none"/>';
			}
		
		item += value.title+'</a>';
		item += '</li>';

		$("#fmjs-all-feeds-view").append(item);
		
	});
	
	if (called_all_feeds == false ) {
		called_all_feeds = true;
	} else {
		$("#fmjs-all-feeds-view").listview();
	}
	//$.mobile.changePage("#page-sparks");
	$.mobile.changePage("#page-all-feeds", {transition: "slide"});
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
			text: "Loading",
			textVisible: true,
			theme: "b",
		});
	}
}
