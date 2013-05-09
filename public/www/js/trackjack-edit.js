"use strict";

function onDeviceReadyEdit() {
  console.log("onDeviceReadyEdit");
  $("#location").text(window.isphone ? "Phone" : "Not Phone");
  var currentEditingTour = {};
  var currentEditPointIndex = 0;
  var mediaFiles = {};
  
  var METERS_TO_MILES = 0.000621371192;

  setTimeout(function() {
    navigator.splashscreen.hide();
  }, 2000);

  $("#editTrackListPage").on('pagebeforeshow', getTourList);
  $("#editTrackLoadingPage").on('pagebeforeshow', loadMediaItems);
  $("#editTrackInfoPage1").on('pagebeforeshow', populateTrackInfoPage1);
  $("#editTrackInputPage2").on('pagebeforeshow', populateTrackInfoPage2);
  $("#editTrackPOIListPage").on('pagebeforeshow', populatePointList);
  $("#editTrackPOIInfoPage1").on('pagebeforeshow', populatePointInfoPage1);
  $("#editTrackInfoDelete").click(deleteTrack);
  $("#editTrackInfoUploadImageLibrary").click(saveCoverImageFromLibrary);
  $("#editTrackInfoUploadImageCamera").click(saveCoverImageFromCamera);
  $("#editTrackPOIUploadImageLibrary").click(savePointImageFromLibrary);
  $("#editTrackPOIUploadImageCamera").click(savePointImageFromCamera);
  $("#editTrackPOISubmit").click(uploadNewPointData);
  $("#editTrackRecordAudio").click(recordPointAudio);
  $("#editTrackInfoSave").click(uploadTourMetadata);

  function deleteTrack(event) {
    event.preventDefault();
    console.log("deleteTrack");
    alert("Deleting tracks isn't supported yet.");
  }

  //dupe of trackjack-view.js. should package these.

  function getTourList() {
    //stopGeolocation();
    console.log("getTourList");
    $(".viewTrackListDiv").hide();
    $("#editTrackListLoading").show();
    currentEditPointIndex = 0;

    var callData = {
      type: "GET",
      path: "/tours.json"
    };
    makeAPICall(callData, showTourList);
  }

  function showTourList(response) {
    console.log("showTourList");
    $("#editTrackListLoading").hide();
    var $tourTemplate = $("#editTrackListItemTemplate").clone(false);
    $("#editTrackList").children().remove('li');
    for (var i = 0; i < response.length; i++) {
      var $tourListEntry = $tourTemplate.clone(false);
      var $viewTrackTitle = $tourListEntry.find(".viewTrackTitle").text(response[i].name);
      var $viewTrackDifficulty = $tourListEntry.find(".viewTrackDifficulty").text(response[i].difficulty);
      var $viewTrackDistance = $tourListEntry.find(".viewTrackDistance");
      $viewTrackDistance.text(((response[i].tour_length) * METERS_TO_MILES).toFixed(2));
      $tourListEntry.find(".viewTrackChapters").text(response[i].chapters.length + " chapters");
      if (response[i].fullitem != "/cover_images/original/missing.png") {
        $tourListEntry.find(".editTrackListImage").attr("src", response[i].fullitem);
      }

      $tourListEntry.jqmData("tourid", response[i].id);
      //console.log($tourListEntry);
      $("#editTrackList").append($tourListEntry);
    }
    // class for tours in selectable list.
    // tour id should be in 'data-tourid' attribute
    $(".viewTrackListItem").click(function(event) {
      var tourid = $(this).jqmData('tourid');
      moveToTourInfo(tourid);
    });
    $tourTemplate.remove();
    $('.viewTrackListDiv').show();
    $('#editTrackList').listview('refresh');
  }

  function moveToTourInfo(tourid) {
    console.log("moveToTourInfo");
    var callData = {
      type: "GET",
      path: "/tours/" + tourid + ".json"
    };
    makeAPICall(callData, function(response) {
      currentEditingTour = response;
      logpp(response);
      $.mobile.changePage($("#editTrackLoadingPage"), {
        transition: "slide"
      });
    });
  }

  function loadMediaItems() {
    console.log("loadMediaItems");
    // load all of the media items, then continue
    // make an array of download functions, then call async.parallel on it
    var mediaTaskArray = [];

    // TODO: this won't work if any interp_point has no media items.
    $.each(currentEditingTour.interest_points, function(index, interest_point) {
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

    async.parallel(mediaTaskArray, downloadDone);
  }

  function downloadDone() {
    console.log("downloadDone");
    $.mobile.changePage($("#editTrackPOIListPage"));
  }

  // Metadata editing

  function populateTrackInfoPage1() {
    $("#editTrackName").val(currentEditingTour.name);
    $("#editTrackDescription").val(currentEditingTour.description);
    $("#editTrackDifficulty").val(currentEditingTour.difficulty);
    //TODO: $("#editTrackSubject").val(currentEditingTour)
  }

  function populateTrackInfoPage2() {
    //TODO: code to display cover_image
    if (currentEditingTour.fullitem.indexOf("missing.png") == -1) {
      $("#editTrackInfoImage").attr("src", currentEditingTour.fullitem);
    }
  }

  // image saving

  function saveCoverImageFromLibrary() {
    acquireImage(navigator.camera.PictureSourceType.PHOTOLIBRARY, coverImageSuccess, imageError);
  }

  function saveCoverImageFromCamera() {
    acquireImage(navigator.camera.PictureSourceType.CAMERA, coverImageSuccess, imageError);
  }

  function savePointImageFromLibrary() {
    acquireImage(navigator.camera.PictureSourceType.PHOTOLIBRARY, pointImageSuccess, imageError);
  }

  function savePointImageFromCamera() {
    acquireImage(navigator.camera.PictureSourceType.CAMERA, pointImageSuccess, imageError);
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

  function coverImageSuccess(photoURL) {
    console.log("photo success");
    currentEditingTour.fullitem = photoURL;
    console.log($("#editTrackInfoImage").attr("src"));
    $.mobile.changePage($("#editTrackInputPage2"));
  }

  function pointImageSuccess(photoURL) {
    console.log("photo success");
    $("#editTrackPOIImage").attr("src", photoURL);
    $.mobile.changePage($("#editTrackPOIInfoPage1"));
  }

  function imageError(error) {
    console.log(error);
  }

  //////////////////

  function uploadTourMetadata(event) {
    console.log("uploadTourMetadata");
    var tourMetadata = {};
    tourMetadata.name = $("#editTrackName").val();
    tourMetadata.difficulty = $("#editTrackDifficulty").val();
    tourMetadata.description = $("#editTrackDescription").val();
    tourMetadata.id = currentEditingTour.id;
    if ($("#editTrackInfoImage").attr("src").indexOf("http") != 0) {
      uploadMetadataCoverImage($("#editTrackInfoImage").attr("src"), uploadTourMetadata);
    } else {
      uploadTourMetadata();
    }
    return;

    function uploadMetadataCoverImage(imageURI, doneCallback) {
      uploadMedia({
        mediaURL: imageURI,
        objectName: "tour",
        mediaFieldName: "cover_image",
        objectID: tourMetadata.id,
        mimeType: "image/jpeg",
        doneCallback: doneCallback
      });
    }

    function uploadTourMetadata() {
      console.log("uploadTourMetadata");
      var callData = {
        type: 'put',
        path: "/tours/" + tourMetadata.id + ".json"
      };
      callData.data = tourMetadata;
      logpp(callData);
      makeAPICall(callData, function() {
        alert("Tour metadata saved");
        $.mobile.changePage($("#editTrackPOIListPage"), {
          transition: "slide"
        });
      })
    }
  }

  // Point Editing

  function reloadTourForPointList() {
    moveToTourInfo(currentEditingTour.id);
  }

  function populatePointList() {
    console.log("populatePointList");

    var $pointTemplate = $("#editTrackPOIListItemTemplate").clone(false);
    $("#editTrackPOIList").children().remove('li:not(#editTrackPOIListItemTemplate)');

    for (var i = 0; i < currentEditingTour.interest_points.length; i++) {
      var myPoint = currentEditingTour.interest_points[i];

      var $pointListEntry = $pointTemplate.clone(false);
      $pointListEntry.removeAttr("id");
      $pointListEntry.data("pointIndex", i);
      $pointListEntry.find(".editTrackPOIListItemTitle").text(myPoint.name);
      //TODO: get filler image if none is available
      // $pointListEntry.find(".editTrackPOIListItemImage").attr("src", "");
      $.each(myPoint.interp_items, function(index, interp_item) {
        $.each(interp_item.media_items, function(index, media_item) {
          var mimeType = media_item.item_content_type;
          var filename = media_item.item_file_name;
          console.log(mediaFiles[filename].fullPath);
          var $pointImage = $pointListEntry.find(".editTrackPOIListItemImage");
          if (mimeType.indexOf("image") == 0) {
            $pointImage.attr("src", mediaFiles[filename].fullPath);
          }
        });
      });
      $("#editTrackPOIList").append($pointListEntry);
      $pointListEntry.show();
    }
    $(".editTrackPOIListItem").click(function() {
      var pointIndex = $(this).data("pointIndex");
      currentEditPointIndex = pointIndex;
      $.mobile.changePage("#editTrackPOIInfoPage1")
    });
    $("#editTrackPOIListItemTemplate").hide();
    $("#editTrackPOIList").listview('refresh');
  }

  // note that this also populates the audio item on the 
  // second page, even though it's not visible yet.

  // this repopulates the page with appropriate media items on every refresh.


  function populatePointInfoPage1() {
    console.log("populatePointInfoPage1");
    $("#editTrackPOIDescription").val("");
    $("#editTrackPOIImage").removeAttr("src");
    $("#editTrackPOIName").val("");
    $("#editTrackAudioPlayerContainer").hide();
    var currentPoint = currentEditingTour.interest_points[currentEditPointIndex];
    $("#editTrackPOIName").val(currentPoint.name);
    $.each(currentPoint.interp_items, function(index, interp_item) {
      $.each(interp_item.media_items, function(index, media_item) {
        var mimeType = media_item.item_content_type;
        var filename = media_item.item_file_name;

        if (mimeType.indexOf("text") == 0) {
          getTextItem(filename, function(textContents) {
            currentPoint.textMediaItemID = media_item.id;
            $("#editTrackPOIDescription").val(textContents);
          });
        } else if (mimeType.indexOf("audio") == 0) {
          currentPoint.audioMediaItemID = media_item.id;
          $("#editTrackAudioPlayer").attr("src", mediaFiles[filename].fullPath);
          $("#editTrackAudioPlayerContainer").show();
          $("audio").audioPlayer();
        } else if (mimeType.indexOf("image") == 0) {
          currentPoint.imageMediaItemID = media_item.id;
          $("#editTrackPOIImage").attr('src', mediaFiles[filename].fullPath);
        }
      });
    })
  }

  function playAudio() {
    console.log("playAudio");
    var myAudio;
    if (myAudio == null && $("#editTrackAudioPointPlay").data("src")) {
      console.log("playAudio2");
      myAudio = new Media($("#editTrackAudioPointPlay").data("src"),
      audioSuccess, audioError, audioStatus);
    }
    myAudio.play({
      numberOfLoops: 1
    });
  }

  function recordPointAudio(event) {
    navigator.device.capture.captureAudio(audioCaptureSuccess, audioCaptureError, {
      limit: 1
    });

    function audioCaptureSuccess(audioFiles) {
      console.log("captureSuccess");
      $("#editTrackAudioPlayer").attr("src", audioFiles[0].fullPath);
      $("#editTrackAudioPlayerContainer").show();
      $("audio").audioPlayer();
    }

    function audioCaptureError(error) {
      alert("An error has occurred (recordAudio): Code = " + error.code);
    }
  }

  function uploadNewPointData(event) {
    console.log("uploadNewPointData");
    var pointData = {};
    var myCurrentPoint = currentEditingTour.interest_points[currentEditPointIndex];
    var myInterpItemID = myCurrentPoint.interp_items[0].id;
    pointData.name = $("#editTrackPOIName").val();
    pointData.id = myCurrentPoint.id;
    pointData.description = $("#editTrackPOIDescription").val();
    pointData.imageMediaItemID = myCurrentPoint.imageMediaItemID;
    pointData.audioMediaItemID = myCurrentPoint.audioMediaItemID;
    pointData.textMediaItemID = myCurrentPoint.textMediaItemID;
    uploadPointImage($("#editTrackPOIImage").attr("src"), function() {
      uploadPointAudio($("#editTrackAudioPointPlay").data("src"), function() {
        uploadPointText($("#editTrackPOIDescription").val(), function() {
          uploadPointMetadata(function() {
            alert("Point metadata saved");
            $("#editTrackPOIName").val('');
            $("#editTrackPOIDescription").val('');
            $("#editTrackPOIImage").removeAttr("src");
            $("#editTrackAudioPointPlay").removeData("src");
            moveToTourInfo(currentEditingTour.id);
          });
        });
      });
    });
    return;

    function uploadPointImage(imageURI, doneCallback) {
      console.log("uploadPointImage");
      if (imageURI) {
        uploadMedia({
          mediaURL: imageURI,
          objectName: "media_item",
          mediaFieldName: "item",
          objectID: pointData.imageMediaItemID,
          mimeType: "image/jpeg",
          doneCallback: function(r) {
            logpp(r);
            if (r.response) { // replacing an existing attachment returns an empty response
              var response = JSON.parse(r.response);
              logpp(response);
              logpp(response.id);
              pointData.imageMediaItemID = response.id;
            }
            doneCallback();
          }
        });
      } else {
        doneCallback();
      }
    }

    function uploadPointAudio(audioURI, doneCallback) {
      console.log("uploadPointAudio");
      if (audioURI) {
        uploadMedia({
          mediaURL: audioURI,
          objectName: "media_item",
          mediaFieldName: "item",
          objectID: pointData.audioMediaItemID,
          mimeType: "audio/wav",
          doneCallback: function(r) {
            logpp(r);
            if (r.response) {
              var response = JSON.parse(r.response);
              logpp(response);
              logpp(response.id)
              if (!pointData.audioMediaItemID) {
                console.log("looking for new text item ID");
                pointData.audioMediaItemID = response.id;
              }
            }
            doneCallback();
          }
        });
      } else {
        doneCallback();
      }
    }

    function uploadPointText(textContents, doneCallback) {
      console.log("uploadPointText");
      logpp(textContents);
      logpp(pointData.textMediaItemID);
      // nore acrobatics required here because the text isn't in a file yet
      if (textContents) {
        writeTextToFile(textContents, function(textURL) {
          console.log("textURL");
          logpp(textURL);
          uploadMedia({
            mediaURL: textURL,
            objectName: "media_item",
            mediaFieldName: "item",
            objectID: pointData.textMediaItemID,
            mimeType: "text/plain",
            doneCallback: function(r) {
              logpp(r);
              if (r.response) {
                logpp(pointData);
                if (!pointData.textMediaItemID) {
                  var response = JSON.parse(r.response);
                  console.log("looking for new text item ID");
                  pointData.textMediaItemID = response.id;
                }
              }
              doneCallback();
            }
          });
        });
      } else {
        doneCallback();
      }
    }

    function uploadPointMetadata(doneCallback) {
      console.log("uploadPointMetadata");

      console.log("myInterpItemID");
      logpp(myInterpItemID);
      console.log("pointData");
      logpp(pointData);
      var callData = {
        type: 'put',
        path: "/interest_points/" + pointData.id + ".json",
        data: {
          name: pointData.name,
          interp_items_attributes: [{
            id: myInterpItemID
          }]
        }
      };
      var pointMediaItems = [];
      console.log("callData");
      logpp(callData);
      makeAPICall(callData, function() {
        fixMediaItems(doneCallback);
      });
    }

    function fixMediaItems(doneCallback) {
      console.log("fixMediaItems");
      fixTextItem(function() {
        fixImageItem(function() {
          fixAudioItem(function() {
            doneCallback();
          });
        });
      });
    }

    function fixTextItem(doneCallback) {
      console.log("fixTextItem");
      if (pointData.textMediaItemID) {
        var callData = {
          type: 'put',
          path: "/media_items/" + pointData.textMediaItemID + ".json",
          data: {
            interp_item_id: myInterpItemID
          }
        }
        logpp(callData);
        makeAPICall(callData, doneCallback);
      } else {
        doneCallback();
      }
    }

    function fixImageItem(doneCallback) {
      console.log("fixImageItem");
      if (pointData.imageMediaItemID) {
        var callData = {
          type: 'put',
          path: "/media_items/" + pointData.imageMediaItemID + ".json",
          data: {
            interp_item_id: myInterpItemID
          }
        }
        logpp(callData);
        makeAPICall(callData, doneCallback);
      } else {
        doneCallback();
      }
    }

    function fixAudioItem(doneCallback) {
      console.log("fixAudioItem");
      if (pointData.audioMediaItemID) {
        var callData = {
          type: 'put',
          path: "/media_items/" + pointData.audioMediaItemID + ".json",
          data: {
            interp_item_id: myInterpItemID
          }
        }
        logpp(callData);
        makeAPICall(callData, doneCallback);
      } else {
        doneCallback();
      }
    }
  }

  function writeTextToFile(text, uploadCallback) {
    text = text.substr(0, 1500);
    console.log("uploadText");
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
      console.log("writer.filename: ");
      console.log(writer.fileName)
      writer.onwriteend = function(evt) {
        console.log("evt");
        logpp(evt);
        uploadCallback(writer.fileName);
      };
      writer.write(text);
    }

    function fail(error) {
      alert("An error has occurred: (writeAndUploadText) Code = " + error.code);
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
    console.log("downloadMediaItem");
    console.log(itemURL);
    console.log(itemType);
    window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, gotFS, fail);

    function gotFS(filesystem) {
      filesystem.root.getDirectory("tour" + currentEditingTour.id, {
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


  function uploadMedia(params) {
    // { mimetype, objectName, mediaFieldName, objectID, mediaURL, doneCallback }
    // supply ID for update to an existing item
    // make sure the server will accept POST for updates
    // because that's all Phonegap's FileTransfer can do 
    console.log("uploadMedia");
    var ftOptions = new FileUploadOptions();
    ftOptions.mimeType = params.mimeType;
    ftOptions.fileKey = params.objectName + "[" + params.mediaFieldName + "]";
    ftOptions.fileName = params.mediaURL.substr(params.mediaURL.lastIndexOf('/') + 1);

    var ftParams = new Object();
    params[params.objectName + "[name]"] = "Placeholder Name";
    ftOptions.params = ftParams;
    //ftOptions.chunkedmode = false;

    var ft = new FileTransfer();
    var ftURL;
    if (params.objectID) {
      ftURL = host + "/" + params.objectName + "s/" + params.objectID + ".json";
    } else {
      ftURL = host + "/" + params.objectName + "s.json";
    }
    console.log(params.mediaURL);
    console.log(ftURL);
    console.log(ftOptions);
    ft.upload(params.mediaURL, ftURL, uploadWin, uploadFail, ftOptions);

    return;

    function uploadWin(r) {
      console.log("Code = " + r.responseCode);
      params.doneCallback(r);
    }

    function uploadFail(error) {
      alert("An error has occurred (uploadMedia:): Code = " + error.code + "(" + params.mediaURL + ")");
      if (confirm("uploadMedia Failed. Try again?")) {
        uploadMedia(params);
      } else {
        // silent fail!
      }
    }
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
    document.addEventListener("deviceready", onDeviceReadyEdit, false);
  } else {
    onDeviceReadyEdit();
  }
});