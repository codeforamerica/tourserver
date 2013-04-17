"use strict";

function onDeviceReady() {
  $("#location").text(window.isphone ? "Phone" : "Not Phone");
  // change this to your server's IP
  //var host = "http://127.0.0.1:3000";
  var host = "http://trackserver-test.herokuapp.com";
  //var host = "http://10.0.3.14:3000";
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
    var tourName = $('#tourName').val();
    tour.name = tourName;
    $('#tourTitleTextDiv').html(tourName).show();
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
      console.log("media_items_attributes.length" + currentPoint.interp_items[0].media_items_attributes.length);
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
    uploadMedia(imageURI, uploadCallback, "image/jpeg");
  }

  function uploadAudio(audioURI, uploadCallback) {
    uploadMedia(audioURI, uploadCallback, "audio/wav");
  }

  function writeAndUploadText(text, uploadCallback) {
    text = text.substr(0, 1500);
    console.log("uploadText");
    var fileName = Math.floor(Math.random() * 10000000) + ".txt";
    window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, gotFS, fail);

    function gotFS(fileSystem) {
      fileSystem.root.getFile(fileName, {
        create: true,
        exclusive: false
      }, gotFileEntry, fail);
    }

    function gotFileEntry(fileEntry) {
      fileEntry.createWriter(gotFileWriter, fail);
    }

    function gotFileWriter(writer) {
      console.log("writer.filename: ");
      console.log(writer.fileName)
      writer.onwriteend = function(evt) {
        console.log("evt");
        console.log(evt);
        uploadMedia(writer.fileName, uploadCallback, "text/plain");
      };
      writer.write(text);
    }

    function fail(error) {
      alert("An error has occurred: Code = " + error.code);
    }
  }

  function uploadMedia(mediaURI, uploadCallback, mimeType) {
    var options = new FileUploadOptions();
    options.mimeType = mimeType;
    options.fileKey = "media_item[item]";
    options.fileName = mediaURI.substr(mediaURI.lastIndexOf('/') + 1);

    var params = new Object();
    params["media_item[name]"] = "Placeholder Name";
    options.params = params;

    var ft = new FileTransfer();
    ft.upload(mediaURI, host + "/media_items.json", uploadWin, uploadFail, options);

    function uploadWin(r) {
      console.log("Code = " + r.responseCode);
      uploadCallback(r.response);
      console.log("Response = " + r.response);
      console.log("Sent = " + r.bytesSent);
    }

    function uploadFail(error) {
      alert("An error has occurred: Code = " + error.code);
    }
  }

  $("#recordAudio").click(function(event) {
    navigator.device.capture.captureAudio(captureSuccess, captureError);

    function captureSuccess(mediaFiles) {
      for (var i = 0; i < mediaFiles.length; i++) {
        currentPoint.interp_items[0].media_items_attributes = currentPoint.interp_items[0].media_items_attributes || [];
        var myAudioMediaItem = {
          type: "audio",
          data: mediaFiles[i].fullPath
        };
        console.log("myAudioMediaItem");
        console.log(myAudioMediaItem);
        currentPoint.interp_items[0].media_items_attributes.push(myAudioMediaItem);
      }
    }

    function captureError(error) {
      alert("An error has occurred: Code = " + error.code);
    }

  });

  $("#cancelPoint").click(function(event) {
    clearCurrentPoint();
    console.log(tour);
  });

  $("#savePoint").click(function(event) {
    currentPoint.name = $('#pointName').val();
    // add an interp_item. For now, each interest_point will have only one interpretive item [0].
    // later, we can use interp_item as a container for groups of media_items
    currentPoint.interp_items = currentPoint.interp_items || [];
    currentPoint.interp_items[0].media_items_attributes = currentPoint.interp_items[0].media_items_attributes || [];
    if ($('#pointText').val()) {
      var myTextMediaItem = {
        type: "text",
        data: $('#pointText').val()
      };
      console.log("textmediaitem");
      console.log(myTextMediaItem);
      currentPoint.interp_items[0].media_items_attributes.push(myTextMediaItem);
    }
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
    for (var i = 0; i < tour.interest_points.length; i++) {
      //for each point
      var myPoint = tour.interest_points[i];
    }

    // submitMediaItems calls submitTour on completion
    submitMediaItems(tour);
    console.log(tour);
    return;

    function submitTour(tour) {
      console.log("submitTour");
      var callData = {
        type: "post",
        path: "/tours.json",
      };
      callData.data = reformatTourForSubmission(tour);
      makeAPICall(callData, function() {
        alert("Tour saved!");
        window.location.reload(false);
      });
    };

    function submitMediaItems(tour) {
      console.log("submitMediaItems");
      // is there a better way to avoid undefined issues?
      var mediaItemsSubmissions = new Array();
      console.log(mediaItemsSubmissions.length);
      if (tour.interest_points) {
        for (var i = 0; i < tour.interest_points.length; i++) {
          var myPoint = tour.interest_points[i];
          if (myPoint.interp_items) {
            for (var j = 0; j < myPoint.interp_items.length; j++) {
              var myInterpItem = myPoint.interp_items[j];
              var mediaSubmitParams = [];
              if (myInterpItem.media_items_attributes) {
                for (var k = 0; k < myInterpItem.media_items_attributes.length; k++) {
                  var myMediaItem = myInterpItem.media_items_attributes[k];
                  console.log("myMediaItem: ");
                  console.log(myMediaItem);
                  var uploadFunc = function(type) {
                    if (type.indexOf("image") == 0) {
                      return uploadPhoto;
                    } else if (type.indexOf("text") == 0) {
                      return writeAndUploadText;
                    } else if (type.indexOf("audio") == 0) {
                      return uploadAudio;
                    }
                  }(myMediaItem.type);
                  var myCallback = function(myMediaItem) {
                    return function(response) {
                      myMediaItem = addMediaItemIDToTour(response, myMediaItem);
                      console.log("in upload.callback");
                    };
                  }(myMediaItem);
                  mediaSubmitParams.push({
                    data: myMediaItem.data,
                    mediaUploadFunc: uploadFunc,
                    callback: myCallback
                  });
                }
              }
            }
          }
        }
      }

      // now we have an array of {mediaUploadFunc, data} items.
      // execute each mediaUploadFunc with data -- in series --
      // to get the saved id for each media item
      // then use the series completion callback to trigger saving the tour object
      if (mediaSubmitParams) {
        var funcArray = [];
        console.log("mediaSubmitParams.length" + mediaSubmitParams.length);
        for (var i = 0; i < mediaSubmitParams.length; i++) {
          var curMediaItem = mediaSubmitParams[i];
          var myMediaUploadArrayItem = function(curMediaItem) {
            return function(callback) {
              console.log("curMediaItem.mediaUploadFunc");
              console.log(curMediaItem.mediaUploadFunc);
              curMediaItem.mediaUploadFunc(curMediaItem.data, function(response) {
                console.log("seriesItemCallback");
                console.log(curMediaItem.mediaUploadFunc);
                curMediaItem.callback(response);
                callback(null, "two");
              });
            }
          }(curMediaItem);
          funcArray.push(myMediaUploadArrayItem);
        }
        async.series(funcArray, asyncCallback);
      }
    }

    function asyncCallback() {
      console.log("asyncCallback");
      submitTour(tour);
    }

    function addMediaItemIDToTour(response, mediaItem) {
      var myResponse = JSON.parse(response);
      mediaItem.id = myResponse.id;
      console.log("mediaItem: ");
      console.log(mediaItem);
      return mediaItem;
    }

    function reformatTourForSubmission(tour) {
      console.log("reformatTourForSubmission");
      // reformatting for Rails. It likes nested resource names to end with _attributes.
      for (var i = 0; i < tour.interest_points.length; i++) {
        var myPoint = tour.interest_points[i];
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
      console.log("end reformatTourForSubmission");
      return tour;
    }

  });

  $('#cancelTour').click(function(event) {
    if (confirm("Cancel Tour Recording?")) {
      window.location.reload(false);
    }
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