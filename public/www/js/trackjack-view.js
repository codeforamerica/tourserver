"use strict";

// Tourserver API host
// var host = "http://trackserver-dev.herokuapp.com";
var host = "http://trackserver-test.herokuapp.com";
// var host = "http://127.0.0.1:3000";

function onDeviceReadyView() {
  console.log("onDeviceReady-view");
  $("#location").text(window.isphone ? "Phone" : "Not Phone");

  var MIN_CHECK_LOCATION_ACCURACY = 20; // accuracy in meters required to trigger a point
  var POINT_TRIGGER_DISTANCE = 10; // distance in meters to trigger display of the next point
  var METERS_TO_MILES = 0.000621371192

  var currentViewingTour = {};
  var mediaFiles = {};
  var currentViewPointIndex = 0; // current point being approached or displayed
  var geoWatchID = null;
  var distanceToNextPoint = 100000;

  stopGeolocation();
  getTourList();

  $("#settingsPage").on('pagebeforeshow', stopGeolocation);
  $("#viewTrackListPage").on('pagebeforeshow', getTourList);
  $("#viewTrackInfoPage").on('pagebeforeshow', showTourInfo);
  $("#viewTrackLoadingPage").on('pagebeforeshow', loadMediaItems);
  $("#viewTrackInstructionsPage").on('pagebeforeshow', startTour);

  $("#viewTrackPointPage").on('pagebeforeshow', showCurrentInterestPoint);
  $("#skipInBetween").click(showCurrentInterestPoint);

  $(".viewTrackNextInBetween").click(advancePointIndex);
  $(".viewTrackBackToPrevious").click(decrementPointIndex);
  $("#viewTrackCompletePage").on('pagebeforeshow', tourDone);


  function tourDone() {
    $("#viewTrackTitleFinished").text(currentViewingTour.name);
    stopGeolocation();
  }

  // leave the current point and start going to the next point

  function advancePointIndex(event) {
    event.preventDefault();
    console.log("advancePointIndex");

    if (currentViewPointIndex == currentViewingTour.interest_points.length - 1) {
      console.log("last page");
    } else {
      currentViewPointIndex++;
      clearPointElements();
    }

    $.mobile.changePage($(this).attr("href"), {
      transition: "slide"
    });
    return true;
  }

  function decrementPointIndex() {
    console.log("decrementPointIndex");
    if (currentViewPointIndex > 0) {
      clearPointElements();
      currentViewPointIndex--;
      $.mobile.changePage($("#viewTrackPointPage"), {
        transition: "slide",
        reverse: true
      });
    }
    else {
      $.mobile.changePage($("#viewTrackInfoPage"), {
        transition: "slide",
        reverse: true
      });
    }
    console.log(currentViewPointIndex);
  }

  function getTourList() {
    console.log("getTourList");
    stopGeolocation();
    $("#viewTrackList").hide();
    currentViewPointIndex = 0;
    currentViewingTour = {};
    distanceToNextPoint = 100000;

    var callData = {
      type: "GET",
      path: "/tours.json"
    };
    makeAPICall(callData, showTourList);
  }

  function showTourList(response) {
    console.log("showTourList");
    var $tourTemplate = $("#viewTrackListItemTemplate");
    $("#viewTrackList").children().remove('li:not(.viewTrackListItemTemplate)');
    console.log($tourTemplate);
    for (var i = 0; i < response.length; i++) {
      var $tourListEntry = $tourTemplate.clone(false);
      var $viewTrackTitle = $tourListEntry.find(".viewTrackTitle");
      $viewTrackTitle.text(response[i].name);
      var $viewTrackDifficulty = $tourListEntry.find(".viewTrackDifficulty");
      $viewTrackDifficulty.text(response[i].difficulty);
      var $viewTrackDistance = $tourListEntry.find(".viewTrackDistance");
      $viewTrackDistance.text(((response[i].tour_length) * METERS_TO_MILES).toFixed(2));
      $tourListEntry.find(".viewTrackChapters").text(response[i].chapters.length + " chapters");
      console.log(response[i].fullitem);
      if (response[i].fullitem != "/cover_images/original/missing.png") {
        $tourListEntry.find(".viewTrackListImage").attr("src", response[i].fullitem);
      }
      $tourListEntry.jqmData("tourid", response[i].id);
      $("#viewTrackList").append($tourListEntry);
    }
    // class for tours in selectable list.
    // tour id should be in 'data-tourid' attribute
    $(".viewTrackListItem").click(function(event) {
      var tourid = $(this).jqmData('tourid');
      moveToTourInfo(tourid);
    });
    $tourTemplate.remove();

    $('#viewTrackList').listview('refresh');
    $('#viewTrackList').show();

  }

  function moveToTourInfo(tourid) {
    var callData = {
      type: "GET",
      path: "/tours/" + tourid + ".json"
    };
    makeAPICall(callData, function(response) {
      currentViewingTour = response;
      $.mobile.changePage($("#viewTrackInfoPage"), {
        transition: "slide"
      });
    });
  }

  function showTourInfo() {
    console.log("showTourInfo");
    $("#viewTrackTitle2").text(currentViewingTour.name);
    $(".viewTrackDistance").text(((currentViewingTour.tour_length) * 0.000621371192).toFixed(2));
    $(".viewTrackChapters").text(currentViewingTour.interest_points.length + " chapters");
    $(".viewTrackDifficulty").text(currentViewingTour.difficulty);
    if (currentViewingTour.fullitem.indexOf("missing") == -1) {
      $("#viewTrackImage").attr("src", currentViewingTour.fullitem);
    }
    if (currentViewingTour.description) {
      $("#viewTrackDescription").text(currentViewingTour.description);
    } else {
      $("#viewTrackDescription").text("No description");
    }

    $(".viewTrackChapters").text(currentViewingTour.interest_points.length + " chapters");
  }

  function startTour(event) {
    console.log("currentViewPointIndex" + currentViewPointIndex);
    showInBetweenScreen();
  }

  function loadMediaItems() {
    // load all of the media items, then continue
    // make an array of download functions, then call async.parallel on it
    var mediaTaskArray = [];

    // TODO: this won't work if any interp_point has no media items.
    console.log(currentViewingTour);
    $.each(currentViewingTour.interest_points, function(index, interest_point) {
      $.each(interest_point.interp_items, function(index, interp_item) {
        $.each(interp_item.media_items, function(index, media_item) {
          var mediaTask = function(media_item) {
            return function(callback) {
              var callData = {
                type: "GET",
                path: "/media_items/" + media_item.id + ".json"
              };
              makeAPICall(callData, function(response) {
                downloadMediaItem(response, function(error, fileEntry) {
                  $("#loadProgress").append(" .");
                  callback(error, fileEntry);
                });
              });
            };
          }(media_item);
          mediaTaskArray.push(mediaTask);
        });
      });
    });
    async.parallel(mediaTaskArray, startPointSequence);
  }

  function startPointSequence() {
    currentViewPointIndex = 0;
    $("#loadProgress").html("");
    $.mobile.changePage($("#viewTrackInstructionsPage"));
    showInBetweenScreen();
  }

  function showInBetweenScreen() {
    console.log("showInBetweenScreen");
    if (geoWatchID == null) {
      startGeolocation();
    }
    if (currentViewPointIndex == 0) {
      $("#viewTrackFirstInBetweenText").show();
      $("#viewTrackInBetweenText").hide();
    } else {
      $("#viewTrackFirstInBetweenText").hide();
      $("#viewTrackInBetweenText").show();
    }
    $("#tracklist-header").text(currentViewingTour.name);
    $("#currentViewPointIndex").html(currentViewPointIndex);
    $("#endPointIndex").text(currentViewingTour.interest_points.length - 1);

  }

  function showCurrentInterestPoint() {
    console.log("showCurrentInterestPoint: " + currentViewPointIndex + " " + currentViewingTour.interest_points.length);
    stopGeolocation();
    clearPointElements();
    var currentPoint = currentViewingTour.interest_points[currentViewPointIndex];
    if (currentViewPointIndex == 0) {
      console.log("first point");
      $(".viewTrackNextInBetween .ui-btn-text").text("Next");
      $(".viewTrackNextInBetween").attr("href", "#viewTrackInstructionsPage");
    } else if (currentViewPointIndex == currentViewingTour.interest_points.length - 1) {
      console.log("last point");
      $(".viewTrackNextInBetween .ui-btn-text").text("Done");
      $(".viewTrackNextInBetween").attr("href", "#viewTrackCompletePage");
    } else {
      console.log("not last point");
      $(".viewTrackNextInBetween .ui-btn-text").text("Next");
      $(".viewTrackNextInBetween").attr("href", "#viewTrackInstructionsPage");
    }
    $("#new-musicplayer-container").hide();
    $("#viewTrackCurrentPointIndex").text("").text(currentViewPointIndex + 1);
    $("#viewTrackTotalPoints").text("").text(currentViewingTour.interest_points.length);
    $("#viewTrackPointName").text("").text(currentPoint.name);
    $.each(currentPoint.interp_items, function(index, interp_item) {
      $.each(interp_item.media_items, function(index, media_item) {
        var mimeType = media_item.item_content_type;
        var filename = media_item.item_file_name;
        console.log(mediaFiles[filename].fullPath);
        if (mimeType.indexOf("text") == 0) {
          getTextItem(filename, function(textContents) {
            $("#viewTrackPointDescription").html(textContents);
          });
        } else if (mimeType.indexOf("audio") == 0) {
          console.log("populating view audio");
          console.log(mediaFiles[filename].fullPath);
          $("#newplayer").attr("src", mediaFiles[filename].fullPath);
          $("#new-musicplayer-container").show();
          if ($("#new-musicplayer-container .audioplayer").length == 0) {
            $('#newplayer').audioPlayer();
          }
        } else if (mimeType.indexOf("image") == 0) {
          $("#viewTrackPointImage").attr('src', mediaFiles[filename].fullPath);
        }
      });
    });
    if (!($("#newplayer").attr("src"))) {
      $("#newplayer").hide();
    }
    return;
  }

  function clearPointElements() {
    $("#viewTrackPointName").val("");
    $("#viewTrackPointImage").removeAttr("src");
    $("#viewTrackPointDescription").html("");
    $("#newplayer").hide();
    $("#newplayer").removeAttr("src");
  }

  function getTextItem(filename, CB) {
    var reader = new FileReader();
    var fileEntry = mediaFiles[filename];
    reader.onloadend = function(evt) {
      CB(evt.target.result);
    }
    fileEntry.file(function(myFile) {
      reader.readAsText(myFile);
    });
  }

  function downloadMediaItem(itemInfo, doneCallback) {
    var itemURL = itemInfo.fullitem;
    var itemType = itemInfo.item_content_type;
    window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, gotFS, fail);

    function gotFS(filesystem) {
      filesystem.root.getDirectory("tour" + currentViewingTour.id, {
        create: true,
        exclusive: false
      }, gotDir, fail);
    }

    function gotDir(directory) {
      directory.getFile(itemInfo.item_file_name, {
        create: true,
        exclusive: false
      }, gotFile, fail);
    }

    function gotFile(fileEntry) {
      var fileTransfer = new FileTransfer();
      fileTransfer.download(itemURL, fileEntry.fullPath, downloadSuccess, fail);
    }

    function downloadSuccess(fileEntry) {
      mediaFiles[fileEntry.name] = fileEntry;
      doneCallback(null, fileEntry.name);
    }

    function fail(error) {
      console.log(error);
      doneCallback("downloadFail", itemInfo.fullitem);
    }
  }

  function makeAPICall(callData, doneCallback) {
    console.log('makeAPICall');
    if (!($.isEmptyObject(callData.data))) {
      callData.data = JSON.stringify(callData.data);
    }
    var url = host + callData.path;
    var request = $.ajax({
      type: callData.type,
      url: url,
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      //beforeSend: function(xhr) {
      //  xhr.setRequestHeader("Accept", "application/json")
      //},
      data: callData.data
    }).fail(function(jqXHR, textStatus, errorThrown) {
      $("#results").text("error: " + JSON.stringify(errorThrown));
    }).done(function(response, textStatus, jqXHR) {
      if (typeof doneCallback === 'function') {
        doneCallback.call(this, response);
      }
      $("#results").text(JSON.stringify(response));
    });
  }

  function startGeolocation() {
    console.log("startGeolocation: " + currentViewPointIndex);
    geoWatchID = navigator.geolocation.watchPosition(geoSuccess, geoError, {
      enableHighAccuracy: true
    });
  }

  function stopGeolocation() {
    console.log("stopGeolocation");
    if (geoWatchID != null) {
      navigator.geolocation.clearWatch(geoWatchID);
      geoWatchID = null;
    }
  }


  function geoSuccess(position, UICallback) {
    var latestPosition = position;
    $("#accuracy").html("GPS Accuracy: " + latestPosition.coords.accuracy + "m");

    if ((latestPosition.coords.accuracy) < MIN_CHECK_LOCATION_ACCURACY) {
      var currentPointWKT = currentViewingTour.interest_points[currentViewPointIndex].location;
      var lnglat = /POINT \(([-\d|.]+) ([-\d|.]+)\)/.exec(currentPointWKT);
      var lng = parseFloat(lnglat[1]);
      var lat = parseFloat(lnglat[2]);
      distanceToNextPoint = getDistanceFromLatLonInKm(lat, lng, position.coords.latitude, position.coords.longitude) * 1000;
      distanceToNextPoint = distanceToNextPoint.toFixed(0);
      console.log(distanceToNextPoint);
      // $('.viewTrackDistanceToPoint').text(distanceToNextPoint);
      var distanceToNextPointMiles = distanceToNextPoint * 0.000621371192;
      distanceToNextPointMiles = distanceToNextPointMiles.toFixed(2);
      $('.viewTrackDistanceToPoint').text(distanceToNextPointMiles);
      if (typeof UICallback === "function") {
        UICallback();
      }
      if (distanceToNextPoint < POINT_TRIGGER_DISTANCE) {
        console.log("distance trigger");
        navigator.notification.vibrate(1500);
        $.mobile.changePage($("#viewTrackPointPage"), {
          transition: "slide"
        });
        showCurrentInterestPoint();
      }
    } else {
      // status
    }
  }

  function geoError(data) {
    console.log("Error: ");
    console.log(data);
  }

}

function logpp(js) {
  console.log(JSON.stringify(js, null, "  "));
}

//don't like using this. would like to get better distances via PostGIS

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

$(document).ready(function() {
  FastClick.attach(document.body);
  // are we running in native app or in browser?
  window.isphone = false;
  if (document.URL.indexOf("http://") == -1) {
    window.isphone = true;
  }

  if (window.isphone) {
    document.addEventListener("deviceready", onDeviceReadyView, false);
  } else {
    onDeviceReadyView();
  }
});