"use strict";

function onDeviceReadyEdit() {
  console.log("onDeviceReadyEdit");
  $("#location").text(window.isphone ? "Phone" : "Not Phone");
  // change this to your server's IP
  // var host = "http://127.0.0.1:3000";
  var host = "http://trackserver-test.herokuapp.com";
  var tour = {};
  var currentPoint = {};
  var currentViewPointIndex = 0;
  var mediaFiles = {};
  var currentViewingTour;

  $("#editTrackListPage").on('pagebeforeshow', getTourList);
  $("#editTrackLoadingPage").on('pagebeforeshow', loadMediaItems);
  $("#editTrackInfoPage1").on('pagebeforeshow', populateTrackInfoPage1);
  $("#editTrackInfoPage2").on('pagebeforeshow', populateTrackInfoPage2);
  $("#editTrackPOIListPage").on('pagebeforeshow', populatePointList);
  $("#editTrackPOIInfoPage1").on('pagebeforeshow', populatePointInfoPage1);
  $("#editTrackInfoDelete").click(deleteTrack);
  $("#editTrackInfoUploadImageLibrary").click(saveTrackImageFromLibrary);
  $("#editTrackInfoUploadImageCamera").click(saveTrackImageFromCamera);
  $("#editTrackPOIUploadImageLibrary").click(savePointImageFromLibrary);
  $("#editTrackPOIUploadImageCamera").click(savePointImageFromCamera);
  $("#editTrackRecordAudio").click(recordPointAudio);

  function deleteTrack(event) {
    event.preventDefault();
    console.log("deleteTrack");
    alert("Deleting tracks isn't supported yet.");
  }

  //dupe of trackjack-view.js. should package these.


  function getTourList() {
    console.log("getTourList");
    $(".viewTrackListDiv").hide();
    $("#editTrackListLoading").show();
    currentViewPointIndex = 0;

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
    // console.log($tourTemplate);
    for (var i = 0; i < response.length; i++) {
      var $tourListEntry = $tourTemplate.clone(false);
      var $viewTrackTitle = $tourListEntry.find(".viewTrackTitle");
      $viewTrackTitle.text(response[i].name);
      var $viewTrackDifficulty = $tourListEntry.find(".viewTrackDifficulty");
      $viewTrackDifficulty.text(response[i].difficulty);
      var $viewTrackDistance = $tourListEntry.find(".viewTrackDistance");
      $viewTrackDistance.text(((response[i].tour_length) * 0.000621371192).toFixed(2));
      $tourListEntry.find(".viewTrackChapters").text(response[i].chapters.length + " chapters");

      //TODO: figure out why jqmdata doesn't work
      $tourListEntry.data("tourid", response[i].id);
      //console.log($tourListEntry);
      $("#editTrackList").append($tourListEntry);
    }
    // class for tours in selectable list.
    // tour id should be in 'data-tourid' attribute
    $(".viewTrackListItem").click(function(event) {
      var tourid = $(this).data('tourid');
      moveToTourInfo(tourid);
    });
    $tourTemplate.remove();

    $('#editTrackList').listview('refresh');
    $('.viewTrackListDiv').show();

  }

  function moveToTourInfo(tourid) {
    console.log("moveToTourInfo");
    var callData = {
      type: "GET",
      path: "/tours/" + tourid + ".json"
    };
    makeAPICall(callData, function(response) {
      currentViewingTour = response;
      $.mobile.changePage($("#editTrackLoadingPage"), {
        transition: "slide"
      });
    });
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

    async.parallel(mediaTaskArray, downloadDone);
  }

  function downloadDone() {
    console.log("downloadDone");
    $.mobile.changePage($("#editTrackInfoPage1"));
  }

  function populateTrackInfoPage1() {
    $("#editTrackName").val(currentViewingTour.name);
    $("#editTrackDescription").val(currentViewingTour.description);
    $("#editTrackDifficulty").val(currentViewingTour.difficulty);
    //TODO: $("#editTrackSubject").val(currentViewingTour)
  }

  function populateTrackInfoPage2() {
    //TODO: code to display cover_image

  }

  // this photo code will need to be consolidated with a success callback

  function saveTrackImageFromLibrary() {
    saveTrackImage(navigator.camera.PictureSourceType.PHOTOLIBRARY);
  }

  function saveTrackImageFromCamera() {
    saveTrackImage(navigator.camera.PictureSourceType.CAMERA);
  }

  function saveTrackImage(pictureSource) {

  }

  function savePointImageFromLibrary() {

  }

  function savePointImageFromCamera() {

  }

  function savePointImage(pictureSource) {

  }

  function populatePointList() {
    console.log("populatePointList");
    var $pointTemplate = $("#editTrackPOIListItemTemplate").clone(false);
    $("#editTrackPOIList").children().remove('li:not(#editTrackPOIListItemTemplate)');

    for (var i = 0; i < currentViewingTour.interest_points.length; i++) {
      var myPoint = currentViewingTour.interest_points[i];

      var $pointListEntry = $pointTemplate.clone(false);
      $pointListEntry.removeAttr("id");
      $pointListEntry.data("pointIndex", i);
      $pointListEntry.find(".editTrackPOIListItemTitle").text(myPoint.name);
      //TODO: get filler image if none is available
      $pointListEntry.find(".editTrackPOIListItemImage").attr("src", "");
      $.each(myPoint.interp_items, function(index, interp_item) {
        $.each(interp_item.media_items, function(index, media_item) {
          var mimeType = media_item.item_content_type;
          var filename = media_item.item_file_name;
          console.log(mediaFiles[filename].fullPath);
          if (mimeType.indexOf("image") == 0) {
            $pointListEntry.find(".editTrackPOIListItemImage")
              .attr("src", mediaFiles[filename].fullPath);
          }
        });
      });
      $("#editTrackPOIList").append($pointListEntry);
      $pointListEntry.show();
    }
    $(".editTrackPOIListItem").click(function() {
      var pointIndex = $(this).data("pointIndex");
      currentViewPointIndex = pointIndex;
      $.mobile.changePage("#editTrackPOIInfoPage1")
    });
    $("#editTrackPOIListItemTemplate").hide();
    $("#editTrackPOIList").listview('refresh');
  }

  function populatePointInfoPage1() {
    console.log("populatePointInfoPage1");
    var currentPoint = currentViewingTour.interest_points[currentViewPointIndex];
    $("#editTrackPOIName").val(currentPoint.name);
    $.each(currentPoint.interp_items, function(index, interp_item) {
      $.each(interp_item.media_items, function(index, media_item) {
        var mimeType = media_item.item_content_type;
        var filename = media_item.item_file_name;
        if (mimeType.indexOf("text") == 0) {
          getTextItem(filename, function(textContents) {
            $("#editTrackPOIDescription").html(textContents);
          });
        } else if (mimeType.indexOf("audio") == 0) {
          // $("#viewTrackAudioPointPlay").click(function(event) {
          //   event.preventDefault();
          //   if (myAudio == null) {
          //     myAudio = new Media(mediaFiles[filename].fullPath, audioSuccess, audioError, audioStatus);
          //   }
          //   myAudio.play({
          //     numberOfLoops: 1
          //   });
          // });
        } else if (mimeType.indexOf("image") == 0) {
          $("#editTrackPOIImage").attr('src', mediaFiles[filename].fullPath);
        }
      });
    })
  }

  function recordPointAudio (event) {
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
      alert("An error has occurred (recordAudio): Code = " + error.code);
    }
  };

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