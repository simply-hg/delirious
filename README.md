fever-js
========

This project aims to create a Javascript client for the feed reader Fever by Shaun Inman. It is started, because a mobile interface is not coming to Android any time soon. While there is Meltdown, an excellent Client on Android, it currently does not show Hot items. And what about all those other plattforms like Windows Phone, BB10, Firefox OS? If this project gets it right, they all benefit from a nice and usable fever-client.

This is a working prototype. This code currently has several major flaws and I hope to find help within the community to fix them.

My code currently uses jQuery Mobile, undescore.js and some jQuery plugins.

How to run it
=============

- Upload app.html and app.js into a directory on the domain you are running fever from.
- add jstorage.min.js from https://github.com/andris9/jStorage to your directory
- add md5.js from http://www.webtoolkit.info/javascript-md5.html to your directory

Call app.html on your server. Now check out the settings-screen. There you can fill in your server info, username and password. Save it. Now return to the home screen and reload (this is a rough prototype after all).

You should now see your custom groups. They currently do not show any items. As Hot-Item-View was my priority, this view is working to some extend. It shows you hot items with their respective links. Currently this view is hardcoded to show only the first page and only links from the current day. This can and will be fixed, so, let's say, this is a good start.

Of course the usual warnings apply: This software comes with no guarantees. It might fry your phone, server and everything else. Please report any bugs you encounter. I add this as well: While Fevers very own api should take care of user authentification and not return anything, when an unauthorised user tries to access your content, my protoype does not do very well in ensuring it. So, until this is fixed, use it with caution. Some tests without proper username and password didn't fire up any issues (the app just wasn't very useful), but as I said: This is a prototype so anything can happen.

Todo and feature list
===========

- [ ] Show items in feed groups
- [X] Show Hot items
- [X] Show saved items
- [X] Show a single item
- [ ] Show Favicons
- [ ] Show unread items of a feed. This works, but there is an optical glitch due to an odd behaviour of jquery mobile.
- [X] Links look ugly. Somewhat fixed.
- [ ] Implement a login workflow, i.e. alert when user is not logged in and stuff. Partly finished.
- [ ] Implement a smart cache for items.
- [X] Mark single items as read when you open them
- [ ] Mark all items in a feed as read
- [X] Mark links to a hot item as read (this feature is not found in other clients I am aware of, but I need it :D )
- [X] Load more hot links
- [X] Support range and offset when loading hot items.
