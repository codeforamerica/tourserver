"use strict";

// 22 April 2013 - A copy of trackrunner.js for modification and integration into the real app


function onDeviceReady() {
  console.log("onDeviceReady");
  $("#location").text(window.isphone ? "Phone" : "Not Phone");
  // change this to your server's IP
  var host = "http://trackserver-test.herokuapp.com";
  var minCheckLocationAccuracy = 20; // meters to trigger a point
  var currentViewingTour = {};

  var mediaFiles = {};
  var currentViewPointIndex = 0;
  var geoWatchID = null;
  var triggerCurrentPointDistance = 10;
  var distanceToNextPoint = 100000;

  $("#viewTrackListPage").on('pageinit', getTourList);
  $("#viewTrackInfoPage").on('pagebeforeshow', showTourInfo);
  $("#viewTrackLoadingPage").on('pagebeforeshow', loadMediaItems);
  $("#viewTrackInstructionsPage").on('pagebeforeshow', startTour);
  $("#viewTrackPointPage").on('pagebeforeshow', showCurrentInterestPoint);
  $(".viewTrackNextInBetween").click(advancePointIndex);
  $(".viewTrackBackToPrevious").click(decrementPointIndex);
  $("#viewTrackCompletePage").on('pagebeforeshow', tourDone);

  //getTourList();

  // skip the geolocation and display the upcoming point
  $("#skipInBetween").click(function() {
    showCurrentInterestPoint();
  });

  function tourDone() {
    $("#viewTrackTitleFinished").text(currentViewingTour.name);
    stopGeolocation();
    currentViewPointIndex = 0;
    currentViewingTour = {};
    distanceToNextPoint = 100000;

  }

  // leave the current point and start going to the next point

  function advancePointIndex(event) {
    event.preventDefault();
    console.log("advancePointIndex");
    currentViewPointIndex++;
    console.log(currentViewPointIndex);

  }

  // back button hit, back to previous point

  function decrementPointIndex() {
    console.log("decrementPointIndex");
    if (currentViewPointIndex > 0) {
      currentViewPointIndex--;
    }
    console.log(currentViewPointIndex);
  }

  // // tour is over (if you want it)
  // $("#done").click(function(event) {
  //   alert("Done!");
  //   window.location.reload(false);
  // });

  function getTourList() {
    currentViewPointIndex = 0;
    console.log("getTourList");
    var callData = {
      type: "GET",
      path: "/tours.json"
    };
    makeAPICall(callData, showTourList);
  }

  function showTourList(response) {
    console.log("showTourList");
    var $tourTemplate = $(".viewTrackList li:first");

    for (var i = 0; i < response.length; i++) {
      //console.log(response[i]);
      var $tourListEntry = $tourTemplate.clone(false);
      var $viewTrackTitle = $tourListEntry.find(".viewTrackTitle");
      $viewTrackTitle.text(response[i].name);
      var $viewTrackDifficulty = $tourListEntry.find(".viewTrackDifficulty");
      $viewTrackDifficulty.text(response[i].difficulty);
      $tourListEntry.find(".viewTrackChapters").text(response[i].chapters.length + " chapters");

      //TODO: figure out why jqmdata doesn't work
      $tourListEntry.data("tourid", response[i].id);
      $(".viewTrackList").append($tourListEntry);
    }
    // class for tours in selectable list.
    // tour id should be in 'data-tourid' attribute
    $(".viewTrackListItem").click(function(event) {
      var tourid = $(this).data('tourid');
      moveToTourInfo(tourid);
    });
    $tourTemplate.remove();
    $('#viewTrackList').listview('refresh');
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
    console.log(currentViewingTour);
    console.log(currentViewingTour["name"]);
    $("#viewTrackTitle").text(currentViewingTour.name);
    $("#viewTrackDescription").text("Placeholder");
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
    $.mobile.changePage($("#viewTrackInstructionsPage"));
    showInBetweenScreen();
  }

  function showInBetweenScreen() {
    console.log("showInBetweenScreen");
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
    if (geoWatchID == null) {
      startGeolocation();
    }
  }

  function showCurrentInterestPoint() {
    console.log("showCurrentInterestPoint: " + currentViewPointIndex + " " + currentViewingTour.interest_points.length);
    stopGeolocation();
    var currentPoint = currentViewingTour.interest_points[currentViewPointIndex];
    if (currentViewPointIndex == 0) {
      console.log("first point");
      // $(".viewTrackBackToPrevious .ui-btn-text").text("Back");
      // $(".viewTrackBackToPrevious").attr("href", "#viewTrackInfoPage");
      $(".viewTrackNextInBetween .ui-btn-text").text("Next");
      $(".viewTrackNextInBetween").attr("href", "#viewTrackInstructionsPage");
    } else if (currentViewPointIndex == currentViewingTour.interest_points.length - 1) {
      console.log("last point");
      // $(".viewTrackBackToPrevious .ui-btn-text").text("Back");
      // $(".viewTrackBackToPrevious").attr("href", "#viewTrackPointPage");
      $(".viewTrackNextInBetween .ui-btn-text").text("Done");
      $(".viewTrackNextInBetween").attr("href", "#viewTrackCompletePage");
    } else {
      console.log("not last point");
      // $(".viewTrackBackToPrevious .ui-btn-text").text("Back");
      // $(".viewTrackBackToPrevious").attr("href", "#viewTrackPointPage");
      $(".viewTrackNextInBetween .ui-btn-text").text("Next");
      $(".viewTrackNextInBetween").attr("href", "#viewTrackInstructionsPage");
    }
    var myAudio = null;
    console.log(myAudio);
    $("#viewTrackCurrentPointIndex").text(currentViewPointIndex + 1);
    $("#viewTrackTotalPoints").text(currentViewingTour.interest_points.length);
    console.log("currentPoint.name");
    console.log(currentPoint.name);
    $("#viewTrackPointName").text(currentPoint.name);
    $.each(currentPoint.interp_items, function(index, interp_item) {
      $.each(interp_item.media_items, function(index, media_item) {
        var mimeType = media_item.item_content_type;
        var filename = media_item.item_file_name;
        if (mimeType.indexOf("text") == 0) {
          getTextItem(filename, function(textContents) {
            $("#viewTrackPointDescription").html(textContents);
          });
        } else if (mimeType.indexOf("audio") == 0) {
          $("#viewTrackAudioPointPlay").click(function(event) {
            event.preventDefault();
            if (myAudio == null) {
              myAudio = new Media(mediaFiles[filename].fullPath, audioSuccess, audioError, audioStatus);
            }
            myAudio.play({
              numberOfLoops: 1
            });
          });
        } else if (mimeType.indexOf("image") == 0) {
          $("#viewTrackPointImage").attr('src', mediaFiles[filename].fullPath);
        }
      });
    });

    return;

    function audioSuccess() {
      $("#viewTrackAudioPointPause").click(function(event) {
        event.preventDefault();
        myAudio.pause();
      });
      $("#viewTrackAudioPointRestart").click(function(event) {
        event.preventDefault();
        myAudio.seekTo(0);
      });
    }

    function audioStatus(code) {
      // may need this for control updates
      console.log("Audio Status: " + code);
    }

    function audioError() {
      console.log("Error: " + response);
    }
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
      console.log("downloadSuccess");
      // console.log(fileEntry);
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
        //responseObj = JSON.parse(response);
        //console.log("responseObj: " + responseObj);
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
    navigator.geolocation.clearWatch(geoWatchID);
    geoWatchID = null;
  }


  function geoSuccess(position) {
    var latestPosition = position;
    $("#accuracy").html("GPS Accuracy: " + latestPosition.coords.accuracy + "m");

    if ((latestPosition.coords.accuracy) < minCheckLocationAccuracy) {
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
      $("#status").html(distanceToNextPoint + "m to this point of interest");
      if (distanceToNextPoint < triggerCurrentPointDistance) {
        console.log("distance trigger");
        navigator.notification.vibrate(1500);
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
  // are we running in native app or in browser?
  window.isphone = false;
  if (document.URL.indexOf("http://") == -1) {
    window.isphone = true;
  }

  if (window.isphone) {
    document.addEventListener("deviceready", onDeviceReady, false);
  } else {
    onDeviceReady();
  }
});