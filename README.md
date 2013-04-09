# TourServer

A server for creating and serving GPS-based, media-enhanced walking tours.

Current REST API endpoints (GET, POST, and DELETE supported for all so far). Intended to return JSON. When a single item is requested, all containing objects are also returned in the item's object:

`/tours` - Tours. The container for all other objects. Includes a LINESTRING of the path of the tour. Contains one or more interest_points.

`/interest_points` - Points of Interest. Locations, marked with a lat/long. Contains one or more interp_items.

`/interp_items` - Interpretive Items. Items that can be described with one or more media items. Contains one or more media_items.

`/media_items` - Media Items. Text, audio, and video. Saved locally using Paperclip.