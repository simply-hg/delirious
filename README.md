fever-js
========

This project aims to create a Javascript client for the feed reader [Fever](http://www.feedafever.com/) by Shaun Inman. It is started, because a mobile interface is not coming to Android any time soon. While there is [Meltdown](https://github.com/phubbard/Meltdown), an excellent client on Android, it currently does not show Hot items. And what about all those other plattforms like Windows Phone, BB10, Firefox OS? If this project gets it right, they all benefit from a nice and usable fever-client.

This is a working prototype. This code currently has several major flaws and I hope to find help within the community to fix them.

My code currently uses jQuery Mobile, undescore.js and some jQuery plugins.

How to run it
=============

- Upload app.html, app.js and app.css from this repository into a directory on the domain you are running fever from.
- add jstorage.min.js from https://github.com/andris9/jStorage to your directory
- add md5.js from http://www.webtoolkit.info/javascript-md5.html to your directory
- find a nice looking generic rss-icon in the size of 16x16 pixel and upload it as feed-icon-generic.png to your directory.

Please note: I intend to add all these required files into a nice package, but currently do not have time for it. I'm not sure about the redistribution rights either. All files offered in this repository are considered open source, license details are to follow.

Call app.html on your server. You should now see a dialog screen, which leads you to your settings. There you can fill in your server and user credentials. Upon saving you are redirected to home base of this web app. To show favicons please return to settings screen and refresh favicons. They are cached and survive a restart of the app. 

fever-js has to load a good amount of data (unread items) from your server. This is happening in chunks, but leads to the phenomenon that not all items are available at first. Depending on how many items are being loaded you will have to wait some moments before all items are shown in your groups. Hot link items get loaded seperately and on demand. Due to restriction of the [Fever API](http://www.feedafever.com/api), we have to load at least all unread items.

You should now see your custom groups. As Hot-Item-View was my priority, this view is working quite well. It shows you hot items with their respective links. You can adjust the range of your hot links and you can also load more. Items that are also in your Fever database do show a bit more of their content. You can see unread items in your group and you can mark a whole group as read.

Of course the usual warnings apply: This software comes with no guarantees. It might fry your phone, server and everything else. Please report any bugs you encounter. I add this as well: Fevers very own api should take care of user authentification and not return anything, when an unauthorised user tries to access your content. Newer versions of my prototype check for it as well. An attacker might still be able to find a security breach, so be careful when using this app.

Todo and feature list
=====================

- [X] Show items in feed groups
- [X] Show Hot items
- [X] Show saved items
- [X] Show a single item
- [X] Show Favicons
- [X] Show unread items of a single feed.
- [X] Show more info on local hot links
- [X] Links look ugly. Somewhat fixed.
- [X] Implement a login workflow, i.e. alert when user is not logged in and stuff. Partly finished.
- [ ] Implement a smart cache for items. Started on this, but there is a long road ahead.
- [X] Mark single items as read when you open them
- [X] Mark all items in a feed as read
- [X] Mark links to a hot item as read (this feature is not found in other clients I am aware of, but I need it :D )
- [X] Load more hot links
- [X] Support range and offset when loading hot items.
