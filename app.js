var fm_key, fm_url, fm_user;
var state_auth = 0;
var groups = {};
var feeds = {};
var feeds_groups = {};

function start() {
  // Load Config, if any
	getSettings();
	// Check, if we have all the auth-data

	// test-auth
	$.post(fm_url + "?api", { api_key: fm_key }).done(function(data) {
		state_auth = data.auth;
	});
	
	
	// Get groups and build it
	$.post(fm_url + "?api&groups", { api_key: fm_key }).done(function(data) {
		if (data.auth != 1 ) {
			console.log("Auth-Error");
		}
		groups = data.groups;
		feeds_groups = data.feeds_groups;
		createGroups(data);	
	});
	$.post(fm_url + "?api&feeds", { api_key: fm_key }).done(function(data) {

		feeds = data.feeds;
	});
}

function createGroups(data) {	
	var sorted = new Array();
	
	$.each( data.groups, function(index, value) {
		var item = '<li data-theme="c" id="fmjs-group-'+value.id+'"><a href="javascript:showGroup('+value.id+')" data-transition="slide">'+ _.escape(value.title) +'</a></li>';
		$("#fmjs-groups").append(item);
	});
	
	$("#fmjs-groups").listview( "refresh" );
}



function getSettings() {
	if ( $.jStorage.storageAvailable() ) {
		fm_key  = $.jStorage.get("fmjs-key", "none");
		fm_url  = $.jStorage.get("fmjs-url", "none");
		fm_user = $.jStorage.get("fmjs-user", "none");
		
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
	url      = _.escape($("#fmjs-fever-url").val());
	user     = $("#fmjs-e-mail").val();
	password = $("#fmjs-password").val();

	if ( $.jStorage.storageAvailable() ) {
		$.jStorage.set("fmjs-url", url);
				
		if ( password != "" ) {
			key = MD5(user + ":" + password);
			$.jStorage.set("fmjs-user", user);
			$.jStorage.set("fmjs-key", key);
		}
		
	} else {
		return false
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
	$.post(fm_url + "?api&links&offset=0&range=1&page=1", { api_key: fm_key }).done(function(data) {
		if (data.auth != 1 ) {
			console.log("Auth-Error");
		}
		$.each(data.links, function(index, value) {
			var item = '';
			
			item += '<li data-role="list-divider"><h2>' + _.escape( value.temperature ) + ' <span style="color:red">°</span></h2></li>';
			item += '<li data-theme="c" id="fmjs-feed-' + _.escape(value.id)+'">';
			item += '<a href="'+value.url+'" target="_blank">'+_.escape(value.title)+'<p class="ui-li-aside"><strong>6:24</strong>PM</p></a></li>';
			$("#fmjs-hot").append(item);
		});	
		$("#fmjs-hot").listview( "refresh" );
	});
}

function showGroup(id) {}

function getItem(id) {

}

function showSingleItem(id) {
	$.post(fm_url + "?api&items&with_ids="+ _.escape(id), { api_key: fm_key }).done(function(data) {
		$("#fmjs-single-content").html(_.escape(data.html));
		$("#fmjs-single-title").html(_.escape(data.title));
		$("#fmjs-single-author").html(_.escape(data.author));
		$("#fmjs-single-url").attr("href",_.escape(data.url));
	});
}
