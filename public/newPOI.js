"use strict";

function onDeviceReady() {
  $("#location").text(window.isphone ? "Phone" : "Not Phone");
  var minAccuracy = 35;
  var tour = {
    interest_points: []
  };
  var currentPoint = {};
  var host = "http://10.0.1.112:3000"
  var currentPositionTimeout;
  var latestPosition;

  if (!window.isphone) {
    $(".desktop").show();
  } else {
    $(".phone").show();
  }

  $('#tourName').keyup(function(event) {
    //enable tour creation button if tourName field has text
    if ($(this).val().length) {
      if ($("#startTour").attr("disabled")) {
        $("#startTour").attr("disabled", false);
      }
    } else {
      $('#startTour').attr("disabled", true);
    }
  });

  $("#startTour").click(function(event) {
    //click on the tour start button,
    //so disable it and the name field, and enable the point creation button
    event.preventDefault();
    $(this).hide();
    $('#tourName').hide();
    $('#tourTitleTextDiv').html($('#tourName').val()).show();
    $('#createPOI').attr('disabled', false);
    // and start tracking the path

    currentPosition();
  });

  $("#createPOI").click(function(event) {
    //click on the interest_point create button,

    event.preventDefault();
    $("#createPOI").attr('disabled', true);
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, {
      enableHighAccuracy: true,
      timeout: 2000
    });

    function geoError(error) {
      console.log("error:");
      alert("Trouble getting your position. Wait a few seconds and try again.");
      $("#createPOI").attr('disabled', false);
      console.log(error);
    }

    function geoSuccess(position) {
      latestPosition = position;
      if (position.coords.accuracy <= minAccuracy) {
        console.log(position);
        $("div#pointInputArea :input").attr('disabled', false);
        $('#location').text(position.coords.longitude.toFixed(5) + " " + position.coords.latitude.toFixed(5) + " " + position.coords.accuracy + "m");
        addInterestPoint(position);
      } else {
        $("#createPOI").attr('disabled', false);
        $("div#pointInputArea :input").attr('disabled', true);
        // this should be smarter, and try again
        alert(position.coords.accuracy + " Getting a lock on your position. Wait a few seconds and try again.");
      }
    }
  });

  function addInterestPoint(position) {
    var lon = position.coords.longitude.toFixed(5);
    var lat = position.coords.latitude.toFixed(5);
    var interest_point = {
      interest_point: {
        location: "POINT (" + lon + " " + lat + ")"
      }
    };
    currentPoint = interest_point;

  }

  $("#photoUploadPhoneAlbum").click(function(event) {
    navigator.camera.getPicture(cameraSuccess, cameraError, {
      quality: 100,
      destinationType: navigator.camera.DestinationType.FILE_URI,
      sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
    });

    function cameraSuccess(photoURL) {
      console.log("phone album success")
      $("<img>").attr("src", photoURL).width("100%").appendTo("#selectedPhoto");
      var media_item = {};
      media_item.photoURL
      currentPoint.media_items = currentPoint.media_items || {};
      currentPoint.media_items.photoURL = photoURL;
      console.log(photoURL);
    }

    function cameraError(error) {
      console.log(error);
    }
  });

  // need to test this
  $("#photoUploadPhoneCamera").click(function(event) {
    console.log("camera");
    navigator.camera.getPicture(cameraSuccess, cameraError, {
      quality: 100,
      destinationType: navigator.camera.DestinationType.FILE_URI,
      sourceType: navigator.camera.PictureSourceType.CAMERA
    });

    function cameraSuccess(photoURL) {
      console.log("phone camera success");
      $("<img>").attr("src", photoURL).width("100%").appendTo("#selectedPhoto");
      currentPoint.photoURL = photoURL;
      console.log(photoURL);
    }

    function cameraError(error) {
      alert(error);
    }
  });

  function uploadPhoto(imageURI, point) {
    console.log("uploadPhoto");
    var options = new FileUploadOptions();
    options.fileKey = "media_item[item]";
    options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
    options.mimeType = "image/jpeg";

    var params = new Object();
    params["media_item[mimetype]"] = "test";
    params.value2 = "param";

    options.params = params;

    var ft = new FileTransfer();
    ft.upload(imageURI, "http://10.0.1.12:3000/media_items.json", win, fail, options);

    function win(r) {
      console.log("Code = " + r.responseCode);
      console.log("Response = " + r.response);
      console.log("Sent = " + r.bytesSent);
    }

    function fail(error) {
      alert("An error has occurred: Code = " = error.code);
    }
  }

  $("#cancelPoint").click(function(event) {
    clearCurrentPoint();
    console.log(tour);
  });

  $("#savePoint").click(function(event) {
    currentPoint.name = $('#pointName').val();
    tour.interest_points.push(currentPoint);
    clearCurrentPoint();
    console.log(tour);
  });

  function clearCurrentPoint() {
    $('#pointName').val('');
    $('#pointText').val('');
    $("div#pointInputArea :input").attr('disabled', true);
    $('#createPOI').attr('disabled', false);
    $('#selectedPhoto').html("");
    currentPoint = {};
  }

  $('#saveTour').click(function(event) {
    for (var i = 0; i < tour.tourPoints.length; i++) {
      //for each point
      var myPoint = tour.tourPoints[i];
      // save point for tour

      // for each media item
      // save interp_item for interest_point
      // save media_item for interp_item
      uploadPhoto(myPoint.photoURL);
      xs
    }

  });

  $('#cancelTour').click(function(event) {
    clearTimeout(currentPositionTimeout);
  });

  function currentPosition() {
    $("span#pointsSavedCount").text(tour.interest_points.length);

    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, {
      enableHighAccuracy: true,
      timeout: 1000
    });

    currentPositionTimeout = setTimeout(currentPosition, 2000);

    function geoSuccess(position) {
      latestPosition = position;
      $('#activeLocation').text("Now: " + position.coords.longitude.toFixed(5) + " " + position.coords.latitude.toFixed(5) + " " + position.coords.accuracy + "m");
      if ((position.coords.accuracy) < minAccuracy) {
        var newPathLocation = position.coords.longitude + " " + position.coords.latitude;
        tour.pathpoints = tour.pathpoints || [];
        tour.pathpoints.push(newPathLocation);
        console.log(tour.pathpoints.length);
      } else {
        //alert("GPS accuracy too low. Wait a few seconds and try again.");
      }
      $('currentTourInfo').html(tour);
    }

    function geoError(data) {
      console.log(data);
    }

  }
}



function createTour(tour) {
  var callData = {
    type: "POST",
    path: "/tours"
  };
  callData.data = {
    tour: {
      // placeholder point info 
      path: "LINESTRING(-122.4136841 37.7756653, -122.4136841 37.7756653, -122.4137007 37.7756913)",
      pathpoints: ["-122.4136841 37.7756653", "-122.4136841 37.7756653", "-122.4137007 37.7756913"],
      name: "Test Tour"
    }
  };
  makeAPICall(callData);
}

function makeAPICall(callData) {
  if (!($.isEmptyObject(callData.data))) {
    console.log("stringify");
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
    //data: JSON.stringify(data)
  }).fail(function(jqXHR, textStatus, errorThrown) {
    $("#results").text("error: " + JSON.stringify(errorThrown));
  }).done(function(response, textStatus, jqXHR) {
    $("#results").text(JSON.stringify(response));
  });
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