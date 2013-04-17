"use strict";



function onDeviceReady() {
  $("#location").text(window.isphone ? "Phone" : "Not Phone");
  // change this to your server's IP
  var host = "http://trackserver-test.herokuapp.com";

  var minAccuracy = 10; // meters to trigger a point

  var currentTour = {};

  var mediaItems = {};
  $("#tourIntroDisplay").hide();
  $("#tourLoadDisplay").hide();
  $("#tourActionDisplay").hide();
  getTourList();

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
    $(".tourListItem").click(function(event) {
      var tourid = $(this).data('tourid');
      getTourInfo(tourid);
    });
  }

  function showTourInfo(response) {
    currentTour = response;
    $("#tourList").hide();
    $("#tourInfoName").text(currentTour.name);
    $("#tourInfoPath").text(currentTour.path);
    $("#tourInfoRaw").text(JSON.stringify(currentTour));
    $("#startTour").click(startTour);
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
    $.each(currentTour.interest_points, function(index, interest_point) {
      $.each(interest_point.interp_items, function(index, interp_items) {
        $.each(interp_items.media_items, function(index, media_item) {
          var callData = {
            type: "GET",
            path: "/media_items/" + media_item.id + ".json"
          };
          makeAPICall(callData, downloadMediaItem);
        });
      });
    });
  }

  function downloadMediaItem(itemInfo) {
    var itemURL = itemInfo.fullitem;
    console.log(itemURL);
    console.log(itemInfo);
    window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, gotFS, fail);

    function gotFS(filesystem) {
      console.log("gotFS");
      filesystem.root.getDirectory("tour" + currentTour.id, {
        create: true,
        exclusive: false
      }, gotDir, fail);
    }

    function gotDir(directory) {
      console.log("gotDir");
      directory.getFile(itemInfo.item_file_name, { create: true, exclusive: false }, gotFile, fail);
    }

    function gotFile(fileEntry) {
      console.log("gotFile");
      console.log(fileEntry.fullPath);
      var fileTransfer = new FileTransfer();
      fileTransfer.download(itemURL, fileEntry.fullPath, downloadSuccess, fail);
    }

    function downloadSuccess(fileEntry) {
      console.log("downloadSuccess");
      console.log(fullPath);
    }

    function fail(error) {
      console.log(error);
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