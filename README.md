# TourServer

A server for creating and serving GPS-based, media-enhanced walking tours. PostGIS instance required. 

NOTE: This project is still in a very early stage of development. For info about general usability, contact danavery@codeforamerica.org.

Current REST API endpoints (GET, POST, and DELETE supported for all so far). Intended to return JSON. When a single item is requested, all containing objects are also returned in the item's object:

`/tours` - Tours. The container for all other objects. Includes a LINESTRING of the path of the tour. Contains one or more interest_points.

`/interest_points` - Points of Interest. Locations, marked with a lat/long. Contains one or more interp_items.

`/interp_items` - Interpretive Items. Items that can be described with one or more media items. Contains one or more media_items.

`/media_items` - Media Items. Text, audio, and video. Saved locally using Paperclip.

## Included API test page

`/public/api_demo.html` - Shows some basic canned use of the TourServer API

## Tour client

The current mobile track viewing/creation client code is in public/www. It will only work in a PhoneGap mobile application. To create a mobile tour client, [create a PhoneGap project](http://docs.phonegap.com/en/2.6.0/guide_getting-started_index.md.html#Getting%20Started%20Guides) and copy the public/www directory in place of the PhoneGap project www directory.

Future plans include a desktop-accessible track editing client.

## Heroku/PostGIS setup

Heroku and RGeo have some trouble getting along. 

1a) You need to make binaries for geos and Proj available to your Heroku app.
Follow setup instructions here:
[https://github.com/jcamenisch/heroku-buildpack-rgeo](https://github.com/jcamenisch/heroku-buildpack-rgeo).

1b) Include your S3 credentials in the heroku dev environment AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY, and AWS_BUCKET.

1c) (a) and (b), and other environment variables needs can be combined into one heroku command. For example: heroku config:set  --app {heroku_app_name} AWS_ACCESS_KEY_ID={...} AWS_BUCKET={...} AWS_SECRET_ACCESS_KEY={...} BUILDPACK_URL=http://github.com/jcamenisch/heroku-buildpack-rgeo.git DATABASE_URL=postgis://{dbuser}:{dbpassword}@{dbhost}:{dbport}/{dbname}

2) `rake assets:precompile` seemed to be failing for a while before running `heroku labs:enable user-env-compile` to give it access to environment variables.

3) Once you have a Postgres 9.x/PostGIS 2.0 instance set up (and your Heroku DATABASE_URL environment variable set to point to your PostGIS instance--*make sure it starts with 'postgis' and not 'postgres'!*) and a user named "trackserver".

As a DB superuser:

`CREATE SCHEMA postgis;`

`ALTER DATABASE "{DBNAME}" SET search_path="public, postgis"`

`CREATE EXTENSION postgis with SCHEMA postgis`

NEED TO VERIFY: For the db creation, RGeo likes a superuser postgis account, so the user in your DATABASE_URL needs to be one during DB creation. After the DB is created you can remove the superuser role from that Postgres account.

Now, from inside your repo: 

`heroku run rake db:create`

`heroku run rake db:migrate` 

