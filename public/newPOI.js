"use strict";

function onDeviceReady() {
  $("#location").text(window.isphone ? "Phone" : "Not Phone");
  //var host = "http://10.0.1.112:3000";
  var host = "";
  var minAccuracy = 100;
  var tour = {
    interest_points: []
  };
  var currentPoint = {};

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
        createInterestPoint(position);
      } else {
        $("#createPOI").attr('disabled', false);
        $("div#pointInputArea :input").attr('disabled', true);
        // this should be smarter, and try again
        alert(position.coords.accuracy + " Getting a lock on your position. Wait a few seconds and try again.");
      }
    }

    function createInterestPoint(position) {
      var lon = position.coords.longitude.toFixed(5);
      var lat = position.coords.latitude.toFixed(5);
      var interest_point = {
        location: "POINT(" + lon + " " + lat + ")"
      };
      currentPoint = interest_point;
    }
  });


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
    $('#tourSubmission :input').attr('disabled', false);
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
    console.log("saveTour");
    console.log(tour.interest_points.length);
    for (var i = 0; i < tour.interest_points.length; i++) {
      //for each point
      var myPoint = tour.interest_points[i];
      console.log(tour.interest_points[i].id);

    }
    submitTour(tour, submitMediaItems);

    return;

    function submitMediaItems(tour) {
      console.log("submitMediaItems");
      getInterestPoints(tour.id, processPoints);     
    }

    function getInterestPoints(tourID, doneCallback) {
      console.log("tourid: " + tourID);
      var callData = {type: "GET", path: "/tours/" + tourID + "/interest_points"};
      makeAPICall(callData, doneCallback);
    }

    function processPoints(response) {
      //for each interest point, add media items as subelements of a single interp_item

      var points = response;
      for (i = 0; i < points.length; i++) {
        console.log("point.id: " + points[i].id);
        //getInterpItems(points[i].id, saveMediaItems);

      }
    }

    function getInterpItems(pointID, doneCallback) {
      console.log("getInterpItems pointID: " + pointID);
      var callData = { type: "GET", path: "/interest_points/" + pointID + "/interp_items"};
      makeAPICall(callData, doneCallback);
    }

    function reformatTourForSubmission(tour) {
      if (tour.interest_points.interp_items) {
        tour.interest_points.interp_items_attributes = tour.interest_points.interp_items;
        delete tour.interest_points.interp_items;
      }
      if (tour.interest_points) {
        tour.interest_points_attributes = tour.interest_points;
        delete tour.interest_points;
      }
      tour.path = "LINESTRING" + "(" + tour.pathpoints.join(", ") + ")";
      return tour;
    }

    function submitTour(tour, doneCallback) {
      console.log("submitTour");
      var callData = {
        type: "post",
        path: "/tours",
      };
      callData.data = reformatTourForSubmission(tour);
      makeAPICall(callData, doneCallback);

      clearCurrentPoint();
      tour = {
        interest_points: []
      };
    };

  });



  $('#cancelTour').click(function(event) {
    clearTimeout(currentPositionTimeout);
    clearCurrentPoint();
    tour = {
      interest_points: []
    };
  });

  function currentPosition() {

    if (tour.interest_points) {
      $("span#pointsSavedCount").text(tour.interest_points.length);
    }

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

  function makeAPICall(callData, doneCallback) {
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
      console.log("response: ");
      console.log(response);
      if (typeof doneCallback === 'function') {
        console.log("calling Callback");
        console.log(response);
        //responseObj = JSON.parse(response);
        //console.log("responseObj: " + responseObj);
        doneCallback.call(this, response);
      }
      $("#results").text(JSON.stringify(response));
    });
  }
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