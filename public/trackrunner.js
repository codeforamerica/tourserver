"use strict";

function onDeviceReady() {
  $("#location").text(window.isphone ? "Phone" : "Not Phone");
  // change this to your server's IP
  var host = "http://trackserver-test.herokuapp.com";
  var minAccuracy = 200; // meters to trigger a point
  var currentTour = {};
  var mediaFiles = {};
  // should this be global?
  var currentPointIndex = 0;
  var geoWatchID = null;
  var triggerDistance = 10;
  var distanceToNextPoint = 100000;

  $("#tourIntroDisplay").hide();
  $("#tourLoadDisplay").hide();
  $("#tourActionDisplay").hide();
  $("#tourBetweenPointsDisplay").hide();
  getTourList();

  // skip the geolocation and display the upcoming point
  $("#skipInBetween").click(function() {
    showCurrentInterestPoint();
  });

  // leave the current point and start going to the next point
  $("#nextPoint").html("Continue Tour").show().click(function(event) {
    currentPointIndex++;
    $("#status").html("");
    showInBetweenScreen();
  });

  // tour is over (if you want it)
  $("#done").click(function(event) {
    alert("Done!");
    window.location.reload(false);
  });

  function getTourList() {
    var callData = {
      type: "GET",
      path: "/tours.json"
    };
    makeAPICall(callData, showTourList);
  }

  function showTourList(response) {
    for (var i = 0; i < response.length; i++) {
      var $tourInfo = $('<div>', {
        class: "tourListItem",
        "data-tourid": response[i].id
      });
      $tourInfo.text(response[i].name);
      $('#tourList').append($tourInfo);
      $('<hr>').appendTo($tourInfo);
    }
    // class for tours in selectable list.
    // tour id should be in 'data-tourid' attribute
    $(".tourListItem").click(function(event) {
      var tourid = $(this).data('tourid');
      getTourInfo(tourid);
    });
  }

  function showTourInfo(response) {
    currentTour = response;
    $("#tourList").hide();
    $("#tourInfoName").text(currentTour.name);

    // start running selected tour
    $("#startTour").click(startTour);

    // cancel selected tour
    $("#cancelTour").click(function(event) {
      window.location.reload(false);
    });
    $("#tourIntroDisplay").show();
  }

  function startTour(event) {
    $("#tourIntroDisplay").hide();
    $("#tourLoadDisplay").show();

    loadMediaItems();
  }

  function loadMediaItems() {
    // load all of the media items, then continue
    // make an array of download functions, then call async.parallel on it
    var mediaTaskArray = [];

    // TODO: this won't work if any interp_point has no media items.
    $.each(currentTour.interest_points, function(index, interest_point) {
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
    $("#tourLoadDisplay").hide();
    $("#tourBetweenPointsDisplay").show();
    console.log(currentTour);
    currentPointIndex = 0;
    showInBetweenScreen();
  }

  function showInBetweenScreen() {
    $("#tourActionDisplay").hide();
    $("#pointText").html("");
    $("#pointAudio").html("");
    $("#pointImage").html("");
    $("#tourBetweenPointsDisplay").show();
    $("#currentPointIndex").html(currentPointIndex);
    $("#endPointIndex").text(currentTour.interest_points.length - 1);
    if (geoWatchID == null) {
      startGeolocation();
    }
  }

  function showCurrentInterestPoint() {
    console.log("showCurrentInterestPoint: " + currentPointIndex + " " + currentTour.interest_points.length);
    stopGeolocation();
    var currentPoint = currentTour.interest_points[currentPointIndex];
    $("#status").html("");
    $("#tourBetweenPointsDisplay").hide();
    $("#tourActionDisplay").show();
    if (currentPointIndex < currentTour.interest_points.length - 1) {
      console.log("not last point");
      $("#done").hide();
      $("#nextPoint").show();
    } else {
      console.log("last point");
      $("#nextPoint").hide();
      $("#done").show();
      $("#status").html();
    }
    $.each(currentPoint.interp_items, function(index, interp_item) {
      $.each(interp_item.media_items, function(index, media_item) {
        var mimeType = media_item.item_content_type;
        var filename = media_item.item_file_name;
        if (mimeType.indexOf("text") == 0) {
          getTextItem(filename, function(textContents) {
            $("#pointText").append("<span>" + textContents + "</span>");
          });
        } else if (mimeType.indexOf("audio") == 0) {

          var $audioItem = $("<button>Play Sound</button>").addClass("audio");
          $("#pointAudio").append($audioItem);
          $(".audio").click(function(event) {
            var myMedia = new Media(mediaFiles[filename].fullPath, function() {
              console.log("audio success");
            });
            myMedia.play();
          });
        } else if (mimeType.indexOf("image") == 0) {
          var $imageItem = $("<img width='100%'>").attr('src', mediaFiles[filename].fullPath);
          $("#pointImage").append($imageItem);
        }
      });
    });
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
      filesystem.root.getDirectory("tour" + currentTour.id, {
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
      console.log(fileEntry);
      mediaFiles[fileEntry.name] = fileEntry;

      doneCallback(null, fileEntry.name);
    }

    function fail(error) {
      console.log(error);
      doneCallback("downloadFail", itemInfo.fullitem);
    }
  }

  function getTourInfo(tourid) {
    var callData = {
      type: "GET",
      path: "/tours/" + tourid + ".json"
    };
    makeAPICall(callData, showTourInfo);
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
    console.log("startGeolocation: " + currentPointIndex);
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
    $("#betweenAccuracy").html("GPS accuracy: " + latestPosition.coords.accuracy + "m");

    if ((latestPosition.coords.accuracy) < minAccuracy) {
      var currentPointWKT = currentTour.interest_points[currentPointIndex].location;
      var lnglat = /POINT \(([-\d|.]+) ([-\d|.]+)\)/.exec(currentPointWKT);
      var lng = parseFloat(lnglat[1]);
      var lat = parseFloat(lnglat[2]);
      distanceToNextPoint = getDistanceFromLatLonInKm(lat, lng, position.coords.latitude, position.coords.longitude) * 1000;
      distanceToNextPoint = distanceToNextPoint.toFixed(0);
      console.log(distanceToNextPoint);
      $("#status").html(distanceToNextPoint + "m to this point of interest");
      $("#betweenStatus").html(distanceToNextPoint + "m to next point of interest");
      if (distanceToNextPoint < triggerDistance) {
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