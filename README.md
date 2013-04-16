# TourServer

A server for creating and serving GPS-based, media-enhanced walking tours. PostGIS instance required.

Current REST API endpoints (GET, POST, and DELETE supported for all so far). Intended to return JSON. When a single item is requested, all containing objects are also returned in the item's object:

`/tours` - Tours. The container for all other objects. Includes a LINESTRING of the path of the tour. Contains one or more interest_points.

`/interest_points` - Points of Interest. Locations, marked with a lat/long. Contains one or more interp_items.

`/interp_items` - Interpretive Items. Items that can be described with one or more media items. Contains one or more media_items.

`/media_items` - Media Items. Text, audio, and video. Saved locally using Paperclip.

## Included API test page

`/public/api_demo.html` - Shows some basic canned use of the TourServer API

## Tour client

The current rough testing version of the tour creation client code is in public/newPOI.[html|js]. At the moment it's only likely to work in a PhoneGap mobile application. To create a mobile tour client, [create a PhoneGap project](http://docs.phonegap.com/en/2.6.0/guide_getting-started_index.md.html#Getting%20Started%20Guides) and link/copy newPOI.html into that project's www/index.html, and newPOI.js into www.

## Heroku/PostGIS setup

Heroku and RGeo have some trouble getting along. 

1) You need to make binaries for geos and Proj available to your Heroku app.
Follow setup instructions here:
[https://github.com/jcamenisch/heroku-buildpack-rgeo](https://github.com/jcamenisch/heroku-buildpack-rgeo).

2) `rake assets:precompile` seemed to be failing for a while before running `heroku labs:enable user-env-compile` to give it access to environment variables.

3) It seems the best way to set up a production/staging external PostGIS to use with Heroku is manually, since RGeo's setup doesn't work well without a postgres schema path, and Heroku mangles database.yml. So, once you have a Postgres 9.x/PostGIS 2.0 instance set up (and your Heroku DATABASE_URL environment variable set to point to your PostGIS instance--*make sure it starts with 'postgis' and not 'postgres'!*) and a user named "trackserver", run the following as a superuser:

As superuser:

`CREATE DATABASE trackserver;`

`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trackserver;`

`GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO trackserver;`

`ALTER VIEW public.geometry_columns OWNER TO trackserver;`

`ALTER VIEW public.geography_columns OWNER TO trackserver;`

`ALTER VIEW public.spatial_ref_sys OWNER TO trackserver;`

`ALTER TABLE public.spatial_ref_sys OWNER TO trackserver;`

