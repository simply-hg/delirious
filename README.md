fever-js
========

This is a Javascript client for the feed reader [Fever](http://www.feedafever.com/) by Shaun Inman. It is started, because a mobile interface is not coming to Android any time soon. While there is [Meltdown](https://github.com/phubbard/Meltdown), an excellent client on Android, it currently does not show Hot items. And what about all those other plattforms like Windows Phone, BB10, Firefox OS? If this project gets it right, they all benefit from a nice and usable fever-client.

My code uses [jQuery Mobile](http://www.jquerymobile.com/), [undescore.js](http://underscorejs.org/) and [jStorage](http://www.jstorage.info/). It hasn't been fully tested for browser compatibility. It works on Dolphin (with Jetpack), Chrome on Android and on the desktop version of Firefox.

How to run it
=============

- Download this repo as .zip file and unpack it on your server which runs your Fever° installation.

All files offered in this repository are considered open source and are licensed by MIT terms.

Fever-js: A small introduction
==============================

Call the directory you unpacked the files into with your browser. You should now see a dialog screen, which leads you to your settings. There you can fill in your server and user credentials. Save them and you will be forwarded to the homescreen. To show favicons please click the button refresh favicons. They are cached and survive a restart of the app. If fever-js does not show your groups or behaves strange, please reload it. Now everything should work fine. You can customize your homescreen and show different buttons or put content blocks to a different position.

fever-js has to load a good amount of data (unread items) from your server. Due to limitations of the [Fever API](http://www.feedafever.com/api), we have to load at least all unread items including their contents to do anything useful. This is happening in chunks, but leads to the phenomenon that not all items are available at first. Depending on how many items are being loaded you will have to wait some moments before all items are shown in your groups. Hot link items get loaded seperately and on demand. If you do have many saved items you have to load them seperately in the settings screen.

You should now see your custom groups. As Hot-Item-View was my priority, this view is working quite well. It shows you hot items with their respective links. You can adjust the range of your hot links and you can also load more. Items that are also in your Fever database do show a bit more of their content. You can see unread items in your groups and you can mark a whole group as read.

Of course the usual warnings apply: This software comes with no guarantees. It might fry your phone, server and anything else. Please report any bugs you encounter. I want add this as well: Fevers very own api should take care of user authentification and not return anything, when an unauthorised user tries to access your content. This is being checked for. An attacker might still be able to find a security breach, so be careful when using this app.

Feature list
=====================

- Show items in feed groups
- Show Hot items
- Show saved items
- Show Sparks (untested, because I don't use this group that much)
- Show a single item
- Show Favicons
- Show unread items of a single feed.
- Show more info on local hot links
- Implement a login workflow, i.e. alert when user is not logged in and stuff. Partly finished.
- Mark single items as read when you open them
- Mark all items in a feed or group as read
- Mark links to a hot item as read (this feature is not found in other clients I am aware of, but I wanted it :D )
- Load more hot links
- Support range and offset when loading hot items.
- Support Sharing of Articles to Facebook, Google+ and Twitter. You can also share any item by E-Mail.
