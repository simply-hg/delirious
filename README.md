fever-js
========

This project aims to create a Javascript client for the feed reader Fever by Shaun Inman. It is started, because a mobile interface is not coming to Android any time soon.

There is a working prototype. I will upload my code in the coming days. This code currently has several major flaws and I hope to find help within the community to fix them.

My code currently uses jQuery Mobile, undescore.js and some jQuery plugins.

How to run it
=============

- Upload app.html and app.js into a directory on the domain you are running fever from.
- add jstorage.min.js from https://github.com/andris9/jStorage to your directory
- add md5.js from http://www.webtoolkit.info/javascript-md5.html to your directory

Call app.html on your server. Now check out the settings-screen. There you can fill in your server info, username and password. Save it. Now return to the home screen and reload (this is a rough prototype after all).

You should now see your custom groups. They will be empty for the moment. The only part really working is the hot group. Check them out and enjoy.

Still to do
===========

- [ ] Show items in feed groups
- [X] Show saved items
- [ ] Show Favicons
- [X] Links look ugly. Somewhat fixed.
- [ ] Implement a login workflow, i.e. alert when user is not logged in and stuff.
- [ ] Implement a smart cache for items.
- [X] Mark single items as read when you open them
- [ ] Mark all items in feed as read
