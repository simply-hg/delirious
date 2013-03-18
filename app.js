var fm_key, fm_url, fm_user;
var state_auth = 0;
var groups = {};
var feeds = {};
var feeds_groups = {};
var favicons = {};

function start() {
	// Load Config, if any
	getSettings();
	// Check, if we have all the auth-data

	// test-auth
	$.post(fm_url + "?api", { api_key: fm_key }).done(function(data) {
		state_auth = data.auth;
		console.log("Login: " + data.auth);
	});
	
	
	// Get groups and build it
	$.post(fm_url + "?api&groups", { api_key: fm_key }).done(function(data) {
		if (data.auth != 1 ) {
			console.log("Auth-Error");
		}
		groups = _.sortBy(data.groups, "title");
		feeds_groups = data.feeds_groups;
		createGroups(false);	
	});
	
	$.post(fm_url + "?api&feeds", { api_key: fm_key }).done(function(data) {
		feeds = data.feeds;
	});
}

function createGroups(refresh) {	
	if ( refresh == true ) {
		$.post(fm_url + "?api&groups", { api_key: fm_key }).done(function(data) {
			if (data.auth != 1 ) {
				console.log("Auth-Error");
			}
			groups = _.sortBy(data.groups, "title");
			feeds_groups = data.feeds_groups;
			createGroups(false);	
		});
	} else {
		$.each( groups, function(index, value) {
			var item = '<li data-theme="c" id="fmjs-group-'+value.id+'"><a href="javascript:showGroup('+value.id+')" data-transition="slide">'+ _.escape(value.title) +'</a></li>';
			$("#fmjs-groups").append(item);
		});
	
		$("#fmjs-groups").listview( "refresh" );
	}
}



function getSettings() {
	if ( $.jStorage.storageAvailable() ) {
		fm_key  = $.jStorage.get("fmjs-key", "none");
		fm_url  = $.jStorage.get("fmjs-url", "none");
		fm_user = $.jStorage.get("fmjs-user", "none");
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
	return;
}

function refreshGroupSelector() {

}

function showSaved() {
	$.post(fm_url + "?api&saved_item_ids", { api_key: fm_key }).done(function(data) {
		if (data.auth != 1 ) {
			console.log("Auth-Error");
		}
		
		if ( data.saved_item_ids != "") {
			$.post(fm_url + "?api&items&withids=" + data.saved_item_ids, { api_key: fm_key }).done(function(data) {
				$.each(data.items);
			});
		}
	});
}

function showHot() {
	$.post(fm_url + "?api&links&offset=0&range=1", { api_key: fm_key }).done(function(data) {
		if (data.auth != 1 ) {
			console.log("Auth-Error");
		}
		load_ids = '';
		$.each(data.links, function(index, value) {
			console.log("Link: "+value.id);
			var item = '';
			load_ids += value.item_ids + ',';
			item += '<div>';
			item += '<h1>';
			item += _.escape( value.temperature ) + '<span style="color:red">°</span>&nbsp;';
			item += '<a href="'+value.url+'" target="_blank">'+_.escape(value.title)+'</a>';
			item += '</h1>';
			
			if (value.is_local == 1 ) {
				// Add local stuff here, like excerpt an feed name.
				// We'll add that later for now.
				// Special aspect here: We might add a link to fever mobile single item view
				// Not tricky, but ui should be ok for that
				console.log("Local item");
			}
			
			// Now we show a list of all those items, linking to this hot item...
			//item += '<p>' + value.item_ids+'</p>'; // we remove this line later
			item += '<ul data-role="listview" data-divider-theme="d" data-inset="true" id="fmjs-hot-content-link-'+value.id+'">';
			console.log(value.item_ids);
			var links = value.item_ids.split(',');
			for (var i=0, link_id; link_id=links[i]; i++) {
				// item is "some", then "example", then "array"
				// i is the index of item in the array
				item += '<li><p><a href="#page-single" class="fmjs-link-'+link_id+'" onclick="showSingleItem('+link_id+');"><span class="fmjs-link-'+link_id+'-title">Link: '+link_id+'</span></a> by <span class="fmjs-link-'+link_id+'-feedname">Feed</span></p></li>';
				
			}	
			item += '</ul>';
			//
			//
			item += '</div>';
			$("#fmjs-hot-content").append(item);
			$("#fmjs-hot-content-link-"+value.id).listview();
			
		});	
		
		
		var ids_to_get = load_ids.split(',');
		console.log(ids_to_get.length);
		ids_to_get = _.uniq(ids_to_get);
		console.log(ids_to_get.length);
		fillLinkPlaceholder(ids_to_get);
	});
}

function fillLinkPlaceholder(placeholder_ids) {
	// Fever-API allows to get a maximum of 50 links per request, we need to split it, obviously
	if ( placeholder_ids.length > 50 ) {
		var first = _.first(placeholder_ids, 50);
		var rest  = _.rest(placeholder_ids, 50);
	} else {
		var first = placeholder_ids;
		var rest = [];
	}
	var get_ids = placeholder_ids.join(",");
	$.post(fm_url + "?api&items&with_ids="+ _.escape(get_ids), { api_key: fm_key }).done(function(data) {
		$.each(data.items, function(index, value) {
			$(".fmjs-link-"+value.id+"-title").html(_.escape(value.title));
			//$("#fmjs-link-"+link_id).attr("href",_.escape(data.url));
			var feedname = _.where(feeds, {id: value.feed_id});
			console.log(feedname[0].favicon_id);
			$(".fmjs-link-"+value.id+"-feedname").html(_.escape(feedname[0].title));
		});

	});
	
	if ( rest.length > 0 ) {
		fillLinkPlaceholder(rest);
	}
}

function showGroup(id) {}

function getItem(id) {

}

function refreshFavicons() {
	$.post(fm_url + "?api&favicons", { api_key: fm_key }).done(function(data) {
		favicons = data.favicons;
		favicons = $.jStorage.set("fmjs-favicons", favicons);
		console.log("Favicons refreshed");
	});
}

function showSingleItem(id) {
	$.post(fm_url + "?api&items&with_ids="+ _.escape(id), { api_key: fm_key }).done(function(data) {
		console.log(data.items);
		$("#fmjs-single-content").html(data.items[0].html);
		$("#fmjs-single-title").html(_.escape(data.items[0].title));
		$("#fmjs-single-author").html(_.escape(data.items[0].author));
		$("#fmjs-single-url").attr("href", data.items[0].url);
		
		var feedname = _.where(feeds, {id: data.items[0].feed_id});
		console.log(feedname[0].favicon_id);
		$("#fmjs-feed-title").html(_.escape(feedname[0].title));
		$("#fmjs-single-feedname").html(_.escape(feedname[0].title));
		
	});
}
