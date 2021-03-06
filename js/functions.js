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

function now() {
	// from: http://stackoverflow.com/questions/221294/how-do-you-get-a-timestamp-in-javascript
	return Math.round(+new Date() / 1000);
}

function dbgMsg(msg) {
	//console.log(msg);
	return true;
}
function checkpoint(msg) {
	//console.log('Checkpoint: ' + msg);
	return true;
}

function escapeString(str) {
	
	str = _.escape(str);
	
	str = str.split('&amp;amp;').join('&amp;');
	str = str.split('&amp;quot;').join('&quot;');
	str = str.split('&amp;rsquo;').join('&rsquo;');
	str = str.split('&amp;lsquo;').join('&lsquo;');
	str = str.split('&amp;lsaquo;').join('&lsaquo;');
	str = str.split('&amp;rsaquo;').join('&rsaquo;');
	str = str.split('&amp;laquo;').join('&laquo;');
	str = str.split('&amp;raquo;').join('&raquo;');
	str = str.split('&amp;euro;').join('&euro;');
	str = str.split('&amp;nbsp;').join('&nbsp;');
	str = str.split('&amp;shy;').join('&shy;');
	
	return str;
}



function getNumber(val) {
	var str_type = $.type(val);
	if (str_type === "number") {
		return val;
	}
	if (str_type === "string") {
		return parseInt(val, 10);
	}
}

function getBool(what) {

	switch(what) {
		case true:
		case "true":
		case "on":
		case "ja":
		case "yes":
			return true;
		break;
		default:
			return false;
	}
}

function getString(val) {
	var str_type = $.type(val);
    
	if (str_type === "number") {
		return val.toString();
	}
	if (str_type === "string") {
		return val;
	}
	
	return '';
}

function sortHelper(a, b) {
	var str_a = a.title.toLowerCase(), str_b = b.title.toLowerCase();
    
	if (str_a < str_b) {
		return -1;
	}
	if (str_a > str_b) {
		return 1;
	}
	return 0;
}

function renderDate(how, timestamp) {
	var now  = new Date(), date = new Date(timestamp * 1000), month = date.getMonth() + 1, minutes = date.getMinutes();
    
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	
	if (how === "long") {
		return date.getDate() + '.' + month + '.' + date.getFullYear() + ' @ ' + date.getHours() + ':' + minutes;
	}
	
	if (how === "date") {
		return date.getDate() + '.' + month + '.' + date.getFullYear();
	}
	
	if (how === "time") {
		return date.getHours() + ':' + minutes;
	}
	
	if (how === "relative-date") {
		return '';
	}

	if (how === "relative-time") {
		return '';
	}
}

function getCurrentPageID() {
	return $(":mobile-pagecontainer").pagecontainer("getActivePage").attr("id");
}

function exportSettings() {}

function importSettings() {}