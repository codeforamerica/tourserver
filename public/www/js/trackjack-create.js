/* global: host*/

// track creation code for TrackJack mobile app

function onDeviceReadyCreate() {
  "use strict";
  console.log("onDeviceReady-create");
  $("#location").text(window.isphone ? "Phone" : "Not Phone");

  var MIN_CREATE_POINT_ACCURACY = 66; // GPS accuracy at this distance or smaller required to create a point
  var ERROR_SUBMISSION_ADDRESS = "danavery@codeforamerica.org";
  var AJAX_RETRY_TIMEOUT = 20000;
  var AJAX_RETRY_ATTEMPTS = 2;

  var tour = {
    interest_points: []
  };
  var currentPoint = {};
  var geoWatchID = null;
  var latestPosition;

  if (!window.isphone) {
    $(".desktop").show();
  } else {
    $(".phone").show();
  }

  // DOM elements used for data at the moment:
  // (in this jQuery Mobile app, everything is actually on one page)

  //  Track attributes, kept for entire creation process:
  // #createTrackName - Name of track being created
  // #createTrackRating - Difficulty of track
  // #createTrackDescription - Description of track
  // #createTrackImage - Cover image for track 

  //  Point attributes, reset for each new point
  // #createTrackAudioPlayer - "src" jQuery .data attribute used to store current point audio URL
  // #createTrackPOIName - Name of current point being created
  // #createTrackPOIDescription - Description of current point
  // #createTrackPOIImage - Image for current point

  $('#createTrackSavingPage').on('pageshow', uploadTour);
  $('#createTrackUploadPage').on('pagebeforeshow', stopGeolocation);
  $('#createTrackStartRecording').click(startRecording);
  $("#createTrackAddPoint").click(startNewPoint);
  $("#createTrackUploadImageCamera").click(saveCoverImageFromCamera);
  $("#createTrackUploadImageLibrary").click(saveCoverImageFromAlbum);
  $("#createTrackPOIUploadImageLibrary").click(savePointImageFromAlbum);
  $("#createTrackPOIUploadImageCamera").click(savePointImageFromCamera);
  $("#createTrackRecordAudio").click(recordAudio);
  $("#cancelPoint").click(cancelNewPoint);
  $("#createTrackPOISubmit").click(saveNewPoint);
  $("#createTrackReportError").click(hideErrorReportButton);
  $("#createTrackCancelTrackSubmit").click(deleteCurrentTour);

  function startRecording(event) {
    if ($("#createTrackName").val()) {
      tour.name = $("#createTrackName").val();
      tour.difficulty = $("#createTrackRating").val();
      tour.description = $("#createTrackDescription").val();
      // TODO: tour.subject = $("#createTrackSubject").val();
      // start tracking the path
      startGeolocation();
    } else {
      alert("Please enter a name for this track.");
      $.mobile.changePage($("#createTrackInputPage1"));
      return false;
    }
  }

  // add point

  function deleteCurrentTour() {
    if (tour.id) {
      callData = {
        type: "delete",
        path: "/tours/" + tour.id + ".json"
      };
    }
    makeAPICall(callData, function() {

    });
  }

  function startNewPoint(event) {
    console.log("createTrackAddPoint");
    clearCurrentPoint();
    //click on the interest_point create button,
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, {
      enableHighAccuracy: true,
      timeout: 2000
    });

    function geoError(error) {
      console.log("error:");
      console.log(error);
      alert("Trouble getting your position. Wait a few seconds and try again.");
    }

    function geoSuccess(position) {
      latestPosition = position;
      if (position.coords.accuracy <= MIN_CREATE_POINT_ACCURACY) {
        createInterestPoint(position);
      } else {
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
  }


  // take photo 

  function saveCoverImageFromCamera() {
    acquireImage(navigator.camera.PictureSourceType.CAMERA, coverImageSuccess, cameraError);
  }

  function saveCoverImageFromAlbum() {
    acquireImage(navigator.camera.PictureSourceType.PHOTOLIBRARY, coverImageSuccess, cameraError);
  }

  function savePointImageFromAlbum() {
    acquireImage(navigator.camera.PictureSourceType.PHOTOLIBRARY, pointImageSuccess, cameraError);
  }

  function savePointImageFromCamera() {
    acquireImage(navigator.camera.PictureSourceType.CAMERA, pointImageSuccess, cameraError);
  }

  function coverImageSuccess(photoURL) {
    $("#createTrackImage").attr("src", photoURL);
    tour.cover_image_url = photoURL;
    $.mobile.changePage($("#createTrackInputPage2"));
  }

  function pointImageSuccess(photoURL) {
    $("#createTrackPOIImage").attr("src", photoURL);
    var media_item = {};
    currentPoint.interp_items[0].media_items_attributes = currentPoint.interp_items[0].media_items_attributes || [];
    currentPoint.interp_items[0].media_items_attributes.push({
      type: "image",
      data: photoURL
    });
    console.log("media_items_attributes.length" + currentPoint.interp_items[0].media_items_attributes.length);
    console.log(photoURL);
    $.mobile.changePage($("#createTrackPOIPage1"));
  }

  function cameraError(error) {
    console.log(error);
  }

  function acquireImage(sourceType, cameraSuccess, cameraError) {
    navigator.camera.getPicture(cameraSuccess, cameraError, {
      quality: 40,
      targetWidth: 640,
      allowEdit: true,
      destinationType: navigator.camera.DestinationType.FILE_URI,
      sourceType: sourceType
    });
  }

  function uploadPhoto(imageURI, uploadCallback) {
    uploadMedia(imageURI, uploadCallback, "image/jpeg");
  }

  function uploadAudio(audioURI, uploadCallback) {
    uploadMedia(audioURI, uploadCallback, "audio/wav");
  }

  /// Text upload ///
  // write text to a file to get a file URL to pass to uploadMedia
  // because we're treating text items as media items to allow for several

  function writeAndUploadText(text, uploadCallback) {
    text = text.substr(0, 1500);
    // so very wrong. and yet:
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
      writer.onwriteend = function(evt) {
        uploadMedia(writer.fileName, uploadCallback, "text/plain");
      };
      writer.write(text);
    }

    function fail(error) {
      alert("An error has occurred: (writeAndUploadText) Code = " + error.code);
    }
  }

  /// the next two functions (uploadMedia/uploadCoverImage) should maybe be consolidated

  function uploadMedia(mediaURI, uploadCallback, mimeType) {
    var options = new FileUploadOptions();
    options.mimeType = mimeType;
    options.fileKey = "media_item[item]";
    options.fileName = mediaURI.substr(mediaURI.lastIndexOf('/') + 1);

    var params = new Object();
    params["media_item[name]"] = "Placeholder Name";
    options.params = params;
    //options.chunkedmode = false;

    var ft = new FileTransfer();
    ft.upload(mediaURI, host + "/media_items.json", uploadWin, uploadFail, options);

    return;

    function uploadWin(r) {
      console.log("Code = " + r.responseCode);
      uploadCallback(r.response);
    }

    function uploadFail(error) {
      alert("An error has occurred (uploadMedia:): Code = " + error.code + "(" + mediaURI + ")");
      if (confirm("uploadMedia Failed. Try again?")) {
        uploadMedia(mediaURI, uploadCallback, mimeType);
      } else {
        // silent fail!
      }
    }
  }

  // this is actually where the tour record is created,
  // because I haven't been able to come up with a clever way 
  // to post a JSON tour record and a Paperclip attachment
  // at the same time. We create the tour record when uploading
  // the cover_photo, then update it later with the tour info

  function uploadCoverImage(mediaURI, uploadCallback, mimeType) {
    console.log("uploadCoverImage");
    console.log("mediaURI");
    var options = new FileUploadOptions();
    options.mimeType = mimeType;
    options.fileKey = "tour[cover_image]";
    options.fileName = mediaURI.substr(mediaURI.lastIndexOf('/') + 1);

    var params = new Object();
    params["tour[cover_image]"] = "Cover Image";
    options.params = params;
    //options.chunkedmode = false;

    var ft = new FileTransfer();
    ft.upload(mediaURI, host + "/tours.json", uploadWin, uploadFail, options);

    return;

    function uploadWin(r) {
      console.log("Code = " + r.responseCode);
      uploadCallback(r.response);
    }

    function uploadFail(error) {
      alert("An error has occurred (uploadMedia:): Code = " + error.code + "(" + mediaURI + ")");
      if (confirm("uploadMedia Failed. Try again?")) {
        uploadMedia(mediaURI, uploadCallback, mimeType);
      } else {
        // silent fail!
      }
    }
  }

  function recordAudio() {
    navigator.device.capture.captureAudio(captureSuccess, captureError);

    function captureSuccess(mediaFiles) {
      for (var i = 0; i < mediaFiles.length; i++) {
        currentPoint.interp_items[0].media_items_attributes = currentPoint.interp_items[0].media_items_attributes || [];
        var myAudioMediaItem = {
          type: "audio",
          data: mediaFiles[i].fullPath
        };
        console.log("myAudioMediaItem");
        logpp(myAudioMediaItem);
        console.log(mediaFiles[i].fullPath);
        $("#createTrackAudioPlayer").attr("src", mediaFiles[i].fullPath);
        $("#createTrackAudioPlayerContainer").show();
        if ($("#createTrackAudioPlayerContainer .audioplayer").length === 0) {
          $("#createTrackAudioPlayer").audioPlayer();
        }
        currentPoint.interp_items[0].media_items_attributes.push(myAudioMediaItem);
      }
    }

    function captureError(error) {
      alert("An error has occurred (recordAudio): Code = " + error.code);
    }
  }

  //Cancel the current point input

  function cancelNewPoint() {
    clearCurrentPoint();
    logpp(tour);
  }

  // save the current point

  function saveNewPoint() {
    currentPoint.name = $('#createTrackPOIName').val();
    // add an interp_item. For now, each interest_point will have only one interpretive item [0].
    // later, we can use interp_item as a container for groups of media_items
    currentPoint.interp_items = currentPoint.interp_items || [];
    currentPoint.interp_items[0].media_items_attributes = currentPoint.interp_items[0].media_items_attributes || [];
    if ($('#createTrackPOIDescription').val()) {
      var myTextMediaItem = {
        type: "text",
        data: $('#createTrackPOIDescription').val()
      };
      console.log("textmediaitem");
      logpp(myTextMediaItem);
      currentPoint.interp_items[0].media_items_attributes.push(myTextMediaItem);
    }
    tour.interest_points.push(currentPoint);
    clearCurrentPoint();
  }

  function clearCurrentPoint() {
    $('#createTrackPOIName').val('');
    $('#createTrackPOIDescription').val('');
    $('#createTrackPOIImage').attr("src", "");
    $('#createTrackAudioPlayer').removeAttr("src");
    $('#createTrackAudioPlayerContainer').hide();
    currentPoint = {};
  }

  // save tour button
  // for now, this isn't actually going to create the tour, but update one
  // already created, because we need to upload the cover_image first.
  // that's when we create the tour

  function uploadTour(event) {

    console.log("uploadTour");

    // submitMediaItems calls submitTour on completion
    submitMediaItems(tour);
    logpp(tour);
    return;

    function submitTour(tour) {
      console.log("submitTour");

      var callData;
      // there's no pre-exisitng tour record if there's been no cover image upload
      if (tour.id) {
        callData = {
          type: "put",
          path: "/tours/" + tour.id + ".json"
        };
      } else {
        callData = {
          type: "post",
          path: "/tours.json"
        };
      }
      callData.data = reformatTourForSubmission(tour);
      makeAPICall(callData, function() {
        alert("Tour saved!");
        $.mobile.changePage($("#createFinishPage"), {
          transition: "slide"
        });
      });
    }

    function submitMediaItems(tour) {
      console.log("submitMediaItems");
      // is there a better way to avoid undefined issues? 
      var mediaSubmitParams = [];
      if (tour.interest_points) {
        for (var i = 0; i < tour.interest_points.length; i++) {
          var myPoint = tour.interest_points[i];
          if (myPoint.interp_items) {
            for (var j = 0; j < myPoint.interp_items.length; j++) {
              var myInterpItem = myPoint.interp_items[j];

              if (myInterpItem.media_items_attributes) {
                for (var k = 0; k < myInterpItem.media_items_attributes.length; k++) {
                  var myMediaItem = myInterpItem.media_items_attributes[k];

                  var uploadFunc = function(type) {
                    if (type.indexOf("image") === 0) {
                      return uploadPhoto;
                    } else if (type.indexOf("text") === 0) {
                      return writeAndUploadText;
                    } else if (type.indexOf("audio") === 0) {
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
        console.log("mediaSubmitParams.length " + mediaSubmitParams.length);
        for (var i = 0; i < mediaSubmitParams.length; i++) {
          var curMediaItem = mediaSubmitParams[i];
          var myMediaUploadArrayItem = function(curMediaItem) {
            return function(callback) {
              curMediaItem.mediaUploadFunc(curMediaItem.data, function(response) {
                console.log("seriesItemCallback");
                $("#saveTrackProgress").append(" .");
                curMediaItem.callback(response);
                callback(null, "two");
              });
            };
          }(curMediaItem);
          funcArray.push(myMediaUploadArrayItem);
        }
        if ($("#createTrackImage").attr("src")) {
          funcArray.push(function(callback) {
            uploadCoverImage($("#createTrackImage").attr("src"), function(response) {
              console.log("finalSeriesCallback");
              addTourIDToTour(response);
              callback(null, "three");
            }, "image/jpeg");
          });
        }
        async.series(funcArray, asyncCallback);
      }
    }

    function asyncCallback(err, results) {
      console.log("asyncCallback");
      $("#saveTrackProgress").html("");
      submitTour(tour);
    }

    function addTourIDToTour(response) {
      console.log("addTourIDToTour");
      response = JSON.parse(response);
      logpp(response);
      tour.id = response.id;
      console.log(tour.id);
    }

    function addMediaItemIDToTour(response, mediaItem) {
      var myResponse = JSON.parse(response);
      mediaItem.id = myResponse.id;
      console.log("mediaItem: ");
      logpp(mediaItem);
      return mediaItem;
    }

    function reformatTourForSubmission(tour) {
      console.log("reformatTourForSubmission");
      var formattedTour = $.extend(true, {}, tour);
      // reformatting for Rails. It likes nested resource names to end with _attributes.
      for (var i = 0; i < formattedTour.interest_points.length; i++) {
        var myPoint = formattedTour.interest_points[i];
        if (myPoint.interp_items) {
          for (var j = 0; j < myPoint.interp_items.length; j++) {
            var myInterpItem = myPoint.interp_items[j];
            if (myInterpItem.media_items_attributes) {
              for (var k = 0; k < myInterpItem.media_items_attributes.length; k++) {
                var myMediaItem = myInterpItem.media_items_attributes[k];
                delete myMediaItem.data;
                delete myMediaItem.type;
              }
            } else {
              delete myInterpItem.media_items_attributes;
            }
          }
        }
        myPoint.interp_items_attributes = myPoint.interp_items;
        delete myPoint.interp_items;
      }
      if (formattedTour.interest_points) {
        formattedTour.interest_points_attributes = formattedTour.interest_points;
        delete formattedTour.interest_points;
      }

      if (formattedTour.cover_image_url) {

      }
      // make the heartbeat WKT path
      formattedTour.path = "LINESTRING" + "(" + tour.pathpoints.join(", ") + ")";
      console.log("end reformatTourForSubmission");
      return formattedTour;
    }

  }

  // Stop recording tour, but keep it in memory for later upload
  // Not sure this works as expected.
  $('#stopTour').click(function(event) {
    console.log("stopTour");
    if (confirm("Stop Recording?")) {
      $("#createPOI").attr('disabled', false);
      $("div#pointInputArea :input").attr('disabled', true);
      stopGeolocation();
    }
  });

  function startGeolocation() {
    geoWatchID = navigator.geolocation.watchPosition(geoSuccess, geoError, {
      enableHighAccuracy: true
    });
  }

  function stopGeolocation() {
    navigator.geolocation.clearWatch(geoWatchID);
    geoWatchID = null;
  }

  function geoSuccess(position) {
    if (tour.interest_points) {
      $("span#pointsSavedCount").text(tour.interest_points.length);
    }

    latestPosition = position;
    // $('#activeLocation').text("Now: " + position.coords.longitude.toFixed(5) + " " + position.coords.latitude.toFixed(5) + " " + position.coords.accuracy + "m");
    if ((position.coords.accuracy) < MIN_CREATE_POINT_ACCURACY) {
      // need to have accuracy at this distance or smaller to create a point   var newPathLocation = position.coords.longitude + " " + position.coords.latitude;
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

  function makeAPICall(callData, doneCallback) {
    console.log("makeAPICall");
    $("#createTrackReportErrorDiv").hide();
    var url = host + callData.path;
    var request = $.ajax({
      type: callData.type,
      url: url,
      timeout: AJAX_RETRY_TIMEOUT,
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      //beforeSend: function(xhr) {
      //  xhr.setRequestHeader("Accept", "application/json")
      //},
      data: JSON.stringify(callData.data)
    }).retry({
      times: AJAX_RETRY_ATTEMPTS,
      timeout: AJAX_RETRY_TIMEOUT
    }).fail(function(jqXHR, textStatus, errorThrown) {
      alert("We're having trouble submitting your tour. You may be able to try again in a few minutes. Click the button to send us an error report!");
      // add email of "this" here
      setErrorButtonMailto(this, jqXHR);
    }).done(function(response, textStatus, jqXHR) {
      console.log("done");
      if (typeof doneCallback === 'function') {
        doneCallback.call(this, response);
      }
    });
  }

  function setErrorButtonMailto(ajaxObject, jqXHR) {
    var errorMailto = "mailto:" + ERROR_SUBMISSION_ADDRESS + "?subject=TrackJack Tour Submission Error&";
    var emailIntro = "If you have a moment, let us know what happened here. Thanks!\n\n\n------------------------------------------\n";
    errorMailto += "body=" + encodeURIComponent(emailIntro) + encodeURIComponent(JSON.stringify(ajaxObject));
    errorMailto += "----" + encodeURIComponent(JSON.stringify(jqXHR));
    $("#createTrackReportError").attr("href", errorMailto);
    $("#createTrackReportErrorDiv").show();
  }

  function hideErrorReportButton() {
    $("#createTrackReportErrorDiv").hide();
  }

}



function logpp(js) {
  console.log(JSON.stringify(js, null, "  "));
}

$(document).ready(function() {
  // are we running in native app or in browser?
  window.isphone = false;
  if (document.URL.indexOf("http://") == -1) {
    window.isphone = true;
  }

  if (window.isphone) {
    document.addEventListener("deviceready", onDeviceReadyCreate, false);
  } else {
    onDeviceReadyCreate();
  }
});