"use strict";

$(function() {
  var host = "http://localhost:3000";

  $("#getTours").click(function(event) {
    event.preventDefault();
    var callData = { type: "GET", path: "/tours" };
    makeAPICall(callData);
  });

  $("#getTour").click(function(event) {
    event.preventDefault();
    var callData = { type: "GET", path: "/tours/1" };
    makeAPICall(callData);
  });

  $("#postTour").click(function(event) {
    event.preventDefault();
    var callData = { type: "POST", path: "/tours"};
    callData.data = { 
                  tour: { 
                    interest_points_attributes:
                      [
                          {location:"POINT (-122.4137007 37.7756913)"}
                      ],
                    path: "LINESTRING(-122.4136841 37.7756653, -122.4136841 37.7756653, -122.4137007 37.7756913)",
                    pathpoints: ["-122.4136841 37.7756653","-122.4136841 37.7756653","-122.4137007 37.7756913"],
                    name:"testName"
                  }
              };
    makeAPICall(callData);
  });

  $("#getPoints").click(function(event) {
    event.preventDefault();
    var callData = {type: "GET", path: "/interest_points"};
    makeAPICall(callData);
  });

  $("#getPoint").click(function(event) {
    event.preventDefault();
    var callData = {type: "GET", path: "/interest_points/1" };
    makeAPICall(callData);
  });

  $("#postPoint").click(function(event) {
    event.preventDefault();
    var callData = {type: "POST", path: "/interest_points" };
    callData.data =   {
                        interest_point: {
                          location: "POINT (-122.41369089999999 37.7756713)"
                        }
                      };
    makeAPICall(callData);
  });

  $("#getInterpItems").click(function(event) {
    event.preventDefault();
    var callData = { type: "GET", path: "/interp_items" };
    makeAPICall(callData);
  });

  $("#getInterpItem").click(function(event) {
    event.preventDefault();
    var callData = { type: "GET", path: "/interp_items/1" };
    makeAPICall(callData);
  });

  $("#postInterpItem").click(function(event) {
    event.preventDefault();
    var callData = { type: "POST", path: "/interp_items"};
    callData.data = {
                      interp_item: {
                        name: "Test Interp Item"
                      }
                    };
    makeAPICall(callData);
  });

  $("#getMediaItems").click(function(event) {
    event.preventDefault();
    var callData = { type: "get", path: "/media_items"};
    makeAPICall(callData);
  });

  $("#getMediaItem").click(function(event) {
    event.preventDefault();
    var callData = { type: "get", path: "/media_items/1"};
    makeAPICall(callData);  
  });

  $("#postMediaItem").click(function(event) {
    event.preventDefault();
    var callData = { type: "post", path: "/media_items/"};
    callData.data = { 
                      name: "Test Media Item",
                      mimetype: "audio/mpeg"
                    };
    makeAPICall(callData);
  });

  $("#postFullMediaItem").click(function(event) {
    var media_item = { media_item: 
                          { 
                            name: "Test full item",
                            item: "This is a test item"
                          }
                     }

  });

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
});