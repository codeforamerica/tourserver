"use strict";

function onDeviceReady() {
  $("#location").text(window.isphone ? "Phone" : "Not Phone");
  var host = "http://10.0.1.112:3000";
  //var host = "";
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
      currentPoint.interp_items = currentPoint.interp_items || [];
      currentPoint.interp_items.push({
        name: "Passthrough"
      });
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


      currentPoint.interp_items[0].media_items_attributes = currentPoint.interp_items[0].media_items_attributes || [];
      currentPoint.interp_items[0].media_items_attributes.push({
        type: "image",
        data: photoURL
      });
      console.log(photoURL);
    }

    function cameraError(error) {
      console.log(error);
    }
  });

  // need to test this
  $("#photoUploadPhoneCamera").click(function(event) {
    //TODO: dupe the album fetch code :/
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

  function uploadPhoto(imageURI, uploadCallback) {
    console.log("uploadPhoto");
    var options = new FileUploadOptions();
    options.fileKey = "media_item[item]";
    options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
    options.mimeType = "image/jpeg";

    var params = new Object();
    params["media_item[name]"] = "Placeholder Name";
    options.params = params;

    var ft = new FileTransfer();
    ft.upload(imageURI, host + "/media_items.json", uploadWin, uploadFail, options);

    function uploadWin(r) {
      console.log("Code = " + r.responseCode);
      uploadCallback(r.response);
      console.log("Response = " + r.response);
      console.log("Sent = " + r.bytesSent);
    }

    function uploadFail(error) {
      alert("An error has occurred: Code = " = error.code);
    }

  }



  $("#cancelPoint").click(function(event) {
    clearCurrentPoint();
    console.log(tour);
  });

  $("#savePoint").click(function(event) {
    currentPoint.name = $('#pointName').val();
    // add an interp_item. For now, each interest_point will have only one interpretive item.
    // later, we can use interp_item as a container for groups of media_items
    currentPoint.interp_items = currentPoint.interp_items || [];


    tour.interest_points.push(currentPoint);
    $('#tourSubmission :input').attr('disabled', false);
    clearCurrentPoint();
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
    console.log(tour);
    console.log(tour.interest_points.length);
    for (var i = 0; i < tour.interest_points.length; i++) {
      //for each point
      var myPoint = tour.interest_points[i];
    }
    //change in strategy
    //submit all of the media items _first_
    //stick their IDs in the tour object
    //submit tour object
    submitMediaItems(tour);

    console.log("return from submitMediaItems");
    console.log(tour);
    return;


    function submitTour(tour) {
      console.log("submitTour");
      console.log(tour);
      var callData = {
        type: "post",
        path: "/tours.json",
      };
      callData.data = reformatTourForSubmission(tour);
      makeAPICall(callData);

      clearCurrentPoint();
      tour = {
        interest_points: []
      };
    };

    function submitMediaItems(tour) {
      console.log("submitMediaItems");
      // better way to avoid undefined issues?
      console.log("tour.interest_points");
      var mediaItemsSubmissions = new Array();
      console.log(mediaItemsSubmissions.length);
      if (tour.interest_points) {
        for (var i = 0; i < tour.interest_points.length; i++) {
          var myPoint = tour.interest_points[i];
          console.log("interp_items");
          if (myPoint.interp_items) {
            for (var j = 0; j < myPoint.interp_items.length; j++) {
              var myInterpItem = myPoint.interp_items[j];
              console.log("media_items");
              console.log(myInterpItem.media_items_attributes);
              if (myInterpItem.media_items_attributes) {
                for (var k = 0; k < myInterpItem.media_items_attributes.length; k++) {
                  var myMediaItem = myInterpItem.media_items_attributes[k];
                  console.log("myMediaItem: ");
                  console.log(myMediaItem);
                  var mediaSubmitParams = [];
                  if (myMediaItem.type == "image") {
                    // submit myMediaItem.data and addMediaItemIDToTour to uploadPhoto somehow
                    mediaSubmitParams.push({
                      data: myMediaItem.data,
                      callback: function(response) {
                        myMediaItem = addMediaItemIDToTour(response, myMediaItem);
                        console.log("in uploadPhoto.callback");
                        console.log(myMediaItem);
                      }
                    })
                  }
                }
              }
            }
          }
        }
      }

      if (mediaSubmitParams) {
        var funcArray = [];
        $.each(mediaSubmitParams, function(index, value) {
          funcArray.push(function(callback) {
            uploadPhoto(value.data, function(response) {
              console.log("seriesItemCallback");
              value.callback(response);
              callback(null, "two");
            });
          })
        });
        async.series(funcArray, asyncCallback);

      }
    }

    function asyncCallback() {
      console.log("asyncCallback");
      console.log(tour);
      submitTour(tour);
    }

    function addMediaItemIDToTour(response, mediaItem) {
      var myResponse = JSON.parse(response);
      mediaItem.id = myResponse.id;
      console.log("mediaItem: ");
      console.log(mediaItem);
      return mediaItem;

    }

    function saveMediaItems(response) {
      console.log("saveMediaItems");
      // reponse includes array of interp_items
      var interp_items = response;
      console.log(response);
      for (var i = 0; i < interp_items.length; i++) {
        console.log("looping interp_items");
        var myInterpItem = interp_items[i];
        console.log("interp_item.id: " + interp_items[i].id);
        // now submit each media item to Paperclip
        // including the interp_item_id
        if (myInterpItem.media_items_attributes) {
          console.log("looping media_items");
          for (var j = 0; j < myInterpItem.media_items_attributes.length; j++) {
            var myMediaItem = myInterpItem.media_items_attributes[j];
            console.log(myMediaItem);
            if (myMediaItem.type == "image") {
              var media_item_options = {
                interp_item_id: myInterpItem.id
              };
              uploadPhoto(myMediaItem.data, media_item_options);
            }
          }
        }
      }
    }

    function reformatTourForSubmission(tour) {
      console.log("reformatTourForSubmission");
      // reformatting for Rails. It likes nested resource names to end with _attributes.
      console.log(tour.interest_points.length);
      for (var i = 0; i < tour.interest_points.length; i++) {
        var myPoint = tour.interest_points[i];
        console.log("myPoint");
        console.log(myPoint);
        if (myPoint.interp_items) {
          for (var j = 0; j < myPoint.interp_items.length; j++) {
            var myInterpItem = myPoint.interp_items[j];
            if (myInterpItem.media_items_attributes) {
              for (var k = 0; k < myInterpItem.media_items_attributes.length; k++) {
                var myMediaItem = myInterpItem.media_items_attributes[k];
                delete myMediaItem.data;
                delete myMediaItem.type;
              }
            }
          }
        }
        myPoint.interp_items_attributes = myPoint.interp_items;
        delete myPoint.interp_items;
      }
      if (tour.interest_points) {
        tour.interest_points_attributes = tour.interest_points;
        delete tour.interest_points;
      }

      // make the heartbeat WKT path
      tour.path = "LINESTRING" + "(" + tour.pathpoints.join(", ") + ")";
      console.log(tour);
      console.log("end reformatTourForSubmission");
      return tour;
    }

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
      if (typeof doneCallback === 'function') {
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