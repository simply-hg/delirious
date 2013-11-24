Delirious°
==========

Delirious° is a Javascript client for the feed reader [Fever](http://www.feedafever.com/) by Shaun Inman. It is started, because a mobile interface is not coming to Android any time soon. While there is [Meltdown](https://github.com/phubbard/Meltdown), an excellent native client on Android, it currently does not show Hot items. And what about all those other plattforms like Windows Phone, BB10, Firefox OS? If this project gets it right, they all benefit from a nice and usable fever-client for the mobile world. Delirious° is designed to run in any browser out there.

Delirious° is based on [jQuery Mobile](http://www.jquerymobile.com/), [undescore.js](http://underscorejs.org/) and [jStorage](http://www.jstorage.info/). It hasn't been fully tested for browser compatibility. It works on Dolphin (with Jetpack), Chrome on Android and on the desktop version of Firefox. There are still bugs but all in all I find it working quite ok - it hasn't been aggressively tested, though.

You may be interested in screenshots. You can find them on my personal site with [more information on Delirious°](http://simply-hg.de/fever-js).

How to download and run it
==========================

Download this repo as .zip file and unpack it on your server which runs your installation of Fever° installation. If possible, Delirious° should get its own directory. As far as I can tell, it needs to be on the same domain as your Fever° installation.

All files offered in this repository are considered open source and are licensed by MIT terms.

Delirious°: A small introduction
==============================

Call the directory you unpacked the files into with your browser. You should now see a dialog screen, which leads you to your settings. There you can fill in your server and user credentials. Save them and you will be forwarded to the homescreen. To show favicons please click the button refresh favicons. They are cached and survive a restart of the app. If Delirious° does not show your groups or behaves strange, please reload it. Now everything should work fine. You can customize your homescreen and show different buttons or put content blocks to a different position.

Delirious° has to load a good amount of data (unread items) from your server. Due to limitations of the [Fever API](http://www.feedafever.com/api), we have to load at least all unread items including their contents to do anything useful. Depending on how many items are being loaded you will have to wait some moments before all items are shown in your groups. Hot link items get loaded seperately and on demand.

You should now see your custom groups. Fever° signature feature, Hot items work very well ith Delirious°. It shows your hot items with their respective links. You can adjust the range of your hot links and you can also load more. Items that are also in your Fever° database do show a bit more of their content. You can see unread items in your groups and you can mark a whole group as read.

Of course the usual warnings apply: This software comes with no guarantees. It might fry your phone, server and anything else. Please report any bugs you encounter. I want add this as well: Fever°s very own API should take care of user authentification and not return anything, when an unauthorised user tries to access your content. This is being checked for. An attacker might still be able to find a security breach, so be careful when using this app.

Feature list
============

- Show items in feed groups
- Show Hot items
- Show saved items, which are stored locally for easy and fast access.
- Show Sparks (untested, because I don't use this group that much)
- Show a single item
- Show Favicons
- Show unread items of a single feed.
- Show more info on local hot links
- Mark all items in a feed or group as read
- Mark links to a hot item as read (this feature is not found in other clients I am aware of, but I wanted it :D )
- Support range and offset when loading hot items.
- Support Sharing of Articles to Facebook, Google+ and Twitter. You can also share any item by E-Mail.
- Customize Homescreen with several widgets.

Change log
==========

- Delirious° now uses jQuery 2.1 (still Beta), jQuery Mobile 1.4 (still RC) and underscore 1.5.2
- A bug is fixed caused by an empty group with no feeds
- Touch icons are now working (some bogus type error that was)
- Fixed Mark Kindling read behaviour.
- Fixed startup when a subpage was called - now shows home instead
- Several small improvements
